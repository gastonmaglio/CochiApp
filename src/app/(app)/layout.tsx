"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BottomNav } from "@/components/layout/BottomNav";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PantallaCargando } from "@/components/ui/PantallaCargando";
import { Mascota } from "@/components/ui/Mascota";

// El detalle de una lista maneja su propio header (con volver) y su propia barra
// fija (agregar item) — el chrome global (header de hogar + bottom nav) sobraría ahí.
// Las pantallas de "Tu hogar", categorías e historial también tienen su propio
// header (con volver).
const RUTAS_SIN_CHROME = [
  /^\/listas\/[^/]+$/,
  /^\/hogar$/,
  /^\/hogar\/categorias$/,
  /^\/privado$/,
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, usuario, household, cargandoAuth, cargandoUsuario } = useAuth();
  const resolviendo = cargandoAuth || (Boolean(user) && cargandoUsuario);
  const faltaHousehold = Boolean(usuario) && !usuario?.householdId;

  useEffect(() => {
    if (resolviendo) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (faltaHousehold) {
      router.replace("/crear-hogar");
    }
  }, [resolviendo, user, faltaHousehold, router]);

  if (resolviendo || !user || faltaHousehold) {
    return <PantallaCargando />;
  }

  const sinChrome = RUTAS_SIN_CHROME.some((patron) => patron.test(pathname));

  if (sinChrome) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-border bg-bg-elevated px-4 py-3">
        <Link href="/hogar" className="flex min-w-0 flex-1 items-center gap-2 py-1">
          <Mascota size={28} />
          <span className="truncate text-sm font-medium text-fg">
            {household?.nombre ?? "CochiApp"}
          </span>
          <ChevronRight size={16} className="shrink-0 text-fg-muted" aria-hidden="true" />
        </Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
        </div>
      </header>
      <div className="flex-1 overflow-y-auto pb-20">{children}</div>
      <BottomNav />
    </div>
  );
}
