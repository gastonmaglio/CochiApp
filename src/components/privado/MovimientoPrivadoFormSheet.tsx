"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { TipoMovimientoPrivado } from "@/types/movimientoPrivado";

export interface DatosMovimientoPrivado {
  descripcion: string;
  monto: number;
  fecha: Date;
}

interface MovimientoPrivadoFormSheetProps {
  abierto: boolean;
  tipo: TipoMovimientoPrivado;
  cargando: boolean;
  onCerrar: () => void;
  onGuardar: (datos: DatosMovimientoPrivado) => void;
}

export function MovimientoPrivadoFormSheet({
  abierto,
  tipo,
  cargando,
  onCerrar,
  onGuardar,
}: MovimientoPrivadoFormSheetProps) {
  return (
    <Sheet
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={tipo === "ingreso" ? "Nuevo ingreso" : "Nuevo gasto privado"}
    >
      {abierto && <Formulario tipo={tipo} cargando={cargando} onGuardar={onGuardar} />}
    </Sheet>
  );
}

function Formulario({
  tipo,
  cargando,
  onGuardar,
}: {
  tipo: TipoMovimientoPrivado;
  cargando: boolean;
  onGuardar: (datos: DatosMovimientoPrivado) => void;
}) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    const montoNum = Number(monto.replace(",", "."));
    if (!descripcion.trim()) {
      setError("Ingresá una descripción.");
      return;
    }
    if (Number.isNaN(montoNum) || montoNum <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }
    onGuardar({ descripcion: descripcion.trim(), monto: montoNum, fecha: new Date(`${fecha}T12:00:00`) });
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
      <Input
        label="Descripción"
        placeholder={tipo === "ingreso" ? "Ej: Sueldo, horas extra..." : "Ej: Gasto personal"}
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        maxLength={120}
        autoFocus
        required
      />
      <Input
        label="Monto"
        type="number"
        inputMode="decimal"
        min={0.01}
        step="0.01"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        required
      />
      <Input
        label="Fecha"
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
        required
      />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth disabled={cargando}>
        {cargando ? "Guardando…" : "Guardar"}
      </Button>
    </form>
  );
}
