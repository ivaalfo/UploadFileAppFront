import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { ApiClient } from '@core/services/api/api-client.service';
import { ApiLockData, ApiResponseWithData } from '@core/services/api/api.response';
import { FileUploadApiClient } from '@core/services/api/fileupload/api-file-upload.service';
import { PedidosActivosApiClient } from '@core/services/api/pedidosActivos/api-pedidos-activos.service';
import { AuthService } from '@core/services/auth/auth.service';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import { IdleService } from '@core/services/idle/idle-timeout-service';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';
import { PedidoFiles, PedidoFilesDto } from '@data/pedidos/pedido-files';
import { PedidoProveedor, PedidoProveedorDto } from '@data/pedidos/pedido-proveedor';
import { LockEntities } from '@data/shared/locks';
import { UserRoles } from '@data/user-roles';
import { PedidosValidadorComponent } from '@modules/pedidosValidador/pages/pedidosValidador/pedidos.validador.component';
import { TranslateService } from '@ngx-translate/core';
import { ModalAction } from '@shared/components/modal/modal-action';
import { Subject, Subscription } from 'rxjs';
import { finalize, map, take, tap } from 'rxjs/operators';
import * as Tiff from 'tiff.js';


@Component({
  selector: 'm-view-val-docs-form',
  templateUrl: './view-val-docs-form.component.html',
  styleUrls: ['./view-val-docs-form.component.scss']
})
export class ViewValDocsFormComponent implements OnInit, OnDestroy {

  @Input()
  public opener$!: Subject<ModalAction>;

  @Input()
  public pedidoSelected = new PedidoProveedor();

  @Output()
  public done = new EventEmitter();

  @Output()
  public cancel = new EventEmitter();

  @ViewChild('tiffCanvas', { static: false }) tiffCanvas!: ElementRef<HTMLCanvasElement>;

  public isLoading = false;
  public modalOpener$ = new Subject<ModalAction>();
  private openerSubscription: Subscription | undefined;
  
  public viewCMRheaderText = "";
  public pedidoFiles = new PedidoFiles();

  public signUrl!: string;

  public cmrPath!: string;
  public fileExtension!: string;
  public filename!: string;
  public imageURL!: string;
  public cmrBlob!: Blob;

  public fileExtensionFAC!: string;
  public filenameFAC!: string;
  public imageURLFAC!: string;
  public facBlob!: Blob;

  public isImgFile = false;
  public isPdfFile = false;
  public isTifFile = false;
  public isImgFileFAC = false;
  public isPdfFileFAC = false;
  public isTifFileFAC = false;

  public noFac2show = false;

  public formData = new FormData;
  public imagenes: string[] = [];

  public actionToConfirm!: string;
  public rejectModalOpener$ = new Subject<ModalAction>();
  public rejectTitle!: string;
  public modalREJCTactiva = false;

  public anotaModalOpener$ = new Subject<ModalAction>();
  public anotaTitle!: string;
  public modalANOTactiva = false;

  public rejectFACmodalOpener$= new Subject<ModalAction>();
  public rejectFACtitle!: string;
  public modalREJCTFACactiva = false;

  //Para bloqueos
  private timeOut = 0;
  private pedidoLocked = false;
  public type!: string;
  public unlockTitle!: string;
  public confirmModalOpener$ = new Subject<ModalAction>();

  //Añade una variable para controlar la suscripción de las notas arriba junto a las otras
  private anotaSubscription: Subscription = new Subscription();
  

  public constructor (
    private readonly authService: AuthService,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly notification: NotificationService,
    private readonly apiFileUpload: FileUploadApiClient,
    private readonly validadorComp: PedidosValidadorComponent,
    private readonly translate: TranslateService,
    private readonly apiClient: ApiClient,
    private readonly idleService: IdleService,
    private readonly apiPactivosClient: PedidosActivosApiClient
  ) {}

