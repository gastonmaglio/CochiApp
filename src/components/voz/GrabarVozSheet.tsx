"use client";

import { useState } from "react";
import type { User } from "firebase/auth";
import { Mic, Square, X } from "lucide-react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useGrabadora } from "@/hooks/useGrabadora";
import {
  procesarAudioVoz,
  ErrorVoz,
  type ContenidoExtraidoPorVoz,
} from "@/lib/services/voz.service";
import { CategoriaSelector } from "@/components/listas/CategoriaSelector";
import { cn } from "@/lib/utils/cn";
import { formatearMonto } from "@/lib/utils/moneda";
import type { Categoria } from "@/types/household";

interface ItemRevision {
  nombre: string;
  cantidad: string | null;
  categoriaId: string;
}

interface GastoRevision {
  descripcion: string;
  monto: string;
  categoriaId: string;
}

interface TareaRevision {
  titulo: string;
  fechaVencimiento: string;
}

interface GrabarVozSheetProps {
  abierto: boolean;
  user: User;
  householdId: string;
  categoriasCompras: Categoria[];
  categoriasGastos: Categoria[];
  // "crear" (default): una lista dictada arma una lista NUEVA con nombre propio — para
  // usar desde la pantalla de Listas. "agregar": los items se suman a una lista que ya
  // está abierta (nombreListaActual se usa solo para el texto) — para usar desde adentro
  // del detalle de una lista puntual.
  modoLista?: "crear" | "agregar";
  nombreListaActual?: string;
  onCerrar: () => void;
  onConfirmarLista: (
    nombreLista: string | null,
    items: { nombre: string; cantidad: string | null; categoriaId: string }[]
  ) => void;
  onConfirmarGasto: (gasto: { descripcion: string; monto: number; categoriaId: string }) => void;
  onConfirmarTarea: (tarea: { titulo: string; fechaVencimiento: Date | null }) => void;
}

function normalizarParaComparar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function emparejarCategoria(nombreSugerido: string, categorias: Categoria[]): string {
  const buscado = normalizarParaComparar(nombreSugerido);
  const encontrada = categorias.find((c) => normalizarParaComparar(c.nombre) === buscado);
  if (encontrada) return encontrada.id;
  const otros = categorias.find((c) => normalizarParaComparar(c.nombre) === "otros");
  return otros?.id ?? categorias[0]?.id ?? "";
}

