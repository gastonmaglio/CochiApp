"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CategoriaSelector } from "@/components/listas/CategoriaSelector";
import { ResponsableSelector } from "@/components/gastos/ResponsableSelector";
import type { Categoria } from "@/types/household";
import type { GastoRecurrente } from "@/types/gastoRecurrente";
import type { Usuario } from "@/types/usuario";
import type { DatosGastoRecurrente } from "@/lib/services/gastosRecurrentes.service";

interface GastoRecurrenteFormSheetProps {
  abierto: boolean;
  recurrente: GastoRecurrente | null;
  categorias: Categoria[];
  miembros: string[];
  usuarios: Record<string, Usuario>;
  uidActual: string;
  cargando: boolean;
  onCerrar: () => void;
  onGuardar: (datos: DatosGastoRecurrente) => void;
  onBorrar?: () => void;
}

export function GastoRecurrenteFormSheet({
  abierto,
  recurrente,
  categorias,
  miembros,
  usuarios,
  uidActual,
  cargando,
  onCerrar,
  onGuardar,
  onBorrar,
}: GastoRecurrenteFormSheetProps) {
  return (
    <Sheet
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={recurrente ? "Editar recurrente" : "Nuevo gasto recurrente"}
    >
      {abierto && (
        <GastoRecurrenteForm
          recurrente={recurrente}
          categorias={categorias}
          miembros={miembros}
          usuarios={usuarios}
          uidActual={uidActual}
          cargando={cargando}
          onGuardar={onGuardar}
          onBorrar={onBorrar}
        />
      )}
    </Sheet>
  );
}

function GastoRecurrenteForm({
  recurrente,
  categorias,
  miembros,
  usuarios,
  uidActual,
  cargando,
  onGuardar,
  onBorrar,
}: Omit<GastoRecurrenteFormSheetProps, "abierto" | "onCerrar">) {
  const [descripcion, setDescripcion] = useState(recurrente?.descripcion ?? "");
  const [monto, setMonto] = useState(recurrente ? String(recurrente.monto) : "");
  const [categoriaId, setCategoriaId] = useState<string | null>(
    recurrente?.categoriaId ?? categorias[0]?.id ?? null
  );
  const [diaDelMes, setDiaDelMes] = useState(recurrente ? String(recurrente.diaDelMes) : "1");
  const [responsableUid, setResponsableUid] = useState<string | null>(
    recurrente?.responsableUid ?? null
  );
  const [error, setError] = useState<string | null>(null);

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    const montoNum = Number(monto.replace(",", "."));
    const diaNum = Number(diaDelMes);
    if (!descripcion.trim()) {
      setError("Ingresá una descripción.");
      return;
    }
    if (Number.isNaN(montoNum) || montoNum <= 0) {
      setError("Ingresá un monto válido.");
      return;
    }
    if (!categoriaId) {
      setError("Elegí una categoría.");
      return;
    }
    if (!Number.isInteger(diaNum) || diaNum < 1 || diaNum > 31) {
      setError("El día tiene que ser un número entre 1 y 31.");
      return;
    }
    onGuardar({
      descripcion: descripcion.trim(),
      monto: montoNum,
      categoriaId,
      diaDelMes: diaNum,
      responsableUid,
    });
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
      <Input
        label="Descripción"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        maxLength={120}
        required
      />
      <Input
        label="Monto mensual"
        type="number"
        inputMode="decimal"
        min={0.01}
        step="0.01"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        required
      />
      <div>
        <p className="mb-1.5 text-sm font-medium text-fg-muted">Categoría</p>
        <CategoriaSelector categorias={categorias} valor={categoriaId} onCambiar={setCategoriaId} />
      </div>
      <Input
        label="Día del mes"
        type="number"
        inputMode="numeric"
        min={1}
        max={31}
        value={diaDelMes}
        onChange={(e) => setDiaDelMes(e.target.value)}
        required
      />
      <div>
        <p className="mb-1.5 text-sm font-medium text-fg-muted">¿De quién es?</p>
        <ResponsableSelector
          miembros={miembros}
          usuarios={usuarios}
          uidActual={uidActual}
          valor={responsableUid}
          onCambiar={setResponsableUid}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth disabled={cargando}>
        {cargando ? "Guardando…" : "Guardar"}
      </Button>
      {onBorrar && (
        <Button type="button" variant="danger" fullWidth onClick={onBorrar}>
          Eliminar recurrente
        </Button>
      )}
    </form>
  );
}
