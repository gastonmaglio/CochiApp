"use client";

import { useEffect, useState } from "react";
import { escucharItems } from "@/lib/services/items.service";
import type { Item } from "@/types/item";

export function useItems(
  householdId: string | undefined,
  listaId: string
): { items: Item[]; cargando: boolean } {
  const [items, setItems] = useState<Item[]>([]);
  const [listaIdSincronizado, setListaIdSincronizado] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;
    const unsub = escucharItems(householdId, listaId, (nuevosItems) => {
      setItems(nuevosItems);
      setListaIdSincronizado(listaId);
    });
    return () => unsub();
  }, [householdId, listaId]);

  return {
    items: listaIdSincronizado === listaId ? items : [],
    cargando: Boolean(householdId) && listaIdSincronizado !== listaId,
  };
}
