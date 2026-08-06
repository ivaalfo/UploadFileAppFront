import * as moment from 'moment';
import { SERVER_TIMESTAMP_DATE_FORMAT } from '@core/services/api/api.constants';

export interface LastChangesDto {
  inicio: string;
  fin: string;
  tipoCod: string;
  apellidosNombre: string;
  username: string;
  nombre: string;
  apellido1: string;
  apellido2: string;
  almacenCod: string;
}

export class LastChanges {
  public readonly inicio!: string;
  public readonly fin!: string;
  public readonly tipoCod!: string;
  public readonly apellidosNombre!: string;
  public readonly username!: string;
  public readonly nombre!: string;
  public readonly apellido1!: string;
  public readonly apellido2!: string;
  public readonly almacenCod!: string;

  public static parseDto(data: LastChangesDto): LastChanges {
    return Object.assign(new LastChanges(), data);
  }

  public get endMoment(): moment.Moment {
    return moment(this.fin, SERVER_TIMESTAMP_DATE_FORMAT);
  }

  public get endDate(): Date {
    return this.endMoment.toDate();
  }
  public get endDateShort(): string {
    return this.endMoment.format('HH:mm, DD/MM/YYYY ');
  }
  public get info(): string {

    return  (this.fin) ? this.endDateShort + ', ' + this.nombre + ' ' + this.apellido1 + ' ' + this.apellido2 : '' ;
  }

}
