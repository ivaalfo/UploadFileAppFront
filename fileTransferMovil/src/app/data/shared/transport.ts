export interface TransportDto {
  camionNi: number;
  conductorCod: string;
  conductorNi: number;
  contenedor: string;
  contenedorKey: number;
  destinoClave: string;
  destinoCod: string;
  destinoTipo: string;
  devolucion: boolean;
  estadoCod: string;
  fechaHoraIni: string;
  fechaHoraReg: number; // NEW TIMER OK
  finalizado: boolean;
  gasesEstadoCod: string;
  hisEstadoCod: string;
  hisEstadoInd: string;
  matricula: string;
  muelleDestino: string;
  muelleDestinoNi: number;
  muelleOrigen: string;
  muelleOrigenNi: number;
  orden: number;
  origenClave: string;
  origenCod: string;
  origenTipo: string;
  tiempoEspera: number; // NEW TIMER OK
  transporteNi: number;
  transportistaCod: string;
  pin: string;
}

export class Transport {
  public readonly camionNi!: number;
  public readonly conductorCod!: string;
  public readonly conductorNi!: number;
  public readonly contenedor!: string;
  public readonly contenedorKey!: number;
  public readonly destinoClave!: string;
  public readonly destinoCod!: string;
  public readonly destinoTipo!: string;
  public readonly devolucion!: boolean;
  public readonly estadoCod!: string;
  public readonly fechaHoraIni!: string;
  public fechaHoraReg!: number; // NEW TIMER OK
  public readonly finalizado!: boolean;
  public readonly gasesEstadoCod!: string;
  public readonly hisEstadoCod!: string;
  public readonly hisEstadoInd!: string;
  public readonly matricula!: string;
  public readonly muelleDestino!: string;
  public readonly muelleDestinoNi!: number;
  public readonly muelleOrigen!: string;
  public readonly muelleOrigenNi!: number;
  public readonly orden!: number;
  public readonly origenClave!: string;
  public readonly origenCod!: string;
  public readonly origenTipo!: string;
  public tiempoEspera!: number; // NEW TIMER OK
  public readonly transporteNi!: number;
  public readonly transportistaCod!: string;
  public readonly pin!: string;

  public readonly contEstadoCod!: string;

  public static parseDto(transport: TransportDto): Transport {
    return Object.assign(new Transport(), transport);
  }

}
