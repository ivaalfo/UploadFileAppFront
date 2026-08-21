import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '@core/services/api/api-client.service';
import { PedidoProveedor, PedidoProveedorDto } from '@data/pedidos/pedido-proveedor';
import { ApiResponse } from '../api.response';
import { PedidoGrupaje } from '@data/pedidos/pedido-grupaje';
import { HttpParams } from '@angular/common/http';


const PEDIDOS_ACTIVOS_GET_GRUP = 'api/v1/pedidosActivos/getGrupaje';
const PEDIDOS_ACTIVOS_PUT_GRUP = 'api/v1/pedidosActivos/putGrupaje';

const PEDIDOS_ACTIVOS_PUT_FREAL = 'api/v1/pedidosActivos/putFecReal';
const PEDIDOS_ACTIVOS_PUT_FREAL_MULTIPLE = 'api/v1/pedidosActivos/putFecRealMultiple';
const PEDIDOS_ACTIVOS_PUT_ANULAR = 'api/v1/pedidosActivos/anularPedido';

const PEDIDOS_ACTIVOS_GETBY_FILTER = 'api/v1/pedidosActivos/getByFilter';



@Injectable({
  providedIn: 'root'
})
export class PedidosActivosApiClient extends ApiClient {

  public getGrupByTrack(track: string): Observable<PedidoGrupaje> {
    return this.http.get<PedidoGrupaje>(`${this.config.apiBaseUrl}${PEDIDOS_ACTIVOS_GET_GRUP}/${track}`);
  }

  public setGrupaje(grupTR: string, listaCompleta: any[]): Observable<boolean> {
    return this.http.put<ApiResponse>(`${this.config.apiBaseUrl}${PEDIDOS_ACTIVOS_PUT_GRUP}/${grupTR}`, {
      grupTR: grupTR,
      arrayGrulog: listaCompleta
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public setFecReal(track: string, exp: string, fechaEntReal: string): Observable<boolean> {
    return this.http.put<ApiResponse>(`${this.config.apiBaseUrl}${PEDIDOS_ACTIVOS_PUT_FREAL}/${track}/${exp}/${fechaEntReal}`, {
      track,
      fechaEntReal
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public setFecRealMultiple(listaPedidos: Array<{track: string, expediente: string, fechaEntReal: string}>): Observable<boolean> {
    return this.http.put<ApiResponse>(`${this.config.apiBaseUrl}${PEDIDOS_ACTIVOS_PUT_FREAL_MULTIPLE}`, {
      arrayFechas: listaPedidos
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public setPedidoNulo(track: string, exp: string, motivo: string): Observable<boolean>{
    return this.http.put<ApiResponse>(`${this.config.apiBaseUrl}${PEDIDOS_ACTIVOS_PUT_ANULAR}/${track}/${exp}`, {
      track,
      motivo
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
  
    return this.http.get<PedidoProveedorDto[]>(`${this.config.apiBaseUrl}${PEDIDOS_ACTIVOS_GETBY_FILTER}`, { 
      params 
    }).pipe(
      map(dtos => dtos.map(dto => PedidoProveedor.parseDto(dto)))
    );
  }

}
