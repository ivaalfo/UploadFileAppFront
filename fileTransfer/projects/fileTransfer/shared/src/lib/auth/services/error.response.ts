import { ApiError } from '../../core/services/api/api.error';
import { ApiResponse } from '../../core/services/api/api.response';

export interface ErrorResponse extends ApiResponse {
  datosError: ApiError;
}
