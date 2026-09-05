const MENSAJES_FIREBASE: Record<string, string> = {
  "auth/email-already-in-use": "Ese email ya tiene una cuenta. Probá iniciar sesión.",
  "auth/invalid-email": "El email no es válido.",
  "auth/weak-password": "La contraseña tiene que tener al menos 6 caracteres.",
  "auth/wrong-password": "Contraseña incorrecta.",
  "auth/invalid-credential": "Email o contraseña incorrectos.",
  "auth/user-not-found": "No encontramos una cuenta con ese email.",
  "auth/too-many-requests": "Demasiados intentos. Esperá un momento y probá de nuevo.",
  "auth/popup-closed-by-user": "Cerraste la ventana de Google antes de terminar.",
  "auth/popup-blocked": "El navegador bloqueó la ventana de Google. Habilitá los popups e intentá de nuevo.",
  "auth/network-request-failed": "Sin conexión a internet. Revisá tu red e intentá de nuevo.",
  "permission-denied": "No tenés permiso para hacer esto.",
  unavailable: "No hay conexión con el servidor. Se va a sincronizar cuando vuelva la señal.",
};

export function mensajeErrorFirebase(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    const codigo = (error as { code: unknown }).code;
    if (typeof codigo === "string" && MENSAJES_FIREBASE[codigo]) {
      return MENSAJES_FIREBASE[codigo];
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return "Algo salió mal. Intentá de nuevo.";
}
