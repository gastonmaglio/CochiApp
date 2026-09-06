import type { Timestamp } from "firebase/firestore";

export type TipoMovimientoPrivado = "ingreso" | "gasto";

export interface MovimientoPrivado {
  id: string;
  tipo: TipoMovimientoPrivado;
  descripcion: string;
  monto: number;
  fecha: Timestamp;
  creadoEn: Timestamp;
}
