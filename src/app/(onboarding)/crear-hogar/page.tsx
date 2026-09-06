"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mascota } from "@/components/ui/Mascota";
import { useAuth } from "@/hooks/useAuth";
import { crearHousehold } from "@/lib/services/household.service";
import { mensajeErrorFirebase } from "@/lib/utils/errores";

export default function CrearHogarPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [codigoGenerado, setCodigoGenerado] = useState<string | null>(null);

  async function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    if (!user) return;
    setError(null);

    if (nombre.trim().length < 2) {
      setError("Poné un nombre para tu hogar.");
      return;
    }

    setCargando(true);
    try {
      const { codigo } = await crearHousehold(user.uid, nombre.trim());
      setCodigoGenerado(codigo);
    } catch (err) {
      setError(mensajeErrorFirebase(err));
    } finally {
      setCargando(false);
    }
  }

  if (codigoGenerado) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-10 text-center">
        <Mascota size={80} className="mb-2" />
        <h1 className="font-display text-xl font-semibold text-fg">¡Tu hogar está listo!</h1>
        <p className="mt-2 max-w-xs text-sm text-fg-muted">
          Pasale este código a tu pareja para que se vincule desde su celular.
        </p>
        <p className="mt-6 rounded-2xl border-2 border-dashed border-primary bg-primary-soft px-8 py-4 text-3xl font-bold tracking-[0.3em] text-primary">
          {codigoGenerado}
        </p>
        <p className="mt-3 text-xs text-fg-muted">Válido por 7 días</p>
        <Button className="mt-8" onClick={() => router.replace("/inicio")}>
          Empezar a usar la app
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
      <Mascota size={72} className="mb-4" />
      <h1 className="font-display text-xl font-semibold text-fg">Creá tu hogar</h1>
      <p className="mt-1 mb-6 text-sm text-fg-muted">
        Es el espacio compartido donde van a vivir las listas y los gastos de los dos.
      </p>
      <form onSubmit={manejarSubmit} className="flex flex-col gap-4" noValidate>
        <Input
          label="Nombre del hogar"
          placeholder="Ej: Casa de Gastón y..."
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={60}
          required
        />
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" disabled={cargando} fullWidth>
          {cargando ? "Creando…" : "Crear hogar"}
        </Button>
      </form>
      <Button
        type="button"
        variant="ghost"
        className="mt-3"
        onClick={() => router.push("/unirse-hogar")}
      >
        Ya tengo un código de invitación
      </Button>
    </main>
  );
}
