import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse, ApiResponseWithData } from '@core/services/api/api.response';
import { ApiClient } from '@core/services/api/api-client.service';
import { User, UserDto } from '@data/maintenance/users';

const USER_MAINTENANCE_GETALL = 'api/v1/usuarios/allmtto';
const USER_MAINTENANCE_GET = 'api/v1/usuarios';
const USER_MAINTENANCE_PUT = 'api/v1/usuarios/';
const USER_MAINTENANCE_POST = 'api/v1/usuarios/';
const USER_MAINTENANCE_DELETE = 'api/v1/usuarios';
const USER_MAINTENANCE_REACTIVATE = 'api/v1/usuarios/reactivar';

@Injectable({
  providedIn: 'root'
})
export class UserMaintenanceApiClient extends ApiClient {

  public getAll(): Observable<User[]> {
    return this.http.get<UserDto[]>(`${this.config.apiBaseUrl}${USER_MAINTENANCE_GETALL}`).pipe(
      map(users => users.map(a => User.parseDto(a)))
    );
  }

  public get(ni: number): Observable<ApiResponseWithData> {
    return this.http.get<ApiResponseWithData>(`${this.config.apiBaseUrl}${USER_MAINTENANCE_GET}/${ni}`)
    .pipe(
      map(response => this.mapResponseWithData(response))
    );
  }

  public put(user: User): Observable<boolean> {
    return this.http.put<ApiResponse>(`${this.config.apiBaseUrl}${USER_MAINTENANCE_PUT}`,
      user
    )
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public post(user: User): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${USER_MAINTENANCE_POST}`,
      user
    )
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public delete(ni: number): Observable<number> {
    return this.http.delete<number>(`${this.config.apiBaseUrl}${USER_MAINTENANCE_DELETE}/${ni}`)
    .pipe(
      map(response => response)
    );
  }

  public reactivate(ni: number): Observable<boolean> {
     return this.http.put<ApiResponse>(`${this.config.apiBaseUrl}${USER_MAINTENANCE_REACTIVATE}/${ni}`,
      ni
    )
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

}
