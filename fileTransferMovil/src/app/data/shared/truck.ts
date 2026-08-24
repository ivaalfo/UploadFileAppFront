export interface TruckDto {
  camionNi: number;
  matricula: string;
  transportistaCod: string;
  fechaAlta: string;
  fechaBaja: string;
}

export class Truck {
  public readonly camionNi!: number;
  public readonly matricula!: string;
  public readonly transportistaCod!: string;
  public readonly fechaAlta!: string;
  public readonly fechaBaja!: string;

  public static parseDto(truck: TruckDto): Truck {
    return Object.assign(new Truck(), truck);
  }

}
