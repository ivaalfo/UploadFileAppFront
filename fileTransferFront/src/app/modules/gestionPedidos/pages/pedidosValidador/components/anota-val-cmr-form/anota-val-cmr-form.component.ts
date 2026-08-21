import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { ModalAction } from '@shared/components/modal/modal-action';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { error } from '@shared/utils/form-utils';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';
import { finalize, map, take, tap } from 'rxjs/operators';
import { PedidoProveedor, PedidoProveedorDto } from '@data/pedidos/pedido-proveedor';
import { TranslateService } from '@ngx-translate/core';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import { LockEntities } from '@data/shared/locks';
import { ApiClient } from '@core/services/api/api-client.service';
import { ApiLockData } from '@core/services/api/api.response';
import { IdleService } from '@core/services/idle/idle-timeout-service';
import { PedidosValidadorApiClient } from '@core/services/api/pedidosValidador/api-pedidos-validador.service';
import { PedidosValidadorComponent } from '../../pages/pedidosValidador/pedidos.validador.component';
import { FileUploadApiClient } from '@core/services/api/fileupload/api-file-upload.service';


@Component({
  selector: 'm-anota-val-cmr-form',
  templateUrl: './anota-val-cmr-form.component.html'
})
export class AnotaValCMRFormComponent implements OnInit, OnDestroy {

  @Input()
  public header!: string;

  @Input()
  public opener$!: Subject<ModalAction>;

  @Input()
  public pedidoSelected = new PedidoProveedor();

  @Input()
  public directANOT!: boolean;

  @Output()
  public done = new EventEmitter();

  @Output()
  public cancel = new EventEmitter();

  public editMode = false;
  public isLoading = true;
  public modalOpener$ = new Subject<ModalAction>();
  public pedidoForm: FormGroup | undefined;
  private openerSubscription: Subscription | undefined;
  private submitted = false;

  //Para bloqueos
  private timeOut = 0;
  public pedidoLocked = false;
  public type!: string;
  public confirmModalOpener$ = new Subject<ModalAction>();
  public actionToConfirm!: string;
  public unlockTitle!: string;

  public constructor (
    private readonly formBuilder: FormBuilder,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly notification: NotificationService,
    private readonly apiValidadorClient: PedidosValidadorApiClient,
    private readonly apiFileUpload: FileUploadApiClient,
    private readonly validadorComp: PedidosValidadorComponent,
    private readonly translate: TranslateService,
    private readonly apiClient: ApiClient,
    private readonly idleService: IdleService
  ) {
    this.pedidoForm = this.formBuilder.group({
      anotacion: ['', [Validators.required, Validators.maxLength(100), Validators.pattern('[a-zA-Z0-9 çÇñÑáÁéÉíÍóÓúÚ@,(-_!)\&\/]*')]]
    });
  }

  public ngOnInit(): void {
    this.spinnerService.show();
    this.openerSubscription = this.opener$.subscribe(_ => {
      this.submitted = false;
      this.isLoading = false;
      this.modalOpener$.next(ModalAction.Open);
      this.getPedido();

      //Bloqueo el CMR para anotacion por USERNI
      if(this.directANOT){
        this.lockForm(true);
        this.putPedidoLock();
      } else {
        this.continueLock();
      }
    });
  }

  public ngOnDestroy(): void {
    if (this.openerSubscription) {
      this.openerSubscription.unsubscribe();
      this.openerSubscription = undefined;
    }
    this.spinnerService.hide();

    //Si salimos definitivamente y era directo, nos aseguramos de apagar el watch de inactividad
    if (this.directANOT) {
      this.lockForm(false);
      this.deletePedidoLock();
    } else {
      this.lockForm(false);
      this.done.emit();
    }
  }

  public error(field: string): string {
    return error(field, this.pedidoForm, this.submitted);
  }

  public cancelAnota(): void {
    this.spinnerService.show();
    if(this.pedidoForm) {
      this.pedidoForm.reset(); //Borra valores y estados de error (invalidDate, etc.)
      this.submitted = false;  //Resetea el flag de intento de envío
    }
    this.onActionFinalize();
  }

  public acceptAnota(): void {
    this.submitted = true;
    if (this.pedidoForm) {
      if (this.pedidoForm.valid) {
        const anota = this.pedidoForm.value.anotacion ? this.pedidoForm.value.anotacion : '';
        if(anota!==''){
          this.pedidoSelected.motivoRechazo = anota;    //Se guardan en F1MOTREC
          this.anotaCMRaction(this.pedidoSelected);
        } else {
          const errorTitle = this.translate.instant("PEDIDOS_VAL.FORM.ERROR.CMR_ANOTA_ERROR");
          this.notification.error(errorTitle, true, false);
        }
      }
    }
  }

  public deleteAnota(): void {
    this.submitted = true;
    if (this.pedidoForm) {
      if (this.pedidoForm.valid) {
        if(this.pedidoSelected.motivoRechazo!==''){
          this.pedidoSelected.motivoRechazo = "null";    //Borrar nota actual
          this.anotaCMRaction(this.pedidoSelected);
        } else {
          const errorTitle = this.translate.instant("PEDIDOS_VAL.FORM.ERROR.CMR_DELETE_ERROR");
          this.notification.error(errorTitle, true, false);
        }
      }
    }
  }

  private getPedido() {
    this.apiFileUpload.getPedidoProv(this.pedidoSelected.track, this.pedidoSelected.expediente)
    .pipe(
      take(1),
      map(response => { 
        if (response && response.datos){ 
          const pedidoParseado = PedidoProveedor.parseDto(response.datos as PedidoProveedorDto)
          this.pedidoSelected = pedidoParseado;
        } else {
          this.pedidoSelected = new PedidoProveedor();
        }
      }),
      finalize(() => {
        if(this.pedidoSelected.motivoRechazo){
          this.editMode = true;
        } else {
          this.editMode = false;
          this.pedidoSelected.motivoRechazo = '';
        }
        this.initAnotaForm(this.pedidoSelected);
      })
    ).subscribe();
  }

