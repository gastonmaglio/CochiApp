"use client";

import type { EstadisticaItem } from "@/types/estadisticaItem";

interface ItemsFrecuentesRowProps {
  items: EstadisticaItem[];
  nombresEnLista: Set<string>;
  onAgregar: (item: EstadisticaItem) => void;
}

export function ItemsFrecuentesRow({ items, nombresEnLista, onAgregar }: ItemsFrecuentesRowProps) {
  const sugeridos = items.filter((item) => !nombresEnLista.has(item.nombre.toLowerCase()));

  if (sugeridos.length === 0) return null;

  return (
    <div className="px-3 pt-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">Frecuentes</p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sugeridos.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onAgregar(item)}
            className="flex min-h-9 shrink-0 items-center gap-1 rounded-full border border-dashed border-border bg-bg-elevated px-3 text-sm text-fg"
          >
            + {item.nombre}
          </button>
        ))}
      </div>
    </div>
  );
}
