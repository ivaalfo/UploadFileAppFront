import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { ModalAction } from '@shared/components/modal/modal-action';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { error, getStringValue } from '@shared/utils/form-utils';
import { NotificationService } from '@core/services/notifications/toaster-notification.service';
import { MasterTable, MasterTablesEnum } from '@data/shared/masterTables';
import { MasterTablesService } from '@core/services/api/master-tables/master-tables.service';
import { UserMaintenanceApiClient } from '@core/services/api/maintenance/api-user-maintenance.service';
import { take, map, finalize } from 'rxjs/operators';
import { User } from '@data/maintenance/users';
import { UserRoles } from '@data/user-roles';
import { AuthService } from '@core/services/auth/auth.service';
//import { MultiselectOption } from '@shared/components/multiselect/multiselect.component';
//import * as cryptojs from 'crypto-js';

@Component({
  selector: 'm-user-form',
  templateUrl: './user-form.component.html'
})
export class UserFormComponent implements OnInit, OnDestroy {

  @Input()
  public opener$!: Subject<ModalAction>;

  @Input()
  public userNi = 0;

  @Output()
  public done = new EventEmitter();

  public labelPass!: string;
  public edit = false;
  public isLoading = true;
  public user: User = new User();
  public modalOpener$ = new Subject<ModalAction>();
  public userForm: FormGroup | undefined;
  private openerSubscription: Subscription | undefined;
  private submitted = false;
  public roles: MasterTable[] = [];
  public selectedRoles: string[] = [];
  
  public adminRol!: string;
  
  public get editMode(): boolean {
    return this.userNi !== 0;
  }

  public constructor(
    private readonly authService: AuthService,
    private readonly formBuilder: FormBuilder,
    private readonly notification: NotificationService,
    private readonly apiUsersMaintenance: UserMaintenanceApiClient,
    private readonly masterTablesService: MasterTablesService
  ) {
    this.userForm = this.formBuilder.group({
      w2usuario: ['', [Validators.required, Validators.maxLength(40)]],
      w2email: ['', [Validators.required, Validators.maxLength(100), Validators.email]],
      w2contras: ['', [Validators.required, Validators.maxLength(40)]],
      clicodpro: ['', [Validators.required, Validators.maxLength(6)]],
      rol: ['', [Validators.required]],
      edit: [false],
    });
  }

  public ngOnInit(): void {
    this.selectedRoles = [];
    this.adminRol = '';
    this.openerSubscription = this.opener$.subscribe(_ => {
      this.submitted = false;
      this.isLoading = false;
      this.modalOpener$.next(ModalAction.Open);
      this.getRoles();
    });
  }

  public ngOnDestroy(): void {
    if (this.openerSubscription) {
      this.openerSubscription.unsubscribe();
    }
  }

  private getUser() {
    this.apiUsersMaintenance.get(this.userNi)
    .pipe(
      take(1),
      map(response => {
        (response.datos) ?
        //this.user = User.parseDto(response.datos as UserDto)
        this.user = response.datos as User
        :
        this.user = new User();
      }),
      finalize(() => {
        this.onGetDataFinalize();
      })
    ).subscribe();
  }

  private getRoles() {
    this.masterTablesService.getMasterTable(MasterTablesEnum.AUTOR_ROLES)
    .pipe(
      take(1),
      map(roles => this.roles = roles),
      finalize(() => {
        if (this.editMode) {
          this.labelPass = 'MAINTENANCES.USERS.FORM.PASSWORD_EDIT';
          this.getUser();
        } else {
          this.labelPass = 'MAINTENANCES.USERS.FORM.W2CONTRAS';

          this.user = User.parseDto({
            username: '',
            w2usuky: 0,
            w2usuario: '',
            w2email: '',
            w2contras: '',
            clinom: '',
            clidir: '',
            clicif: '',
            clicodpro: '',
            roles: [],
            rol: '',
            w2fecr: '',
            w2feca: '',
            w2uscr: '',
            w2usca: '',
            w3usuky: 0,
            w3tipo: 0,
          });
          this.onGetDataFinalize();
        }
      })
    ).subscribe();
  }

  private onGetDataFinalize() {
    this.initUserForm(this.user);
  }

