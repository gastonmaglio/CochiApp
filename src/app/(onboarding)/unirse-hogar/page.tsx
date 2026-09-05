"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mascota } from "@/components/ui/Mascota";
import { useAuth } from "@/hooks/useAuth";
import { useMiembrosHousehold } from "@/hooks/useMiembrosHousehold";
import {
  MAX_MIEMBROS,
  obtenerInfoCodigoInvitacion,
  reemplazarMiembro,
  unirseHousehold,
  type InfoCodigoInvitacion,
} from "@/lib/services/household.service";
import { mensajeErrorFirebase } from "@/lib/utils/errores";

export default function UnirseHogarPage() {
  const router = useRouter();
  const { user, usuario } = useAuth();
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [unido, setUnido] = useState(false);
  const [infoCodigo, setInfoCodigo] = useState<InfoCodigoInvitacion | null>(null);

  const usuarios = useMiembrosHousehold(infoCodigo?.miembros ?? []);

  // No navegamos apenas se resuelve la promesa de unirse/reemplazar: el contexto de auth
  // (que es lo que AppLayout usa para decidir si dejarte pasar a /inicio) puede tardar un
  // instante más en reflejar el householdId nuevo. Si navegáramos antes, AppLayout podría
  // leer el estado viejo y rebotarte de vuelta a /crear-hogar. Esperamos a que "usuario"
  // realmente lo confirme antes de movernos.
  useEffect(() => {
    if (unido && usuario?.householdId) {
      router.replace("/inicio");
    }
  }, [unido, usuario, router]);

  async function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    if (!user) return;
    setError(null);

    if (codigo.trim().length !== 6) {
      setError("El código tiene 6 caracteres.");
      return;
    }

    setCargando(true);
    try {
      const info = await obtenerInfoCodigoInvitacion(codigo.trim());
      if (info.miembros.length < MAX_MIEMBROS) {
        await unirseHousehold(user.uid, codigo.trim());
        setUnido(true);
        return;
      }
      // El hogar ya tiene 2 integrantes — probablemente uno de los dos perdió el acceso
      // a su cuenta vieja. En vez de bloquear, dejamos elegir a quién se está reemplazando.
      setInfoCodigo(info);
    } catch (err) {
      setError(mensajeErrorFirebase(err));
    } finally {
      setCargando(false);
    }
  }

  async function manejarElegirReemplazo(uidAReemplazar: string) {
    if (!user || !infoCodigo) return;
    setError(null);
    setCargando(true);
    try {
      await reemplazarMiembro(user.uid, codigo.trim(), uidAReemplazar);
      setUnido(true);
    } catch (err) {
      setError(mensajeErrorFirebase(err));
      setCargando(false);
    }
  }

  if (infoCodigo) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
        <Mascota size={72} className="mb-4" />
        <h1 className="text-xl font-semibold text-fg">
          &ldquo;{infoCodigo.householdNombre}&rdquo; ya tiene 2 personas
        </h1>
        <p className="mt-1 mb-6 text-sm text-fg-muted">
          Si volviste a entrar con una cuenta o un dispositivo nuevo, elegí tu lugar para
          recuperarlo. Esto reemplaza a esa persona por vos en el hogar.
        </p>
        <div className="flex flex-col gap-2">
          {infoCodigo.miembros.map((uid) => (
            <button
              key={uid}
              type="button"
              disabled={cargando}
              onClick={() => manejarElegirReemplazo(uid)}
              className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3 text-left disabled:opacity-50"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {(usuarios[uid]?.nombre ?? "?").charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-fg">
                Soy {usuarios[uid]?.nombre ?? "esta persona"}
              </span>
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {error}
          </p>
        )}
        <Button
          type="button"
          variant="ghost"
          className="mt-4"
          onClick={() => {
            setInfoCodigo(null);
            setCodigo("");
          }}
        >
          Volver a ingresar el código
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
      <Mascota size={72} className="mb-4" />
      <h1 className="text-xl font-semibold text-fg">Unite a un hogar</h1>
      <p className="mt-1 mb-6 text-sm text-fg-muted">
        Ingresá el código de 6 caracteres que te pasó tu pareja.
      </p>
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Código de invitación"
          placeholder="Ej: A3F9K2"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          maxLength={6}
          autoCapitalize="characters"
          className="text-center text-lg uppercase tracking-[0.3em]"
          required
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={cargando} fullWidth>
          {cargando ? "Un momento…" : "Unirme al hogar"}
        </Button>
      </form>
      <Button
        type="button"
        variant="ghost"
        className="mt-3"
        onClick={() => router.push("/crear-hogar")}
      >
        Prefiero crear un hogar nuevo
      </Button>
    </main>
  );
}
