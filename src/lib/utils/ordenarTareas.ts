import type { Tarea } from "@/types/tarea";

export function ordenarTareas(tareas: Tarea[]): Tarea[] {
  return [...tareas].sort((a, b) => {
    if (a.completada !== b.completada) return a.completada ? 1 : -1;
    const fechaA = a.fechaVencimiento?.toMillis() ?? Infinity;
    const fechaB = b.fechaVencimiento?.toMillis() ?? Infinity;
    return fechaA - fechaB;
  });
}

export function estaVencida(tarea: Tarea): boolean {
  if (tarea.completada || !tarea.fechaVencimiento) return false;
  return tarea.fechaVencimiento.toMillis() < Date.now();
}
