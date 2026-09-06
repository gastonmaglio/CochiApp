import type { ReactNode } from "react";
import { Mascota, type AnimacionMascota, type PoseMascota } from "@/components/ui/Mascota";

interface EstadoVacioProps {
  mensaje: string;
  children?: ReactNode;
  // Cada pantalla vacía usa la pose que mejor cuenta lo que significa ese vacío —
  // sin tareas es "durmiendo" (nada pendiente), una búsqueda sin resultados es
  // "sorprendida", etc. Por defecto, la pose neutra de siempre.
  variante?: "default" | "tareas" | "listas" | "gastos" | "busqueda" | "compras" | "privado";
}

const POSE_POR_VARIANTE: Record<NonNullable<EstadoVacioProps["variante"]>, PoseMascota> = {
  default: "sentada-hoja",
  tareas: "durmiendo",
  listas: "sentada-hoja",
  gastos: "meditando",
  busqueda: "sorprendida",
  compras: "caminando",
  privado: "meditando",
};

const ANIMACION_POR_VARIANTE: Record<NonNullable<EstadoVacioProps["variante"]>, AnimacionMascota> = {
  default: "respirar",
  tareas: "flotar",
  listas: "respirar",
  gastos: "respirar",
  busqueda: "bamboleo",
  compras: "bamboleo",
  privado: "respirar",
};

export function EstadoVacio({ mensaje, children, variante = "default" }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
      <Mascota size={72} pose={POSE_POR_VARIANTE[variante]} animacion={ANIMACION_POR_VARIANTE[variante]} />
      <p className="max-w-[26ch] text-sm text-fg-muted">{mensaje}</p>
      {children}
    </div>
  );
}
