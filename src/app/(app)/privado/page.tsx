"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, TrendingDown, TrendingUp, Trash2, Lock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMovimientosPrivados } from "@/hooks/useMovimientosPrivados";
import { useTodosLosGastos } from "@/hooks/useTodosLosGastos";
import { useToast } from "@/contexts/ToastContext";
import {
  crearMovimientoPrivado,
  eliminarMovimientoPrivado,
} from "@/lib/services/finanzasPrivadas.service";
import { calcularSaldoPersonal } from "@/lib/utils/saldoPersonal";
import { formatearMonto } from "@/lib/utils/moneda";
import { useContadorAnimado } from "@/hooks/useContadorAnimado";
import { formatearFecha } from "@/lib/utils/fechas";
import { mensajeErrorFirebase } from "@/lib/utils/errores";
import {
  MovimientoPrivadoFormSheet,
  type DatosMovimientoPrivado,
} from "@/components/privado/MovimientoPrivadoFormSheet";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import { cn } from "@/lib/utils/cn";
import type { TipoMovimientoPrivado } from "@/types/movimientoPrivado";

export default function PrivadoPage() {
  const router = useRouter();
  const { user, household } = useAuth();
  const householdId = household?.id;
  const uid = user?.uid;
  const { mostrarToast } = useToast();

  const { movimientos, cargando: cargandoMovimientos } = useMovimientosPrivados(householdId, uid);
  const { gastos: gastosCompartidos, cargando: cargandoGastos } = useTodosLosGastos(householdId);

  const [sheetTipo, setSheetTipo] = useState<TipoMovimientoPrivado | null>(null);
  const [guardando, setGuardando] = useState(false);

  const saldo = useMemo(
    () => (uid ? calcularSaldoPersonal(movimientos, gastosCompartidos, uid) : null),
    [movimientos, gastosCompartidos, uid]
  );
  const saldoAnimado = useContadorAnimado(saldo?.saldo ?? 0);

  async function manejarGuardar(datos: DatosMovimientoPrivado) {
    if (!householdId || !uid || !sheetTipo) return;
    setGuardando(true);
    try {
      await crearMovimientoPrivado(householdId, uid, { ...datos, tipo: sheetTipo });
      setSheetTipo(null);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    } finally {
      setGuardando(false);
    }
  }

  async function manejarBorrar(movimientoId: string) {
    if (!householdId || !uid) return;
    try {
      await eliminarMovimientoPrivado(householdId, uid, movimientoId);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  const cargando = cargandoMovimientos || cargandoGastos;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex items-center gap-2 border-b border-border bg-bg-elevated px-3 py-3">
        <button
          type="button"
          onClick={() => router.push("/resumen")}
          aria-label="Volver"
          className="flex min-h-11 min-w-11 items-center justify-center text-fg"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="flex items-center gap-1.5 font-display text-lg font-semibold text-fg">
          <Lock size={16} className="text-blush" aria-hidden="true" />
          Mis finanzas privadas
        </h1>
      </header>

      <div className="flex flex-col gap-6 px-4 py-6 pb-10">
        <p className="rounded-xl border border-dashed border-blush/40 bg-blush-soft px-4 py-3 text-center text-xs text-fg">
          Solo yo
        </p>

        {cargando ? (
          <div className="h-28 animate-pulse rounded-xl bg-bg-elevated" />
        ) : (
          saldo && (
            <div className="flex flex-col items-center gap-1 rounded-xl border border-border bg-bg-elevated p-5 text-center shadow-card">
              <span className="text-sm font-medium text-fg-muted">Tu saldo</span>
              <span
                className={cn(
                  "font-display text-3xl font-bold",
                  saldo.saldo >= 0 ? "text-primary" : "text-danger"
                )}
              >
                {formatearMonto(saldoAnimado)}
              </span>
              <div className="mt-2 flex w-full flex-col gap-1 border-t border-border pt-3 text-xs text-fg-muted">
                <div className="flex justify-between">
                  <span>Ingresos</span>
                  <span className="font-medium text-fg">+{formatearMonto(saldo.totalIngresos)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gastos privados</span>
                  <span className="font-medium text-fg">−{formatearMonto(saldo.totalGastosPrivados)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tu parte de gastos compartidos</span>
                  <span className="font-medium text-fg">
                    −{formatearMonto(saldo.totalParteGastosCompartidos)}
                  </span>
                </div>
              </div>
            </div>
          )
        )}

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-fg-muted">
              <TrendingUp size={14} aria-hidden="true" /> Ingresos
            </h2>
            <button
              type="button"
              onClick={() => setSheetTipo("ingreso")}
              className="flex min-h-9 items-center gap-1 text-sm font-medium text-primary"
            >
              <Plus size={16} aria-hidden="true" /> Nuevo
            </button>
          </div>
          <ListaMovimientos
            movimientos={movimientos.filter((m) => m.tipo === "ingreso")}
            vacioMensaje="Todavía no cargaste ningún ingreso."
            onBorrar={manejarBorrar}
          />
        </section>

        <section className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-fg-muted">
              <TrendingDown size={14} aria-hidden="true" /> Gastos privados
            </h2>
            <button
              type="button"
              onClick={() => setSheetTipo("gasto")}
              className="flex min-h-9 items-center gap-1 text-sm font-medium text-primary"
            >
              <Plus size={16} aria-hidden="true" /> Nuevo
            </button>
          </div>
          <p className="text-xs text-fg-muted">
            No aparecen en los gastos del hogar ni en el total compartido — solo te descuentan a vos.
          </p>
          <ListaMovimientos
            movimientos={movimientos.filter((m) => m.tipo === "gasto")}
            vacioMensaje="Todavía no cargaste ningún gasto privado."
            onBorrar={manejarBorrar}
          />
        </section>
      </div>

      <MovimientoPrivadoFormSheet
        abierto={sheetTipo !== null}
        tipo={sheetTipo ?? "ingreso"}
        cargando={guardando}
        onCerrar={() => setSheetTipo(null)}
        onGuardar={manejarGuardar}
      />
    </main>
  );
}

function ListaMovimientos({
  movimientos,
  vacioMensaje,
  onBorrar,
}: {
  movimientos: { id: string; descripcion: string; monto: number; fecha: import("firebase/firestore").Timestamp }[];
  vacioMensaje: string;
  onBorrar: (id: string) => void;
}) {
  if (movimientos.length === 0) {
    return <EstadoVacio variante="privado" mensaje={vacioMensaje} />;
  }
  return (
    <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-bg-elevated shadow-card">
      {movimientos.map((mov) => (
        <div key={mov.id} className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{mov.descripcion}</p>
            <p className="text-xs text-fg-muted">{formatearFecha(mov.fecha.toDate())}</p>
          </div>
          <span className="shrink-0 text-sm font-semibold text-fg">{formatearMonto(mov.monto)}</span>
          <button
            type="button"
            onClick={() => onBorrar(mov.id)}
            aria-label={`Borrar ${mov.descripcion}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fg-muted active:bg-danger/10 active:text-danger"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
