import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import { TableHeader } from '@shared/components/table/table-header';
import { TableScroll } from '@shared/components/table/table-scroll';
import { Subject } from 'rxjs';
import { finalize, take, tap } from 'rxjs/operators';
import { RowComponent } from '@shared/components/table/row/row.component';
import { sortByProperty } from '@shared/utils/array-utils';
import { ModalAction } from '@shared/components/modal/modal-action';
import { AuthService } from '@core/services/auth/auth.service';
import { UserRoles } from '@data/user-roles';
import { FirmadorApiClient } from '@core/services/api/firmador/api-firmador.service';
import { PedidoFirmador } from '@data/pedidos/pedido-firmador';


@Component({
  selector: 'm-pantalla-firma',
  templateUrl: './pantalla.firma.component.html',
  styleUrls: ['./pantalla.firma.component.scss']
})
export class PantallaFirmaComponent implements OnInit {

  @ViewChildren(RowComponent)
  public rows!: QueryList<RowComponent>;

  public tableHeaders: TableHeader[] = this.getTableHeaders();
  
  public pedidos: PedidoFirmador[] = [];
  public loading = false;
  public tableScroller$ = new Subject<TableScroll>();
  
  public selectedPedido: PedidoFirmador = new PedidoFirmador();
  public selectedPedidoNi: 0 | undefined;
  public selectedCMR!: File[];
  
  public signDocsModalOpener$ = new Subject<ModalAction>();
  //public fileURL!: string;
  public noResults2sign = false;
  private filtrosActivos: { expFilterValue?: string, provName?: string, trFilterValue?: string, refCharge?: string } = {};

  //Guarda la última ordenacion: { column: 'fechaCarga', directionSort: 'desc' }
  private lastSortEvent: any = null;


  public constructor (
    private readonly authService: AuthService,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly apiFirmadorClient: FirmadorApiClient,
  ) { }

