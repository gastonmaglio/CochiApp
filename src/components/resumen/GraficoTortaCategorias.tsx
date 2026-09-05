"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatearMonto } from "@/lib/utils/moneda";
import type { Categoria } from "@/types/household";

interface DatoTorta {
  categoriaId: string;
  nombre: string;
  color: string;
  icono: string;
  total: number;
}

interface GraficoTortaCategoriasProps {
  totalesPorCategoria: Record<string, number>;
  categorias: Categoria[];
}

export function GraficoTortaCategorias({
  totalesPorCategoria,
  categorias,
}: GraficoTortaCategoriasProps) {
  const datos: DatoTorta[] = categorias
    .map((categoria) => ({
      categoriaId: categoria.id,
      nombre: categoria.nombre,
      color: categoria.color,
      icono: categoria.icono,
      total: totalesPorCategoria[categoria.id] ?? 0,
    }))
    .filter((dato) => dato.total > 0)
    .sort((a, b) => b.total - a.total);

  if (datos.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-fg-muted">
        Todavía no hay gastos categorizados este mes.
      </p>
    );
  }

  return (
    <div>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={datos}
              dataKey="total"
              nameKey="nombre"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={2}
            >
              {datos.map((dato) => (
                <Cell
                  key={dato.categoriaId}
                  fill={dato.color}
                  stroke="var(--color-bg-elevated)"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(valor) => formatearMonto(Number(valor ?? 0))}
              contentStyle={{
                backgroundColor: "var(--color-bg-elevated)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                fontSize: 13,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {datos.map((dato) => (
          <li key={dato.categoriaId} className="flex items-center gap-2 text-sm">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: dato.color }}
            />
            <span className="min-w-0 flex-1 truncate text-fg-muted">
              {dato.icono} {dato.nombre}
            </span>
            <span className="shrink-0 font-medium text-fg">{formatearMonto(dato.total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
