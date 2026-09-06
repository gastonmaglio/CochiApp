"use client";

import Link from "next/link";
import { ChevronRight, Trash2 } from "lucide-react";
import { vibrar } from "@/lib/utils/haptica";
import type { Lista } from "@/types/lista";

interface ListaCardProps {
  lista: Lista;
  onBorrar: (lista: Lista) => void;
}

export function ListaCard({ lista, onBorrar }: ListaCardProps) {
  return (
    <div className="fila-animada flex min-h-16 items-stretch overflow-hidden rounded-xl border border-border bg-bg-elevated shadow-card">
      <Link
        href={`/listas/${lista.id}`}
        className="flex min-w-0 flex-1 items-center justify-between gap-2 px-4 py-3 text-left transition-transform active:scale-[0.99]"
      >
        <span className="truncate text-base font-medium text-fg">{lista.nombre}</span>
        <ChevronRight size={18} className="shrink-0 text-fg-muted" aria-hidden="true" />
      </Link>
      <button
        type="button"
        onClick={() => {
          vibrar(25);
          onBorrar(lista);
        }}
        aria-label={`Borrar lista ${lista.nombre}`}
        className="flex min-h-11 w-14 shrink-0 items-center justify-center border-l border-border text-fg-muted active:bg-danger/10 active:text-danger"
      >
        <Trash2 size={18} aria-hidden="true" />
      </button>
    </div>
  );
}
