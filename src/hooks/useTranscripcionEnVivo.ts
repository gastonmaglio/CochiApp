"use client";

import { useRef, useState } from "react";

// Transcripción en vivo puramente visual (feedback de "te estoy escuchando"), usando el
// reconocimiento de voz nativo del navegador. No reemplaza a Whisper: el resultado final que
// se clasifica con GPT sigue viniendo del audio grabado por useGrabadora. Si el navegador no
// soporta esta API (ej. Safari en iOS en modo standalone), `disponible` da false y el resto
// de la app sigue funcionando exactamente igual que antes.

interface UseTranscripcionEnVivoResult {
  disponible: boolean;
  transcripcion: string;
  iniciar: () => void;
  detener: () => void;
}

interface ResultadoReconocimiento {
  isFinal: boolean;
  length: number;
  [indice: number]: { transcript: string };
}

interface ListaResultadosReconocimiento {
  length: number;
  [indice: number]: ResultadoReconocimiento;
}

interface EventoReconocimiento {
  resultIndex: number;
  results: ListaResultadosReconocimiento;
}

interface InstanciaReconocimiento extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((evento: EventoReconocimiento) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

type ConstructorReconocimiento = new () => InstanciaReconocimiento;

function obtenerConstructor(): ConstructorReconocimiento | null {
  if (typeof window === "undefined") return null;
  const ventana = window as unknown as {
    SpeechRecognition?: ConstructorReconocimiento;
    webkitSpeechRecognition?: ConstructorReconocimiento;
  };
  return ventana.SpeechRecognition ?? ventana.webkitSpeechRecognition ?? null;
}

export function useTranscripcionEnVivo(): UseTranscripcionEnVivoResult {
  const [transcripcion, setTranscripcion] = useState("");
  const [disponible] = useState(() => obtenerConstructor() !== null);
  const reconocedorRef = useRef<InstanciaReconocimiento | null>(null);
  const escuchandoRef = useRef(false);
  const finalAcumuladoRef = useRef("");
  const ConstructorRef = useRef<ConstructorReconocimiento | null>(obtenerConstructor());

  function arrancarReconocedor() {
    const Constructor = ConstructorRef.current;
    if (!Constructor) return;

    const reconocedor = new Constructor();
    reconocedor.continuous = true;
    reconocedor.interimResults = true;
    reconocedor.lang = "es-AR";

    reconocedor.onresult = (evento) => {
      let interino = "";
      for (let i = evento.resultIndex; i < evento.results.length; i++) {
        const resultado = evento.results[i];
        const texto = resultado[0]?.transcript ?? "";
        if (resultado.isFinal) {
          finalAcumuladoRef.current = `${finalAcumuladoRef.current} ${texto}`.trim();
        } else {
          interino += texto;
        }
      }
      setTranscripcion(`${finalAcumuladoRef.current} ${interino}`.trim());
    };

    reconocedor.onerror = () => {
      // Errores puntuales (ej. "no-speech" en un silencio) se ignoran: onend decide si reintentar.
    };

    reconocedor.onend = () => {
      // Algunos navegadores cortan el reconocimiento por su cuenta después de un rato de
      // silencio aunque continuous=true — si seguimos grabando, lo reiniciamos en caliente
      // para que las pausas del usuario no corten la transcripción en vivo.
      if (escuchandoRef.current) {
        try {
          reconocedor.start();
        } catch {
          // ya estaba iniciado o el navegador lo bloqueó — no hay nada más para hacer acá
        }
      }
    };

    reconocedorRef.current = reconocedor;
    try {
      reconocedor.start();
    } catch {
      // no-op: si falla el arranque, simplemente no habrá transcripción en vivo esta vez
    }
  }

  function iniciar() {
    if (!ConstructorRef.current) return;
    finalAcumuladoRef.current = "";
    setTranscripcion("");
    escuchandoRef.current = true;
    arrancarReconocedor();
  }

  function detener() {
    escuchandoRef.current = false;
    reconocedorRef.current?.stop();
    reconocedorRef.current = null;
  }

  return { disponible, transcripcion, iniciar, detener };
}
