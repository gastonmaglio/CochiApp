"use client";

import { useEffect, useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { Mic, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCategorias } from "@/hooks/useCategorias";
import { useGastosDelMes } from "@/hooks/useGastosDelMes";
import { useGastosRecurrentes } from "@/hooks/useGastosRecurrentes";
import { useMiembrosHousehold } from "@/hooks/useMiembrosHousehold";
import { useAccionesVoz } from "@/hooks/useAccionesVoz";
import { useToast } from "@/contexts/ToastContext";
import {
  crearGasto,
  editarGasto,
  eliminarGasto,
  restaurarGasto,
} from "@/lib/services/gastos.service";
import { crearMovimientoPrivado } from "@/lib/services/finanzasPrivadas.service";
import {
  alternarActivoGastoRecurrente,
  crearGastoRecurrente,
  editarGastoRecurrente,
  eliminarGastoRecurrente,
  generarGastosRecurrentesPendientes,
  type DatosGastoRecurrente,
} from "@/lib/services/gastosRecurrentes.service";
import { inicioDeMes, inicioDeMesSiguiente } from "@/lib/utils/fechas";
import { formatearMonto } from "@/lib/utils/moneda";
import { useContadorAnimado } from "@/hooks/useContadorAnimado";
import { mensajeErrorFirebase } from "@/lib/utils/errores";
import { SelectorMes } from "@/components/gastos/SelectorMes";
import { GastoRow } from "@/components/gastos/GastoRow";
import { GastoFormSheet, type DatosFormGasto } from "@/components/gastos/GastoFormSheet";
import { GastoRecurrenteRow } from "@/components/gastos/GastoRecurrenteRow";
import { GastoRecurrenteFormSheet } from "@/components/gastos/GastoRecurrenteFormSheet";
import { GrabarVozSheet } from "@/components/voz/GrabarVozSheet";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { Gasto } from "@/types/gasto";
import type { GastoRecurrente } from "@/types/gastoRecurrente";

export default function GastosPage() {
  const { user, household } = useAuth();
  const householdId = household?.id;
  const uidActual = user?.uid ?? "";
  const miembros = household?.miembros ?? [];
  const usuarios = useMiembrosHousehold(miembros);

  const [mes, setMes] = useState(() => new Date());
  const inicio = useMemo(() => inicioDeMes(mes), [mes]);
  const fin = useMemo(() => inicioDeMesSiguiente(mes), [mes]);

  const { gastos, cargando: cargandoGastos } = useGastosDelMes(householdId, inicio, fin);
  const { categorias, cargando: cargandoCategorias } = useCategorias(householdId, "categoriasGastos");
  const { categorias: categoriasCompras } = useCategorias(householdId, "categoriasCompras");
  const { recurrentes } = useGastosRecurrentes(householdId);
  const acciones = useAccionesVoz(householdId, user);

  const [sheetGastoAbierto, setSheetGastoAbierto] = useState(false);
  const [gastoEditando, setGastoEditando] = useState<Gasto | null>(null);
  const [sheetRecurrenteAbierto, setSheetRecurrenteAbierto] = useState(false);
  const [recurrenteEditando, setRecurrenteEditando] = useState<GastoRecurrente | null>(null);
  const [sheetVozAbierto, setSheetVozAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const { mostrarToast } = useToast();

  useEffect(() => {
    if (!householdId || !user) return;
    generarGastosRecurrentesPendientes(householdId, user.uid).catch((error: unknown) => {
      console.error("No se pudieron generar los gastos recurrentes del mes", error);
    });
  }, [householdId, user]);

  const categoriasPorId = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const totalMes = useMemo(() => gastos.reduce((acc, g) => acc + g.monto, 0), [gastos]);
  const totalMesAnimado = useContadorAnimado(totalMes);

  function abrirNuevoGasto() {
    setGastoEditando(null);
    setSheetGastoAbierto(true);
  }

  function abrirEditarGasto(gasto: Gasto) {
    setGastoEditando(gasto);
    setSheetGastoAbierto(true);
  }

  function cerrarSheetGasto() {
    setSheetGastoAbierto(false);
    setGastoEditando(null);
  }

  async function manejarGuardarGasto(datos: DatosFormGasto) {
    if (!householdId || !user) return;
    setGuardando(true);
    try {
      if (datos.esPrivado) {
        await crearMovimientoPrivado(householdId, user.uid, {
          tipo: "gasto",
          descripcion: datos.descripcion,
          monto: datos.monto,
          fecha: datos.fecha,
        });
        mostrarToast(`"${datos.descripcion}" cargado como gasto privado`);
        cerrarSheetGasto();
        return;
      }
      const payload = {
        descripcion: datos.descripcion,
        monto: datos.monto,
        categoriaId: datos.categoriaId,
        fecha: Timestamp.fromDate(datos.fecha),
        responsableUid: datos.responsableUid,
        division: datos.division,
      };
      if (gastoEditando) {
        await editarGasto(householdId, gastoEditando.id, payload);
      } else {
        await crearGasto(householdId, user.uid, payload);
      }
      cerrarSheetGasto();
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    } finally {
      setGuardando(false);
    }
  }

  async function manejarBorrarGasto() {
    if (!householdId || !gastoEditando) return;
    try {
      const gastoBorrado = await eliminarGasto(householdId, gastoEditando.id);
      cerrarSheetGasto();
      mostrarToast(`"${gastoBorrado.descripcion}" eliminado`, {
        accionLabel: "Deshacer",
        onAccion: () => {
          restaurarGasto(householdId, gastoBorrado).catch((err: unknown) => {
            mostrarToast(mensajeErrorFirebase(err));
          });
        },
      });
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  function abrirNuevoRecurrente() {
    setRecurrenteEditando(null);
    setSheetRecurrenteAbierto(true);
  }

  function cerrarSheetRecurrente() {
    setSheetRecurrenteAbierto(false);
    setRecurrenteEditando(null);
  }

  async function manejarBorrarRecurrente() {
    if (!householdId || !recurrenteEditando) return;
    try {
      await eliminarGastoRecurrente(householdId, recurrenteEditando.id);
      cerrarSheetRecurrente();
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  async function manejarGuardarRecurrente(datos: DatosGastoRecurrente) {
    if (!householdId || !user) return;
    setGuardando(true);
    try {
      if (recurrenteEditando) {
        await editarGastoRecurrente(householdId, recurrenteEditando.id, datos);
      } else {
        await crearGastoRecurrente(householdId, user.uid, datos);
      }
      cerrarSheetRecurrente();
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    } finally {
      setGuardando(false);
    }
  }

  async function manejarAlternarActivo(recurrente: GastoRecurrente) {
    if (!householdId) return;
    try {
      await alternarActivoGastoRecurrente(householdId, recurrente.id, !recurrente.activo);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  const cargando = cargandoGastos || cargandoCategorias;

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-6 pb-24">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-4 shadow-card">
        <SelectorMes mes={mes} onCambiar={setMes} />
        <p className="text-center font-display text-2xl font-semibold text-fg">{formatearMonto(totalMesAnimado)}</p>
      </div>

      <button
        type="button"
        onClick={() => setSheetVozAbierto(true)}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 text-sm font-medium text-primary active:bg-primary-soft"
      >
        <Mic size={18} aria-hidden="true" /> Cargar gasto por voz
      </button>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-fg-muted">Gastos del mes</h2>
        {cargando ? (
          <div className="flex flex-col gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-bg-elevated" />
            ))}
          </div>
        ) : gastos.length === 0 ? (
          <EstadoVacio variante="gastos" mensaje="Todavía no cargaste gastos este mes." />
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {gastos.map((gasto) => (
              <GastoRow
                key={gasto.id}
                gasto={gasto}
                categoria={categoriasPorId.get(gasto.categoriaId)}
                uidActual={uidActual}
                usuarios={usuarios}
                onEditar={abrirEditarGasto}
              />
            ))}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg-muted">Gastos recurrentes</h2>
          <button
            type="button"
            onClick={abrirNuevoRecurrente}
            className="flex min-h-9 items-center gap-1 text-sm font-medium text-primary"
          >
            <Plus size={16} aria-hidden="true" /> Nuevo
          </button>
        </div>
        {recurrentes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-6 text-center text-sm text-fg-muted">
            Marcá acá el alquiler, expensas o cualquier gasto fijo para que se cargue solo cada mes.
          </p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {recurrentes.map((recurrente) => (
              <GastoRecurrenteRow
                key={recurrente.id}
                recurrente={recurrente}
                categoria={categoriasPorId.get(recurrente.categoriaId)}
                onEditar={(r) => {
                  setRecurrenteEditando(r);
                  setSheetRecurrenteAbierto(true);
                }}
                onAlternarActivo={manejarAlternarActivo}
              />
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        onClick={abrirNuevoGasto}
        aria-label="Agregar gasto"
        className="fixed bottom-24 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-fg shadow-lg transition-transform active:scale-95"
      >
        <Plus size={24} aria-hidden="true" />
      </button>

      <GastoFormSheet
        abierto={sheetGastoAbierto}
        gasto={gastoEditando}
        categorias={categorias}
        miembros={miembros}
        usuarios={usuarios}
        uidActual={uidActual}
        cargando={guardando}
        onCerrar={cerrarSheetGasto}
        onGuardar={manejarGuardarGasto}
        onBorrar={gastoEditando ? manejarBorrarGasto : undefined}
      />

      <GastoRecurrenteFormSheet
        abierto={sheetRecurrenteAbierto}
        recurrente={recurrenteEditando}
        categorias={categorias}
        miembros={miembros}
        usuarios={usuarios}
        uidActual={uidActual}
        cargando={guardando}
        onCerrar={cerrarSheetRecurrente}
        onGuardar={manejarGuardarRecurrente}
        onBorrar={recurrenteEditando ? manejarBorrarRecurrente : undefined}
      />

      {user && householdId && (
        <GrabarVozSheet
          abierto={sheetVozAbierto}
          user={user}
          householdId={householdId}
          categoriasCompras={categoriasCompras}
          categoriasGastos={categorias}
          modoLista="crear"
          onCerrar={() => setSheetVozAbierto(false)}
          onConfirmarLista={(nombreLista, items) =>
            acciones.confirmarLista(nombreLista ?? "Lista de compras", items)
          }
          onConfirmarGasto={acciones.confirmarGasto}
          onConfirmarTarea={acciones.confirmarTarea}
        />
      )}
    </main>
  );
}
