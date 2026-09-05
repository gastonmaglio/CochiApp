import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Item } from "@/types/item";
import type { Lista } from "@/types/lista";

export function escucharListas(householdId: string, callback: (listas: Lista[]) => void): () => void {
  const q = query(
    collection(db, "households", householdId, "listas"),
    orderBy("actualizadoEn", "desc")
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Lista, "id">) })));
  });
}

export function escucharLista(
  householdId: string,
  listaId: string,
  callback: (lista: Lista | null) => void
): () => void {
  return onSnapshot(doc(db, "households", householdId, "listas", listaId), (snap) => {
    callback(snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Lista, "id">) }) : null);
  });
}

export async function crearLista(householdId: string, uid: string, nombre: string): Promise<string> {
  const ref = await addDoc(collection(db, "households", householdId, "listas"), {
    nombre,
    categoriaGastoId: null,
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function renombrarLista(
  householdId: string,
  listaId: string,
  nombre: string
): Promise<void> {
  await updateDoc(doc(db, "households", householdId, "listas", listaId), {
    nombre,
    actualizadoEn: serverTimestamp(),
  });
}

/**
 * Borra la lista Y sus items (si no, quedarían huérfanos). Devuelve una copia de todo lo
 * borrado para poder deshacer.
 */
export async function eliminarListaConItems(
  householdId: string,
  listaId: string
): Promise<{ lista: Lista; items: Item[] }> {
  const listaRef = doc(db, "households", householdId, "listas", listaId);
  const itemsCollectionRef = collection(listaRef, "items");

  const [listaSnap, itemsSnap] = await Promise.all([getDoc(listaRef), getDocs(itemsCollectionRef)]);
  if (!listaSnap.exists()) {
    throw new Error("Esta lista ya no existe.");
  }

  const lista: Lista = { id: listaSnap.id, ...(listaSnap.data() as Omit<Lista, "id">) };
  const items: Item[] = itemsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Item, "id">) }));

  const batch = writeBatch(db);
  itemsSnap.docs.forEach((d) => batch.delete(d.ref));
  batch.delete(listaRef);
  await batch.commit();

  return { lista, items };
}

export async function restaurarListaConItems(
  householdId: string,
  lista: Lista,
  items: Item[]
): Promise<void> {
  const { id: listaId, ...datosLista } = lista;
  const listaRef = doc(db, "households", householdId, "listas", listaId);

  const batch = writeBatch(db);
  batch.set(listaRef, datosLista);
  items.forEach((item) => {
    const { id: itemId, ...datosItem } = item;
    batch.set(doc(listaRef, "items", itemId), datosItem);
  });
  await batch.commit();
}
