import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '@core/services/api/api-client.service';
import { PedidoProveedor, PedidoProveedorDto } from '@data/pedidos/pedido-proveedor';
import { HttpParams } from '@angular/common/http';
import { LockEntities } from '@data/shared/locks';
import { ApiResponseWithData } from '../api.response';

const FIRMADOR_GET_PEDIDO_FIRMA = 'api/v1/firmador/getPedidoFirmaVO';
const FIRMADOR_GETBY_FILTER = 'api/v1/firmador/getByFilter';
const FIRMADOR_GET_CMR = 'api/v1/firmador/getCMRfirma';
const FIRMADOR_POST_SIGNED_FILE = 'api/v1/firmador/postSigned';


@Injectable({
  providedIn: 'root'
})
export class FirmadorApiClient extends ApiClient {

  public getPedidoFirmaVO(track: string, exp: string): Observable<ApiResponseWithData> {
    return this.http.get<ApiResponseWithData>(`${this.config.apiBaseUrl}${FIRMADOR_GET_PEDIDO_FIRMA}/${track}/${exp}`)
    .pipe(
      map(response => this.mapResponseWithData(response))
    );
  }

  public getByFilters(filtros: any): Observable<PedidoProveedor[]> {
    let params = new HttpParams();

    Object.keys(filtros).forEach(key => {
      if(filtros[key]){
        params = params.append(key, filtros[key]);
      }
    });

    return this.http.get<PedidoProveedorDto[]>(`${this.config.apiBaseUrl}${FIRMADOR_GETBY_FILTER}`, { 
      params 
    }).pipe(
      map(dtos => dtos.map(dto => PedidoProveedor.parseDto(dto)))
    );
  }

  public getCMRfirma(track: string, exp: string): Observable<Blob> {
    return this.http.get(`${this.config.apiBaseUrl}${FIRMADOR_GET_CMR}/${track}/${exp}`, {
      responseType: 'blob'
    });
  }

  public signFile(lockType: LockEntities, fData: any): Observable<ApiResponseWithData> {
    return this.http.post<ApiResponseWithData>(`${this.config.apiBaseUrl}${FIRMADOR_POST_SIGNED_FILE}/${lockType}`, 
      fData
    )
    .pipe(
      map(response => this.mapResponseWithDataWithoutWarning(response))
    );
  }

}
