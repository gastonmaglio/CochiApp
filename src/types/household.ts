import type { Timestamp } from "firebase/firestore";

export interface Household {
  id: string;
  nombre: string;
  miembros: string[];
  codigoActivo: string | null;
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

export interface Categoria {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  predefinida: boolean;
  orden: number;
  // Solo tiene sentido en categoriasGastos — cuánto planean gastar por mes en esta
  // categoría. null = sin presupuesto definido (no se muestra barra de progreso).
  presupuesto: number | null;
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}
