"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, Calendar, ShoppingBasket, Wallet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTareas } from "@/hooks/useTareas";
import { useGastosDelMes } from "@/hooks/useGastosDelMes";
import { useListas } from "@/hooks/useListas";
import { estaVencida, ordenarTareas } from "@/lib/utils/ordenarTareas";
import { inicioDeMes, inicioDeMesSiguiente } from "@/lib/utils/fechas";
import { formatearMonto } from "@/lib/utils/moneda";
import { useContadorAnimado } from "@/hooks/useContadorAnimado";
import { Mascota } from "@/components/ui/Mascota";
import { cn } from "@/lib/utils/cn";

export default function InicioPage() {
  const { usuario, household } = useAuth();
  const householdId = household?.id;

  const { tareas } = useTareas(householdId);
  const { listas } = useListas(householdId);

  const ahora = useMemo(() => new Date(), []);
  const inicioActual = useMemo(() => inicioDeMes(ahora), [ahora]);
  const finActual = useMemo(() => inicioDeMesSiguiente(ahora), [ahora]);
  const mesAnterior = useMemo(() => new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1), [ahora]);
  const inicioAnterior = useMemo(() => inicioDeMes(mesAnterior), [mesAnterior]);
  const finAnterior = useMemo(() => inicioDeMesSiguiente(mesAnterior), [mesAnterior]);

  const { gastos: gastosActuales } = useGastosDelMes(householdId, inicioActual, finActual);
  const { gastos: gastosAnteriores } = useGastosDelMes(householdId, inicioAnterior, finAnterior);

  const totalActual = useMemo(
    () => gastosActuales.reduce((acc, g) => acc + g.monto, 0),
    [gastosActuales]
  );
  const totalAnterior = useMemo(
    () => gastosAnteriores.reduce((acc, g) => acc + g.monto, 0),
    [gastosAnteriores]
  );
  const variacion =
    totalAnterior > 0 ? Math.round(((totalActual - totalAnterior) / totalAnterior) * 100) : null;
  const totalActualAnimado = useContadorAnimado(totalActual);

  const tareasPendientes = useMemo(
    () => ordenarTareas(tareas).filter((t) => !t.completada),
    [tareas]
  );
  const tareasVencidas = tareasPendientes.filter(estaVencida);
  const tareasAMostrar = tareasPendientes.slice(0, 3);

  const listasAMostrar = listas.slice(0, 3);

  const primerNombre = usuario?.nombre?.split(" ")[0] ?? "";

  return (
    <main className="mx-auto flex max-w-md flex-col gap-5 px-4 py-6 pb-24">
      <div className="flex items-center gap-3">
        <Mascota size={44} pose="saludando" animacion="saludar" />
        <div>
          <p className="text-lg font-semibold text-fg">Hola{primerNombre ? `, ${primerNombre}` : ""}</p>
          <p className="text-sm text-fg-muted">
            {new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(
              ahora
            )}
          </p>
        </div>
      </div>

      <Link
        href="/tareas"
        className="flex flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-4 shadow-card transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-fg-muted">
            <Calendar size={16} aria-hidden="true" /> Tareas
          </span>
          <ArrowRight size={16} className="text-fg-muted" aria-hidden="true" />
        </div>
        {tareasPendientes.length === 0 ? (
          <p className="text-sm text-fg-muted">No tenés tareas pendientes. ✨</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {tareasVencidas.length > 0 && (
              <p className="text-sm font-medium text-danger">
                {tareasVencidas.length === 1
                  ? "1 tarea vencida"
                  : `${tareasVencidas.length} tareas vencidas`}
              </p>
            )}
            {tareasAMostrar.map((tarea) => (
              <p key={tarea.id} className="truncate text-sm text-fg">
                <span
                  className={cn(
                    "mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle",
                    estaVencida(tarea) ? "bg-danger" : "bg-primary"
                  )}
                  aria-hidden="true"
                />
                {tarea.titulo}
              </p>
            ))}
            {tareasPendientes.length > 3 && (
              <p className="text-xs text-fg-muted">y {tareasPendientes.length - 3} más…</p>
            )}
          </div>
        )}
      </Link>

      <Link
        href="/gastos"
        className="flex flex-col gap-2 rounded-xl border border-border bg-bg-elevated p-4 shadow-card transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-fg-muted">
            <Wallet size={16} aria-hidden="true" /> Gasto de este mes
          </span>
          <ArrowRight size={16} className="text-fg-muted" aria-hidden="true" />
        </div>
        <div className="flex items-baseline gap-2">
          <p className="font-display text-2xl font-semibold text-fg">
            {formatearMonto(totalActualAnimado)}
          </p>
          {variacion !== null && variacion !== 0 && (
            <span
              className={cn(
                "flex items-center gap-0.5 text-xs font-medium",
                variacion > 0 ? "text-danger" : "text-primary"
              )}
            >
              {variacion > 0 ? (
                <ArrowUp size={12} aria-hidden="true" />
              ) : (
                <ArrowDown size={12} aria-hidden="true" />
              )}
              {Math.abs(variacion)}% vs. mes pasado
            </span>
          )}
        </div>
      </Link>

      <Link
        href="/listas"
        className="flex flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-4 shadow-card transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-fg-muted">
            <ShoppingBasket size={16} aria-hidden="true" /> Listas activas
          </span>
          <ArrowRight size={16} className="text-fg-muted" aria-hidden="true" />
        </div>
        {listasAMostrar.length === 0 ? (
          <p className="text-sm text-fg-muted">Todavía no creaste ninguna lista.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {listasAMostrar.map((lista) => (
              <p key={lista.id} className="truncate text-sm text-fg">
                {lista.nombre}
              </p>
            ))}
          </div>
        )}
      </Link>
    </main>
  );
}
