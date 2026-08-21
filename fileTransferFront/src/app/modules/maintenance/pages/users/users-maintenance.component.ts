import { Component, OnInit } from '@angular/core';
import { TableHeader } from '@shared/components/table/table-header';
import { Subject } from 'rxjs';
import { TableScroll } from '@shared/components/table/table-scroll';
import { User } from '@data/maintenance/users';
import { ModalAction } from '@shared/components/modal/modal-action';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';
import { GlobalSpinnerService } from '@core/services/global-spinner/global-spinner.service';
import { take, tap, finalize, map } from 'rxjs/operators';
import { UserMaintenanceApiClient } from '@core/services/api/maintenance/api-user-maintenance.service';
import { MasterTablesService } from '@core/services/api/master-tables/master-tables.service';
import { MasterTablesEnum, MasterTable } from '@data/shared/masterTables';
import { sortByProperty } from '@shared/utils/array-utils';
import { UserRoles } from '@data/user-roles';
import { AuthService } from '@core/services/auth/auth.service';
import { FileUploadApiClient } from '@core/services/api/fileupload/api-file-upload.service';


@Component({
  selector: 'm-users-maintenance',
  templateUrl: './users-maintenance.component.html',
  styleUrls: ['./users-maintenance.component.scss']
})
export class UsersMaintenanceComponent implements OnInit {
  
  public constructor(
    private readonly authService: AuthService,
    private readonly translate: TranslateService,
    private readonly notification: NotificationService,
    private readonly spinnerService: GlobalSpinnerService,
    private readonly apiUserMaintenance: UserMaintenanceApiClient,
    private readonly apiFileUpload: FileUploadApiClient,
    private readonly masterTablesService: MasterTablesService) {

    this.type = this.translate.instant('MAINTENANCES.USERS.TABLE.W2USUARIO');
  }
  public editMode!: boolean;
  public loading = false;
  public tableScroller$ = new Subject<TableScroll>();
  public users: User[] = [];

  public tableHeaders: TableHeader[] = this.getTableHeaders();
    
  public userModalOpener$ = new Subject<ModalAction>();
  public confirmModalOpener$ = new Subject<ModalAction>();
  public reactivateConfirmModalOpener$ = new Subject<ModalAction>();

  public selectedUser: User = new User();
  public selectedUserNi = 0;
  public actionToConfirm!: string;
  public actionTitle!: string;
  public type!: string;
  public roles: MasterTable[] = [];

  public fileURL!: string;
  public filename!: string;

  public userTrackById(_: number, item: User) {
    return item.w2usuky;
  }

  public ngOnInit() {
    this.getUsers();
    this.getRoles();
  }

  public getTableHeaders() {
    return [
      { title: 'MAINTENANCES.USERS.TABLE.CLINOM', sorted: true, property: 'clinom' },
      { title: 'MAINTENANCES.USERS.TABLE.CLIDIR', sorted: true, property: 'clidir' },
      { title: 'MAINTENANCES.USERS.TABLE.CLICIF', sorted: true, property: 'clicif' },
      { title: 'MAINTENANCES.USERS.TABLE.W2USUARIO', sorted: true, property: 'w2usuario' },
      { title: 'MAINTENANCES.USERS.TABLE.W2EMAIL', sorted: true, property: 'w2email' },
      { title: 'MAINTENANCES.USERS.TABLE.W3TIPO', sorted: true, property: 'w3tipo' },
      { title: 'MAINTENANCES.USERS.TABLE.ACTIONS' }
    ];
  }

  public openModalDeleteUser(user: User) {
    this.selectedUser = user;
    this.actionTitle = this.translate.instant('MAINTENANCES.ACTIONS.DELETE.TITLE', { model: this.type });
    this.actionToConfirm = 'MAINTENANCES.ACTIONS.DELETE.TEXT';
    this.selectedUserNi = user.w2usuky;
    setTimeout(() => {
      this.confirmModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public onDeleteUser() {
    this.loading = true;
    this.spinnerService.show();
    this.apiUserMaintenance.delete(this.selectedUserNi)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.spinnerService.hide();
        })
      )
      .subscribe((response: number) => {
        if (response === 1) {
          this.getUsers();
          this.notification.success('MAINTENANCES.USERS.FORM.SUCCES.USER_DELETED');
        } else {
          this.notification.error('MAINTENANCES.USERS.FORM.ERROR.USER_NOT_MODIFIED');
        }
      });
  }

