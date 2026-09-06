"use client";

import { useEffect, useState } from "react";
import {
  escucharFondosCompartidos,
  escucharFondosPersonales,
  escucharMisAportes,
} from "@/lib/services/fondosAhorro.service";
import type { AporteFondo, FondoAhorro } from "@/types/fondoAhorro";

export function useFondosCompartidos(householdId: string | undefined) {
  const [fondos, setFondos] = useState<FondoAhorro[]>([]);
  const [claveSincronizada, setClaveSincronizada] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;
    return escucharFondosCompartidos(householdId, (datos) => {
      setFondos(datos);
      setClaveSincronizada(householdId);
    });
  }, [householdId]);

  const sincronizado = claveSincronizada === (householdId ?? null);
  return { fondos: sincronizado ? fondos : [], cargando: Boolean(householdId) && !sincronizado };
}

export function useFondosPersonales(householdId: string | undefined, uid: string | undefined) {
  const [fondos, setFondos] = useState<FondoAhorro[]>([]);
  const [claveSincronizada, setClaveSincronizada] = useState<string | null>(null);
  const clave = householdId && uid ? `${householdId}:${uid}` : null;

  useEffect(() => {
    if (!householdId || !uid) return;
    return escucharFondosPersonales(householdId, uid, (datos) => {
      setFondos(datos);
      setClaveSincronizada(`${householdId}:${uid}`);
    });
  }, [householdId, uid]);

  const sincronizado = claveSincronizada === clave;
  return { fondos: sincronizado ? fondos : [], cargando: Boolean(clave) && !sincronizado };
}

export function useMisAportes(
  householdId: string | undefined,
  uid: string | undefined,
  fondoId: string | undefined
) {
  const [aportes, setAportes] = useState<AporteFondo[]>([]);
  const [claveSincronizada, setClaveSincronizada] = useState<string | null>(null);
  const clave = householdId && uid && fondoId ? `${householdId}:${uid}:${fondoId}` : null;

  useEffect(() => {
    if (!householdId || !uid || !fondoId) return;
    return escucharMisAportes(householdId, uid, fondoId, (datos) => {
      setAportes(datos);
      setClaveSincronizada(`${householdId}:${uid}:${fondoId}`);
    });
  }, [householdId, uid, fondoId]);

  const sincronizado = claveSincronizada === clave;
  const aportesListos = sincronizado ? aportes : [];
  const miTotal = aportesListos.reduce((acc, a) => acc + a.monto, 0);

  return { aportes: aportesListos, miTotal, cargando: Boolean(clave) && !sincronizado };
}
