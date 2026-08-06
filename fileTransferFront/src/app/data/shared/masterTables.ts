export enum MasterTablesEnum {
  AUTOR_ROLES = 'AUTOR_ROLES',
  EMPRESAS = 'EMPRESAS'
}


export interface MasterTableDto {
  indice: number;
  clave: string;
  codigo: string;
  tipo: string;
  descEs: string;
  descEus: string;
  activo: boolean;
}

export class MasterTable {

  public readonly indice!: number;
  public readonly clave!: string;
  public readonly codigo!: string;
  public readonly tipo!: string;
  public readonly descEs!: string;
  public readonly descEus!: string;
  public readonly activo!: boolean;

  public static parseDto(masterTable: MasterTableDto): MasterTable {
    return Object.assign(new MasterTable(), masterTable);
  }
}
