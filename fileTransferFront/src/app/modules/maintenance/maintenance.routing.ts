/*import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UsersMaintenanceComponent } from './pages/users/users-maintenance.component';
import { MaintenanceComponent } from '@modules/maintenance/maintenance.component';
import { RoleGuard } from '@core/guards/role.guard';
import { UserRoles } from '@data/user-roles';

export const routes: Routes = [

  {
    path: '',
    component: MaintenanceComponent
  },
  {
    path: 'users',
    component: UsersMaintenanceComponent,
    canActivate: [RoleGuard],
    data: {roles: [UserRoles.Admin, UserRoles.Interno, UserRoles.Externo]},
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MaintenanceRoutingModule { }

//NO SE USA - CAMBIOS - SE ENTRA DIRECTO
*/