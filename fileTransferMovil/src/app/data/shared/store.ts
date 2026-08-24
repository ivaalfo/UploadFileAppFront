export interface StoreDto {
  codigo: string;
  nombre: string;
}

export class Store {
  public readonly codigo!: string;
  public readonly nombre!: string;

  public static parseDto(store: StoreDto): Store {
    return Object.assign(new Store(), store);
  }

  public get descripcion(): string {
    return this.codigo + ' - ' + this.nombre;
  }
}
