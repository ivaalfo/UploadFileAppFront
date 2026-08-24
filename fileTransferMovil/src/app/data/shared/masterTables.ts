export enum MasterTablesEnum {
  GAS_RIESGO = 'GAS_RIESGO',
  TIPO_BLOQUEO = 'TIPO_BLOQUEO',
  AUTOR_ROLES = 'AUTOR_ROLES',
  PUNTO_TRANSP = 'PUNTO_TRANSP',
  ESTADO_CONT = 'ESTADO_CONT',
  GAS_ESTADO = 'GAS_ESTADO',
  CRONO_CONT   = 'CRONO_CONT'
}

export interface MasterTableDto {
  indice: number;
  codigo: string;
  tipo: string;
  descEs: string;
  descEus: string;
  activo: boolean;
}

export class MasterTable {

  public readonly indice!: number;
  public readonly codigo!: string;
  public readonly tipo!: string;
  public readonly descEs!: string;
  public readonly descEus!: string;
  public readonly activo!: boolean;

  public static parseDto(masterTable: MasterTableDto): MasterTable {
    return Object.assign(new MasterTable(), masterTable);
  }
}
