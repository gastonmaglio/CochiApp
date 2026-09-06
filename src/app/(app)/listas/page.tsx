"use client";

import { useState } from "react";
import Link from "next/link";
import { History, Mic, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useListas } from "@/hooks/useListas";
import { useCategorias } from "@/hooks/useCategorias";
import { useAccionesVoz } from "@/hooks/useAccionesVoz";
import { useToast } from "@/contexts/ToastContext";
import {
  crearLista,
  eliminarListaConItems,
  restaurarListaConItems,
} from "@/lib/services/listas.service";
import { mensajeErrorFirebase } from "@/lib/utils/errores";
import { ListaCard } from "@/components/listas/ListaCard";
import { ListaFormSheet } from "@/components/listas/ListaFormSheet";
import { GrabarVozSheet } from "@/components/voz/GrabarVozSheet";
import { Button } from "@/components/ui/Button";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { Lista } from "@/types/lista";

export default function ListasPage() {
  const { user, household } = useAuth();
  const { listas, cargando } = useListas(household?.id);
  const { categorias: categoriasCompras } = useCategorias(household?.id, "categoriasCompras");
  const { categorias: categoriasGastos } = useCategorias(household?.id, "categoriasGastos");
  const acciones = useAccionesVoz(household?.id, user);
  const { mostrarToast } = useToast();
  const [sheetAbierto, setSheetAbierto] = useState(false);
  const [sheetVozAbierto, setSheetVozAbierto] = useState(false);
  const [creando, setCreando] = useState(false);

  async function manejarCrear(nombre: string) {
    if (!user || !household) return;
    setCreando(true);
    try {
      await crearLista(household.id, user.uid, nombre);
      setSheetAbierto(false);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    } finally {
      setCreando(false);
    }
  }

  async function manejarBorrar(lista: Lista) {
    if (!household) return;
    try {
      const { lista: listaBorrada, items } = await eliminarListaConItems(household.id, lista.id);
      mostrarToast(`"${lista.nombre}" eliminada`, {
        accionLabel: "Deshacer",
        onAccion: () => {
          restaurarListaConItems(household.id, listaBorrada, items).catch((err: unknown) => {
            mostrarToast(mensajeErrorFirebase(err));
          });
        },
      });
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-fg">Listas</h1>
        <div className="flex items-center gap-1">
          <Link
            href="/listas/historial"
            aria-label="Historial de compras"
            className="flex min-h-11 min-w-11 items-center justify-center text-fg-muted"
          >
            <History size={20} aria-hidden="true" />
          </Link>
          <Button onClick={() => setSheetAbierto(true)}>
            <Plus size={16} aria-hidden="true" /> Nueva
          </Button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSheetVozAbierto(true)}
        className="flex min-h-12 items-center justify-center gap-2 rounded-xl border-2 border-dashed border-primary/40 text-sm font-medium text-primary active:bg-primary-soft"
      >
        <Mic size={18} aria-hidden="true" /> Crear lista por voz
      </button>

      {cargando ? (
        <div className="flex flex-col gap-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-bg-elevated" />
          ))}
        </div>
      ) : listas.length === 0 ? (
        <EstadoVacio mensaje="Todavía no tenés listas. Creá la primera para empezar a coordinar las compras.">
          <Button onClick={() => setSheetAbierto(true)}>Crear mi primera lista</Button>
        </EstadoVacio>
      ) : (
        <div className="flex flex-col gap-2">
          {listas.map((lista) => (
            <ListaCard key={lista.id} lista={lista} onBorrar={manejarBorrar} />
          ))}
        </div>
      )}

      <ListaFormSheet
        abierto={sheetAbierto}
        titulo="Nueva lista"
        labelBoton="Crear lista"
        cargando={creando}
        onCerrar={() => setSheetAbierto(false)}
        onGuardar={manejarCrear}
      />

      {user && household && (
        <GrabarVozSheet
          abierto={sheetVozAbierto}
          user={user}
          householdId={household.id}
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
