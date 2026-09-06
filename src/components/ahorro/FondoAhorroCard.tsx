import { PiggyBank } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMisAportes } from "@/hooks/useFondosAhorro";
import { cn } from "@/lib/utils/cn";
import { formatearMonto } from "@/lib/utils/moneda";
import type { FondoAhorro } from "@/types/fondoAhorro";

interface FondoAhorroCardProps {
  fondo: FondoAhorro;
  householdId: string;
  onAbrir: () => void;
}

export function FondoAhorroCard({ fondo, householdId, onAbrir }: FondoAhorroCardProps) {
  const { user } = useAuth();
  // Para uno compartido necesitamos "cuánto puse yo" aparte del total (que ya viene en
  // fondo.total); para uno personal el total YA es 100% propio, no hace falta la cuenta.
  const { miTotal } = useMisAportes(householdId, user?.uid, fondo.tipo === "compartido" ? fondo.id : undefined);

  const objetivo = fondo.montoObjetivo ?? 0;
  const porcentaje = objetivo > 0 ? Math.min((fondo.total / objetivo) * 100, 100) : 0;
  const cumplido = objetivo > 0 && fondo.total >= objetivo;

  return (
    <button
      type="button"
      onClick={onAbrir}
      className="flex flex-col gap-2 rounded-xl border border-border bg-bg-elevated p-4 text-left shadow-card transition-transform active:scale-[0.98]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-semibold text-fg">
          <PiggyBank size={16} className="text-primary" aria-hidden="true" />
          {fondo.nombre}
        </span>
        {fondo.tipo === "compartido" && (
          <span className="rounded-full bg-sky-soft px-2 py-0.5 text-[11px] font-semibold text-sky">
            Compartido
          </span>
        )}
      </div>

      <p className="font-display text-2xl font-semibold text-fg">{formatearMonto(fondo.total)}</p>

      {fondo.tipo === "compartido" && (
        <p className="text-xs text-fg-muted">Tu aporte: {formatearMonto(miTotal)}</p>
      )}

      {objetivo > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="h-2 overflow-hidden rounded-full bg-bg">
            <div
              className={cn("h-full rounded-full transition-all", cumplido ? "bg-primary" : "bg-clay")}
              style={{ width: `${porcentaje}%` }}
            />
          </div>
          <span className="text-xs font-medium text-fg-muted">
            Meta: {formatearMonto(objetivo)} ({Math.round(porcentaje)}%)
          </span>
        </div>
      )}
    </button>
  );
}
