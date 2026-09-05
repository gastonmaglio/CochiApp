import type { Timestamp } from "firebase/firestore";

export interface Lista {
  id: string;
  nombre: string;
  categoriaGastoId: string | null;
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}
