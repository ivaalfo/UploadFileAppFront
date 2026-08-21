import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '@shared/shared.module';
import { FormsModule } from '@angular/forms';
import { PantallaFirmaComponent } from './pages/pantallaFirma/pages/pantallaFirma/pantalla.firma.component';
import { ViewFirmaDocsFormComponent } from './pages/pantallaFirma/components/view-firma-docs-form/view-firma-docs-form.component';
import { FirmadorDocsRoutingModule } from './firmador.docs.routing';


@NgModule({
  declarations: [
    PantallaFirmaComponent,
    ViewFirmaDocsFormComponent,
  ],
  imports: [
    FirmadorDocsRoutingModule,
    SharedModule,
    TranslateModule,
    FormsModule
  ],
  exports: [],
  providers: [],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class FirmadorDocsModule { }

