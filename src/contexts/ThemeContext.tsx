"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";

type Tema = "claro" | "oscuro";

const CLAVE_STORAGE = "cochiapp-tema";
const listeners = new Set<() => void>();

function leerTemaGuardado(): Tema {
  try {
    const guardado = localStorage.getItem(CLAVE_STORAGE);
    if (guardado === "claro" || guardado === "oscuro") return guardado;
  } catch {
    // Sin acceso a localStorage (modo privado, storage bloqueado) — seguimos al preferido del sistema.
  }
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "oscuro";
  }
  return "claro";
}

function obtenerSnapshotServidor(): Tema {
  return "claro";
}

function suscribirse(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notificarCambio() {
  listeners.forEach((callback) => callback());
}

function aplicarTema(tema: Tema) {
  document.documentElement.setAttribute("data-theme", tema === "oscuro" ? "dark" : "light");
}

interface ThemeContextValue {
  tema: Tema;
  setTema: (tema: Tema) => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // El script inline en el layout raíz ya aplicó el tema guardado al <html> ANTES de
  // hidratar (evita el flash) — acá solo necesitamos saber cuál es para reflejarlo en el
  // ThemeToggle. useSyncExternalStore evita el mismatch servidor/cliente sin useEffect.
  const tema = useSyncExternalStore(suscribirse, leerTemaGuardado, obtenerSnapshotServidor);

  function setTema(nuevoTema: Tema) {
    aplicarTema(nuevoTema);
    try {
      localStorage.setItem(CLAVE_STORAGE, nuevoTema);
    } catch {
      // Sin persistencia disponible, el tema igual queda aplicado para esta sesión.
    }
    notificarCambio();
  }

  return <ThemeContext.Provider value={{ tema, setTema }}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme debe usarse dentro de ThemeProvider");
  return ctx;
}