export function GrabarVozSheet({
  abierto,
  user,
  householdId,
  categoriasCompras,
  categoriasGastos,
  modoLista = "crear",
  nombreListaActual,
  onCerrar,
  onConfirmarLista,
  onConfirmarGasto,
  onConfirmarTarea,
}: GrabarVozSheetProps) {
  const grabadora = useGrabadora();
  const [nombreLista, setNombreLista] = useState<string | null>(null);
  const [itemsRevision, setItemsRevision] = useState<ItemRevision[] | null>(null);
  const [gastoRevision, setGastoRevision] = useState<GastoRevision | null>(null);
  const [tareaRevision, setTareaRevision] = useState<TareaRevision | null>(null);
  const [errorProceso, setErrorProceso] = useState<string | null>(null);

  function cerrarTodo() {
    grabadora.cancelar();
    grabadora.reiniciar();
    setNombreLista(null);
    setItemsRevision(null);
    setGastoRevision(null);
    setTareaRevision(null);
    setErrorProceso(null);
    onCerrar();
  }

  function procesarResultado(resultado: ContenidoExtraidoPorVoz) {
    if (resultado.tipo === "gasto") {
      setGastoRevision({
        descripcion: resultado.gasto.descripcion,
        monto: String(resultado.gasto.monto),
        categoriaId: emparejarCategoria(resultado.gasto.categoria, categoriasGastos),
      });
      return;
    }
    if (resultado.tipo === "tarea") {
      setTareaRevision({
        titulo: resultado.tarea.titulo,
        fechaVencimiento: resultado.tarea.fechaVencimiento ?? "",
      });
      return;
    }
    if (resultado.items.length === 0) {
      setErrorProceso(
        "No se detectó ningún producto en el audio. Probá de nuevo, nombrando los items uno por uno."
      );
      return;
    }
    setNombreLista(resultado.nombreLista);
    setItemsRevision(
      resultado.items.map((item) => ({
        ...item,
        categoriaId: emparejarCategoria(item.categoria, categoriasCompras),
      }))
    );
  }

  async function manejarDetener() {
    const blob = await grabadora.detener();
    if (!blob) return;
    setErrorProceso(null);
    try {
      const resultado = await procesarAudioVoz(
        user,
        householdId,
        categoriasCompras.map((c) => c.nombre),
        categoriasGastos.map((c) => c.nombre),
        blob
      );
      procesarResultado(resultado);
    } catch (err) {
      setErrorProceso(err instanceof ErrorVoz ? err.message : "No se pudo procesar el audio.");
    } finally {
      grabadora.reiniciar();
    }
  }

  function quitarItem(indice: number) {
    setItemsRevision((actual) => actual?.filter((_, i) => i !== indice) ?? null);
  }

  function cambiarCategoriaItem(indice: number, categoriaId: string) {
    setItemsRevision((actual) =>
      actual ? actual.map((item, i) => (i === indice ? { ...item, categoriaId } : item)) : null
    );
  }

  function confirmarLista() {
    if (!itemsRevision || itemsRevision.length === 0) return;
    if (modoLista === "crear" && !nombreLista) return;
    onConfirmarLista(
      modoLista === "crear" ? nombreLista : null,
      itemsRevision.map(({ nombre, cantidad, categoriaId }) => ({ nombre, cantidad, categoriaId }))
    );
    cerrarTodo();
  }

  function confirmarGasto() {
    if (!gastoRevision) return;
    const monto = Number(gastoRevision.monto.replace(",", "."));
    if (!gastoRevision.descripcion.trim() || Number.isNaN(monto) || monto <= 0) {
      setErrorProceso("Revisá la descripción y el monto antes de cargarlo.");
      return;
    }
    onConfirmarGasto({
      descripcion: gastoRevision.descripcion.trim(),
      monto,
      categoriaId: gastoRevision.categoriaId,
    });
    cerrarTodo();
  }

  function confirmarTarea() {
    if (!tareaRevision) return;
    if (!tareaRevision.titulo.trim()) {
      setErrorProceso("Ponele un título a la tarea antes de crearla.");
      return;
    }
    onConfirmarTarea({
      titulo: tareaRevision.titulo.trim(),
      fechaVencimiento: tareaRevision.fechaVencimiento
        ? new Date(`${tareaRevision.fechaVencimiento}T12:00:00`)
        : null,
    });
    cerrarTodo();
  }

  const enRevision = Boolean(itemsRevision || gastoRevision || tareaRevision);

  return (
    <Sheet abierto={abierto} onCerrar={cerrarTodo} titulo="Usar el micrófono">
      {tareaRevision ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-fg-muted">Entendí que querés crear una tarea. Revisala antes de confirmar:</p>
          <Input
            label="Título"
            value={tareaRevision.titulo}
            onChange={(e) => setTareaRevision({ ...tareaRevision, titulo: e.target.value })}
            maxLength={100}
          />
          <Input
            label="Fecha de vencimiento (opcional)"
            type="date"
            value={tareaRevision.fechaVencimiento}
            onChange={(e) => setTareaRevision({ ...tareaRevision, fechaVencimiento: e.target.value })}
          />
          {errorProceso && (
            <p role="alert" className="text-sm text-danger">
              {errorProceso}
            </p>
          )}
          <Button type="button" fullWidth onClick={confirmarTarea}>
            Crear tarea
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={cerrarTodo}>
            Cancelar
          </Button>
        </div>
      ) : gastoRevision ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-fg-muted">Entendí esto — revisalo y corregí lo que haga falta:</p>
          <div className="flex flex-col items-center gap-1 rounded-xl border border-primary/30 bg-primary-soft px-4 py-4 text-center">
            <span className="text-xs font-medium uppercase tracking-wide text-fg-muted">Gasto</span>
            <span className="text-lg font-semibold text-fg">
              {gastoRevision.descripcion.trim() || "(sin descripción)"}
            </span>
            <span className="text-2xl font-bold text-primary">
              {formatearMonto(Number(gastoRevision.monto.replace(",", ".")) || 0)}
            </span>
          </div>
          <Input
            label="Descripción"
            value={gastoRevision.descripcion}
            onChange={(e) => setGastoRevision({ ...gastoRevision, descripcion: e.target.value })}
            maxLength={120}
          />
          <Input
            label="Monto"
            type="number"
            inputMode="decimal"
            value={gastoRevision.monto}
            onChange={(e) => setGastoRevision({ ...gastoRevision, monto: e.target.value })}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-fg-muted">Categoría</p>
            <CategoriaSelector
              categorias={categoriasGastos}
              valor={gastoRevision.categoriaId}
              onCambiar={(id) => setGastoRevision({ ...gastoRevision, categoriaId: id })}
            />
          </div>
          {errorProceso && (
            <p role="alert" className="text-sm text-danger">
              {errorProceso}
            </p>
          )}
          <Button type="button" fullWidth onClick={confirmarGasto}>
            Cargar gasto
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={cerrarTodo}>
            Cancelar
          </Button>
        </div>
      ) : itemsRevision ? (
        <div className="flex flex-col gap-3">
          {modoLista === "crear" ? (
            <Input
              label="Nombre de la lista"
              value={nombreLista ?? ""}
              onChange={(e) => setNombreLista(e.target.value)}
              maxLength={40}
            />
          ) : (
            <p className="text-sm text-fg-muted">
              Se van a agregar a <span className="font-medium text-fg">&ldquo;{nombreListaActual}&rdquo;</span>:
            </p>
          )}
          <p className="text-sm text-fg-muted">Revisá los items — tocá una categoría para cambiarla.</p>
          <ul className="flex max-h-[40vh] flex-col gap-3 overflow-y-auto">
            {itemsRevision.map((item, indice) => (
              <li key={indice} className="flex flex-col gap-2 rounded-xl border border-border bg-bg p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-fg">
                    {item.nombre}
                    {item.cantidad && <span className="text-fg-muted"> · {item.cantidad}</span>}
                  </span>
                  <button
                    type="button"
                    onClick={() => quitarItem(indice)}
                    aria-label={`Quitar ${item.nombre}`}
                    className="flex h-7 w-7 shrink-0 items-center justify-center text-fg-muted"
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
                <CategoriaSelector
                  categorias={categoriasCompras}
                  valor={item.categoriaId}
                  onCambiar={(id) => cambiarCategoriaItem(indice, id)}
                />
              </li>
            ))}
          </ul>
          <Button type="button" fullWidth onClick={confirmarLista} disabled={itemsRevision.length === 0}>
            {modoLista === "crear" ? "Crear lista con" : "Agregar"} {itemsRevision.length}{" "}
            {itemsRevision.length === 1 ? "item" : "items"}
          </Button>
          <Button type="button" variant="ghost" fullWidth onClick={cerrarTodo}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 py-4">
          {grabadora.estado === "procesando" ? (
            <>
              <div className="h-16 w-16 animate-pulse rounded-full bg-primary-soft" aria-hidden="true" />
              <p className="text-sm text-fg-muted">Escuchando y entendiendo lo que dijiste…</p>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={grabadora.estado === "grabando" ? manejarDetener : grabadora.iniciar}
                aria-label={grabadora.estado === "grabando" ? "Terminar grabación" : "Empezar a grabar"}
                className={cn(
                  "flex h-20 w-20 items-center justify-center rounded-full transition-colors",
                  grabadora.estado === "grabando"
                    ? "animate-pulse bg-danger text-danger-fg"
                    : "bg-primary text-primary-fg"
                )}
              >
                {grabadora.estado === "grabando" ? (
                  <Square size={28} aria-hidden="true" />
                ) : (
                  <Mic size={28} aria-hidden="true" />
                )}
              </button>
              <p className="text-center text-sm text-fg-muted">
                {grabadora.estado === "grabando"
                  ? `Grabando… ${grabadora.segundos}s (tocá para terminar)`
                  : 'Decí una lista de compras, "anotá gasto, luz, 35 mil pesos", o "recordame sacar la basura el jueves".'}
              </p>
              {(grabadora.error || errorProceso) && !enRevision && (
                <p role="alert" className="text-center text-sm text-danger">
                  {grabadora.error ?? errorProceso}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}
