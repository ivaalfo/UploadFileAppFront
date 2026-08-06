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
import { PedidosValidadorComponent } from '@modules/pedidosValidador/pages/pedidosValidador/pedidos.validador.component';
import { LockEntities } from '@data/shared/locks';
import { ApiClient } from '@core/services/api/api-client.service';
import { ApiLockData } from '@core/services/api/api.response';
import { IdleService } from '@core/services/idle/idle-timeout-service';
import { PedidosActivosApiClient } from '@core/services/api/pedidosActivos/api-pedidos-activos.service';
import { PedidosValidadorApiClient } from '@core/services/api/pedidosValidador/api-pedidos-validador.service';


@Component({
  selector: 'm-reject-fac-form',
  templateUrl: './reject-fac-form.component.html'
})
export class RejectFACFormComponent implements OnInit, OnDestroy {

  @Input()
  public header!: string;

  @Input()
  public opener$!: Subject<ModalAction>;

  @Input()
  public pedidoSelected = new PedidoProveedor();

  @Input()
  public directRJCT!: boolean;

  @Output()
  public done = new EventEmitter();

  @Output()
  public cancel = new EventEmitter();

  public editMode = false;
  public isLoading = true;
  public pedido: PedidoProveedor = new PedidoProveedor();
  public modalOpener$ = new Subject<ModalAction>();
  public pedidoForm: FormGroup | undefined;
  private openerSubscription: Subscription | undefined;
  private submitted = false;

  //Para bloqueos
  private timeOut = 0;
  public pedidoLocked = false;
  private lockDeleted = false;
  public type!: string;
  public confirmModalOpener$ = new Subject<ModalAction>();
  public actionToConfirm!: string;
  public unlockTitle!: string;

  public constructor (
    private readonly formBuilder: FormBuilder,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly notification: NotificationService,
    private readonly apiValidadorClient: PedidosValidadorApiClient,
    private readonly apiPactivosClient: PedidosActivosApiClient,
    private readonly validadorComp: PedidosValidadorComponent,
    private readonly translate: TranslateService,
    private readonly apiClient: ApiClient,
    private readonly idleService: IdleService
  ) {
    this.pedidoForm = this.formBuilder.group({
      motivoRechazoFAC: ['', [Validators.required, Validators.maxLength(100), Validators.pattern('[a-zA-Z0-9 çÇñÑáÁéÉíÍóÓúÚ@,(-_!)\&\/]*')]]
    });
  }

