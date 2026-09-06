"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { CategoriaSelector } from "@/components/listas/CategoriaSelector";
import { ResponsableSelector } from "@/components/gastos/ResponsableSelector";
import { cn } from "@/lib/utils/cn";
import type { Categoria } from "@/types/household";
import type { Gasto } from "@/types/gasto";
import type { Usuario } from "@/types/usuario";

export interface DatosFormGasto {
  descripcion: string;
  monto: number;
  categoriaId: string;
  fecha: Date;
  responsableUid: string | null;
  division: Record<string, number> | null;
}

interface GastoFormSheetProps {
  abierto: boolean;
  gasto: Gasto | null;
  categorias: Categoria[];
  miembros: string[];
  usuarios: Record<string, Usuario>;
  uidActual: string;
  cargando: boolean;
  onCerrar: () => void;
  onGuardar: (datos: DatosFormGasto) => void;
  onBorrar?: () => void;
}

export function GastoFormSheet({
  abierto,
  gasto,
  categorias,
  miembros,
  usuarios,
  uidActual,
  cargando,
  onCerrar,
  onGuardar,
  onBorrar,
}: GastoFormSheetProps) {
  return (
    <Sheet abierto={abierto} onCerrar={onCerrar} titulo={gasto ? "Editar gasto" : "Nuevo gasto"}>
      {abierto && (
        <GastoForm
          gasto={gasto}
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

function GastoForm({
  gasto,
  categorias,
  miembros,
  usuarios,
  uidActual,
  cargando,
  onGuardar,
  onBorrar,
}: Omit<GastoFormSheetProps, "abierto" | "onCerrar">) {
  const [descripcion, setDescripcion] = useState(gasto?.descripcion ?? "");
  const [monto, setMonto] = useState(gasto ? String(gasto.monto) : "");
  const [categoriaId, setCategoriaId] = useState<string | null>(
    gasto?.categoriaId ?? categorias[0]?.id ?? null
  );
  const [fecha, setFecha] = useState(() =>
    (gasto ? gasto.fecha.toDate() : new Date()).toISOString().slice(0, 10)
  );
  const [responsableUid, setResponsableUid] = useState<string | null>(gasto?.responsableUid ?? null);
  const [repartoPersonalizado, setRepartoPersonalizado] = useState(Boolean(gasto?.division));
  const otroUid = miembros.find((m) => m !== uidActual) ?? null;
  const [miParte, setMiParte] = useState(() =>
    gasto?.division?.[uidActual] != null ? String(gasto.division[uidActual]) : ""
  );
  const [suParte, setSuParte] = useState(() =>
    otroUid && gasto?.division?.[otroUid] != null ? String(gasto.division[otroUid]) : ""
  );
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
    if (!categoriaId) {
      setError("Elegí una categoría.");
      return;
    }

    let division: Record<string, number> | null = null;
    if (responsableUid === null && repartoPersonalizado && otroUid) {
      const miParteNum = Number(miParte.replace(",", "."));
      const suParteNum = Number(suParte.replace(",", "."));
      if (Number.isNaN(miParteNum) || Number.isNaN(suParteNum) || miParteNum < 0 || suParteNum < 0) {
        setError("El reparto tiene que ser en números válidos.");
        return;
      }
      if (Math.abs(miParteNum + suParteNum - montoNum) > 1) {
        setError(
          `Tu parte + la de tu pareja tiene que sumar el total (${(miParteNum + suParteNum).toFixed(0)} vs ${montoNum.toFixed(0)}).`
        );
        return;
      }
      division = { [uidActual]: miParteNum, [otroUid]: suParteNum };
    }

    onGuardar({
      descripcion: descripcion.trim(),
      monto: montoNum,
      categoriaId,
      fecha: new Date(`${fecha}T12:00:00`),
      responsableUid,
      division,
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
        label="Monto"
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
        label="Fecha"
        type="date"
        value={fecha}
        onChange={(e) => setFecha(e.target.value)}
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
      {responsableUid === null && otroUid && (
        <div className="flex flex-col gap-2 rounded-xl border border-border p-3">
          <button
            type="button"
            role="switch"
            aria-checked={repartoPersonalizado}
            onClick={() => setRepartoPersonalizado((v) => !v)}
            className="flex items-center justify-between text-left"
          >
            <span className="text-sm font-medium text-fg">No fue 50/50 — poner cuánto puso cada uno</span>
            <span
              className={cn(
                "h-6 w-11 shrink-0 rounded-full border transition-colors",
                repartoPersonalizado ? "border-primary bg-primary" : "border-border bg-bg"
              )}
            >
              <span
                className={cn(
                  "block h-[18px] w-[18px] translate-y-px rounded-full bg-bg-elevated shadow transition-transform",
                  repartoPersonalizado ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </span>
          </button>
          {repartoPersonalizado && (
            <div className="flex gap-2">
              <Input
                label="Tu parte"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={miParte}
                onChange={(e) => setMiParte(e.target.value)}
              />
              <Input
                label="Su parte"
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                value={suParte}
                onChange={(e) => setSuParte(e.target.value)}
              />
            </div>
          )}
        </div>
      )}
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
          Eliminar gasto
        </Button>
      )}
    </form>
  );
}
