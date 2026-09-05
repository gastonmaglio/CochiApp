import type { Timestamp } from "firebase/firestore";

export interface Item {
  id: string;
  nombre: string;
  cantidad: string | null;
  categoriaId: string;
  notas: string | null;
  comprado: boolean;
  montoGastado: number | null;
  compradoPor: string | null;
  compradoEn: Timestamp | null;
  ordenIndex: number;
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}
