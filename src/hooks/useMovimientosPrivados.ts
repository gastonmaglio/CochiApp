"use client";

import { useEffect, useState } from "react";
import { escucharMovimientosPrivados } from "@/lib/services/finanzasPrivadas.service";
import type { MovimientoPrivado } from "@/types/movimientoPrivado";

export function useMovimientosPrivados(
  householdId: string | undefined,
  uid: string | undefined
): { movimientos: MovimientoPrivado[]; cargando: boolean } {
  const [movimientos, setMovimientos] = useState<MovimientoPrivado[]>([]);
  const [claveSincronizada, setClaveSincronizada] = useState<string | null>(null);
  const clave = householdId && uid ? `${householdId}:${uid}` : null;

  useEffect(() => {
    if (!householdId || !uid) return;
    const unsub = escucharMovimientosPrivados(householdId, uid, (nuevos) => {
      setMovimientos(nuevos);
      setClaveSincronizada(`${householdId}:${uid}`);
    });
    return () => unsub();
  }, [householdId, uid]);

  return {
    movimientos: claveSincronizada === clave ? movimientos : [],
    cargando: Boolean(clave) && claveSincronizada !== clave,
  };
}
