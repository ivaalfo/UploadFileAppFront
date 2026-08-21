import { BrowserModule } from '@angular/platform-browser';
import { NgModule, LOCALE_ID, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { SortablejsModule } from 'ngx-sortablejs';

import { CoreModule } from '@core/core.module';
import { SharedModule } from '@shared/shared.module';
import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';

import { ContentLayoutComponent } from './layout/content-layout/content-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { ToasterNotificationComponent } from './layout/toaster-notification/toaster-notification.component';
import { HeaderMenuComponent } from './layout/header-menu/header-menu.component';
import { GlobalSpinnerComponent } from './layout/global-spinner/global-spinner.component';
import { Locales } from '@data/languages';
import { SubHeaderMenuComponentGestionPedidos } from './layout/header-submenu-gestion-pedidos/header-submenu-gestion-pedidos.component';

registerLocaleData(localeEs);

export function createTranslateLoader(http: HttpClient) {
  //Generamos un timestamp único para obligar al navegador a descargar las traducciones nuevas
  const suffix = `.json?v=${new Date().getTime()}`;
  return new TranslateHttpLoader(http, './assets/i18n/', suffix);
}

@NgModule({
  declarations: [
    AppComponent,
    ContentLayoutComponent,
    AuthLayoutComponent,
    ToasterNotificationComponent,
    GlobalSpinnerComponent,
    HeaderMenuComponent,
    SubHeaderMenuComponentGestionPedidos
  ],
  imports: [
    BrowserModule,
    CoreModule,
    SharedModule,
    AppRoutingModule,
    HttpClientModule,
    SortablejsModule.forRoot({ animation: 150 }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    { provide: LOCALE_ID, useValue: Locales.ES },
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AppModule { }
