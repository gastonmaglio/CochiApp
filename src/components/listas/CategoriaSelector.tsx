"use client";

import { useMemo } from "react";
import { CornerDownRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ordenarCategorias } from "@/lib/utils/ordenarCategorias";
import type { Categoria } from "@/types/household";

interface CategoriaSelectorProps {
  categorias: Categoria[];
  valor: string | null;
  onCambiar: (categoriaId: string) => void;
}

export function CategoriaSelector({ categorias, valor, onCambiar }: CategoriaSelectorProps) {
  const ordenadas = useMemo(() => ordenarCategorias(categorias), [categorias]);

  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Categoría">
      {ordenadas.map((categoria) => {
        const seleccionada = categoria.id === valor;
        const esSubcategoria = Boolean(categoria.categoriaPadreId);
        return (
          <button
            key={categoria.id}
            type="button"
            role="radio"
            aria-checked={seleccionada}
            onClick={() => onCambiar(categoria.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border font-medium transition-all active:scale-95",
              esSubcategoria ? "min-h-8 px-2.5 text-xs" : "min-h-9 px-3 text-sm",
              seleccionada
                ? "scale-105 border-primary bg-primary-soft text-primary"
                : "border-border bg-bg-elevated text-fg-muted"
            )}
          >
            {esSubcategoria && <CornerDownRight size={12} aria-hidden="true" className="opacity-60" />}
            <span aria-hidden="true">{categoria.icono}</span>
            {categoria.nombre}
          </button>
        );
      })}
    </div>
  );
}
