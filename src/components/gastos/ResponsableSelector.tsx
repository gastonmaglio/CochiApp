"use client";

import { cn } from "@/lib/utils/cn";
import type { Usuario } from "@/types/usuario";

interface ResponsableSelectorProps {
  miembros: string[];
  usuarios: Record<string, Usuario>;
  uidActual: string;
  valor: string | null;
  onCambiar: (uid: string | null) => void;
}

export function ResponsableSelector({
  miembros,
  usuarios,
  uidActual,
  valor,
  onCambiar,
}: ResponsableSelectorProps) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Responsable del gasto">
      {miembros.map((uid) => {
        const nombre = uid === uidActual ? "Yo" : (usuarios[uid]?.nombre ?? "Pareja");
        const seleccionado = valor === uid;
        return (
          <button
            key={uid}
            type="button"
            role="radio"
            aria-checked={seleccionado}
            onClick={() => onCambiar(uid)}
            className={cn(
              "min-h-10 flex-1 rounded-xl border text-sm font-medium transition-colors",
              seleccionado
                ? "border-primary bg-primary-soft text-primary"
                : "border-border text-fg-muted"
            )}
          >
            {nombre}
          </button>
        );
      })}
      <button
        type="button"
        role="radio"
        aria-checked={valor === null}
        onClick={() => onCambiar(null)}
        className={cn(
          "min-h-10 flex-1 rounded-xl border text-sm font-medium transition-colors",
          valor === null ? "border-primary bg-primary-soft text-primary" : "border-border text-fg-muted"
        )}
      >
        Compartido
      </button>
    </div>
  );
}
