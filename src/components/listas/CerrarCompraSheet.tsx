"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { CategoriaSelector } from "@/components/listas/CategoriaSelector";
import { formatearMonto } from "@/lib/utils/moneda";
import { cn } from "@/lib/utils/cn";
import type { Categoria } from "@/types/household";
import type { ModoCierre } from "@/lib/services/comprasCerradas.service";

interface CerrarCompraSheetProps {
  abierto: boolean;
  totalActual: number;
  categoriasGasto: Categoria[];
  categoriaGastoInicial: string | null;
  cargando: boolean;
  onCerrar: () => void;
  onConfirmar: (modo: ModoCierre, categoriaGastoId: string | null) => void;
}

export function CerrarCompraSheet({
  abierto,
  totalActual,
  categoriasGasto,
  categoriaGastoInicial,
  cargando,
  onCerrar,
  onConfirmar,
}: CerrarCompraSheetProps) {
  return (
    <Sheet abierto={abierto} onCerrar={onCerrar} titulo="Cerrar compra">
      {abierto && (
        <CerrarCompraForm
          totalActual={totalActual}
          categoriasGasto={categoriasGasto}
          categoriaGastoInicial={categoriaGastoInicial}
          cargando={cargando}
          onConfirmar={onConfirmar}
        />
      )}
    </Sheet>
  );
}

function CerrarCompraForm({
  totalActual,
  categoriasGasto,
  categoriaGastoInicial,
  cargando,
  onConfirmar,
}: {
  totalActual: number;
  categoriasGasto: Categoria[];
  categoriaGastoInicial: string | null;
  cargando: boolean;
  onConfirmar: (modo: ModoCierre, categoriaGastoId: string | null) => void;
}) {
  const [modo, setModo] = useState<ModoCierre>("vaciar");
  const [categoriaGastoId, setCategoriaGastoId] = useState<string | null>(categoriaGastoInicial);

  // Solo hace falta elegir categoría cuando efectivamente se va a generar un gasto —
  // si no se gastó nada (total $0), cerrar/vaciar la lista no debería trabarse pidiendo
  // algo que ni siquiera se va a usar.
  const requiereCategoria = totalActual > 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-fg-muted">
        Total de esta compra:{" "}
        <span className="font-semibold text-fg">{formatearMonto(totalActual)}</span>
      </p>

      {requiereCategoria && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-muted">
            ¿A qué categoría de gasto pertenece?
          </p>
          <CategoriaSelector
            categorias={categoriasGasto}
            valor={categoriaGastoId}
            onCambiar={setCategoriaGastoId}
          />
        </div>
      )}

      <div className="flex flex-col gap-2" role="radiogroup" aria-label="Qué hacer con la lista">
        <button
          type="button"
          role="radio"
          aria-checked={modo === "vaciar"}
          onClick={() => setModo("vaciar")}
          className={cn(
            "rounded-xl border px-4 py-3 text-left text-sm",
            modo === "vaciar" ? "border-primary bg-primary-soft" : "border-border"
          )}
        >
          <span className="font-medium text-fg">Vaciar la lista</span>
          <p className="text-fg-muted">Empezás la próxima compra de cero.</p>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={modo === "mantener_pendientes"}
          onClick={() => setModo("mantener_pendientes")}
          className={cn(
            "rounded-xl border px-4 py-3 text-left text-sm",
            modo === "mantener_pendientes" ? "border-primary bg-primary-soft" : "border-border"
          )}
        >
          <span className="font-medium text-fg">Dejar los pendientes</span>
          <p className="text-fg-muted">Lo que no compraste queda para la próxima.</p>
        </button>
      </div>

      <Button
        type="button"
        fullWidth
        disabled={(requiereCategoria && !categoriaGastoId) || cargando}
        onClick={() => onConfirmar(modo, categoriaGastoId)}
      >
        {cargando ? "Cerrando…" : "Cerrar compra"}
      </Button>
    </div>
  );
}
