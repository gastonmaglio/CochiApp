"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { FondoAhorro } from "@/types/fondoAhorro";

export interface DatosFormFondo {
  nombre: string;
  montoObjetivo: number | null;
}

interface FondoAhorroFormSheetProps {
  abierto: boolean;
  fondo: FondoAhorro | null;
  titulo: string;
  cargando: boolean;
  onCerrar: () => void;
  onGuardar: (datos: DatosFormFondo) => void;
  onBorrar?: () => void;
}

export function FondoAhorroFormSheet({
  abierto,
  fondo,
  titulo,
  cargando,
  onCerrar,
  onGuardar,
  onBorrar,
}: FondoAhorroFormSheetProps) {
  return (
    <Sheet abierto={abierto} onCerrar={onCerrar} titulo={titulo}>
      <FondoAhorroForm fondo={fondo} cargando={cargando} onGuardar={onGuardar} onBorrar={onBorrar} />
    </Sheet>
  );
}

function FondoAhorroForm({
  fondo,
  cargando,
  onGuardar,
  onBorrar,
}: {
  fondo: FondoAhorro | null;
  cargando: boolean;
  onGuardar: (datos: DatosFormFondo) => void;
  onBorrar?: () => void;
}) {
  const [nombre, setNombre] = useState(fondo?.nombre ?? "");
  const [montoObjetivo, setMontoObjetivo] = useState(
    fondo?.montoObjetivo != null ? String(fondo.montoObjetivo) : ""
  );

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    if (!nombre.trim()) return;
    const objetivo = montoObjetivo.trim() ? Number(montoObjetivo) : null;
    onGuardar({ nombre: nombre.trim(), montoObjetivo: objetivo && objetivo > 0 ? objetivo : null });
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
      <Input
        label="Nombre del fondo"
        placeholder="Ej: Viaje a Bariloche, Fondo de emergencia..."
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        maxLength={40}
        autoFocus
        required
      />
      <Input
        label="Meta (opcional)"
        type="number"
        inputMode="decimal"
        placeholder="Ej: 500000"
        value={montoObjetivo}
        onChange={(e) => setMontoObjetivo(e.target.value)}
      />
      <Button type="submit" fullWidth disabled={cargando}>
        {cargando ? "Guardando…" : fondo ? "Guardar cambios" : "Crear fondo"}
      </Button>
      {onBorrar && (
        <Button type="button" variant="danger" fullWidth onClick={onBorrar}>
          Eliminar fondo
        </Button>
      )}
    </form>
  );
}
