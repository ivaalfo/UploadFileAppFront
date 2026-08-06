import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from '@shared/shared.module';
import { FormsModule } from '@angular/forms';

import { HomeComponent } from './pages/home/home.component';
import { HomeRoutingModule } from './home.routing';

@NgModule({
    declarations: [
        HomeComponent,
    ],
    imports: [
        HomeRoutingModule,
        SharedModule,
        TranslateModule,
        FormsModule
    ],
    exports: [],
    providers: [],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HomeModule { }
