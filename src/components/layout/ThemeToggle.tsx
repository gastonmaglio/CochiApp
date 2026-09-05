"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils/cn";

const OPCIONES = [
  { valor: "claro", icono: Sun, label: "Claro" },
  { valor: "oscuro", icono: Moon, label: "Oscuro" },
] as const;

export function ThemeToggle() {
  const { tema, setTema } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Tema de la app"
      className="inline-flex items-center gap-0.5 rounded-full border border-border bg-bg p-0.5"
    >
      {OPCIONES.map((opcion) => {
        const Icono = opcion.icono;
        const activo = tema === opcion.valor;
        return (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            aria-label={opcion.label}
            onClick={() => setTema(opcion.valor)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              activo ? "bg-primary text-primary-fg" : "text-fg-muted"
            )}
          >
            <Icono size={16} aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}
