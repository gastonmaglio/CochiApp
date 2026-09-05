"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function ErrorGlobalRaiz({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error crítico en el layout raíz:", error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ display: "flex", minHeight: "100dvh", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
        <span style={{ fontSize: 40 }} aria-hidden="true">
          😕
        </span>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 600 }}>Algo salió mal</h1>
          <p style={{ marginTop: 4, maxWidth: 320, fontSize: 14, color: "#64748b" }}>
            La aplicación no pudo iniciar. Probá recargar la página.
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          style={{
            minHeight: 44,
            padding: "0 20px",
            borderRadius: 12,
            background: "#059669",
            color: "#fff",
            fontWeight: 500,
            border: "none",
          }}
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
