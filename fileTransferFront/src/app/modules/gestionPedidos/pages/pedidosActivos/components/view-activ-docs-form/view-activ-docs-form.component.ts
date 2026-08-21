import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { FileUploadApiClient } from '@core/services/api/fileupload/api-file-upload.service';
import { AuthService } from '@core/services/auth/auth.service';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';
import { PedidoFiles, PedidoFilesDto } from '@data/pedidos/pedido-files';
import { PedidoProveedor } from '@data/pedidos/pedido-proveedor';
import { UserRoles } from '@data/user-roles';
import { TranslateService } from '@ngx-translate/core';
import { ModalAction } from '@shared/components/modal/modal-action';
import { Subject, Subscription } from 'rxjs';
import { finalize, map, take } from 'rxjs/operators';
import * as Tiff from 'tiff.js';
import { PedidosActivosComponent } from '../../pages/pedidosActivos/pedidos.activos.component';


@Component({
  selector: 'm-view-activ-docs-form',
  templateUrl: './view-activ-docs-form.component.html',
  styleUrls: ['./view-activ-docs-form.component.scss']
})
export class ViewActivDocsFormComponent implements OnInit, OnDestroy {

  @Input()
  public opener$!: Subject<ModalAction>;

  @Input()
  public pedidoSelected = new PedidoProveedor();

  @Output()
  public done = new EventEmitter();

  public labelPass!: string;
  public edit = false;
  public isLoading = false;
  public modalOpener$ = new Subject<ModalAction>();
  public pedidoForm: FormGroup | undefined;
  private openerSubscription: Subscription | undefined;

  public viewValidCMRheaderText = "";
  public pedidoFiles = new PedidoFiles();

  public anotaModalOpener$ = new Subject<ModalAction>();
  public anotaTitle!: string;

  public selectedFile!: File[];

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
  

  public constructor (
    private readonly authService: AuthService,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly formBuilder: FormBuilder,
    private readonly notification: NotificationService,
    private readonly translate: TranslateService,
    private readonly apiFileUpload: FileUploadApiClient,
    private readonly activosComp: PedidosActivosComponent
  ) {
    this.pedidoForm = this.formBuilder.group({
      edit: [false],
    });
  }

  public ngOnInit(): void {
    this.spinnerService.show();
    this.openerSubscription = this.opener$.subscribe(_ => {
      this.spinnerService.show();
      this.modalOpener$.next(ModalAction.Open);
      this.getPedidoArchivos();
    });
  }

  public ngOnDestroy(): void {
    if (this.openerSubscription) {
      this.openerSubscription.unsubscribe();
      this.openerSubscription = undefined;
      this.spinnerService.hide();
    }
  }

  public get isAdminUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Admin ? true : false ;
  }

  private getPedidoArchivos(){
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
          this.getCMRdoc(this.pedidoFiles.rutaCMR);
        }
        if(this.pedidoFiles.rutaFAC){
          this.noFac2show = false;
          this.getFACdoc(this.pedidoFiles.rutaFAC);
        } else {
          this.noFac2show = true;
        }
      })
    ).subscribe();
  }

  private getCMRdoc(rutaCMR: string) {
    const rutaSplit = rutaCMR.split('/');
    this.filename = rutaSplit[rutaSplit.length -1];
    this.viewValidCMRheaderText = this.translate.instant('PEDIDOS_ACTIV.FORM.FILENAME', {filename: this.filename});
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

    this.apiFileUpload.getFile("CMR", this.pedidoSelected.track, this.pedidoSelected.expediente, this.filename)
    .subscribe(async (blob) => {
      this.cmrBlob = blob;
      const url = window.URL.createObjectURL(blob);
      this.imageURL = url;

      this.drawCMRImages();                  
      
    }, error => {
      this.pedidoSelected.isBlocked = true;
      console.error('Error descargando o mostrando el archivo', error);
      const downloadedError = this.translate.instant('ERROR.DOWNLOAD_FILE_ERROR', {filename: this.filename});
      this.notification.error(downloadedError, true, false);
    });
  }
  
  private async drawCMRImages(){
    const imgViewElement = document.getElementById('imgActivDocDiv');
    if(imgViewElement){
      imgViewElement.attributes[1].nodeValue = this.filename;
      imgViewElement.attributes[4].nodeValue = this.imageURL;
    }
    const tifViewElement = document.getElementById('tifActivDocDiv');
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
    const pdfViewElement = document.getElementById('pdfActivDocDiv');
    if(pdfViewElement){
      const iframe = document.getElementById('pdfActivIframe');
      if(iframe){
        const url = window.URL.createObjectURL(this.cmrBlob);
        iframe.attributes[3].nodeValue = url;
        pdfViewElement.appendChild(iframe);
      }
    }
  }

  private getFACdoc(rutaFAC: string) {
    const rutaSplit = rutaFAC.split('/');
    this.filenameFAC = rutaSplit[rutaSplit.length -1];
    const extSplit = this.filenameFAC.split('.');
    this.fileExtensionFAC = extSplit[extSplit.length-1];
    this.fileExtensionFAC = this.fileExtensionFAC.toLowerCase();
    if(this.fileExtensionFAC =='pdf'){    //Siempre sera PDF
      this.isPdfFileFAC = true;
    }

    this.apiFileUpload.getFAC(this.pedidoSelected.track, this.pedidoSelected.expediente, this.filenameFAC)
    .subscribe(async (blob) => {
      this.facBlob = blob;
      const url = window.URL.createObjectURL(blob);
      this.imageURLFAC = url;

      this.drawFACfile();                  
      
    }, error => {
      this.pedidoSelected.isBlocked = true;
      console.error('Error descargando o mostrando el archivo', error);
      const downloadedError = this.translate.instant('ERROR.DOWNLOAD_FILE_ERROR', {filename: this.filenameFAC});
      this.notification.error(downloadedError, true, false);
    });
  }
  
  private async drawFACfile(){
    const pdfViewElement = document.getElementById('pdfActivDocDivFAC');
    if(pdfViewElement){
      const iframe = document.getElementById('pdfActivIframeFAC');
      if(iframe){
        const url = window.URL.createObjectURL(this.facBlob);
        iframe.attributes[3].nodeValue = url;
        pdfViewElement.appendChild(iframe);
      }
    }
  }
  
  public onCancel(): void {
    this.onActionFinalize();
  }

  public downloadCMR(): void {
    const a = document.createElement('a');
    a.href = this.imageURL;
    a.download = this.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    const downloadedTitle = this.translate.instant('FILE_UPLOAD.SUCCES.CMR_DOWNLOADED', {refped: this.pedidoSelected.track});
    this.onActionInfo(downloadedTitle);
  }

  public downloadFAC(): void {
    this.activosComp.onDownloadFAC(this.pedidoSelected);
  }

  private onActionInfo(msg: string) {
    this.notification.info(msg, true, true);
  }

  private onActionFinalize() {
    if(this.pedidoSelected) {
      const track = this.pedidoSelected.track.toString();
      const exp = this.pedidoSelected.expediente.toString();
      sessionStorage.setItem('reselectPedidoTrack', track);
      sessionStorage.setItem('reselectPedidoExp', exp);
    }

    this.isLoading = false;
    this.modalOpener$.next(ModalAction.Close);

    this.unselectPedido(this.pedidoSelected);
    this.resetVariables();
    
    this.activosComp.getPedidos();
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

  public get isExternoUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Externo ? true : false;
  }

}
