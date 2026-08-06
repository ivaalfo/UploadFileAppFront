import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '@shared/shared.module';
import { FormsModule } from '@angular/forms';

import { PedidosActivosComponent } from '@modules/pedidosActivos/pages/pedidosActivos/pedidos.activos.component';
import { PedidosActivosRoutingModule } from '@modules/pedidosActivos/pedidos.activos.routing';
import { AssignDateFormComponent } from './components/assign-ddate-form/assign-ddate-form.component';
import { AssignGrupFormComponent } from './components/assign-grup-form/assign-grup-form.component';
import { ViewActivDocsFormComponent } from './components/view-activ-docs-form/view-activ-docs-form.component';
import { InvalidateOrderFormComponent } from './components/invalidate-order-form/invalidate-order-form.component';

@NgModule({
    declarations: [
      PedidosActivosComponent,
      AssignDateFormComponent,
      AssignGrupFormComponent,
      ViewActivDocsFormComponent,
      InvalidateOrderFormComponent
    ],
    imports: [
      PedidosActivosRoutingModule,
      SharedModule,
      TranslateModule,
      FormsModule
    ],
    exports: [],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PedidosActivosModule {}
