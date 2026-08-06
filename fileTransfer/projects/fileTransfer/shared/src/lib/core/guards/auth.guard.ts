import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, delay, mapTo, flatMap, tap } from 'rxjs/operators';
import { AuthService } from '../../auth/services/auth.service';
import { Logger } from '../services/log/logger.service';

@Injectable()
export class AuthGuard implements CanActivate {

  public constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly logger: Logger,
  ) { }

  public canActivate(): Observable<boolean | UrlTree> {
    this.logger.info(`[AuthGuard] Start checking`);

    if (this.authService.isLogged()) {
      this.logger.info(`[AuthGuard] Is logged`);
      return of(true);
    }

    this.logger.info(`[AuthGuard] Is not logged`);
    return of(false)
      .pipe(
        delay(200), // Delay for SharedSessionStorage
        tap(_ => this.logger.info(`[AuthGuard] Checking again after little delay to allow SharedSessionStorage sync`)),
        mapTo(this.authService.isLogged()),
        flatMap(isLogged => {
          if (isLogged) {
            this.logger.info(`[AuthGuard] Is logged`);
            return of(isLogged);
          }

          this.logger.info(`[AuthGuard] Is not logged try refreshing token`);
          return this.authService.refreshToken()
            .pipe(
              map(canRefresh => {
                if (!canRefresh) {
                  this.logger.info(`[AuthGuard] Con not refresh, redirect to login`);
                  return this.router.parseUrl('/auth/login');
                }

                this.logger.info(`[AuthGuard] Token refreshed. Is logged.`);
                return true;
              })
            );
        })
      );
  }
}
