"use client";

import { useState } from "react";
import { Calendar, Check, ChevronDown, Repeat, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatearFecha } from "@/lib/utils/fechas";
import { estaVencida } from "@/lib/utils/ordenarTareas";
import { vibrar } from "@/lib/utils/haptica";
import type { Subtarea, Tarea } from "@/types/tarea";
import type { Usuario } from "@/types/usuario";

interface TareaRowProps {
  tarea: Tarea;
  uidActual: string;
  usuarios: Record<string, Usuario>;
  onToggleCompletada: (tarea: Tarea) => void;
  onEditar: (tarea: Tarea) => void;
  onBorrar: (tarea: Tarea) => void;
  onCambiarSubtareas: (tarea: Tarea, subtareas: Subtarea[]) => void;
}

const BORDE_PRIORIDAD: Record<string, string> = {
  alta: "border-l-danger",
  media: "border-l-warning",
  baja: "border-l-primary",
};

export function TareaRow({
  tarea,
  uidActual,
  usuarios,
  onToggleCompletada,
  onEditar,
  onBorrar,
  onCambiarSubtareas,
}: TareaRowProps) {
  const [expandida, setExpandida] = useState(false);
  const vencida = estaVencida(tarea);
  const responsableLabel =
    tarea.asignadaA === null
      ? null
      : tarea.asignadaA === uidActual
        ? "Yo"
        : (usuarios[tarea.asignadaA]?.nombre ?? "Pareja");

  const subtareasHechas = tarea.subtareas.filter((s) => s.hecha).length;
  const tieneSubtareas = tarea.subtareas.length > 0;

  function alternarSubtarea(indice: number) {
    vibrar();
    const nuevas = tarea.subtareas.map((s, i) => (i === indice ? { ...s, hecha: !s.hecha } : s));
    onCambiarSubtareas(tarea, nuevas);
  }

  return (
    <li
      className={cn(
        "fila-animada flex flex-col rounded-xl border-l-4 px-2 py-2.5 transition-opacity",
        tarea.prioridad ? BORDE_PRIORIDAD[tarea.prioridad] : "border-l-transparent",
        tarea.completada && "opacity-50"
      )}
    >
      <div className="flex items-center gap-3">
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
          {(tarea.fechaVencimiento || responsableLabel || tieneSubtareas) && (
            <span className="flex items-center gap-2 text-xs text-fg-muted">
              {tarea.fechaVencimiento && (
                <span className={cn("flex items-center gap-1", vencida && "font-medium text-danger")}>
                  <Calendar size={12} aria-hidden="true" />
                  {formatearFecha(tarea.fechaVencimiento.toDate())}
                </span>
              )}
              {tarea.repetir && (
                <span
                  className="flex items-center gap-1"
                  title={tarea.repetir === "semanal" ? "Se repite cada semana" : "Se repite cada mes"}
                >
                  <Repeat size={12} aria-hidden="true" />
                </span>
              )}
              {tieneSubtareas && (
                <span>
                  ☑ {subtareasHechas}/{tarea.subtareas.length}
                </span>
              )}
              {responsableLabel && <span>· {responsableLabel}</span>}
            </span>
          )}
        </button>

        {tieneSubtareas && (
          <button
            type="button"
            onClick={() => setExpandida((v) => !v)}
            aria-expanded={expandida}
            aria-label={expandida ? "Ocultar subtareas" : "Ver subtareas"}
            className="flex h-9 w-9 shrink-0 items-center justify-center text-fg-muted"
          >
            <ChevronDown
              size={16}
              className={cn("transition-transform", expandida && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        )}

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
      </div>

      {expandida && tieneSubtareas && (
        <ul className="ml-10 mt-1.5 flex flex-col gap-1 border-l border-border pl-3">
          {tarea.subtareas.map((subtarea, indice) => (
            <li key={indice}>
              <button
                type="button"
                onClick={() => alternarSubtarea(indice)}
                className="flex min-h-9 w-full items-center gap-2 text-left"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2",
                    subtarea.hecha ? "border-primary bg-primary text-primary-fg" : "border-border"
                  )}
                >
                  {subtarea.hecha && <Check size={11} strokeWidth={3} aria-hidden="true" />}
                </span>
                <span
                  className={cn(
                    "truncate text-sm text-fg",
                    subtarea.hecha && "text-fg-muted line-through"
                  )}
                >
                  {subtarea.texto}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
