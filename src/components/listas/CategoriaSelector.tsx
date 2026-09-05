"use client";

import { cn } from "@/lib/utils/cn";
import type { Categoria } from "@/types/household";

interface CategoriaSelectorProps {
  categorias: Categoria[];
  valor: string | null;
  onCambiar: (categoriaId: string) => void;
}

export function CategoriaSelector({ categorias, valor, onCambiar }: CategoriaSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Categoría">
      {categorias.map((categoria) => {
        const seleccionada = categoria.id === valor;
        return (
          <button
            key={categoria.id}
            type="button"
            role="radio"
            aria-checked={seleccionada}
            onClick={() => onCambiar(categoria.id)}
            className={cn(
              "flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-medium transition-colors",
              seleccionada
                ? "border-primary bg-primary-soft text-primary"
                : "border-border bg-bg-elevated text-fg-muted"
            )}
          >
            <span aria-hidden="true">{categoria.icono}</span>
            {categoria.nombre}
          </button>
        );
      })}
    </div>
  );
}
