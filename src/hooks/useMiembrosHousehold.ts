"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import type { Usuario } from "@/types/usuario";

export function useMiembrosHousehold(miembros: string[]): Record<string, Usuario> {
  const [usuarios, setUsuarios] = useState<Record<string, Usuario>>({});
  const clave = miembros.join(",");

  useEffect(() => {
    if (!clave) return;
    const uids = clave.split(",");
    const unsubs = uids.map((uid) =>
      onSnapshot(doc(db, "usuarios", uid), (snap) => {
        if (!snap.exists()) return;
        setUsuarios((actual) => ({
          ...actual,
          [uid]: { uid: snap.id, ...(snap.data() as Omit<Usuario, "uid">) },
        }));
      })
    );
    return () => unsubs.forEach((unsub) => unsub());
  }, [clave]);

  return usuarios;
}
