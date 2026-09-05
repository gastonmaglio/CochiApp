export function inicioDeMes(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), 1);
}

export function inicioDeMesSiguiente(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth() + 1, 1);
}

export function formatearMes(fecha: Date): string {
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(fecha);
}

export function formatearFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha);
}

export function claveMes(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
}
