"use client";

import { useRef } from "react";

interface OpcionesLongPress {
  onLongPress: () => void;
  onClick?: () => void;
  duracionMs?: number;
}

interface HandlersLongPress {
  onPointerDown: () => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onClick: () => void;
}

export function useLongPress({
  onLongPress,
  onClick,
  duracionMs = 500,
}: OpcionesLongPress): HandlersLongPress {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activadoRef = useRef(false);

  function iniciar() {
    activadoRef.current = false;
    timeoutRef.current = setTimeout(() => {
      activadoRef.current = true;
      onLongPress();
    }, duracionMs);
  }

  function cancelar() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }

  function manejarClick() {
    if (!activadoRef.current) onClick?.();
  }

  return {
    onPointerDown: iniciar,
    onPointerUp: cancelar,
    onPointerLeave: cancelar,
    onPointerCancel: cancelar,
    onClick: manejarClick,
  };
}
