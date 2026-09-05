import { Timestamp } from "firebase/firestore";

function reemplazarTimestamps(_clave: string, valor: unknown): unknown {
  if (valor instanceof Timestamp) return valor.toDate().toISOString();
  return valor;
}

export function descargarJson(nombreArchivo: string, datos: unknown): void {
  const contenido = JSON.stringify(datos, reemplazarTimestamps, 2);
  const blob = new Blob([contenido], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
