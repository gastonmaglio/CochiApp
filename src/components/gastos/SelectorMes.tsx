"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatearMes } from "@/lib/utils/fechas";

interface SelectorMesProps {
  mes: Date;
  onCambiar: (nuevoMes: Date) => void;
}

export function SelectorMes({ mes, onCambiar }: SelectorMesProps) {
  function irMesAnterior() {
    onCambiar(new Date(mes.getFullYear(), mes.getMonth() - 1, 1));
  }

  function irMesSiguiente() {
    onCambiar(new Date(mes.getFullYear(), mes.getMonth() + 1, 1));
  }

  return (
    <div className="flex items-center justify-between">
      <button
        type="button"
        onClick={irMesAnterior}
        aria-label="Mes anterior"
        className="flex min-h-11 min-w-11 items-center justify-center text-fg-muted"
      >
        <ChevronLeft size={20} aria-hidden="true" />
      </button>
      <span className="text-base font-semibold capitalize text-fg">{formatearMes(mes)}</span>
      <button
        type="button"
        onClick={irMesSiguiente}
        aria-label="Mes siguiente"
        className="flex min-h-11 min-w-11 items-center justify-center text-fg-muted"
      >
        <ChevronRight size={20} aria-hidden="true" />
      </button>
    </div>
  );
}
