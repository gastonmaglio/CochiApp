import {
  collection,
  doc,
  increment,
  limit as limitarA,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { EstadisticaItem } from "@/types/estadisticaItem";

// Marcas diacríticas combinantes (rango Unicode U+0300–U+036F) que quedan sueltas
// después de normalizar con NFD — así "Café" y "cafe" terminan siendo el mismo item.
const REGEX_DIACRITICOS = /[̀-ͯ]/g;

function normalizarNombre(nombre: string): string {
  return nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(REGEX_DIACRITICOS, "")
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 80);
}

export async function incrementarEstadisticaItem(
  householdId: string,
  nombre: string,
  categoriaId: string
): Promise<void> {
  const idNormalizado = normalizarNombre(nombre);
  if (!idNormalizado) return;

  await setDoc(
    doc(db, "households", householdId, "estadisticasItems", idNormalizado),
    {
      nombre: nombre.trim(),
      vecesComprado: increment(1),
      ultimaCategoriaId: categoriaId,
      ultimaVez: serverTimestamp(),
    },
    { merge: true }
  );
}

export function escucharItemsFrecuentes(
  householdId: string,
  cantidad: number,
  callback: (items: EstadisticaItem[]) => void
): () => void {
  const q = query(
    collection(db, "households", householdId, "estadisticasItems"),
    orderBy("vecesComprado", "desc"),
    limitarA(cantidad)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EstadisticaItem, "id">) })));
  });
}