  private initUserForm(user: User) {
    if (this.userForm) {
      this.userForm.reset();
      this.userForm.patchValue(
        {
          username: user.username ? user.username : '',
          w2usuario: user.w2usuario ? user.w2usuario : '',
          w2email: user.w2email ? user.w2email : '',
          w2contras: user.w2contras ? user.w2contras : '',
          clinom: user.clinom ? user.clinom : '',
          clidir: user.clidir ? user.clidir : '',
          clicif: user.clicif ? user.clicif : '',
          clicodpro: user.clicodpro ? user.clicodpro : '',
          roles: this.user.roles ? this.user.roles[0] : '',
          rol: user.rol ? user.rol : '',
          w2fecr: user.w2fecr ? user.w2fecr : '', 
          w2feca: user.w2feca ? user.w2feca : '',
          w2uscr: user.w2uscr ? user.w2uscr : '',
          w2usca: user.w2usca ? user.w2usca : '',
          w3tipo: user.w3tipo ? user.w3tipo : '',
          
          edit: false
        });
      if (!this.editMode) {
        this.userForm.patchValue({
          edit: true
        });
      }
      this.setValidators();
    }
  }

  public canceled(): void {
  }

  public accept(): void {
    this.submitted = true;
    if (this.userForm) {
      this.userForm.patchValue({});
      if (this.userForm.valid) {
        if (this.editMode) {
          this.onPutUser(this.mapFormToUser());
        } else {
          this.onPostUser(this.mapFormToUser());
        }
      }
    }
  }

  public mapFormToUser() {
    return User.parseDto({
      username: this.user.username,
      w2usuky: this.user.w2usuky,
      w2usuario: getStringValue('w2usuario', this.userForm),
      w2email: getStringValue('w2email', this.userForm),
      w2contras: getStringValue('w2contras', this.userForm),
      clinom: this.user.clinom,
      clidir: this.user.clidir,
      clicif: this.user.clicif,
      clicodpro: getStringValue('clicodpro', this.userForm),
      roles: this.selectedRoles,
      rol: getStringValue('rol', this.userForm),
      w2fecr: this.user.w2fecr,
      w2feca: this.user.w2feca,
      w2uscr: this.user.w2uscr,
      w2usca: this.user.w2usca,
      w3usuky: this.user.w3usuky,
      w3tipo: this.user.w3tipo,
    });
  }

  private onPostUser(user: User) {
    this.apiUsersMaintenance.post(user)
    .subscribe((response: boolean) => {
      if (response) {
        this.onActionSuccess();
      } else {
        this.onActionFailed();
      }
    });
  }

  private onPutUser(user: User) {
    this.apiUsersMaintenance.put(user)
    .subscribe((response: boolean) => {
      if (response) {
        this.onActionSuccess();
      } else {
        this.onActionFailed();
      }
    });
  }

  private onActionSuccess() {
    this.notification.success('MAINTENANCES.USERS.FORM.SUCCES.USER_SAVED');
    this.onActionFinalize();
  }

  private onActionFailed() {
    console.error(error);
    this.notification.error('MAINTENANCES.USERS.FORM.ERROR.USER_NOT_SAVED');
    this.onActionFinalize();
  }

  private onActionFinalize() {
    this.modalOpener$.next(ModalAction.Close);
    this.done.emit();
  }

  public error(field: string): string {
    return error(field, this.userForm, this.submitted);
  }

  private setValidators() {
    if (this.userForm) {
      const editControl = this.userForm.get('edit');
      const passControl = this.userForm.get('w2contras');

      if (editControl && passControl) {
        if (!this.editMode) {
          this.userForm.patchValue({
            edit: true
          });
          passControl.setValidators([Validators.required, Validators.maxLength(40)]);
        } else {
          passControl.clearValidators();
        }
        passControl.updateValueAndValidity();
        editControl.valueChanges.subscribe(
          ((state: boolean) => {
            this.edit = state;
            if (state) {
              this.labelPass = 'MAINTENANCES.USERS.FORM.W2CONTRAS';
            } else {
              this.labelPass = 'MAINTENANCES.USERS.FORM.PASSWORD_EDIT';
            }

            passControl.clearValidators();
            if (state || !this.editMode) {
              passControl.setValidators([Validators.required, Validators.maxLength(40)]);
            }
            passControl.updateValueAndValidity();
          })
        );
      }

      const rolControl = this.userForm.get('rol');
      const ccproControl = this.userForm.get('clicodpro');
      if (rolControl && ccproControl){
        ccproControl.clearValidators();
        ccproControl.setValidators([Validators.maxLength(6)]);
        ccproControl.updateValueAndValidity();

        rolControl.valueChanges.subscribe((rolSelected: string) => {
            this.adminRol = rolSelected;
            ccproControl.clearValidators();

            if(rolSelected === UserRoles.Admin || rolSelected === UserRoles.Interno || rolSelected === UserRoles.Consulta){
              ccproControl.setValidators([Validators.maxLength(6)]);
            } else {
              ccproControl.setValidators([Validators.required, Validators.maxLength(6)]);
            }
            ccproControl.updateValueAndValidity();
          }
        );
      }
    }
  }

  public get isAdminUser(): boolean {
    const logedRol = this.authService.getRoles();
    return logedRol[0] == UserRoles.Admin ? true : false ;
  }

}
