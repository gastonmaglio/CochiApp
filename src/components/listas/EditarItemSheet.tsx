"use client";

import { useState, type FormEvent } from "react";
import { Minus, Plus } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CategoriaSelector } from "@/components/listas/CategoriaSelector";
import { ajustarCantidad } from "@/lib/utils/cantidad";
import type { Item } from "@/types/item";
import type { Categoria } from "@/types/household";
import type { DatosItem } from "@/lib/services/items.service";

interface EditarItemSheetProps {
  item: Item | null;
  categorias: Categoria[];
  onCerrar: () => void;
  onGuardar: (datos: DatosItem) => void;
  onBorrar: () => void;
}

export function EditarItemSheet({
  item,
  categorias,
  onCerrar,
  onGuardar,
  onBorrar,
}: EditarItemSheetProps) {
  return (
    <Sheet abierto={Boolean(item)} onCerrar={onCerrar} titulo="Editar item">
      {item && (
        <EditarItemForm
          key={item.id}
          item={item}
          categorias={categorias}
          onGuardar={onGuardar}
          onBorrar={onBorrar}
        />
      )}
    </Sheet>
  );
}

function EditarItemForm({
  item,
  categorias,
  onGuardar,
  onBorrar,
}: {
  item: Item;
  categorias: Categoria[];
  onGuardar: (datos: DatosItem) => void;
  onBorrar: () => void;
}) {
  const [nombre, setNombre] = useState(item.nombre);
  const [cantidad, setCantidad] = useState(item.cantidad ?? "");
  const [notas, setNotas] = useState(item.notas ?? "");
  const [categoriaId, setCategoriaId] = useState<string | null>(item.categoriaId);

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    if (!categoriaId || !nombre.trim()) return;
    onGuardar({
      nombre: nombre.trim(),
      cantidad: cantidad.trim() || null,
      categoriaId,
      notas: notas.trim() || null,
    });
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
      <Input
        label="Nombre"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        maxLength={120}
        required
      />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-fg-muted" htmlFor="cantidad-item">
          Cantidad (opcional)
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCantidad((c) => ajustarCantidad(c, -1))}
            aria-label="Restar uno"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-elevated text-fg-muted active:bg-primary-soft"
          >
            <Minus size={16} aria-hidden="true" />
          </button>
          <input
            id="cantidad-item"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="Ej: 2 kg, 1 docena"
            maxLength={40}
            className="min-h-11 flex-1 rounded-xl border border-border bg-bg-elevated px-3.5 text-center text-base text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => setCantidad((c) => ajustarCantidad(c, 1))}
            aria-label="Sumar uno"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-bg-elevated text-fg-muted active:bg-primary-soft"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium text-fg-muted">Categoría</p>
        <CategoriaSelector categorias={categorias} valor={categoriaId} onCambiar={setCategoriaId} />
      </div>
      <Input
        label="Notas (opcional)"
        value={notas}
        onChange={(e) => setNotas(e.target.value)}
        maxLength={200}
      />
      <Button type="submit" fullWidth>
        Guardar cambios
      </Button>
      <Button type="button" variant="danger" fullWidth onClick={onBorrar}>
        Eliminar item
      </Button>
    </form>
  );
}
