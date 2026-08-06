import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '@core/services/auth/auth.service';
import { finalize } from 'rxjs/operators';
import { LoginData } from '@core/services/auth/login.response';
import { StorageService } from '@core/services/storage/storage.service';
import { UserRoles } from '@data/user-roles';

@Component({
  selector: 'm-content-layout',
  templateUrl: './content-layout.component.html',
  styleUrls: ['./content-layout.component.scss']
})
export class ContentLayoutComponent implements OnInit {

  public loginData!: LoginData | null;

  public constructor(
    private router: Router,
    private authService: AuthService,
    private readonly storage: StorageService
  ) { }

  public get home(): boolean {
    return this.router.url === '/';
  }

  public ngOnInit(): void {
    this.loginData = this.authService.getLoginData();
  }

  public logout(): void {
    this.authService.logout()
      .pipe(
        finalize(() => this.router.navigate(['/auth/login']))
      ).subscribe();
  }

  public goToHome(): void {
    //this.storage.deleteAllLocalStorageItems(); //NO HACE NADA
    this.storage.clearFiltersLess();
    this.router.navigate(['/']);
  }

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

  public get canViewMaintenance(): boolean {
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

}
