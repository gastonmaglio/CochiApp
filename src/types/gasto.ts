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
  // Reparto personalizado opcional (uid -> cuánto puso esa persona) para un gasto
  // compartido que no fue 50/50. null = sin reparto personalizado (se asume 50/50 al
  // calcular el saldo personal de cada uno).
  division: Record<string, number> | null;
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}
