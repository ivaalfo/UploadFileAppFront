import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AuthService } from '@core/services/auth/auth.service';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';
import { UserRoles } from '@data/user-roles';
import { TranslateService } from '@ngx-translate/core';
import { ModalAction } from '@shared/components/modal/modal-action';
import { Subject, Subscription } from 'rxjs';
import { finalize, map, take, tap } from 'rxjs/operators';
import { PantallaFirmaComponent } from '../../pages/pantallaFirma/pantalla.firma.component';
import { ApiClient } from '@core/services/api/api-client.service';
import { IdleService } from '@core/services/idle/idle-timeout-service';
import { LockEntities } from '@data/shared/locks';
import { ApiLockData, ApiResponseWithData } from '@core/services/api/api.response';
import { FirmadorApiClient } from '@core/services/api/firmador/api-firmador.service';
import { PedidoFirmador, PedidoFirmadorDto } from '@data/pedidos/pedido-firmador';
import { FileUploadApiClient } from '@core/services/api/fileupload/api-file-upload.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';


@Component({
  selector: 'm-view-firma-docs-form',
  templateUrl: './view-firma-docs-form.component.html',
  styleUrls: ['./view-firma-docs-form.component.scss']
})
export class ViewFirmaDocsFormComponent implements OnInit, OnDestroy {

  @Input()
  public opener$!: Subject<ModalAction>;
  
  @Input()
  public pedidoSelected = new PedidoFirmador();
  
  @Output()
  public done = new EventEmitter();

  @Output()
  public cancel = new EventEmitter();
  
