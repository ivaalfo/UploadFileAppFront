import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { ModalAction } from '@shared/components/modal/modal-action';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { error } from '@shared/utils/form-utils';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';
import { finalize, map, take } from 'rxjs/operators';
import { UserRoles } from '@data/user-roles';
import { AuthService } from '@core/services/auth/auth.service';
import { PedidoProveedor, PedidoProveedorDto } from '@data/pedidos/pedido-proveedor';
import { TranslateService } from '@ngx-translate/core';
import { SERVER_DATE_FORMAT } from '@core/services/api/api.constants';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import { PedidosActivosComponent } from '@modules/pedidosActivos/pages/pedidosActivos/pedidos.activos.component';
import { PedidosActivosApiClient } from '@core/services/api/pedidosActivos/api-pedidos-activos.service';
import * as moment from 'moment';


@Component({
  selector: 'm-assign-ddate-form',
  templateUrl: './assign-ddate-form.component.html'
})
export class AssignDateFormComponent implements OnInit, OnDestroy {

  @Input()
  public header!: string;

  @Input()
  public opener$!: Subject<ModalAction>;

  @Input()
  public pedidoSelected = new PedidoProveedor();

  @Output()
  public done = new EventEmitter();

  public editMode = false;
  public isLoading = true;
  public pedido: PedidoProveedor = new PedidoProveedor();
  public modalOpener$ = new Subject<ModalAction>();
  public pedidoForm: FormGroup | undefined;
  private openerSubscription: Subscription | undefined;
  private submitted = false;

  public constructor (
    private readonly authService: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly notification: NotificationService,
    private readonly apiPactivosClient: PedidosActivosApiClient,
    private readonly pActivosComp: PedidosActivosComponent,
    private readonly translate: TranslateService
  ) {
    this.pedidoForm = this.formBuilder.group({
      fechaEntReal: ['', [Validators.required]]
    });
  }

  public ngOnInit(): void {
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
        if(this.pedido.fechaEntReal){
          this.editMode = true;
        } else {
          this.editMode = false;
          this.pedido.fechaEntReal = '';
        }
        this.initDateForm();
      })
    ).subscribe();
  }

  private initDateForm() {
    this.submitted = false;
    if(this.pedidoForm) {
      const dateControl = this.pedidoForm.get('fechaEntReal');
      if(dateControl) {
        dateControl.setErrors(null);
        if(this.editMode) {
          this.pedidoForm.patchValue({});
          dateControl.clearValidators();
        } else {
          dateControl.setValidators([Validators.required]);
        }
      }
    }
  }

  public accept(): void {
    this.submitted = true;
    if(this.pedidoForm && this.pedidoForm.valid) {

      const startDate = this.pedidoForm.value.fechaEntReal.startDate;
      const fecEntRealStr = startDate ? startDate.format(SERVER_DATE_FORMAT) : '';
      
      if(fecEntRealStr !== ''){
        //La fechaEntReal no puede ser anterior (menor que <) fechaCarga
        //const fechaCargaMoment = moment(this.pedido.fechaCarga, SERVER_DATE_FORMAT);
        
        //Intento de normalizar los variopintos strings que vienen en F.Carga
        const fechaCargaMoment = this.normalizarFechaCarga(this.pedido.fechaCarga);

        if(fechaCargaMoment.isValid()) {
          if(startDate.isBefore(fechaCargaMoment, 'day')) {
            const dateControl = this.pedidoForm.get('fechaEntReal');
            if(dateControl) {
              dateControl.setErrors({'invalidDate': true});
            }
            const errorMsg = this.translate.instant('PEDIDOS_ACTIV.FORM.FECREAL.ERROR.DATE_LIMIT_ERROR');
            this.notification.error(errorMsg, true, true);
            return;
          }
        }
        
        this.pedido.fechaEntReal = fecEntRealStr;
        this.onPutPedidoFecReal(this.pedido);

      } else {
        const dateControl = this.pedidoForm.get('fechaEntReal');
        if(dateControl) {
          dateControl.setErrors({'required': true});
        }
      }
    }
  }

  private onPutPedidoFecReal(_pedido: PedidoProveedor): void {
    this.isLoading = true;
    this.apiPactivosClient.setFecReal(_pedido.track, _pedido.expediente, _pedido.fechaEntReal)
    .pipe(
      take(1)
    )
    .subscribe((response: boolean) => {
      if (response) {
        this.onPutDateActionSuccess();
      } else {
        this.onActionFinalize();
      }
    }, error => {
      console.error(error);
      const errorTitle = this.translate.instant('PEDIDOS_ACTIV.FORM.FECREAL.ERROR.UPDATE_FREAL', {refped: _pedido.track});
      this.onActionFailed(errorTitle);
    });
  }

  private onPutDateActionSuccess() {
    this.spinnerService.show();
    if(this.pedido){
      //fechaEntReal actualizada
      const successTitle = this.translate.instant("PEDIDOS_ACTIV.FORM.FECREAL.SUCCES.UPDATE_FREAL", {refped: this.pedido.track});
      this.notification.success(successTitle, true, true);
    }
    this.onActionFinalize();
  }

  public canceled(): void {
    this.spinnerService.show();
    //this.submitted = true;
    if (this.pedidoForm) {
      this.pedidoForm.reset(); //Borra valores y estados de error (invalidDate, etc.)
      this.submitted = false;  //Resetea el flag de intento de envío
    }
    this.onActionFinalize();
  }

  private onActionFinalize() {
    this.isLoading = false;
    //Almacenamos el TR del pedido actual en sessionStorage
    sessionStorage.setItem('reselectPedidoTrack', this.pedidoSelected.track.toString());
    sessionStorage.setItem('reselectPedidoExp', this.pedidoSelected.expediente.toString());
    this.modalOpener$.next(ModalAction.Close);
    if (this.pedidoForm) {
      if (this.pedidoForm.valid) {
        this.pedidoForm.reset();
      }
    }
    this.pActivosComp.getPedidos();
  }

  private onActionFailed(msg: string) {
    this.notification.error(msg, true, false);
  }

  public error(field: string): string {
    return error(field, this.pedidoForm, this.submitted);
  }

  public get isAdminUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Admin ? true : false ;
  }

  private normalizarFechaCarga(fechaRaw: string): moment.Moment {
    if (!fechaRaw) return moment();

    //Cogemos solo los primeros 10 caracteres (dd.mm.yyyy o yyyy-mm-dd)
    //Esto elimina los rangos "08:00 - 15:00" y las horas "10:00"
    let limpia = fechaRaw.substring(0, 10);

    //Si usa puntos (31.03.2026), los cambiamos por guiones para que Moment lo entienda mejor
    limpia = limpia.replace(/\./g, '-');

    //Intentamos crear el objeto Moment. 
    //Le pasamos un array de formatos posibles para que él elija el que encaje
    return moment(limpia, ['DD-MM-YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY']);
  }

}
