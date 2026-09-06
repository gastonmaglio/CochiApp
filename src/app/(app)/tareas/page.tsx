"use client";

import { useMemo, useState } from "react";
import { Mic, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTareas } from "@/hooks/useTareas";
import { useMiembrosHousehold } from "@/hooks/useMiembrosHousehold";
import { useCategorias } from "@/hooks/useCategorias";
import { useAccionesVoz } from "@/hooks/useAccionesVoz";
import { useToast } from "@/contexts/ToastContext";
import {
  actualizarSubtareas,
  alternarCompletada,
  crearTarea,
  editarTarea,
  eliminarTarea,
  restaurarTarea,
  type DatosTarea,
} from "@/lib/services/tareas.service";
import { ordenarTareas } from "@/lib/utils/ordenarTareas";
import { mensajeErrorFirebase } from "@/lib/utils/errores";
import { TareaRow } from "@/components/tareas/TareaRow";
import { TareaFormSheet } from "@/components/tareas/TareaFormSheet";
import { GrabarVozSheet } from "@/components/voz/GrabarVozSheet";
import { Button } from "@/components/ui/Button";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { Subtarea, Tarea } from "@/types/tarea";

export default function TareasPage() {
  const { user, household } = useAuth();
  const householdId = household?.id;
  const uidActual = user?.uid ?? "";
  const miembros = household?.miembros ?? [];
  const usuarios = useMiembrosHousehold(miembros);
  const { tareas, cargando } = useTareas(householdId);
  const { categorias: categoriasCompras } = useCategorias(householdId, "categoriasCompras");
  const { categorias: categoriasGastos } = useCategorias(householdId, "categoriasGastos");
  const acciones = useAccionesVoz(householdId, user);
  const { mostrarToast } = useToast();

  const [sheetAbierto, setSheetAbierto] = useState(false);
  const [tareaEditando, setTareaEditando] = useState<Tarea | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [sheetVozAbierto, setSheetVozAbierto] = useState(false);

  const tareasOrdenadas = useMemo(() => ordenarTareas(tareas), [tareas]);

  function abrirNueva() {
    setTareaEditando(null);
    setSheetAbierto(true);
  }

  function abrirEditar(tarea: Tarea) {
    setTareaEditando(tarea);
    setSheetAbierto(true);
  }

  function cerrarSheet() {
    setSheetAbierto(false);
    setTareaEditando(null);
  }

  async function manejarGuardar(datos: DatosTarea) {
    if (!householdId || !user) return;
    setGuardando(true);
    try {
      if (tareaEditando) {
        await editarTarea(householdId, tareaEditando.id, datos);
      } else {
        await crearTarea(householdId, user.uid, datos);
      }
      cerrarSheet();
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    } finally {
      setGuardando(false);
    }
  }

  async function manejarBorrar(tarea: Tarea) {
    if (!householdId) return;
    const { id, ...datosTarea } = tarea;
    try {
      await eliminarTarea(householdId, id);
      cerrarSheet();
      mostrarToast(`"${tarea.titulo}" eliminada`, {
        accionLabel: "Deshacer",
        onAccion: () => {
          restaurarTarea(householdId, id, datosTarea).catch((err: unknown) => {
            mostrarToast(mensajeErrorFirebase(err));
          });
        },
      });
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  async function manejarToggle(tarea: Tarea) {
    if (!householdId || !user) return;
    try {
      await alternarCompletada(householdId, tarea, user.uid, !tarea.completada);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  async function manejarCambiarSubtareas(tarea: Tarea, subtareas: Subtarea[]) {
    if (!householdId) return;
    try {
      await actualizarSubtareas(householdId, tarea.id, subtareas);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-semibold text-fg">Tareas</h1>
        <Button onClick={abrirNueva}>
          <Plus size={16} aria-hidden="true" /> Nueva
        </Button>
      </div>

      <button
        type="button"
        onClick={() => setSheetVozAbierto(true)}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 text-sm font-medium text-primary active:bg-primary-soft"
      >
        <Mic size={18} aria-hidden="true" /> Crear tarea por voz
      </button>

      {cargando ? (
        <div className="flex flex-col gap-2" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-bg-elevated" />
          ))}
        </div>
      ) : tareasOrdenadas.length === 0 ? (
        <EstadoVacio
          variante="tareas"
          mensaje="Todavía no hay tareas del hogar. Agregá la primera — arreglar algo, comprar algo puntual, lo que sea."
        >
          <Button onClick={abrirNueva}>Crear la primera tarea</Button>
        </EstadoVacio>
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {tareasOrdenadas.map((tarea) => (
            <TareaRow
              key={tarea.id}
              tarea={tarea}
              uidActual={uidActual}
              usuarios={usuarios}
              onToggleCompletada={manejarToggle}
              onEditar={abrirEditar}
              onBorrar={manejarBorrar}
              onCambiarSubtareas={manejarCambiarSubtareas}
            />
          ))}
        </ul>
      )}

      <TareaFormSheet
        abierto={sheetAbierto}
        tarea={tareaEditando}
        miembros={miembros}
        usuarios={usuarios}
        uidActual={uidActual}
        cargando={guardando}
        onCerrar={cerrarSheet}
        onGuardar={manejarGuardar}
        onBorrar={tareaEditando ? () => manejarBorrar(tareaEditando) : undefined}
      />

      {user && householdId && (
        <GrabarVozSheet
          abierto={sheetVozAbierto}
          user={user}
          householdId={householdId}
          categoriasCompras={categoriasCompras}
          categoriasGastos={categoriasGastos}
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
