import { cn } from "@/lib/utils/cn";
import { formatearMonto } from "@/lib/utils/moneda";
import type { Categoria } from "@/types/household";

interface PresupuestoBarraProps {
  categoria: Categoria;
  gastado: number;
}

export function PresupuestoBarra({ categoria, gastado }: PresupuestoBarraProps) {
  const presupuesto = categoria.presupuesto ?? 0;
  const porcentaje = presupuesto > 0 ? Math.min((gastado / presupuesto) * 100, 100) : 0;
  const excedido = presupuesto > 0 && gastado > presupuesto;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium text-fg">
          <span aria-hidden="true">{categoria.icono}</span>
          {categoria.nombre}
        </span>
        <span className={cn("font-medium", excedido ? "text-danger" : "text-fg-muted")}>
          {formatearMonto(gastado)} <span className="text-fg-muted">/ {formatearMonto(presupuesto)}</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg">
        <div
          className={cn("h-full rounded-full transition-all", excedido ? "bg-danger" : "bg-primary")}
          style={{ width: `${porcentaje}%` }}
        />
      </div>
    </div>
  );
}
