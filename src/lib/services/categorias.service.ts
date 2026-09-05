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
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Categoria } from "@/types/household";

export type TipoCategoria = "categoriasCompras" | "categoriasGastos";

export function escucharCategorias(
  householdId: string,
  tipo: TipoCategoria,
  callback: (categorias: Categoria[]) => void
): () => void {
  const q = query(collection(db, "households", householdId, tipo), orderBy("orden", "asc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Categoria, "id">) })));
  });
}

export async function crearCategoria(
  householdId: string,
  tipo: TipoCategoria,
  uid: string,
  nombre: string,
  icono: string,
  color: string,
  orden: number,
  presupuesto: number | null = null,
  categoriaPadreId: string | null = null
): Promise<string> {
  const ref = await addDoc(collection(db, "households", householdId, tipo), {
    nombre,
    icono,
    color,
    predefinida: false,
    orden,
    vecesUsada: 0,
    categoriaPadreId,
    presupuesto,
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function editarCategoria(
  householdId: string,
  tipo: TipoCategoria,
  categoriaId: string,
  cambios: {
    nombre?: string;
    icono?: string;
    color?: string;
    presupuesto?: number | null;
    categoriaPadreId?: string | null;
  }
): Promise<void> {
  await updateDoc(doc(db, "households", householdId, tipo, categoriaId), {
    ...cambios,
    actualizadoEn: serverTimestamp(),
  });
}

/**
 * Solo para categorías creadas por el usuario (predefinida: false) — las de fábrica
 * no se pueden borrar porque hay lógica (ej. "Otros" como categoría de respaldo) que
 * asume que siempre existen.
 */
export async function eliminarCategoria(
  householdId: string,
  tipo: TipoCategoria,
  categoriaId: string
): Promise<void> {
  await deleteDoc(doc(db, "households", householdId, tipo, categoriaId));
}

/**
 * Cada vez que se usa una categoría (se agrega un item o se carga un gasto en ella) suma
 * uno — es lo que hace que el selector muestre primero las que de verdad usás, no las
 * que vienen predefinidas primero por orden alfabético/de fábrica.
 */
export async function incrementarUsoCategoria(
  householdId: string,
  tipo: TipoCategoria,
  categoriaId: string
): Promise<void> {
  await updateDoc(doc(db, "households", householdId, tipo, categoriaId), {
    vecesUsada: increment(1),
  });
}
