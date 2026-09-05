import type { Categoria } from "@/types/household";

/**
 * Ordena categorías de primer nivel por uso real (la propia + la de sus subcategorías,
 * así un padre con hijos populares sube igual aunque él mismo casi no se use directo),
 * e inmediatamente después de cada una pone sus subcategorías ordenadas por su propio uso.
 * Empate de uso se resuelve con "orden" (así las predefinidas mantienen un orden estable
 * cuando todavía nadie usó nada).
 */
export function ordenarCategorias(categorias: Categoria[]): Categoria[] {
  const raiz = categorias.filter((c) => !c.categoriaPadreId);
  const hijosPorPadre = new Map<string, Categoria[]>();
  for (const c of categorias) {
    if (!c.categoriaPadreId) continue;
    hijosPorPadre.set(c.categoriaPadreId, [...(hijosPorPadre.get(c.categoriaPadreId) ?? []), c]);
  }

  function usoTotal(categoria: Categoria): number {
    const hijos = hijosPorPadre.get(categoria.id) ?? [];
    return categoria.vecesUsada + hijos.reduce((acc, h) => acc + h.vecesUsada, 0);
  }

  const raizOrdenada = [...raiz].sort((a, b) => usoTotal(b) - usoTotal(a) || a.orden - b.orden);

  const resultado: Categoria[] = [];
  for (const padre of raizOrdenada) {
    resultado.push(padre);
    const hijos = (hijosPorPadre.get(padre.id) ?? []).sort(
      (a, b) => b.vecesUsada - a.vecesUsada || a.orden - b.orden
    );
    resultado.push(...hijos);
  }
  return resultado;
}
