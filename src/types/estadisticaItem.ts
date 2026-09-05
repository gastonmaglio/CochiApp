import type { Timestamp } from "firebase/firestore";

export interface EstadisticaItem {
  id: string;
  nombre: string;
  vecesComprado: number;
  ultimaCategoriaId: string | null;
  ultimaVez: Timestamp;
}
