import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Gasto } from "@/types/gasto";
import { incrementarUsoCategoria } from "@/lib/services/categorias.service";

export interface DatosGasto {
  descripcion: string;
  monto: number;
  categoriaId: string;
  fecha: Timestamp;
  responsableUid: string | null;
  esRecurrente?: boolean;
  recurrenteId?: string | null;
  origenCompraCerradaId?: string | null;
  division?: Record<string, number> | null;
}

/**
 * Todos los gastos del hogar, sin filtrar por mes — hace falta para calcular el saldo
 * personal de cada uno (ingresos privados menos su parte de TODOS los gastos compartidos
 * de siempre, no solo los de este mes).
 */
export function escucharTodosLosGastos(
  householdId: string,
  callback: (gastos: Gasto[]) => void
): () => void {
  const q = query(collection(db, "households", householdId, "gastos"), orderBy("fecha", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Gasto, "id">) })));
  });
}

export function escucharGastosDelMes(
  householdId: string,
  inicio: Date,
  fin: Date,
  callback: (gastos: Gasto[]) => void
): () => void {
  const q = query(
    collection(db, "households", householdId, "gastos"),
    where("fecha", ">=", Timestamp.fromDate(inicio)),
    where("fecha", "<", Timestamp.fromDate(fin)),
    orderBy("fecha", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Gasto, "id">) })));
  });
}

export async function crearGasto(
  householdId: string,
  uid: string,
  datos: DatosGasto
): Promise<string> {
  const ref = await addDoc(collection(db, "households", householdId, "gastos"), {
    descripcion: datos.descripcion,
    monto: datos.monto,
    categoriaId: datos.categoriaId,
    fecha: datos.fecha,
    responsableUid: datos.responsableUid,
    esRecurrente: datos.esRecurrente ?? false,
    recurrenteId: datos.recurrenteId ?? null,
    origenCompraCerradaId: datos.origenCompraCerradaId ?? null,
    division: datos.division ?? null,
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  incrementarUsoCategoria(householdId, "categoriasGastos", datos.categoriaId).catch(
    (error: unknown) => {
      console.error("No se pudo actualizar el uso de la categoría", error);
    }
  );
  return ref.id;
}

export async function editarGasto(
  householdId: string,
  gastoId: string,
  datos: DatosGasto
): Promise<void> {
  await updateDoc(doc(db, "households", householdId, "gastos", gastoId), {
    descripcion: datos.descripcion,
    monto: datos.monto,
    categoriaId: datos.categoriaId,
    fecha: datos.fecha,
    responsableUid: datos.responsableUid,
    division: datos.division ?? null,
    actualizadoEn: serverTimestamp(),
  });
}

/**
 * Devuelve una copia del gasto antes de borrarlo, para poder deshacer.
 */
export async function eliminarGasto(householdId: string, gastoId: string): Promise<Gasto> {
  const ref = doc(db, "households", householdId, "gastos", gastoId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    throw new Error("Este gasto ya no existe.");
  }
  const gasto: Gasto = { id: snap.id, ...(snap.data() as Omit<Gasto, "id">) };
  await deleteDoc(ref);
  return gasto;
}

export async function restaurarGasto(householdId: string, gasto: Gasto): Promise<void> {
  const { id, ...datos } = gasto;
  await setDoc(doc(db, "households", householdId, "gastos", id), datos);
}
