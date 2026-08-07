import { Component, OnInit, ViewChildren, QueryList, ChangeDetectorRef } from '@angular/core';
import { take, tap, finalize, map } from 'rxjs/operators';
import { PedidoProveedor } from '@data/pedidos/pedido-proveedor';
import { Subject } from 'rxjs';
import { TableScroll } from '@shared/components/table/table-scroll';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import { TableHeader } from '@shared/components/table/table-header';
import { Router } from '@angular/router';
import { RowComponent } from '@shared/components/table/row/row.component';
import { TranslateService } from '@ngx-translate/core';
import { sortByProperty } from '@shared/utils/array-utils';
import { FileUploadApiClient } from '@core/services/api/fileupload/api-file-upload.service';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';
import { ModalAction } from '@shared/components/modal/modal-action';
import { AuthService } from '@core/services/auth/auth.service';
import { UserRoles } from '@data/user-roles';
import { LockEntities } from '@data/shared/locks';
import { ExcelService } from '@core/services/excel/excel.service';
import { PedidosActivosApiClient } from '@core/services/api/pedidosActivos/api-pedidos-activos.service';
import * as moment from 'moment';
import { PedidoFiles, PedidoFilesDto } from '@data/pedidos/pedido-files';
import { GrupajeItem } from '@data/pedidos/pedido-grupaje';


@Component({
  selector: 'm-pedidos-activos',
  templateUrl: './pedidos.activos.component.html',
  styleUrls: ['./pedidos.activos.component.scss']
})
export class PedidosActivosComponent implements OnInit {

  @ViewChildren(RowComponent)
  public rows!: QueryList<RowComponent>;

  public tableHeaders: TableHeader[] = this.getTableHeaders();
  public loading = false;
  public tableScroller$ = new Subject<TableScroll>();
  
  public pedidos: PedidoProveedor[] = [];
  public selectedPedido: PedidoProveedor = new PedidoProveedor();
  public selectedPedidoNi: number = 0;
  
  public activeSendButton = false;
  public activeFRealButton = false;

  public fdescModalOpener$ = new Subject<ModalAction>();
  public actionTitle!: string;
  public fecRealRef!: string;

  public noResults2show = false;
  private filtrosActivos: { expediente?: string, provName?: string, trFilterValue?: string, refCharge?: string } = {};
  
  //Definimos la estructura: la clave es el grupTR y el valor es el array de GrupajeItem
  private grupajesAgrupados: { [key: string]: GrupajeItem[] } = {};
  public listaGrupaje: GrupajeItem[] = [];
  public grupsModalOpener$ = new Subject<ModalAction>();
  public isGrupReady = false;
  
  //Guarda la última ordenacion: { column: 'fechaCarga', directionSort: 'desc' }
  public lastSortEvent: any;

  public actionToConfirm!: string;
  public anularModalOpener$ = new Subject<ModalAction>();
  public isGrupNOTAnulable = false;

  public viewDocsModalOpener$ = new Subject<ModalAction>();
  public pedidoFiles = new PedidoFiles();
  public fileURL!: string;

  public constructor (
    private readonly authService: AuthService,
    private readonly apiPactivosClient: PedidosActivosApiClient,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly router: Router,
    private readonly translate: TranslateService,
    private apiFileUpload: FileUploadApiClient,
    private readonly notification: NotificationService,
    private readonly excelService: ExcelService,
    private cdr: ChangeDetectorRef
  ) { }

  public ngOnInit(): void {
    this.activeSendButton = false;
    this.activeFRealButton = false;
    
    const expSaved = sessionStorage.getItem('filteredEXP');
    const userSaved = sessionStorage.getItem('filteredUSER');
    const trackSaved = sessionStorage.getItem('filteredTR');
    const rcharSaved = sessionStorage.getItem('filteredRCARGA');
    this.filtrosActivos = {
      expediente: expSaved || undefined,
      provName: userSaved || undefined,
      trFilterValue: trackSaved || undefined,
      refCharge: rcharSaved || undefined
    };
    this.getPedidos();
  }

  public refresh(): void {
    this.spinnerService.show();
    sessionStorage.removeItem('filteredEXP');
    sessionStorage.removeItem('filteredUSER');
    sessionStorage.removeItem('filteredTR');
    sessionStorage.removeItem('filteredRCARGA');
    setTimeout((function() {
      document.location.reload();
    }), 23);
  }

  public getTableHeaders() {
    return [
      { title: 'PEDIDOS_ACTIV.TABLE.USUPROV', sorted: true, property: 'proveedorUser'},
      { title: 'PEDIDOS_ACTIV.TABLE.TR', sorted: true, property: 'track'},
      { title: 'PEDIDOS_ACTIV.TABLE.EXPEDIENTE', sorted: true, property: 'expediente'},
      { title: 'PEDIDOS_ACTIV.TABLE.F_CARGA', sorted: true, property: 'fechaCarga'},
      { title: 'PEDIDOS_ACTIV.TABLE.REF_CARGA', sorted: true, property: 'refCarga'},
      { title: 'PEDIDOS_ACTIV.TABLE.F_DESCARGA', sorted: true, property: 'fechaDescarga'},
      { title: 'PEDIDOS_ACTIV.TABLE.R_DESCARGA', sorted: true, property: 'refDescarga'},
      { title: 'PEDIDOS_ACTIV.TABLE.ORIGEN', sorted: true, property: 'origen'},
      { title: 'PEDIDOS_ACTIV.TABLE.DESTINO', sorted: true, property: 'destino'},
      { title: 'PEDIDOS_ACTIV.TABLE.PALETS', sorted: true, property: 'numPalets'},
      { title: 'PEDIDOS_ACTIV.TABLE.CAMION', sorted: true, property: 'matriculaCamion'},
      { title: 'PEDIDOS_ACTIV.TABLE.REMOLQUE', sorted: true, property: 'matriculaRemolque'},
      { title: 'PEDIDOS_ACTIV.TABLE.FILES', property: 'estado'},
      { title: 'VALIDADOR.TABLE.ANOTACIONES' }
    ];
  }

