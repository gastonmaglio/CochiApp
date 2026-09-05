import type { User } from "firebase/auth";

export interface ItemExtraidoPorVoz {
  nombre: string;
  cantidad: string | null;
  categoria: string;
}

export interface GastoExtraidoPorVoz {
  descripcion: string;
  monto: number;
  categoria: string;
}

export type ContenidoExtraidoPorVoz =
  | { tipo: "lista"; items: ItemExtraidoPorVoz[] }
  | { tipo: "gasto"; gasto: GastoExtraidoPorVoz };

export class ErrorVoz extends Error {}

export async function procesarAudioVoz(
  user: User,
  householdId: string,
  categoriasCompras: string[],
  categoriasGastos: string[],
  audio: Blob
): Promise<ContenidoExtraidoPorVoz> {
  const idToken = await user.getIdToken();

  const formData = new FormData();
  formData.append("audio", audio, "audio.webm");
  formData.append("householdId", householdId);
  formData.append("categoriasCompras", JSON.stringify(categoriasCompras));
  formData.append("categoriasGastos", JSON.stringify(categoriasGastos));

  const respuesta = await fetch("/api/voz", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    body: formData,
  });

  const datos = await respuesta.json();
  if (!respuesta.ok) {
    throw new ErrorVoz(datos?.error ?? "No se pudo procesar el audio.");
  }
  if (datos.tipo === "gasto") {
    return { tipo: "gasto", gasto: datos.gasto };
  }
  return { tipo: "lista", items: datos.items ?? [] };
}
