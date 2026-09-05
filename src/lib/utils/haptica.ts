/**
 * Vibración corta en acciones clave (marcar hecho, borrar). No todos los navegadores
 * soportan navigator.vibrate (iOS Safari no) — falla en silencio, es un extra, no algo
 * de lo que la función dependa.
 */
export function vibrar(ms = 15): void {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Sin soporte — no pasa nada.
  }
}