  public pActivosTrackById(_: number, item: PedidoProveedor) {
    //return item.track + '-' + item.expediente;
    //No puede ser como en validador/historico
    //Aqui tiene que ir con 'ischeckActive' debido a la ventana de combinaciones/grupajes
    //impidiendo que el navegador detecte el doble clic.
    return item.track + '-' + item.expediente + '-' + item.isCheckActive;
  }

  public onCheckboxChanged(event: Event, pedido: PedidoProveedor): void {
    const checkBox = event.target as HTMLInputElement;
    if (checkBox.checked) {
      this.activeSendButton = false;
      this.activeFRealButton = false;
      this.selectPedido(pedido);
    } else {
      this.unselectPedido(pedido);
    }
  }

  public getPedidos(filtro?: {expediente?: string, provName?: string, trFilterValue?: string, refCharge?: string}) {
    this.loading = true;
    this.spinnerService.show();
    this.selectedPedido = new PedidoProveedor(); 

    //Actualizamos los filtros globales por si se llama desde otro sitio
    if(filtro){
      this.filtrosActivos = { ...this.filtrosActivos, ...filtro};
    }
    let paramsToSend = { ...this.filtrosActivos };

    this.apiPactivosClient.getByFilters(paramsToSend).pipe(
      take(1),
      tap((pedidos: any) => {
        //Limpiamos la referencia global antes de cargar nada nuevo
        this.selectedPedido = new PedidoProveedor();
        
        //Limpiamos todos los flags de los nuevos objetos de forma explícita
        let pedidosMapeados = pedidos.map((p: any) => {
          const instancia = PedidoProveedor.parseDto(p);
          instancia.isSelected = false,
          instancia.isCheckActive = false,
          instancia.isRejected = false
          return instancia;
        });

        //Aplicamos la ordenación del usuario si existe
        if(this.lastSortEvent){
          pedidosMapeados = sortByProperty(
            pedidosMapeados,
            this.lastSortEvent.column,
            this.lastSortEvent.directionSort
          );
        }
        this.pedidos = pedidosMapeados;

        this.tratarGrupajes(this.pedidos);
        //Re-seleccionar y hacer scroll al pedido guardado en sesión
        this.reselectPedidoGuardado();
      }),
      finalize(() => {
        this.loading = false;
        this.spinnerService.hide();

        if(this.pedidos.length === 0){
          this.noResults2show = true;
        } else {
          this.noResults2show = false;
        }
      })
    )
    .subscribe();
  }

  private tratarGrupajes(pedidos: PedidoProveedor[]) {
    //Inicializar vacía
    this.grupajesAgrupados = {};

    pedidos.forEach(pedido => {
      if(pedido.grupaje && pedido.grupTR){
        pedido.isGrupaje = true;              //Sombreado para grupajes
        //Si el grupTR no existe en nuestro objeto, lo inicializamos como array vacío
        if (!this.grupajesAgrupados[pedido.grupTR]) {
          this.grupajesAgrupados[pedido.grupTR] = [];
        }
        //Añadimos el GrupajeItem a ese grupo específico
        this.grupajesAgrupados[pedido.grupTR].push({
          grupNum: pedido.grupNum,
          expediente: pedido.expediente,
          refCarga: pedido.refCarga,
          opcionCMR: false,
          opcionFAC: false
        });
      }
    });
    //console.log("Grupajes organizados:", this.grupajesAgrupados);
  }

