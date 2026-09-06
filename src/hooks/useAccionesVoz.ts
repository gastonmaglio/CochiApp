"use client";

import { useRouter } from "next/navigation";
import type { User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { useToast } from "@/contexts/ToastContext";
import { crearLista } from "@/lib/services/listas.service";
import { agregarItem } from "@/lib/services/items.service";
import { crearGasto } from "@/lib/services/gastos.service";
import { crearTarea } from "@/lib/services/tareas.service";
import { mensajeErrorFirebase } from "@/lib/utils/errores";

interface ItemParaCrear {
  nombre: string;
  cantidad: string | null;
  categoriaId: string;
}

/**
 * Las tres acciones que puede terminar disparando una grabación de voz, sin importar
 * desde qué pantalla (Listas, Tareas o Gastos) se haya abierto el micrófono — el
 * reconocimiento es el mismo en todos lados, lo único que cambia es dónde tocás grabar.
 */
export function useAccionesVoz(householdId: string | undefined, user: User | null) {
  const router = useRouter();
  const { mostrarToast } = useToast();

  async function confirmarLista(nombreLista: string, items: ItemParaCrear[]) {
    if (!householdId || !user) return;
    try {
      const listaId = await crearLista(householdId, user.uid, nombreLista);
      let indice = 0;
      for (const item of items) {
        await agregarItem(
          householdId,
          listaId,
          user.uid,
          { nombre: item.nombre, cantidad: item.cantidad, categoriaId: item.categoriaId, notas: null },
          Date.now() + indice
        );
        indice += 1;
      }
      mostrarToast(`Lista "${nombreLista}" creada con ${items.length} items`);
      router.push(`/listas/${listaId}`);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  async function confirmarGasto(gasto: { descripcion: string; monto: number; categoriaId: string }) {
    if (!householdId || !user) return;
    try {
      await crearGasto(householdId, user.uid, {
        descripcion: gasto.descripcion,
        monto: gasto.monto,
        categoriaId: gasto.categoriaId,
        fecha: Timestamp.now(),
        responsableUid: null,
      });
      mostrarToast(`Gasto "${gasto.descripcion}" cargado`);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  async function confirmarTarea(tarea: { titulo: string; fechaVencimiento: Date | null }) {
    if (!householdId || !user) return;
    try {
      await crearTarea(householdId, user.uid, {
        titulo: tarea.titulo,
        descripcion: null,
        fechaVencimiento: tarea.fechaVencimiento,
        asignadaA: null,
        repetir: null,
        prioridad: null,
        subtareas: [],
      });
      mostrarToast(`Tarea "${tarea.titulo}" creada`);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    }
  }

  return { confirmarLista, confirmarGasto, confirmarTarea };
}
