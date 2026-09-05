import { Wallet } from "lucide-react";
import { formatearMonto } from "@/lib/utils/moneda";
import type { Gasto } from "@/types/gasto";
import type { Categoria } from "@/types/household";
import type { Usuario } from "@/types/usuario";

interface GastoRowProps {
  gasto: Gasto;
  categoria: Categoria | undefined;
  uidActual: string;
  usuarios: Record<string, Usuario>;
  onEditar: (gasto: Gasto) => void;
}

export function GastoRow({ gasto, categoria, uidActual, usuarios, onEditar }: GastoRowProps) {
  const responsableLabel =
    gasto.responsableUid === null
      ? "Compartido"
      : gasto.responsableUid === uidActual
        ? "Yo"
        : (usuarios[gasto.responsableUid]?.nombre ?? "Pareja");

  return (
    <button
      type="button"
      onClick={() => onEditar(gasto)}
      className="fila-animada flex min-h-14 w-full items-center gap-3 px-2 py-2 text-left"
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
        style={{ backgroundColor: categoria ? `${categoria.color}33` : undefined }}
      >
        {categoria?.icono ?? <Wallet size={16} aria-hidden="true" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base text-fg">{gasto.descripcion}</span>
        <span className="block text-xs text-fg-muted">
          {responsableLabel}
          {gasto.esRecurrente && " · Recurrente"}
        </span>
      </span>
      <span className="shrink-0 text-sm font-semibold text-fg">{formatearMonto(gasto.monto)}</span>
    </button>
  );
}
