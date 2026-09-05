"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PantallaCargando } from "@/components/ui/PantallaCargando";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, usuario, cargandoAuth, cargandoUsuario } = useAuth();
  const resolviendo = cargandoAuth || (Boolean(user) && cargandoUsuario);

  // Redirigimos una sola vez por login/registro exitoso. Si no se limitara a una vez,
  // este efecto puede quedar reaccionando a cambios de "usuario" (ej. cuando el usuario
  // crea su household unos segundos después, ya en /crear-hogar) y mandarlo de vuelta a
  // /listas salteándose la pantalla del código de invitación — el mismo problema que
  // OnboardingLayout tenía con su propio redirect reactivo.
  const yaRedirigio = useRef(false);

  useEffect(() => {
    if (resolviendo || !user || yaRedirigio.current) return;
    yaRedirigio.current = true;
    router.replace(usuario?.householdId ? "/inicio" : "/crear-hogar");
  }, [resolviendo, user, usuario, router]);

  if (!resolviendo && user) {
    return <PantallaCargando />;
  }

  return <>{children}</>;
}
