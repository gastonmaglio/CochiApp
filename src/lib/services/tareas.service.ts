import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { PrioridadTarea, RepeticionTarea, Subtarea, Tarea } from "@/types/tarea";

export interface DatosTarea {
  titulo: string;
  descripcion: string | null;
  fechaVencimiento: Date | null;
  asignadaA: string | null;
  repetir: RepeticionTarea;
  prioridad: PrioridadTarea;
  subtareas: Subtarea[];
}

const DIAS_POR_REPETICION: Record<Exclude<RepeticionTarea, null>, number> = {
  semanal: 7,
  mensual: 30,
};

function coleccionTareas(householdId: string) {
  return collection(db, "households", householdId, "tareas");
}

export function escucharTareas(
  householdId: string,
  callback: (tareas: Tarea[]) => void
): () => void {
  const q = query(coleccionTareas(householdId), orderBy("creadoEn", "desc"));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Tarea, "id">) })));
  });
}

export async function crearTarea(
  householdId: string,
  uid: string,
  datos: DatosTarea
): Promise<string> {
  const ref = await addDoc(coleccionTareas(householdId), {
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    fechaVencimiento: datos.fechaVencimiento ? Timestamp.fromDate(datos.fechaVencimiento) : null,
    asignadaA: datos.asignadaA,
    repetir: datos.repetir,
    prioridad: datos.prioridad,
    subtareas: datos.subtareas,
    completada: false,
    completadaPor: null,
    completadaEn: null,
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  return ref.id;
}

export async function editarTarea(
  householdId: string,
  tareaId: string,
  datos: DatosTarea
): Promise<void> {
  await updateDoc(doc(coleccionTareas(householdId), tareaId), {
    titulo: datos.titulo,
    descripcion: datos.descripcion,
    fechaVencimiento: datos.fechaVencimiento ? Timestamp.fromDate(datos.fechaVencimiento) : null,
    asignadaA: datos.asignadaA,
    repetir: datos.repetir,
    prioridad: datos.prioridad,
    subtareas: datos.subtareas,
    actualizadoEn: serverTimestamp(),
  });
}

/**
 * Togglear un solo checkbox de subtarea sin abrir el formulario completo — se manda el
 * array entero ya actualizado porque Firestore no soporta editar un elemento puntual
 * dentro de un array de objetos.
 */
export async function actualizarSubtareas(
  householdId: string,
  tareaId: string,
  subtareas: Subtarea[]
): Promise<void> {
  await updateDoc(doc(coleccionTareas(householdId), tareaId), {
    subtareas,
    actualizadoEn: serverTimestamp(),
  });
}

export async function eliminarTarea(householdId: string, tareaId: string): Promise<void> {
  await deleteDoc(doc(coleccionTareas(householdId), tareaId));
}

export async function restaurarTarea(
  householdId: string,
  tareaId: string,
  tarea: Omit<Tarea, "id">
): Promise<void> {
  await setDoc(doc(coleccionTareas(householdId), tareaId), tarea);
}

/**
 * Al completar una tarea que se repite, generamos ya mismo la próxima ocurrencia
 * (no depende de un cron: se dispara con la acción del usuario). Necesita una fecha
 * de vencimiento de base para poder calcular la siguiente — sin eso no hay forma de
 * saber cuándo "toca" de nuevo.
 */
export async function alternarCompletada(
  householdId: string,
  tarea: Tarea,
  uid: string,
  completada: boolean
): Promise<void> {
  await updateDoc(doc(coleccionTareas(householdId), tarea.id), {
    completada,
    completadaPor: completada ? uid : null,
    completadaEn: completada ? serverTimestamp() : null,
    actualizadoEn: serverTimestamp(),
  });

  if (completada && tarea.repetir && tarea.fechaVencimiento) {
    const proximaFecha = new Date(tarea.fechaVencimiento.toDate());
    proximaFecha.setDate(proximaFecha.getDate() + DIAS_POR_REPETICION[tarea.repetir]);
    await addDoc(coleccionTareas(householdId), {
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      fechaVencimiento: Timestamp.fromDate(proximaFecha),
      asignadaA: tarea.asignadaA,
      repetir: tarea.repetir,
      prioridad: tarea.prioridad,
      // La próxima ocurrencia arranca con el checklist sin marcar, no arrastra los
      // checks de la vez anterior — cada semana/mes es una tanda nueva de subtareas.
      subtareas: tarea.subtareas.map((s) => ({ ...s, hecha: false })),
      completada: false,
      completadaPor: null,
      completadaEn: null,
      creadoPor: uid,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  }
}
