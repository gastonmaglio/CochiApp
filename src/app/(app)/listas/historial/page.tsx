"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useComprasCerradas } from "@/hooks/useComprasCerradas";
import { CompraCerradaCard } from "@/components/historial/CompraCerradaCard";
import { CompraCerradaDetalleSheet } from "@/components/historial/CompraCerradaDetalleSheet";
import { EstadoVacio } from "@/components/ui/EstadoVacio";
import type { CompraCerrada } from "@/types/compraCerrada";

export default function HistorialComprasPage() {
  const router = useRouter();
  const { household } = useAuth();
  const { compras, cargando } = useComprasCerradas(household?.id);
  const [compraSeleccionada, setCompraSeleccionada] = useState<CompraCerrada | null>(null);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex items-center gap-2 border-b border-border bg-bg-elevated px-3 py-3">
        <button
          type="button"
          onClick={() => router.push("/listas")}
          aria-label="Volver a Listas"
          className="flex min-h-11 min-w-11 items-center justify-center text-fg"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="font-display text-lg font-semibold text-fg">Historial de compras</h1>
      </header>

      <div className="flex flex-col gap-2 px-4 py-5 pb-10">
        {cargando ? (
          <div className="flex flex-col gap-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-bg-elevated" />
            ))}
          </div>
        ) : compras.length === 0 ? (
          <EstadoVacio
            variante="compras"
            mensaje="Todavía no cerraste ninguna compra. Cuando lo hagas, va a quedar guardada acá con el detalle de lo que compraste."
          />
        ) : (
          compras.map((compra) => (
            <CompraCerradaCard key={compra.id} compra={compra} onAbrir={setCompraSeleccionada} />
          ))
        )}
      </div>

      <CompraCerradaDetalleSheet
        compra={compraSeleccionada}
        onCerrar={() => setCompraSeleccionada(null)}
      />
    </main>
  );
}
