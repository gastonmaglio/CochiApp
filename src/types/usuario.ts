import type { Timestamp } from "firebase/firestore";

export interface Usuario {
  uid: string;
  nombre: string;
  email: string;
  householdId: string | null;
  fotoUrl: string | null;
  creadoEn: Timestamp;
  actualizadoEn: Timestamp;
}