  public ngOnInit(): void {
    this.spinnerService.show();

    //ESCUCHA GLOBAL del cierre de la Modal-C (anotaciones)
    //Sin take(1) para que funcione cada vez que el usuario guarde una nota
    if(this.anotaModalOpener$) {
      this.anotaSubscription = this.anotaModalOpener$.subscribe((accion: ModalAction) => {
        if(accion === ModalAction.Close) {
          this.refrescarDatosPedido(); 
        }
      });
    }

    this.openerSubscription = this.opener$.subscribe(_ => {
      const modalPadre = document.getElementById('viewValDocsModal');
      if(modalPadre != null){
        modalPadre.style.display = 'block';
      }
      this.modalOpener$.next(ModalAction.Open);
      this.getSIGN();
      this.getPedidoArchivosByTR();

      if(!this.isConsultaUser){
        //BLOQUEO el CMR para validacion por USERNI
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
    if(this.anotaSubscription) this.anotaSubscription.unsubscribe();
    if(this.openerSubscription) {
      this.openerSubscription.unsubscribe();
      this.openerSubscription = undefined;
      this.spinnerService.hide();

      //DESBLOQUEO el CMR para validacion por USERNI
      this.lockForm(false);
      this.done.emit();
    }
  }

  public getSIGN() {
    this.apiFileUpload.getSIGN()
    .subscribe(blob => {
      this.signUrl = window.URL.createObjectURL(blob);
    }, error => {
      console.error('Error downloading or displaying the sign. ', error);
      const signError = this.translate.instant('ERROR.DOWNLOAD_SIGN_ERROR');
      this.notification.error(signError, true, true);
    });
  }

  public onValidateCMR(): void {
    this.isLoading = true;
    this.apiFileUpload.validateFile(LockEntities.LOCK_VALIDATOR, this.formData)
    .pipe(
      take(1)
    )
    .subscribe((response: ApiResponseWithData) => {
      if (response && (!response.errores || response.errores.length === 0)) {
        this.onActionSuccess();
      } else {
        const warnTitle = this.translate.instant("VALIDADOR.FORM.ERROR.CMR_VALIDATION_ERROR", {refped: this.pedidoSelected.track});
        this.notification.warn(warnTitle, true, true);
        response.errores.forEach(err => {
          const errorTitle = this.translate.instant(err.descripcion);
          this.notification.error(errorTitle, true, true);
        });
        this.onActionFinalize(true);
      }
    }, error => {
      console.error(error);
      const errorTitle = this.translate.instant('VALIDADOR.FORM.ERROR.CMR_VALIDATION_ERROR', {refped: this.pedidoSelected.track});
      this.onActionFailed(errorTitle);
    });
  }
  
  public onRejectCMR(pedido: PedidoProveedor): void {
    this.pedidoSelected = pedido;
    this.rejectTitle = this.translate.instant('VALIDADOR.FORM.ACTIONS.REJECT.CMR_TITLE', {refped: this.pedidoSelected.track});
    setTimeout(() => {
      this.modalREJCTactiva = true;
      const modalHija = document.getElementById('rejectModalB');
      if(modalHija != null){
        modalHija.style.display = 'block';
      }
      this.rejectModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public onAnotaCMR(pedido: PedidoProveedor): void {
    this.pedidoSelected = pedido;
    this.anotaTitle = this.translate.instant('VALIDADOR.FORM.ACTIONS.ANOTATION.TITLE', {refped: this.pedidoSelected.track});
    setTimeout(() => {
      this.modalANOTactiva = true;
      const modalHija = document.getElementById('anotaModalB');
      if(modalHija != null){
        modalHija.style.display = 'block';
      }
      this.anotaModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public onRejectFAC(pedido: PedidoProveedor): void {
    this.pedidoSelected = pedido;
    this.rejectFACtitle = this.translate.instant('VALIDADOR.FORM.ACTIONS.REJECT.FAC_TITLE', {refped: this.pedidoSelected.track});
    setTimeout(() => {
      this.modalREJCTFACactiva = true;
      const modalHija = document.getElementById('rejectFACmodal');
      if(modalHija != null){
        modalHija.style.display = 'block';
      }
      this.rejectFACmodalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public onCancel(unlock?: boolean): void {
    if(unlock){
      this.onActionFinalize(unlock);
      
      if(this.modalREJCTactiva === true){
        this.spinnerService.show();
        const modalHija = document.getElementById('rejectModalB');
        if(modalHija != null){
          this.modalREJCTactiva = false;
          modalHija.style.display = 'none';
        }
      }
      if(this.modalANOTactiva === true){
        this.spinnerService.show();
        const modalHija = document.getElementById('anotaModalB');
        if(modalHija != null){
          this.modalANOTactiva = false;
          modalHija.style.display = 'none';
        }
      }
      if(this.modalREJCTFACactiva === true){
        this.spinnerService.show();
        const modalHija = document.getElementById('rejectFACmodal');
        if(modalHija != null){
          this.modalREJCTFACactiva = false;
          modalHija.style.display = 'none';
        }
      }
    } else {
      this.lockForm(true);
      setTimeout(() => {
        this.modalREJCTactiva = false;
        this.modalANOTactiva = false;
        this.modalREJCTFACactiva = false;
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
      sessionStorage.setItem('reselectTRporValidar', this.pedidoSelected.track.toString());
      sessionStorage.setItem('reselectEXPporValidar', this.pedidoSelected.expediente.toString());
    }

    this.isLoading = false;
    this.modalOpener$.next(ModalAction.Close);
    
    this.unselectPedido(this.pedidoSelected);
    this.resetVariables();
    this.validadorComp.getPedidosPorValidar();
  }

  private getPedidoArchivosByTR(){
    this.apiFileUpload.getPedidoFilesVO(this.pedidoSelected.track, this.pedidoSelected.expediente)
    .pipe(
      take(1),
      map(response => {
        (response.datos) ?
          this.pedidoFiles = PedidoFiles.parseDto(response.datos as PedidoFilesDto)
          :
          this.pedidoFiles = new PedidoFiles();
      }),
      finalize(() => {
        this.spinnerService.hide();
        if(this.pedidoFiles.rutaCMR){
          this.getCMR(this.pedidoFiles.rutaCMR);
        }
        if(this.pedidoFiles.rutaFAC){
          this.noFac2show = false;
          this.getFAC(this.pedidoFiles.rutaFAC);
        } else {
          this.noFac2show = true;
        }
      })
    ).subscribe();
  }

  private getCMR(rutaCMR: string) {
    const rutaSplit = rutaCMR.split('/');
    this.filename = rutaSplit[rutaSplit.length -1];
    this.viewCMRheaderText = this.translate.instant('VALIDADOR.FORM.FILENAME', {filename: this.filename});
    const extSplit = this.filename.split('.');
    this.fileExtension = extSplit[extSplit.length-1];
    this.fileExtension = this.fileExtension.toLowerCase();
    if(this.fileExtension =='png' || this.fileExtension =='jpg' || this.fileExtension =='jpeg'){
      this.isImgFile = true;
    } else if(this.fileExtension =='pdf'){
      this.isPdfFile = true;
    } else if(this.fileExtension =='tif' || this.fileExtension =='tiff'){
      this.isTifFile = true;
    }
    
    this.apiFileUpload.getCMR(this.pedidoSelected.track, this.pedidoSelected.expediente)
    .subscribe(async (blob) => {
      this.cmrBlob = blob;
      const url = window.URL.createObjectURL(blob);
      this.imageURL = url;

      if(!this.isPdfFile){
        this.drawImages();
      }
      if(this.isPdfFile){
        this.drawCMRPdf();
      }
    }, error => {
      console.error('Error descargando archivo', error);
      const downloadedError = this.translate.instant('ERROR.DOWNLOAD_FILE_ERROR');
      this.notification.error(downloadedError, true, true);
    });
  }

  private async drawImages() {
    const imgViewElement = document.getElementById('imgDocDiv');
    if(imgViewElement){
      imgViewElement.attributes[1].nodeValue = this.filename;
      imgViewElement.attributes[4].nodeValue = this.imageURL;
    }
    const tifViewElement = document.getElementById('tifDocDiv');
    if(tifViewElement){
      //Conversion .tif -> .jpeg
      const arrayBuffer = await new Response(this.cmrBlob).arrayBuffer();
      const tiff = new Tiff({ buffer: arrayBuffer });
      const tiffCanvas = tiff.toCanvas();
      const imgsrc = tiffCanvas.toDataURL('image/jpeg');
      this.imageURL = imgsrc;
      tifViewElement.attributes[1].nodeValue = this.filename;
      tifViewElement.attributes[4].nodeValue = this.imageURL;
    }
    let canvasFormat = "";
    if(this.isImgFile){
      canvasFormat = "imgCanvasDiv";
    } else if(this.isTifFile){
      canvasFormat = "tifCanvasDiv";
    }
    this.overlayImages(canvasFormat);
  }

  private async overlayImages(canvasDiv: string) {
    const jpgImage = new Image();
    jpgImage.src = this.imageURL;
    const pngImage = new Image();
    pngImage.src = this.signUrl;

    const canvas = document.getElementById(canvasDiv) as HTMLCanvasElement;
    if(canvas){
      this.loadImages(jpgImage, pngImage, canvas);
    }
  }

  private async loadImages(jpgImage: HTMLImageElement, pngImage: HTMLImageElement, canvas: HTMLCanvasElement){
    try {
      const waitForLoad = (img: HTMLImageElement) => {
        return new Promise((resolve, reject) => {
          if(img.complete) resolve(img);
          img.onload = () => resolve(img);
          img.onerror = () => reject(new Error(`Error cargando imagen: ${img.src}`));
        });
      };

      await Promise.all([waitForLoad(jpgImage), waitForLoad(pngImage)]);
      //console.log("Ancho_A: " + jpgImage.naturalWidth + ", Alto_A: " + jpgImage.naturalHeight);
      canvas.width = jpgImage.naturalWidth;
      canvas.height = jpgImage.naturalHeight;
      
      const ctx = canvas.getContext('2d');   
      if (!ctx) throw new Error('Could not get 2D context');
      
      ctx.drawImage(jpgImage, 0, 0, jpgImage.naturalWidth, jpgImage.naturalHeight);
      //console.log("Ancho_B: " + pngImage.naturalWidth + ", Alto_B: " + pngImage.naturalHeight);  
      const xPos = jpgImage.naturalWidth-(pngImage.naturalWidth+40);
      const yPos = jpgImage.naturalHeight-(pngImage.naturalHeight+40);
            
      //Ajusta la posición y tamaño de la firma.png
      ctx.drawImage(pngImage, xPos, yPos, pngImage.naturalWidth, pngImage.naturalHeight);
        
      const blob = await new Promise<Blob | null>((resolve) => 
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.6)     //Se comprimirá al 60% de su calidad original
      );

      if (blob) {
        this.formData = new FormData;
        this.formData.append("signedFile", blob, this.filename);
        this.formData.append("orderTrack", this.pedidoSelected.track);
        this.formData.append("orderExp", this.pedidoSelected.expediente);
        console.log(this.formData);
      } else {
        console.error('Could not create blob');
      }

    } catch (error){
      console.error("Error procesando imágenes:", error);
    }
  }

  private async drawCMRPdf(){
    const pdfViewElement = document.getElementById('pdfDocDiv');
    if(pdfViewElement){
      const iframe = document.getElementById('pdfIframe');
      if(iframe){
        const url = window.URL.createObjectURL(this.cmrBlob);
        iframe.attributes[3].nodeValue = url;
        pdfViewElement.appendChild(iframe);
      }
    }
    this.formData = new FormData;
    this.formData.append("signedFile", this.cmrBlob, this.filename);
    this.formData.append("orderTrack", this.pedidoSelected.track);
    this.formData.append("orderExp", this.pedidoSelected.expediente);
  }

  private getFAC(rutaFAC: string) {
    const rutaSplit = rutaFAC.split('/');
    this.filenameFAC = rutaSplit[rutaSplit.length -1];
    const extSplit = this.filenameFAC.split('.');
    this.fileExtensionFAC = extSplit[extSplit.length-1];
    this.fileExtensionFAC = this.fileExtensionFAC.toLowerCase(); 
    if(this.fileExtensionFAC =='pdf'){   //Siempre sera PDF
      this.isPdfFileFAC = true;
    }
    
    this.apiFileUpload.getFAC(this.pedidoSelected.track, this.pedidoSelected.expediente, this.filenameFAC)
    .subscribe(async (blob) => {
      this.facBlob = blob;
      const url = window.URL.createObjectURL(blob);
      this.imageURLFAC = url;

      this.drawFACfile();

    }, error => {
      console.error('Error descargando archivo', error);
      const downloadedError = this.translate.instant('ERROR.DOWNLOAD_FILE_ERROR');
      this.notification.error(downloadedError, true, true);
    });
  }

  private async drawFACfile(){
    const pdfViewElement = document.getElementById('pdfDocDivFAC');
    if(pdfViewElement){
      const iframe = document.getElementById('pdfIframeFAC');
      if(iframe){
        const url = window.URL.createObjectURL(this.facBlob);
        iframe.attributes[3].nodeValue = url;
        pdfViewElement.appendChild(iframe);
      }
    }
  }

  private onActionFailed(msg: string) {
    this.notification.error(msg, true, true);
    setTimeout((function() {
      document.location.reload();
    }), 3300);
  }

  private onActionSuccess() {
    this.spinnerService.show();
    if (this.filename.length > 0) {
      //cmr actualizado
      const successCMR = this.translate.instant("VALIDADOR.FORM.SUCCES.CMR_VALIDATED", {refped: this.pedidoSelected.track});
      this.notification.success(successCMR, true, true);
    }
    this.onActionFinalize(true);
  }

  private unselectPedido(pedido: PedidoProveedor) {
    pedido.isSelected = false; 
    this.pedidoSelected = new PedidoProveedor();
    this.pedidoSelected.isSelected = false;
  }

  private resetVariables() {
    this.isImgFile = false;
    this.isPdfFile = false;
    this.isTifFile = false;
    this.imageURL = "";
    this.filename = "";
    this.fileExtension = "";

    this.isImgFileFAC = false;
    this.isPdfFileFAC = false;
    this.isTifFileFAC = false;
    this.imageURLFAC = "";
    this.filenameFAC = "";
    this.fileExtensionFAC = "";
  }

  private putPedidoLock() {
    this.apiClient.putLock(LockEntities.LOCK_VALIDATOR, ''+this.pedidoSelected.expediente, ''+this.pedidoSelected.track)
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
      this.apiClient.deleteLock(LockEntities.LOCK_VALIDATOR, ''+this.pedidoSelected.expediente, ''+this.pedidoSelected.track)
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
    this.apiClient.continueLock(LockEntities.LOCK_VALIDATOR, ''+this.pedidoSelected.expediente, ''+this.pedidoSelected.track)
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

  public refrescarDatosPedido(): void {
    this.apiPactivosClient.getPedidoProv(this.pedidoSelected.track, this.pedidoSelected.expediente)
    .pipe(
      take(1),
      map(response => { 
        if (response && response.datos) {
          this.pedidoSelected = PedidoProveedor.parseDto(response.datos as PedidoProveedorDto);
        } else {
          this.pedidoSelected = new PedidoProveedor();
        }
      }),
    ).subscribe();
  }

}
