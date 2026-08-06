import { Component, OnInit, QueryList, ViewChildren } from '@angular/core';
import { Router } from '@angular/router';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import { PedidoProveedor } from '@data/pedidos/pedido-proveedor';
import { TableHeader } from '@shared/components/table/table-header';
import { TableScroll } from '@shared/components/table/table-scroll';
import { Subject } from 'rxjs';
import { finalize, take, tap } from 'rxjs/operators';
import { RowComponent } from '@shared/components/table/row/row.component';
import { PedidosValidadorApiClient } from '@core/services/api/pedidosValidador/api-pedidos-validador.service';
import { sortByProperty } from '@shared/utils/array-utils';
import { ModalAction } from '@shared/components/modal/modal-action';
import { AuthService } from '@core/services/auth/auth.service';
import { UserRoles } from '@data/user-roles';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'm-pedidos-validador',
  templateUrl: './pedidos.validador.component.html',
  styleUrls: ['./pedidos.validador.component.scss']
})
export class PedidosValidadorComponent implements OnInit {

  @ViewChildren(RowComponent)
  public rows!: QueryList<RowComponent>;

  public tableHeaders: TableHeader[] = this.getTableHeaders();
  
  public pedidos: PedidoProveedor[] = [];
  public loading = false;
  public tableScroller$ = new Subject<TableScroll>();
  
  public selectedPedido: PedidoProveedor = new PedidoProveedor();
  public selectedPedidoNi: 0 | undefined;
  public selectedCMR!: File[];
  
  public viewDocsModalOpener$ = new Subject<ModalAction>();
  public rejectModalOpener$ = new Subject<ModalAction>();
  public rejectTitle!: string;
  public anotaModalOpener$ = new Subject<ModalAction>();
  public anotaTitle!: string;
  
  public not4validate = false;
  private filtrosActivos: { expediente?: string, provName?: string, trFilterValue?: string, refCharge?: string } = {};

  //Definimos la estructura: la clave es el grupTR y el valor es el array de grupNum
  private grupajesAgrupados: { [key: string]: string[] } = {};
  public listaGrupaje: String[] = [];
  public noAplica!: string;

  //Guarda la última ordenacion: { column: 'fechaCarga', directionSort: 'desc' }
  private lastSortEvent: any = null;
  
  
  public constructor (
    private readonly authService: AuthService,
    private readonly apiValidadorClient: PedidosValidadorApiClient,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly router: Router,
    private readonly translate: TranslateService
  ) { }

