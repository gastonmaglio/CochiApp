"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/Button";
import { Mascota } from "@/components/ui/Mascota";

export default function ErrorGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error no controlado:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <Mascota size={96} pose="verguenza" animacion="respirar" />
      <div>
        <h1 className="font-display text-lg font-semibold text-fg">Algo salió mal</h1>
        <p className="mt-1 max-w-xs text-sm text-fg-muted">
          No pudimos mostrar esta pantalla. Los datos siguen a salvo — probá de nuevo.
        </p>
      </div>
      <Button type="button" onClick={reset}>
        Reintentar
      </Button>
    </div>
  );
}
