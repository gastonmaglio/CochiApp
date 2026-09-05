import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Item } from "@/types/item";
import type { Categoria } from "@/types/household";
import type { CompraCerrada, ItemSnapshot } from "@/types/compraCerrada";

export function escucharComprasCerradas(
  householdId: string,
  callback: (compras: CompraCerrada[]) => void,
  cantidad = 30
): () => void {
  const q = query(
    collection(db, "households", householdId, "comprasCerradas"),
    orderBy("fecha", "desc"),
    limit(cantidad)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CompraCerrada, "id">) })));
  });
}

export type ModoCierre = "vaciar" | "mantener_pendientes";

export async function cerrarLista(
  householdId: string,
  listaId: string,
  listaNombre: string,
  uid: string,
  modo: ModoCierre,
  categoriaGastoId: string | null
): Promise<{ compraCerradaId: string; total: number }> {
  const [itemsSnap, categoriasSnap] = await Promise.all([
    getDocs(collection(db, "households", householdId, "listas", listaId, "items")),
    getDocs(collection(db, "households", householdId, "categoriasCompras")),
  ]);

  const items = itemsSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Item, "id">) }));
  const categoriasPorId = new Map(
    categoriasSnap.docs.map((d) => [d.id, (d.data() as Omit<Categoria, "id">).nombre])
  );

  const comprados = items.filter((item) => item.comprado);
  const total = comprados.reduce((acumulado, item) => acumulado + (item.montoGastado ?? 0), 0);

  const itemsSnapshot: ItemSnapshot[] = items.map((item) => ({
    nombre: item.nombre,
    cantidad: item.cantidad,
    categoriaId: item.categoriaId,
    categoriaNombre: categoriasPorId.get(item.categoriaId) ?? "Otros",
    montoGastado: item.montoGastado,
    comprado: item.comprado,
  }));

  const batch = writeBatch(db);
  const compraCerradaRef = doc(collection(db, "households", householdId, "comprasCerradas"));

  let gastoId: string | null = null;
  if (total > 0 && categoriaGastoId) {
    const gastoRef = doc(collection(db, "households", householdId, "gastos"));
    gastoId = gastoRef.id;
    batch.set(gastoRef, {
      descripcion: `Compra: ${listaNombre}`,
      monto: total,
      categoriaId: categoriaGastoId,
      fecha: serverTimestamp(),
      responsableUid: null,
      esRecurrente: false,
      recurrenteId: null,
      origenCompraCerradaId: compraCerradaRef.id,
      creadoPor: uid,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  }

  batch.set(compraCerradaRef, {
    listaId,
    listaNombre,
    fecha: serverTimestamp(),
    total,
    cantidadItems: comprados.length,
    itemsSnapshot,
    gastoGeneradoId: gastoId,
    creadoPor: uid,
  });

  const itemsAEliminar = modo === "vaciar" ? items : comprados;
  for (const item of itemsAEliminar) {
    batch.delete(doc(db, "households", householdId, "listas", listaId, "items", item.id));
  }

  // Solo actualizamos la categoría recordada en la lista si el usuario efectivamente
  // eligió una (es decir, si se generó un gasto) — si no, no pisamos la que ya tenía.
  batch.update(doc(db, "households", householdId, "listas", listaId), {
    ...(categoriaGastoId ? { categoriaGastoId } : {}),
    actualizadoEn: serverTimestamp(),
  });

  await batch.commit();
  return { compraCerradaId: compraCerradaRef.id, total };
}
