import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { PedidosHistoricoComponent } from '@modules/pedidosHistorico/pages/pedidosHistorico/pedidos.historico.component';

export const routes: Routes = [
  {
    path: '',
    component: PedidosHistoricoComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PedidosHistoricoRoutingModule {}
