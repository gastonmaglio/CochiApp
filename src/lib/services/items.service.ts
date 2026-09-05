import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Item } from "@/types/item";
import { incrementarEstadisticaItem } from "@/lib/services/itemsFrecuentes.service";

export interface DatosItem {
  nombre: string;
  cantidad: string | null;
  categoriaId: string;
  notas: string | null;
}

function coleccionItems(householdId: string, listaId: string) {
  return collection(db, "households", householdId, "listas", listaId, "items");
}

export function escucharItems(
  householdId: string,
  listaId: string,
  callback: (items: Item[]) => void
): () => void {
  const q = query(coleccionItems(householdId, listaId), orderBy("ordenIndex", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Item, "id">) })));
  });
}

export async function agregarItem(
  householdId: string,
  listaId: string,
  uid: string,
  datos: DatosItem,
  ordenIndex: number
): Promise<string> {
  const ref = await addDoc(coleccionItems(householdId, listaId), {
    ...datos,
    comprado: false,
    montoGastado: null,
    compradoPor: null,
    compradoEn: null,
    ordenIndex,
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function editarItem(
  householdId: string,
  listaId: string,
  itemId: string,
  datos: DatosItem
): Promise<void> {
  await updateDoc(doc(coleccionItems(householdId, listaId), itemId), {
    ...datos,
    actualizadoEn: serverTimestamp(),
  });
}

export async function eliminarItem(
  householdId: string,
  listaId: string,
  itemId: string
): Promise<void> {
  await deleteDoc(doc(coleccionItems(householdId, listaId), itemId));
}

export async function restaurarItem(
  householdId: string,
  listaId: string,
  itemId: string,
  item: Omit<Item, "id">
): Promise<void> {
  await setDoc(doc(coleccionItems(householdId, listaId), itemId), item);
}

export async function marcarComprado(
  householdId: string,
  listaId: string,
  itemId: string,
  uid: string,
  categoriaId: string,
  nombre: string,
  montoGastado: number | null
): Promise<void> {
  await updateDoc(doc(coleccionItems(householdId, listaId), itemId), {
    comprado: true,
    compradoPor: uid,
    compradoEn: serverTimestamp(),
    montoGastado,
    actualizadoEn: serverTimestamp(),
  });
  incrementarEstadisticaItem(householdId, nombre, categoriaId).catch((error: unknown) => {
    console.error("No se pudo actualizar items frecuentes", error);
  });
}

export async function desmarcarComprado(
  householdId: string,
  listaId: string,
  itemId: string
): Promise<void> {
  await updateDoc(doc(coleccionItems(householdId, listaId), itemId), {
    comprado: false,
    compradoPor: null,
    compradoEn: null,
    montoGastado: null,
    actualizadoEn: serverTimestamp(),
  });
}
