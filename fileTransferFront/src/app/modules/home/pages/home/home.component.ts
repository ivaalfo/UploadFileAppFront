import { Component } from '@angular/core';
//import { NotificationService } from '@core/services/notifications/toaster-notification.service';
//import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
//import { FileUploadApiClient } from '@core/services/api/fileupload/api-file-upload.service';
//import { take } from 'rxjs/operators';
import { AuthService } from '@core/services/auth/auth.service';
import { UserRoles } from '@data/user-roles';
//import { Subject } from 'rxjs';
//import { ModalAction } from '@shared/components/modal/modal-action';
//import { ApiClient } from '@core/services/api/api-client.service';
//import { take, finalize, map } from 'rxjs/operators';
//import { NotificationService } from '@core/services/notifications/toaster-notification.service';
//import { Router } from '@angular/router';


@Component({
  selector: 'm-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {

  //public search!: string;

  public formData = new FormData;
  public selectedFiles!: File[];

  public constructor(
    private readonly authService: AuthService,
    //private notification: NotificationService,
    //private spinnerService: GlobalSpinnerService,
    //private apiFileUpload: FileUploadApiClient,
    //private readonly apiClient: ApiClient,
    //private readonly router: Router
  ) { }

  public ngOnInit(): void {
    this.selectedFiles = [];
  }

  public submit(): void {
    //if (this.search.length >= 4) {
      //this.searchCall(this.search);
    //}
    //this.onPostUpload();
  }

  //public onKeyDownHandler(event: any): void {
    //const codigo = event.which || event.keyCode;
    //if (codigo === 13 && this.search.length >= 4) {
     //this.searchCall(this.search);
    //}
  //}

  /*private searchCall(key: string) {
    this.articles = [];
    this.containers = [];
    this.apiClient.searchContainerArticles(key)
    .pipe(
      take(1),
      map((resp: any) => {
      if (resp.contenedoresNum === 0 && resp.articulosNum === 0 ) {
        this.notification.warn('ARTICLE_CONTAINER_NOT_FOUND');
      } else if (resp.contenedoresNum !== 0 ) {
        resp.contenedores.forEach((art: ContainerDto) => {
          const newContainer = Container.parseDto(art as ContainerDto);
          this.containers.push(newContainer);
        });
      } else if (resp.articulosNum !== 0 ) {
        resp.articulos.forEach((art: ArticleDto) => {
          const newArticle = Article.parseDto(art as ArticleDto);
          this.articles.push(newArticle);
        });
      }
    }),
      finalize(() => {
        if (this.articles.length !== 0) {
          if (this.articles.length === 1) {
            this.router.navigate(['/arrivals', 'article', this.articles[0].articuloKey]);
          } else {
            this.showArticleByArrivalModal();
          }
        } else if (this.containers.length !== 0) {
          if (this.containers.length === 1) {
            this.router.navigate(['/transport', 'container', this.containers[0].contenedorKey]);
          } else {
            this.showContainerListModal();
          }
        }
      })
    )
    .subscribe();
  }*/

  public get canViewPedidosActivos(): boolean {
    return (this.authService.hasRole(UserRoles.Admin) 
      || this.authService.hasRole(UserRoles.Interno)
      || this.authService.hasRole(UserRoles.Consulta)
      || this.authService.hasRole(UserRoles.Externo)
    );
  }

  public get canViewPedidosValidador(): boolean {
    return (this.authService.hasRole(UserRoles.Admin) 
      || this.authService.hasRole(UserRoles.Interno)
      || this.authService.hasRole(UserRoles.Consulta)
    );
  }
  
  public get canViewPedidosHistorico(): boolean {
    return (this.authService.hasRole(UserRoles.Admin) 
      || this.authService.hasRole(UserRoles.Interno)
      || this.authService.hasRole(UserRoles.Consulta)
      || this.authService.hasRole(UserRoles.Externo)
    );
  }
  
  public get canViewMaintenanceUsers(): boolean {
    return (this.authService.hasRole(UserRoles.Admin) 
      || this.authService.hasRole(UserRoles.Interno)
      || this.authService.hasRole(UserRoles.Consulta)
      || this.authService.hasRole(UserRoles.Externo)
    );
  }

  /********** ESTA PARTE DE FICHEROS DESAPARECERÁ ************************/
  /********** SE PODRIA PONER UN BUSCADOR/VISOR DE DOCUMENTOS CMRs/FACs ************************/

  /*public onFileSelected(event: any): void {
    const et = event.target;
    if (et.files && et.files.length > 0) {
      for (let i = 0; i < et.files.length; i++) {
        this.selectedFiles[i] = et.files[i];
        this.formData.append("OTR_files", et.files[i], et.files[i].name);
      }
    }
  }

  public onPostUpload() {
    if(this.selectedFiles.length > 0) {
      this.spinnerService.show();
      this.apiFileUpload.fileUpload(this.formData)
        .pipe(
          take(1)
        )
        .subscribe((response) => {
          if (response) {
            this.onActionFinalize(); 
          } else {
            this.onActionFailed();
          }
        });
    } else {
      console.error("FILE_UPLOAD.ERROR.NO_FILE_SELECTED");
      this.notification.error("FILE_UPLOAD.ERROR.NO_FILE_SELECTED");
    }
  }
  
  private onActionFinalize() {
    if(this.selectedFiles.length > 1) {
      this.notification.success("FILE_UPLOAD.SUCCES.FILES_SAVED");
    } else {
      this.notification.success("FILE_UPLOAD.SUCCES.FILE_SAVED");
    }
    this.selectedFiles.splice(0, this.selectedFiles.length);
    this.formData = new FormData;
    this.spinnerService.show();
    setTimeout((function() {
      document.location.reload();
    }), 2321);
  }
  
  private onActionFailed() {
    this.notification.error("FILE_UPLOAD.ERROR.FILE_ERROR");
    this.selectedFiles.splice(0, this.selectedFiles.length);
    this.formData = new FormData;
    this.spinnerService.hide();
  }*/
  
}
