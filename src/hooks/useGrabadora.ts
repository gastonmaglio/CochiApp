"use client";

import { useRef, useState } from "react";

const DURACION_MAXIMA_SEGUNDOS = 90;

export type EstadoGrabadora = "inactivo" | "grabando" | "procesando";

interface UseGrabadoraResult {
  estado: EstadoGrabadora;
  segundos: number;
  iniciar: () => Promise<void>;
  detener: () => Promise<Blob | null>;
  cancelar: () => void;
  // Volver a "inactivo" después de que quien use el hook terminó de procesar el blob
  // (haya salido bien o mal) — el hook no sabe cuándo termina esa parte externa.
  reiniciar: () => void;
  error: string | null;
}

export function useGrabadora(): UseGrabadoraResult {
  const [estado, setEstado] = useState<EstadoGrabadora>("inactivo");
  const [segundos, setSegundos] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function limpiar() {
    if (intervaloRef.current) clearInterval(intervaloRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    mediaRecorderRef.current = null;
    setSegundos(0);
  }

  async function iniciar() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (evento) => {
        if (evento.data.size > 0) chunksRef.current.push(evento.data);
      };
      recorder.start();
      setEstado("grabando");

      intervaloRef.current = setInterval(() => {
        setSegundos((actual) => {
          if (actual + 1 >= DURACION_MAXIMA_SEGUNDOS) {
            detener();
          }
          return actual + 1;
        });
      }, 1000);
    } catch {
      setError("No se pudo acceder al micrófono. Revisá los permisos de la app.");
      setEstado("inactivo");
    }
  }

  function detener(): Promise<Blob | null> {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        limpiar();
        resolve(null);
        return;
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        limpiar();
        setEstado("procesando");
        resolve(blob);
      };
      recorder.stop();
    });
  }

  function cancelar() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") {
      recorder.onstop = null;
      recorder.stop();
    }
    limpiar();
    setEstado("inactivo");
  }

  function reiniciar() {
    setEstado("inactivo");
    setError(null);
  }

  return { estado, segundos, iniciar, detener, cancelar, reiniciar, error };
}
