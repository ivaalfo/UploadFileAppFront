import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AuthGuard } from '@core/guards/auth.guard';
import { ensureModuleLoadedOnceGuard } from '@core/guards/module-loaded-once.guard';

import { TokenInterceptor } from '@core/interceptors/token.interceptor';
import { SHARED_SESSIONSTORAGE_CONFIG } from './services/storage/shared-session-storage.config';
import { FT_LOGIN_DATA_KEY } from './services/auth/auth-storage.service';
import { Logger, ConsoleLogger } from './services/log/logger.service';

@NgModule({
  imports: [
    HttpClientModule
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
    { provide: Logger, useClass: ConsoleLogger }
  ]
})
export class CoreModule {
  public constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    ensureModuleLoadedOnceGuard(parentModule, 'CoreModule');
  }
}
