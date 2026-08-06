import { HttpClientModule, HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { NgModule, Optional, SkipSelf, LOCALE_ID } from '@angular/core';
import { AuthGuard } from './guards/auth.guard';
import { ensureModuleLoadedOnceGuard } from './guards/module-loaded-once.guard';
import { TokenInterceptor } from './interceptors/token.interceptor';
import { FT_LOGIN_DATA_KEY } from '../auth/services/auth-storage.service';
import { ConsoleLogger, Logger } from './services/log/logger.service';
import { SHARED_SESSIONSTORAGE_CONFIG } from './services/storage/shared-session-storage.config';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    HttpClientModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    AuthGuard,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: TokenInterceptor,
      multi: true
    },
    {
      provide: SHARED_SESSIONSTORAGE_CONFIG,
      useValue: {
        allowedKeys: [FT_LOGIN_DATA_KEY]
      }
    },
    { provide: Logger, useClass: ConsoleLogger },
    { provide: LOCALE_ID, useValue: 'es-ES' }
  ]
})
export class CoreModule {
  public constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    ensureModuleLoadedOnceGuard(parentModule, 'CoreModule');
  }
}
