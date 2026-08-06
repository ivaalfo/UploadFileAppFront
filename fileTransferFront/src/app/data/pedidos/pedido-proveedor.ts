import { DATE_FORMAT_IV, DATE_FORMAT_PICKER, SERVER_DATE_FORMAT, 
  SERVER_TIMESTAMP_DATE_FORMAT } from "@core/services/api/api.constants";
import * as moment from "moment";


export interface PedidoProveedorDto {
  proveedorKy: number;
  proveedor: string;
  track: string;
  expediente: string;
  fechaCarga: string;
  refCarga: string;
  fechaDescarga: string;
  refDescarga: string;
  origen: string;
  destino: string;
  numPalets: number;
  matriculaCamion: string;
  matriculaRemolque: string;

  org: string;
  hasCMR: number;
  hasFAC: number;
  hasOTR: number;
  estado: number;

  motivoRechazo: string;
  anotaciones: number;
  fechaEntReal: string;

  grupaje: boolean;
  grupTR: string;
  grupNum: string;

}

export class PedidoProveedor {
  public readonly proveedorKy!: number;
  public readonly proveedor!: string;
  public readonly proveedorUser!: string;
  public readonly track!: string;
  public readonly expediente!: string;
  public readonly fechaCarga!: string;
  public readonly refCarga!: string;
  public readonly fechaDescarga!: string;
  public readonly refDescarga!: string;
  public readonly origen!: string;
  public readonly destino!: string;
  public readonly numPalets!: number;
  public readonly matriculaCamion!: string;
  public readonly matriculaRemolque!: string;

  public readonly org!: string;
  public readonly hasCMR!: number;
  public readonly hasFAC!: number;
  public readonly hasOTR!: number;
  public readonly estado!: number;

  public isSelected: boolean = false;
  public isRejected: boolean = false;
  public isBlocked: boolean = false;
  
  public motivoRechazo!: string;
  public anotaciones!: number;
  public fechaEntReal!: string;

  public readonly fechaSubidaCMR!: Date;
  public readonly fechaSubidaFAC!: Date;

  public readonly grupaje!: boolean;
  public readonly grupTR!: string;
  public readonly grupNum!: string;

  public isGrupaje: boolean = false;
  public isCheckActive: boolean = false;

  public facNumber!: string;
  

  public constructor(pedido?: PedidoProveedor) {
    if (pedido) {
      this.proveedorKy = pedido.proveedorKy;
      this.proveedor = pedido.proveedor;
      this.proveedorUser = pedido.proveedorUser;
      this.track = pedido.track;
      this.expediente = pedido.expediente;
      this.fechaCarga = pedido.fechaCarga;
      this.refCarga = pedido.refCarga;
      this.fechaDescarga = pedido.fechaDescarga;
      this.refDescarga = pedido.refDescarga;
      this.origen = pedido.origen;
      this.destino = pedido.destino;
      this.numPalets = pedido.numPalets;
      this.matriculaCamion = pedido.matriculaCamion;
      this.matriculaRemolque = pedido.matriculaRemolque;

      this.org = pedido.org;
      this.hasCMR = pedido.hasCMR;
      this.hasFAC = pedido.hasFAC;
      this.hasOTR = pedido.hasOTR;
      this.estado = pedido.estado;

      this.isSelected = pedido.isSelected;
      this.isRejected = pedido.isRejected;
      this.isBlocked = pedido.isBlocked;
      
      this.motivoRechazo = pedido.motivoRechazo;
      this.anotaciones = pedido.anotaciones;
      this.fechaEntReal = pedido.fechaEntReal;

      this.fechaSubidaCMR = pedido.fechaSubidaCMR;
      this.fechaSubidaFAC = pedido.fechaSubidaFAC;

      this.grupaje = pedido.grupaje;
      this.grupTR = pedido.grupTR;
      this.grupNum = pedido.grupNum;

      this.isGrupaje = pedido.isGrupaje;
      this.isCheckActive = pedido.isCheckActive;

      this.facNumber = pedido.facNumber;
    }
  }  

  public static parseDto(pedido: PedidoProveedorDto): PedidoProveedor {
    return Object.assign(new PedidoProveedor(), pedido);
  }

  /*--------------Tratamiento de fechas------------------*/
  //CARGA
  public get fechaCargaDate(): Date {
    return this.fechaCargaMoment.toDate();
  }
  public get fechaCargaMoment(): moment.Moment {
    return moment(this.fechaCarga, SERVER_TIMESTAMP_DATE_FORMAT);
  }

  //DESCARGA
  public get fechaDescargaDate(): Date {
    return this.fechaDescargaMoment.toDate();
  }
  public get fechaDescargaMoment(): moment.Moment {
    return moment(this.fechaDescarga, SERVER_TIMESTAMP_DATE_FORMAT);
  }

  //REAL
  public get fechaEntRealDate(): Date {
    return this.fechaEntRealMoment.toDate();
  }
  public get fechaEntRealMoment(): moment.Moment {
    return moment(this.fechaEntReal, SERVER_TIMESTAMP_DATE_FORMAT);
  }
  public get fechaEntRealShort(): string {
    return (this.fechaEntRealMoment.isValid()) ? this.fechaEntRealMoment.format(DATE_FORMAT_PICKER) : '';
  }

  //SUBIDA CMR
  public get fechaSubidaCMRDate(): Date {
    return this.fechaSubidaCMRMoment.toDate();
  }
  public get fechaSubidaCMRMoment(): moment.Moment {
    return moment(this.fechaSubidaCMR, SERVER_DATE_FORMAT);
  }
  public get fechaSubidaCMRshort(): string {
    return (this.fechaSubidaCMRMoment.isValid()) ? this.fechaSubidaCMRMoment.format(DATE_FORMAT_IV) : '';
  }

  //SUBIDA FAC
  public get fechaSubidaFACDate(): Date {
    return this.fechaSubidaFACMoment.toDate();
  }
  public get fechaSubidaFACMoment(): moment.Moment {
    return moment(this.fechaSubidaFAC, SERVER_DATE_FORMAT);
  }
  public get fechaSubidaFACshort(): string {
    return (this.fechaSubidaFACMoment.isValid()) ? this.fechaSubidaFACMoment.format(DATE_FORMAT_IV) : '';
  }

}
