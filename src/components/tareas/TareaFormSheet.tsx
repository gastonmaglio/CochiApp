"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ResponsableSelector } from "@/components/gastos/ResponsableSelector";
import { cn } from "@/lib/utils/cn";
import type { RepeticionTarea, Tarea } from "@/types/tarea";
import type { Usuario } from "@/types/usuario";
import type { DatosTarea } from "@/lib/services/tareas.service";

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
  const [error, setError] = useState<string | null>(null);

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
