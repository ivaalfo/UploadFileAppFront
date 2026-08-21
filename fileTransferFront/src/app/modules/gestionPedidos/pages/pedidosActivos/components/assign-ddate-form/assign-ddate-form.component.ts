import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChildren, ElementRef, QueryList } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { ModalAction } from '@shared/components/modal/modal-action';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { error } from '@shared/utils/form-utils';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';
import { finalize, map, take } from 'rxjs/operators';
import { UserRoles } from '@data/user-roles';
import { AuthService } from '@core/services/auth/auth.service';
import { PedidoProveedor, PedidoProveedorDto } from '@data/pedidos/pedido-proveedor';
import { TranslateService } from '@ngx-translate/core';
import { SERVER_DATE_FORMAT } from '@core/services/api/api.constants';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import * as moment from 'moment';
import { PedidosActivosComponent } from '../../pages/pedidosActivos/pedidos.activos.component';
import { FileUploadApiClient } from '@core/services/api/fileupload/api-file-upload.service';
import { PedidosActivosApiClient } from '@core/services/api/pedidosActivos/api-pedidos-activos.service';


@Component({
  selector: 'm-assign-ddate-form',
  templateUrl: './assign-ddate-form.component.html',
  styleUrls: ['./assign-ddate-form.component.scss']
})
export class AssignDateFormComponent implements OnInit, OnDestroy {

  @Input()
  public header!: string;

  @Input()
  public opener$!: Subject<ModalAction>;

  @Input()
  public pedidoSelected = new PedidoProveedor();

  @Input()
  public listaPedidos: PedidoProveedor[] | undefined;

  @Output()
  public done = new EventEmitter();

  public editMode = false;
  public isLoading = true;
  public pedido: PedidoProveedor = new PedidoProveedor();
  public modalOpener$ = new Subject<ModalAction>();
  public pedidoForm: FormGroup | undefined;
  public isGrulogMode = false;

  @ViewChildren('fechaEntRealInput', { read: ElementRef })
  public fechaInputs!: QueryList<ElementRef>;
  
  public renderFechas = false;
  public fechaControls: FormControl[] = [];
  public submitted = false;
  private openerSubscription: Subscription | undefined;

  public constructor (
    private readonly authService: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly notification: NotificationService,
    private readonly apiFileUpload: FileUploadApiClient,
    private readonly pActivosComp: PedidosActivosComponent,
    private readonly apiPactivosClient: PedidosActivosApiClient,
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
    this.apiFileUpload.getPedidoProv(this.pedidoSelected.track, this.pedidoSelected.expediente)
    .pipe(
      take(1),
      map(response => { 
        (response.datos) ? 
        this.pedido = PedidoProveedor.parseDto(response.datos as PedidoProveedorDto)
        :
        this.pedido = new PedidoProveedor();
      }),
      finalize(() => {
        if (this.pedido.fechaEntReal) {
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
    if(!this.pedidoForm) return;
    // DEBUG: traza la apertura del modal y los datos entrantes para diagnosticar valores residuales
    console.debug('[AssignDate] initDateForm inicio', { isGrulogMode: !!(this.listaPedidos && this.listaPedidos.length > 0), pedido: this.pedido, listaPedidos: this.listaPedidos });

    // Reinicia el formulario existente para asegurar que no queden controles/valores residuales(stale) de aperturas anteriores del modal
    this.pedidoForm.reset();

    // Determina el modo: fecha única o múltiple (grulog/grupaje)
    this.isGrulogMode = !!(this.listaPedidos && this.listaPedidos.length > 0);

    // Asegura que existe el control de fecha única (el constructor lo crea, pero se hace defensivamente)
    if (!this.pedidoForm.get('fechaEntReal')) {
      this.pedidoForm.addControl('fechaEntReal', new FormControl('', Validators.required));
    }

    // Configura los validadores para el modo de fecha única
    if (!this.isGrulogMode) {
      const dateControl = this.pedidoForm.get('fechaEntReal');
      if (dateControl) {
        console.debug('[AssignDate] modo simple - valor del control antes de asignar', dateControl.value);
        dateControl.setErrors(null);
        if (this.editMode) {
          dateControl.clearValidators();
        } else {
          dateControl.setValidators([Validators.required]);
        }
        dateControl.updateValueAndValidity({ onlySelf: true });
        // Si el pedido ya tiene `fechaEntReal`, llena el control con un objeto `moment` que entiende el datepicker
        if (this.pedido && this.pedido.fechaEntReal) {
          const m = moment(this.pedido.fechaEntReal, SERVER_DATE_FORMAT);
          if (m.isValid()) {
            dateControl.setValue({ startDate: m, endDate: m });
          } else {
            dateControl.setValue(null);
          }
        } else {
          // Asegura que se borra cuando no hay `fechaEntReal`
          dateControl.setValue(null);
        }
        console.debug('[AssignDate] modo simple - control tras asignar', dateControl.value);
        // fuerza la limpieza del DOM del input para evitar estados residuales/stale internos del datepicker
        setTimeout(() => this.clearFechaInputs(), 0);
      }
    }

    // Construye o actualiza los controles para modo multiselección sin eliminar el control único
    if (this.isGrulogMode) {
      // Construye `FormControl` individuales para cada `subPedido` para evitar condiciones de carrera con `FormArray`
      this.fechaControls = [];
        (this.listaPedidos || []).forEach(sp => {
          let initial: any = null;
          if (sp && sp.fechaEntReal) {
            const m = moment(sp.fechaEntReal, SERVER_DATE_FORMAT);
            if (m.isValid()) initial = { startDate: m, endDate: m };
          }
          this.fechaControls.push(new FormControl(initial, Validators.required));
        });
      this.renderFechas = true;

      // Limpia validadores del control único para evitar validaciones accidentales
      const single = this.pedidoForm.get('fechaEntReal');
      if (single) {
        single.clearValidators();
        single.updateValueAndValidity({ onlySelf: true });
        single.setValue(null);
      }
      // Limpia los valores del DOM de los inputs tras la detección de cambios para evitar valores visuales residuales
      setTimeout(() => this.clearFechaInputs(), 0);
    } else {
      // Si se cambia de nuevo a modo único, elimina los controles múltiples si existen
      const arr = this.pedidoForm.get('fechasEntReal') as FormArray;
      if(arr){
        this.pedidoForm.removeControl('fechasEntReal');
        // limpiar inputs al eliminar controles múltiples
        setTimeout(() => this.clearFechaInputs(), 0);
      }
    }
  }

  private clearFechaInputs(): void {
    if (!this.fechaInputs) return;
    this.fechaInputs.forEach(el => {
      try {
        el.nativeElement.value = '';
      } catch (e) {
        // ignore
      }
    });
  }

  public accept(): void {
    this.submitted = true;
    if(!this.pedidoForm) return;

    if (!this.isGrulogMode) {
      const dateControl = this.pedidoForm.get('fechaEntReal');
      if (dateControl && dateControl.valid) {
        const startDate = dateControl.value ? dateControl.value.startDate : this.pedidoForm.value.fechaEntReal && this.pedidoForm.value.fechaEntReal.startDate;
        const fecEntRealStr = startDate ? startDate.format(SERVER_DATE_FORMAT) : '';

        if (fecEntRealStr !== '') {
          //Normalizo los variopintos strings que vienen en F.Carga
          const fechaCargaMoment = this.normalizarFechaCarga(this.pedido.fechaCarga);
          if (fechaCargaMoment.isValid()) {
            //La fechaEntReal no puede ser anterior (menor que <) fechaCarga
            if (startDate.isBefore(fechaCargaMoment, 'day')) {
              const dateControl = this.pedidoForm.get('fechaEntReal');
              if (dateControl) {
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
          if(dateControl) {
            dateControl.setErrors({'required': true});
          }
        }
      }
    } else {
      // Modo grupaje: recoge todas las fechas desde `fechaControls` y valida respecto a cada subPedido.fechaCarga
      const controls = this.fechaControls || [];

      const payload: Array<{track: string, expediente: string, fechaEntReal: string}> = [];

      for (let i = 0; i < controls.length; i++){
        const control = controls[i] as FormControl;
        const val = control ? control.value : null;
        if (!val || !val.startDate) {
          if (control) control.setErrors({'required': true});
          this.notification.error(this.translate.instant('PEDIDOS_ACTIV.FORM.FECREAL.ERROR.REQUIRED_MULTI'), true, true);
          return;
        }
        const startDate = val.startDate;
        const fechaStr = startDate.format(SERVER_DATE_FORMAT);

        const subPedido = (this.listaPedidos || [])[i];
        const fechaCargaMoment = this.normalizarFechaCarga(subPedido ? subPedido.fechaCarga : this.pedido.fechaCarga);
        if (fechaCargaMoment.isValid() && startDate.isBefore(fechaCargaMoment, 'day')) {
          if (control) control.setErrors({'invalidDate': true});
          this.notification.error(this.translate.instant('PEDIDOS_ACTIV.FORM.FECREAL.ERROR.DATE_LIMIT_ERROR'), true, true);
          return;
        }

        payload.push({ track: subPedido ? subPedido.track : this.pedido.track, expediente: subPedido ? subPedido.expediente : this.pedido.expediente, fechaEntReal: fechaStr });
      }

      if (payload.length > 0) {
        this.onPutPedidoFecRealMultiple(payload);
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

  private onPutPedidoFecRealMultiple(payload: Array<{track: string, expediente: string, fechaEntReal: string}>): void {
    this.isLoading = true;
    this.apiPactivosClient.setFecRealMultiple(payload)
    .pipe(take(1))
    .subscribe((response: boolean) => {
      if (response) {
        this.onPutDateActionSuccess();
      } else {
        this.onActionFinalize();
      }
    }, error => {
      console.error(error);
      const errorTitle = this.translate.instant('PEDIDOS_ACTIV.FORM.FECREAL.ERROR.UPDATE_FREAL_MULTI');
      this.onActionFailed(errorTitle);
    });
  }

  private onPutDateActionSuccess() {
    //fechaEntReal actualizada
    this.spinnerService.show();
     if (this.isGrulogMode && this.listaPedidos && this.listaPedidos.length > 0) {
      const successTitle = this.translate.instant("PEDIDOS_ACTIV.FORM.FECREAL.SUCCES.UPDATE_FREAL", {refped: this.listaPedidos[0].grupTR});
      this.notification.success(successTitle, true, true);
    } else if(this.pedido){
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

  public getSinglePlaceholder(): string {
    if (!this.pedidoForm) return this.translate.instant('PEDIDOS_ACTIV.FORM.FECREAL.PH_SELECT');
    const ctrl = this.pedidoForm.get('fechaEntReal');
    if (ctrl && ctrl.value && ctrl.value.startDate && typeof ctrl.value.startDate.format === 'function') {
      return ctrl.value.startDate.format('DD/MM/YYYY');
    }
    if (this.pedido && this.pedido.fechaEntReal) {
      const m = moment(this.pedido.fechaEntReal, SERVER_DATE_FORMAT);
      if (m.isValid()) return m.format('DD/MM/YYYY');
    }
    return this.translate.instant('PEDIDOS_ACTIV.FORM.FECREAL.PH_SELECT');
  }

  public getPlaceholderForIndex(i: number): string {
    if (!this.pedidoForm) return this.translate.instant('PEDIDOS_ACTIV.FORM.FECREAL.PH_SELECT');
    // Preferir los controles locales `fechaControls` si existen
    if (this.fechaControls && this.fechaControls[i] && this.fechaControls[i].value) {
      const val = this.fechaControls[i].value;
      if (val && val.startDate && typeof val.startDate.format === 'function') {
        return val.startDate.format('DD/MM/YYYY');
      }
    }
    if (this.listaPedidos && this.listaPedidos[i] && this.listaPedidos[i].fechaEntReal) {
      const m = moment(this.listaPedidos[i].fechaEntReal, SERVER_DATE_FORMAT);
      if (m.isValid()) return m.format('DD/MM/YYYY');
    }
    return this.translate.instant('PEDIDOS_ACTIV.FORM.FECREAL.PH_SELECT');
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
