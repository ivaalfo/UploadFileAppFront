import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import { PedidoProveedor } from '@data/pedidos/pedido-proveedor';
import { TableHeader } from '@shared/components/table/table-header';
import { TableScroll } from '@shared/components/table/table-scroll';
import { Subject } from 'rxjs';
import { finalize, map, take, tap } from 'rxjs/operators';
import { RowComponent } from '@shared/components/table/row/row.component';
import { PedidosHistoricoApiClient } from '@core/services/api/pedidosHistorico/api-pedidos-historico.service';
import { sortArrayBy, sortByProperty } from '@shared/utils/array-utils';
import { ModalAction } from '@shared/components/modal/modal-action';
import { AuthService } from '@core/services/auth/auth.service';
import { UserRoles } from '@data/user-roles';
import { PedidoFiles, PedidoFilesDto } from '@data/pedidos/pedido-files';
import { FileUploadApiClient } from '@core/services/api/fileupload/api-file-upload.service';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';
import { TranslateService } from '@ngx-translate/core';
import { ExcelService } from '@core/services/excel/excel.service';


@Component({
  selector: 'm-pedidos-historico',
  templateUrl: './pedidos.historico.component.html',
  styleUrls: ['./pedidos.historico.component.scss']
})
export class PedidosHistoricoComponent implements OnInit {

  @ViewChildren(RowComponent)
  public rows!: QueryList<RowComponent>;

  public tableHeaders: TableHeader[] = this.getTableHeaders();
  public loading = false;
  public tableScroller$ = new Subject<TableScroll>();
  
  public pedidos: PedidoProveedor[] = [];
  public selectedPedido: PedidoProveedor = new PedidoProveedor();
  public selectedPedidoNi: 0 | undefined;
  
  public selectedCMR!: File[];
  public viewDocsModalOpener$ = new Subject<ModalAction>();
  
  public anotaModalOpener$ = new Subject<ModalAction>();
  public anotaTitle!: string;

  public pedidoFiles = new PedidoFiles();
  public fileURL!: string;

  public fecRealRef!: string;
  public noAplica!: string;

  public noResults2show = false;
  private filtrosActivos: { expediente?: string, provName?: string, trFilterValue?: string, facNum?: string, refCharge?: string } = {};
  
  //Definimos la estructura: la clave es el grupTR y el valor es el array de grupNum
  private grupajesAgrupados: { [key: string]: string[] } = {};
  public listaGrupaje: String[] = [];

  //Guarda la última ordenacion: { column: 'fechaCarga', directionSort: 'desc' }
  private lastSortEvent: any = null;

  public reactivarModalOpener$ = new Subject<ModalAction>();
  public actionToConfirm!: string;
  public actionTitle!: string;

  public constructor (
    private readonly authService: AuthService,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly router: Router,
    private readonly notification: NotificationService,
    private readonly translate: TranslateService,
    private readonly apiHistoricoClient: PedidosHistoricoApiClient,
    private readonly apiFileUpload: FileUploadApiClient,
    private readonly excelService: ExcelService,
  ) { }

  public ngOnInit(): void {
    const expSaved = sessionStorage.getItem('filteredEXP');
    const userSaved = sessionStorage.getItem('filteredUSER');
    const trackSaved = sessionStorage.getItem('filteredTR');
    const facSaved = sessionStorage.getItem('filteredFAC');
    const rcharSaved = sessionStorage.getItem('filteredRCARGA');
    this.filtrosActivos = {
      expediente: expSaved || undefined,
      provName: userSaved || undefined,
      trFilterValue: trackSaved || undefined,
      facNum: facSaved || undefined,
      refCharge: rcharSaved || undefined
    };
    this.getPedidosValidados();
  }

  public refresh(): void {
    this.spinnerService.show();
    sessionStorage.removeItem('filteredEXP');
    sessionStorage.removeItem('filteredUSER');
    sessionStorage.removeItem('filteredTR');
    sessionStorage.removeItem('filteredFAC');
    sessionStorage.removeItem('filteredRCARGA');
    setTimeout((function() {
      document.location.reload();
    }), 23);
  }

