import { Repeat } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatearMonto } from "@/lib/utils/moneda";
import type { GastoRecurrente } from "@/types/gastoRecurrente";
import type { Categoria } from "@/types/household";

interface GastoRecurrenteRowProps {
  recurrente: GastoRecurrente;
  categoria: Categoria | undefined;
  onEditar: (recurrente: GastoRecurrente) => void;
  onAlternarActivo: (recurrente: GastoRecurrente) => void;
}

export function GastoRecurrenteRow({
  recurrente,
  categoria,
  onEditar,
  onAlternarActivo,
}: GastoRecurrenteRowProps) {
  return (
    <div
      className={cn(
        "fila-animada flex min-h-14 items-center gap-2 px-2 py-2",
        !recurrente.activo && "opacity-50"
      )}
    >
      <button
        type="button"
        onClick={() => onEditar(recurrente)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span aria-hidden="true" className="text-lg">
          {categoria?.icono ?? <Repeat size={16} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-base text-fg">{recurrente.descripcion}</span>
          <span className="block text-xs text-fg-muted">Día {recurrente.diaDelMes} de cada mes</span>
        </span>
        <span className="shrink-0 text-sm font-semibold text-fg">
          {formatearMonto(recurrente.monto)}
        </span>
      </button>
      <button
        type="button"
        role="switch"
        aria-checked={recurrente.activo}
        aria-label={recurrente.activo ? "Desactivar recurrente" : "Activar recurrente"}
        onClick={() => onAlternarActivo(recurrente)}
        className={cn(
          "h-6 w-11 shrink-0 rounded-full border transition-colors",
          recurrente.activo ? "border-primary bg-primary" : "border-border bg-bg"
        )}
      >
        <span
          className={cn(
            "block h-5 w-5 rounded-full bg-bg-elevated shadow transition-transform",
            recurrente.activo ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}
