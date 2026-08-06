import { ApiError } from './api.error';

export interface ApiResponse {
  error: boolean;
}

export interface ApiResponseWithErrors {
  error: boolean;
  errores: ApiError[];
}

export interface ApiResponseWithData {
  errores: ApiError[];
  found: boolean;
  datos: {};
}

//NO SE ESTA USANDO :: SEARCH LUPA
/*export interface ApiSearchResponse {
  found: boolean;
  datos: {
    contenedoresNum: number,
    articulosNum: number
  };
}*/

export interface ApiLockResponse {
  error: boolean;
  datos: {
    accion: number,
    //apellido1: string,
    //apellido2: string,
    //apellidosNombre: string,
    codigo: string,
    estado: number;
    inicio: string,
    nombre: string,
    timeoutMilliseconds: number;
    tipoCod: string,
    username: string,
  };
  errores: ApiError[];
}

export interface ApiResponseScheduledWithErrors {
  error: boolean;
  errores: ApiError[];
  lista: ApiResponseWithErrors[];
}

//NO SE ESTA USANDO :: SEARCH LUPA
/*export class ApiSearchData {
  public readonly contenedoresNum!: number;
  public readonly articulosNum!: number;

  public static parseDto(response: ApiSearchResponse): ApiSearchData {
    return Object.assign(new ApiSearchData(), response.datos);
  }

}*/

export class ApiLockData {
    public readonly locked!: boolean;
    public readonly accion!: number;
    public readonly codigo!: string;
    public readonly estado!: number;
    public readonly inicio!: string;
    public readonly nombre!: string;
    public readonly timeoutMilliseconds!: number;
    public readonly tipoCod!: string;
    public readonly username!: string;

    public constructor(resp: ApiLockResponse, locked?: boolean) {
      this.locked = (locked) ? locked : false;
      if (locked === false && resp.datos) {
        this.timeoutMilliseconds = resp.datos.timeoutMilliseconds;
      }
    }

    public static parseDto(response: ApiLockResponse): ApiLockData {
      return Object.assign(new ApiLockData(response), response.datos);
    }
  }
