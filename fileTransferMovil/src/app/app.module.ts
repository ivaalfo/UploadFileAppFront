import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ServiceWorkerModule } from '@angular/service-worker';
import { AuthModule, CoreModule, Locales } from '@ecna_npm/entralm-shared';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { environment } from '../environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './layout/components/header/header.component';
import { InstallComponent } from './layout/components/install/install.component';
import { ContentLayoutComponent } from './layout/content-layout/content-layout.component';
import { NavigationStateService } from './services/navigation-state.service';
import { PWAService } from './services/pwa.service';
import { SharedModule } from './shared/shared.module';
import { GlobalSpinnerComponent } from './layout/components/global-spinner/global-spinner.component';
import { BarecodeScannerLivestreamModule } from 'ngx-barcode-scanner';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    ContentLayoutComponent,
    InstallComponent,
    HeaderComponent,
    GlobalSpinnerComponent
  ],
  imports: [
    CommonModule,
    AppRoutingModule,
    BrowserModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    AuthModule,
    HttpClientModule,
    CoreModule,
    SharedModule,
    BarecodeScannerLivestreamModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  providers: [PWAService, NavigationStateService, { provide: LOCALE_ID, useValue: Locales.ES }],
  bootstrap: [AppComponent]
})
export class AppModule { }
