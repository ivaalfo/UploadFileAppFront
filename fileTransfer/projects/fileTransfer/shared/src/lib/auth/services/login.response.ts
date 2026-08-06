import { ApiResponse } from '../../core/services/api/api.response';
import { UserRoles } from '../../data/user-roles';

export interface LoginResponse extends ApiResponse {
  datosLogin: LoginData;
  datosToken: TokenData;
}

export interface LoginData {
  nif: string;
  username: string;
  nombre: string;
  roles: UserRoles[];
}

export interface TokenData {
  expirationMin: number;
  timestamp: string;
  JWT: string;
  refreshtoken: string;
}
