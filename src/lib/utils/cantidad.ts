/**
 * Suma/resta 1 al número al principio del texto de cantidad, preservando lo que venga
 * después (unidad, "kg", "docena", etc.). Si no hay ningún número todavía, "+" arranca en 1.
 * Nunca baja de 0 (en 0 devuelve vacío, es decir "sin cantidad especificada").
 */
export function ajustarCantidad(cantidad: string, delta: 1 | -1): string {
  const match = cantidad.match(/^(\d+)(.*)$/);
  if (!match) {
    if (delta < 0) return cantidad;
    const resto = cantidad.trim();
    return resto ? `1 ${resto}` : "1";
  }
  const numero = Math.max(0, parseInt(match[1], 10) + delta);
  const resto = match[2];
  return numero === 0 ? "" : `${numero}${resto}`;
}
