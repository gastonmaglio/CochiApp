"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db, firebaseConfigurado } from "@/lib/firebase/config";
import { asegurarUsuario } from "@/lib/services/usuarios.service";
import type { Usuario } from "@/types/usuario";
import type { Household } from "@/types/household";

interface AuthContextValue {
  user: User | null;
  usuario: Usuario | null;
  household: Household | null;
  cargandoAuth: boolean;
  cargandoUsuario: boolean;
  cargandoHousehold: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // Si Firebase no está configurado, no hay nada que esperar: arranca en false directamente.
  const [cargandoAuth, setCargandoAuth] = useState(firebaseConfigurado);

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [uidUsuarioSincronizado, setUidUsuarioSincronizado] = useState<string | null>(null);

  const [householdRaw, setHouseholdRaw] = useState<Household | null>(null);
  const [householdIdSincronizado, setHouseholdIdSincronizado] = useState<string | null>(null);

  // Auth de Firebase: fuente de verdad de "quién está logueado".
  useEffect(() => {
    if (!firebaseConfigurado) {
      console.warn(
        "Firebase no está configurado — copiá .env.example a .env.local y completá tus credenciales."
      );
      return;
    }
    const unsub = onAuthStateChanged(auth, (nuevoUser) => {
      setUser(nuevoUser);
      setCargandoAuth(false);
      if (nuevoUser) {
        void asegurarUsuario(nuevoUser);
      } else {
        setUsuario(null);
        setUidUsuarioSincronizado(null);
      }
    });
    return () => unsub();
  }, []);

  // Doc de usuarios/{uid} en tiempo real (refleja householdId apenas se vincula).
  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "usuarios", user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      setUsuario(snap.exists() ? ({ uid: snap.id, ...(snap.data() as Omit<Usuario, "uid">) }) : null);
      setUidUsuarioSincronizado(user.uid);
    });
    return () => unsub();
  }, [user]);

  // Doc de households/{id} en tiempo real.
  useEffect(() => {
    if (!usuario?.householdId) return;
    const householdId = usuario.householdId;
    const ref = doc(db, "households", householdId);

    let cancelado = false;
    let intentos = 0;
    let unsub: (() => void) | undefined;
    let reintentoTimeout: ReturnType<typeof setTimeout> | undefined;

    function suscribir() {
      unsub = onSnapshot(
        ref,
        (snap) => {
          if (cancelado) return;
          setHouseholdRaw(
            snap.exists() ? ({ id: snap.id, ...(snap.data() as Omit<Household, "id">) }) : null
          );
          setHouseholdIdSincronizado(householdId);
        },
        (error) => {
          if (cancelado) return;
          // Justo después de crear o unirse a un household, el listener puede llegar a
          // suscribirse (por el cambio local optimista de householdId) una fracción de
          // segundo antes de que el batch/transacción termine de confirmarse en el
          // servidor — el doc todavía "no existe" desde ahí y las reglas rechazan la
          // lectura. Es transitorio: reintentamos con backoff en vez de darlo por fallido.
          if (error.code === "permission-denied" && intentos < 5) {
            intentos += 1;
            reintentoTimeout = setTimeout(() => {
              if (!cancelado) suscribir();
            }, 400 * intentos);
          } else {
            console.error("Error al escuchar el household", error);
          }
        }
      );
    }

    suscribir();

    return () => {
      cancelado = true;
      if (reintentoTimeout) clearTimeout(reintentoTimeout);
      unsub?.();
    };
  }, [usuario?.householdId]);

  const cargandoUsuario = Boolean(user) && uidUsuarioSincronizado !== user?.uid;

  const householdIdActual = usuario?.householdId ?? null;
  // Si el household sincronizado no coincide con el actual (household todavía no llegó,
  // o el usuario ya no tiene householdId), no mostramos datos de un household viejo.
  const household = householdIdSincronizado === householdIdActual ? householdRaw : null;
  const cargandoHousehold = Boolean(householdIdActual) && householdIdSincronizado !== householdIdActual;

  return (
    <AuthContext.Provider
      value={{ user, usuario, household, cargandoAuth, cargandoUsuario, cargandoHousehold }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext debe usarse dentro de AuthProvider");
  return ctx;
}
