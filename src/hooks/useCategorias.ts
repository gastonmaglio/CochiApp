"use client";

import { useEffect, useState } from "react";
import { escucharCategorias, type TipoCategoria } from "@/lib/services/categorias.service";
import type { Categoria } from "@/types/household";

export function useCategorias(
  householdId: string | undefined,
  tipo: TipoCategoria
): { categorias: Categoria[]; cargando: boolean } {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [claveSincronizada, setClaveSincronizada] = useState<string | null>(null);
  const claveActual = householdId ? `${householdId}:${tipo}` : null;

  useEffect(() => {
    if (!householdId) return;
    const unsub = escucharCategorias(householdId, tipo, (nuevas) => {
      setCategorias(nuevas);
      setClaveSincronizada(`${householdId}:${tipo}`);
    });
    return () => unsub();
  }, [householdId, tipo]);

  return {
    categorias: claveSincronizada === claveActual ? categorias : [],
    cargando: Boolean(householdId) && claveSincronizada !== claveActual,
  };
}
