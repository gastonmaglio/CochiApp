"use client";

import { useState, type FormEvent } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

interface ListaFormSheetProps {
  abierto: boolean;
  titulo: string;
  labelBoton: string;
  valorInicial?: string;
  cargando: boolean;
  onCerrar: () => void;
  onGuardar: (nombre: string) => void;
}

export function ListaFormSheet({
  abierto,
  titulo,
  labelBoton,
  valorInicial = "",
  cargando,
  onCerrar,
  onGuardar,
}: ListaFormSheetProps) {
  return (
    <Sheet abierto={abierto} onCerrar={onCerrar} titulo={titulo}>
      {/* Sheet desmonta esto al cerrarse — cada apertura arranca con estado fresco. */}
      <ListaForm valorInicial={valorInicial} labelBoton={labelBoton} cargando={cargando} onGuardar={onGuardar} />
    </Sheet>
  );
}

function ListaForm({
  valorInicial,
  labelBoton,
  cargando,
  onGuardar,
}: {
  valorInicial: string;
  labelBoton: string;
  cargando: boolean;
  onGuardar: (nombre: string) => void;
}) {
  const [nombre, setNombre] = useState(valorInicial);

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    if (!nombre.trim()) return;
    onGuardar(nombre.trim());
  }

  return (
    <form onSubmit={manejarSubmit} className="flex flex-col gap-4">
      <Input
        label="Nombre"
        placeholder="Ej: Supermercado, Farmacia..."
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        maxLength={40}
        autoFocus
        required
      />
      <Button type="submit" fullWidth disabled={cargando}>
        {cargando ? "Guardando…" : labelBoton}
      </Button>
    </form>
  );
}
