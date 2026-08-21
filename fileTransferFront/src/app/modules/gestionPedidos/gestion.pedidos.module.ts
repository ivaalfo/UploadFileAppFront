import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '@shared/shared.module';
import { FormsModule } from '@angular/forms';
import { GestionPedidosRoutingModule } from './gestion.pedidos.routing';
import { GestionPedidosComponent } from './gestion.pedidos.component';
import { PedidosActivosComponent } from './pages/pedidosActivos/pages/pedidosActivos/pedidos.activos.component';
import { PedidosValidadorComponent } from './pages/pedidosValidador/pages/pedidosValidador/pedidos.validador.component';
import { PedidosHistoricoComponent } from './pages/pedidosHistorico/pages/pedidosHistorico/pedidos.historico.component';
import { AssignDateFormComponent } from './pages/pedidosActivos/components/assign-ddate-form/assign-ddate-form.component';
import { AssignGrupFormComponent } from './pages/pedidosActivos/components/assign-grup-form/assign-grup-form.component';
import { InvalidateOrderFormComponent } from './pages/pedidosActivos/components/invalidate-order-form/invalidate-order-form.component';
import { ViewActivDocsFormComponent } from './pages/pedidosActivos/components/view-activ-docs-form/view-activ-docs-form.component';
import { AnotaValCMRFormComponent } from './pages/pedidosValidador/components/anota-val-cmr-form/anota-val-cmr-form.component';
import { RejectCMRFormComponent } from './pages/pedidosValidador/components/reject-cmr-form/reject-cmr-form.component';
import { RejectFACFormComponent } from './pages/pedidosValidador/components/reject-fac-form/reject-fac-form.component';
import { ViewValDocsFormComponent } from './pages/pedidosValidador/components/view-val-docs-form/view-val-docs-form.component';
import { AnotaHistCMRFormComponent } from './pages/pedidosHistorico/components/anota-hist-cmr-form/anota-hist-cmr-form.component';
import { ViewHistDocsFormComponent } from './pages/pedidosHistorico/components/view-hist-docs-form/view-hist-docs-form.component';



@NgModule({
  declarations: [
    GestionPedidosComponent,
    PedidosActivosComponent,
    AssignDateFormComponent,
    AssignGrupFormComponent,
    InvalidateOrderFormComponent,
    ViewActivDocsFormComponent,
    PedidosValidadorComponent,
    AnotaValCMRFormComponent,
    RejectCMRFormComponent,
    RejectFACFormComponent,
    ViewValDocsFormComponent,
    PedidosHistoricoComponent,
    AnotaHistCMRFormComponent,
    ViewHistDocsFormComponent
  ],
  imports: [
    GestionPedidosRoutingModule,
    SharedModule,
    TranslateModule,
    FormsModule
  ],
  exports: [],
  providers: []
})
export class GestionPedidosModule { }


