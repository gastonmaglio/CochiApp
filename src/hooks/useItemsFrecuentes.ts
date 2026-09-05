"use client";

import { useEffect, useState } from "react";
import { escucharItemsFrecuentes } from "@/lib/services/itemsFrecuentes.service";
import type { EstadisticaItem } from "@/types/estadisticaItem";

export function useItemsFrecuentes(householdId: string | undefined, cantidad = 10): EstadisticaItem[] {
  const [items, setItems] = useState<EstadisticaItem[]>([]);
  const [householdIdSincronizado, setHouseholdIdSincronizado] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;
    const unsub = escucharItemsFrecuentes(householdId, cantidad, (nuevosItems) => {
      setItems(nuevosItems);
      setHouseholdIdSincronizado(householdId);
    });
    return () => unsub();
  }, [householdId, cantidad]);

  return householdIdSincronizado === householdId ? items : [];
}
