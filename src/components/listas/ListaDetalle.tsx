"use client";

import { useMemo, useState } from "react";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { ArrowLeft, Maximize2, Minimize2, Search, Share2, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLista } from "@/hooks/useLista";
import { useItems } from "@/hooks/useItems";
import { useCategorias } from "@/hooks/useCategorias";
import { useItemsFrecuentes } from "@/hooks/useItemsFrecuentes";
import { useToast } from "@/contexts/ToastContext";
import {
  agregarItem,
  desmarcarComprado,
  editarItem,
  eliminarItem,
  marcarComprado,
  restaurarItem,
  type DatosItem,
} from "@/lib/services/items.service";
import { renombrarLista } from "@/lib/services/listas.service";
import { obtenerCategoriaHistorica } from "@/lib/services/itemsFrecuentes.service";
import { cerrarLista, type ModoCierre } from "@/lib/services/comprasCerradas.service";
import { crearGasto } from "@/lib/services/gastos.service";
import { crearTarea } from "@/lib/services/tareas.service";
import { agruparItemsPorCategoria } from "@/lib/utils/agruparItems";
import { cn } from "@/lib/utils/cn";
import { formatearMonto } from "@/lib/utils/moneda";
import { mensajeErrorFirebase } from "@/lib/utils/errores";
import { AgregarItemBar } from "@/components/listas/AgregarItemBar";
import { GrabarVozSheet } from "@/components/voz/GrabarVozSheet";
import { ItemRow } from "@/components/listas/ItemRow";
import { ItemsFrecuentesRow } from "@/components/listas/ItemsFrecuentesRow";
import { EditarItemSheet } from "@/components/listas/EditarItemSheet";
import { MontoGastadoSheet } from "@/components/listas/MontoGastadoSheet";
import { CerrarCompraSheet } from "@/components/listas/CerrarCompraSheet";
import { ListaFormSheet } from "@/components/listas/ListaFormSheet";
import { PantallaCargando } from "@/components/ui/PantallaCargando";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { Item } from "@/types/item";
import type { EstadisticaItem } from "@/types/estadisticaItem";

interface ListaDetalleProps {
  listaId: string;
}

