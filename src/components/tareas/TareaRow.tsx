"use client";

import { Calendar, Check, Repeat, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatearFecha } from "@/lib/utils/fechas";
import { estaVencida } from "@/lib/utils/ordenarTareas";
import { vibrar } from "@/lib/utils/haptica";
import type { Tarea } from "@/types/tarea";
import type { Usuario } from "@/types/usuario";

interface TareaRowProps {
  tarea: Tarea;
  uidActual: string;
  usuarios: Record<string, Usuario>;
  onToggleCompletada: (tarea: Tarea) => void;
  onEditar: (tarea: Tarea) => void;
  onBorrar: (tarea: Tarea) => void;
}

export function TareaRow({
  tarea,
  uidActual,
  usuarios,
  onToggleCompletada,
  onEditar,
  onBorrar,
}: TareaRowProps) {
  const vencida = estaVencida(tarea);
  const responsableLabel =
    tarea.asignadaA === null
      ? null
      : tarea.asignadaA === uidActual
        ? "Yo"
        : (usuarios[tarea.asignadaA]?.nombre ?? "Pareja");

  return (
    <li
      className={cn(
        "fila-animada flex items-center gap-3 rounded-xl px-2 py-2.5 transition-opacity",
        tarea.completada && "opacity-50"
      )}
    >
      <button
        type="button"
        onClick={() => {
          vibrar();
          onToggleCompletada(tarea);
        }}
        aria-pressed={tarea.completada}
        aria-label={
          tarea.completada ? `Marcar ${tarea.titulo} como pendiente` : `Marcar ${tarea.titulo} como hecha`
        }
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          tarea.completada ? "border-primary bg-primary text-primary-fg" : "border-border"
        )}
      >
        {tarea.completada && <Check size={14} strokeWidth={3} aria-hidden="true" />}
      </button>

      <button
        type="button"
        onClick={() => onEditar(tarea)}
        className="flex min-h-11 min-w-0 flex-1 flex-col items-start justify-center text-left"
      >
        <span className={cn("truncate text-base text-fg", tarea.completada && "line-through")}>
          {tarea.titulo}
        </span>
        {(tarea.fechaVencimiento || responsableLabel) && (
          <span className="flex items-center gap-2 text-xs text-fg-muted">
            {tarea.fechaVencimiento && (
              <span className={cn("flex items-center gap-1", vencida && "font-medium text-danger")}>
                <Calendar size={12} aria-hidden="true" />
                {formatearFecha(tarea.fechaVencimiento.toDate())}
              </span>
            )}
            {tarea.repetir && (
              <span className="flex items-center gap-1" title={tarea.repetir === "semanal" ? "Se repite cada semana" : "Se repite cada mes"}>
                <Repeat size={12} aria-hidden="true" />
              </span>
            )}
            {responsableLabel && <span>· {responsableLabel}</span>}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => {
          vibrar(25);
          onBorrar(tarea);
        }}
        aria-label={`Borrar ${tarea.titulo}`}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fg-muted active:bg-danger/10 active:text-danger"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </li>
  );
}
