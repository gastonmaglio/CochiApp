"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatearMonto } from "@/lib/utils/moneda";
import { vibrar } from "@/lib/utils/haptica";
import { useLongPress } from "@/hooks/useLongPress";
import type { Item } from "@/types/item";

interface ItemRowProps {
  item: Item;
  onToggleComprado: (item: Item) => void;
  onEditar: (item: Item) => void;
  onBorrar: (item: Item) => void;
  // "Modo súper": filas más grandes y con más aire, pensadas para usar con el carrito
  // en una mano y el celular en la otra.
  grande?: boolean;
}

export function ItemRow({ item, onToggleComprado, onEditar, onBorrar, grande }: ItemRowProps) {
  const longPress = useLongPress({
    onLongPress: () => onBorrar(item),
    onClick: () => onEditar(item),
  });

  return (
    <li
      className={cn(
        "fila-animada flex items-center gap-3 rounded-xl px-2 transition-opacity",
        grande ? "py-3.5" : "py-2.5",
        item.comprado && "opacity-50"
      )}
    >
      <button
        type="button"
        onClick={() => {
          vibrar();
          onToggleComprado(item);
        }}
        aria-pressed={item.comprado}
        aria-label={
          item.comprado ? `Desmarcar ${item.nombre}` : `Marcar ${item.nombre} como comprado`
        }
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border-2 transition-colors",
          grande ? "h-10 w-10" : "h-7 w-7 text-xs",
          item.comprado ? "border-primary bg-primary text-primary-fg" : "border-border"
        )}
      >
        {item.comprado && <Check size={grande ? 20 : 14} strokeWidth={3} aria-hidden="true" />}
      </button>

      <button
        type="button"
        {...longPress}
        className="flex min-h-11 min-w-0 flex-1 flex-col items-start justify-center text-left"
      >
        <span
          className={cn(
            "truncate text-fg",
            grande ? "text-xl font-medium" : "text-base",
            item.comprado && "line-through"
          )}
        >
          {item.nombre}
          {item.cantidad && (
            <span className={cn("ml-1.5 text-fg-muted", grande ? "text-base" : "text-sm")}>
              · {item.cantidad}
            </span>
          )}
        </span>
        {item.notas && !grande && <span className="truncate text-xs text-fg-muted">{item.notas}</span>}
      </button>

      {item.comprado && item.montoGastado != null && !grande && (
        <span className="shrink-0 text-sm font-medium text-fg-muted">
          {formatearMonto(item.montoGastado)}
        </span>
      )}
    </li>
  );
}
