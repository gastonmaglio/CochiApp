import type { Timestamp } from "firebase/firestore";

export interface Gasto {
  id: string;
  descripcion: string;
  monto: number;
  categoriaId: string;
  fecha: Timestamp;
  responsableUid: string | null;
  esRecurrente: boolean;
  recurrenteId: string | null;
  origenCompraCerradaId: string | null;
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}
