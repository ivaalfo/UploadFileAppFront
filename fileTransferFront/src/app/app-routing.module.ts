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
        path: 'gestionPedidos',
        canActivateChild: [RoleGuard],
        data: {roles: [UserRoles.Admin, UserRoles.Interno, UserRoles.Consulta, UserRoles.Externo]},
        loadChildren: () =>
        import('@modules/gestionPedidos/gestion.pedidos.module').then(m => m.GestionPedidosModule)
      },
      {
        path: 'firmadorDocs',
        canActivateChild: [RoleGuard],
        data: {roles: [UserRoles.Admin, UserRoles.Interno, UserRoles.Consulta, UserRoles.Externo]},
        loadChildren: () =>
          import('@modules/firmadorDocs/firmador.docs.module').then(m => m.FirmadorDocsModule)
      },
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
