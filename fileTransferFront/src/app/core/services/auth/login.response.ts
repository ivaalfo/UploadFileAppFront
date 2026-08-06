import { UserRoles } from '@data/user-roles';
import { ApiResponse } from '@core/services/api/api.response';

export interface LoginResponse extends ApiResponse {
  datosLogin: LoginData;
  datosToken: TokenData;
}

export interface LoginData {
  nif: string;
  username: string;
  nombre: string;
  roles: UserRoles[];
  manFileNameES: string;
  manFileNameEN: string;
}

export interface TokenData {
  expirationMin: number;
  timestamp: string;
  JWT: string;
  refreshtoken: string;
}
