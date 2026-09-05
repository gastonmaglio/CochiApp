import type { Tarea } from "@/types/tarea";

const PESO_PRIORIDAD: Record<string, number> = { alta: 0, media: 1, baja: 2 };

export function ordenarTareas(tareas: Tarea[]): Tarea[] {
  return [...tareas].sort((a, b) => {
    if (a.completada !== b.completada) return a.completada ? 1 : -1;
    const fechaA = a.fechaVencimiento?.toMillis() ?? Infinity;
    const fechaB = b.fechaVencimiento?.toMillis() ?? Infinity;
    if (fechaA !== fechaB) return fechaA - fechaB;
    // Misma fecha (o ninguna las dos): a igualdad de urgencia por fecha, la más
    // prioritaria va primero.
    const pesoA = PESO_PRIORIDAD[a.prioridad ?? ""] ?? 3;
    const pesoB = PESO_PRIORIDAD[b.prioridad ?? ""] ?? 3;
    return pesoA - pesoB;
  });
}

export function estaVencida(tarea: Tarea): boolean {
  if (tarea.completada || !tarea.fechaVencimiento) return false;
  return tarea.fechaVencimiento.toMillis() < Date.now();
}
