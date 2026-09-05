"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { PantallaCargando } from "@/components/ui/PantallaCargando";

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, usuario, cargandoAuth, cargandoUsuario } = useAuth();
  const resolviendo = cargandoAuth || (Boolean(user) && cargandoUsuario);

  // Si el usuario YA tenía un household antes de entrar acá (ej. volvió con el botón
  // atrás, o refrescó la página estando en /crear-hogar), lo mandamos a /inicio. Este
  // valor se captura una sola vez, la primera vez que hay datos reales (resolviendo pasa
  // a false), y nunca se vuelve a recalcular: si el household se crea DURANTE esta
  // sesión (ver CrearHogarPage), no nos queremos ir reactivamente — ahí se muestra el
  // código de invitación antes de que el usuario navegue por su cuenta.
  const [teniaHouseholdAlEntrar, setTeniaHouseholdAlEntrar] = useState<boolean | null>(null);
  if (!resolviendo && teniaHouseholdAlEntrar === null) {
    setTeniaHouseholdAlEntrar(Boolean(usuario?.householdId));
  }

  useEffect(() => {
    if (resolviendo) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (teniaHouseholdAlEntrar) {
      router.replace("/inicio");
    }
  }, [resolviendo, user, teniaHouseholdAlEntrar, router]);

  if (resolviendo || !user || teniaHouseholdAlEntrar) {
    return <PantallaCargando />;
  }

  return <>{children}</>;
}
