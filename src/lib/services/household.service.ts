import {
  collection,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  CATEGORIAS_COMPRAS_PREDEFINIDAS,
  CATEGORIAS_GASTOS_PREDEFINIDAS,
} from "@/lib/constants/categorias";

const ALFABETO_CODIGO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I/L, ambiguos al leerlos
const DIAS_VALIDEZ_CODIGO = 7;
export const MAX_MIEMBROS = 2;

type CodigoErrorHousehold =
  | "CODIGO_INVALIDO"
  | "CODIGO_USADO"
  | "CODIGO_EXPIRADO"
  | "HOUSEHOLD_COMPLETO"
  | "YA_ES_MIEMBRO";

export class ErrorHousehold extends Error {
  codigo: CodigoErrorHousehold;

  constructor(codigo: CodigoErrorHousehold, mensaje: string) {
    super(mensaje);
    this.name = "ErrorHousehold";
    this.codigo = codigo;
  }
}

function generarCodigo(): string {
  let codigo = "";
  for (let i = 0; i < 6; i++) {
    codigo += ALFABETO_CODIGO[Math.floor(Math.random() * ALFABETO_CODIGO.length)];
  }
  return codigo;
}

async function generarCodigoUnico(): Promise<string> {
  for (let intento = 0; intento < 8; intento++) {
    const codigo = generarCodigo();
    const snap = await getDoc(doc(db, "codigosInvitacion", codigo));
    if (!snap.exists()) return codigo;
  }
  throw new Error("No se pudo generar un código de invitación. Probá de nuevo.");
}

