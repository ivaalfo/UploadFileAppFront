import { PedidoProveedor } from "./pedido-proveedor";


export interface PedidoFilesDto {
    pedidoProveedor: PedidoProveedor;
	rutaCMR: string;
    estadoCMR: number;
    usuOkCMR: string;

    rutaFAC: string;
    estadoFAC: number;
    usuOkFAC: string;
    estadoFacturación: number;
    rutaOTR: string;
    
    fechaSubidaCMR: string;
    fechaOkCMR: string;
    fechaSubidaFAC: string;
    fechaOkFAC: string;
    fechaSubidaOTR: string;

    anotaciones: number;
    fechaEntReal: string;
}

export class PedidoFiles {
    public pedidoProveedor!: PedidoProveedor;

	public readonly rutaCMR!: string;
    public readonly estadoCMR!: number;
    public readonly usuOkCMR!: string;

    public readonly rutaFAC!: string;
    public readonly estadoFAC!: number;
    public readonly usuOkFAC!: string;
    public readonly estadoFacturación!: number;
    public readonly rutaOTR!: string;
    
    public readonly fechaSubidaCMR!: string;
    public readonly fechaOkCMR!: string;
    public readonly fechaSubidaFAC!: string;
    public readonly fechaOkFAC!: string;
    public readonly fechaSubidaOTR!: string;

    public readonly anotaciones!: number;
    public readonly fechaEntReal!: string;


    public constructor(archivos?: PedidoFiles) {
        if (archivos) {
            this.pedidoProveedor = archivos.pedidoProveedor;
            this.rutaCMR = archivos.rutaCMR;
            this.estadoCMR = archivos.estadoCMR;
            this.usuOkCMR = archivos.usuOkCMR;

            this.rutaFAC = archivos.rutaFAC;
            this.estadoFAC = archivos.estadoFAC;
            this.usuOkFAC = archivos.usuOkFAC;
            this.estadoFacturación = archivos.estadoFacturación;
            this.rutaOTR = archivos.rutaOTR;
            
            this.fechaSubidaCMR = archivos.fechaSubidaCMR;
            this.fechaOkCMR	= archivos.fechaOkCMR;
            this.fechaSubidaFAC	= archivos.fechaSubidaFAC;
            this.fechaOkFAC	= archivos.fechaOkFAC;
            this.fechaSubidaOTR	= archivos.fechaSubidaOTR;

            this.anotaciones = archivos.anotaciones;
            this.fechaEntReal = archivos.fechaEntReal;
        }
    }

    public static parseDto(archivos: PedidoFilesDto): PedidoFiles {
        return Object.assign(new PedidoFiles(), archivos);
    }

    //Tratamiento de fechas
    /*public get fechaSubidaCMRMoment(): moment.Moment {
        return moment(this.fechaSubidaCMR, SERVER_TIMESTAMP_DATE_FORMAT);
    }
    
    public get fechaSubidaCMRDate(): Date {
        return this.fechaSubidaCMRMoment.toDate();
    }
    
    public get fechaFinEMShort(): string {
        return (this.fechaSubidaCMRMoment.isValid()) ? this.fechaSubidaCMRMoment.format(DATE_TIME_FORMAT) : '';
    }*/

}