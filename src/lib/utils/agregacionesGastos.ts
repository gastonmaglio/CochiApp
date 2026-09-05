import type { Gasto } from "@/types/gasto";
import type { Categoria } from "@/types/household";
import { formatearMonto } from "@/lib/utils/moneda";

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

// Umbrales para no generar insights sobre ruido: una categoría que casi no se usa puede
// "subir 300%" pasando de $100 a $400, y eso no le sirve a nadie.
const UMBRAL_PORCENTAJE = 20;
const UMBRAL_MONTO_MINIMO = 3000;

/**
 * Compara el gasto de este mes por categoría contra el promedio de los últimos meses y,
 * si hay una desviación real (no ruido), arma una frase lista para mostrar. Devuelve
 * null si no hay ninguna desviación que valga la pena señalar.
 */
export function generarInsightGastos(
  actualPorCategoria: Record<string, number>,
  promedioPorCategoria: Record<string, number>,
  categorias: Categoria[]
): string | null {
  const categoriasPorId = new Map(categorias.map((c) => [c.id, c]));
  let mejor: { categoriaId: string; porcentaje: number } | null = null;

  for (const [categoriaId, actual] of Object.entries(actualPorCategoria)) {
    const promedio = promedioPorCategoria[categoriaId] ?? 0;
    if (promedio <= 0 || actual < UMBRAL_MONTO_MINIMO) continue;
    const porcentaje = ((actual - promedio) / promedio) * 100;
    if (porcentaje < UMBRAL_PORCENTAJE) continue;
    if (!mejor || porcentaje > mejor.porcentaje) {
      mejor = { categoriaId, porcentaje };
    }
  }

  if (!mejor) return null;
  const categoria = categoriasPorId.get(mejor.categoriaId);
  if (!categoria) return null;

  const actual = actualPorCategoria[mejor.categoriaId];
  return `Gastaste ${mejor.porcentaje.toFixed(0)}% más en ${categoria.nombre} (${formatearMonto(actual)}) que el promedio de los últimos meses.`;
}
