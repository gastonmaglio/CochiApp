import { formatearMonto } from "@/lib/utils/moneda";
import type { Usuario } from "@/types/usuario";

interface TotalPorPersonaCardProps {
  miembros: string[];
  usuarios: Record<string, Usuario>;
  uidActual: string;
  totales: Record<string, number>;
}

export function TotalPorPersonaCard({
  miembros,
  usuarios,
  uidActual,
  totales,
}: TotalPorPersonaCardProps) {
  const filas = [
    ...miembros.map((uid) => ({
      clave: uid,
      nombre: uid === uidActual ? "Yo" : (usuarios[uid]?.nombre ?? "Pareja"),
      total: totales[uid] ?? 0,
    })),
    { clave: "compartido", nombre: "Compartido", total: totales.compartido ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-bg-elevated p-4 shadow-card">
      <h2 className="text-sm font-semibold text-fg-muted">Por persona</h2>
      {filas.map((fila) => (
        <div key={fila.clave} className="flex items-center justify-between text-sm">
          <span className="text-fg">{fila.nombre}</span>
          <span className="font-medium text-fg">{formatearMonto(fila.total)}</span>
        </div>
      ))}
    </div>
  );
}
