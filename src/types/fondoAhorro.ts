import type { Timestamp } from "firebase/firestore";

export type TipoFondoAhorro = "personal" | "compartido";

// Un fondo compartido guarda acá su metadata (nombre, meta, total) — es lo único de un
// fondo de ahorro que ven los dos integrantes. Los aportes puntuales de cada uno viven
// aparte, en aportesFondo/{uid}/movimientos (ver AporteFondo), donde cada uno ve solo
// los propios.
export interface FondoAhorro {
  id: string;
  nombre: string;
  tipo: TipoFondoAhorro;
  montoObjetivo: number | null;
  total: number;
  creadoPor: string;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}

// Un aporte (o retiro, si monto es negativo) a un fondo — propio, nunca visible para
// la pareja aunque el fondo sea compartido.
export interface AporteFondo {
  id: string;
  fondoId: string;
  fondoTipo: TipoFondoAhorro;
  monto: number;
  descripcion: string | null;
  fecha: Timestamp;
  creadoEn: Timestamp;
}