  public ngOnInit(): void {
    const expSaved = sessionStorage.getItem('filteredEXP');
    const userSaved = sessionStorage.getItem('filteredUSER');
    const trackSaved = sessionStorage.getItem('filteredTR');
    const rcharSaved = sessionStorage.getItem('filteredRCARGA');
    this.filtrosActivos = {
      expFilterValue: expSaved || undefined,
      provName: userSaved || undefined,
      trFilterValue: trackSaved || undefined,
      refCharge: rcharSaved || undefined
    };
    this.getPedidosFirmador();
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
      { title: 'FIRMADOR_DOCS.TABLE.REFPED', sorted: true, property: 'f3refPed'},
      { title: 'FIRMADOR_DOCS.TABLE.EXPEDI', sorted: true, property: 'f3expediente'},
      { title: 'FIRMADOR_DOCS.TABLE.RCARGA', sorted: true, property: 'f3refCarga'},
      { title: 'FIRMADOR_DOCS.TABLE.MATRIC', sorted: true, property: 'f3matricula'},
      { title: 'FIRMADOR_DOCS.TABLE.REMOLQ', sorted: true, property: 'f3remolque'},
      //{ title: 'FIRMADOR_DOCS.TABLE.USECMR', sorted: true, property: 'f3useCMR'},
      //{ title: 'FIRMADOR_DOCS.TABLE.CLICOD', sorted: true, property: 'f3cliCod'},
      { title: 'FIRMADOR_DOCS.TABLE.USUPROV', sorted: true, property: 'provUser'},
      //{ title: 'FIRMADOR_DOCS.TABLE.DESCOD', sorted: true, property: 'f3destCod'},
      { title: 'FIRMADOR_DOCS.TABLE.USUDEST', sorted: true, property: 'destUser'},
      { title: 'FIRMADOR_DOCS.TABLE.FECCM1', sorted: true, property: 'f3fechaCreacionCMR'},
      { title: 'FIRMADOR_DOCS.TABLE.FECCM2', sorted: true, property: 'f3fechaFirmaTrans'},
      { title: 'FIRMADOR_DOCS.TABLE.FECCM3', sorted: true, property: 'f3fechaFirmaDest'},
      { title: 'FIRMADOR_DOCS.TABLE.ESTADO', sorted: true, property: 'f3estado'}
    ];
  }

  public pFirmTrackById(_: number, item: PedidoFirmador) {
    return item.f3refPed + '-' + item.f3expediente;
  }

  public onCheckboxChanged(event: UIEvent, pedido: PedidoFirmador): void {
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

  public onDoubleClick(pedido: PedidoFirmador) {
    this.selectPedido(pedido);
    this.onViewCMRselected(pedido);
  }

  public onClick(pedido: PedidoFirmador){
    if(this.selectedPedido !== pedido){
      this.selectedPedido.isCheckActive = false;
      this.selectedPedido.isSelected = false;
      this.selectPedido(pedido);
    } else {
      this.unselectPedido(pedido);
    }
  }

  public onViewCMRselected(pedido: PedidoFirmador): void {
    //GUARDADO PREVENTIVO: Aseguramos que la identidad del pedido esté en sesión
    //antes de que la modal o el cierre puedan limpiar nada.
    const tr = pedido.f3refPed.toString();
    const exp = pedido.f3expediente.toString();
    sessionStorage.setItem('reselectPFirmadorTR', tr);
    sessionStorage.setItem('reselectPFirmadorEXP', exp);

    this.selectedPedido = pedido;
    //Se visualiza el CMR 
    setTimeout(() => {
      this.signDocsModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public getPedidosFirmador(filtro?: {expFilterValue?: string, provName?: string, trFilterValue?: string, refCharge?: string}) {
    this.loading = true;
    this.spinnerService.show();
    this.selectedPedido = new PedidoFirmador();

    //Actualizamos los filtros globales por si se llama desde otro sitio
    if(filtro){
      this.filtrosActivos = { ...this.filtrosActivos, ...filtro};
    }
    let paramsToSend = { ...this.filtrosActivos };

    this.apiFirmadorClient.getByFilters(paramsToSend).pipe(
      take(1),
      tap((pedidos: any) => {

        //Limpiamos la referencia global antes de cargar nada nuevo
        this.selectedPedido = new PedidoFirmador();
        
        //Usamos .map() en lugar de .forEach() para generar un nuevo array transformado
        let listaProcesada = pedidos.map((p: any) => {
          const instancia = new PedidoFirmador();
          Object.assign(instancia, p);
          instancia.isSelected = false;
          instancia.isCheckActive = false;
          return instancia;   //Importante devolver el objeto
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
        //Re-seleccionar y hacer scroll al pedido guardado en sesión
        this.reselectPedidoGuardado();
      }),
      finalize(() => {
        this.loading = false;
        this.spinnerService.hide();
        if(this.pedidos.length === 0){
          this.noResults2sign = true;
        } else {
          this.noResults2sign = false;
        }
      })
    )
    .subscribe();
  }

  private reselectPedidoGuardado(){
    //RECUPERAR: Buscamos si TR guardado en sessionStorage
    const trGuardado = sessionStorage.getItem('reselectPFirmadorTR');
    const expGuardado = sessionStorage.getItem('reselectPFirmadorEXP');
    
    if(trGuardado && expGuardado) {
      //console.log('Buscando para re-seleccionar:', trGuardado, expGuardado);
      this.pedidos.forEach(p => {
        p.isSelected = false;
        p.isCheckActive = false;
      });

      const pedidoEncontrado = this.pedidos.find(p => 
        p.f3refPed.toString() === trGuardado && p.f3expediente.toString() === expGuardado
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
      sessionStorage.removeItem('reselectPFirmadorTR');
      sessionStorage.removeItem('reselectPFirmadorEXP');
    }
  }

  public limpiarFiltros(): void {
    //Reseteo el orden para que la tabla no se ordene sola al recargar
    this.lastSortEvent = null;
    
    this.filtrosActivos = {
      expFilterValue: sessionStorage.getItem('filteredEXP') || undefined,
      provName: sessionStorage.getItem('filteredUSER') || undefined,
      trFilterValue: sessionStorage.getItem('filteredTR') || undefined,
      refCharge: sessionStorage.getItem('filteredRCARGA') || undefined
    };

    this.tableHeaders = [...this.getTableHeaders()];
    this.getPedidosFirmador();
  }

  private selectPedido(pedido: PedidoFirmador) {
    //Limpieza previa
    this.pedidos.forEach(p => {
      p.isSelected = false;       //Sombreado
      p.isCheckActive = false;    //Checkbox individual
    });

    sessionStorage.removeItem('reselectPFirmadorTR');
    sessionStorage.removeItem('reselectPFirmadorEXP');

    //Lógica de SOMBREADO (Grupal)
    //Para lass filas de seleccion simple
    pedido.isSelected = true;
    
    //Lógica de CHECKBOX (Individual)
    this.selectedPedido = pedido;
    this.selectedPedido.isCheckActive = true;
  }

  private unselectPedido(pedido: PedidoFirmador) {
    if(pedido){
      pedido.isSelected = false;
      pedido.isCheckActive = false;
    }
    if(this.selectedPedido === pedido) {
      this.selectedPedido = new PedidoFirmador();
      this.selectedPedido.isSelected = false;
      this.selectedPedido.isCheckActive = false;

      sessionStorage.removeItem('reselectPFirmadorTR');
      sessionStorage.removeItem('reselectPFirmadorEXP');
      this.getPedidosFirmador(this.filtrosActivos);
    }
  }

  
  /* POR SI PONGO EL DESCARGAR DE CMRs EN EL FUTURO

  public onDownloadCMR(pedido: PedidoProveedor) {
    this.selectPedido(pedido);
    this.getPedidoArchivos(pedido, "CMR");
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
      dTitle = this.translate.instant('FILE_UPLOAD.SUCCES.CMR_DOWNLOADED', {refped: this.selectedPedido.track});
    } else if(fileType == "FAC"){
      dTitle = this.translate.instant('FILE_UPLOAD.SUCCES.FAC_DOWNLOADED', {refped: this.selectedPedido.track});
    } else if(fileType == "OTR"){
      dTitle = this.translate.instant('FILE_UPLOAD.SUCCES.OTR_DOWNLOADED', {refped: this.selectedPedido.track});
    }
    this.onActionInfo(dTitle);
  }

  private onActionInfo(msg: string) {
    this.notification.info(msg, true, true);
  }*/

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
  
}
