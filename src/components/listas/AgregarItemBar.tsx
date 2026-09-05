"use client";

import { useRef, useState, type FormEvent } from "react";
import { Plus, Tag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { Categoria } from "@/types/household";

interface AgregarItemBarProps {
  categorias: Categoria[];
  categoriaSeleccionada: string | null;
  onCambiarCategoria: (categoriaId: string) => void;
  onAgregar: (nombre: string) => void;
  cargando: boolean;
}

export function AgregarItemBar({
  categorias,
  categoriaSeleccionada,
  onCambiarCategoria,
  onAgregar,
  cargando,
}: AgregarItemBarProps) {
  const [nombre, setNombre] = useState("");
  const [mostrarCategorias, setMostrarCategorias] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    const valor = nombre.trim();
    if (!valor) return;
    onAgregar(valor);
    setNombre("");
    inputRef.current?.focus();
  }

  const categoriaActual = categorias.find((c) => c.id === categoriaSeleccionada);

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg-elevated pb-[env(safe-area-inset-bottom)]">
      {mostrarCategorias && (
        <div className="flex gap-2 overflow-x-auto border-b border-border px-3 py-2">
          {categorias.map((categoria) => (
            <button
              key={categoria.id}
              type="button"
              onClick={() => {
                onCambiarCategoria(categoria.id);
                setMostrarCategorias(false);
              }}
              className={cn(
                "flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-sm font-medium",
                categoria.id === categoriaSeleccionada
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-bg text-fg-muted"
              )}
            >
              <span aria-hidden="true">{categoria.icono}</span>
              {categoria.nombre}
            </button>
          ))}
        </div>
      )}
      <form onSubmit={manejarSubmit} className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => setMostrarCategorias((v) => !v)}
          aria-label={`Categoría: ${categoriaActual?.nombre ?? "elegir"}`}
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-bg text-lg"
        >
          {categoriaActual?.icono ?? <Tag size={18} aria-hidden="true" />}
        </button>
        <input
          ref={inputRef}
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Agregar item…"
          aria-label="Nombre del item"
          maxLength={120}
          className="min-h-11 flex-1 rounded-xl border border-border bg-bg px-3.5 text-base text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          type="submit"
          disabled={!nombre.trim() || cargando}
          aria-label="Agregar item"
          className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg disabled:opacity-40"
        >
          <Plus size={20} aria-hidden="true" />
        </button>
      </form>
    </div>
  );
}
