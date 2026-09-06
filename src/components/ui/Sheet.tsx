"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

interface SheetProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
}

export function Sheet({ abierto, onCerrar, titulo, children }: SheetProps) {
  useEffect(() => {
    if (!abierto) return;
    function manejarEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", manejarEscape);
    return () => document.removeEventListener("keydown", manejarEscape);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40 animate-[aparecer_0.15s_ease-out]"
        onClick={onCerrar}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className="relative w-full max-w-md rounded-t-2xl bg-bg-elevated px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-4 shadow-pop animate-[deslizar-arriba_0.32s_cubic-bezier(0.22,1.4,0.36,1)]"
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" aria-hidden="true" />
        <h2 className="mb-4 font-display text-lg font-semibold text-fg">{titulo}</h2>
        {children}
      </div>
    </div>,
    document.body
  );
}
