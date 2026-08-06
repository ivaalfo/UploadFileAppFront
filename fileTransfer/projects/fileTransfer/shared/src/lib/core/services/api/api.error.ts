export interface ApiError {
  codigo: string;
  descripcion: string;
}

export enum ApiErrorLocksCodes {
  LOCEKD = '01',
  ENDING = '02',
  USER_NOT_OWNER = '03',
  SESSION_NOT_OWNER = '04',
  NOT_ACTIVE_LOCK = '05',
}
