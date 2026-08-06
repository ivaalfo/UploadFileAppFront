import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { ModalAction } from '@shared/components/modal/modal-action';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { error } from '@shared/utils/form-utils';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';
import { finalize, map, take } from 'rxjs/operators';
import { PedidoProveedor, PedidoProveedorDto } from '@data/pedidos/pedido-proveedor';
import { TranslateService } from '@ngx-translate/core';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import { LockEntities } from '@data/shared/locks';
import { PedidosActivosApiClient } from '@core/services/api/pedidosActivos/api-pedidos-activos.service';
import { PedidosValidadorApiClient } from '@core/services/api/pedidosValidador/api-pedidos-validador.service';
import { PedidosHistoricoComponent } from '@modules/pedidosHistorico/pages/pedidosHistorico/pedidos.historico.component';


@Component({
  selector: 'm-anota-hist-cmr-form',
  templateUrl: './anota-hist-cmr-form.component.html'
})
export class AnotaHistCMRFormComponent implements OnInit, OnDestroy {

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
  public pedido: PedidoProveedor = new PedidoProveedor();
  public modalOpener$ = new Subject<ModalAction>();
  public pedidoForm: FormGroup | undefined;
  private openerSubscription: Subscription | undefined;
  private submitted = false;


  public constructor (
    private readonly formBuilder: FormBuilder,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly notification: NotificationService,
    private readonly apiValidadorClient: PedidosValidadorApiClient,
    private readonly apiPactivosClient: PedidosActivosApiClient,
    private readonly translate: TranslateService,
    private readonly historicoComp: PedidosHistoricoComponent
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
    });
  }

  public ngOnDestroy(): void {
    if (this.openerSubscription) {
      this.openerSubscription.unsubscribe();
      this.openerSubscription = undefined;
      this.spinnerService.hide();

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
          this.pedido.motivoRechazo = anota;    //Se guardan en F1MOTREC
          this.anotaCMRaction(this.pedido);
        } else {
          const errorTitle = this.translate.instant("PEDIDOS_HIST.FORM.ERROR.CMR_ANOTA_ERROR");
          this.notification.error(errorTitle, true, true);
        }
      }
    }
  }

  public deleteAnota(): void {
    this.submitted = true;
    if (this.pedidoForm) {
      if (this.pedidoForm.valid) {
        if(this.pedido.motivoRechazo!==''){
          this.pedido.motivoRechazo = "null";    //Borrar nota actual
          this.anotaCMRaction(this.pedido);
        } else {
          const errorTitle = this.translate.instant("PEDIDOS_HIST.FORM.ERROR.CMR_DELETE_ERROR");
          this.notification.error(errorTitle, true, true);
        }
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
        this.initAnotaForm(this.pedido);
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
        const errorTitle = this.translate.instant("PEDIDOS_HIST.FORM.ERROR.CMR_ANOTATION_ERROR", {refped: _pedido.track});
        this.notification.error(errorTitle, true, true);
        this.onActionFinalize();
      }
    }, error => {
      console.error(error);
      const errorTitle = this.translate.instant('PEDIDOS_HIST.FORM.ERROR.CMR_ANOTATION_ERROR', {refped: _pedido.track});
      this.onActionFailed(errorTitle);
    });
  }
  
  private onAnotaActionSuccess() {
    this.spinnerService.show();
    if(this.pedido) {
      //pedido actualizado con anotacioens
      const successTitle = this.translate.instant("PEDIDOS_HIST.FORM.SUCCES.PEDIDO_UPDATE", {refped: this.pedidoSelected.track});
      this.notification.success(successTitle, true, true);
    }
    this.onActionFinalize();
  }

  private onActionFinalize() {
    this.isLoading = false;

    if(this.pedidoSelected) {
      const track = this.pedidoSelected.track.toString();
      const exp = this.pedidoSelected.expediente.toString();
      sessionStorage.setItem('reselectPHistoricoTR', track);
      sessionStorage.setItem('reselectPHistoricoEXP', exp);
    }
    
    if(this.directANOT){
      this.modalOpener$.next(ModalAction.Close);
      this.historicoComp.getPedidosValidados();
    } else {
      this.modalOpener$.next(ModalAction.Close);
    }
  }

  private onActionFailed(msg: string) {
    this.notification.error(msg, true, true);
    setTimeout((function() {
      document.location.reload();
    }), 2300);
  }

}
