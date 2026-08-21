import { DATE_TIME_FORMAT, SERVER_TIMESTAMP_DATE_FORMAT } from "@core/services/api/api.constants";
import * as moment from "moment";


export interface PedidoFirmadorDto {
  f3refPed: string;
  f3expediente: string;
  f3refCarga: string;
  f3matricula: string;
  f3remolque: string;
  
  f3cliCod: string;
  provUser: string;
  f3destCod: string;
  destUser: string;

  f3rutCMR: string;
  f3useCMR: string;
  f3estado: number;

  f3fechaCreacionCMR: string
  f3anotaMart: string;
  f3fechaFirmaTrans: string
  f3anotaTrans: string;
  f3fechaFirmaDest: string
  f3anotaDest: string;
}

export class PedidoFirmador {
  public readonly f3refPed!: string;
  public readonly f3expediente!: string;
  public readonly f3refCarga!: string;
  public readonly f3matricula!: string;
  public readonly f3remolque!: string;
  
  public readonly f3cliCod!: string;
  public readonly provUser!: string;
  public readonly f3destCod!: string;
  public readonly destUser!: string;

  public readonly f3rutCMR!: string;
  public readonly f3useCMR!: string;
  public readonly f3estado!: number;

  public readonly f3fechaCreacionCMR!: Date;
  public f3anotaMart!: string;
  public readonly f3fechaFirmaTrans!: Date;
  public f3anotaTrans!: string;
  public readonly f3fechaFirmaDest!: Date;
  public f3anotaDest!: string;


  public isSelected: boolean = false;
  public isBlocked: boolean = false;
  public isCheckActive: boolean = false;


  public constructor(pedido?: PedidoFirmador) {
    if (pedido) {
        this.f3refPed = pedido.f3refPed;
        this.f3expediente = pedido.f3expediente;
        this.f3refCarga = pedido.f3refCarga;
        this.f3matricula = pedido.f3matricula;
        this.f3remolque = pedido.f3remolque;
        
        this.f3cliCod = pedido.f3cliCod;
        this.provUser = pedido.provUser;
        this.f3destCod = pedido.f3destCod;
        this.destUser = pedido.destUser;
        
        this.f3rutCMR = pedido.f3rutCMR;
        this.f3useCMR = pedido.f3useCMR;
        this.f3estado = pedido.f3estado;

        this.f3fechaCreacionCMR = pedido.f3fechaCreacionCMR;
        this.f3anotaMart = pedido.f3anotaMart;
        this.f3fechaFirmaTrans = pedido.f3fechaFirmaTrans;
        this.f3anotaTrans = pedido.f3anotaTrans;
        this.f3fechaFirmaDest = pedido.f3fechaFirmaDest;
        this.f3anotaDest = pedido.f3anotaDest;
    }
  }  

  public static parseDto(pedido: PedidoFirmadorDto): PedidoFirmador {
    return Object.assign(new PedidoFirmador(), pedido);
  }

  /*--------------Tratamiento de fechas------------------*/
  //CREACION
  public get fechaCreacionDate(): Date {
    return this.fechaCreacionMoment.toDate();
  }
  public get fechaCreacionMoment(): moment.Moment {
    return moment(this.f3fechaCreacionCMR, SERVER_TIMESTAMP_DATE_FORMAT);
  }
  public get fechaCreacionCMRshort(): string {
    return (this.fechaCreacionMoment.isValid()) ? this.fechaCreacionMoment.format(DATE_TIME_FORMAT) : '';
  }

  //FIRMA 2
  public get fechaFirmaTrasDate(): Date {
    return this.fechaFirmaTrasMoment.toDate();
  }
  public get fechaFirmaTrasMoment(): moment.Moment {
    return moment(this.f3fechaFirmaTrans, SERVER_TIMESTAMP_DATE_FORMAT);
  }
  public get fechaFirmaTransShort(): string {
    return (this.fechaFirmaTrasMoment.isValid()) ? this.fechaFirmaTrasMoment.format(DATE_TIME_FORMAT) : '';
  }

  //FIRMA 3
  public get fechaFirmaDestDate(): Date {
    return this.fechaFirmaDestMoment.toDate();
  }
  public get fechaFirmaDestMoment(): moment.Moment {
    return moment(this.f3fechaFirmaDest, SERVER_TIMESTAMP_DATE_FORMAT);
  }
  public get fechaFirmaDestShort(): string {
    return (this.fechaFirmaDestMoment.isValid()) ? this.fechaFirmaDestMoment.format(DATE_TIME_FORMAT) : '';
  }

}
