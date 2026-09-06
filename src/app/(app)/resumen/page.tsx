"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Lock, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCategorias } from "@/hooks/useCategorias";
import { useGastosDelMes } from "@/hooks/useGastosDelMes";
import { useEvolucionMensual } from "@/hooks/useEvolucionMensual";
import { useComprasCerradas } from "@/hooks/useComprasCerradas";
import { useMiembrosHousehold } from "@/hooks/useMiembrosHousehold";
import { inicioDeMes, inicioDeMesSiguiente, formatearMes } from "@/lib/utils/fechas";
import { formatearMonto } from "@/lib/utils/moneda";
import {
  compararConMesAnterior,
  generarInsightGastos,
  totalGeneral,
  totalPorCategoria,
  totalPorResponsable,
} from "@/lib/utils/agregacionesGastos";
import { SelectorMes } from "@/components/gastos/SelectorMes";
import { ComparacionMesBadge } from "@/components/resumen/ComparacionMesBadge";
import { TotalPorPersonaCard } from "@/components/resumen/TotalPorPersonaCard";
import { GraficoTortaCategorias } from "@/components/resumen/GraficoTortaCategorias";
import { GraficoEvolucionMensual } from "@/components/resumen/GraficoEvolucionMensual";
import { PresupuestoBarra } from "@/components/resumen/PresupuestoBarra";
import { ExportarCsvButton } from "@/components/resumen/ExportarCsvButton";
import { CompraCerradaCard } from "@/components/historial/CompraCerradaCard";
import { CompraCerradaDetalleSheet } from "@/components/historial/CompraCerradaDetalleSheet";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { CompraCerrada } from "@/types/compraCerrada";

