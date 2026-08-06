/*import { Component, OnInit } from '@angular/core';
import { AuthService } from '@core/services/auth/auth.service';
import { UserRoles } from '@data/user-roles';

@Component({
  selector: 'm-maintenance',
  templateUrl: './maintenance.component.html',
  styleUrls: ['./maintenance.component.scss']
})
export class MaintenanceComponent implements OnInit {

  public constructor(
    private readonly authService: AuthService
  ) { }

  public ngOnInit() {
  }

  public get canViewMaintenanceUsers(): boolean {
    return (this.authService.hasRole(UserRoles.Admin)
      || this.authService.hasRole(UserRoles.Interno)
      || this.authService.hasRole(UserRoles.Externo)
    );
  }

}

//NO SE USA - CAMBIOS - SE ENTRA DIRECTO
*/