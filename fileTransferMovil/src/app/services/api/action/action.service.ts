import { Injectable } from '@angular/core';
import { ApiClient, ApiResponsePif } from '../../api-client.service';
import { map } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { ApiResponse } from '@ecna_npm/entralm-shared/lib/core/services/api/api.response';
import { Transport } from '../../../data/shared/transport';
import { Container } from 'src/app/data/container/container';

const TERMINAL_EXIT = 'api/v1/movil/recogida/enterminal';
const PIF_SCANNER_ENTRANCE = 'api/v1/movil/entrada/pif';
const PIF_SCANNER_RESULT = 'api/v1/movil/resultado/pif';
const PIF_SCANNER_EXIT = 'api/v1/movil/salida/pif';
const TERMINAL_RETURN = 'api/v1/movil/devolucion/aterminal';
const VENTILATION_PICKUP = 'api/v1/movil/recogida/enventilacion';
const STORE_ENTRANCE = 'api/v1/movil/entrada/almacen';
const TRUCK_INDOCK = 'api/v1/movil/entrega/enmuelle';
const VENTILATION_DELIVERY = 'api/v1/movil/entrega/paraventilacion';
const EMPTY_PICKUP = 'api/v1/movil/recogida/vacio';
const EMPTY_RETURN = 'api/v1/movil/devolucion/vacio';
const PARKINGORGAS_SELECTION = 'api/v1/movil/elegir/enparking';
const PARKING_SELECTION = 'api/v1/movil/entrega/enparking';
const VENTILATION_SELECTION = 'api/v1/movil/elegir/ventilacion';
const PARKING_PICKUP = 'api/v1/movil/recogida/enparking';
const STORE_ENTRANCE_EMPTY = 'api/v1/movil/solicitud/entrada/vacio';
// NEW TIMER OK
const CHECK_TIMER = 'api/v1/movil/timer';

@Injectable({
  providedIn: 'root'
})
export class ActionService extends ApiClient {

  // NEW TIMER OK 06/02/25
  public checkTimer(data: Transport): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${CHECK_TIMER}` , {
      matricula: data.matricula,
      contenedor: data.contenedor,
      transporteNi: data.transporteNi,
      eventoCod: data.hisEstadoCod,
      codDestino: data.destinoTipo,
      gasesEstadoCod: data.gasesEstadoCod,
      codMuelle: data.muelleDestino,
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public terminalExit(data: Transport): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${TERMINAL_EXIT}` , {
      matricula: data.matricula,
      contenedor: data.contenedor,
      codOrigen: data.origenCod,
      codDestino: data.destinoCod
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public pifScannerEntrance(data: Transport): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${PIF_SCANNER_ENTRANCE}` , {
      matricula: data.matricula,
      contenedor: data.contenedor,
      codOrigen: data.origenCod
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public selectionParkingOrGas(data: Transport, result: boolean): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${PARKINGORGAS_SELECTION}` , {
      conductor: data.conductorCod,
      matricula: data.matricula,
      contenedor: data.contenedor,
      codDestino: data.destinoCod,
      parking : (result === true) ? 1 : 0
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public selectionParking(data: Transport, isNOKGasState?: boolean): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${PARKING_SELECTION}` , {
      conductor: data.conductorCod,
      matricula: data.matricula,
      contenedor: data.contenedor,
      codDestino: (isNOKGasState ) ? data.origenCod : data.destinoCod
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public selectionVentilation(data: Transport): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${VENTILATION_SELECTION}` , {
      conductor: data.conductorCod,
      matricula: data.matricula,
      contenedor: data.contenedor,
      codDestino: data.destinoCod
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public parkingPickUp(data: Container, licensePlate: string): Observable<Transport> {
    return this.http.post<ApiResponsePif>(`${this.config.apiBaseUrl}${PARKING_PICKUP}` , {
      matricula: licensePlate,
      contenedor: data.contenedor,
      codOrigen: data.destinoCod, // the container destiny
    })
    .pipe(
      map(response => this.mapResponsepif(response))
    );
  }

  public pifScannerResult(data: Transport, result: boolean): Observable<Transport> {
    return this.http.post<ApiResponsePif>(`${this.config.apiBaseUrl}${PIF_SCANNER_RESULT}` , {
      matricula: data.matricula,
      contenedor: data.contenedor,
      resultadoPIFESC: result
    })
    .pipe(
      map(response => this.mapResponsepif(response))
    );
  }

  public pifScannerExit(data: Transport): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${PIF_SCANNER_EXIT}` , {
      matricula: data.matricula,
      contenedor: data.contenedor,
      codDestino: data.destinoCod
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public terminalReturn(data: Transport): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${TERMINAL_RETURN}` , {
      matricula: data.matricula,
      contenedor: data.contenedor,
      codDestino: data.destinoCod
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public ventilationPickUp(data: Transport): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${VENTILATION_PICKUP}` , {
      matricula: data.matricula,
      contenedor: data.contenedor,
      codDestino: data.destinoCod
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  // NEW TIMER OK
  public storeEntrance(data: Transport): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${STORE_ENTRANCE}` , {
      matricula: data.matricula,
      contenedor: data.contenedor,
      codDestino: data.destinoCod,
      transporteNi: data.transporteNi,
      eventoCod: data.hisEstadoCod,
      gasesEstadoCod: data.gasesEstadoCod
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  // NEW TIMER OK
  public truckInDock(data: Transport): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${TRUCK_INDOCK}` , {
      matricula: data.matricula,
      contenedor: data.contenedor,
      codDestino: data.destinoCod,
      codMuelle: data.muelleDestino,
      transporteNi: data.transporteNi,
      eventoCod: data.hisEstadoCod,
      gasesEstadoCod: data.gasesEstadoCod
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public ventilationDelivery(data: Transport): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${VENTILATION_DELIVERY}` , {
      matricula: data.matricula,
      contenedor: data.contenedor,
      codDestino: data.destinoCod
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public emptyPickUp(data: Transport): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${EMPTY_PICKUP}` , {
      matricula: data.matricula,
      contenedor: data.contenedor,
      codOrigen: data.origenCod
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  // NEW TIMER OK
  public emptyReturn(data: Transport): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${EMPTY_RETURN}` , {
      matricula: data.matricula,
      contenedor: data.contenedor,
      codDestino: data.destinoCod,
      transporteNi: data.transporteNi,
      eventoCod: data.hisEstadoCod
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

  public storeEntranceEmpty(lincensePlate: string, codStore): Observable<boolean> {
    return this.http.post<ApiResponse>(`${this.config.apiBaseUrl}${STORE_ENTRANCE_EMPTY}` , {
      matricula: lincensePlate,
      almacenCod: codStore
    })
    .pipe(
      map(response => this.mapResponse(response))
    );
  }

}