  public getTableHeaders() {
    return [
      { title: 'PEDIDOS_HIST.TABLE.FILES', property: 'estado'},
      { title: 'PEDIDOS_HIST.TABLE.USUPROV', sorted: true, property: 'proveedorUser'},
      { title: 'PEDIDOS_HIST.TABLE.TR', sorted: true, property: 'track'},
      { title: 'PEDIDOS_HIST.TABLE.EXPEDIENTE', sorted: true, property: 'expediente'},
      { title: 'PEDIDOS_HIST.TABLE.F_CARGA', sorted: true, property: 'fechaCarga'},
      { title: 'PEDIDOS_HIST.TABLE.REF_CARGA', sorted: true, property: 'refCarga'},
      { title: 'PEDIDOS_HIST.TABLE.F_DESCARGA', sorted: true, property: 'fechaDescarga'},
      { title: 'PEDIDOS_HIST.TABLE.R_DESCARGA', sorted: true, property: 'refDescarga'},
      { title: 'PEDIDOS_HIST.TABLE.ORIGEN', sorted: true, property: 'origen'},
      { title: 'PEDIDOS_HIST.TABLE.DESTINO', sorted: true, property: 'destino'},
      { title: 'PEDIDOS_HIST.TABLE.PALETS', sorted: true, property: 'numPalets'},
      { title: 'PEDIDOS_HIST.TABLE.CAMION', sorted: true, property: 'matriculaCamion'},
      { title: 'PEDIDOS_HIST.TABLE.REMOLQUE', sorted: true, property: 'matriculaRemolque'},
      { title: 'PEDIDOS_HIST.TABLE.F_SUB_CMR', sorted: true, property: 'fechaSubidaCMRshort'},
      { title: 'PEDIDOS_HIST.TABLE.F_SUB_FAC', sorted: true, property: 'fechaSubidaFACshort'},
      { title: 'PEDIDOS_HIST.TABLE.ANOTACIONES' }
    ];
  }

  public pHistTrackById(_: number, item: PedidoProveedor) {
    return item.track + '-' + item.expediente;
    //Si añado aqui el ischeckActive como en Activos
    //Angular "mata" el elemento del DOM en cuanto cambia el check, 
    //impidiendo que el navegador detecte el doble clic.
    //return item.track + '-' + item.expediente + '-' + item.isCheckActive;
  }

  public onCheckboxChanged(event: UIEvent, pedido: PedidoProveedor): void {
    const checkBox = event.target as HTMLInputElement;
    if (checkBox.checked) {
      this.selectPedido(pedido);
    } else {
      this.unselectPedido(pedido);
    }
  }