  private initAnotaForm(_pedido: PedidoProveedor) {
    if(this.pedidoForm) {
      this.pedidoForm.reset();
      const anotaControl = this.pedidoForm.get('anotacion');

      if(anotaControl) {
        if(this.editMode) {
          this.pedidoForm.patchValue({
            anotacion: _pedido.motivoRechazo
          });
          anotaControl.clearValidators();
        } else {
          anotaControl.setValidators([
            Validators.required, 
            Validators.maxLength(100), 
            Validators.pattern('[a-zA-Z0-9 çÇñÑáÁéÉíÍóÓúÚ@,(-_!)\&\/]*')]);
        }
        anotaControl.updateValueAndValidity();
      }
    }
  }

  public anotaCMRaction(_pedido: PedidoProveedor): void {
    this.isLoading = true;
    this.apiValidadorClient.anotaCMR(LockEntities.LOCK_VALIDATOR, _pedido.track, _pedido.expediente, _pedido.motivoRechazo)
    .pipe(
      take(1)
    )
    .subscribe((response: boolean) => {
      if (response) {
        this.onAnotaActionSuccess();
      } else {
        const errorTitle = this.translate.instant("PEDIDOS_VAL.FORM.ERROR.CMR_ANOTATION_ERROR", {refped: _pedido.track});
        this.notification.error(errorTitle, true, false);
        this.onActionFinalize();
      }
    }, error => {
      console.error(error);
      const errorTitle = this.translate.instant('PEDIDOS_VAL.FORM.ERROR.CMR_ANOTATION_ERROR', {refped: _pedido.track});
      this.onActionFailed(errorTitle);
    });
  }

  private onAnotaActionSuccess() {
    this.spinnerService.show();
    if(this.pedidoSelected) {
      //Pedido actualizado con anotacioens
      const successTitle = this.translate.instant("FILE_UPLOAD.SUCCES.PEDIDO_UPDATE", {refped: this.pedidoSelected.track});
      this.notification.success(successTitle, true, true);
    }
    this.onActionFinalize();
  }

  private onActionFinalize() {
    this.isLoading = false;
    this.spinnerService.hide();

    if(this.pedidoSelected) {
      const track = this.pedidoSelected.track.toString();
      const exp = this.pedidoSelected.expediente.toString();
      sessionStorage.setItem('reselectTRporValidar', track);
      sessionStorage.setItem('reselectEXPporValidar', exp);
    }

    if(this.directANOT) {
      this.lockForm(false);
      this.deletePedidoLock();
  
      this.modalOpener$.next(ModalAction.Close);
      this.validadorComp.getPedidosPorValidar();

    } else {
      this.continueLock();

      const modalB = document.getElementById('anotaModalB');
      if(modalB != null) {
        modalB.style.display = 'none';
      }
      this.modalOpener$.next(ModalAction.Close);
      if(this.opener$) this.opener$.next(ModalAction.Close);
    }
  }
  
  private onActionFailed(msg: string) {
    this.notification.error(msg, true, false);
    setTimeout((function() {
      document.location.reload();
    }), 2300);
  }

  private lockForm(lock: boolean) {
    if(lock) {
      this.pedidoLocked = true;
      this.pedidoSelected.isBlocked = true;
    } else {
      this.pedidoLocked = false;
      this.pedidoSelected.isBlocked = false;
    }
  }

  private putPedidoLock() {
    this.apiClient.putLock(LockEntities.LOCK_VALIDATOR, ''+this.pedidoSelected.expediente, ''+this.pedidoSelected.track)
    .pipe(take(1),
      tap((resp: ApiLockData) => {
        if (!resp.locked) {
          this.timeOut = resp.timeoutMilliseconds;
          this.checkInactivity(this.timeOut);
        } else {
          //Bloqueado por otro user
          this.pedidoSelected.isBlocked = true;
        }
      }))
    .subscribe(res => {
      if (res.locked) {
        this.lockForm(true);
      }
    });
  }

  private deletePedidoLock() {
    this.apiClient.deleteLock(LockEntities.LOCK_VALIDATOR, ''+this.pedidoSelected.expediente, ''+this.pedidoSelected.track)
    .pipe(take(1))
    .subscribe(() => {
      this.idleService.stopWatching();
    });
  }

  public checkInactivity(time: number) {
    //Comprobar tiempo de expiración establecido para cancelar el bloqueo
    this.idleService.startWatching(time)
    .pipe(take(1))
    .subscribe((expired: boolean) => {
      if (expired) {
        this.deletePedidoLock();
        this.openUnlockByInactivityModal();
      }
    });
    this.idleService.isUserActive$
    .pipe()
    .subscribe((isUserActive: boolean) => {
      if (isUserActive) {
        this.continueLock();
      }
    });
  }

  private openUnlockByInactivityModal() {
    this.type = "CMR";
    this.unlockTitle = this.translate.instant('ACTION.UNLOCK.TITLE', { model: this.type });
    this.actionToConfirm = 'ACTION.UNLOCK.TEXT';
    this.confirmModalOpener$.next(ModalAction.Open);
  }

  private continueLock() {
    this.apiClient.continueLock(LockEntities.LOCK_VALIDATOR, ''+this.pedidoSelected.expediente, ''+this.pedidoSelected.track)
    .pipe(take(1))
    .subscribe();
  }

}
