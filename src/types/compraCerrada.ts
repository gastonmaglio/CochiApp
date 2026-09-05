import type { Timestamp } from "firebase/firestore";

export interface ItemSnapshot {
  nombre: string;
  cantidad: string | null;
  categoriaId: string;
  categoriaNombre: string;
  montoGastado: number | null;
  comprado: boolean;
}

export interface CompraCerrada {
  id: string;
  listaId: string;
  listaNombre: string;
  fecha: Timestamp;
  total: number;
  cantidadItems: number;
  itemsSnapshot: ItemSnapshot[];
  gastoGeneradoId: string | null;
  creadoPor: string;
}
