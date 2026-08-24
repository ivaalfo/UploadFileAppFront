import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApiResponse, ApiResponseWithErrors, ApiResponseWithData } from '@ecna_npm/entralm-shared/lib/core/services/api/api.response';
import { ConfigurationService } from '@ecna_npm/entralm-shared';
import { TransportDto, Transport } from '../data/shared/transport';

@Injectable({
  providedIn: 'root'
})
export class ApiClient {

  public constructor(
    public http: HttpClient,
    public config: ConfigurationService
  ) { }

  public contentTypeJsonHeader = { headers: new HttpHeaders().set('Content-Type', 'application/json') };

  public mapResponse(response: ApiResponse): boolean {
    if (response && response.error) {
      const errorResponse = response as ApiResponseWithErrors;
      const error = errorResponse.errores[0].descripcion;
      alert(error);
      return false;
    }

    return true;
  }
  public mapResponseWithData(response: ApiResponseWithData): ApiResponseWithData {
    if (response && !response.found) {
      alert('DATA NOT FOUND');
    }
    return response;
  }
  public mapResponsepif(response: ApiResponsePif): Transport {
    if (response && response.error) {
      alert('DATA NOT FOUND');
    }
    return Transport.parseDto(response.datos as TransportDto);
  }
}

export interface ApiResponsePif {
  datos: {};
  error: boolean;
}
