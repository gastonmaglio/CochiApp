import Image from "next/image";
import { cn } from "@/lib/utils/cn";

// "clasica" es la mascota de siempre (la del ícono de la app). El resto son las poses
// recortadas de las hojas de Gemini — cada una pensada para un momento puntual de la app,
// no decoración random: ver dónde se usa cada una para el porqué.
export type PoseMascota =
  | "clasica"
  | "sentada-hoja"
  | "saludando"
  | "durmiendo"
  | "meditando"
  | "sorprendida"
  | "caminando"
  | "relajada-agua"
  | "flores"
  | "verguenza"
  | "comiendo";

const ARCHIVO_POR_POSE: Record<PoseMascota, string> = {
  clasica: "/mascota-capibara.png",
  "sentada-hoja": "/mascota/sentada-hoja-2.png",
  saludando: "/mascota/saludando.png",
  durmiendo: "/mascota/durmiendo.png",
  meditando: "/mascota/meditando.png",
  sorprendida: "/mascota/sorprendida.png",
  caminando: "/mascota/caminando.png",
  "relajada-agua": "/mascota/relajada-agua.png",
  flores: "/mascota/flores.png",
  verguenza: "/mascota/verguenza.png",
  comiendo: "/mascota/comiendo.png",
};

// Animaciones suaves, siempre como transform/opacity (no reflow) y respetando
// prefers-reduced-motion (definido junto a los @keyframes en globals.css).
export type AnimacionMascota = "ninguna" | "respirar" | "saludar" | "flotar" | "aparecer-pop" | "bamboleo";

const CLASE_POR_ANIMACION: Record<AnimacionMascota, string> = {
  ninguna: "",
  respirar: "animar-mascota-respirar",
  saludar: "animar-mascota-saludar",
  flotar: "animar-mascota-flotar",
  "aparecer-pop": "animar-mascota-pop",
  bamboleo: "animar-mascota-bamboleo",
};

interface MascotaProps {
  size?: number;
  pose?: PoseMascota;
  animacion?: AnimacionMascota;
  className?: string;
}

export function Mascota({ size = 96, pose = "clasica", animacion = "ninguna", className }: MascotaProps) {
  return (
    <Image
      src={ARCHIVO_POR_POSE[pose]}
      alt=""
      aria-hidden="true"
      width={size}
      height={size}
      className={cn("select-none", CLASE_POR_ANIMACION[animacion], className)}
      priority
    />
  );
}
