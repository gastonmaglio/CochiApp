import type { Categoria } from "@/types/household";

// Respaldo para cuando un producto se agrega por primera vez (sin historial en
// estadisticasItems, ver itemsFrecuentes.service) — sin esto, un item nuevo cae por
// default en la primera categoría de la lista, que casi nunca es la correcta.
const PALABRAS_POR_CATEGORIA: Record<string, string[]> = {
  Verdulería: [
    "papa", "papas", "batata", "zanahoria", "cebolla", "tomate", "lechuga", "zapallo",
    "zapallito", "choclo", "ajo", "limon", "naranja", "manzana", "banana", "pera",
    "frutilla", "palta", "morron", "acelga", "espinaca", "apio", "pepino", "fruta",
    "verdura", "mandarina", "durazno", "uva", "kiwi", "berenjena", "remolacha", "puerro",
  ],
  Carnicería: [
    "carne", "pollo", "milanesa", "asado", "bife", "chorizo", "salchicha", "pechuga",
    "cerdo", "pescado", "merluza", "hamburguesa", "costilla", "matambre", "picada",
    "picado", "vacio", "pata muslo", "suprema", "roast beef", "peceto",
  ],
  Lácteos: [
    "leche", "queso", "yogur", "yogurt", "manteca", "crema de leche", "dulce de leche",
    "postre", "huevo", "huevos", "ricota", "danonino", "cremoso",
  ],
  Almacén: [
    "arroz", "fideos", "fideo", "aceite", "harina", "azucar", "sal", "yerba", "cafe",
    "te", "galletitas", "galleta", "pan", "atun", "lentejas", "polenta", "mayonesa",
    "ketchup", "mostaza", "conserva", "puré de tomate", "salsa de tomate", "caldo",
  ],
  Bebidas: [
    "agua", "gaseosa", "cerveza", "vino", "jugo", "fernet", "coca", "sprite", "soda",
    "aguardiente", "gancia", "champagne", "sidra",
  ],
  Limpieza: [
    "lavandina", "detergente", "jabon en polvo", "esponja", "trapo", "suavizante",
    "limpiador", "papel higienico", "rollo de cocina", "escoba", "bolsa de residuo",
    "lustramuebles", "desodorante de ambiente",
  ],
  "Higiene personal": [
    "shampoo", "champu", "acondicionador", "pasta dental", "dentifrico",
    "cepillo de dientes", "desodorante", "toallitas", "protector", "afeitadora",
    "rastrillo", "jabon de tocador", "algodon", "hilo dental",
  ],
  Mascotas: ["alimento balanceado", "balanceado", "croquetas", "arena sanitaria", "arena para gatos"],
};

function normalizar(texto: string): string {
  return texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Heurística simple por palabras clave, sin depender de ningún servicio externo — pensada
 * como fallback rápido y gratis para cuando no hay historial de ese producto todavía.
 */
export function sugerirCategoriaPorNombre(nombre: string, categorias: Categoria[]): string | null {
  const normalizado = normalizar(nombre);
  if (!normalizado) return null;

  for (const [nombreCategoria, palabras] of Object.entries(PALABRAS_POR_CATEGORIA)) {
    const coincide = palabras.some((palabra) => normalizado.includes(normalizar(palabra)));
    if (!coincide) continue;
    const categoria = categorias.find((c) => normalizar(c.nombre) === normalizar(nombreCategoria));
    if (categoria) return categoria.id;
  }
  return null;
}
