import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { MovimientoPrivado, TipoMovimientoPrivado } from "@/types/movimientoPrivado";

function coleccionMovimientos(householdId: string, uid: string) {
  return collection(db, "households", householdId, "finanzasPrivadas", uid, "movimientos");
}

export function escucharMovimientosPrivados(
  householdId: string,
  uid: string,
  callback: (movimientos: MovimientoPrivado[]) => void
): () => void {
  const q = query(coleccionMovimientos(householdId, uid), orderBy("fecha", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MovimientoPrivado, "id">) })));
  });
}

export async function crearMovimientoPrivado(
  householdId: string,
  uid: string,
  datos: { tipo: TipoMovimientoPrivado; descripcion: string; monto: number; fecha: Date }
): Promise<string> {
  const ref = await addDoc(coleccionMovimientos(householdId, uid), {
    tipo: datos.tipo,
    descripcion: datos.descripcion,
    monto: datos.monto,
    fecha: Timestamp.fromDate(datos.fecha),
    creadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function eliminarMovimientoPrivado(
  householdId: string,
  uid: string,
  movimientoId: string
): Promise<void> {
  await deleteDoc(doc(coleccionMovimientos(householdId, uid), movimientoId));
}
