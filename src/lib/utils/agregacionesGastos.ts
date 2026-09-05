import type { Gasto } from "@/types/gasto";

export function totalGeneral(gastos: Gasto[]): number {
  return gastos.reduce((acumulado, gasto) => acumulado + gasto.monto, 0);
}

export function totalPorResponsable(gastos: Gasto[]): Record<string, number> {
  const totales: Record<string, number> = {};
  for (const gasto of gastos) {
    const clave = gasto.responsableUid ?? "compartido";
    totales[clave] = (totales[clave] ?? 0) + gasto.monto;
  }
  return totales;
}

export function totalPorCategoria(gastos: Gasto[]): Record<string, number> {
  const totales: Record<string, number> = {};
  for (const gasto of gastos) {
    totales[gasto.categoriaId] = (totales[gasto.categoriaId] ?? 0) + gasto.monto;
  }
  return totales;
}

export interface ComparacionMes {
  diferencia: number;
  // null cuando el mes anterior fue 0: no hay base real para calcular un porcentaje.
  porcentaje: number | null;
}

export function compararConMesAnterior(totalActual: number, totalAnterior: number): ComparacionMes {
  const diferencia = totalActual - totalAnterior;
  const porcentaje = totalAnterior > 0 ? (diferencia / totalAnterior) * 100 : null;
  return { diferencia, porcentaje };
}
