import { ApiResponse } from '@core/services/api/api.response';
import { ApiError } from '@core/services/api/api.error';

export interface ErrorResponse extends ApiResponse {
  datosError: ApiError;
}
