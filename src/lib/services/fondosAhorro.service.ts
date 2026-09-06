import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { AporteFondo, FondoAhorro, TipoFondoAhorro } from "@/types/fondoAhorro";

function coleccionFondosCompartidos(householdId: string) {
  return collection(db, "households", householdId, "fondosAhorro");
}

function coleccionFondosPersonales(householdId: string, uid: string) {
  return collection(db, "households", householdId, "finanzasPrivadas", uid, "fondosAhorro");
}

function coleccionAportes(householdId: string, uid: string) {
  return collection(db, "households", householdId, "aportesFondo", uid, "movimientos");
}

function refFondo(householdId: string, tipo: TipoFondoAhorro, uid: string, fondoId: string) {
  return tipo === "compartido"
    ? doc(coleccionFondosCompartidos(householdId), fondoId)
    : doc(coleccionFondosPersonales(householdId, uid), fondoId);
}

export function escucharFondosCompartidos(
  householdId: string,
  callback: (fondos: FondoAhorro[]) => void
): () => void {
  const q = query(coleccionFondosCompartidos(householdId), orderBy("creadoEn", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FondoAhorro, "id">) })));
  });
}

export function escucharFondosPersonales(
  householdId: string,
  uid: string,
  callback: (fondos: FondoAhorro[]) => void
): () => void {
  const q = query(coleccionFondosPersonales(householdId, uid), orderBy("creadoEn", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<FondoAhorro, "id">) })));
  });
}

export function escucharMisAportes(
  householdId: string,
  uid: string,
  fondoId: string,
  callback: (aportes: AporteFondo[]) => void
): () => void {
  const q = query(
    coleccionAportes(householdId, uid),
    where("fondoId", "==", fondoId),
    orderBy("fecha", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AporteFondo, "id">) })));
  });
}

export async function crearFondo(
  householdId: string,
  uid: string,
  datos: { nombre: string; tipo: TipoFondoAhorro; montoObjetivo: number | null }
): Promise<string> {
  const coleccion =
    datos.tipo === "compartido"
      ? coleccionFondosCompartidos(householdId)
      : coleccionFondosPersonales(householdId, uid);
  const ref = await addDoc(coleccion, {
    nombre: datos.nombre,
    tipo: datos.tipo,
    montoObjetivo: datos.montoObjetivo,
    total: 0,
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function editarFondo(
  householdId: string,
  uid: string,
  fondo: Pick<FondoAhorro, "id" | "tipo">,
  datos: { nombre: string; montoObjetivo: number | null }
): Promise<void> {
  await updateDoc(refFondo(householdId, fondo.tipo, uid, fondo.id), {
    nombre: datos.nombre,
    montoObjetivo: datos.montoObjetivo,
    actualizadoEn: serverTimestamp(),
  });
}

export async function eliminarFondo(
  householdId: string,
  uid: string,
  fondo: Pick<FondoAhorro, "id" | "tipo">
): Promise<void> {
  await deleteDoc(refFondo(householdId, fondo.tipo, uid, fondo.id));
}

export async function crearAporte(
  householdId: string,
  uid: string,
  fondo: Pick<FondoAhorro, "id" | "tipo">,
  datos: { monto: number; descripcion: string | null; fecha: Date }
): Promise<void> {
  await addDoc(coleccionAportes(householdId, uid), {
    fondoId: fondo.id,
    fondoTipo: fondo.tipo,
    monto: datos.monto,
    descripcion: datos.descripcion,
    fecha: Timestamp.fromDate(datos.fecha),
    creadoEn: serverTimestamp(),
  });
  await updateDoc(refFondo(householdId, fondo.tipo, uid, fondo.id), {
    total: increment(datos.monto),
    actualizadoEn: serverTimestamp(),
  });
}

export async function eliminarAporte(
  householdId: string,
  uid: string,
  fondo: Pick<FondoAhorro, "id" | "tipo">,
  aporte: Pick<AporteFondo, "id" | "monto">
): Promise<void> {
  await deleteDoc(doc(coleccionAportes(householdId, uid), aporte.id));
  await updateDoc(refFondo(householdId, fondo.tipo, uid, fondo.id), {
    total: increment(-aporte.monto),
    actualizadoEn: serverTimestamp(),
  });
}