  private reselectPedidoGuardado(){
    //RECUPERAR: Buscamos si TR guardado en sessionStorage
    const trGuardado = sessionStorage.getItem('reselectPedidoTrack');
    const expGuardado = sessionStorage.getItem('reselectPedidoExp');

    if(trGuardado && expGuardado) {
      //console.log('Buscando para re-seleccionar:', trGuardado, expGuardado);
      const pedidoNuevo = this.pedidos.find(p => 
        p.track.toString() === trGuardado && p.expediente.toString() === expGuardado
      );

      if(pedidoNuevo) {
        this.selectPedido(pedidoNuevo);
        this.activateSendButton(pedidoNuevo);
        
        //Aseguramos que el usuario vea la fila seleccionada
        setTimeout(() => {
          const elemento = document.getElementById(`fila-${trGuardado}-${expGuardado}`);
          if(elemento){
            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 223);
      }
      //Limpiamos para evitar selecciones accidentales en el futuro
      sessionStorage.removeItem('reselectPedidoTrack');
      sessionStorage.removeItem('reselectPedidoExp');
    }
  }

  public limpiarFiltros(): void {
    //Reseteo el orden para que la tabla no se ordene sola al recargar
    this.lastSortEvent = null;

    this.filtrosActivos = {
      expediente: sessionStorage.getItem('filteredEXP') || undefined,
      provName: sessionStorage.getItem('filteredUSER') || undefined,
      trFilterValue: sessionStorage.getItem('filteredTR') || undefined,
      refCharge: sessionStorage.getItem('filteredRCARGA') || undefined
    };

    this.tableHeaders = [...this.getTableHeaders()];
    this.getPedidos();
  }

  public onColumnSorted(event: any): void {
    this.lastSortEvent = event;   //Guardamos la ordenacion actual
    this.pedidos = sortByProperty(this.pedidos, event.column, event.directionSort);
  }

  public onCMRFileSelected(event: any, pedido: PedidoProveedor) {
    const et = event.target;
    const files = et.files;
    const CMR_MAX_SIZE_MB = 20;
    const CMR_MAX_SIZE_BYTES = CMR_MAX_SIZE_MB * 1024 * 1024;

    //Solo un fich seleccionable
    if(files && files.length > 1) {
      this.onActionFailed("FILE_UPLOAD.ERROR.MULTIPLE_FILE_ERROR"); //NO lo permite el imput type File
      et.value = '';
    } else if(files && files.length === 1){
      const file = files[0];

      //Validación file size
      if(file.size > CMR_MAX_SIZE_BYTES){
        const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.CMR_SIZE_ERROR', { maxSize: CMR_MAX_SIZE_MB });
        this.notification.error(errorTitle, true, true);
        et.value = '';
        return;
      }

			//Comprobamos el tamanio del nombreCMR para que no exceda el pathCMR
			let nombreCMR = "CMR_"+pedido.refCarga+"_"+file.name;
      if(pedido.track.startsWith("GRULOG")){
        const gruTR = pedido.track.replace("GRULOG", "-GRU");
        nombreCMR = "CMR_"+pedido.refCarga+gruTR+"_"+file.name;
      }

			if(nombreCMR.length>149){    //se tiene en cuenta el path (MAX_200char) y posterior ../validados.../rechazados
				const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.CMR_LENGTH_ERROR');
        this.notification.error(errorTitle, true, true);
        et.value = '';
			} else if(this.isNotValidName(nombreCMR) || this.haveNotValidChars(nombreCMR) || this.hasMultipleDots(nombreCMR)){
				const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.CMR_CHARS_ERROR');
        this.notification.error(errorTitle, true, true);
        et.value = '';
			} else if(!file.type || !this.hasValidExtension(file.name) || !et.accept.includes(file.type) ){
        //Controlo los formatos de los archivos seleccionados
        //Ya que (imput type File) SI permite seleccionar formatos distintos a los aceptados y se podrian subir
        const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.CMR_TYPE_ERROR');
        this.notification.error(errorTitle, true, true);
        et.value = '';
      }
    }
    this.activateSendButton(pedido);
  }

  public onFactFileSelected(event: any, pedido: PedidoProveedor) {
    const et = event.target;
    const files = et.files;
    const FAC_MAX_SIZE_MB = 20;
    const FAC_MAX_SIZE_BYTES = FAC_MAX_SIZE_MB * 1024 * 1024;

    //Solo un fich seleccionable
    if(files && files.length > 1) {
      this.onActionFailed("FILE_UPLOAD.ERROR.MULTIPLE_FILE_ERROR"); //NO lo permite el imput type File
      et.value = '';
    } else if(files && files.length === 1){
      const file = files[0];

      //Validación file size
      if(file.size > FAC_MAX_SIZE_BYTES){
        const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.FAC_SIZE_ERROR', { maxSize: FAC_MAX_SIZE_MB });
        this.notification.error(errorTitle, true, true);
        et.value = '';
        return;
      }

      //Comprobamos el tamanio del nombreFAC para que no exceda el pathFAC
			const nombreFAC = "FAC_"+pedido.track+"_"+file.name;

			if(nombreFAC.length>149){    //se tiene en cuenta el path (MAX_200char) y posterior ../rechazadas
				const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.FAC_LENGTH_ERROR');
        this.notification.error(errorTitle, true, true);
        et.value = '';
			} else if(this.isNotValidName(nombreFAC) || this.haveNotValidChars(nombreFAC) || this.hasMultipleDots(nombreFAC)){
				const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.FAC_CHARS_ERROR');
        this.notification.error(errorTitle, true, true);
        et.value = '';
			} else if(!file.type || !this.hasValidExtension(file.name) || !et.accept.includes(file.type) ){
        //Controlo los formatos de los archivos seleccionados
        //Ya que (imput type File) SI permite seleccionar formatos distintos a los aceptados y se podrian subir
        const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.FAC_TYPE_ERROR');
        this.notification.error(errorTitle, true, true);
        et.value = '';
      }
    }
    this.activateSendButton(pedido);
  }

  public onOtherFileSelected(event: any, pedido: PedidoProveedor) {
    const et = event.target;
    const files = et.files;
    const OTR_MAX_SIZE_MB = 20;
    const OTR_MAX_SIZE_BYTES = OTR_MAX_SIZE_MB * 1024 * 1024;

    //Multiples ficheros seleccionables
    if(files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        //Comprobamos el tamanio del nombreOTR para que no exceda el pathFAC
        const nombreOTR = "OTR_"+pedido.track+"_"+files[i].name;

        //Validación file size
        if(files[i].size > OTR_MAX_SIZE_BYTES){
          const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.OTR_SIZE_ERROR', { maxSize: OTR_MAX_SIZE_MB });
          this.notification.error(errorTitle, true, true);
          et.value = '';
          return;
        }

        if(nombreOTR.length>60){    //se tiene en cuenta el path (MAX_1000char) como pueden ser varios 100c/u
          const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.OTR_LENGTH_ERROR');
          this.notification.error(errorTitle, true, true);
          et.value = '';
        } else if(this.isNotValidName(nombreOTR) || this.haveNotValidChars(nombreOTR) || this.hasMultipleDots(nombreOTR)){
          const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.OTR_CHARS_ERROR');
          this.notification.error(errorTitle, true, true);
          et.value = '';
        } else if(!files[i].type || !this.hasValidExtension(files[i].name) || !et.accept.includes(files[i].type) ){
          //Controlo los formatos de los archivos seleccionados
          //Ya que (imput type File) SI permite seleccionar formatos distintos a los aceptados y se podrian subir
          const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.OTR_TYPE_ERROR');
          this.notification.error(errorTitle, true, true);
          et.value = '';
        }
      }
    }
    this.activateSendButton(pedido);
  }

  private isTotalSizeValid(pGrupo: PedidoProveedor[]): boolean {
    const MAX_REQUEST_MB = 60;
    const MAX_REQUEST_BYTES = MAX_REQUEST_MB * 1024 * 1024;
    let totalRequestSize = 0;

    pGrupo.forEach(p => {
      const suffix = p.track + '-' + p.expediente;
      const ids = ['cmr-' + suffix, 'fac-' + suffix, 'otr-' + suffix];

      ids.forEach(id => {
        const input = document.getElementById(id) as HTMLInputElement;
        if(input && input.files) {
          for(let i = 0; i < input.files.length; i++) {
            totalRequestSize += input.files[i].size;
          }
        }
      });
    });

    //Validación de seguridad global
    if(totalRequestSize > MAX_REQUEST_BYTES) {
      const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.TOTAL_SIZE_ERROR', { maxSize: MAX_REQUEST_MB });
      this.notification.error(errorTitle, true, true);
      return false;
    }
    return true;
  }

  public submit(pedidoPulsado: PedidoProveedor): void {
    const pGrupo = this.pedidos.filter(p => p.grupTR === pedidoPulsado.grupTR);

    if(!this.isTotalSizeValid(pGrupo)){
      return;
    }

    pGrupo.forEach(p => {
      //Buscamos los inputs específicos de cada fila del grupo por ID (TR+EXP)
      const suffix = p.track + '-' + p.expediente;
      const inputCMR = document.getElementById('cmr-' + suffix) as HTMLInputElement;
      const inputFAC = document.getElementById('fac-' + suffix) as HTMLInputElement;
      const inputOTR = document.getElementById('otr-' + suffix) as HTMLInputElement;

      const tieneCMR = inputCMR && inputCMR.files && inputCMR.files.length > 0;
      const tieneFAC = inputFAC && inputFAC.files && inputFAC.files.length > 0;
      const tieneOTR = inputOTR && inputOTR.files && inputOTR.files.length > 0;
      const tieneFiles = tieneCMR || tieneFAC || tieneOTR;

      if(tieneFiles){
        const localFormData = new FormData();     //FORM DATA LOCAL (Único para este pedido del bucle)
        
        //Igualamos variables globales a los archivos de esta fila (Array.from para convertir el FileList en File[])
        const filesCMR = tieneCMR ? Array.from(inputCMR.files as FileList) : [];
        const filesFAC = tieneFAC ? Array.from(inputFAC.files as FileList) : [];
        const filesOTR = tieneOTR ? Array.from(inputOTR.files as FileList) : [];

        if(filesCMR.length > 0) {
          localFormData.append("CMR_file", filesCMR[0], filesCMR[0].name);
        }
        if(filesFAC.length > 0) {
          localFormData.append("FAC_file", filesFAC[0], filesFAC[0].name);
        }
        filesOTR.forEach(file => {
          localFormData.append("OTR_files", file, file.name);
        });

        localFormData.append("pedidoTrack", p.track);
        localFormData.append("pedidoExp", p.expediente);
        localFormData.append("refCarga", p.refCarga);

        this.ejecutarEnvio(p, localFormData, filesCMR, filesFAC, filesOTR);
      }
    });
  }

  private ejecutarEnvio(pedido: PedidoProveedor, data: FormData, cmrArray: File[], facArray: File[], otrArray: File[]) {
    this.spinnerService.show();
    
    this.apiFileUpload.fileUpload(LockEntities.LOCK_VALIDATOR, data)
    .pipe(take(1))
    .subscribe((response: boolean) => {
      if (response) {
        this.onActionSuccess(pedido, cmrArray, facArray, otrArray);
      } else {
        //Manejo de errores
        if (cmrArray.length > 0 && pedido.hasCMR == 2) {
          const errorValidateCMR = this.translate.instant('FILE_UPLOAD.ERROR.CMR_VALIDATE_ERROR', { rCarga: pedido.refCarga });
          this.notification.error(errorValidateCMR, true, true);
        } 
        if (cmrArray.length > 0 && pedido.hasCMR == 1) {
          const errorTitle = this.translate.instant("FILE_UPLOAD.ERROR.CMR_VALIDATING_ERROR", { rCarga: pedido.refCarga });
          this.notification.error(errorTitle, true, true);
        }
        if (facArray.length > 0 && pedido.hasFAC == 2) {
          const errorValFAC = this.translate.instant('FILE_UPLOAD.ERROR.FAC_VALIDATE_ERROR', { refped: pedido.track });
          this.notification.error(errorValFAC, true, true);
        }
        if((facArray.length > 0) && (pedido.hasFAC == 1 || pedido.hasFAC == 4 || pedido.hasFAC == 5 || pedido.hasFAC == 6)){
          const errorValidatingFAC = this.translate.instant('FILE_UPLOAD.ERROR.FAC_VALIDATING_ERROR', {refped: pedido.track});
          this.notification.error(errorValidatingFAC, true, true);
        }
            
        this.onActionFinalize();
      }
    }, error => {
        console.error(error);
        const errorTitle = this.translate.instant('FILE_UPLOAD.ERROR.FILE_ERROR', { refped: pedido.track });
        this.onActionFailed(errorTitle);
    });
  }

  public selectPedido(pedido: PedidoProveedor) {
    //Limpieza previa
    this.fecRealRef = '';

    this.pedidos.forEach(p => {
      p.isSelected = false;               //Sombreado
      p.isRejected = false;
      p.isCheckActive = false;            //Checkbox individual
      if(p.fechaEntReal === '00010101'){  //Para quitar la fecha inicial de los grupajes
        p.fechaEntReal = '';
      }
    });

    sessionStorage.removeItem('reselectPedidoTrack');
    sessionStorage.removeItem('reselectPedidoExp');

    //Lógica de SOMBREADO (Grupal)
    if(pedido.grupaje && pedido.grupTR){
      //Buscar los grupajes que casan el grupTr
      const grSelected = pedido.grupTR;
      this.pedidos.forEach(p => {
        if(p.grupTR === grSelected){
          p.isSelected = true;
          if(p.hasCMR == 3 || p.hasFAC == 3) {
            p.isRejected = true;
          } else {
            p.isRejected = false;
          }
        }
      });
      this.listaGrupaje = this.grupajesAgrupados[grSelected] || [];
      //console.log(`Para el grupTR ${grSelected} los grupajes son:`, this.listaGrupaje);
      
    } else {
      //Para las filas de seleccion simple
      pedido.isSelected = true;
    }

    //Lógica de CHECKBOX (Individual)
    this.selectedPedido = pedido;
    this.selectedPedido.isCheckActive = true;

    if(this.selectedPedido.hasCMR == 3 || this.selectedPedido.hasFAC == 3) {
      this.selectedPedido.isRejected = true;
    } else {
      this.selectedPedido.isRejected = false;
    }

    this.activateFRealButton();
    this.actualizarTextoFechaReal();

    if(this.selectedPedido.isGrupaje){
      this.showGrupReady(this.selectedPedido);
    } else {
      this.isGrupReady = false;
    }
  }

  public unselectPedido(pedido: PedidoProveedor) {
    if(pedido){
      pedido.isSelected = false;
      pedido.isCheckActive = false;
    }
    if(this.selectedPedido === pedido) {
      this.selectedPedido = new PedidoProveedor();
      this.selectedPedido.isSelected = false;
      this.selectedPedido.isRejected = false;
      this.selectedPedido.isCheckActive = false;

      //Para los grupajes
      this.pedidos.forEach(p => {
        p.isSelected = false;
        p.isCheckActive = false;
      });

      sessionStorage.removeItem('reselectPedidoTrack');
      sessionStorage.removeItem('reselectPedidoExp');

      this.activeSendButton = false;
      this.activeFRealButton = false;
      this.getPedidos(this.filtrosActivos);
    }
  }

  public get canViewPedidosValidador(): boolean {
    return (this.authService.hasRole(UserRoles.Admin) 
      || this.authService.hasRole(UserRoles.Interno)
      || this.authService.hasRole(UserRoles.Consulta)
    );
  }

  public get canFilterByProv(): boolean {
    return (this.authService.hasRole(UserRoles.Admin) 
      || this.authService.hasRole(UserRoles.Interno)
      || this.authService.hasRole(UserRoles.Consulta)
    );
  }

  public get canFilterByTrack(): boolean {
    return (this.authService.hasRole(UserRoles.Admin)
      || this.authService.hasRole(UserRoles.Interno)
      || this.authService.hasRole(UserRoles.Consulta)
      || this.authService.hasRole(UserRoles.Externo)
    );
  }
  
  public navigateToCMRvalidator(): void {
    this.router.navigate(['pedidosValidador']);
  }

  public navigateToHistorico(): void {
    this.router.navigate(['pedidosHistorico']);
  }

  public onDoubleClick(pedido: PedidoProveedor) {
    if(pedido.hasCMR === 7 || pedido.hasCMR === 8 || pedido.hasCMR === 0) {
      //Si es no aplica, no tiene nada que mostrar
      //Hacemos que el doubleClick no haga nada
      //o ahora puede ser tambien 0 u 8 deshabilitados
      return;
    }
    this.selectPedido(pedido);
    this.onViewCMRselected(pedido);
  }

  public onClick(pedido: PedidoProveedor){
   if(this.selectedPedido !== pedido) {
      this.activeSendButton = false;
      this.activeFRealButton = false;

      this.selectedPedido.isCheckActive = false;
      this.selectedPedido.isSelected = false;
      this.selectedPedido.isRejected = false;
      this.selectPedido(pedido);
    } else {
      this.unselectPedido(pedido);
    }
  }

  public setDescargaDate(pedido: PedidoProveedor): void {
    this.selectedPedido = pedido;
    this.actionTitle = this.translate.instant('PEDIDOS_ACTIV.FORM.FECREAL.TITLE', { refped: this.selectedPedido.track });
    setTimeout(() => {
      this.fdescModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public setGrupajeMode(pedido: PedidoProveedor): void {
    this.selectedPedido = pedido;
    this.actionTitle = this.translate.instant('PEDIDOS_ACTIV.FORM.GRUPS.TITLE', { refped: pedido.grupTR});
    setTimeout(() => {
      this.grupsModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public openModalAnular(pedido: PedidoProveedor) {
    this.selectedPedido = pedido;

    if(this.selectedPedido.isGrupaje){
      const pedidosDelGrupo = this.pedidos.filter(p => p.grupTR === this.selectedPedido.grupTR);
      //.every() devuelve true SOLAMENTE si TODOS los elementos cumplen la condición/es
      this.isGrupNOTAnulable = pedidosDelGrupo.length > 0 && pedidosDelGrupo.every(pedido => {
        const tieneFacEn2 = pedido.hasFAC == 2;
        return tieneFacEn2;
      });
    }
    if(this.isGrupNOTAnulable || this.selectedPedido.hasFAC == 2){
      const errorTitle = this.translate.instant('PEDIDOS_ACTIV.FORM.ANULAR.NO_POSIBLE', {refped: this.selectedPedido.track});
      this.onActionFailed(errorTitle);
    } else {
      if(!this.selectedPedido.isGrupaje){
        this.actionTitle = this.translate.instant('PEDIDOS_ACTIV.FORM.ANULAR.TITLE', { refped: this.selectedPedido.track });
      } else {
        this.actionTitle = this.translate.instant('PEDIDOS_ACTIV.FORM.ANULAR.TITLE', { refped: this.selectedPedido.grupTR });
      }
      
      setTimeout(() => {
        this.anularModalOpener$.next(ModalAction.Open);
      }, 0);

    }
  }

  public get isAdminUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Admin ? true : false;
  }

  public get isInterUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Interno ? true : false;
  }

  public get isConsultaUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Consulta ? true : false;
  }

  public get isExternoUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Externo ? true : false;
  }

  private onActionSuccess(pedido: PedidoProveedor, cmrArray: File[], facArray: File[], otrArray: File[]) {
    //pedido actualizado...
    if(!pedido.track.startsWith("GRU")){    //Lo quito para grupajes ya que llena la pantalla
      const successTitle = this.translate.instant("FILE_UPLOAD.SUCCES.FILES_SAVED", {refped: pedido.track});
      this.notification.info(successTitle, true, true);
    }

    if(cmrArray.length > 0) {
      //cmr actualizado
      const successCMR = this.translate.instant("FILE_UPLOAD.SUCCES.CMR_SAVED", {cmrName: cmrArray[0].name});
      this.notification.success(successCMR, true, true);
    }
    if(facArray.length > 0) {
      //fac actualizado
      const successFAC = this.translate.instant("FILE_UPLOAD.SUCCES.FAC_SAVED", {facName: facArray[0].name});
      this.notification.success(successFAC, true, true);
    }
    if(otrArray.length > 0) {
      //otrs actualizados
      const successOTR = this.translate.instant("FILE_UPLOAD.SUCCES.OTR_SAVED");
      this.notification.success(successOTR, true, true);
    }
    this.onActionFinalize();
  }
  
  private onActionFailed(msg: string) {
    this.notification.error(msg, true, true);
    this.onActionFinalize();
  }

  private onActionFinalize() {
    this.spinnerService.hide();
    this.unselectPedido(this.selectedPedido);
  }

  private activateSendButton(pedido: PedidoProveedor) {
    const suffix = pedido.track + '-' + pedido.expediente;
    if(pedido.fechaEntReal != '' && pedido.fechaEntReal != undefined){
      //Miramos los inputs físicos de esta fila
      const inCMR = document.getElementById('cmr-' + suffix) as HTMLInputElement;
      const inFAC = document.getElementById('fac-' + suffix) as HTMLInputElement;
      const inOTR = document.getElementById('otr-' + suffix) as HTMLInputElement;

      if(inCMR && inCMR.files && inCMR.files.length > 0){
        this.activeSendButton = true;
      } else if(inFAC && inFAC.files && inFAC.files.length > 0 && pedido.hasCMR){
        this.activeSendButton = true;
      } else if(inOTR && inOTR.files && inOTR.files.length > 0 && pedido.hasCMR){
        this.activeSendButton = true;
      } else {
        this.activeSendButton = false;
      }
    }
  }
  
  private activateFRealButton() {
    if(this.isAdminUser || this.isInterUser){
      this.activeFRealButton = true;
    } else if(this.selectedPedido.fechaEntReal === '' || this.selectedPedido.fechaEntReal === undefined){
      //Para externos, solo si no está seteada ya
      this.activeFRealButton = true;
    } else {
      this.activeFRealButton = false;
    }
  }

  private actualizarTextoFechaReal(){
    //console.log('VALOR CRUDO:', this.selectedPedido.fechaEntReal);
    //console.log('MOMENT ES VALIDO?:', moment(this.selectedPedido.fechaEntReal).isValid());
    const p = this.selectedPedido;
    
    if(p && p.fechaEntReal && p.fechaEntReal !== '00010101') {
      const fechaFormateada = moment(p.fechaEntReal, 'YYYYMMDD').format('DD/MM/YYYY');
      this.fecRealRef = this.translate.instant("PEDIDOS_ACTIV.TEXT.FREALTEXT", { fecRealRef: fechaFormateada });
    } else {
      this.fecRealRef = '';
    }
    //Para evitar los doblesCheks
    //Fuerza el refresco visual sin destruir el elemento
    this.cdr.detectChanges();
  }

  public showGrupReady(pedidoSel: PedidoProveedor){
    if(!pedidoSel || !pedidoSel.grupTR || pedidoSel.grupTR.trim() === ''){
      this.isGrupReady = false;
      return;
    }
    //Filtramos los pedidos que pertenecen al mismo grupTR
    const pedidosDelGrupo = this.pedidos.filter(p => p.grupTR === pedidoSel.grupTR);
    
    //.every() devuelve true SOLAMENTE si TODOS los elementos cumplen la condición/es
    this.isGrupReady = pedidosDelGrupo.length > 0 && pedidosDelGrupo.every(pedido => {
      const tieneFecha = pedido.fechaEntReal !== '' && pedido.fechaEntReal !== undefined;
      const noTieneOcho = pedido.hasCMR !== 8 && pedido.hasFAC !== 8;
      return tieneFecha && noTieneOcho;
    });
  }

  public puedoEnviarGrupaje(pedidoDelBucle: PedidoProveedor): boolean {
     if(!pedidoDelBucle || this.isConsultaUser) return false;

    const pGrupo = this.pedidos.filter(p => p.grupTR === pedidoDelBucle.grupTR);

    const tieneCmrEnServidor = pGrupo.some(p => p.hasCMR === 1 || p.hasCMR === 2 || p.hasCMR === 7);
    const tieneCmrEnInput = pGrupo.some(p => {
        const inCMR = document.getElementById('cmr-' + p.track+'-'+p.expediente) as HTMLInputElement;
        return !!(inCMR && inCMR.files && inCMR.files.length > 0);
    });
    
    //Si el grupo requiere algún CMR (0 o 3) y no hay rastro de ninguno, bloqueamos.
    const requiereCmr = pGrupo.some(p => p.hasCMR === 0 || p.hasCMR === 3);
    if(requiereCmr && (!tieneCmrEnInput && !tieneCmrEnServidor)) return false;

    //CONSISTENCIA: Facturas acompañadas (Huérfanos por línea)
    //No permitimos subir una factura si en SU línea el CMR es obligatorio (0, 3) 
    //y no hay archivo adjunto ni CMR previo en el servidor para esa línea.
    const hayHuerfanos = pGrupo.some(p => {
        const inFAC = document.getElementById('fac-' + p.track+'-'+p.expediente) as HTMLInputElement;
        const tieneFACadjunta = !!(inFAC && inFAC.files && inFAC.files.length > 0);
        
        const inCMR = document.getElementById('cmr-' + p.track+'-'+p.expediente) as HTMLInputElement;
        const tieneCmrAdjunto = !!(inCMR && inCMR.files && inCMR.files.length > 0);
        const tieneCmrPrevio = (p.hasCMR === 1 || p.hasCMR === 2 || p.hasCMR === 7);
        
        const requiereCmrEnEstaLinea = (p.hasCMR === 0 || p.hasCMR === 3);

        return tieneFACadjunta && requiereCmrEnEstaLinea && !tieneCmrAdjunto && !tieneCmrPrevio;
    });
    
    if(hayHuerfanos) return false;

    //ACTIVACIÓN: Si hay CMR y hay ALGO nuevo que enviar
    return pGrupo.some(p => {
      const suffix = p.track + '-' + p.expediente;
      const inCMR = document.getElementById('cmr-' + suffix) as HTMLInputElement;
      const inFAC = document.getElementById('fac-' + suffix) as HTMLInputElement;
      const inOTR = document.getElementById('otr-' + suffix) as HTMLInputElement;

      return !!((inCMR && inCMR.files && inCMR.files.length > 0) || 
                (inFAC && inFAC.files && inFAC.files.length > 0) || 
                (inOTR && inOTR.files && inOTR.files.length > 0));
    });
  }

  public isGrupajeBloqueado(pedido: PedidoProveedor): boolean {
    if(!pedido || !pedido.grupTR) return false;

    const pedidosDelGrupo = this.pedidos.filter(p => p.grupTR === pedido.grupTR);

    //Enabled: 0-inicio, 8-inicio, 3-rechaz, 7-noAplica
    //Disabled: 1-subida, 2-validada(para facturas tambien 4,5,6)
    return pedidosDelGrupo.some(p => 
        (p.hasCMR === 1 || p.hasCMR === 2 ) 
        || 
        (p.hasFAC === 1 || p.hasFAC === 2 || p.hasFAC === 4 || p.hasFAC === 5 || p.hasFAC === 6 )
    );
  }

  private isNotValidName(text: string): boolean {
    //La regex [^a-zA-Z0-9] coincide con cualquier caracter NO alfanumérico.
    //La regex: [^a-zA-Z0-9 -_@ ç()]+ coincide con cualquier caracter que NO esté en el conjunto especificado.
    //El "+" al final indica "una o más ocurrencias".
    const invalidCharPattern: RegExp = /[^a-zA-Z0-9 -_@ ñç()]+/;

    //El método test() devuelve true si encuentra al menos una coincidencia del patrón.
    return invalidCharPattern.test(text);
  }

  private hasMultipleDots(text: string): boolean {
    //Cuenta cuántos puntos hay en el string
    const dotCount = (text.match(/\./g) || []).length;
    
    //Si hay más de 1 punto, o si hay un punto pero quieres 0, es inválido
    return dotCount > 1; 
  }

  private haveNotValidChars(text: string): boolean {
    let notValidChars = false;
    if(text.includes("%") || text.includes(",") || text.includes("'") || text.includes(";")){
      notValidChars = true;
    } else {
      notValidChars = false;
    }
    return notValidChars;
  }

  private hasValidExtension(fileName: string): boolean {
    //Busca el último punto en el nombre del archivo
    const dotIndex = fileName.lastIndexOf('.');
    //Debe tener un punto, no ser el primer carácter y tener letras después
    return dotIndex > 0 && dotIndex < fileName.length - 1;
  }

  /** PARTE DE VISUALIZACION DE DOCS */
  public onViewCMRselected(pedido: PedidoProveedor): void {
    //GUARDADO PREVENTIVO: Aseguramos que la identidad del pedido esté en sesión
    //antes de que la modal o el cierre puedan limpiar nada.
    const track = pedido.track.toString();
    const exp = pedido.expediente.toString();
    sessionStorage.setItem('reselectPedidoTrack', track);
    sessionStorage.setItem('reselectPedidoExp', exp);

    this.selectedPedido = pedido;
    //Se visualizan los docs 
    setTimeout(() => {
      this.viewDocsModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public haveDocs(pedido: PedidoProveedor): boolean {
    let haveDocs = false;
    if(pedido.hasCMR===8){
      haveDocs = false;
    } else if(pedido.hasCMR===0 || pedido.hasCMR===7){
      if(pedido.hasFAC!==0 && pedido.hasFAC!==7){
        haveDocs = true;
      } else {
        haveDocs = false;
      }
    } else {
      haveDocs = true;
    }
    return haveDocs;
  }

  public onDownloadFAC(pedido: PedidoProveedor) {
    this.selectPedido(pedido);
    this.getPedidoArchivos(pedido, "FAC");
  }

  private getPedidoArchivos(pedido: PedidoProveedor, fileType: string){
    this.apiFileUpload.getPedidoFilesVO(pedido.track, pedido.expediente)
    .pipe(
      take(1),
      map(response => {
        (response.datos) ?
          this.pedidoFiles = PedidoFiles.parseDto(response.datos as PedidoFilesDto)
          :
          this.pedidoFiles = new PedidoFiles();
      }),
      finalize(() => {
        if(fileType === "CMR"){
          if(this.pedidoFiles.rutaCMR){
            this.getFile("CMR", this.pedidoFiles.rutaCMR);
          }
        } else if(fileType === "FAC"){
          if(this.pedidoFiles.rutaFAC){
            this.getFile("FAC", this.pedidoFiles.rutaFAC);
          }
        }
      })
    ).subscribe();
  }

  private getFile(fileType: string, pathFile: string) {
    const pathSplit = pathFile.split('/');
    const filename = pathSplit[pathSplit.length -1];
    
    this.apiFileUpload.getFile(fileType, this.selectedPedido.track, this.selectedPedido.expediente, filename)
    .subscribe(blob => {
      const url = window.URL.createObjectURL(blob);
      this.fileURL = url;

      this.downloadFile(this.fileURL, filename, fileType);
      
    }, error => {
      console.error('Error downloading or displaying the file. ', error);
      const downloadedError = this.translate.instant('ERROR.DOWNLOAD_FILE_ERROR');
      this.notification.error(downloadedError, true, true);
    });
  }

  private downloadFile(fileURL: string, filename: string, fileType: string): void {
    const a = document.createElement('a');
    a.href = fileURL;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    let dTitle = "";
    if(fileType == "CMR"){
      dTitle = this.translate.instant('PEDIDOS_HIST.FORM.SUCCES.CMR_DOWNLOADED', {refped: this.selectedPedido.track});
    } else if(fileType == "FAC"){
      dTitle = this.translate.instant('PEDIDOS_HIST.FORM.SUCCES.FAC_DOWNLOADED', {refped: this.selectedPedido.track});
    } else if(fileType == "OTR"){
      dTitle = this.translate.instant('PEDIDOS_HIST.FORM.SUCCES.OTR_DOWNLOADED', {refped: this.selectedPedido.track});
    }
    this.onActionInfo(dTitle);
  }

  private onActionInfo(msg: string) {
    this.notification.info(msg, true, true);
  }
  /** FIN PARTE DE VISUALIZACION DE DOCS */


  //EXPORT TO EXCELL
  public convertToExcelExternos(): void {
    this.spinnerService.show();

    const headers: string[] = [
      this.translate.instant('PEDIDOS_ACTIV.TABLE.USUPROV'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.TR'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.EXPEDIENTE'),
      this.translate.instant('PEDIDOS_ACTIV.EXCEL.EST_CMR'),
      this.translate.instant('PEDIDOS_ACTIV.EXCEL.EST_FAC'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.F_CARGA'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.REF_CARGA'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.F_DESCARGA'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.R_DESCARGA'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.ORIGEN'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.DESTINO'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.PALETS'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.CAMION'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.REMOLQUE'),
      this.translate.instant('PEDIDOS_ACTIV.EXCEL.F_ENT_REAL'),
      this.translate.instant('PEDIDOS_ACTIV.EXCEL.ANOTA')
    ];

    const data: Array<Array<string | number | Date>> = [];
    this.pedidos.forEach(da => {
      data.push([
        da.proveedorUser,
        da.track,
        da.expediente,
        da.hasCMR===1? 'Subido' : 
          da.hasCMR===2? 'Validado' : 
          da.hasCMR===3? 'Rechazado' : 
          da.hasCMR===7? 'No Aplica' : 
          da.hasCMR===8? 'Sin Activar' : 'Sin documento',
        da.hasFAC===1 || da.hasFAC===4 || da.hasFAC===5 || da.hasFAC===6 ? 'Subida' : 
          da.hasFAC===2? 'Validada' : 
          da.hasFAC===3? 'Rechazada' : 
          da.hasFAC===7? 'No Aplica' :
          da.hasFAC===8? 'Sin Activar' : 'Sin documento',
        da.fechaCarga ? this.excelService.procesarYtransformarFecha(da.fechaCarga) : '',
        da.refCarga,
        da.fechaDescarga ? this.excelService.procesarYtransformarFecha(da.fechaDescarga) : '',
        da.refDescarga,
        da.origen,
        da.destino,
        da.numPalets,
        da.matriculaCamion,
        da.matriculaRemolque,
        da.fechaEntReal ? this.excelService.transformUTCDate(da.fechaEntRealDate) : '',
        //da.motivoRechazo ? da.motivoRechazo : '--',
        //Para que el externo solo vea motivos de rechazo
        da.hasCMR===3 || da.hasFAC===3 ? da.motivoRechazo : '--'
      ]);
    });

    const columnsWidth = [
      { column: 1, width: 20 },
      { column: 2, width: 20 },
      { column: 3, width: 15 },
      { column: 4, width: 15 },
      { column: 5, width: 20 },
      { column: 6, width: 12 },
      { column: 7, width: 20 },
      { column: 8, width: 12 },
      { column: 9, width: 20 },
      { column: 10, width: 30 },
      { column: 11, width: 30 },
      { column: 12, width: 8 },
      { column: 13, width: 10 },
      { column: 14, width: 12 },
      { column: 15, width: 20 },
      { column: 16, width: 50 }
    ];

    this.excelService.generateExcel(
      this.translate.instant('EXCEL.PACTIV_FNAME'),
      this.translate.instant('EXCEL.PACTIV_TITLE'),
      headers,
      data,
      columnsWidth);

    this.spinnerService.hide();
  }

  public convertToExcelInternos(): void {
    this.spinnerService.show();

    const headers: string[] = [
      this.translate.instant('PEDIDOS_ACTIV.TABLE.USUPROV'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.TR'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.EXPEDIENTE'),
      this.translate.instant('PEDIDOS_ACTIV.EXCEL.EST_CMR'),
      this.translate.instant('PEDIDOS_ACTIV.EXCEL.EST_FAC'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.F_CARGA'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.REF_CARGA'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.F_DESCARGA'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.R_DESCARGA'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.ORIGEN'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.DESTINO'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.PALETS'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.CAMION'),
      this.translate.instant('PEDIDOS_ACTIV.TABLE.REMOLQUE'),
      this.translate.instant('PEDIDOS_ACTIV.EXCEL.F_ENT_REAL'),
      this.translate.instant('PEDIDOS_ACTIV.EXCEL.ANOTA')
    ];

    const data: Array<Array<string | number | Date>> = [];
    this.pedidos.forEach(da => {
      data.push([
        da.proveedorUser,
        da.track,
        da.expediente,
        da.hasCMR===1? 'Subido' : 
          da.hasCMR===2? 'Validado' : 
          da.hasCMR===3? 'Rechazado' : 
          da.hasCMR===7? 'No Aplica' : 
          da.hasCMR===8? 'Sin Activar' : 'Sin documento',
        da.hasFAC===1? 'Subida' : 
          da.hasFAC===2? 'Contabilizada' : 
          da.hasFAC===3? 'Rechazada' : 
          da.hasFAC===4? 'Bloqueada' : 
          da.hasFAC===5? 'Pdte de Contabilizar' : 
          da.hasFAC===6? 'No contabilizar / Duplicada' :
          da.hasFAC===7? 'No Aplica' :
          da.hasFAC===8? 'Sin Activar' : 'Sin documento',
        da.fechaCarga ? this.excelService.procesarYtransformarFecha(da.fechaCarga) : '',
        da.refCarga,
        da.fechaDescarga ? this.excelService.procesarYtransformarFecha(da.fechaDescarga) : '',
        da.refDescarga,
        da.origen,
        da.destino,
        da.numPalets,
        da.matriculaCamion,
        da.matriculaRemolque,
        da.fechaEntReal ? this.excelService.transformUTCDate(da.fechaEntRealDate) : '',
        da.motivoRechazo ? da.motivoRechazo : '--',
      ]);
    });

    const columnsWidth = [
      { column: 1, width: 20 },
      { column: 2, width: 20 },
      { column: 3, width: 15 },
      { column: 4, width: 15 },
      { column: 5, width: 20 },
      { column: 6, width: 12 },
      { column: 7, width: 20 },
      { column: 8, width: 12 },
      { column: 9, width: 20 },
      { column: 10, width: 30 },
      { column: 11, width: 30 },
      { column: 12, width: 8 },
      { column: 13, width: 10 },
      { column: 14, width: 12 },
      { column: 15, width: 20 },
      { column: 16, width: 50 }
    ];

    this.excelService.generateExcel(
      this.translate.instant('EXCEL.PACTIV_FNAME'),
      this.translate.instant('EXCEL.PACTIV_TITLE'),
      headers,
      data,
      columnsWidth);

    this.spinnerService.hide();
  }

}
