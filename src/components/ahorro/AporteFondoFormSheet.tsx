"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

export interface DatosAporteFondo {
  monto: number;
  descripcion: string | null;
  fecha: Date;
}

interface AporteFondoFormSheetProps {
  abierto: boolean;
  nombreFondo: string;
  cargando: boolean;
  onCerrar: () => void;
  onGuardar: (datos: DatosAporteFondo) => void;
}

export function AporteFondoFormSheet({
  abierto,
  nombreFondo,
  cargando,
  onCerrar,
  onGuardar,
}: AporteFondoFormSheetProps) {
  return (
    <Sheet abierto={abierto} onCerrar={onCerrar} titulo={`Mover en "${nombreFondo}"`}>
      {abierto && <Formulario cargando={cargando} onGuardar={onGuardar} />}
    </Sheet>
  );
}

function Formulario({
  cargando,
  onGuardar,
}: {
  cargando: boolean;
  onGuardar: (datos: DatosAporteFondo) => void;
}) {
  const [movimiento, setMovimiento] = useState<"deposito" | "retiro">("deposito");
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    const montoNum = Number(monto.replace(",", "."));
    if (Number.isNaN(montoNum) || montoNum <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }
    onGuardar({
      monto: movimiento === "retiro" ? -montoNum : montoNum,
      descripcion: descripcion.trim() || null,
      fecha: new Date(`${fecha}T12:00:00`),
    });
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
      <div className="flex gap-2 rounded-xl border border-border bg-bg p-1">
        <button
          type="button"
          onClick={() => setMovimiento("deposito")}
          className={cn(
            "min-h-10 flex-1 rounded-lg text-sm font-medium transition-colors",
            movimiento === "deposito" ? "bg-primary-soft text-primary" : "text-fg-muted"
          )}
        >
          Depósito
        </button>
        <button
          type="button"
          onClick={() => setMovimiento("retiro")}
          className={cn(
            "min-h-10 flex-1 rounded-lg text-sm font-medium transition-colors",
            movimiento === "retiro" ? "bg-blush-soft text-blush" : "text-fg-muted"
          )}
        >
          Retiro
        </button>
      </div>
      <Input
        label="Monto"
        type="number"
        inputMode="decimal"
        min={0.01}
        step="0.01"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        autoFocus
        required
      />
      <Input
        label="Descripción (opcional)"
        placeholder={movimiento === "deposito" ? "Ej: Ahorro del mes" : "Ej: Pasaje de avión"}
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        maxLength={120}
      />
      <Input label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth disabled={cargando}>
        {cargando ? "Guardando…" : movimiento === "deposito" ? "Agregar depósito" : "Registrar retiro"}
      </Button>
    </form>
  );
}
