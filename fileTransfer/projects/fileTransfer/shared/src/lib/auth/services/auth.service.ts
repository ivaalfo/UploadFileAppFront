import { HttpClient } from '@angular/common/http';
import { Injectable, Inject } from '@angular/core';
import { Observable, from, of } from 'rxjs';

import { ConfigurationService } from '../../core/services/configuration/configuration.service';
import { LoginResponse, TokenData, LoginData } from './login.response';
import { tap, mapTo, catchError, finalize, map } from 'rxjs/operators';
import { ErrorResponse } from './error.response';
import { AuthStorageService } from './auth-storage.service';
import { DigestClient } from './digest-fetch';
import { ApiResponse } from '../../core/services/api/api.response';
import { UserRoles } from '../../data/user-roles';

const LOGIN_PATH = 'login';
const LOGOUT_PATH = 'logout';
const REFRESH_TOKEN_PATH = 'refresh';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private error?: ErrorResponse;

  public constructor(
    @Inject(HttpClient) private http: HttpClient,
    private config: ConfigurationService,
    private storage: AuthStorageService
  ) { }

  public login(username: string, password: string, remember: boolean): Observable<boolean> {
    const client = new DigestClient(username, password, {
      statusCode: 403
    });

    const loginHeaders = new Headers();
    loginHeaders.append('ClienteJavascript', 'true');
    loginHeaders.append('Access-Control-Allow-Headers', 'Authorization');
    loginHeaders.append('Access-Control-Allow-Origin', '*');

    const p = new Promise((resolve, reject) => {
      client.fetch(`${this.config.authBaseUrl}${LOGIN_PATH}`, {
        method: 'POST',
        headers: loginHeaders
      })
        .then((resp: any) => {
          if (resp.ok) {
            resolve(resp.json());
            return;
          }
          reject(resp);
        })
        .catch((e: any) => reject(e));
    });

    return from(p).pipe(
      map(r => {
        const response = r as ApiResponse;
        if (response.error) {
          this.forbidden(response as unknown as ErrorResponse);
          return false;
        }

        const prueba = r as LoginResponse;
        prueba.datosLogin.roles.push(UserRoles.Admin);
        this.doLoginUser(prueba, remember);
        return true;
      }),
      catchError((errorCode: number) => {
        return of(errorCode)
          .pipe(
            tap(_ => this.forbidden({
              error: true,
              datosError: {
                codigo: '01',
                descripcion: 'Usuario o password incorrecto'
              }
            })),
            mapTo(false)
          );
      })
    );
  }

  public getRefreshTokenPath(): string {
    return REFRESH_TOKEN_PATH;
  }

  public isLogged(): boolean {
    const data = this.storage.getData();
    if (!data) {
      return false;
    }

    if (this.isTokenExpired(data.datosToken)) {
      return false;
    }

    return true;
  }

  public getToken(): string {
    const data = this.storage.getData();
    return data ? data.datosToken.JWT : '';
  }

  public getLoginData(): LoginData | null {
    const data = this.storage.getData();
    return data ? data.datosLogin : null;
  }

  public hasRole(role: UserRoles): boolean {
    const data = this.storage.getData();
    if (!data) {
      return false;
    }
    const userRoles = data.datosLogin.roles;
    return userRoles.includes(role);
  }

  public logout(): Observable<void> {
    return this.http.post(`${this.config.authBaseUrl}${LOGOUT_PATH}`, undefined)
      .pipe(
        mapTo(undefined),
        finalize(() => this.storage.removeData())
      );
  }

  public getErrorMessage(): string {
    return this.error ? this.error.datosError.descripcion : '';
  }

  public refreshToken(): Observable<boolean> {
    const data = this.storage.getData();
    if (!data) {
      return of(false);
    }

    return this.http.post<LoginResponse>(`${this.config.authBaseUrl}${REFRESH_TOKEN_PATH}`, undefined, {
      headers: {
        Authorization: `Bearer ${this.getRefreshToken()}`
      }
    }).pipe(
      map(response => this.storage.updateData(response)),
      catchError(_ => {
        this.storage.removeData();
        return of(false);
      })
    );
  }

  private doLoginUser(response: LoginResponse, remember: boolean): void {
    this.storage.saveData(response, remember);
    this.error = undefined;
  }

  private forbidden(response: ErrorResponse): void {
    this.storage.removeData();
    this.error = response;
  }

  private isTokenExpired(tokenData: TokenData): boolean {
    const tokenDate = new Date(tokenData.timestamp);
    const expireDate = new Date(tokenDate.getTime() + tokenData.expirationMin * 60000);
    const now = new Date();

    return now.getTime() >= expireDate.getTime();
  }

  private getRefreshToken(): string {
    const data = this.storage.getData();
    return data ? data.datosToken.refreshtoken : '';
  }
}
