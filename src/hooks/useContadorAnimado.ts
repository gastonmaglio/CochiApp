"use client";

import { useEffect, useRef, useState } from "react";

// Fácil de pasar por alto en una app de plata: un total que aparece de golpe se siente
// plano; uno que "cuenta" hasta el valor final se siente vivo. Sube o baja según haga
// falta (por ejemplo al cambiar de mes), arrancando siempre desde el valor anterior.
function easeOutQuint(t: number): number {
  return 1 - Math.pow(1 - t, 5);
}

export function useContadorAnimado(valorFinal: number, duracionMs = 700): number {
  const [valorMostrado, setValorMostrado] = useState(valorFinal);
  const valorAnteriorRef = useRef(valorFinal);
  const primeraVezRef = useRef(true);

  useEffect(() => {
    const prefiereMenosMovimiento =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (primeraVezRef.current) {
      primeraVezRef.current = false;
      valorAnteriorRef.current = valorFinal;
      setValorMostrado(valorFinal);
      return;
    }

    if (prefiereMenosMovimiento || valorAnteriorRef.current === valorFinal) {
      valorAnteriorRef.current = valorFinal;
      setValorMostrado(valorFinal);
      return;
    }

    const desde = valorAnteriorRef.current;
    const hasta = valorFinal;
    const inicio = performance.now();
    let frameId: number;

    function tick(ahora: number) {
      const progreso = Math.min((ahora - inicio) / duracionMs, 1);
      const valorIntermedio = desde + (hasta - desde) * easeOutQuint(progreso);
      setValorMostrado(Math.round(valorIntermedio));
      if (progreso < 1) {
        frameId = requestAnimationFrame(tick);
      } else {
        valorAnteriorRef.current = hasta;
      }
    }
    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [valorFinal, duracionMs]);

  return valorMostrado;
}
