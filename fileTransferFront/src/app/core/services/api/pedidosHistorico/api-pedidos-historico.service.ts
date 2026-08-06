import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '@core/services/api/api-client.service';
import { PedidoProveedor, PedidoProveedorDto } from '@data/pedidos/pedido-proveedor';
import { HttpParams } from '@angular/common/http';
import { ApiResponse } from '../api.response';


const PEDIDOS_HISTORIC_GETBY_FILTER = 'api/v1/pedidosHistorico/getByFilter';
const PEDIDOS_HISTORIC_PUT_REACTIVAR = 'api/v1/pedidosHistorico/reactivarPedido';


@Injectable({
  providedIn: 'root'
})
export class PedidosHistoricoApiClient extends ApiClient {

  public setPedidoReactivar(track: string, exp: string): Observable<boolean>{
    return this.http.put<ApiResponse>(`${this.config.apiBaseUrl}${PEDIDOS_HISTORIC_PUT_REACTIVAR}/${track}/${exp}`, {
      track
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

    return this.http.get<PedidoProveedorDto[]>(`${this.config.apiBaseUrl}${PEDIDOS_HISTORIC_GETBY_FILTER}`, { 
      params 
    }).pipe(
      map(dtos => dtos.map(dto => PedidoProveedor.parseDto(dto)))
    );
  }

}
