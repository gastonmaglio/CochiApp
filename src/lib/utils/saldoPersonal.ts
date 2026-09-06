import type { Gasto } from "@/types/gasto";
import type { MovimientoPrivado } from "@/types/movimientoPrivado";

/**
 * Cuánto de este gasto compartido le corresponde a este uid puntual:
 *  - si tiene reparto personalizado, exactamente lo que se le asignó (0 si no figura),
 *  - si es 100% de esta persona (responsableUid == uid), el total,
 *  - si es compartido sin reparto (responsableUid == null), la mitad,
 *  - si es 100% de la otra persona, nada.
 */
export function calcularParteDeGasto(gasto: Gasto, uid: string): number {
  if (gasto.division) {
    return gasto.division[uid] ?? 0;
  }
  if (gasto.responsableUid === uid) return gasto.monto;
  if (gasto.responsableUid === null) return gasto.monto / 2;
  return 0;
}

export interface SaldoPersonal {
  totalIngresos: number;
  totalGastosPrivados: number;
  totalParteGastosCompartidos: number;
  saldo: number;
}

export function calcularSaldoPersonal(
  movimientosPrivados: MovimientoPrivado[],
  gastosCompartidos: Gasto[],
  uid: string
): SaldoPersonal {
  const totalIngresos = movimientosPrivados
    .filter((m) => m.tipo === "ingreso")
    .reduce((acc, m) => acc + m.monto, 0);
  const totalGastosPrivados = movimientosPrivados
    .filter((m) => m.tipo === "gasto")
    .reduce((acc, m) => acc + m.monto, 0);
  const totalParteGastosCompartidos = gastosCompartidos.reduce(
    (acc, g) => acc + calcularParteDeGasto(g, uid),
    0
  );

  return {
    totalIngresos,
    totalGastosPrivados,
    totalParteGastosCompartidos,
    saldo: totalIngresos - totalGastosPrivados - totalParteGastosCompartidos,
  };
}
