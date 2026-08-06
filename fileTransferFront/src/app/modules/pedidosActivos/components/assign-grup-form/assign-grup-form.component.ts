import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { PedidosActivosApiClient } from '@core/services/api/pedidosActivos/api-pedidos-activos.service';
import { AuthService } from '@core/services/auth/auth.service';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';
import { GrupajeItem, PedidoGrupaje } from '@data/pedidos/pedido-grupaje';
import { PedidoProveedor } from '@data/pedidos/pedido-proveedor';
import { UserRoles } from '@data/user-roles';
import { PedidosActivosComponent } from '@modules/pedidosActivos/pages/pedidosActivos/pedidos.activos.component';
import { TranslateService } from '@ngx-translate/core';
import { ModalAction } from '@shared/components/modal/modal-action';
import { TableHeader } from '@shared/components/table/table-header';
import { TableScroll } from '@shared/components/table/table-scroll';
import { sortByProperty } from '@shared/utils/array-utils';
import { error } from '@shared/utils/form-utils';
import { Subject, Subscription } from 'rxjs';
import { finalize, take } from 'rxjs/operators';

@Component({
    selector: 'm-assign-grup-form',
    templateUrl: './assign-grup-form.component.html',
    styleUrls: ['./assign-grup-form.component.scss']
})
export class AssignGrupFormComponent implements OnInit, OnDestroy {
        
    @Input()
    public header!: string;
    
    @Input()
    public opener$!: Subject<ModalAction>;
    
    @Input()
    public grupLista: GrupajeItem[] = [];
    
    @Input()
    public pedidoSelected = new PedidoProveedor();

    @Output()
    public done = new EventEmitter();

    public grupTableHeaders: TableHeader[] = this.getGrupTableHeaders();
    public tableScroller$ = new Subject<TableScroll>();
    public editMode = false;
    public isLoading = true;

    public modalOpener$ = new Subject<ModalAction>();
    public grupForm!: FormGroup;

    private openerSubscription: Subscription | undefined;
    public submitted = false;
    public showForm = false;

    public constructor (
        private readonly authService: AuthService,
        private readonly spinnerService: GlobalSpinnerService,
        private readonly pActivosComp: PedidosActivosComponent,
        private readonly apiPactivosClient: PedidosActivosApiClient,
        private readonly translate: TranslateService,
        private readonly notification: NotificationService,
    ) { }

    public ngOnInit(): void {
        this.openerSubscription = this.opener$.subscribe(_ => {
            //Reset total
            this.showForm = false;
            this.grupLista = [];
            this.grupForm = null as any;
            this.isLoading = true;

            this.spinnerService.show();
            this.modalOpener$.next(ModalAction.Open);
            this.getGrupOptions();
        });
    }

    public ngOnDestroy(): void {
        if (this.openerSubscription) {
            this.openerSubscription.unsubscribe();
        }
    }

    public getGrupTableHeaders() {
        return [
            { title: 'PEDIDOS_ACTIV.FORM.GRUPS.GRUTR' },
            { title: 'PEDIDOS_ACTIV.FORM.GRUPS.EXP' },
            { title: 'PEDIDOS_ACTIV.FORM.GRUPS.RCARGA'},
            { title: 'PEDIDOS_ACTIV.FORM.GRUPS.CMR' },
            { title: 'PEDIDOS_ACTIV.FORM.GRUPS.FAC' }
        ];
    }

    public trackGrupaje(_: number, item: GrupajeItem) {
        return item.grupNum + '-' + item.expediente;
    }

    private getGrupOptions(){
        this.apiPactivosClient.getGrupByTrack(this.pedidoSelected.track)
        .pipe(
            take(1),
            finalize(() => {
                // ---> NUEVA LÓGICA DE ORDENACIÓN ALINEADA CON EL PADRE <---
                //Si el padre tiene guardado un evento de ordenación activo, lo replicamos aquí
                if (this.pActivosComp && this.pActivosComp.lastSortEvent) {
                    const sortEvent = this.pActivosComp.lastSortEvent;
                    
                    //Solo si el usuario ordena explícitamente por columnas comunes en la modal
                    if (sortEvent.column === 'expediente' || sortEvent.column === 'refCarga') {
                        this.grupLista = sortByProperty(this.grupLista, sortEvent.column, sortEvent.directionSort);
                    } else {
                        //Si el padre está ordenado por 'track', 'fechaCarga' o cualquier otra columna externa,
                        //NO ordenamos por texto en la modal. Mantenemos el orden nativo del backend (F_CARGA).
                        
                        //Si el orden del padre es descendente, invertimos el orden cronológico del backend
                        if (sortEvent.directionSort === 'desc') {
                            this.grupLista = [...this.grupLista].reverse();
                        }
                    }
                } else {
                    //Sin ordenación activa en el padre: mantenemos el orden por defecto del back (fechaCarga)
                }
                this.initGrupForm(this.grupLista);
                this.showForm = true;
                this.isLoading = false;
                this.spinnerService.hide();
            })
        )
        .subscribe(
            (grupRecuperado: PedidoGrupaje) => {
                this.grupLista = grupRecuperado.seleccionados || [];
            },
            (_error) => {
                this.isLoading = false;
                this.spinnerService.hide();
                this.modalOpener$.next(ModalAction.Close);
            }
        );
    }
    
