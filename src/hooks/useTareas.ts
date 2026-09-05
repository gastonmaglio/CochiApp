"use client";

import { useEffect, useState } from "react";
import { escucharTareas } from "@/lib/services/tareas.service";
import type { Tarea } from "@/types/tarea";

export function useTareas(householdId: string | undefined): {
  tareas: Tarea[];
  cargando: boolean;
} {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [householdIdSincronizado, setHouseholdIdSincronizado] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;
    const unsub = escucharTareas(householdId, (nuevasTareas) => {
      setTareas(nuevasTareas);
      setHouseholdIdSincronizado(householdId);
    });
    return () => unsub();
  }, [householdId]);

  return {
    tareas: householdIdSincronizado === householdId ? tareas : [],
    cargando: Boolean(householdId) && householdIdSincronizado !== householdId,
  };
}
