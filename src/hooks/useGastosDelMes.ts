"use client";

import { useEffect, useState } from "react";
import { escucharGastosDelMes } from "@/lib/services/gastos.service";
import type { Gasto } from "@/types/gasto";

export function useGastosDelMes(
  householdId: string | undefined,
  inicio: Date,
  fin: Date
): { gastos: Gasto[]; cargando: boolean } {
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [claveSincronizada, setClaveSincronizada] = useState<string | null>(null);
  const inicioMs = inicio.getTime();
  const finMs = fin.getTime();
  const clave = householdId ? `${householdId}:${inicioMs}:${finMs}` : null;

  useEffect(() => {
    if (!householdId) return;
    const unsub = escucharGastosDelMes(householdId, new Date(inicioMs), new Date(finMs), (nuevosGastos) => {
      setGastos(nuevosGastos);
      setClaveSincronizada(`${householdId}:${inicioMs}:${finMs}`);
    });
    return () => unsub();
  }, [householdId, inicioMs, finMs]);

  return {
    gastos: claveSincronizada === clave ? gastos : [],
    cargando: Boolean(householdId) && claveSincronizada !== clave,
  };
}
