"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { formatearMonto } from "@/lib/utils/moneda";
import type { PuntoEvolucion } from "@/hooks/useEvolucionMensual";

interface GraficoEvolucionMensualProps {
  puntos: PuntoEvolucion[];
}

export function GraficoEvolucionMensual({ puntos }: GraficoEvolucionMensualProps) {
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={puntos} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
          <XAxis
            dataKey="etiqueta"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "var(--color-fg-muted)" }}
          />
          <Tooltip
            formatter={(valor) => formatearMonto(Number(valor ?? 0))}
            cursor={{ fill: "var(--color-primary-soft)" }}
            contentStyle={{
              backgroundColor: "var(--color-bg-elevated)",
              border: "1px solid var(--color-border)",
              borderRadius: 12,
              fontSize: 13,
            }}
          />
          <Bar dataKey="total" fill="var(--color-primary)" radius={[6, 6, 0, 0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
