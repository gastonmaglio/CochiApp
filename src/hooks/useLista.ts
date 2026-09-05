"use client";

import { useEffect, useState } from "react";
import { escucharLista } from "@/lib/services/listas.service";
import type { Lista } from "@/types/lista";

export function useLista(
  householdId: string | undefined,
  listaId: string
): { lista: Lista | null; cargando: boolean } {
  const [lista, setLista] = useState<Lista | null>(null);
  const [listaIdSincronizado, setListaIdSincronizado] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;
    const unsub = escucharLista(householdId, listaId, (nuevaLista) => {
      setLista(nuevaLista);
      setListaIdSincronizado(listaId);
    });
    return () => unsub();
  }, [householdId, listaId]);

  return {
    lista: listaIdSincronizado === listaId ? lista : null,
    cargando: Boolean(householdId) && listaIdSincronizado !== listaId,
  };
}
