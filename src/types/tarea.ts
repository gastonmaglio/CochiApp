import type { Timestamp } from "firebase/firestore";

export type RepeticionTarea = "semanal" | "mensual" | null;

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  fechaVencimiento: Timestamp | null;
  asignadaA: string | null;
  repetir: RepeticionTarea;
  completada: boolean;
  completadaPor: string | null;
  completadaEn: Timestamp | null;
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}
