import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RoleGuard } from '@core/guards/role.guard';
import { UserRoles } from '@data/user-roles';
import { GestionPedidosComponent } from './gestion.pedidos.component';
import { PedidosActivosComponent } from './pages/pedidosActivos/pages/pedidosActivos/pedidos.activos.component';
import { PedidosHistoricoComponent } from './pages/pedidosHistorico/pages/pedidosHistorico/pedidos.historico.component';
import { PedidosValidadorComponent } from './pages/pedidosValidador/pages/pedidosValidador/pedidos.validador.component';

export const routes: Routes = [

  {
    path: '',
    component: GestionPedidosComponent
  },
  {
    path: 'pedidosActivos',
    component: PedidosActivosComponent,
    canActivate: [RoleGuard],
    data: {roles: [UserRoles.Admin, UserRoles.Interno, UserRoles.Consulta, UserRoles.Externo]},
  },
  {
    path: 'pedidosValidador',
    component: PedidosValidadorComponent,
    canActivate: [RoleGuard],
    data: {roles: [UserRoles.Admin, UserRoles.Interno, UserRoles.Consulta]},
  },
  {
    path: 'pedidosHistorico',
    component: PedidosHistoricoComponent,
    canActivate: [RoleGuard],
    data: {roles: [UserRoles.Admin, UserRoles.Interno, UserRoles.Consulta, UserRoles.Externo]},
  },

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GestionPedidosRoutingModule { }
