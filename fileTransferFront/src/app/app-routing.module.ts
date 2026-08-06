import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { ContentLayoutComponent } from './layout/content-layout/content-layout.component';
import { AuthGuard } from '@core/guards/auth.guard';
import { UserRoles } from '@data/user-roles';
import { RoleGuard } from '@core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    component: ContentLayoutComponent,
    canActivate: [AuthGuard],
    data: {roles: [UserRoles.Admin, UserRoles.Interno, UserRoles.Consulta, UserRoles.Externo, UserRoles.SinAcceso]},
    children: [
      {
        path: '',
        loadChildren: () =>
          import('@modules/home/home.module').then(m => m.HomeModule)
      },
      {
        path: 'pedidosActivos',
        canActivateChild: [RoleGuard],
        data: {roles: [UserRoles.Admin, UserRoles.Interno, UserRoles.Consulta, UserRoles.Externo]},
        loadChildren: () =>
          import('@modules/pedidosActivos/pedidos.activos.module').then(m => m.PedidosActivosModule)
      },
      {
        path: 'pedidosValidador',
        canActivateChild: [RoleGuard],
        data: {roles: [UserRoles.Admin, UserRoles.Interno, UserRoles.Consulta]},
        loadChildren: () =>
          import('@modules/pedidosValidador/pedidos.validador.module').then(m => m.PedidosValidadorModule)
      },
      {
        path: 'pedidosHistorico',
        canActivateChild: [RoleGuard],
        data: {roles: [UserRoles.Admin, UserRoles.Interno, UserRoles.Consulta, UserRoles.Externo]},
        loadChildren: () =>
          import('@modules/pedidosHistorico/pedidos.historico.module').then(m => m.PedidosHistoricoModule)
      },
      /*{
        path: 'maintenance',
        canActivateChild: [RoleGuard],
        data: {roles: [UserRoles.Admin, UserRoles.Interno, UserRoles.Externo  
          //UserRoles.Martico, UserRoles.AlmacenDireccion,
          //UserRoles.Transportista, UserRoles.Gases, UserRoles.AlmacenUsuario, UserRoles.Lidl
          ]},
        loadChildren: () =>
          import('@modules/maintenance/maintenance.module').then(m => m.MaintenanceModule)
      }

      //NO SE USA - CAMBIOS - SE ENTRA DIRECTO
      */
      {
        path: 'users',
        canActivate: [RoleGuard],
        data: {roles: [UserRoles.Admin, UserRoles.Interno, UserRoles.Consulta, UserRoles.Externo]},
        loadChildren: () =>
          import('@modules/maintenance/users.maintenance.module').then(m => m.UserMaintenanceModule)
      }
    ]
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    loadChildren: () =>
      import('@modules/auth/auth.module').then(m => m.AuthModule)
  },
  // Fallback when no prior routes is matched
  { path: '**', redirectTo: '/auth/login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
  providers: []
})
export class AppRoutingModule { }