    private initGrupForm(listaGrupaje: any[]){
        if (!listaGrupaje) return;

        //const grSelected = this.pedidoSelected.grupTR;
        //console.log(`INIT MODAL: grupTR: ${grSelected} : grupajes:`, listaGrupaje);
        
        this.submitted = false;
        this.grupForm = new FormGroup({});

        //Conjunto para llevar el control de los expedientes ya procesados
        const expedientesProcesados = new Set<string>();
        //Detectamos si es la PRIMERA VEZ (Estados 8 del back): todos los ítems vienen a true en ambas columnas
        const esPrimeraVezAbsoluta = listaGrupaje.every(item => item.opcionCMR === true && item.opcionFAC === true);

        listaGrupaje.forEach((item, i) => {
            //Si el expediente NO ha sido procesado antes, significa que es la primera fila de ese expediente
            const esPrimerPedidoDelExpediente = !expedientesProcesados.has(item.expediente);
            //Registramos el expediente en el Set para que las siguientes filas con este mismo código den 'false'
            if (item.expediente) {
                expedientesProcesados.add(item.expediente);
            }
            
            let valorCheckCMR: boolean;
            let valorCheckFAC: boolean;
            if(esPrimeraVezAbsoluta){
                //ESTADO 8 GENERAL: Aplicamos tu nueva regla (solo primer pedido de cada expediente a true)
                valorCheckCMR = esPrimerPedidoDelExpediente;
                valorCheckFAC = esPrimerPedidoDelExpediente;
            } else {
                //YA HA SIDO MODIFICADO: Respetamos escrupulosamente lo que diga el back/base de datos
                valorCheckCMR = !!item.opcionCMR;
                valorCheckFAC = !!item.opcionFAC;
            }
            
            this.grupForm.addControl(`checkCMR_${i}`, new FormControl(valorCheckCMR));
            this.grupForm.addControl(`checkFAC_${i}`, new FormControl(valorCheckFAC));
        });

        this.grupForm.valueChanges.subscribe(() => {
            if (this.grupForm.hasError('required')) {
                this.grupForm.setErrors(null);
            }
        });
    }

    /*  
        1 a 1: Un checkA y un checkB (en cualquier fila). <- YA NO ES LA CONDICION MAESTRA
        1 a N: Un checkA marcado y uno o varios checkB marcados.
        N a 1: Varios checkA y solo un checkB.
        N a N: Varios checkA y varios checkB.
        0 a 1: NO SE PERMITE
        1 a 0: SI SE PERMITE        <- ESTA ES HORA LA CONDICON MAESTRA
    */
    public accept(): void {
        this.submitted = true;
        //DESCARTE: 
        /*const tieneFilaCompleta = this.grupLista.some((_, i) => {
            const valA = this.grupForm.get(`checkCMR_${i}`)!.value;
            const valB = this.grupForm.get(`checkFAC_${i}`)!.value;
            return valA === true && valB === true;
        });*/

        //Validación: al menos un check en la columna CMR (checkA)
        const tieneAlMenosUnCMR = this.grupLista.some((_, i) => {
            return this.grupForm.get(`checkCMR_${i}`)!.value === true;
        });

        //if(!tieneFilaCompleta) {  //DESCARTE:
        if(!tieneAlMenosUnCMR) {
            this.grupForm.setErrors({ 'required': true });
            return;
        }

        const seleccionados = this.grupLista.map((item, i) => {
            const ctrlA = this.grupForm.get(`checkCMR_${i}`);
            const ctrlB = this.grupForm.get(`checkFAC_${i}`);
            return {
                grupNum: item.grupNum,
                expediente: item.expediente,
                refCarga: item.refCarga,
                opcionCMR: ctrlA!.value, 
                opcionFAC: ctrlB!.value
            };
        });

        //console.log('Enviando al back:', seleccionados);
        this.putGrupajeOptions(seleccionados);
    }

    private putGrupajeOptions(seleccionados: { grupNum: String; refCarga: String; opcionCMR: any; opcionFAC: any; }[]){
        this.isLoading = true;
        this.apiPactivosClient.setGrupaje(this.pedidoSelected.grupTR, seleccionados)
        .pipe(
            take(1)
        )
        .subscribe((response: boolean) => {
            if (response) {
                this.onPutGrupajeActionSuccess();
            } else {
                this.onActionFinalize();
            }
        }, error => {
            console.error(error);
            const errorTitle = this.translate.instant('PEDIDOS_ACTIV.FORM.GRUPS.ERROR.UPDATE_GRUP', {refped: this.pedidoSelected.grupTR});
            this.onActionFailed(errorTitle);
        });
    }

    private onPutGrupajeActionSuccess() {
        this.spinnerService.show();
        if(this.pedidoSelected){
            const successTitle = this.translate.instant("PEDIDOS_ACTIV.FORM.GRUPS.SUCCES.UPDATE_GRUP", {refped: this.pedidoSelected.grupTR});
            this.notification.success(successTitle, true, true);
        }
        this.onActionFinalize();
    }

    public canceled(): void {
        this.spinnerService.show();
        this.submitted = true;
        this.onActionFinalize();
    }

    private onActionFinalize() {
        this.isLoading = false;
        this.showForm = false;

        //Almacenamos el TR del pedido actual en sessionStorage para re-seleccion
        const track = this.pedidoSelected.track.toString();
        const exp = this.pedidoSelected.expediente.toString();
        sessionStorage.setItem('reselectPedidoTrack', track);
        sessionStorage.setItem('reselectPedidoExp', exp);
        
        this.pedidoSelected.isCheckActive = false;
        this.pedidoSelected.isSelected = false;

        this.grupLista = []; 
        this.grupForm = new FormGroup({});
        
        this.modalOpener$.next(ModalAction.Close);
        this.pActivosComp.getPedidos();
    }

    private onActionFailed(msg: string) {
        this.notification.error(msg, true, false);
    }
    
    public error(field: string): string {
        return error(field, this.grupForm, this.submitted);
    }
    
    public get isAdminUser(): boolean {
        const logedRol = this.authService.getRoles();
        return logedRol[0] == UserRoles.Admin ? true : false ;
    }

}