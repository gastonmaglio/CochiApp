"use client";

import { Button } from "@/components/ui/Button";
import { descargarCsv, generarCsv } from "@/lib/utils/csv";
import { formatearFecha, formatearMes } from "@/lib/utils/fechas";
import type { Gasto } from "@/types/gasto";
import type { Categoria } from "@/types/household";
import type { Usuario } from "@/types/usuario";

interface ExportarCsvButtonProps {
  gastos: Gasto[];
  categorias: Categoria[];
  usuarios: Record<string, Usuario>;
  uidActual: string;
  mes: Date;
}

export function ExportarCsvButton({
  gastos,
  categorias,
  usuarios,
  uidActual,
  mes,
}: ExportarCsvButtonProps) {
  function manejarExportar() {
    const categoriasPorId = new Map(categorias.map((c) => [c.id, c.nombre]));
    const filas = gastos.map((gasto) => [
      formatearFecha(gasto.fecha.toDate()),
      gasto.descripcion,
      categoriasPorId.get(gasto.categoriaId) ?? "",
      gasto.responsableUid === null
        ? "Compartido"
        : gasto.responsableUid === uidActual
          ? "Yo"
          : (usuarios[gasto.responsableUid]?.nombre ?? "Pareja"),
      gasto.monto.toFixed(2).replace(".", ","),
      gasto.esRecurrente ? "Sí" : "No",
    ]);
    const csv = generarCsv(
      ["Fecha", "Descripción", "Categoría", "Responsable", "Monto", "Recurrente"],
      filas
    );
    descargarCsv(`gastos-${formatearMes(mes).replace(" ", "-")}.csv`, csv);
  }

  return (
    <Button
      type="button"
      variant="secondary"
      fullWidth
      onClick={manejarExportar}
      disabled={gastos.length === 0}
    >
      Exportar a CSV
    </Button>
  );
}
