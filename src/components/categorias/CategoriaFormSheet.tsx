"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { Categoria } from "@/types/household";

// Paleta curada para que las categorías nuevas mantengan la estética pastel de la app
// en vez de dejar elegir cualquier color (que rompería la consistencia visual).
const PALETA_COLORES = [
  "#38BDF8", "#F59E0B", "#22D3EE", "#4ADE80", "#F87171",
  "#A78BFA", "#F472B6", "#FBBF24", "#94A3B8", "#FB7185",
  "#34D399", "#818CF8",
];

interface DatosCategoria {
  nombre: string;
  icono: string;
  color: string;
  presupuesto: number | null;
  categoriaPadreId: string | null;
}

interface CategoriaFormSheetProps {
  abierto: boolean;
  categoria: Categoria | null;
  // Presupuesto solo tiene sentido para categorías de gastos, no de compras.
  conPresupuesto: boolean;
  // Categorías de primer nivel disponibles para elegir como padre (no incluye a la que
  // se está editando, para no poder ponerla como subcategoría de sí misma).
  categoriasPadreDisponibles: Categoria[];
  onCerrar: () => void;
  onGuardar: (datos: DatosCategoria) => void;
  onBorrar?: () => void;
  cargando: boolean;
}

export function CategoriaFormSheet({
  abierto,
  categoria,
  conPresupuesto,
  categoriasPadreDisponibles,
  onCerrar,
  onGuardar,
  onBorrar,
  cargando,
}: CategoriaFormSheetProps) {
  return (
    <Sheet
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={categoria ? "Editar categoría" : "Nueva categoría"}
    >
      {abierto && (
        <CategoriaForm
          categoria={categoria}
          conPresupuesto={conPresupuesto}
          categoriasPadreDisponibles={categoriasPadreDisponibles}
          onGuardar={onGuardar}
          onBorrar={onBorrar}
          cargando={cargando}
        />
      )}
    </Sheet>
  );
}

function CategoriaForm({
  categoria,
  conPresupuesto,
  categoriasPadreDisponibles,
  onGuardar,
  onBorrar,
  cargando,
}: Omit<CategoriaFormSheetProps, "abierto" | "onCerrar">) {
  const [nombre, setNombre] = useState(categoria?.nombre ?? "");
  const [icono, setIcono] = useState(categoria?.icono ?? "🏷️");
  const [color, setColor] = useState(categoria?.color ?? PALETA_COLORES[0]);
  const [presupuesto, setPresupuesto] = useState(
    categoria?.presupuesto != null ? String(categoria.presupuesto) : ""
  );
  const [categoriaPadreId, setCategoriaPadreId] = useState<string | null>(
    categoria?.categoriaPadreId ?? null
  );
  const [error, setError] = useState<string | null>(null);

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    if (!nombre.trim()) {
      setError("Ponele un nombre a la categoría.");
      return;
    }
    if (!icono.trim()) {
      setError("Elegí un emoji para representarla.");
      return;
    }
    const presupuestoNum = presupuesto.trim() ? Number(presupuesto.replace(",", ".")) : null;
    if (presupuestoNum != null && (Number.isNaN(presupuestoNum) || presupuestoNum <= 0)) {
      setError("El presupuesto tiene que ser un número mayor a 0.");
      return;
    }
    onGuardar({
      nombre: nombre.trim(),
      icono: icono.trim(),
      color,
      presupuesto: presupuestoNum,
      categoriaPadreId,
    });
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="w-20 shrink-0">
          <Input
            label="Ícono"
            value={icono}
            onChange={(e) => setIcono(e.target.value)}
            maxLength={4}
            className="text-center text-xl"
            required
          />
        </div>
        <div className="flex-1">
          <Input
            label="Nombre"
            placeholder="Ej: Panadería, Suscripciones..."
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={30}
            required
          />
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-sm font-medium text-fg-muted">Color</p>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Color de la categoría">
          {PALETA_COLORES.map((opcion) => (
            <button
              key={opcion}
              type="button"
              role="radio"
              aria-checked={color === opcion}
              aria-label={`Color ${opcion}`}
              onClick={() => setColor(opcion)}
              className={cn(
                "h-9 w-9 rounded-full border-2 transition-transform",
                color === opcion ? "scale-110 border-fg" : "border-transparent"
              )}
              style={{ backgroundColor: opcion }}
            />
          ))}
        </div>
      </div>

      {categoriasPadreDisponibles.length > 0 && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-muted">Subcategoría de (opcional)</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Categoría padre">
            <button
              type="button"
              role="radio"
              aria-checked={categoriaPadreId === null}
              onClick={() => setCategoriaPadreId(null)}
              className={cn(
                "min-h-8 rounded-full border px-3 text-xs font-medium transition-colors",
                categoriaPadreId === null
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-bg-elevated text-fg-muted"
              )}
            >
              Ninguna
            </button>
            {categoriasPadreDisponibles.map((padre) => (
              <button
                key={padre.id}
                type="button"
                role="radio"
                aria-checked={categoriaPadreId === padre.id}
                onClick={() => setCategoriaPadreId(padre.id)}
                className={cn(
                  "flex min-h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors",
                  categoriaPadreId === padre.id
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-bg-elevated text-fg-muted"
                )}
              >
                <span aria-hidden="true">{padre.icono}</span>
                {padre.nombre}
              </button>
            ))}
          </div>
        </div>
      )}

      {conPresupuesto && (
        <Input
          label="Presupuesto mensual (opcional)"
          type="number"
          inputMode="decimal"
          min={0.01}
          step="0.01"
          placeholder="Ej: 50000"
          value={presupuesto}
          onChange={(e) => setPresupuesto(e.target.value)}
        />
      )}

      <div
        className="flex items-center gap-2 rounded-xl border border-border bg-bg px-3.5 py-2.5"
        aria-hidden="true"
      >
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-base"
          style={{ backgroundColor: `${color}33` }}
        >
          {icono || "🏷️"}
        </span>
        <span className="text-sm text-fg-muted">Así se va a ver: </span>
        <span className="text-sm font-medium text-fg">{nombre || "Nombre de la categoría"}</span>
      </div>

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}

      <Button type="submit" fullWidth disabled={cargando}>
        {cargando ? "Guardando…" : "Guardar"}
      </Button>
      {onBorrar && (
        <Button type="button" variant="danger" fullWidth onClick={onBorrar}>
          Eliminar categoría
        </Button>
      )}
    </form>
  );
}