  public openModalReactivateUser(user: User) {
    this.selectedUser = user;
    this.actionTitle = this.translate.instant('MAINTENANCES.ACTIONS.REACTIVATE.TITLE', { model: this.type });
    this.actionToConfirm = 'MAINTENANCES.ACTIONS.REACTIVATE.TEXT';
    this.selectedUserNi = user.w2usuky;
    setTimeout(() => {
      this.reactivateConfirmModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public onReactivateUser() {
    this.loading = true;
    this.spinnerService.show();
    this.apiUserMaintenance.reactivate(this.selectedUserNi)
      .pipe(
        finalize(() => {
          this.loading = false;
          this.spinnerService.hide();
        })
      )
      .subscribe((response: boolean) => {
        if (response) {
          this.getUsers();
          this.notification.success('MAINTENANCES.USERS.FORM.SUCCES.USER_REACTIVATED');
        } else {
          this.notification.error('MAINTENANCES.USERS.FORM.ERROR.USER_NOT_MODIFIED');
        }
      });
  }

  public onUserAction(addUser: boolean, user?: User) {
    this.selectedUserNi = 0;
    this.selectedUser = new User(user);
    if (!addUser && user) {
      this.editMode = true;
      this.selectedUserNi = user.w2usuky;
    } else if (addUser) {
      this.editMode = false;
    }
    setTimeout(() => {
      this.userModalOpener$.next(ModalAction.Open);
    }, 0);
  }

  public getUsers() {
    this.loading = true;
    this.spinnerService.show();
    this.apiUserMaintenance.getAll()
      .pipe(
        take(1),
        tap((users: any) => this.users = this.sortedBy(users)),
        finalize(() => {
          this.canEdit(this.users);
          this.loading = false;
          this.spinnerService.hide();
        })
      ).subscribe();
  }

  private sortedBy(users: User[]): User[] {
    //Orden personalizado: 264, 265, 287, 267, 266 (coincide con DB CASE ordering)
    const order = [264, 265, 287, 267, 266];
    const indexOf = (val: any) => {
      const n = Number(val);
      const idx = order.indexOf(n);
      return idx === -1 ? order.length : idx;
    };

    return users.sort((a: User, b: User) => {
      const ia = indexOf(a.w3tipo);
      const ib = indexOf(b.w3tipo);
      if (ia !== ib) {
        return ia - ib;
      }
      //fallback: ordenar por nombre de cliente como en el back
      return (a.clinom || '').localeCompare(b.clinom || '');
    });
  }

  public onColumnSorted(event: any): void {
    //Si la columna es el tipo (w3tipo) respeto el orden custom
    if (event.column === 'w3tipo') {
      const order = [264, 265, 287, 267, 266];
      const indexOf = (val: any) => {
        const n = Number(val);
        const idx = order.indexOf(n);
        return idx === -1 ? order.length : idx;
      };

      this.users = this.users.sort((a: any, b: any) => {
        const ia = indexOf(a.w3tipo);
        const ib = indexOf(b.w3tipo);
        const diff = ia - ib;
        if (diff !== 0) {
          return event.directionSort === 'asc' ? diff : -diff;
        }
        return (a.clinom || '').localeCompare(b.clinom || '');
      });
    } else {
      this.users = sortByProperty(this.users, event.column, event.directionSort);
    }
  }

  private getRoles() {
    this.masterTablesService.getMasterTable(MasterTablesEnum.AUTOR_ROLES)
      .pipe(
        take(1),
        map(roles => this.roles = roles),
      ).subscribe();
  }
  
  public get isAdminUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Admin ? true : false;
  }

  public get isInternoUser(): boolean {
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

  /*
  FTADM = 'DFC administrador' : TBDETNI = 264;
  FTINTER = 'Usuario interno DFC' : TBDETNI = 265;
  FTCONSUL = 'Usuario consulta DFC' : TBDETNI = 287;
  FTEXTER = 'Usuario externo DFC' : TBDETNI = 266;
  FTNO = 'Sin acceso DFC' : TBDETNI = 267;
*/
  public canEdit(users: User[]): void {
    for (let i = 0; i < users.length; i++) {
      
      if(this.isAdminUser){
        //Admin edita a todos los usuarios
        users[i].isEditable = true;

      } else if(this.isInternoUser){
        //Interno edita a los usuarios Consulta y Externos (287 y 266)
        if(users[i].w3tipo === 287 || users[i].w3tipo === 266){
          users[i].isEditable = true;
        }
        //Y a si mismo (265)
        if(users[i].w3tipo === 265 && users[i].w2usuario === this.authService.getLoginData()!.username){
          users[i].isEditable = true;
        }

      } else if(this.isConsultaUser){
        //Consulta edita a los usuarios Externos (266)
        if(users[i].w3tipo === 266){
          users[i].isEditable = true;
        }
        //Y a si mismo (287)
        if(users[i].w3tipo === 287 && users[i].w2usuario === this.authService.getLoginData()!.username){
          users[i].isEditable = true;
        }

      } else if(this.isExternoUser && users[i].w3tipo === 266){
        //Externo solo se ve y edita a si mismo
        users[i].isEditable = true;
      }
    }
  }

  public downloadEspanishManual() {
    this.filename = this.authService.getLoginData()!.manFileNameES;
    this.downloadManual(this.filename);
  }

  public downloadEnglishManual() {
    this.filename = this.authService.getLoginData()!.manFileNameEN;
    this.downloadManual(this.filename);
  }
  
  downloadManual(filename: string) {
    const fileType = "MAN_PROV";
    this.apiFileUpload.getFile(fileType, null, null, filename)
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
    if(fileType == "MAN_PROV"){
      dTitle = this.translate.instant('MAINTENANCES.USERS.SUCCES_MAN_DOWNLOADED');
    }
    this.onActionInfo(dTitle);
  }

  private onActionInfo(msg: string) {
    this.notification.info(msg, true, true);
  }

}
