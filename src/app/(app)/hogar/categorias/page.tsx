"use client";

import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CornerDownRight, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCategorias } from "@/hooks/useCategorias";
import { useToast } from "@/contexts/ToastContext";
import {
  crearCategoria,
  editarCategoria,
  eliminarCategoria,
  type TipoCategoria,
} from "@/lib/services/categorias.service";
import { mensajeErrorFirebase } from "@/lib/utils/errores";
import { formatearMonto } from "@/lib/utils/moneda";
import { ordenarCategorias } from "@/lib/utils/ordenarCategorias";
import { CategoriaFormSheet } from "@/components/categorias/CategoriaFormSheet";
import { cn } from "@/lib/utils/cn";
import type { Categoria } from "@/types/household";

const TABS: { valor: TipoCategoria; label: string }[] = [
  { valor: "categoriasCompras", label: "Compras" },
  { valor: "categoriasGastos", label: "Gastos" },
];

export default function CategoriasPage() {
  const router = useRouter();
  const { user, household } = useAuth();
  const householdId = household?.id;
  const { mostrarToast } = useToast();

  const [tab, setTab] = useState<TipoCategoria>("categoriasCompras");
  const { categorias, cargando } = useCategorias(householdId, tab);

  const [sheetAbierto, setSheetAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState<Categoria | null>(null);
  const [guardando, setGuardando] = useState(false);

  const categoriasOrdenadas = useMemo(() => ordenarCategorias(categorias), [categorias]);
  const categoriasPadreDisponibles = useMemo(
    () =>
      categorias.filter((c) => !c.categoriaPadreId && c.id !== categoriaEditando?.id),
    [categorias, categoriaEditando]
  );

  function abrirNueva() {
    setCategoriaEditando(null);
    setSheetAbierto(true);
  }

  function abrirEditar(categoria: Categoria) {
    setCategoriaEditando(categoria);
    setSheetAbierto(true);
  }

  function cerrarSheet() {
    setSheetAbierto(false);
    setCategoriaEditando(null);
  }

  async function manejarGuardar(datos: {
    nombre: string;
    icono: string;
    color: string;
    presupuesto: number | null;
    categoriaPadreId: string | null;
  }) {
    if (!householdId || !user) return;
    setGuardando(true);
    try {
      if (categoriaEditando) {
        await editarCategoria(householdId, tab, categoriaEditando.id, datos);
      } else {
        await crearCategoria(
          householdId,
          tab,
          user.uid,
          datos.nombre,
          datos.icono,
          datos.color,
          categorias.length,
          datos.presupuesto,
          datos.categoriaPadreId
        );
      }
      cerrarSheet();
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    } finally {
      setGuardando(false);
    }
  }

  async function manejarBorrar() {
    if (!householdId || !categoriaEditando) return;
    try {
      await eliminarCategoria(householdId, tab, categoriaEditando.id);
      cerrarSheet();
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  async function manejarBorrarDirecto(categoria: Categoria) {
    if (!householdId) return;
    try {
      await eliminarCategoria(householdId, tab, categoria.id);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex items-center gap-2 border-b border-border bg-bg-elevated px-3 py-3">
        <button
          type="button"
          onClick={() => router.push("/hogar")}
          aria-label="Volver"
          className="flex min-h-11 min-w-11 items-center justify-center text-fg"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="font-display text-lg font-semibold text-fg">Categorías</h1>
      </header>

      <div className="flex flex-col gap-4 px-4 py-5">
        <div className="flex rounded-xl border border-border bg-bg-elevated p-1">
          {TABS.map((t) => (
            <button
              key={t.valor}
              type="button"
              onClick={() => setTab(t.valor)}
              className={cn(
                "min-h-10 flex-1 rounded-lg text-sm font-medium transition-colors",
                tab === t.valor ? "bg-primary text-primary-fg" : "text-fg-muted"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {cargando ? (
          <div className="flex flex-col gap-2" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-bg-elevated" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-bg-elevated shadow-card">
            {categoriasOrdenadas.map((categoria) => (
              <button
                key={categoria.id}
                type="button"
                onClick={() => abrirEditar(categoria)}
                className={cn(
                  "flex min-h-14 items-center gap-3 px-4 py-2 text-left",
                  categoria.categoriaPadreId && "pl-8"
                )}
              >
                {categoria.categoriaPadreId && (
                  <CornerDownRight size={14} className="shrink-0 text-fg-muted" aria-hidden="true" />
                )}
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg"
                  style={{ backgroundColor: `${categoria.color}33` }}
                  aria-hidden="true"
                >
                  {categoria.icono}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                  {categoria.nombre}
                  {categoria.presupuesto != null && (
                    <span className="ml-1.5 text-xs font-normal text-fg-muted">
                      · {formatearMonto(categoria.presupuesto)}/mes
                    </span>
                  )}
                </span>
                {categoria.predefinida ? (
                  <span className="shrink-0 text-xs text-fg-muted">De fábrica</span>
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      void manejarBorrarDirecto(categoria);
                    }}
                    onKeyDown={(e: KeyboardEvent) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        void manejarBorrarDirecto(categoria);
                      }
                    }}
                    aria-label={`Borrar categoría ${categoria.nombre}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fg-muted active:bg-danger/10 active:text-danger"
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={abrirNueva}
          className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border text-sm font-medium text-fg-muted active:bg-primary-soft"
        >
          <Plus size={18} aria-hidden="true" /> Nueva categoría
        </button>
      </div>

      <CategoriaFormSheet
        abierto={sheetAbierto}
        categoria={categoriaEditando}
        conPresupuesto={tab === "categoriasGastos"}
        categoriasPadreDisponibles={categoriasPadreDisponibles}
        cargando={guardando}
        onCerrar={cerrarSheet}
        onGuardar={manejarGuardar}
        onBorrar={categoriaEditando && !categoriaEditando.predefinida ? manejarBorrar : undefined}
      />
    </main>
  );
}