function sembrarCategorias(
  batch: ReturnType<typeof writeBatch>,
  householdId: string,
  uid: string
): void {
  CATEGORIAS_COMPRAS_PREDEFINIDAS.forEach((categoria, index) => {
    const ref = doc(collection(db, "households", householdId, "categoriasCompras"));
    batch.set(ref, {
      ...categoria,
      predefinida: true,
      orden: index,
      creadoPor: uid,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  });

  CATEGORIAS_GASTOS_PREDEFINIDAS.forEach((categoria, index) => {
    const ref = doc(collection(db, "households", householdId, "categoriasGastos"));
    batch.set(ref, {
      ...categoria,
      predefinida: true,
      orden: index,
      creadoPor: uid,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
  });
}

export async function crearHousehold(
  uid: string,
  nombre: string
): Promise<{ householdId: string; codigo: string }> {
  const householdRef = doc(collection(db, "households"));
  const codigo = await generarCodigoUnico();

  // Paso 1: crear el household + código de invitación + vincular al usuario, en un solo
  // batch. Ninguna de estas tres escrituras depende de LEER otro documento en las reglas
  // de seguridad (cada una se valida contra sus propios datos o el uid del request), así
  // que no hay problema en que viajen juntas de forma atómica.
  const batchInicial = writeBatch(db);

  batchInicial.set(householdRef, {
    nombre,
    miembros: [uid],
    codigoActivo: codigo,
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });

  const expiraEn = Timestamp.fromMillis(Date.now() + DIAS_VALIDEZ_CODIGO * 24 * 60 * 60 * 1000);
  batchInicial.set(doc(db, "codigosInvitacion", codigo), {
    householdId: householdRef.id,
    usado: false,
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    expiraEn,
  });

  batchInicial.update(doc(db, "usuarios", uid), {
    householdId: householdRef.id,
    actualizadoEn: serverTimestamp(),
  });

  await batchInicial.commit();

  // Paso 2: recién ahora que el household existe CONFIRMADO en el servidor, sembramos
  // las categorías predefinidas. Sus reglas de seguridad sí necesitan leer el household
  // padre (esMiembroDelHousehold hace un get() para chequear membresía) — si esto viajara
  // en el MISMO batch que el paso 1, esa lectura no vería la escritura hermana todavía no
  // confirmada y Firestore rechazaría el batch entero con "permission-denied".
  const batchCategorias = writeBatch(db);
  sembrarCategorias(batchCategorias, householdRef.id, uid);
  await batchCategorias.commit();

  return { householdId: householdRef.id, codigo };
}

/**
 * Genera un código de invitación nuevo para un hogar YA EXISTENTE — para cuando el código
 * original venció o simplemente no se guardó (antes no había forma de volver a verlo).
 */
export async function generarNuevoCodigoInvitacion(
  householdId: string,
  uid: string
): Promise<string> {
  const codigo = await generarCodigoUnico();
  const expiraEn = Timestamp.fromMillis(Date.now() + DIAS_VALIDEZ_CODIGO * 24 * 60 * 60 * 1000);
  const batch = writeBatch(db);

  batch.set(doc(db, "codigosInvitacion", codigo), {
    householdId,
    usado: false,
    creadoPor: uid,
    creadoEn: serverTimestamp(),
    expiraEn,
  });
  batch.update(doc(db, "households", householdId), {
    codigoActivo: codigo,
    actualizadoEn: serverTimestamp(),
  });

  await batch.commit();
  return codigo;
}

export async function editarNombreHousehold(householdId: string, nombre: string): Promise<void> {
  await updateDoc(doc(db, "households", householdId), {
    nombre,
    actualizadoEn: serverTimestamp(),
  });
}

export interface InfoCodigoInvitacion {
  householdId: string;
  householdNombre: string;
  miembros: string[];
}

/**
 * Chequeo de solo lectura, sin consumir el código todavía. Sirve para que la UI decida
 * si corresponde un "unirse" normal (hay lugar) o un "reemplazar a alguien" (el hogar ya
 * tiene 2 miembros — típicamente porque alguien perdió el acceso a su cuenta vieja).
 */
export async function obtenerInfoCodigoInvitacion(
  codigoIngresado: string
): Promise<InfoCodigoInvitacion> {
  const codigo = codigoIngresado.trim().toUpperCase();
  const codigoSnap = await getDoc(doc(db, "codigosInvitacion", codigo));
  if (!codigoSnap.exists()) {
    throw new ErrorHousehold("CODIGO_INVALIDO", "Ese código no existe. Revisalo con tu pareja.");
  }
  const datosCodigo = codigoSnap.data();
  if (datosCodigo.usado) {
    throw new ErrorHousehold("CODIGO_USADO", "Ese código ya fue usado. Pedile uno nuevo a tu pareja.");
  }
  if ((datosCodigo.expiraEn as Timestamp).toMillis() < Date.now()) {
    throw new ErrorHousehold("CODIGO_EXPIRADO", "Ese código venció. Pedile uno nuevo a tu pareja.");
  }
  const householdRef = doc(db, "households", datosCodigo.householdId as string);
  const householdSnap = await getDoc(householdRef);
  if (!householdSnap.exists()) {
    throw new ErrorHousehold("CODIGO_INVALIDO", "El hogar de ese código ya no existe.");
  }
  const datosHousehold = householdSnap.data();
  return {
    householdId: householdRef.id,
    householdNombre: datosHousehold.nombre as string,
    miembros: (datosHousehold.miembros as string[]) ?? [],
  };
}

/**
 * Para cuando el hogar ya tiene los 2 miembros pero uno de ellos perdió el acceso a su
 * cuenta (o simplemente limpió el navegador y quedó con una sesión nueva) — en vez de
 * bloquear la entrada, reemplaza a ese integrante por el uid actual.
 */
export async function reemplazarMiembro(
  uid: string,
  codigoIngresado: string,
  uidAReemplazar: string
): Promise<string> {
  const codigo = codigoIngresado.trim().toUpperCase();
  const codigoRef = doc(db, "codigosInvitacion", codigo);

  return runTransaction(db, async (tx) => {
    const codigoSnap = await tx.get(codigoRef);
    if (!codigoSnap.exists()) {
      throw new ErrorHousehold("CODIGO_INVALIDO", "Ese código no existe. Revisalo con tu pareja.");
    }

    const datosCodigo = codigoSnap.data();
    if (datosCodigo.usado) {
      throw new ErrorHousehold("CODIGO_USADO", "Ese código ya fue usado. Pedile uno nuevo a tu pareja.");
    }
    if ((datosCodigo.expiraEn as Timestamp).toMillis() < Date.now()) {
      throw new ErrorHousehold("CODIGO_EXPIRADO", "Ese código venció. Pedile uno nuevo a tu pareja.");
    }

    const householdRef = doc(db, "households", datosCodigo.householdId as string);
    const householdSnap = await tx.get(householdRef);
    if (!householdSnap.exists()) {
      throw new ErrorHousehold("CODIGO_INVALIDO", "El hogar de ese código ya no existe.");
    }

    const miembros = (householdSnap.data().miembros as string[]) ?? [];
    if (miembros.includes(uid)) {
      throw new ErrorHousehold("YA_ES_MIEMBRO", "Ya formás parte de este hogar.");
    }
    if (!miembros.includes(uidAReemplazar)) {
      throw new ErrorHousehold("CODIGO_INVALIDO", "Ese integrante ya no está en el hogar.");
    }

    const nuevosMiembros = miembros.map((m) => (m === uidAReemplazar ? uid : m));

    tx.update(householdRef, {
      miembros: nuevosMiembros,
      codigoActivo: null,
      actualizadoEn: serverTimestamp(),
    });
    tx.update(codigoRef, { usado: true });
    tx.update(doc(db, "usuarios", uid), {
      householdId: householdRef.id,
      actualizadoEn: serverTimestamp(),
    });

    return householdRef.id;
  });
}

export async function unirseHousehold(uid: string, codigoIngresado: string): Promise<string> {
  const codigo = codigoIngresado.trim().toUpperCase();
  const codigoRef = doc(db, "codigosInvitacion", codigo);

  return runTransaction(db, async (tx) => {
    const codigoSnap = await tx.get(codigoRef);
    if (!codigoSnap.exists()) {
      throw new ErrorHousehold("CODIGO_INVALIDO", "Ese código no existe. Revisalo con tu pareja.");
    }

    const datosCodigo = codigoSnap.data();
    if (datosCodigo.usado) {
      throw new ErrorHousehold("CODIGO_USADO", "Ese código ya fue usado. Pedile uno nuevo a tu pareja.");
    }
    if ((datosCodigo.expiraEn as Timestamp).toMillis() < Date.now()) {
      throw new ErrorHousehold("CODIGO_EXPIRADO", "Ese código venció. Pedile uno nuevo a tu pareja.");
    }

    const householdRef = doc(db, "households", datosCodigo.householdId as string);
    const householdSnap = await tx.get(householdRef);
    if (!householdSnap.exists()) {
      throw new ErrorHousehold("CODIGO_INVALIDO", "El hogar de ese código ya no existe.");
    }

    const miembros = (householdSnap.data().miembros as string[]) ?? [];
    if (miembros.includes(uid)) {
      throw new ErrorHousehold("YA_ES_MIEMBRO", "Ya formás parte de este hogar.");
    }
    if (miembros.length >= MAX_MIEMBROS) {
      throw new ErrorHousehold("HOUSEHOLD_COMPLETO", "Ese hogar ya tiene dos personas vinculadas.");
    }

    tx.update(householdRef, {
      miembros: [...miembros, uid],
      // El hogar ya queda completo (máximo 2 integrantes) — ningún código sirve más.
      codigoActivo: null,
      actualizadoEn: serverTimestamp(),
    });
    tx.update(codigoRef, { usado: true });
    tx.update(doc(db, "usuarios", uid), {
      householdId: householdRef.id,
      actualizadoEn: serverTimestamp(),
    });

    return householdRef.id;
  });
}
