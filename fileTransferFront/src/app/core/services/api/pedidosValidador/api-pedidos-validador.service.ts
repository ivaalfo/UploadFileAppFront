import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '@core/services/api/api.response';
import { ApiClient } from '@core/services/api/api-client.service';
import { PedidoProveedor, PedidoProveedorDto } from '@data/pedidos/pedido-proveedor';
import { LockEntities } from '@data/shared/locks';
import { HttpParams } from '@angular/common/http';


const PEDIDOS_VALIDATOR_PUT_NOTES = 'api/v1/pedidosValidador/updateNotes';
const PEDIDOS_VALIDATOR_REJECT_CMR = 'api/v1/pedidosValidador/rejectCMR';
const PEDIDOS_VALIDATOR_REJECT_FAC = 'api/v1/pedidosValidador/rejectFAC';

const PEDIDOS_VALIDATOR_GETBY_FILTER = 'api/v1/pedidosValidador/getByFilter';



@Injectable({
  providedIn: 'root'
})
export class PedidosValidadorApiClient extends ApiClient {

  public anotaCMR(lockType: LockEntities, track: string, exp: string, anota: string): Observable<boolean> {
    return this.http.put<ApiResponse>(`${this.config.apiBaseUrl}${PEDIDOS_VALIDATOR_PUT_NOTES}/${lockType}/${track}/${exp}`, {
      anota
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public rejectCMR(lockType: LockEntities, track: string, exp: string, motRec: string): Observable<boolean> {
    return this.http.put<ApiResponse>(`${this.config.apiBaseUrl}${PEDIDOS_VALIDATOR_REJECT_CMR}/${lockType}/${track}/${exp}`, {
      motRec
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public rejectFAC(lockType: LockEntities, track: string, exp: string, motRec: string): Observable<boolean> {
    return this.http.put<ApiResponse>(`${this.config.apiBaseUrl}${PEDIDOS_VALIDATOR_REJECT_FAC}/${lockType}/${track}/${exp}`, {
      motRec
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public getByFilters(filtros: any): Observable<PedidoProveedor[]> {
    let params = new HttpParams();
    
    Object.keys(filtros).forEach(key => {
      if(filtros[key]){
        params = params.append(key, filtros[key]);
      }
    });
    
    return this.http.get<PedidoProveedorDto[]>(`${this.config.apiBaseUrl}${PEDIDOS_VALIDATOR_GETBY_FILTER}`, { 
      params 
    }).pipe(
      map(dtos => dtos.map(dto => PedidoProveedor.parseDto(dto)))
    );
  }

}
