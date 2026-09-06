import { NextResponse } from "next/server";
import { esMiembroDelHousehold, verificarIdToken } from "@/lib/server/verificarIdToken";

// Este endpoint gasta plata real (OpenAI) por cada llamada — por eso la verificación de
// arriba (token válido + es miembro del household que dice) no es opcional: el repo es
// público, cualquiera puede leer esta ruta en GitHub.
const TAMANO_MAXIMO_AUDIO = 10 * 1024 * 1024; // 10 MB — de sobra para una nota de voz corta

interface ItemExtraido {
  nombre: string;
  cantidad: string | null;
  categoria: string;
}

interface GastoExtraido {
  descripcion: string;
  monto: number;
  categoria: string;
}

interface TareaExtraida {
  titulo: string;
  fechaVencimiento: string | null;
}

type ContenidoExtraido =
  | { tipo: "lista"; nombreLista: string; items: ItemExtraido[] }
  | { tipo: "gasto"; gasto: GastoExtraido }
  | { tipo: "tarea"; tarea: TareaExtraida };

export async function POST(request: Request): Promise<NextResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "El servidor no tiene configurada la clave de OpenAI." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ error: "Falta autenticación." }, { status: 401 });
  }

  let uid: string;
  try {
    uid = await verificarIdToken(idToken);
  } catch {
    return NextResponse.json({ error: "Sesión inválida o vencida." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "No se pudo leer el audio enviado." }, { status: 400 });
  }

  const householdId = formData.get("householdId");
  const categoriasComprasRaw = formData.get("categoriasCompras");
  const categoriasGastosRaw = formData.get("categoriasGastos");
  const audio = formData.get("audio");

  if (
    typeof householdId !== "string" ||
    typeof categoriasComprasRaw !== "string" ||
    typeof categoriasGastosRaw !== "string" ||
    !(audio instanceof Blob)
  ) {
    return NextResponse.json({ error: "Faltan datos en la solicitud." }, { status: 400 });
  }

  if (audio.size === 0) {
    return NextResponse.json({ error: "El audio llegó vacío. Probá grabar de nuevo." }, { status: 400 });
  }
  if (audio.size > TAMANO_MAXIMO_AUDIO) {
    return NextResponse.json({ error: "El audio es demasiado largo." }, { status: 400 });
  }

  const esMiembro = await esMiembroDelHousehold(idToken, householdId, uid).catch(() => false);
  if (!esMiembro) {
    return NextResponse.json({ error: "No pertenecés a ese hogar." }, { status: 403 });
  }

  let categoriasCompras: string[];
  let categoriasGastos: string[];
  try {
    categoriasCompras = JSON.parse(categoriasComprasRaw);
    categoriasGastos = JSON.parse(categoriasGastosRaw);
    if (!Array.isArray(categoriasCompras) || !Array.isArray(categoriasGastos)) {
      throw new Error("no son arrays");
    }
  } catch {
    return NextResponse.json({ error: "Lista de categorías inválida." }, { status: 400 });
  }

  try {
    const transcripcion = await transcribirAudio(audio, apiKey);
    if (!transcripcion.trim()) {
      return NextResponse.json(
        { error: "No se entendió nada en el audio. Probá de nuevo, más cerca del micrófono." },
        { status: 422 }
      );
    }
    const contenido = await extraerContenido(transcripcion, categoriasCompras, categoriasGastos, apiKey);
    return NextResponse.json({ transcripcion, ...contenido });
  } catch (error) {
    console.error("Error procesando audio de voz:", error);
    return NextResponse.json({ error: "No se pudo procesar el audio. Probá de nuevo en un momento." }, { status: 502 });
  }
}

async function transcribirAudio(audio: Blob, apiKey: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", audio, "audio.webm");
  formData.append("model", "whisper-1");
  formData.append("language", "es");

  const respuesta = await fetch("https://api.openai.com/v1/audio/transcriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!respuesta.ok) {
    throw new Error(`Whisper respondió ${respuesta.status}: ${await respuesta.text()}`);
  }
  const datos = (await respuesta.json()) as { text: string };
  return datos.text;
}

