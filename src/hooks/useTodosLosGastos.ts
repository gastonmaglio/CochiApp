"use client";

import { useEffect, useState } from "react";
import { escucharTodosLosGastos } from "@/lib/services/gastos.service";
import type { Gasto } from "@/types/gasto";

export function useTodosLosGastos(householdId: string | undefined): {
  gastos: Gasto[];
  cargando: boolean;
} {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [householdIdSincronizado, setHouseholdIdSincronizado] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;
    const unsub = escucharTodosLosGastos(householdId, (nuevos) => {
      setGastos(nuevos);
      setHouseholdIdSincronizado(householdId);
    });
    return () => unsub();
  }, [householdId]);

  return {
    gastos: householdIdSincronizado === householdId ? gastos : [],
    cargando: Boolean(householdId) && householdIdSincronizado !== householdId,
  };
}
