import { ApiError } from './api.error';

export interface ApiResponse {
  error: boolean;
}

export interface ApiResponseWithErrors {
  error: boolean;
  errores: ApiError[];
}

export interface ApiResponseWithData {
  found: boolean;
  datos: {};
}
