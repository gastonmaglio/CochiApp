import type { ReactNode } from "react";
import { Mascota } from "@/components/ui/Mascota";

interface EstadoVacioProps {
  mensaje: string;
  children?: ReactNode;
}

export function EstadoVacio({ mensaje, children }: EstadoVacioProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center">
      <Mascota size={72} />
      <p className="max-w-[26ch] text-sm text-fg-muted">{mensaje}</p>
      {children}
    </div>
  );
}
