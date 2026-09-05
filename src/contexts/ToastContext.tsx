"use client";

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

interface ToastState {
  id: number;
  mensaje: string;
  accionLabel?: string;
  onAccion?: () => void;
}

interface OpcionesToast {
  accionLabel?: string;
  onAccion?: () => void;
  duracionMs?: number;
}

interface ToastContextValue {
  mostrarToast: (mensaje: string, opciones?: OpcionesToast) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const idRef = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrarToast = useCallback<ToastContextValue["mostrarToast"]>((mensaje, opciones) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const id = ++idRef.current;
    setToast({ id, mensaje, accionLabel: opciones?.accionLabel, onAccion: opciones?.onAccion });
    timeoutRef.current = setTimeout(() => {
      setToast((actual) => (actual?.id === id ? null : actual));
    }, opciones?.duracionMs ?? 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 flex justify-center px-4">
          <div
            role="status"
            className="pointer-events-auto flex items-center gap-3 rounded-xl bg-fg px-4 py-3 text-sm text-bg shadow-lg animate-[aparecer_0.15s_ease-out]"
          >
            <span>{toast.mensaje}</span>
            {toast.accionLabel && (
              <button
                type="button"
                onClick={() => {
                  toast.onAccion?.();
                  setToast(null);
                }}
                className="min-h-8 font-semibold text-primary"
              >
                {toast.accionLabel}
              </button>
            )}
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de ToastProvider");
  return ctx;
}
