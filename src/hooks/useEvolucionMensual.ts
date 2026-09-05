"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, Timestamp, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { inicioDeMes, inicioDeMesSiguiente } from "@/lib/utils/fechas";
import type { Gasto } from "@/types/gasto";

export interface PuntoEvolucion {
  clave: string;
  etiqueta: string;
  total: number;
}

export function useEvolucionMensual(
  householdId: string | undefined,
  mesReferencia: Date,
  cantidadMeses = 6
): { puntos: PuntoEvolucion[]; cargando: boolean } {
  const [puntos, setPuntos] = useState<PuntoEvolucion[]>([]);
  const [claveSincronizada, setClaveSincronizada] = useState<string | null>(null);
  const refAnio = mesReferencia.getFullYear();
  const refMes = mesReferencia.getMonth();
  const clave = householdId ? `${householdId}:${refAnio}-${refMes}:${cantidadMeses}` : null;

  useEffect(() => {
    if (!householdId) return;
    let cancelado = false;

    const fechasMeses = Array.from({ length: cantidadMeses }, (_, idx) => {
      const i = cantidadMeses - 1 - idx;
      return new Date(refAnio, refMes - i, 1);
    });

    Promise.all(
      fechasMeses.map(async (fechaMes) => {
        const inicio = inicioDeMes(fechaMes);
        const fin = inicioDeMesSiguiente(fechaMes);
        const snap = await getDocs(
          query(
            collection(db, "households", householdId, "gastos"),
            where("fecha", ">=", Timestamp.fromDate(inicio)),
            where("fecha", "<", Timestamp.fromDate(fin))
          )
        );
        const total = snap.docs.reduce(
          (acumulado, docSnap) => acumulado + (docSnap.data() as Gasto).monto,
          0
        );
        return {
          clave: `${fechaMes.getFullYear()}-${fechaMes.getMonth() + 1}`,
          etiqueta: new Intl.DateTimeFormat("es-AR", { month: "short" }).format(fechaMes),
          total,
        };
      })
    ).then((resultados) => {
      if (!cancelado) {
        setPuntos(resultados);
        setClaveSincronizada(`${householdId}:${refAnio}-${refMes}:${cantidadMeses}`);
      }
    });

    return () => {
      cancelado = true;
    };
  }, [householdId, refAnio, refMes, cantidadMeses]);

  return {
    puntos: claveSincronizada === clave ? puntos : [],
    cargando: Boolean(householdId) && claveSincronizada !== clave,
  };
}
