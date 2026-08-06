import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '@shared/shared.module';
import { FormsModule } from '@angular/forms';

import { PedidosHistoricoComponent } from '@modules/pedidosHistorico/pages/pedidosHistorico/pedidos.historico.component';
import { PedidosHistoricoRoutingModule } from '@modules/pedidosHistorico/pedidos.historico.routing';
import { ViewHistDocsFormComponent } from './components/view-hist-docs-form/view-hist-docs-form.component';
import { AnotaHistCMRFormComponent } from './components/anota-hist-cmr-form/anota-hist-cmr-form.component';

@NgModule({
    declarations: [
      PedidosHistoricoComponent,
      ViewHistDocsFormComponent,
      AnotaHistCMRFormComponent
    ],
    imports: [
      PedidosHistoricoRoutingModule,
      SharedModule,
      TranslateModule,
      FormsModule
    ],
    exports: [],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PedidosHistoricoModule {}
