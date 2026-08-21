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
import { PedidosHistoricoComponent } from '../../pages/pedidosHistorico/pedidos.historico.component';


@Component({
  selector: 'm-view-hist-docs-form',
  templateUrl: './view-hist-docs-form.component.html',
  styleUrls: ['./view-hist-docs-form.component.scss']
})
export class ViewHistDocsFormComponent implements OnInit, OnDestroy {

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
  public modalANOTactiva = false;

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
  public fileNotFound: boolean = false;
  

  public constructor (
    private readonly authService: AuthService,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly formBuilder: FormBuilder,
    private readonly notification: NotificationService,
    private readonly translate: TranslateService,
    private readonly apiFileUpload: FileUploadApiClient,
    private readonly historicoComp: PedidosHistoricoComponent
  ) {
    this.pedidoForm = this.formBuilder.group({
      edit: [false],
    });
  }

  public ngOnInit(): void {
    this.spinnerService.show();
    this.openerSubscription = this.opener$.subscribe(_ => {
      this.modalOpener$.next(ModalAction.Open);
      this.fileNotFound = false;
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
          this.getValidCMR(this.pedidoFiles.rutaCMR);
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

  private getValidCMR(rutaCMR: string) {
    const rutaSplit = rutaCMR.split('/');
    this.filename = rutaSplit[rutaSplit.length -1];
    this.viewValidCMRheaderText = this.translate.instant('PEDIDOS_HIST.FORM.FILENAME', {filename: this.filename});
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

    this.apiFileUpload.getValidCMR(this.pedidoSelected.track, this.pedidoSelected.expediente, this.filename)
    .subscribe(async (blob) => {
      this.cmrBlob = blob;
      const url = window.URL.createObjectURL(blob);
      this.imageURL = url;

      this.drawCMRImages();                  
      
    }, error => {
      this.fileNotFound = true;
      console.error('Error descargando o mostrando el archivo', error);
      const downloadedError = this.translate.instant('ERROR.DOWNLOAD_FILE_ERROR', {filename: this.filename});
      this.notification.error(downloadedError, true, false);
    });
  }
  
  private async drawCMRImages(){
    const imgViewElement = document.getElementById('imgValidDocDiv');
    if(imgViewElement){
      imgViewElement.attributes[1].nodeValue = this.filename;
      imgViewElement.attributes[4].nodeValue = this.imageURL;
    }
    const tifViewElement = document.getElementById('tifValidDocDiv');
    if(tifViewElement){
      tifViewElement.attributes[1].nodeValue = this.filename;
      tifViewElement.attributes[4].nodeValue = this.imageURL;
    }
    const pdfViewElement = document.getElementById('pdfValidDocDiv');
    if(pdfViewElement){
      const iframe = document.getElementById('pdfValidIframe');
      if(iframe){
        const url = window.URL.createObjectURL(this.cmrBlob);
        iframe.attributes[3].nodeValue = url;
        pdfViewElement.appendChild(iframe);
      }
    }
  }

  private getFAC(rutaFAC: string) {
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
      this.fileNotFound = true;
      console.error('Error descargando o mostrando el archivo', error);
      const downloadedError = this.translate.instant('ERROR.DOWNLOAD_FILE_ERROR', {filename: this.filenameFAC});
      this.notification.error(downloadedError, true, false);
    });
  }
  
  private async drawFACfile(){
    const pdfViewElement = document.getElementById('pdfValidDocDivFAC');
    if(pdfViewElement){
      const iframe = document.getElementById('pdfValidIframeFAC');
      if(iframe){
        const url = window.URL.createObjectURL(this.facBlob);
        iframe.attributes[3].nodeValue = url;
        pdfViewElement.appendChild(iframe);
      }
    }
  }
  
  public onCancel(): void {   //Esta modal NO es bloqueante
    this.onActionFinalize();
    
    if(this.modalANOTactiva === true){
      this.spinnerService.show();
      const modalHija = document.getElementById('anotaModalB');
      if(modalHija != null){
        this.modalANOTactiva = false;
        modalHija.style.display = 'none';
      }
    }
    setTimeout(() => {
      this.modalANOTactiva = false;
    }, 333);
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
    this.historicoComp.onDownloadFAC(this.pedidoSelected);
  }

  public anotaCMRselected(): void {
    this.historicoComp.onAnotaCMRselected(this.pedidoSelected)
  }

  private onActionInfo(msg: string) {
    this.notification.info(msg, true, true);
  }

  private onActionFinalize() {
    if(this.pedidoSelected) {
      const track = this.pedidoSelected.track.toString();
      const exp = this.pedidoSelected.expediente.toString();
      sessionStorage.setItem('reselectPHistoricoTR', track);
      sessionStorage.setItem('reselectPHistoricoEXP', exp);
    }

    this.isLoading = false;
    this.modalOpener$.next(ModalAction.Close);

    this.unselectPedido(this.pedidoSelected);
    this.resetVariables();
    this.historicoComp.getPedidosValidados();
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

  public get isConsultaUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Consulta ? true : false;
  }

}
