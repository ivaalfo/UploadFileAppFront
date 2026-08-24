import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../api-client.service';
import { map } from 'rxjs/operators';
import { Transport } from '../../../data/shared/transport';
import { Truck } from 'src/app/data/shared/truck';
import { Container } from 'src/app/data/container/container';

const DRIVER_TRANSPORTS = 'api/v1/movil/transportes';
const DRIVER_TRANSPORTS_TRACTORS = 'api/v1/movil/transportes/camiones';
const PARKING_ZONE = 'api/v1/movil/contenedores/enparking';
const TRUCKS_PATH = 'api/v1/tractoras/all';

@Injectable({
  providedIn: 'root'
})
export class TransportService extends ApiClient {

  public getAllTransports(): Observable<Transport[]> {
    return this.http.get<Transport[]>(`${this.config.apiBaseUrl}${DRIVER_TRANSPORTS}`)
      .pipe(
        map(transport => transport.map(s => Transport.parseDto(s)))
      );
  }
  public getAllContainersInParkingZone(storeSelected: string): Observable<Container[]> {
    return this.http.get<Container[]>(`${this.config.apiBaseUrl}${PARKING_ZONE}/${storeSelected}`)
      .pipe(
        map(container => container.map(s => Container.parseDto(s)))
      );
  }

  public getTrucks(): Observable<Truck[]> {
    return this.http.get<Truck[]>(`${this.config.apiBaseUrl}${TRUCKS_PATH}/`)
      .pipe(
        map(truck => truck.map(s => Truck.parseDto(s)))
      );
  }

  public getTransportsByLicense(lincense: string): Observable<Transport[]> {
    return this.http.get<Transport[]>(`${this.config.apiBaseUrl}${DRIVER_TRANSPORTS_TRACTORS}/${lincense}`)
      .pipe(
        map(transport => transport.map(s => Transport.parseDto(s)))
      );
  }

  public getTransport(tranportNi: number): Observable<Transport> {
    return this.http.get<Transport>(`${this.config.apiBaseUrl}${DRIVER_TRANSPORTS}/${tranportNi}`)
      .pipe(
        map(transport => Transport.parseDto(transport))
      );
  }
}
