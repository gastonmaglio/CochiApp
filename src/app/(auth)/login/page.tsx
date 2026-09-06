"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mascota } from "@/components/ui/Mascota";
import {
  iniciarSesionConEmail,
  iniciarSesionConGoogle,
  registrarseConEmail,
} from "@/lib/firebase/auth";
import { asegurarUsuario } from "@/lib/services/usuarios.service";
import { cn } from "@/lib/utils/cn";
import { mensajeErrorFirebase } from "@/lib/utils/errores";

type Modo = "ingresar" | "registrarse";

export default function LoginPage() {
  const [modo, setModo] = useState<Modo>("ingresar");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(evento: FormEvent) {
    evento.preventDefault();
    setError(null);

    if (modo === "registrarse" && nombre.trim().length < 2) {
      setError("Ingresá tu nombre.");
      return;
    }

    setCargando(true);
    try {
      if (modo === "registrarse") {
        const user = await registrarseConEmail(nombre.trim(), email.trim(), password);
        await asegurarUsuario(user, nombre.trim());
      } else {
        await iniciarSesionConEmail(email.trim(), password);
      }
      // No navegamos acá a mano: AuthLayout reacciona a "usuario" y decide correctamente
      // entre /listas o /crear-hogar según si ya tiene household. Navegar acá también
      // (a un destino fijo) es redundante y, peor, corría el riesgo de ejecutarse tarde
      // (si asegurarUsuario tardaba) y pisar la navegación real varios pasos después.
    } catch (err) {
      setError(mensajeErrorFirebase(err));
    } finally {
      setCargando(false);
    }
  }

  async function manejarGoogle() {
    setError(null);
    setCargando(true);
    try {
      const user = await iniciarSesionConGoogle();
      await asegurarUsuario(user);
      // Ídem: AuthLayout se encarga de a dónde navegar.
    } catch (err) {
      setError(mensajeErrorFirebase(err));
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center px-6 py-10">
      <div className="mb-8 flex flex-col items-center text-center">
        <Mascota size={88} className="mb-2" />
        <h1 className="font-display text-2xl font-semibold text-fg">CochiApp</h1>
        <p className="mt-1 text-sm text-fg-muted">Listas y gastos, compartidos con tu pareja</p>
      </div>

      <div className="mb-6 flex rounded-xl border border-border bg-bg-elevated p-1">
        <button
          type="button"
          onClick={() => setModo("ingresar")}
          className={cn(
            "min-h-10 flex-1 rounded-lg text-sm font-medium transition-colors",
            modo === "ingresar" ? "bg-primary text-primary-fg" : "text-fg-muted"
          )}
        >
          Ingresar
        </button>
        <button
          type="button"
          onClick={() => setModo("registrarse")}
          className={cn(
            "min-h-10 flex-1 rounded-lg text-sm font-medium transition-colors",
            modo === "registrarse" ? "bg-primary text-primary-fg" : "text-fg-muted"
          )}
        >
          Crear cuenta
        </button>
      </div>

      <form onSubmit={manejarSubmit} className="flex flex-col gap-4" noValidate>
        {modo === "registrarse" && (
          <Input
            label="Tu nombre"
            type="text"
            autoComplete="name"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={60}
            required
          />
        )}
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          label="Contraseña"
          type="password"
          autoComplete={modo === "registrarse" ? "new-password" : "current-password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />

        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" disabled={cargando} fullWidth>
          {cargando ? "Un momento…" : modo === "registrarse" ? "Crear cuenta" : "Ingresar"}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-fg-muted">
        <span className="h-px flex-1 bg-border" />
        o
        <span className="h-px flex-1 bg-border" />
      </div>

      <Button type="button" variant="secondary" onClick={manejarGoogle} disabled={cargando} fullWidth>
        Continuar con Google
      </Button>
    </main>
  );
}
