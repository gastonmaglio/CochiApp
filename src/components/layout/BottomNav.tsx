"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBasket, ListChecks, Wallet, PieChart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const ITEMS = [
  { href: "/inicio", label: "Inicio", Icono: Home },
  { href: "/listas", label: "Listas", Icono: ShoppingBasket },
  { href: "/tareas", label: "Tareas", Icono: ListChecks },
  { href: "/gastos", label: "Gastos", Icono: Wallet },
  { href: "/resumen", label: "Resumen", Icono: PieChart },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg-elevated pb-[env(safe-area-inset-bottom)]"
      aria-label="Navegación principal"
    >
      <ul className="mx-auto flex max-w-md">
        {ITEMS.map((item) => {
          const activo = pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={activo ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors",
                  activo ? "text-primary" : "text-fg-muted"
                )}
              >
                <item.Icono size={22} strokeWidth={activo ? 2.4 : 2} aria-hidden="true" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
