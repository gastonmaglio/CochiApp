"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function ConnectionBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div
      role="status"
      className="w-full bg-warning px-3 py-1.5 text-center text-xs font-medium text-white"
    >
      Sin conexión — los cambios se guardan y sincronizan solos
    </div>
  );
}