  public ngOnInit(): void {
    this.spinnerService.show();
    this.openerSubscription = this.opener$.subscribe(_ => {
      this.submitted = false;
      this.isLoading = false;
      this.modalOpener$.next(ModalAction.Open);
      this.getPedido();

      //Bloqueo la FAC para rechazo por USERNI
      if(this.directRJCT){
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
      this.spinnerService.hide();

      //Desbloqueo la FAC para rechazo por USERNI
      this.lockForm(false);
      this.done.emit();
    }
  }

  public error(field: string): string {
    return error(field, this.pedidoForm, this.submitted);
  }

  public canceled(unlock?: boolean): void {
    if(unlock) {
      this.lockForm(false);
      this.deletePedidoLock();
    }
    if(this.pedidoSelected) {
      const track = this.pedidoSelected.track.toString();
      const exp = this.pedidoSelected.expediente.toString();
      sessionStorage.setItem('reselectTRporValidar', track);
      sessionStorage.setItem('reselectEXPporValidar', exp);
    }
    if(this.directRJCT){
      this.modalOpener$.next(ModalAction.Close);
      this.validadorComp.getPedidosPorValidar();
    } else {
      this.continueLock();
      this.modalOpener$.next(ModalAction.Close);
      this.cancel.emit();
    }
  }

  public accept(): void {
    this.submitted = true;
    if (this.pedidoForm) {
      if (this.pedidoForm.valid) {
        const motRechazo = this.pedidoForm.value.motivoRechazoFAC ? this.pedidoForm.value.motivoRechazoFAC : '';
        this.pedido.motivoRechazo = motRechazo;
        this.rejectFACaction(this.pedido);
      }
    }
  }

  private getPedido() {
    this.apiPactivosClient.getPedidoProv(this.pedidoSelected.track, this.pedidoSelected.expediente)
    .pipe(
      take(1),
      map(response => { 
        (response.datos) ? 
        this.pedido = PedidoProveedor.parseDto(response.datos as PedidoProveedorDto)
        :
        this.pedido = new PedidoProveedor();
      }),
      finalize(() => {
        if(this.pedido.motivoRechazo){
          this.editMode = true;
        } else {
          this.editMode = false;
          this.pedido.motivoRechazo = '';
        }
        this.initMotiveForm();
      })
    ).subscribe();
  }

  private initMotiveForm() {
    if(this.pedidoForm) {
      this.pedidoForm.reset();
      const rejectControl = this.pedidoForm.get('motivoRechazoFAC');

      if(rejectControl) {
        if(this.editMode) {
          this.pedidoForm.patchValue({});
          rejectControl.clearValidators();
        } else {
          rejectControl.setValidators([
            Validators.required, 
            Validators.maxLength(100), 
            Validators.pattern('[a-zA-Z0-9 çÇñÑáÁéÉíÍóÓúÚ@,(-_!)\&\/]*')]);
        }
        rejectControl.updateValueAndValidity();
      }
    }
  }

  public rejectFACaction(_pedido: PedidoProveedor): void {
    this.isLoading = true;
    this.apiValidadorClient.rejectFAC(LockEntities.LOCK_VALIDATOR, _pedido.track, _pedido.expediente, _pedido.motivoRechazo)
    .pipe(
      take(1)
    )
    .subscribe((response: boolean) => {
      if (response) {
        this.onRejectActionSuccess();
      } else {
        const errorTitle = this.translate.instant("VALIDADOR.FORM.ERROR.FAC_REJECTION_ERROR", {refped: _pedido.track});
        this.notification.error(errorTitle, true, true);
        this.onActionFinalize(true);
      }
    }, error => {
      console.error(error);
      const errorTitle = this.translate.instant('VALIDADOR.FORM.ERROR.FAC_REJECTION_ERROR', {refped: _pedido.track});
      this.onActionFailed(errorTitle);
    });
  }

  private onRejectActionSuccess() {
    this.spinnerService.show();
    if(this.pedido) {
      //fac rechazada
      const rejectedFAC = this.translate.instant("VALIDADOR.FORM.SUCCES.FAC_REJECTED", {refped: this.pedido.track});
      this.notification.warn(rejectedFAC, true, true);
    }
    this.onActionFinalize(true);
  }

  private onActionFinalize(unlock?: boolean) {
    if(unlock) {
      this.lockForm(false);
      this.deletePedidoLock();
    }
    if(this.pedidoSelected) {
      const track = this.pedidoSelected.track.toString();
      const exp = this.pedidoSelected.expediente.toString();
      sessionStorage.setItem('reselectTRporValidar', track);
      sessionStorage.setItem('reselectEXPporValidar', exp);
    }
    const modalPadre = document.getElementById('viewValDocsModal');
    if(modalPadre != null){
      modalPadre.style.display = 'none';
    }
    this.isLoading = false;
    this.modalOpener$.next(ModalAction.Close);
    this.unselectPedido(this.pedidoSelected);
    this.validadorComp.getPedidosPorValidar();
  }

  private unselectPedido(pedido: PedidoProveedor) {
    pedido.isSelected = false; 
    this.pedidoSelected = new PedidoProveedor();
    this.pedidoSelected.isSelected = false;
  }

  private onActionFailed(msg: string) {
    this.notification.error(msg, true, true);
    setTimeout((function() {
      document.location.reload();
    }), 2300);
  }

  private lockForm(lock: boolean) {
    if(lock) {
      this.pedidoLocked = true;
    } else {
      this.pedidoLocked = false;
      this.pedidoSelected.isBlocked = false;
      this.lockDeleted = false;
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
          //bloqueado por otro user
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
    if (!this.pedidoLocked && !this.lockDeleted) {
      this.apiClient.deleteLock(LockEntities.LOCK_VALIDATOR, ''+this.pedidoSelected.expediente, ''+this.pedidoSelected.track)
      .pipe(take(1))
      .subscribe(() => {
        this.idleService.stopWatching();
      });
    }
  }

  public checkInactivity(time: number) {
    //Comprobar tiempo de expiración establecido para cancelar el bloqueo
    this.idleService.startWatching(time)
    .pipe(take(1))
    .subscribe((expired: boolean) => {
      if (expired) {
        this.deletePedidoLock();
        this.lockDeleted = true;
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
    this.type = "FAC";
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
