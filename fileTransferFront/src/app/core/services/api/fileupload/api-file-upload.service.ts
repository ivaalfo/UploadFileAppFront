import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseWithData } from '@core/services/api/api.response';
import { ApiClient } from '@core/services/api/api-client.service';
import { LockEntities } from '@data/shared/locks';


const FILE_UPLOAD_GET_PEDIDO_PROV = 'api/v1/files/getPedidoProv';
const FILE_UPLOAD_GET_PEDIDO_FILES = 'api/v1/files/getPedidoFilesVO';
const FILE_UPLOAD_GET_SIGN = 'api/v1/files/getSIGN';
const FILE_UPLOAD_GET_CMR = 'api/v1/files/getCMR';
const FILE_UPLOAD_GET_VALID_CMR = 'api/v1/files/getValidCMR';
const FILE_UPLOAD_GET_FAC = 'api/v1/files/getFAC';
const FILE_UPLOAD_GET_FILE = 'api/v1/files/getFile';

const FILE_UPLOAD_POST = 'api/v1/files/post';
const FILE_UPLOAD_POST_SIGNED_FILE = 'api/v1/files/postSigned';


@Injectable({
  providedIn: 'root'
})
export class FileUploadApiClient extends ApiClient {

  public getPedidoProv(track: string, exp: string): Observable<ApiResponseWithData> {
    return this.http.get<ApiResponseWithData>(`${this.config.apiBaseUrl}${FILE_UPLOAD_GET_PEDIDO_PROV}/${track}/${exp}`)
    .pipe(
      map(response => this.mapResponseWithData(response))
    );
  }

  public getPedidoFilesVO(track: string, exp: string): Observable<ApiResponseWithData> {
    return this.http.get<ApiResponseWithData>(`${this.config.apiBaseUrl}${FILE_UPLOAD_GET_PEDIDO_FILES}/${track}/${exp}`)
    .pipe(
      map(response => this.mapResponseWithData(response))
    );
  }
  
  //NEXT ? Se puede poner q reciba el user y que cada user tenga su firma diferente ?
  public getSIGN(): Observable<Blob> {
    return this.http.get(`${this.config.apiBaseUrl}${FILE_UPLOAD_GET_SIGN}`, {
      responseType: 'blob'
    });
  }

  public getCMR(track: string, exp: string): Observable<Blob> {
    return this.http.get(`${this.config.apiBaseUrl}${FILE_UPLOAD_GET_CMR}/${track}/${exp}`, {
      responseType: 'blob'
    });
  }

  public getValidCMR(track: string, exp: string, filename: string): Observable<Blob> {
    return this.http.get(`${this.config.apiBaseUrl}${FILE_UPLOAD_GET_VALID_CMR}/${track}/${exp}/${filename}`, {
      responseType: 'blob'
    });
  }

  public getFAC(track: string, exp: string, filename: string): Observable<Blob> {
    return this.http.get(`${this.config.apiBaseUrl}${FILE_UPLOAD_GET_FAC}/${track}/${exp}/${filename}`, {
      responseType: 'blob'
    });
  }

  public getFile(fileType: string, track: string | null, exp: string | null, filename: string): Observable<Blob> {
    const url = `${this.config.apiBaseUrl}${FILE_UPLOAD_GET_FILE}/${fileType}/${track}/${exp}/${filename}`;
    return this.http.get(url, {
      responseType: 'blob'
    });
  }

  public fileUpload(lockType: LockEntities, files: FormData): Observable<ApiResponseWithData> {
    return this.http.post<ApiResponseWithData>(`${this.config.apiBaseUrl}${FILE_UPLOAD_POST}/${lockType}` , 
      files
    )
    .pipe(
      map(response => this.mapResponseWithDataWithoutWarning(response))
    );
  }

  public validateFile(lockType: LockEntities, signFile: FormData): Observable<ApiResponseWithData> {
    return this.http.post<ApiResponseWithData>(`${this.config.apiBaseUrl}${FILE_UPLOAD_POST_SIGNED_FILE}/${lockType}`, 
      signFile
    )
    .pipe(
      map(response => this.mapResponseWithDataWithoutWarning(response))
    );
  }

}
