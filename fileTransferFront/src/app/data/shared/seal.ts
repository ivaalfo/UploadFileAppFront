export interface SealDto {
  precinto: string;
  tipo: string;
}

export class Seal {
  public readonly precinto!: string;
  public readonly tipo!: string;

  public static parseDto(seal: SealDto): Seal {
    return Object.assign(new Seal(), seal);
  }

}
