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
  // Cuántas veces se usó (item agregado o gasto cargado en esta categoría) — determina
  // el orden real en el selector: las que más usás aparecen primero, no las alfabéticas.
  vecesUsada: number;
  // Si es una subcategoría, el id de su categoría "padre" (una sola profundidad, no
  // cadenas de subcategorías de subcategorías). null = categoría de primer nivel.
  categoriaPadreId: string | null;
  // Solo tiene sentido en categoriasGastos — cuánto planean gastar por mes en esta
  // categoría. null = sin presupuesto definido (no se muestra barra de progreso).
  presupuesto: number | null;
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}
