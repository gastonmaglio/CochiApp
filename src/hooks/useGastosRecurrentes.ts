"use client";

import { useEffect, useState } from "react";
import { escucharGastosRecurrentes } from "@/lib/services/gastosRecurrentes.service";
import type { GastoRecurrente } from "@/types/gastoRecurrente";

export function useGastosRecurrentes(householdId: string | undefined): {
  recurrentes: GastoRecurrente[];
} {
  const [recurrentes, setRecurrentes] = useState<GastoRecurrente[]>([]);
  const [householdIdSincronizado, setHouseholdIdSincronizado] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;
    const unsub = escucharGastosRecurrentes(householdId, (nuevos) => {
      setRecurrentes(nuevos);
      setHouseholdIdSincronizado(householdId);
    });
    return () => unsub();
  }, [householdId]);

  return { recurrentes: householdIdSincronizado === householdId ? recurrentes : [] };
}
