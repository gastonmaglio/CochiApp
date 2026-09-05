"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import type { Item } from "@/types/item";

interface MontoGastadoSheetProps {
  item: Item | null;
  onCerrar: () => void;
  onConfirmar: (monto: number | null) => void;
}

export function MontoGastadoSheet({ item, onCerrar, onConfirmar }: MontoGastadoSheetProps) {
  return (
    <Sheet abierto={Boolean(item)} onCerrar={onCerrar} titulo={`¿Cuánto gastaste en ${item?.nombre ?? ""}?`}>
      {item && <MontoGastadoForm key={item.id} onConfirmar={onConfirmar} />}
    </Sheet>
  );
}

function MontoGastadoForm({ onConfirmar }: { onConfirmar: (monto: number | null) => void }) {
  const [monto, setMonto] = useState("");
  const [error, setError] = useState<string | null>(null);

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    const texto = monto.trim();
    if (!texto) {
      onConfirmar(null);
      return;
    }
    const valor = Number(texto.replace(",", "."));
    if (Number.isNaN(valor) || valor < 0) {
      setError("Ingresá un monto válido.");
      return;
    }
    onConfirmar(valor);
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
      <Input
        label="Monto (opcional)"
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={monto}
        onChange={(e) => setMonto(e.target.value)}
        placeholder="0"
        error={error ?? undefined}
        autoFocus
      />
      <div className="flex gap-3">
        <Button type="button" variant="secondary" fullWidth onClick={() => onConfirmar(null)}>
          Omitir
        </Button>
        <Button type="submit" fullWidth>
          Guardar
        </Button>
      </div>
    </form>
  );
}
