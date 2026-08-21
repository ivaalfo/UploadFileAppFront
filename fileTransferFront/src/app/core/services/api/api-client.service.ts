import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfigurationService } from '@core/services/configuration/configuration.service';
import { map, take } from 'rxjs/operators';
import { ApiResponse, ApiResponseWithErrors, ApiResponseWithData, 
         ApiLockResponse, ApiLockData, ApiResponseScheduledWithErrors, 
         } from './api.response';
import { NotificationService } from '../notifications/toaster-notification.service';
import { LockEntities } from '@data/shared/locks';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { ApiErrorLocksCodes } from '@core/services/api/api.error';
import { StorageService } from '@core/services/storage/storage.service';

const LOCK_ENTITY_OR_SCREEN = 'api/v1/bloqueo';
const CONTINUE_LOCK_ENTITY_OR_SCREEN = 'api/v1/bloqueo/activo';


@Injectable({
  providedIn: 'root'
})
export class ApiClient {

  public constructor(
    public http: HttpClient,
    public config: ConfigurationService,
    public notification: NotificationService,
    public translate: TranslateService,
    public datepipe: DatePipe,
    private readonly storage: StorageService
  ) { }

  public contentTypeJsonHeader = { headers: new HttpHeaders().set('Content-Type', 'application/json') };

  public mapResponse(response: ApiResponse): boolean {
    if (response && response.error) {
      const errorResponse = response as ApiResponseWithErrors;
      const error = errorResponse.errores[0].descripcion;
      this.notification.warn(error, true, true);
      return false;
    }
    return true;
  }

  public mapResponseScheduled(response: ApiResponse): boolean {
    if (response && response.error) {
      const errorResponse = response as ApiResponseScheduledWithErrors;
      const errors = errorResponse.lista;
      errors.forEach(err => {
        if (err.error) {
          err.errores.forEach(txt => {
            this.notification.warn(txt.descripcion);
          });
        }
      });
      return false;
    }
    return true;
  }

  public mapResponseLocks(response: ApiLockResponse, entity: LockEntities, key?: string, isDelete?: boolean, selectedCMRtrack?: string): ApiLockData {
    if (response && response.error) {
      const errorResponse = response as ApiResponseWithErrors;
      const errorCode = errorResponse.errores[0].codigo;
      const error = errorResponse.errores[0].descripcion;
      switch (errorCode) {
        // When entity is locked
        case ApiErrorLocksCodes.LOCEKD: {
          this.notification.warn(this.translate.instant('MESSAGES.LOCKED_BY', { user: error }));
          break;
        }
        // When servar can't unlock because the entity is unlocked(by server for timeout)
        case ApiErrorLocksCodes.NOT_ACTIVE_LOCK: {
          this.storage.setLock(entity, key, selectedCMRtrack);
          return new ApiLockData(response, false);
        }
        case ApiErrorLocksCodes.USER_NOT_OWNER:
        case ApiErrorLocksCodes.SESSION_NOT_OWNER:
        case ApiErrorLocksCodes.ENDING: {
          this.notification.warn(this.translate.instant('ERROR.API_LOCK_ERROR'));
          break;
        }
      }
      return new ApiLockData(response, true);
    }
    if (!isDelete && !this.storage.isLock(entity, key, selectedCMRtrack)) {
      this.storage.setLock(entity, key, selectedCMRtrack);
    }
    return new ApiLockData(response, false);
  }

  public mapResponseWithData(response: ApiResponseWithData): ApiResponseWithData {
    if (response && !response.found) {
      this.notification.warn(this.translate.instant('MESSAGES.DATA_NOT_FOUND'));
    }
    return response;
  }

  public mapResponseWithDataWithoutWarning(response: ApiResponseWithData): ApiResponseWithData {
    return response; 
  }
  
  //Para bloquear el pedido/CMR cuando está abierto en VALIDACION
  public putLock(lockType: LockEntities, key?: string, selectedCMRtrack?: string): Observable<ApiLockData> {
    if(lockType === LockEntities.LOCK_VALIDATOR || lockType === LockEntities.LOCK_FIRMATOR){
      const lockKey = key ? `?clave=${key}` : '';
      const lockCMR = selectedCMRtrack ? `?track=${selectedCMRtrack}` : '';
      return this.http.put<ApiLockResponse>(
        `${this.config.apiBaseUrl}${LOCK_ENTITY_OR_SCREEN}/${lockType}${lockKey}${lockCMR}`, {})
        .pipe(
          take(1),
          map(response => this.mapResponseLocks(response, lockType, key, false, selectedCMRtrack)),
        );
    }
    else {
      const lockKey = key ? `?clave=${key}` : '';
      return this.http.put<ApiLockResponse>(
        `${this.config.apiBaseUrl}${LOCK_ENTITY_OR_SCREEN}/${lockType}${lockKey}`, {})
        .pipe(
          take(1),
          map(response => this.mapResponseLocks(response, lockType, key, false)),
        );
    }
  }

  public deleteLock(lockType: LockEntities, key?: string, selectedCMRtrack?: string) {
    if(lockType === LockEntities.LOCK_VALIDATOR || lockType === LockEntities.LOCK_FIRMATOR){
      const lockKey = key ? `?clave=${key}` : '';
      const lockCMR = selectedCMRtrack ? `?track=${selectedCMRtrack}` : '';
      return this.http.delete<ApiLockResponse>(
        `${this.config.apiBaseUrl}${LOCK_ENTITY_OR_SCREEN}/${lockType}${lockKey}${lockCMR}`, {})
        .pipe(
          map(response => this.mapResponseLocks(response, lockType, key, true, selectedCMRtrack))
        );
    }
    else {
      const lockKey = key ? `?clave=${key}` : '';
      return this.http.delete<ApiLockResponse>(
        `${this.config.apiBaseUrl}${LOCK_ENTITY_OR_SCREEN}/${lockType}${lockKey}`, {})
        .pipe(
          map(response => this.mapResponseLocks(response, lockType, key, true))
        );
    }
  }

  public continueLock(lockType: LockEntities, key?: string, selectedCMRtrack?: string): Observable<ApiLockData> {
    if(lockType === LockEntities.LOCK_VALIDATOR || lockType === LockEntities.LOCK_FIRMATOR){
      const lockKey = key ? `?clave=${key}` : '';
      const lockCMR = selectedCMRtrack ? `?track=${selectedCMRtrack}` : '';
      return this.http.post<ApiLockResponse>(
        `${this.config.apiBaseUrl}${CONTINUE_LOCK_ENTITY_OR_SCREEN}/${lockType}${lockKey}${lockCMR}`, {})
        .pipe(
          take(1),
          map(response => this.mapResponseLocks(response, lockType, key, false, selectedCMRtrack)),
        );
    }
    else {   
      const lockKey = key ? `?clave=${key}` : '';
      return this.http.post<ApiLockResponse>(
        `${this.config.apiBaseUrl}${CONTINUE_LOCK_ENTITY_OR_SCREEN}/${lockType}${lockKey}`, {})
        .pipe(
          take(1),
          map(response => this.mapResponseLocks(response, lockType, key, false)),
        );
    }
  }

}
