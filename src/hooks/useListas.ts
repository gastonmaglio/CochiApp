"use client";

import { useEffect, useState } from "react";
import { escucharListas } from "@/lib/services/listas.service";
import type { Lista } from "@/types/lista";

export function useListas(householdId: string | undefined): { listas: Lista[]; cargando: boolean } {
  const [listas, setListas] = useState<Lista[]>([]);
  const [householdIdSincronizado, setHouseholdIdSincronizado] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;
    const unsub = escucharListas(householdId, (nuevasListas) => {
      setListas(nuevasListas);
      setHouseholdIdSincronizado(householdId);
    });
    return () => unsub();
  }, [householdId]);

  return {
    listas: householdIdSincronizado === householdId ? listas : [],
    cargando: Boolean(householdId) && householdIdSincronizado !== householdId,
  };
}
