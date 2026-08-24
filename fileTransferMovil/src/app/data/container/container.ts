import { Info } from '../shared/info';

export interface ContainerDto {
  contenedorKey: number;     // identificar único del contenedor
  contenedor: string;
  articuloKey: number;     // identificar único del articulo
  articulo: string;          // código de artículo
  confirmaPortic: string;
  tipoPortic: string;
  descargado: string;
  descarPorticFecha: string;
  despachoPorticNum: string;
  despachoPorticFecha: string;
  bloqueado: boolean;
  tipo: string;          // tipo/tamaño del contenedor 20, 40, etc
  numBultos: string;
  peso: number;              // peso del contenedor
  envasesCaja: string;
  transportistaCod: number;  // TODO: Este campo se debería unificar con transpCod. En back devuelve
  // transportistaCod para returns y transpCod para los demás
  transpCod: string;  // código del transportista
  opTranspTRCod: string;
  despachoFecha: string;
  despachoNum: string;
  vacio: string;
  vacioFecha: string;
  observaciones: string;
  gasesEstadoCod: string;       // estado de gases del contenedor
  gasesRiesgoCod: string;     // código del riesgo de gases
  estadoCod: string;          // código del estado del contenedor
  ATA: string;               // fecha real de llegada del buque, formato AAAAMMDD
  billOfLading: string;
  escala: string;
  urgente: 0 | 1;            // número indicador de urgencia, 1=urgente, 0=No urgente
  dispo: string;             // código de la disponibilidad. Es la semana y el año SSAA, pe: “5219”, “0120”, “3420”
  orden: string;
  eas: string;
  transportista: string;
  despachado: string;
  cambioFecha: string;
  precintos: string;
  grupo: string;             // código de grupo
  descarPortic: string;
  origenCod: string;         // código del origen asignado al contenedor o
  destinoCod: string;        // código del destino asignado al contenedor
  destinoDevCod: string;     // código del contenedor
  // bultos: PackageDto[];      // lista de bultos del contenedor
  posicionados: string;
  history: string;

  almacenCod: string;

}

export class Container {
  public readonly contenedorKey!: number;     // identificar único del contenedor
  public contenedor!: string;
  public readonly articuloKey!: number;     // identificar único del articulo
  public readonly articulo!: string;          // código de artículo
  public readonly confirmaPortic!: string;
  public readonly tipoPortic!: string;
  public readonly descargado!: string;
  public readonly descarPorticFecha!: string;
  public readonly despachoPorticNum!: string;
  public readonly despachoPorticFecha!: string;
  public readonly bloqueado!: boolean;
  public readonly tipo!: string;          // tipo/tamaño del contenedor 20, 40, etc
  public readonly numBultos!: string;
  public readonly peso!: number;              // peso del contenedor
  public readonly envasesCaja!: string;
  public readonly transportistaCod!: number;  // TODO: Este campos se debe unificar con transpCod
  public readonly transpCod!: string;  // código del transportista
  public readonly opTranspTRCod!: string;
  public readonly despachoFecha!: string;
  public readonly despachoNum!: string;
  public readonly vacio!: string;
  public readonly vacioFecha!: string;
  public readonly observaciones!: string;
  public readonly gasesEstadoCod!: string;       // estado de gases del contenedor
  public readonly gasesRiesgoCod!: string;     // código del riesgo de gases
  public readonly estadoCod!: string;          // código del estado del contenedor
  public readonly ATA!: string;               // fecha real de llegada del buque, formato AAAAMMDD
  public readonly billOfLading!: string;
  public readonly escala!: string;
  public readonly urgente!: 0 | 1;            // número indicador de urgencia, 1=urgente, 0=No urgente
  public readonly dispo!: string;             // código de la disponibilidad. Es la semana y el año SSAA, pe: “5219”, “0120”, “3420”
  public readonly orden!: string;
  public readonly eas!: string;
  public readonly transportista!: string;
  public readonly despachado!: string;
  public readonly cambioFecha!: string;
  public readonly precintos!: string;
  public readonly grupo!: string;             // código de grupo
  public readonly descarPortic!: string;
  public readonly origenCod!: string;         // código del origen asignado al contenedor o
  public readonly destinoCod!: string;        // código del destino asignado al contenedor
  public readonly destinoDevCod!: string;     // código del contenedor
  // public readonly bultos!: PackageDto[];      // lista de bultos del contenedor
  public readonly posicionados!: string;
  public readonly history!: string;

  public readonly almacenCod!: string;
  public readonly contEstadoCod!: string;

  public readonly muelle!: string;

  public constructor(container?: string, origin?: string, destiny?: string, dock?: string) {
    this.contenedor = container;
    this.origenCod = origin;
    this.destinoCod = destiny;
    this.muelle = dock;
  }

  public static parseDto(container: ContainerDto): Container {
    return Object.assign(new Container(), container);
  }

}
