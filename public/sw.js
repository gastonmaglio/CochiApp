// OJO al tocar este archivo: subir CACHE_VERSION es lo que fuerza a los navegadores a
// tirar la cache vieja. Si el contenido de este archivo no cambia, el navegador considera
// que "no hay actualización" y sigue sirviendo para siempre lo que ya tenía instalado —
// eso fue justo lo que le pasó a un usuario real (veía la app vieja, sin funciones nuevas,
// sin ningún error visible). Subimos la versión en cada cambio de esta lógica.
const CACHE_VERSION = "cochiapp-v2";
const APP_SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Los archivos de Next.js bajo /_next/static/ llevan un hash en el nombre: si el
  // contenido cambia, cambia la URL. Cache-first acá es seguro (nunca sirve algo viejo
  // con el mismo nombre) y evita bajarlos de nuevo en cada visita.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const copia = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copia));
          }
          return response;
        });
      })
    );
    return;
  }

  // Todo lo demás (la navegación entre páginas, el manifest, los íconos) siempre prefiere
  // la red primero — así ninguna actualización de la app queda "atrapada" atrás de una
  // cache vieja. La cache queda solo como red de seguridad para cuando no hay conexión.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copia = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copia));
        }
        return response;
      })
      .catch(() =>
        caches
          .match(request)
          .then((cached) => cached || (request.mode === "navigate" ? caches.match("/") : undefined))
      )
  );
});
