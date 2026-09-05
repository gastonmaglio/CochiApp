"use client";

import { useState, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ResponsableSelector } from "@/components/gastos/ResponsableSelector";
import { cn } from "@/lib/utils/cn";
import type { PrioridadTarea, RepeticionTarea, Subtarea, Tarea } from "@/types/tarea";
import type { Usuario } from "@/types/usuario";
import type { DatosTarea } from "@/lib/services/tareas.service";

const OPCIONES_PRIORIDAD: { valor: PrioridadTarea; label: string; clases: string }[] = [
  { valor: null, label: "Sin prioridad", clases: "border-border bg-bg-elevated text-fg-muted" },
  { valor: "baja", label: "Baja", clases: "border-primary bg-primary-soft text-primary" },
  { valor: "media", label: "Media", clases: "border-warning bg-warning/15 text-warning" },
  { valor: "alta", label: "Alta", clases: "border-danger bg-danger/10 text-danger" },
];

interface TareaFormSheetProps {
  abierto: boolean;
  tarea: Tarea | null;
  miembros: string[];
  usuarios: Record<string, Usuario>;
  uidActual: string;
  cargando: boolean;
  onCerrar: () => void;
  onGuardar: (datos: DatosTarea) => void;
  onBorrar?: () => void;
}

export function TareaFormSheet({
  abierto,
  tarea,
  miembros,
  usuarios,
  uidActual,
  cargando,
  onCerrar,
  onGuardar,
  onBorrar,
}: TareaFormSheetProps) {
  return (
    <Sheet abierto={abierto} onCerrar={onCerrar} titulo={tarea ? "Editar tarea" : "Nueva tarea"}>
      {abierto && (
        <TareaForm
          tarea={tarea}
          miembros={miembros}
          usuarios={usuarios}
          uidActual={uidActual}
          cargando={cargando}
          onGuardar={onGuardar}
          onBorrar={onBorrar}
        />
      )}
    </Sheet>
  );
}

function TareaForm({
  tarea,
  miembros,
  usuarios,
  uidActual,
  cargando,
  onGuardar,
  onBorrar,
}: Omit<TareaFormSheetProps, "abierto" | "onCerrar">) {
  const [titulo, setTitulo] = useState(tarea?.titulo ?? "");
  const [descripcion, setDescripcion] = useState(tarea?.descripcion ?? "");
  const [fecha, setFecha] = useState(() =>
    tarea?.fechaVencimiento ? tarea.fechaVencimiento.toDate().toISOString().slice(0, 10) : ""
  );
  const [asignadaA, setAsignadaA] = useState<string | null>(tarea?.asignadaA ?? null);
  const [repetir, setRepetir] = useState<RepeticionTarea>(tarea?.repetir ?? null);
  const [prioridad, setPrioridad] = useState<PrioridadTarea>(tarea?.prioridad ?? null);
  const [subtareas, setSubtareas] = useState<Subtarea[]>(tarea?.subtareas ?? []);
  const [nuevaSubtarea, setNuevaSubtarea] = useState("");
  const [error, setError] = useState<string | null>(null);

  function agregarSubtarea() {
    const texto = nuevaSubtarea.trim();
    if (!texto) return;
    setSubtareas((actual) => [...actual, { texto, hecha: false }]);
    setNuevaSubtarea("");
  }

  function quitarSubtarea(indice: number) {
    setSubtareas((actual) => actual.filter((_, i) => i !== indice));
  }

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    if (!titulo.trim()) {
      setError("Ingresá un título.");
      return;
    }
    onGuardar({
      titulo: titulo.trim(),
      descripcion: descripcion.trim() || null,
      fechaVencimiento: fecha ? new Date(`${fecha}T12:00:00`) : null,
      asignadaA,
      repetir: fecha ? repetir : null,
      prioridad,
      subtareas,
    });
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
      <Input
        label="Título"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        maxLength={100}
        placeholder="Ej: Arreglar la canilla del baño"
        autoFocus
        required
      />
      <Input
        label="Descripción (opcional)"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        maxLength={300}
      />
      <Input
        label="Fecha de vencimiento (opcional)"
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
      />
      {fecha && (
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-muted">Repetir</p>
          <div className="flex gap-2" role="radiogroup" aria-label="Repetir tarea">
            {(
              [
                { valor: null, label: "No se repite" },
                { valor: "semanal", label: "Cada semana" },
                { valor: "mensual", label: "Cada mes" },
              ] as const
            ).map((opcion) => (
              <button
                key={opcion.label}
                type="button"
                role="radio"
                aria-checked={repetir === opcion.valor}
                onClick={() => setRepetir(opcion.valor)}
                className={cn(
                  "min-h-9 flex-1 rounded-full border px-2 text-xs font-medium transition-colors",
                  repetir === opcion.valor
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border bg-bg-elevated text-fg-muted"
                )}
              >
                {opcion.label}
              </button>
            ))}
          </div>
          {repetir && (
            <p className="mt-1.5 text-xs text-fg-muted">
              Al marcarla como hecha, se va a crear automáticamente la próxima.
            </p>
          )}
        </div>
      )}
      <div>
        <p className="mb-1.5 text-sm font-medium text-fg-muted">Prioridad</p>
        <div className="flex gap-2" role="radiogroup" aria-label="Prioridad">
          {OPCIONES_PRIORIDAD.map((opcion) => (
            <button
              key={opcion.label}
              type="button"
              role="radio"
              aria-checked={prioridad === opcion.valor}
              onClick={() => setPrioridad(opcion.valor)}
              className={cn(
                "min-h-9 flex-1 rounded-full border px-2 text-xs font-medium transition-colors",
                prioridad === opcion.valor ? opcion.clases : "border-border bg-bg-elevated text-fg-muted"
              )}
            >
              {opcion.label}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium text-fg-muted">Subtareas (opcional)</p>
        {subtareas.length > 0 && (
          <ul className="mb-2 flex flex-col gap-1.5">
            {subtareas.map((subtarea, indice) => (
              <li
                key={indice}
                className="flex items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{subtarea.texto}</span>
                <button
                  type="button"
                  onClick={() => quitarSubtarea(indice)}
                  aria-label={`Quitar "${subtarea.texto}"`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center text-fg-muted"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <input
            value={nuevaSubtarea}
            onChange={(e) => setNuevaSubtarea(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                agregarSubtarea();
              }
            }}
            placeholder="Ej: Comprar la pieza"
            maxLength={80}
            className="min-h-10 flex-1 rounded-xl border border-border bg-bg-elevated px-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            onClick={agregarSubtarea}
            aria-label="Agregar subtarea"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border text-fg-muted"
          >
            <Plus size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium text-fg-muted">¿Quién se encarga?</p>
        <ResponsableSelector
          miembros={miembros}
          usuarios={usuarios}
          uidActual={uidActual}
          valor={asignadaA}
          onCambiar={setAsignadaA}
        />
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
          Eliminar tarea
        </Button>
      )}
    </form>
  );
}
