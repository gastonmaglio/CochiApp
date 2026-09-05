import type { Timestamp } from "firebase/firestore";

export interface GastoRecurrente {
  id: string;
  descripcion: string;
  monto: number;
  categoriaId: string;
  responsableUid: string | null;
  diaDelMes: number;
  activo: boolean;
  ultimaGeneracion: string | null;
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}
