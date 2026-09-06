"use client";

import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useMisAportes } from "@/hooks/useFondosAhorro";
import { crearAporte, eliminarAporte } from "@/lib/services/fondosAhorro.service";
import { useToast } from "@/contexts/ToastContext";
import { mensajeErrorFirebase } from "@/lib/utils/errores";
import { formatearFecha } from "@/lib/utils/fechas";
import { formatearMonto } from "@/lib/utils/moneda";
import { AporteFondoFormSheet, type DatosAporteFondo } from "@/components/ahorro/AporteFondoFormSheet";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { FondoAhorro } from "@/types/fondoAhorro";

interface FondoAhorroDetalleSheetProps {
  abierto: boolean;
  fondo: FondoAhorro | null;
  householdId: string;
  onCerrar: () => void;
  onEditar: () => void;
}

export function FondoAhorroDetalleSheet({
  abierto,
  fondo,
  householdId,
  onCerrar,
  onEditar,
}: FondoAhorroDetalleSheetProps) {
  const { user } = useAuth();
  const { mostrarToast } = useToast();
  const { aportes, miTotal } = useMisAportes(householdId, user?.uid, fondo?.id);
  const [sheetAporteAbierto, setSheetAporteAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  if (!fondo || !user) return null;

  async function manejarGuardarAporte(datos: DatosAporteFondo) {
    if (!user || !fondo) return;
    setGuardando(true);
    try {
      await crearAporte(householdId, user.uid, fondo, datos);
      setSheetAporteAbierto(false);
      mostrarToast(datos.monto >= 0 ? "Depósito agregado" : "Retiro registrado");
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    } finally {
      setGuardando(false);
    }
  }

  async function manejarBorrarAporte(aporteId: string, monto: number) {
    if (!user || !fondo) return;
    try {
      await eliminarAporte(householdId, user.uid, fondo, { id: aporteId, monto });
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  return (
    <>
      <Sheet abierto={abierto} onCerrar={onCerrar} titulo={fondo.nombre}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-bg p-4 text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-fg-muted">
              Total del fondo
            </span>
            <span className="font-display text-3xl font-semibold text-fg">
              {formatearMonto(fondo.total)}
            </span>
            {fondo.tipo === "compartido" && (
              <span className="text-xs text-fg-muted">Tu aporte: {formatearMonto(miTotal)}</span>
            )}
          </div>

          <div className="flex gap-2">
            <Button type="button" fullWidth onClick={() => setSheetAporteAbierto(true)}>
              <Plus size={16} aria-hidden="true" /> Mover plata
            </Button>
            <Button type="button" variant="secondary" onClick={onEditar} aria-label="Editar fondo">
              <Pencil size={16} aria-hidden="true" />
            </Button>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-fg-muted">
              {fondo.tipo === "compartido" ? "Tus movimientos" : "Movimientos"}
            </h3>
            {aportes.length === 0 ? (
              <EstadoVacio mensaje="Todavía no cargaste ningún movimiento en este fondo." />
            ) : (
              <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-bg-elevated">
                {aportes.map((aporte) => (
                  <div key={aporte.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">
                        {aporte.descripcion || (aporte.monto >= 0 ? "Depósito" : "Retiro")}
                      </p>
                      <p className="text-xs text-fg-muted">{formatearFecha(aporte.fecha.toDate())}</p>
                    </div>
                    <span
                      className={
                        aporte.monto >= 0
                          ? "shrink-0 text-sm font-semibold text-primary"
                          : "shrink-0 text-sm font-semibold text-blush"
                      }
                    >
                      {aporte.monto >= 0 ? "+" : ""}
                      {formatearMonto(aporte.monto)}
                    </span>
                    <button
                      type="button"
                      onClick={() => manejarBorrarAporte(aporte.id, aporte.monto)}
                      aria-label="Borrar movimiento"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fg-muted active:bg-danger/10 active:text-danger"
                    >
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Sheet>

      <AporteFondoFormSheet
        abierto={sheetAporteAbierto}
        nombreFondo={fondo.nombre}
        cargando={guardando}
        onCerrar={() => setSheetAporteAbierto(false)}
        onGuardar={manejarGuardarAporte}
      />
    </>
  );
}
