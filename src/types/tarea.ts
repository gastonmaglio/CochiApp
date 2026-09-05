import type { Timestamp } from "firebase/firestore";

export type RepeticionTarea = "semanal" | "mensual" | null;
export type PrioridadTarea = "baja" | "media" | "alta" | null;

export interface Subtarea {
  texto: string;
  hecha: boolean;
}

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string | null;
  fechaVencimiento: Timestamp | null;
  asignadaA: string | null;
  repetir: RepeticionTarea;
  prioridad: PrioridadTarea;
  subtareas: Subtarea[];
  completada: boolean;
  completadaPor: string | null;
  completadaEn: Timestamp | null;
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}
