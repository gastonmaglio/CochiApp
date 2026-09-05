"use client";

import { useSyncExternalStore } from "react";

function suscribirse(callback: () => void): () => void {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function obtenerSnapshot(): boolean {
  return navigator.onLine;
}

function obtenerSnapshotServidor(): boolean {
  return true;
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(suscribirse, obtenerSnapshot, obtenerSnapshotServidor);
}