  //Referencia al canvas que está dentro de la etiqueta <canvas #canvasFirma>
  @ViewChild('canvasFirma', { static: false }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  public isLoading: boolean = false;  //Mapeado a [canBeClosed]="!isLoading"
  public modalOpener$ = new Subject<ModalAction>();
  private openerSubscription: Subscription | undefined;
    
  public viewCMRheaderText = "";
  public pedidoFirma = new PedidoFirmador();
  
  public stampUrl!: string;
  
  //URL segura
  public pdfRenderUrl: SafeResourceUrl | null = null;
  public fileExtension!: string;
  public filename!: string;
  public rawUrl!: string;
  public cmrBlob!: Blob;
  public isPdfFile = false;

  public formData = new FormData();
  
  //Para bloqueos
  private timeOut = 0;
  private pedidoLocked = false;
  public type!: string;
  public unlockTitle!: string;
  public actionToConfirm!: string;
  public confirmModalOpener$ = new Subject<ModalAction>();

  //Variables necesarias para controlar los formularios y estados
  public tipoFirmaSeleccionada: 'dibujar' | 'subir' = 'dibujar';
  public hayFirmaLista: boolean = false;
  public firmaBase64Data: string | null = null;
  
  //Variables del sistema de dibujo local
  private isDibujando = false;
  private ctx!: CanvasRenderingContext2D;

    
  public constructor (
    private readonly authService: AuthService,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly notification: NotificationService,
    private readonly firmadorComp: PantallaFirmaComponent,
    private readonly apiClient: ApiClient,
    private readonly apiFileUpload: FileUploadApiClient,
    private readonly apiFirmaClient: FirmadorApiClient,
    private readonly translate: TranslateService,
    private readonly idleService: IdleService,
    private sanitizer: DomSanitizer
  ) {}
  
  public ngOnInit(): void {
    this.spinnerService.show();
  
    this.openerSubscription = this.opener$.subscribe(_ => {
      const modalPadre = document.getElementById('signDocsModal');
      if(modalPadre != null){
        modalPadre.style.display = 'block';
      }
      this.modalOpener$.next(ModalAction.Open);
      this.getWatermark();
      this.getPedidoArchivosByTR();
  
      if(!this.isConsultaUser){
        //BLOQUEO el CMR para firma por USERNI
        this.lockForm(true);
        setTimeout(() => {
          this.putPedidoLock();
        }, 555);
      } else {
        this.pedidoSelected.isBlocked = true;
      }
    });
  }
  
  public ngOnDestroy(): void {
    if(this.openerSubscription) {
      this.openerSubscription.unsubscribe();
      this.openerSubscription = undefined;
      this.spinnerService.hide();
  
      //DESBLOQUEO el CMR para firma por USERNI
      this.lockForm(false);
      this.done.emit();
    }
  }
  
  //Cargara el sello de Martico para estamparlo si el CMR es una imagen
  public getWatermark() {
    this.apiFileUpload.getWatermark()
    .subscribe(blob => {
      this.stampUrl = window.URL.createObjectURL(blob);
    }, error => {
      this.pedidoSelected.isBlocked = true;
      console.error('Error descargando o mostrando el sello', error);
      const signError = this.translate.instant('ERROR.DOWNLOAD_SIGN_ERROR');
      this.notification.error(signError, true, false);
    });
  }
  
  private getPedidoArchivosByTR(){
    this.apiFirmaClient.getPedidoFirmaVO(this.pedidoSelected.f3refPed, this.pedidoSelected.f3expediente)
    .pipe(
      take(1),
      map(response => {
        (response.datos) ?
          this.pedidoFirma = PedidoFirmador.parseDto(response.datos as PedidoFirmadorDto)
          :
          this.pedidoFirma = new PedidoFirmador();
      }),
      finalize(() => {
        this.spinnerService.hide();
        if(this.pedidoFirma.f3rutCMR){
          this.getCMR(this.pedidoFirma.f3rutCMR);
        }
      })
    ).subscribe();
  }
  
  private getCMR(rutaCMR: string) {
    const rutaSplit = rutaCMR.split('/');
    this.filename = rutaSplit[rutaSplit.length -1];
    this.viewCMRheaderText = this.translate.instant('FIRMADOR_DOCS.FORM.FILENAME', {filename: this.filename});
    const extSplit = this.filename.split('.');
    this.fileExtension = extSplit[extSplit.length-1];
    this.fileExtension = this.fileExtension.toLowerCase();
      
    if(this.fileExtension =='pdf'){
      this.isPdfFile = true;
    }
      
    this.apiFirmaClient.getCMRfirma(this.pedidoSelected.f3refPed, this.pedidoSelected.f3expediente)
    .subscribe(async (blob) => {
      this.cmrBlob = blob;

      if(this.isPdfFile){   //Se supone que los CMR siempre serán PDFs
        this.drawCMRPdf();
      }
    }, error => {
      this.pedidoSelected.isBlocked = true;
      console.error('Error descargando o mostrando el archivo', error);
      const downloadedError = this.translate.instant('ERROR.DOWNLOAD_FILE_ERROR', {filename: this.filename});
      this.notification.error(downloadedError, true, false);
    });
  }
  
  private async drawCMRPdf(){  
    //1.Creamos la URL del objeto a partir del Blob
    this.rawUrl = window.URL.createObjectURL(this.cmrBlob);
    //2.Concatenamos los parámetros para Chrome/Edge y la pasamos por el Sanitizer de Angular
    //Esto le dice a Angular que la URL es de confianza y permite renderizarla en el iframe
    this.pdfRenderUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.rawUrl + '#toolbar=0&navpanes=0');
    
    this.formData = new FormData;
    this.formData.append("blobFile", this.cmrBlob, this.filename);
    this.formData.append("orderTrack", this.pedidoSelected.f3refPed);
    this.formData.append("orderExp", this.pedidoSelected.f3expediente);
  }
  
  /****************** CANVAS: CONTROL DE BORRADO Y CAMBIO DE MODO **********************/
  public limpiarCanvas() {
    if (this.ctx && this.canvasRef) {
      this.ctx.clearRect(0, 0, this.canvasRef.nativeElement.width, this.canvasRef.nativeElement.height);
    }
    this.hayFirmaLista = false;
    this.firmaBase64Data = null;
  }

  public limpiarDatosFirma() {
    this.hayFirmaLista = false;
    this.firmaBase64Data = null;
    //Si cambia a dibujar, nos aseguramos de vaciar el lienzo viejo si existiese
    if (this.tipoFirmaSeleccionada === 'dibujar') {
      setTimeout(() => this.limpiarCanvas(), 50); //Pequeño delay para asegurar que el DOM responda al hidden
    }
  }

