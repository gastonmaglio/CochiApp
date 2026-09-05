import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { GastoRecurrente } from "@/types/gastoRecurrente";
import { claveMes } from "@/lib/utils/fechas";

export interface DatosGastoRecurrente {
  descripcion: string;
  monto: number;
  categoriaId: string;
  responsableUid: string | null;
  diaDelMes: number;
}

export function escucharGastosRecurrentes(
  householdId: string,
  callback: (recurrentes: GastoRecurrente[]) => void
): () => void {
  const q = query(
    collection(db, "households", householdId, "gastosRecurrentes"),
    orderBy("descripcion", "asc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<GastoRecurrente, "id">) })));
  });
}

export async function crearGastoRecurrente(
  householdId: string,
  uid: string,
  datos: DatosGastoRecurrente
): Promise<string> {
  const ref = await addDoc(collection(db, "households", householdId, "gastosRecurrentes"), {
    ...datos,
    activo: true,
    ultimaGeneracion: null,
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function editarGastoRecurrente(
  householdId: string,
  recurrenteId: string,
  datos: DatosGastoRecurrente
): Promise<void> {
  await updateDoc(doc(db, "households", householdId, "gastosRecurrentes", recurrenteId), {
    ...datos,
    actualizadoEn: serverTimestamp(),
  });
}

export async function eliminarGastoRecurrente(
  householdId: string,
  recurrenteId: string
): Promise<void> {
  // Ojo: esto NO borra los gastos YA generados por esta plantilla en meses anteriores —
  // esos quedan como gastos normales e independientes en el historial, solo se deja de
  // generar uno nuevo cada mes.
  await deleteDoc(doc(db, "households", householdId, "gastosRecurrentes", recurrenteId));
}

export async function alternarActivoGastoRecurrente(
  householdId: string,
  recurrenteId: string,
  activo: boolean
): Promise<void> {
  await updateDoc(doc(db, "households", householdId, "gastosRecurrentes", recurrenteId), {
    activo,
    actualizadoEn: serverTimestamp(),
  });
}

/**
 * Genera (de forma idempotente) el gasto del mes actual para cada plantilla recurrente
 * activa que todavía no lo generó. 100% client-side: no hay Cloud Functions en este stack.
 * Si nadie abre la app en todo un mes, se generan retroactivamente en cuanto alguien entre.
 */
export async function generarGastosRecurrentesPendientes(
  householdId: string,
  uid: string
): Promise<number> {
  const mesActual = claveMes(new Date());
  const snap = await getDocs(collection(db, "households", householdId, "gastosRecurrentes"));

  const pendientes = snap.docs.filter((d) => {
    const datos = d.data() as Omit<GastoRecurrente, "id">;
    return datos.activo && datos.ultimaGeneracion !== mesActual;
  });

  if (pendientes.length === 0) return 0;

  const batch = writeBatch(db);
  const hoy = new Date();

  for (const docRecurrente of pendientes) {
    const datos = docRecurrente.data() as Omit<GastoRecurrente, "id">;
    // Clamp a 28 para no generar fechas inválidas en meses cortos (ej. Febrero).
    const fechaGasto = new Date(hoy.getFullYear(), hoy.getMonth(), Math.min(datos.diaDelMes, 28));
    const gastoRef = doc(collection(db, "households", householdId, "gastos"));

    batch.set(gastoRef, {
      descripcion: datos.descripcion,
      monto: datos.monto,
      categoriaId: datos.categoriaId,
      fecha: Timestamp.fromDate(fechaGasto),
      responsableUid: datos.responsableUid,
      esRecurrente: true,
      recurrenteId: docRecurrente.id,
      origenCompraCerradaId: null,
      creadoPor: uid,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
    batch.update(docRecurrente.ref, {
      ultimaGeneracion: mesActual,
      actualizadoEn: serverTimestamp(),
    });
  }

  await batch.commit();
  return pendientes.length;
}
