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
import { PedidosActivosApiClient } from '@core/services/api/pedidosActivos/api-pedidos-activos.service';
import { PedidosActivosComponent } from '@modules/pedidosActivos/pages/pedidosActivos/pedidos.activos.component';
import { LockEntities } from '@data/shared/locks';
import { PedidosValidadorApiClient } from '@core/services/api/pedidosValidador/api-pedidos-validador.service';


@Component({
  selector: 'm-invalidate-order-form',
  templateUrl: './invalidate-order-form.component.html'
})
export class InvalidateOrderFormComponent implements OnInit, OnDestroy {

  @Input()
  public header!: string;

  @Input()
  public opener$!: Subject<ModalAction>;

  @Input()
  public pedidoSelected = new PedidoProveedor();

  @Input()
  public directo!: boolean;

  @Input()
  public action!: string;

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
    private readonly translate: TranslateService,
    private readonly activosComp: PedidosActivosComponent,
    private readonly apiPactivosClient: PedidosActivosApiClient,
    private readonly apiValidadorClient: PedidosValidadorApiClient,
  ) {
    this.pedidoForm = this.formBuilder.group({
      invalidate: ['', [Validators.required, Validators.maxLength(100), Validators.pattern('[a-zA-Z0-9 çÇñÑáÁéÉíÍóÓúÚ@,(-_!)\&\/]*')]]
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

  public cancelInvalidate(): void {
    this.spinnerService.show();
    if(this.pedidoForm) {
      this.pedidoForm.reset(); //Borra valores y estados de error (invalidDate, etc.)
      this.submitted = false;  //Resetea el flag de intento de envío
    }
    this.onActionFinalize();
  }

  public acceptInvalidate(): void {
    this.submitted = true;
    if (this.pedidoForm) {
      if (this.pedidoForm.valid) {
        const anula = this.pedidoForm.value.invalidate ? this.pedidoForm.value.invalidate : '';
        if(anula!==''){
          this.pedido.motivoRechazo = anula;    //Se guardan en F1MOTREC
          this.anulaOrderAction(this.pedido);
        } else {
          const errorTitle = this.translate.instant("PEDIDOS_ACTIV.FORM.ANULAR.ERROR", {refped: this.pedido.track});
          this.notification.error(errorTitle, true, false);
        }
      }
    }
  }

  public deleteInvalidate(): void {
    this.submitted = true;
    if (this.pedidoForm) {
      if (this.pedidoForm.valid) {
        if(this.pedido.motivoRechazo!==''){
          this.pedido.motivoRechazo = "null";    //Borrar nota actual
          this.deleteMotivoAction(this.pedido);
        } else {
          const errorTitle = this.translate.instant("PEDIDOS_ACTIV.FORM.ANULAR.DELETE_ERROR", {refped: this.pedido.track});
          this.notification.error(errorTitle, true, false);
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
        this.initInvalidateForm(this.pedido);
      })
    ).subscribe();
  }

  private initInvalidateForm(_pedido: PedidoProveedor) {
    if(this.pedidoForm) {
      this.pedidoForm.reset();
      const invalidateControl = this.pedidoForm.get('invalidate');

      if(invalidateControl) {
        if(this.editMode) {
          this.pedidoForm.patchValue({
            invalidate: _pedido.motivoRechazo
          });
          invalidateControl.clearValidators();
        } else {
          invalidateControl.setValidators([
            Validators.required, 
            Validators.maxLength(100), 
            Validators.pattern('[a-zA-Z0-9 çÇñÑáÁéÉíÍóÓúÚ@,(-_!)\&\/]*')]);
        }
        invalidateControl.updateValueAndValidity();
      }
    }
  }

  public anulaOrderAction(_pedido: PedidoProveedor): void {
    this.isLoading = true;
    this.apiPactivosClient.setPedidoNulo(_pedido.track, _pedido.expediente, _pedido.motivoRechazo)
    .pipe(take(1))
    .subscribe((response: boolean) => {
      if (response) {
        this.onAnularActionSuccess();
      } else {
        const errorTitle = this.translate.instant("PEDIDOS_ACTIV.FORM.ANULAR.ERROR", {refped: _pedido.track});
        this.notification.error(errorTitle, true, false);
        this.onActionFinalize();
      }
    }, error => {
      console.error(error);
      const errorTitle = this.translate.instant('PEDIDOS_ACTIV.FORM.ANULAR.ERROR', {refped: _pedido.track});
      this.onActionFailed(errorTitle);
    });
  }
  
  private onAnularActionSuccess() {
    this.spinnerService.show();
    if(this.pedido) {
      let successTitle = "";
      if(this.pedidoSelected.isGrupaje){
        successTitle = this.translate.instant("PEDIDOS_ACTIV.FORM.ANULAR.SUCCES_GRUP", {gruptr: this.pedidoSelected.grupTR});
      } else {
        successTitle = this.translate.instant("PEDIDOS_ACTIV.FORM.ANULAR.SUCCES", {refped: this.pedidoSelected.track});
      }
      this.notification.success(successTitle, true, true);
    }
    this.onActionFinalize();
  }

  private onActionFinalize() {
    this.isLoading = false;

    if(this.pedidoSelected) {
      const track = this.pedidoSelected.track.toString();
      const exp = this.pedidoSelected.expediente.toString();
      sessionStorage.setItem('reselectPedidoTrack', track);
      sessionStorage.setItem('reselectPedidoExp', exp);
    }
    
    if(this.directo){      //De momento siempre será true
      this.modalOpener$.next(ModalAction.Close);
      this.activosComp.getPedidos();
    } else {
      this.modalOpener$.next(ModalAction.Close);
    }
  }

  private onActionFailed(msg: string) {
    this.notification.error(msg, true, false);
    setTimeout((function() {
      document.location.reload();
    }), 2300);
  }

  public deleteMotivoAction(_pedido: PedidoProveedor): void {
    this.isLoading = true;
    this.apiValidadorClient.anotaCMR(LockEntities.LOCK_VALIDATOR, _pedido.track, _pedido.expediente, _pedido.motivoRechazo)
    .pipe(take(1))
    .subscribe((response: boolean) => {
      if (response) {
        this.onDeleteMotivoSuccess();
      } else {
        const errorTitle = this.translate.instant("PEDIDOS_ACTIV.FORM.ANULAR.DELETE_ERROR", {refped: _pedido.track});
        this.notification.error(errorTitle, true, false);
        this.onActionFinalize();
      }
    }, error => {
      console.error(error);
      const errorTitle = this.translate.instant('PEDIDOS_ACTIV.FORM.ANULAR.DELETE_ERROR', {refped: _pedido.track});
      this.onActionFailed(errorTitle);
    });
  }

  private onDeleteMotivoSuccess() {
    this.spinnerService.show();
    if(this.pedido) {
      let successTitle = "";
      if(this.pedidoSelected.isGrupaje){
        successTitle = this.translate.instant("PEDIDOS_ACTIV.FORM.ANULAR.DELETE_SUCCES_GRUP", {gruptr: this.pedidoSelected.grupTR});
      } else {
        successTitle = this.translate.instant("PEDIDOS_ACTIV.FORM.ANULAR.DELETE_SUCCES", {refped: this.pedidoSelected.track});
      }
      this.notification.success(successTitle, true, true);
    }
    this.onActionFinalize();
  }

}