  /****************** CANVAS: MOTOR DE DIBUJO **********************/
  private inicializarContextoCanvas() {
    if (this.canvasRef) {
      const canvas = this.canvasRef.nativeElement;
      
      //Nos aseguramos de tener el contexto 2D creado
      if (!this.ctx) {
        this.ctx = canvas.getContext('2d')!;
      }

      //CORRECCIÓN DEL DESFASE: Sincronizamos el tamaño interno con el real del CSS
      if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        //Si ya había una firma, guardamos los trazos para que no se borren
        let contenidoTemporal: ImageData | null = null;
        if (this.hayFirmaLista) {
          contenidoTemporal = this.ctx.getImageData(0, 0, canvas.width, canvas.height);
        }

        //Ajustamos los píxeles internos exactamente a lo que mide tu contenedor CSS
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        
        //IMPORTANTE: Al cambiar width o height el canvas se resetea. Reconfiguramos el pincel:
        this.ctx.strokeStyle = '#ff7607';     // Color del trazo 
        this.ctx.lineWidth = 3;                 // Grosor del trazo
        this.ctx.lineCap = 'round';             // Acabado redondeado elegante

        //Si había dibujos previos, los restauramos
        if (contenidoTemporal) {
          this.ctx.putImageData(contenidoTemporal, 0, 0);
        }
      }
    }
  }

  public iniciarDibujo(event: MouseEvent) {
    //Sincronizamos tamaños para evitar el salto del cursor
    this.inicializarContextoCanvas();
    
    this.isDibujando = true;
    //Calculamos la posición exacta con las dimensiones reales unificadas
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.ctx.beginPath();
    this.ctx.moveTo(event.clientX - rect.left, event.clientY - rect.top);
  }

  public dibujar(event: MouseEvent) {
    if (!this.isDibujando) return;
    //Calculamos la posición en tiempo real durante el movimiento
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.ctx.lineTo(event.clientX - rect.left, event.clientY - rect.top);
    this.ctx.stroke();
    this.hayFirmaLista = true;    //Cambiamos el estado indicando que ya hay trazo
  }

  public detenerDibujo() {
    if (this.isDibujando) {
      this.isDibujando = false;
      this.ctx.closePath();
      //Guardamos la imagen generada en Base64 en memoria
      this.firmaBase64Data = this.canvasRef.nativeElement.toDataURL('image/png');
    }
  }

  /****************** CANVAS: PROCESAMIENTO DE ARCHIVO SUBIDO **********************/
  public onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (file.type !== 'image/png') {
        alert('Formato incorrecto. Por favor, suba únicamente un archivo PNG.');
        this.limpiarDatosFirma();
        return;
      }

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.firmaBase64Data = e.target.result; // El string Base64 del archivo subido
        this.hayFirmaLista = true;
      };
      reader.readAsDataURL(file);
    }
  }


  /**************************** ACCION FIRMAR *******************************/
  public onSignedCMR(): void {
    //Si el usuario es un proveedor externo, bloqueamos la acción si no ha firmado nada visualmente
    if (this.isExternoUser && !this.hayFirmaLista) {
      alert('Error: Debe dibujar su firma o subir un sello PNG antes de confirmar la operación.');
      return; 
    }

    this.isLoading = true;    //Activamos cargando y desactivamos el modal (canBeClosed = false)

    //Preparamos los parámetros limpios que van al API de Java
    const payloadParaJava = {
      track: this.pedidoSelected.f3refPed,
      exp: this.pedidoSelected.f3expediente,
      refCarga: this.pedidoSelected.f3refCarga,
      //Limpiamos el prefijo 'data:image/png;base64,' del string para mandar los bytes puros
      imagenFirmaBase64: this.firmaBase64Data ? this.firmaBase64Data.replace(/^data:image\/(png|jpg);base64,/, "") : null,
      isFirmaAcumulativa: this.isExternoUser // Bandera para saber en el Back si es interna (1ª firma) o externa (2ª y 3ª)
    };

    console.log("Datos listos para enviar al Endpoint de Java con SD-DSS:", payloadParaJava);

    this.apiFirmaClient.signFile(LockEntities.LOCK_FIRMATOR, payloadParaJava)
    .pipe(take(1))
    .subscribe((response: ApiResponseWithData) => {
      if (response && (!response.errores || response.errores.length === 0)) {
        this.onActionSuccess();
      } else {
        const warnTitle = this.translate.instant("FIRMADOR_DOCS.FORM.ERROR.CMR_SIGN_ERROR", {refped: this.pedidoSelected.f3refPed});
        this.notification.warn(warnTitle, true, true);
        response.errores.forEach(err => {
          const errorTitle = this.translate.instant(err.descripcion);
          this.notification.error(errorTitle, true, false);
        });
        this.onActionFinalize(true);
      }
    }, error => {
      console.error(error);
      const errorTitle = this.translate.instant('FIRMADOR_DOCS.FORM.ERROR.CMR_SIGN_ERROR', {refped: this.pedidoSelected.f3refPed});
      this.onActionFailed(errorTitle);
    });
  }
    
  public onDownloadSignedCMR(): void {
    const a = document.createElement('a');
    a.href = this.rawUrl;
    a.download = this.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    const downloadedTitle = this.translate.instant('FILE_UPLOAD.SUCCES.CMR_DOWNLOADED', {refped: this.pedidoSelected.f3refPed});
    this.notification.info(downloadedTitle, true, true);
  }
  
  public onCancel(unlock?: boolean): void {
    if(unlock){
      this.onActionFinalize(unlock);
    } else {
      this.lockForm(true);
      setTimeout(() => {
        this.putPedidoLock();
      }, 333);
    }
  }
    
  public onActionFinalize(unlock?: boolean) {
    if(unlock) {
      this.lockForm(false);
      this.deletePedidoLock();
    }
    if(this.pedidoSelected) {
      sessionStorage.setItem('reselectPFirmadorTR', this.pedidoSelected.f3refPed.toString());
      sessionStorage.setItem('reselectPFirmadorEXP', this.pedidoSelected.f3expediente.toString());
    }
    this.isLoading = false;
    this.modalOpener$.next(ModalAction.Close);
     
    this.unselectPedido(this.pedidoSelected);
    this.resetVariables();
    this.firmadorComp.getPedidosFirmador();
  }
  
  private onActionFailed(msg: string) {
    this.notification.error(msg, true, false);
    setTimeout((function() {
      document.location.reload();
    }), 3300);
  }
  
  private onActionSuccess() {
    this.spinnerService.show();
    if (this.filename.length > 0) {
      //cmr actualizado
      const successCMR = this.translate.instant("FIRMADOR_DOCS.FORM.SUCCES.CMR_SIGNED", {refped: this.pedidoSelected.f3refPed});
      this.notification.success(successCMR, true, true);
    }
    this.onActionFinalize(true);
  }
  
  private unselectPedido(pedido: PedidoFirmador) {
    pedido.isSelected = false; 
    this.pedidoSelected = new PedidoFirmador();
    this.pedidoSelected.isSelected = false;
  }
  
  private resetVariables() {
    this.isPdfFile = false;
    this.rawUrl = "";
    this.filename = "";
    this.fileExtension = "";
  }
  
  private putPedidoLock() {
    this.apiClient.putLock(LockEntities.LOCK_FIRMATOR, ''+this.pedidoSelected.f3expediente, ''+this.pedidoSelected.f3refPed)
    .pipe(
      take(1),
      tap((resp: ApiLockData) => {
        if(!resp.locked) {
          this.timeOut = resp.timeoutMilliseconds;
          this.checkInactivity(this.timeOut);
        } else {
          //Bloqueado por otro user
          this.pedidoSelected.isBlocked = true;
        }
      })
    )
    .subscribe(res => {
      if (res.locked) {
        this.lockForm(true);
      }
    });
  }
  
  private lockForm(lock: boolean) {
    if(lock) {
      this.pedidoLocked = true;
    } else {
      this.pedidoLocked = false;
      this.pedidoSelected.isBlocked = false;
    }
  }
  
  public checkInactivity(time: number) {
    //Comprobar tiempo de expiración establecido para cancelar el bloqueo
    this.idleService.startWatching(time)
    .pipe(take(1))
    .subscribe((expired: boolean) => {
      if (expired) {
        this.lockForm(false);
        this.deletePedidoLock();
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
  
  private deletePedidoLock() {
    if(!this.pedidoLocked){
      this.apiClient.deleteLock(LockEntities.LOCK_FIRMATOR, ''+this.pedidoSelected.f3expediente, ''+this.pedidoSelected.f3refPed)
      .pipe(take(1))
      .subscribe(() => {
        this.idleService.stopWatching();
      });
    }
  }
  
  private openUnlockByInactivityModal() {
    this.type = "CMR";
    this.unlockTitle = this.translate.instant('ACTION.UNLOCK.TITLE', { model: this.type });
    this.actionToConfirm = 'ACTION.UNLOCK.TEXT';
    this.confirmModalOpener$.next(ModalAction.Open);
  }
  
  public continueLock() {
    this.apiClient.continueLock(LockEntities.LOCK_FIRMATOR, ''+this.pedidoSelected.f3expediente, ''+this.pedidoSelected.f3refPed)
    .pipe(take(1))
    .subscribe();
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
