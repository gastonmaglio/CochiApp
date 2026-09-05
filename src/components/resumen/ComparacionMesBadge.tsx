import { cn } from "@/lib/utils/cn";
import { formatearMonto } from "@/lib/utils/moneda";
import type { ComparacionMes } from "@/lib/utils/agregacionesGastos";

interface ComparacionMesBadgeProps {
  comparacion: ComparacionMes;
  etiqueta?: string;
}

export function ComparacionMesBadge({ comparacion, etiqueta = "mes anterior" }: ComparacionMesBadgeProps) {
  if (comparacion.porcentaje === null) {
    return <span className="text-xs text-fg-muted">Sin datos de {etiqueta} para comparar</span>;
  }

  const subio = comparacion.diferencia > 0;
  const igual = comparacion.diferencia === 0;

  return (
    <span
      className={cn(
        "inline-flex flex-wrap items-center justify-center gap-1 text-xs font-medium",
        igual ? "text-fg-muted" : subio ? "text-danger" : "text-primary"
      )}
    >
      <span>
        {igual ? "=" : subio ? "▲" : "▼"} {Math.abs(comparacion.porcentaje).toFixed(0)}%
      </span>
      <span className="text-fg-muted">
        ({subio ? "+" : ""}
        {formatearMonto(comparacion.diferencia)} vs. {etiqueta})
      </span>
    </span>
  );
}
