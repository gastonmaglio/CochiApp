"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let recargando = false;
    // Si ya había un service worker controlando esta página (no es la primera instalación)
    // y aparece uno nuevo, es una actualización real — recargamos una sola vez para que
    // el usuario vea la versión nueva sin tener que cerrar la app a mano. Antes de esto,
    // una PWA instalada podía quedarse sirviendo una versión vieja indefinidamente.
    const teniaControladorAlEntrar = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!teniaControladorAlEntrar || recargando) return;
      recargando = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        // Chequeo activo de actualización cada vez que la app vuelve a primer plano —
        // una PWA instalada puede quedar abierta en segundo plano por días sin cerrarse.
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            registration.update().catch(() => {});
          }
        });
      })
      .catch((error: unknown) => {
        console.error("No se pudo registrar el service worker", error);
      });
  }, []);

  return null;
}
