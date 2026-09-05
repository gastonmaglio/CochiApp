import { type FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  type Firestore,
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Si falta configurar .env.local (ver .env.example), no inicializamos Firebase de una:
// AuthContext usa este flag para tratar el estado como "no logueado" en vez de crashear
// toda la app con un error críptico de Firebase.
export const firebaseConfigurado = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

function crearApp(): FirebaseApp | null {
  if (!firebaseConfigurado) return null;
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

const firebaseApp = crearApp();

function crearFirestore(app: FirebaseApp | null): Firestore | null {
  if (!app) return null;
  if (typeof window === "undefined") {
    return getFirestore(app);
  }
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch {
    // Ya fue inicializado antes en esta sesión (ej. Fast Refresh) — reusamos la instancia.
    return getFirestore(app);
  }
}

// Sin configurar, estos quedan en null — pero solo se usan desde código que ya chequeó
// firebaseConfigurado antes (ver AuthContext), así que tipamos como no-null para no
// tener que guardar el resto de los call sites contra un caso que no puede ocurrir ahí.
export const db = crearFirestore(firebaseApp) as Firestore;
export const auth = (firebaseApp ? getAuth(firebaseApp) : null) as Auth;
