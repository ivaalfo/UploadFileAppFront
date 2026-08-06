import { DATE_FORMAT_IV, SERVER_DATE_FORMAT } from '@core/services/api/api.constants';
import { UserRoles } from '@data/user-roles';
import * as moment from 'moment';

export interface UserDto {
  username: string;
  //visiblePassword: string;
  w2usuky: number;
  w2usuario: string;
  w2email: string;
	w2contras: string;

  clinom: string;
	clidir: string;
	clicif: string;
  clicodpro: string;
  roles: string[];
  rol: string;

  w2fecr: string;
  w2feca: string;
  w2uscr: string;
  w2usca: string;

  w3usuky: number;
  w3tipo: number;
}

export class User {
  public readonly username!: string;
  //public readonly visiblePassword!: string;
  public readonly w2usuky!: number;
  public readonly w2usuario!: string;
	public readonly w2email!: string;
	public readonly w2contras!: string;

  public readonly clinom!: string;
	public readonly clidir!: string;
	public readonly clicif!: string;
	public readonly clicodpro!: string;
  public readonly roles!: string[];
  public readonly rol!: string;

  public readonly w2fecr!: string;
  public readonly w2feca!: string;
  public readonly w2uscr!: string;
  public readonly w2usca!: string;

  public readonly w3usuky!: number;
  public readonly w3tipo!: number;

  public fechaBaja!: string;
  public isEditable: boolean = false;

  
  public constructor(user?: User) {
    if (user) {
      this.username = user.username;
      //this.visiblePassword = user.visiblePassword;
      this.w2usuky = user.w2usuky;
      this.w2usuario = user.w2usuario;
      this.w2email = user.w2email;
      this.w2contras = user.w2contras;

      this.clinom = user.clinom;
      this.clidir = user.clidir;
      this.clicif = user.clicif;
      this.clicodpro = user.clicodpro;
      this.roles = user.roles;
      this.rol = user.rol;

      this.w2fecr = user.w2fecr;
      this.w2feca = user.w2feca;
      this.w2uscr = user.w2uscr;
      this.w2usca = user.w2usca;

      this.w3usuky = user.w3usuky;
      this.w3tipo = user.w3tipo;
      
      this.fechaBaja = user.fechaBaja;
      this.isEditable = user.isEditable;
    }
  }

  public static parseDto(user: UserDto): User {
    return Object.assign(new User(), user);
  }

  public get isTerminated(): boolean {
    //return this.fechaBajaMoment.isValid() ? true : false;
    return this.rol == UserRoles.SinAcceso ? true : false;
  }

  /*public get isFTnoUser(): boolean {
    return (this.roles === (UserRoles.SinAcceso)) ? true : false ;
  }*/
  
  /*public companyDescription(companies: MasterTable[]): string {
    if (this.empresaCod) {
      const found = companies.find(c => c.codigo === this.empresaCod);
      return (found) ? found.descEs : '';
    }
    return '';
  }*/

  //NO SE ESTAN USANDO -STRING
  public get fechaCreacionDate(): Date {
    return this.fechaCreacionMoment.toDate();
  }
  public get fechaCreacionMoment(): moment.Moment {
    return moment(this.w2fecr, SERVER_DATE_FORMAT);
  }
  public get fechaCreacionShort(): string {
    return (this.fechaCreacionMoment.isValid()) ? this.fechaCreacionMoment.format(DATE_FORMAT_IV) : '';
  }

  //NO SE ESTAN USANDO -STRING
  public get fechaCambionDate(): Date {
    return this.fechaCambioMoment.toDate();
  }
  public get fechaCambioMoment(): moment.Moment {
    return moment(this.w2feca, SERVER_DATE_FORMAT);
  }
  public get fechaCambioShort(): string {
    return (this.fechaCambioMoment.isValid()) ? this.fechaCambioMoment.format(DATE_FORMAT_IV) : '';
  }
}
