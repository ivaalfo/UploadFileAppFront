import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UsersMaintenanceComponent } from './pages/users/users-maintenance.component';

export const routes: Routes = [
  {
    path: '',
    component: UsersMaintenanceComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserMaintenanceRoutingModule { }
