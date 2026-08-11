export interface GrupajeItem {
  grupNum: string;
  expediente: string;
  refCarga: string;
  opcionCMR: boolean;
  opcionFAC: boolean;
}

export interface PedidoGrupaje {
  grupTR: string;
  arrayGrulog: GrupajeItem[];
}