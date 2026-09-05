import { collection, limit as limitarA, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { CompraCerrada } from "@/types/compraCerrada";

export function escucharComprasCerradas(
  householdId: string,
  cantidad: number,
  callback: (compras: CompraCerrada[]) => void
): () => void {
  const q = query(
    collection(db, "households", householdId, "comprasCerradas"),
    orderBy("fecha", "desc"),
    limitarA(cantidad)
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<CompraCerrada, "id">) })));
  });
}
