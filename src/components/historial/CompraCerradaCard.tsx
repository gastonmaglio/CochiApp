import { formatearFecha } from "@/lib/utils/fechas";
import { formatearMonto } from "@/lib/utils/moneda";
import type { CompraCerrada } from "@/types/compraCerrada";

interface CompraCerradaCardProps {
  compra: CompraCerrada;
  onAbrir: (compra: CompraCerrada) => void;
}

export function CompraCerradaCard({ compra, onAbrir }: CompraCerradaCardProps) {
  return (
    <button
      type="button"
      onClick={() => onAbrir(compra)}
      className="flex min-h-16 w-full items-center justify-between rounded-xl border border-border bg-bg-elevated px-4 py-3 text-left shadow-card"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-medium text-fg">{compra.listaNombre}</span>
        <span className="block text-xs text-fg-muted">
          {formatearFecha(compra.fecha.toDate())} · {compra.cantidadItems}{" "}
          {compra.cantidadItems === 1 ? "producto" : "productos"}
        </span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-fg">{formatearMonto(compra.total)}</span>
    </button>
  );
}
