import { createRemoteJWKSet, jwtVerify } from "jose";

// Verifica un ID token de Firebase Auth SIN el Admin SDK (que pediría otra credencial
// más, un service account). Los tokens de Firebase son JWT estándar firmados por Google
// — alcanza con validar la firma contra las claves públicas de Google y chequear
// issuer/audience/expiración, que es exactamente lo que hace el Admin SDK por dentro.
const JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

/**
 * Devuelve el uid si el token es válido y fue emitido para este proyecto de Firebase.
 * Tira si el token es inválido, venció, o es de otro proyecto.
 */
export async function verificarIdToken(idToken: string): Promise<string> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) throw new Error("Falta NEXT_PUBLIC_FIREBASE_PROJECT_ID en el servidor.");

  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
  });

  if (typeof payload.sub !== "string" || !payload.sub) {
    throw new Error("Token sin uid.");
  }
  return payload.sub;
}

/**
 * Confirma que el uid realmente pertenece al household que dice — usando la API REST
 * de Firestore con el MISMO idToken (así respeta las reglas de seguridad ya escritas,
 * sin necesitar credenciales de admin nuevas). Evita que una cuenta cualquiera (crear
 * una cuenta en la app es gratis y público) use el endpoint pago sin ser parte de un
 * hogar real.
 */
export async function esMiembroDelHousehold(
  idToken: string,
  householdId: string,
  uid: string
): Promise<boolean> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) return false;

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/households/${householdId}`;
  const respuesta = await fetch(url, {
    headers: { Authorization: `Bearer ${idToken}` },
  });
  if (!respuesta.ok) return false;

  const datos = await respuesta.json();
  const miembros: string[] =
    datos?.fields?.miembros?.arrayValue?.values?.map((v: { stringValue: string }) => v.stringValue) ?? [];
  return miembros.includes(uid);
}