export default function ResumenPage() {
  const { user, household } = useAuth();
  const householdId = household?.id;
  const uidActual = user?.uid ?? "";
  const miembros = household?.miembros ?? [];
  const usuarios = useMiembrosHousehold(miembros);

  const [mes, setMes] = useState(() => new Date());
  const inicio = useMemo(() => inicioDeMes(mes), [mes]);
  const fin = useMemo(() => inicioDeMesSiguiente(mes), [mes]);
  const mesAnterior = useMemo(() => new Date(mes.getFullYear(), mes.getMonth() - 1, 1), [mes]);
  const inicioAnterior = useMemo(() => inicioDeMes(mesAnterior), [mesAnterior]);
  const finAnterior = useMemo(() => inicioDeMesSiguiente(mesAnterior), [mesAnterior]);

  const mesAñoAnterior = useMemo(() => new Date(mes.getFullYear() - 1, mes.getMonth(), 1), [mes]);
  const inicioAñoAnterior = useMemo(() => inicioDeMes(mesAñoAnterior), [mesAñoAnterior]);
  const finAñoAnterior = useMemo(() => inicioDeMesSiguiente(mesAñoAnterior), [mesAñoAnterior]);

  // Los 3 meses previos al actual (sin incluirlo), para calcular un promedio por
  // categoría contra el que comparar y generar el insight automático.
  const inicioPromedio = useMemo(() => new Date(mes.getFullYear(), mes.getMonth() - 3, 1), [mes]);

  const { gastos, cargando: cargandoGastos } = useGastosDelMes(householdId, inicio, fin);
  const { gastos: gastosMesAnterior } = useGastosDelMes(householdId, inicioAnterior, finAnterior);
  const { gastos: gastosAñoAnterior } = useGastosDelMes(householdId, inicioAñoAnterior, finAñoAnterior);
  const { gastos: gastosPromedio } = useGastosDelMes(householdId, inicioPromedio, inicio);
  const { categorias } = useCategorias(householdId, "categoriasGastos");
  const { puntos: evolucion, cargando: cargandoEvolucion } = useEvolucionMensual(householdId, mes);
  const { compras, cargando: cargandoCompras } = useComprasCerradas(householdId);

  const [compraSeleccionada, setCompraSeleccionada] = useState<CompraCerrada | null>(null);

  const total = useMemo(() => totalGeneral(gastos), [gastos]);
  const totalAnterior = useMemo(() => totalGeneral(gastosMesAnterior), [gastosMesAnterior]);
  const comparacion = useMemo(
    () => compararConMesAnterior(total, totalAnterior),
    [total, totalAnterior]
  );
  const totalAñoAnterior = useMemo(() => totalGeneral(gastosAñoAnterior), [gastosAñoAnterior]);
  const comparacionAnual = useMemo(
    () => compararConMesAnterior(total, totalAñoAnterior),
    [total, totalAñoAnterior]
  );
  const porPersona = useMemo(() => totalPorResponsable(gastos), [gastos]);
  const porCategoria = useMemo(() => totalPorCategoria(gastos), [gastos]);
  const categoriasConPresupuesto = useMemo(
    () => categorias.filter((c) => c.presupuesto != null),
    [categorias]
  );
  const porCategoriaPromedio = useMemo(() => {
    const totales = totalPorCategoria(gastosPromedio);
    const promedio: Record<string, number> = {};
    for (const [categoriaId, totalCategoria] of Object.entries(totales)) {
      promedio[categoriaId] = totalCategoria / 3;
    }
    return promedio;
  }, [gastosPromedio]);
  const insight = useMemo(
    () => generarInsightGastos(porCategoria, porCategoriaPromedio, categorias),
    [porCategoria, porCategoriaPromedio, categorias]
  );

  return (
    <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-6 pb-10">
      <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-bg-elevated p-4 shadow-card">
        <SelectorMes mes={mes} onCambiar={setMes} />
        <p className="font-display text-3xl font-semibold text-fg">{formatearMonto(total)}</p>
        <ComparacionMesBadge comparacion={comparacion} />
        {totalAñoAnterior > 0 && (
          <ComparacionMesBadge
            comparacion={comparacionAnual}
            etiqueta={formatearMes(mesAñoAnterior)}
          />
        )}
      </div>

      {insight && (
        <div className="flex items-start gap-2.5 rounded-xl border border-primary/30 bg-primary-soft p-4">
          <Sparkles size={18} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm text-fg">{insight}</p>
        </div>
      )}

      {cargandoGastos ? (
        <div className="h-32 animate-pulse rounded-xl bg-bg-elevated" />
      ) : (
        <TotalPorPersonaCard
          miembros={miembros}
          usuarios={usuarios}
          uidActual={uidActual}
          totales={porPersona}
        />
      )}

      <section className="flex flex-col gap-2 rounded-xl border border-border bg-bg-elevated p-4 shadow-card">
        <h2 className="text-sm font-semibold text-fg-muted">Por categoría</h2>
        <GraficoTortaCategorias totalesPorCategoria={porCategoria} categorias={categorias} />
      </section>

      {categoriasConPresupuesto.length > 0 && (
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-bg-elevated p-4 shadow-card">
          <h2 className="text-sm font-semibold text-fg-muted">Presupuestos</h2>
          {categoriasConPresupuesto.map((categoria) => (
            <PresupuestoBarra
              key={categoria.id}
              categoria={categoria}
              gastado={porCategoria[categoria.id] ?? 0}
            />
          ))}
        </section>
      )}

      <section className="flex flex-col gap-2 rounded-xl border border-border bg-bg-elevated p-4 shadow-card">
        <h2 className="text-sm font-semibold text-fg-muted">Evolución mensual</h2>
        {cargandoEvolucion ? (
          <div className="h-48 animate-pulse rounded-xl bg-bg" />
        ) : (
          <GraficoEvolucionMensual puntos={evolucion} />
        )}
      </section>

      <ExportarCsvButton
        gastos={gastos}
        categorias={categorias}
        usuarios={usuarios}
        uidActual={uidActual}
        mes={mes}
      />

      <Link
        href="/privado"
        className="flex min-h-14 items-center gap-3 rounded-xl border border-blush/30 bg-blush-soft px-4 py-3"
      >
        <Lock size={18} className="text-blush" aria-hidden="true" />
        <span className="flex-1 text-sm font-medium text-fg">Mis finanzas privadas</span>
        <ChevronRight size={18} className="text-fg-muted" aria-hidden="true" />
      </Link>

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-fg-muted">Historial de compras</h2>
          <Link
            href="/listas/historial"
            className="flex items-center gap-0.5 text-xs font-medium text-primary"
          >
            Ver todo <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </div>
        {cargandoCompras ? (
          <div className="flex flex-col gap-2" aria-hidden="true">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-bg-elevated" />
            ))}
          </div>
        ) : compras.length === 0 ? (
          <EstadoVacio variante="compras" mensaje="Todavía no cerraste ninguna compra." />
        ) : (
          <div className="flex flex-col gap-2">
            {compras.slice(0, 3).map((compra) => (
              <CompraCerradaCard key={compra.id} compra={compra} onAbrir={setCompraSeleccionada} />
            ))}
          </div>
        )}
      </section>

      <CompraCerradaDetalleSheet compra={compraSeleccionada} onCerrar={() => setCompraSeleccionada(null)} />
    </main>
  );
}