  public onColumnSorted(event: any): void {
    this.lastSortEvent = event;   //Guardamos la ordenacion actual
    this.pedidos = sortByProperty(this.pedidos, event.column, event.directionSort);
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

  public get canFilterByFac(): boolean {
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

  public navigateToValidador(): void {
    this.router.navigate(['pedidosValidador']);
  }

  public navigateToActivos(): void {
    this.router.navigate(['pedidosActivos']);
  }

  public onDoubleClick(pedido: PedidoProveedor) {
    if(pedido.hasCMR === 7 || pedido.hasCMR === 8 || pedido.hasCMR === 0) {
      //Si es no aplica, no tiene nada que mostrar
      //Hacemos que el doubleClick no haga nada
      //o ahora puede ser tambien 0 u 8 deshabilitados
      return;
    }
    this.selectPedido(pedido);
    this.onViewValidCMRselected(pedido);
  }

  public onClick(pedido: PedidoProveedor){
    if(this.selectedPedido !== pedido){
      this.selectedPedido.isCheckActive = false;
      this.selectedPedido.isSelected = false;
      this.selectedPedido.isRejected = false;
      this.selectPedido(pedido);
    } else {
      this.unselectPedido(pedido);
    }
  }

  public onViewValidCMRselected(pedido: PedidoProveedor): void {
    //GUARDADO PREVENTIVO: Aseguramos que la identidad del pedido esté en sesión
    //antes de que la modal o el cierre puedan limpiar nada.
    const track = pedido.track.toString();
    const exp = pedido.expediente.toString();
    sessionStorage.setItem('reselectPHistoricoTR', track);
    sessionStorage.setItem('reselectPHistoricoEXP', exp);

    this.selectedPedido = pedido;
    //Se visualiza el CMR 
    setTimeout(() => {
      this.viewDocsModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public getPedidosValidados(filtro?: {expediente?: string, provName?: string, trFilterValue?: string, facNum?: string, refCharge?: string}) {
    this.loading = true;
    this.spinnerService.show();
    this.selectedPedido = new PedidoProveedor();

    //Actualizamos los filtros globales por si se llama desde otro sitio
    if(filtro){
      this.filtrosActivos = { ...this.filtrosActivos, ...filtro};
    }
    let paramsToSend = { ...this.filtrosActivos };

    if(paramsToSend.facNum && paramsToSend.facNum.includes("/")){
      paramsToSend.facNum = paramsToSend.facNum.replace(/\//g, "~")
    }

    this.apiHistoricoClient.getByFilters(paramsToSend).pipe(
      take(1),
      tap((pedidos: any) => {

        let pedidosBase = [...this.sortedBy(pedidos)];

        //Usamos .map() en lugar de .forEach() para generar un nuevo array transformado
        let listaProcesada = pedidosBase.map(p => {
          p.isSelected = false;
          p.isCheckActive = false;
          p.isRejected = false;
          return p;     //Importante devolver el objeto
        });

        //Aplicamos la ordenación del usuario si existe
        if(this.lastSortEvent){
          listaProcesada = sortByProperty(
            listaProcesada,
            this.lastSortEvent.column,
            this.lastSortEvent.directionSort
          );
        }
        this.pedidos = listaProcesada;

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
        if(!this.grupajesAgrupados[pedido.grupTR]) {
          this.grupajesAgrupados[pedido.grupTR] = [];
        }
        //Añadimos el grupNum a ese grupo específico
        this.grupajesAgrupados[pedido.grupTR].push(pedido.grupNum);
      }
    });
    //console.log("Grupajes organizados:", this.grupajesAgrupados);
  }

  private reselectPedidoGuardado(){
    //RECUPERAR: Buscamos si TR guardado en sessionStorage
    const trGuardado = sessionStorage.getItem('reselectPHistoricoTR');
    const expGuardado = sessionStorage.getItem('reselectPHistoricoEXP');
    
    if(trGuardado && expGuardado) {
      //console.log('Buscando para re-seleccionar:', trGuardado, expGuardado);
      this.pedidos.forEach(p => {
        p.isSelected = false;
        p.isCheckActive = false;
      });

      const pedidoEncontrado = this.pedidos.find(p => 
        p.track.toString() === trGuardado && p.expediente.toString() === expGuardado
      );

      if(pedidoEncontrado) {
        this.selectedPedido = pedidoEncontrado;
        pedidoEncontrado.isCheckActive = true;
        this.selectPedido(pedidoEncontrado);
            
        //Aseguramos que el usuario vea la fila seleccionada
        setTimeout(() => {
          const elemento = document.getElementById(`fila-${trGuardado}-${expGuardado}`);
          if(elemento){
            elemento.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 223);
      }
      //Limpiamos para evitar selecciones accidentales en el futuro
      sessionStorage.removeItem('reselectPHistoricoTR');
      sessionStorage.removeItem('reselectPHistoricoEXP');
    }
  }

  public limpiarFiltros(): void {
    //Reseteo el orden para que la tabla no se ordene sola al recargar
    this.lastSortEvent = null;
    
    this.filtrosActivos = {
      expediente: sessionStorage.getItem('filteredEXP') || undefined,
      provName: sessionStorage.getItem('filteredUSER') || undefined,
      trFilterValue: sessionStorage.getItem('filteredTR') || undefined,
      facNum: sessionStorage.getItem('filteredFAC') || undefined,
      refCharge: sessionStorage.getItem('filteredRCARGA') || undefined
    };

    this.tableHeaders = [...this.getTableHeaders()];
    this.getPedidosValidados();
  }

  public onAnotaCMRselected(pedido: PedidoProveedor): void {
    this.selectedPedido = pedido;
    this.anotaTitle = this.translate.instant('VALIDADOR.FORM.ACTIONS.ANOTATION.TITLE', { refped: this.selectedPedido.track });
    setTimeout(() => {
      this.anotaModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public onDownloadCMR(pedido: PedidoProveedor) {
    this.selectPedido(pedido);
    this.getPedidoArchivos(pedido, "CMR");
  }

  public onDownloadFAC(pedido: PedidoProveedor) {
    this.selectPedido(pedido);
    this.getPedidoArchivos(pedido, "FAC");
  }

  public onDownloadOTRs(pedido: PedidoProveedor) {
    this.selectPedido(pedido);
    this.getPedidoArchivos(pedido, "OTR");
  }

  private sortedBy(pedidos: PedidoProveedor[]): PedidoProveedor[] {
    return pedidos.sort(sortArrayBy('proveedorKy'));
  }

  private selectPedido(pedido: PedidoProveedor) {
    //Limpieza previa
    this.pedidos.forEach(p => {
      p.isSelected = false;       //Sombreado
      p.isRejected = false;
      p.isCheckActive = false;    //Checkbox individual
    });

    sessionStorage.removeItem('reselectPHistoricoTR');
    sessionStorage.removeItem('reselectPHistoricoEXP');

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
      //Para lass filas de seleccion simple
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

    this.fecRealRef = this.selectedPedido.fechaEntReal ? this.translate.instant("PEDIDOS_HIST.TEXT.FREALTEXT", { fecRealRef: this.selectedPedido.fechaEntRealShort }) : '';
    this.noAplica = this.selectedPedido.hasCMR===7 ? this.translate.instant("VALIDADOR.TEXT.NO_APLICA") : '';
  }

  private unselectPedido(pedido: PedidoProveedor) {
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

      sessionStorage.removeItem('reselectPHistoricoTR');
      sessionStorage.removeItem('reselectPHistoricoEXP');
      this.getPedidosValidados(this.filtrosActivos);
    }
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
        } else if(fileType === "OTR"){
          if(this.pedidoFiles.rutaOTR){
            const partes = this.pedidoFiles.rutaOTR.split('~~');
            console.log(partes);
            for(let i = 0; i < partes.length-1; i++) {
              console.log("downloading: "+partes[i]);
              this.getFile("OTR", partes[i]);
            }
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
      this.notification.error(downloadedError, true, false);
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

  public get isAdminUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Admin ? true : false;
  }

  public get isInterUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Interno ? true : false;
  }
  
  public get isExternoUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Externo ? true : false;
  }

  public get isConsultaUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Consulta ? true : false;
  }

  public openModalReactivar(pedido: PedidoProveedor) {
    this.selectedPedido = pedido;
    if(!this.selectedPedido.isGrupaje){
      this.actionTitle = this.translate.instant('PEDIDOS_HIST.ACTIONS.REACTIVAR.TITLE', { refped: this.selectedPedido.track});
      this.actionToConfirm = this.translate.instant('PEDIDOS_HIST.ACTIONS.REACTIVAR.TEXT', { refped: this.selectedPedido.track, exp: this.selectedPedido.expediente });
    } else {
      this.actionTitle = this.translate.instant('PEDIDOS_HIST.ACTIONS.REACTIVAR.TITLE', { refped: this.selectedPedido.grupTR});
      this.actionToConfirm = this.translate.instant('PEDIDOS_HIST.ACTIONS.REACTIVAR.TEXT_GRUP', { gruptr: this.selectedPedido.grupTR });
    }
    
    setTimeout(() => {
      this.reactivarModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public onReactivarPedido() {
    this.loading = true;
    this.spinnerService.show();
    
    this.apiHistoricoClient.setPedidoReactivar(this.selectedPedido.track, this.selectedPedido.expediente)
    .pipe(take(1))
    .subscribe((response: boolean) => {
      if (response) {
          this.onReactivarActionSuccess();
      } else {
          this.onActionFinalize();
      }
    }, error => {
      console.error(error);
      const errorTitle = this.translate.instant('PEDIDOS_HIST.ACTIONS.REACTIVAR.ERROR', {refped: this.selectedPedido.track});
      this.onActionReactivarFailed(errorTitle);
    });
  }

  private onReactivarActionSuccess() {
    this.spinnerService.show();
    if(this.selectedPedido){
      let successTitle = "";
      if(this.selectedPedido.isGrupaje){
        successTitle = this.translate.instant("PEDIDOS_HIST.ACTIONS.REACTIVAR.SUCCES_GRUP", {gruptr: this.selectedPedido.grupTR});
      } else {
        successTitle = this.translate.instant("PEDIDOS_HIST.ACTIONS.REACTIVAR.SUCCES", {refped: this.selectedPedido.track});
      }
      this.notification.success(successTitle, true, true);
    }
    this.onActionFinalize();
  }

  private onActionFinalize() {
    this.spinnerService.hide();
    this.unselectPedido(this.selectedPedido);
  }

  private onActionReactivarFailed(msg: string){
    this.notification.error(msg, true, false);
    this.spinnerService.hide();
    this.onCancelReactivar();
  }

  public onCancelReactivar(){
    //Almacenamos el TR del pedido actual en sessionStorage para re-seleccion
    const track = this.selectedPedido.track.toString();
    const exp = this.selectedPedido.expediente.toString();
    sessionStorage.setItem('reselectPHistoricoTR', track);
    sessionStorage.setItem('reselectPHistoricoEXP', exp);
    this.reselectPedidoGuardado();
  }

  //EXPORT TO EXCELL
  public convertToExcelExternos(): void {
    this.spinnerService.show();

    const headers: string[] = [
      this.translate.instant('PEDIDOS_HIST.TABLE.USUPROV'),
      this.translate.instant('PEDIDOS_HIST.TABLE.TR'),
      this.translate.instant('PEDIDOS_HIST.TABLE.EXPEDIENTE'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.EST_CMR'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.EST_FAC'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.NUM_FAC'),
      this.translate.instant('PEDIDOS_HIST.TABLE.F_CARGA'),
      this.translate.instant('PEDIDOS_HIST.TABLE.REF_CARGA'),
      this.translate.instant('PEDIDOS_HIST.TABLE.F_DESCARGA'),
      this.translate.instant('PEDIDOS_HIST.TABLE.R_DESCARGA'),
      this.translate.instant('PEDIDOS_HIST.TABLE.ORIGEN'),
      this.translate.instant('PEDIDOS_HIST.TABLE.DESTINO'),
      this.translate.instant('PEDIDOS_HIST.TABLE.PALETS'),
      this.translate.instant('PEDIDOS_HIST.TABLE.CAMION'),
      this.translate.instant('PEDIDOS_HIST.TABLE.REMOLQUE'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.F_SUBIDA_CMR'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.F_SUBIDA_FAC'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.F_ENT_REAL'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.ANOTA'),
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
        da.facNumber ? da.facNumber : 'Sin nº de factura',
        da.fechaCarga ? this.excelService.procesarYtransformarFecha(da.fechaCarga) : '',
        da.refCarga,
        da.fechaDescarga ? this.excelService.procesarYtransformarFecha(da.fechaDescarga) : '',
        da.refDescarga,
        da.origen,
        da.destino,
        da.numPalets,
        da.matriculaCamion,
        da.matriculaRemolque,
        da.fechaSubidaCMR ? this.excelService.transformUTCDate(da.fechaSubidaCMRDate) : '',
        da.fechaSubidaFAC ? this.excelService.transformUTCDate(da.fechaSubidaFACDate) : '',
        da.fechaEntReal ? this.excelService.transformUTCDate(da.fechaEntRealDate) : '',
        //da.motivoRechazo ? da.motivoRechazo : '--',
        //Para que el externo solo vea motivos de rechazo
        da.hasCMR===3 || da.hasFAC===3 || da.estado===9 ? da.motivoRechazo : '--'
      ]);
    });
    
    const columnsWidth = [
      { column: 1, width: 20 },
      { column: 2, width: 20 },
      { column: 3, width: 15 },
      { column: 4, width: 15 },
      { column: 5, width: 20 },
      { column: 6, width: 20 },
      { column: 7, width: 12 },
      { column: 8, width: 20 },
      { column: 9, width: 12 },
      { column: 10, width: 20 },
      { column: 11, width: 30 },
      { column: 12, width: 30 },
      { column: 13, width: 8 },
      { column: 14, width: 10 },
      { column: 15, width: 12 },
      { column: 16, width: 15 },
      { column: 17, width: 15 },
      { column: 18, width: 20 },
      { column: 19, width: 50 }
    ];

    this.excelService.generateExcel(
      this.translate.instant('EXCEL.PHIST_FNAME'),
      this.translate.instant('EXCEL.PHIST_TITLE'),
      headers,
      data,
      columnsWidth);

    this.spinnerService.hide();
  }

  public convertToExcelInternos(): void {
    this.spinnerService.show();

    const headers: string[] = [
      this.translate.instant('PEDIDOS_HIST.TABLE.USUPROV'),
      this.translate.instant('PEDIDOS_HIST.TABLE.TR'),
      this.translate.instant('PEDIDOS_HIST.TABLE.EXPEDIENTE'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.EST_CMR'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.EST_FAC'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.NUM_FAC'),
      this.translate.instant('PEDIDOS_HIST.TABLE.F_CARGA'),
      this.translate.instant('PEDIDOS_HIST.TABLE.REF_CARGA'),
      this.translate.instant('PEDIDOS_HIST.TABLE.F_DESCARGA'),
      this.translate.instant('PEDIDOS_HIST.TABLE.R_DESCARGA'),
      this.translate.instant('PEDIDOS_HIST.TABLE.ORIGEN'),
      this.translate.instant('PEDIDOS_HIST.TABLE.DESTINO'),
      this.translate.instant('PEDIDOS_HIST.TABLE.PALETS'),
      this.translate.instant('PEDIDOS_HIST.TABLE.CAMION'),
      this.translate.instant('PEDIDOS_HIST.TABLE.REMOLQUE'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.F_SUBIDA_CMR'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.F_SUBIDA_FAC'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.F_ENT_REAL'),
      this.translate.instant('PEDIDOS_HIST.EXCEL.ANOTA'),
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
          da.hasFAC===6? 'No contabilizar / Duplicada':
          da.hasFAC===7? 'No Aplica' : 
          da.hasFAC===8? 'Sin Activar' : 'Sin documento',
        da.facNumber ? da.facNumber : 'Sin nº de factura',
        da.fechaCarga ? this.excelService.procesarYtransformarFecha(da.fechaCarga) : '',
        da.refCarga,
        da.fechaDescarga ? this.excelService.procesarYtransformarFecha(da.fechaDescarga) : '',
        da.refDescarga,
        da.origen,
        da.destino,
        da.numPalets,
        da.matriculaCamion,
        da.matriculaRemolque,
        da.fechaSubidaCMR ? this.excelService.transformUTCDate(da.fechaSubidaCMRDate) : '',
        da.fechaSubidaFAC ? this.excelService.transformUTCDate(da.fechaSubidaFACDate) : '',
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
      { column: 6, width: 20 },
      { column: 7, width: 12 },
      { column: 8, width: 20 },
      { column: 9, width: 12 },
      { column: 10, width: 20 },
      { column: 11, width: 30 },
      { column: 12, width: 30 },
      { column: 13, width: 8 },
      { column: 14, width: 10 },
      { column: 15, width: 12 },
      { column: 16, width: 15 },
      { column: 17, width: 15 },
      { column: 18, width: 20 },
      { column: 19, width: 50 }
    ];

    this.excelService.generateExcel(
      this.translate.instant('EXCEL.PHIST_FNAME'),
      this.translate.instant('EXCEL.PHIST_TITLE'),
      headers,
      data,
      columnsWidth);

    this.spinnerService.hide();
  }
  
}
