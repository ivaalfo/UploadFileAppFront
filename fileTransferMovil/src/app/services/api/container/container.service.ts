import { Injectable } from '@angular/core';
import { ApiClient } from '../../api-client.service';
import { ApiResponseWithData } from '@ecna_npm/entralm-shared/lib/core/services/api/api.response';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

const EDIT_CONTAINER = 'api/v1/contenedores/ficha';

@Injectable({
  providedIn: 'root'
})
export class ContainerService extends ApiClient {

  public getContainer(containerKey: number): Observable<ApiResponseWithData> {
    // const url = `${this.config.apiBaseUrl}${EDIT_CONTAINER}/${containerKey}`;
    const url = `${EDIT_CONTAINER}`;
    // TODO: Obtener a través de la matricula
    return this.http.get<ApiResponseWithData>(url, {})
      .pipe(
        map(response => this.mapResponseWithData(response))
      );
  }
}