  public ngOnInit(): void {
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
    this.getPedidosPorValidar();
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
      { title: 'VALIDADOR.TABLE.PROVEEDOR', sorted: true, property: 'proveedor'},
      { title: 'VALIDADOR.TABLE.USUPROV', sorted: true, property: 'proveedorUser'},
      { title: 'VALIDADOR.TABLE.TR', sorted: true, property: 'track'},
      { title: 'VALIDADOR.TABLE.EXPEDIENTE', sorted: true, property: 'expediente'},
      { title: 'VALIDADOR.TABLE.F_CARGA', sorted: true, property: 'fechaCarga'},
      { title: 'VALIDADOR.TABLE.REF_CARGA', sorted: true, property: 'refCarga'},
      { title: 'VALIDADOR.TABLE.F_DESCARGA', sorted: true, property: 'fechaDescarga'},
      { title: 'VALIDADOR.TABLE.R_DESCARGA', sorted: true, property: 'refDescarga'},
      { title: 'VALIDADOR.TABLE.ORIGEN', sorted: true, property: 'origen'},
      { title: 'VALIDADOR.TABLE.DESTINO', sorted: true, property: 'destino'},
      { title: 'VALIDADOR.TABLE.PALETS', sorted: true, property: 'numPalets'},
      { title: 'VALIDADOR.TABLE.CAMION', sorted: true, property: 'matriculaCamion'},
      { title: 'VALIDADOR.TABLE.REMOLQUE', sorted: true, property: 'matriculaRemolque'},
      { title: 'VALIDADOR.TABLE.F_SUBIDA_CMR', sorted: true, property: 'fechaSubidaCMRshort'},
      { title: 'VALIDADOR.TABLE.ANOTACIONES' }
    ];
  }

  public pValidadorTrackById(_: number, item: PedidoProveedor) {
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

  public get canViewPedidosActivos(): boolean {
    return (this.authService.hasRole(UserRoles.Admin) 
      || this.authService.hasRole(UserRoles.Interno)
      || this.authService.hasRole(UserRoles.Consulta)
    );
  }

  public get canViewPedidosHistorico(): boolean {
    return (this.authService.hasRole(UserRoles.Admin) 
      || this.authService.hasRole(UserRoles.Interno)
      || this.authService.hasRole(UserRoles.Consulta)
    );
  }

  public navigateToActivos(): void {
    this.router.navigate(['pedidosActivos']);
  }

  public navigateToHistorico(): void {
    this.router.navigate(['pedidosHistorico']);
  }

  public onDoubleClick(pedido: PedidoProveedor) {
    if(pedido.hasCMR === 7 || pedido.hasCMR === 2) {
      //Si es no aplica, no tiene nada que mostrar
      //Hacemos que el doubleClick no haga nada
      return;
    }
    this.selectPedido(pedido);
    this.onViewCMRselected(pedido);
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

  public onViewCMRselected(pedido: PedidoProveedor): void {
    //GUARDADO PREVENTIVO: Aseguramos que la identidad del pedido esté en sesión
    //antes de que la modal o el cierre puedan limpiar nada.
    const track = pedido.track.toString();
    const exp = pedido.expediente.toString();
    sessionStorage.setItem('reselectTRporValidar', track);
    sessionStorage.setItem('reselectEXPporValidar', exp);

    this.selectedPedido = pedido;
    //Se visualiza el CMR 
    setTimeout(() => {
      this.viewDocsModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public getPedidosPorValidar(filtro?: {expediente?: string, provName?: string, trFilterValue?: string, refCharge?: string}) {
    this.loading = true;
    this.spinnerService.show();
    this.selectedPedido = new PedidoProveedor();

    //Actualizamos los filtros globales por si se llama desde otro sitio
    if(filtro){
      this.filtrosActivos = { ...this.filtrosActivos, ...filtro };
    }
    let paramsToSend = { ...this.filtrosActivos };
    
    this.apiValidadorClient.getByFilters(paramsToSend).pipe(
      take(1),
      tap((pedidos: any) => {
        
        //Limpiamos la referencia global antes de cargar nada nuevo
        this.selectedPedido = new PedidoProveedor();
        
        //Usamos .map() en lugar de .forEach() para generar un nuevo array transformado
        let listaProcesada = pedidos.map((p: any) => {
          const instancia = new PedidoProveedor();
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

        this.tratarGrupajes(this.pedidos);
        //Re-seleccionar y hacer scroll al pedido guardado en sesión
        this.reselectPedidoGuardado();
      }),
      finalize(() => {
        this.loading = false;
        this.spinnerService.hide();
        if(this.pedidos.length === 0){
          this.not4validate = true;
        } else {
          this.not4validate = false;
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
        pedido.isGrupaje = true;
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

  private reselectPedidoGuardado() {
    //RECUPERAR: Buscamos si TR guardado en sessionStorage
    const trGuardado = sessionStorage.getItem('reselectTRporValidar');
    const expGuardado = sessionStorage.getItem('reselectEXPporValidar');
    
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
      sessionStorage.removeItem('reselectTRporValidar');
      sessionStorage.removeItem('reselectEXPporValidar');
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
    this.getPedidosPorValidar();
  }

  public onRejectCMRselected(pedido: PedidoProveedor): void {
    this.selectedPedido = pedido;
    this.rejectTitle = this.translate.instant('VALIDADOR.FORM.ACTIONS.REJECT.CMR_TITLE', { refped: this.selectedPedido.track });
    setTimeout(() => {
      this.rejectModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public onAnotaCMRselected(pedido: PedidoProveedor): void {
    this.selectedPedido = pedido;
    this.anotaTitle = this.translate.instant('VALIDADOR.FORM.ACTIONS.ANOTATION.TITLE', { refped: this.selectedPedido.track });
    setTimeout(() => {
      const modalA = document.getElementById('anotaModalA');
      if (modalA != null) {
        modalA.style.display = 'block';
      }
      this.anotaModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  private selectPedido(pedido: PedidoProveedor) {
    //Limpieza previa
    this.pedidos.forEach(p => {
      p.isSelected = false;       //Sombreado
      p.isCheckActive = false;    //Checkbox individual
    });

    sessionStorage.removeItem('reselectTRporValidar');
    sessionStorage.removeItem('reselectEXPporValidar');

    //Lógica de SOMBREADO (Grupal)
    if(pedido.grupaje && pedido.grupTR){
      //Busco los grupajes que casan el grupTr
      const grSelected = pedido.grupTR;
      this.pedidos.forEach(p => {
        if(p.grupTR === grSelected){
          p.isSelected = true;
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

    this.noAplica = '';
    if(this.selectedPedido.hasCMR===7){
      this.noAplica = this.translate.instant("VALIDADOR.TEXT.NO_APLICA");
    } else if(this.selectedPedido.hasCMR===2){
      this.noAplica = this.translate.instant("VALIDADOR.TEXT.YA_VALIDADO");
    }
  }

  private unselectPedido(pedido: PedidoProveedor) {
    if(pedido){
      pedido.isSelected = false;
      pedido.isCheckActive = false;
    }
    if(this.selectedPedido === pedido) {
      this.selectedPedido = new PedidoProveedor();
      this.selectedPedido.isSelected = false;
      this.selectedPedido.isCheckActive = false;

      //Para los grupajes
      this.pedidos.forEach(p => {
        p.isSelected = false;
        p.isCheckActive = false;
      });

      sessionStorage.removeItem('reselectTRporValidar');
      sessionStorage.removeItem('reselectEXPporValidar');
      this.getPedidosPorValidar(this.filtrosActivos);
    }
  }
  
  public get isConsultaUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Consulta ? true : false;
  }

  public get isExternoUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Externo ? true : false;
  }

  

}
