import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/services/auth.service';
import { ConfigurationService } from '../services/configuration/configuration.service';
import { NotificationService } from '../services/notifications/toaster-notification.service';

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  public constructor(
    public auth: AuthService,
    private config: ConfigurationService,
    private router: Router,
    private notification: NotificationService
  ) { }

  public intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.needsToken(request)) {
      request = this.addToken(request);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next, error);
        } else if (error instanceof HttpErrorResponse
          && error.error
          && error.error.errores
          && error.error.errores[0]
          && error.error.errores[0].descripcion) {
          this.notification.warn(error.error.errores[0].descripcion);

          return throwError(error);
        }

        this.notification.error('ERROR.API_ERROR');
        return throwError(error);
      })
    );
  }

  private needsToken(request: HttpRequest<any>): boolean {
    const refreshTokenUrl = this.config.authBaseUrl + this.auth.getRefreshTokenPath();
    return request.url.indexOf(this.config.apiBaseUrl) === 0 ||
      (request.url.indexOf(this.config.authBaseUrl) === 0 && request.url !== refreshTokenUrl);
  }

  private addToken(request: HttpRequest<any>) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${this.auth.getToken()}`
      }
    });
  }

  private handle401Error(request: HttpRequest<any>, next: HttpHandler, error: any): Observable<HttpEvent<any>> {
    if (this.needsToken(request)) {
      return this.auth.refreshToken().pipe(
        switchMap(hasRefreshedToken => {
          if (hasRefreshedToken) {
            return next.handle(this.addToken(request)).pipe(
              catchError(e => {
                if (e instanceof HttpErrorResponse && e.status === 401) {
                  this.router.navigate(['/auth/login']);
                  this.notification.warn('LOGIN_EXPIRED');
                  return throwError(e);
                } else {
                  this.notification.error('ERROR.API_ERROR');
                  return throwError(e);
                }
              })
            );
          } else {
            this.router.navigate(['/auth/login']);
            this.notification.warn('LOGIN_EXPIRED');
            return throwError(error);
          }
        }));
    }

    return throwError(error);
  }
}