export function ListaDetalle({ listaId }: ListaDetalleProps) {
  const router = useRouter();
  const { user, household } = useAuth();
  const householdId = household?.id;

  const { lista, cargando: cargandoLista } = useLista(householdId, listaId);
  const { items, cargando: cargandoItems } = useItems(householdId, listaId);
  const { categorias: categoriasCompras, cargando: cargandoCategorias } = useCategorias(
    householdId,
    "categoriasCompras"
  );
  const { categorias: categoriasGasto } = useCategorias(householdId, "categoriasGastos");
  const itemsFrecuentes = useItemsFrecuentes(householdId);
  const { mostrarToast } = useToast();

  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
  const [itemEditando, setItemEditando] = useState<Item | null>(null);
  const [itemParaMonto, setItemParaMonto] = useState<Item | null>(null);
  const [sheetCerrarAbierto, setSheetCerrarAbierto] = useState(false);
  const [sheetRenombrarAbierto, setSheetRenombrarAbierto] = useState(false);
  const [agregando, setAgregando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [modoSuper, setModoSuper] = useState(false);
  const [sheetVozAbierto, setSheetVozAbierto] = useState(false);

  const categoriaActiva = categoriaSeleccionada ?? categoriasCompras[0]?.id ?? null;

  const grupos = useMemo(
    () => agruparItemsPorCategoria(items, categoriasCompras),
    [items, categoriasCompras]
  );

  const busquedaNormalizada = busqueda.trim().toLowerCase();
  const gruposFiltrados = useMemo(() => {
    if (!busquedaNormalizada) return grupos;
    return grupos
      .map((grupo) => ({
        ...grupo,
        items: grupo.items.filter((item) => item.nombre.toLowerCase().includes(busquedaNormalizada)),
      }))
      .filter((grupo) => grupo.items.length > 0);
  }, [grupos, busquedaNormalizada]);

  const totalGastado = useMemo(
    () =>
      items.reduce(
        (acumulado, item) => acumulado + (item.comprado ? (item.montoGastado ?? 0) : 0),
        0
      ),
    [items]
  );

  const nombresEnLista = useMemo(
    () => new Set(items.map((item) => item.nombre.toLowerCase())),
    [items]
  );

  async function manejarAgregar(nombre: string) {
    if (!user || !householdId || !categoriaActiva) return;
    setAgregando(true);
    try {
      await agregarItem(
        householdId,
        listaId,
        user.uid,
        { nombre, cantidad: null, categoriaId: categoriaActiva, notas: null },
        Date.now()
      );
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    } finally {
      setAgregando(false);
    }
  }

  async function manejarConfirmarListaVoz(
    _nombreLista: string | null,
    itemsVoz: { nombre: string; cantidad: string | null; categoriaId: string }[]
  ) {
    if (!user || !householdId) return;
    setAgregando(true);
    try {
      let indice = 0;
      for (const item of itemsVoz) {
        await agregarItem(
          householdId,
          listaId,
          user.uid,
          { nombre: item.nombre, cantidad: item.cantidad, categoriaId: item.categoriaId, notas: null },
          Date.now() + indice
        );
        indice += 1;
      }
      mostrarToast(`Se agregaron ${itemsVoz.length} items desde el audio`);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    } finally {
      setAgregando(false);
    }
  }

  async function manejarConfirmarGastoVoz(gastoVoz: {
    descripcion: string;
    monto: number;
    categoriaId: string;
  }) {
    if (!user || !householdId) return;
    try {
      await crearGasto(householdId, user.uid, {
        descripcion: gastoVoz.descripcion,
        monto: gastoVoz.monto,
        categoriaId: gastoVoz.categoriaId,
        fecha: Timestamp.now(),
        responsableUid: null,
      });
      mostrarToast(`Gasto "${gastoVoz.descripcion}" cargado`);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  async function manejarConfirmarTareaVoz(tareaVoz: { titulo: string; fechaVencimiento: Date | null }) {
    if (!user || !householdId) return;
    try {
      await crearTarea(householdId, user.uid, {
        titulo: tareaVoz.titulo,
        descripcion: null,
        fechaVencimiento: tareaVoz.fechaVencimiento,
        asignadaA: null,
        repetir: null,
        prioridad: null,
        subtareas: [],
      });
      mostrarToast(`Tarea "${tareaVoz.titulo}" creada`);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  async function manejarSugerirCategoria(nombre: string) {
    if (!householdId || !nombre.trim()) return;
    try {
      const categoriaId = await obtenerCategoriaHistorica(householdId, nombre);
      if (categoriaId && categoriasCompras.some((c) => c.id === categoriaId)) {
        setCategoriaSeleccionada(categoriaId);
      }
    } catch {
      // No pasa nada si falla — el usuario igual puede elegir la categoría a mano.
    }
  }

  async function manejarAgregarFrecuente(item: EstadisticaItem) {
    if (!user || !householdId) return;
    const categoriaId = item.ultimaCategoriaId ?? categoriaActiva;
    if (!categoriaId) return;
    try {
      await agregarItem(
        householdId,
        listaId,
        user.uid,
        { nombre: item.nombre, cantidad: null, categoriaId, notas: null },
        Date.now()
      );
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  async function manejarToggleComprado(item: Item) {
    if (!householdId) return;
    if (item.comprado) {
      try {
        await desmarcarComprado(householdId, listaId, item.id);
      } catch (err) {
        mostrarToast(mensajeErrorFirebase(err));
      }
      return;
    }
    setItemParaMonto(item);
  }

  async function manejarConfirmarMonto(monto: number | null) {
    if (!user || !householdId || !itemParaMonto) return;
    const item = itemParaMonto;
    setItemParaMonto(null);
    try {
      await marcarComprado(
        householdId,
        listaId,
        item.id,
        user.uid,
        item.categoriaId,
        item.nombre,
        monto
      );
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  async function manejarGuardarEdicion(datos: DatosItem) {
    if (!householdId || !itemEditando) return;
    try {
      await editarItem(householdId, listaId, itemEditando.id, datos);
      setItemEditando(null);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  async function manejarBorrar(item: Item) {
    if (!householdId) return;
    const { id, ...datosItem } = item;
    try {
      await eliminarItem(householdId, listaId, id);
      setItemEditando(null);
      mostrarToast(`"${item.nombre}" eliminado`, {
        accionLabel: "Deshacer",
        onAccion: () => {
          restaurarItem(householdId, listaId, id, datosItem).catch((err: unknown) => {
            mostrarToast(mensajeErrorFirebase(err));
          });
        },
      });
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  async function manejarCompartir() {
    if (!lista) return;
    const lineas = grupos.flatMap((grupo) => [
      `${grupo.categoria.icono} ${grupo.categoria.nombre}`,
      ...grupo.items.map((item) => `${item.comprado ? "✓" : "○"} ${item.nombre}${item.cantidad ? ` (${item.cantidad})` : ""}`),
      "",
    ]);
    const texto = `${lista.nombre}\n\n${lineas.join("\n")}`.trim();

    if (navigator.share) {
      try {
        await navigator.share({ title: lista.nombre, text: texto });
      } catch {
        // El usuario canceló el diálogo de compartir — no es un error real.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(texto);
      mostrarToast("Lista copiada al portapapeles");
    } catch {
      mostrarToast("No se pudo compartir ni copiar la lista.");
    }
  }

  async function manejarRenombrar(nombre: string) {
    if (!householdId) return;
    try {
      await renombrarLista(householdId, listaId, nombre);
      setSheetRenombrarAbierto(false);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  async function manejarCerrarCompra(modo: ModoCierre, categoriaGastoId: string | null) {
    if (!householdId || !user || !lista) return;
    setCerrando(true);
    try {
      await cerrarLista(householdId, listaId, lista.nombre, user.uid, modo, categoriaGastoId);
      setSheetCerrarAbierto(false);
      mostrarToast("Compra cerrada y guardada en el historial");
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    } finally {
      setCerrando(false);
    }
  }

  if (cargandoLista || cargandoItems || cargandoCategorias) {
    return <PantallaCargando />;
  }

  if (!lista) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-fg-muted">Esta lista no existe o ya no tenés acceso.</p>
        <button
          type="button"
          onClick={() => router.replace("/listas")}
          className="min-h-11 font-medium text-primary underline"
        >
          Volver a Listas
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-bg-elevated px-3 py-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/listas")}
            aria-label="Volver a Listas"
            className="flex min-h-11 min-w-11 items-center justify-center text-fg"
          >
            <ArrowLeft size={20} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setSheetRenombrarAbierto(true)}
            className="min-w-0 flex-1 truncate text-left text-lg font-semibold text-fg"
          >
            {lista.nombre}
          </button>
          <button
            type="button"
            onClick={() => void manejarCompartir()}
            aria-label="Compartir lista"
            className="flex min-h-11 min-w-11 items-center justify-center text-fg-muted"
          >
            <Share2 size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-1 flex items-center justify-between pl-11">
          <span className="text-sm text-fg-muted">
            Total: <span className="font-semibold text-fg">{formatearMonto(totalGastado)}</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setModoSuper((v) => !v);
                setBusqueda("");
              }}
              aria-pressed={modoSuper}
              aria-label={modoSuper ? "Salir del modo súper" : "Activar modo súper"}
              className={cn(
                "flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-medium",
                modoSuper ? "border-primary bg-primary-soft text-primary" : "border-border text-fg-muted"
              )}
            >
              {modoSuper ? (
                <Minimize2 size={14} aria-hidden="true" />
              ) : (
                <Maximize2 size={14} aria-hidden="true" />
              )}
              Modo súper
            </button>
            <button
              type="button"
              onClick={() => setSheetCerrarAbierto(true)}
              className="min-h-9 rounded-lg border border-border px-3 text-sm font-medium text-fg-muted"
            >
              Cerrar compra
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pb-28">
        {!modoSuper && (
          <ItemsFrecuentesRow
            items={itemsFrecuentes}
            nombresEnLista={nombresEnLista}
            onAgregar={manejarAgregarFrecuente}
          />
        )}

        {!modoSuper && items.length > 6 && (
          <div className="px-3 pt-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-bg-elevated px-3">
              <Search size={16} className="shrink-0 text-fg-muted" aria-hidden="true" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar en esta lista…"
                aria-label="Buscar en esta lista"
                className="min-h-10 flex-1 bg-transparent text-sm text-fg placeholder:text-fg-muted focus:outline-none"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda("")}
                  aria-label="Limpiar búsqueda"
                  className="flex h-7 w-7 shrink-0 items-center justify-center text-fg-muted"
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        )}

        {gruposFiltrados.length === 0 ? (
          <div className="px-3 pt-6">
            <EstadoVacio
              mensaje={
                busquedaNormalizada
                  ? `No encontramos nada que coincida con "${busqueda.trim()}".`
                  : "Lista vacía. Agregá el primer item con la barra de abajo."
              }
            />
          </div>
        ) : (
          gruposFiltrados.map((grupo) => (
            <section key={grupo.categoria.id} className="px-3 pt-4">
              <h2 className="mb-1 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-fg-muted">
                <span aria-hidden="true">{grupo.categoria.icono}</span>
                {grupo.categoria.nombre}
              </h2>
              <ul className="flex flex-col">
                {grupo.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggleComprado={manejarToggleComprado}
                    onEditar={setItemEditando}
                    onBorrar={manejarBorrar}
                    grande={modoSuper}
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      <AgregarItemBar
        categorias={categoriasCompras}
        categoriaSeleccionada={categoriaActiva}
        onCambiarCategoria={setCategoriaSeleccionada}
        onNombreCambiado={manejarSugerirCategoria}
        onAbrirVoz={() => setSheetVozAbierto(true)}
        onAgregar={manejarAgregar}
        cargando={agregando}
      />

      <EditarItemSheet
        item={itemEditando}
        categorias={categoriasCompras}
        onCerrar={() => setItemEditando(null)}
        onGuardar={manejarGuardarEdicion}
        onBorrar={() => itemEditando && manejarBorrar(itemEditando)}
      />

      <MontoGastadoSheet
        item={itemParaMonto}
        onCerrar={() => setItemParaMonto(null)}
        onConfirmar={manejarConfirmarMonto}
      />

      <CerrarCompraSheet
        abierto={sheetCerrarAbierto}
        totalActual={totalGastado}
        categoriasGasto={categoriasGasto}
        categoriaGastoInicial={lista.categoriaGastoId}
        cargando={cerrando}
        onCerrar={() => setSheetCerrarAbierto(false)}
        onConfirmar={manejarCerrarCompra}
      />

      <ListaFormSheet
        abierto={sheetRenombrarAbierto}
        titulo="Renombrar lista"
        labelBoton="Guardar"
        valorInicial={lista.nombre}
        cargando={false}
        onCerrar={() => setSheetRenombrarAbierto(false)}
        onGuardar={manejarRenombrar}
      />

      {user && householdId && (
        <GrabarVozSheet
          abierto={sheetVozAbierto}
          user={user}
          householdId={householdId}
          categoriasCompras={categoriasCompras}
          categoriasGastos={categoriasGasto}
          modoLista="agregar"
          nombreListaActual={lista.nombre}
          onCerrar={() => setSheetVozAbierto(false)}
          onConfirmarLista={manejarConfirmarListaVoz}
          onConfirmarGasto={manejarConfirmarGastoVoz}
          onConfirmarTarea={manejarConfirmarTareaVoz}
        />
      )}
    </div>
  );
}
