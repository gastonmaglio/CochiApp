import type { Item } from "@/types/item";
import type { Categoria } from "@/types/household";

export interface GrupoItems {
  categoria: Categoria;
  items: Item[];
}

export function agruparItemsPorCategoria(items: Item[], categorias: Categoria[]): GrupoItems[] {
  const categoriasOrdenadas = [...categorias].sort((a, b) => a.orden - b.orden);
  const grupos: GrupoItems[] = [];

  for (const categoria of categoriasOrdenadas) {
    const itemsCategoria = items
      .filter((item) => item.categoriaId === categoria.id)
      .sort((a, b) => {
        if (a.comprado !== b.comprado) return a.comprado ? 1 : -1;
        return a.ordenIndex - b.ordenIndex;
      });
    if (itemsCategoria.length > 0) {
      grupos.push({ categoria, items: itemsCategoria });
    }
  }

  return grupos;
}
