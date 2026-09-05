"use client";

import { useEffect, useState } from "react";
import { escucharComprasCerradas } from "@/lib/services/comprasCerradas.service";
import type { CompraCerrada } from "@/types/compraCerrada";

export function useComprasCerradas(householdId: string | undefined): {
  compras: CompraCerrada[];
  cargando: boolean;
} {
  const [compras, setCompras] = useState<CompraCerrada[]>([]);
  const [householdIdSincronizado, setHouseholdIdSincronizado] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;
    const unsub = escucharComprasCerradas(householdId, (nuevas) => {
      setCompras(nuevas);
      setHouseholdIdSincronizado(householdId);
    });
    return () => unsub();
  }, [householdId]);

  return {
    compras: householdIdSincronizado === householdId ? compras : [],
    cargando: Boolean(householdId) && householdIdSincronizado !== householdId,
  };
}
