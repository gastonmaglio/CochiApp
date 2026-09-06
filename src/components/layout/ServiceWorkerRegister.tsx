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
        // Además, un chequeo periódico — si alguien deja la pestaña abierta y AL FRENTE
        // sin minimizarla nunca (nunca dispara visibilitychange), puede quedarse corriendo
        // código viejo contra un backend que ya cambió de forma. Pasó de verdad una vez.
        // Este componente vive toda la sesión de la app, así que no hace falta limpiar el
        // intervalo — no hay un "desmontaje" real antes de cerrar la pestaña.
        setInterval(() => {
          registration.update().catch(() => {});
        }, 20 * 60 * 1000);
      })
      .catch((error: unknown) => {
        console.error("No se pudo registrar el service worker", error);
      });
  }, []);

  return null;
}
