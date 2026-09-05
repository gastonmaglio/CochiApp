"use client";

import { Sheet } from "@/components/ui/Sheet";
import { formatearFecha } from "@/lib/utils/fechas";
import { formatearMonto } from "@/lib/utils/moneda";
import { cn } from "@/lib/utils/cn";
import type { CompraCerrada } from "@/types/compraCerrada";

interface CompraCerradaDetalleSheetProps {
  compra: CompraCerrada | null;
  onCerrar: () => void;
}

export function CompraCerradaDetalleSheet({ compra, onCerrar }: CompraCerradaDetalleSheetProps) {
  return (
    <Sheet abierto={Boolean(compra)} onCerrar={onCerrar} titulo={compra?.listaNombre ?? ""}>
      {compra && (
        <div className="flex flex-col gap-3">
          <p className="text-sm text-fg-muted">
            {formatearFecha(compra.fecha.toDate())} · Total{" "}
            <span className="font-semibold text-fg">{formatearMonto(compra.total)}</span>
          </p>
          <ul className="flex max-h-[50vh] flex-col divide-y divide-border overflow-y-auto">
            {compra.itemsSnapshot.map((item, indice) => (
              <li key={indice} className="flex items-center gap-2 py-2 text-sm">
                <span aria-hidden="true">{item.comprado ? "✓" : "○"}</span>
                <span className={cn("min-w-0 flex-1 truncate", !item.comprado && "text-fg-muted")}>
                  {item.nombre}
                  {item.cantidad && <span className="text-fg-muted"> · {item.cantidad}</span>}
                </span>
                <span className="shrink-0 text-xs text-fg-muted">{item.categoriaNombre}</span>
                {item.montoGastado != null && (
                  <span className="shrink-0 font-medium text-fg">
                    {formatearMonto(item.montoGastado)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Sheet>
  );
}