async function extraerContenido(
  transcripcion: string,
  categoriasCompras: string[],
  categoriasGastos: string[],
  apiKey: string
): Promise<ContenidoExtraido> {
  const listaCategoriasCompras = categoriasCompras.length > 0 ? categoriasCompras.join(", ") : "Otros";
  const listaCategoriasGastos = categoriasGastos.length > 0 ? categoriasGastos.join(", ") : "Otros";
  const hoy = new Date().toISOString().slice(0, 10);
  const diaSemanaHoy = new Intl.DateTimeFormat("es-AR", { weekday: "long" }).format(new Date());

  const respuesta = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      max_tokens: 700,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "Sos un asistente de una app de hogar compartido (listas de compras, tareas y gastos), en español argentino.",
            `Hoy es ${diaSemanaHoy} ${hoy} (formato AAAA-MM-DD) — usalo para resolver fechas relativas como "mañana" o "el jueves".`,
            "Recibís la transcripción de un audio corto y decidís de qué se trata, entre tres opciones:",
            '(a) una LISTA DE COMPRAS (se nombran productos, sin montos de dinero por cada uno)',
            "(b) el registro de UN GASTO puntual (un monto de dinero pegado a un concepto)",
            '(c) una TAREA del hogar ("recordame...", "hay que...", "tengo que...", "creá una tarea para...")',
            "",
            "--- (a) LISTA DE COMPRAS ---",
            "Para cada producto indicá su nombre (singular, sin la cantidad en el texto), la cantidad si se " +
              'dijo (ej: "2 kg", "una docena", o null si no se dijo), y a cuál de estas categorías de compra ' +
              `pertenece: ${listaCategoriasCompras}. Si ninguna encaja, usá "Otros". Separá bien los productos ` +
              "aunque se hayan dicho todos seguidos en una sola frase.",
            'Además, sugerí un nombre corto para la lista (2-3 palabras, ej: "Supermercado", "Farmacia", ' +
              '"Ferretería") según lo que se está comprando — si no hay pistas claras, "Lista de compras".',
            'Respondé exactamente: {"tipo": "lista", "nombreLista": string, "items": [{"nombre": string, "cantidad": string|null, "categoria": string}]}',
            "",
            "--- (b) GASTO ---",
            "La palabra \"gasto\" puede aparecer en cualquier posición de la frase o directamente no decirse — " +
              "lo que importa es el patrón (un monto de dinero pegado a un concepto), no una palabra mágica. " +
              'Todas estas formas significan lo mismo: "anotá gasto luz 35 mil", "anotá un gasto de luz de 35 ' +
              'mil", "luz, 35 mil, gasto", "luz, 35 mil pesos" (sin decir "gasto"), "gasté 35 mil en luz", ' +
              '"pagué la luz, 35 mil".',
            "Extraé: una descripción corta (2-4 palabras, sin el monto), el monto en pesos argentinos como " +
              "número (sin puntos de miles, sin el símbolo $, ej. 35000 no 35.000), y a cuál de estas " +
              `categorías de gasto pertenece: ${listaCategoriasGastos}. Si ninguna encaja, "Otros".`,
            'Respondé exactamente: {"tipo": "gasto", "gasto": {"descripcion": string, "monto": number, "categoria": string}}',
            "",
            "--- (c) TAREA ---",
            "Extraé un título corto y claro (sin las palabras de comando tipo \"recordame\" o \"hay que\"), y " +
              "si se mencionó una fecha (hoy, mañana, un día de la semana, una fecha puntual), convertila a " +
              "AAAA-MM-DD usando la fecha de hoy de arriba como referencia; si no se mencionó ninguna fecha, null.",
            'Respondé exactamente: {"tipo": "tarea", "tarea": {"titulo": string, "fechaVencimiento": string|null}}',
            "",
            "Respondé SOLO con el JSON, sin texto extra.",
          ].join("\n"),
        },
        { role: "user", content: transcripcion },
      ],
    }),
  });

  if (!respuesta.ok) {
    throw new Error(`Chat completions respondió ${respuesta.status}: ${await respuesta.text()}`);
  }

  const datos = await respuesta.json();
  const contenidoTexto = datos.choices?.[0]?.message?.content ?? "{}";
  const parseado = JSON.parse(contenidoTexto);

  if (parseado.tipo === "gasto" && parseado.gasto) {
    return {
      tipo: "gasto",
      gasto: {
        descripcion: String(parseado.gasto.descripcion ?? "Gasto"),
        monto: Number(parseado.gasto.monto) || 0,
        categoria: String(parseado.gasto.categoria ?? "Otros"),
      },
    };
  }

  if (parseado.tipo === "tarea" && parseado.tarea) {
    return {
      tipo: "tarea",
      tarea: {
        titulo: String(parseado.tarea.titulo ?? "Tarea"),
        fechaVencimiento:
          typeof parseado.tarea.fechaVencimiento === "string" ? parseado.tarea.fechaVencimiento : null,
      },
    };
  }

  const items = Array.isArray(parseado.items) ? parseado.items : [];
  return {
    tipo: "lista",
    nombreLista: String(parseado.nombreLista ?? "Lista de compras"),
    items,
  };
}
