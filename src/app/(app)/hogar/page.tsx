"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  Download,
  LogOut,
  RefreshCw,
  Tags,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useMiembrosHousehold } from "@/hooks/useMiembrosHousehold";
import { useToast } from "@/contexts/ToastContext";
import { cerrarSesion } from "@/lib/firebase/auth";
import {
  editarNombreHousehold,
  generarNuevoCodigoInvitacion,
  MAX_MIEMBROS,
} from "@/lib/services/household.service";
import { exportarDatosHousehold } from "@/lib/services/exportarDatos.service";
import { mensajeErrorFirebase } from "@/lib/utils/errores";
import { descargarJson } from "@/lib/utils/descargarJson";
import { ListaFormSheet } from "@/components/listas/ListaFormSheet";
import { Button } from "@/components/ui/Button";
import { Mascota } from "@/components/ui/Mascota";

export default function HogarPage() {
  const router = useRouter();
  const { user, household } = useAuth();
  const miembros = household?.miembros ?? [];
  const usuarios = useMiembrosHousehold(miembros);
  const { mostrarToast } = useToast();

  const [sheetRenombrarAbierto, setSheetRenombrarAbierto] = useState(false);
  const [guardandoNombre, setGuardandoNombre] = useState(false);
  const [generandoCodigo, setGenerandoCodigo] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [mostrarRecuperacion, setMostrarRecuperacion] = useState(false);
  const [exportando, setExportando] = useState(false);

  if (!household) return null;

  const hogarCompleto = miembros.length >= MAX_MIEMBROS;

  async function manejarRenombrar(nombre: string) {
    setGuardandoNombre(true);
    try {
      await editarNombreHousehold(household!.id, nombre);
      setSheetRenombrarAbierto(false);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    } finally {
      setGuardandoNombre(false);
    }
  }

  async function manejarGenerarCodigo() {
    if (!user) return;
    setGenerandoCodigo(true);
    try {
      await generarNuevoCodigoInvitacion(household!.id, user.uid);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    } finally {
      setGenerandoCodigo(false);
    }
  }

  async function manejarExportar() {
    setExportando(true);
    try {
      const datos = await exportarDatosHousehold(household!.id);
      const fecha = new Date().toISOString().slice(0, 10);
      descargarJson(`cochiapp-datos-${fecha}.json`, datos);
    } catch (err) {
      mostrarToast(mensajeErrorFirebase(err));
    } finally {
      setExportando(false);
    }
  }

  async function manejarCopiar() {
    if (!household!.codigoActivo) return;
    try {
      await navigator.clipboard.writeText(household!.codigoActivo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      mostrarToast("No se pudo copiar. Copiá el código a mano.");
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <header className="flex items-center gap-2 border-b border-border bg-bg-elevated px-3 py-3">
        <button
          type="button"
          onClick={() => router.push("/inicio")}
          aria-label="Volver"
          className="flex min-h-11 min-w-11 items-center justify-center text-fg"
        >
          <ArrowLeft size={20} aria-hidden="true" />
        </button>
        <h1 className="font-display text-lg font-semibold text-fg">Tu hogar</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 px-4 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <Mascota size={64} />
          <button
            type="button"
            onClick={() => setSheetRenombrarAbierto(true)}
            className="text-xl font-semibold text-fg underline decoration-dashed decoration-fg-muted/50 underline-offset-4"
          >
            {household.nombre}
          </button>
          <p className="text-sm text-fg-muted">Tocá el nombre para cambiarlo.</p>
        </div>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-fg-muted">Integrantes</h2>
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-bg-elevated shadow-card">
            {miembros.map((uid) => (
              <div key={uid} className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                  {(usuarios[uid]?.nombre ?? "?").charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-fg">
                  {uid === user?.uid ? "Vos" : (usuarios[uid]?.nombre ?? "Pareja")}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-fg-muted">Código de invitación</h2>
          {hogarCompleto && !mostrarRecuperacion ? (
            <div className="flex flex-col gap-3 rounded-xl border border-dashed border-border px-4 py-6 text-center">
              <p className="text-sm text-fg-muted">
                Tu hogar ya tiene dos integrantes vinculados. No hace falta compartir ningún código.
              </p>
              <button
                type="button"
                onClick={() => setMostrarRecuperacion(true)}
                className="min-h-9 text-sm font-medium text-primary underline"
              >
                ¿Alguien perdió el acceso a su cuenta?
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg-elevated p-4 shadow-card">
              <p className="text-sm text-fg-muted">
                {hogarCompleto
                  ? "Generá un código para que la persona que perdió el acceso recupere su lugar. No suma un tercer integrante — sigue siendo un hogar de dos."
                  : "Compartí este código con tu pareja para que se una al hogar."}
              </p>
              {household.codigoActivo ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="flex-1 rounded-lg bg-bg px-4 py-3 text-center text-2xl font-semibold tracking-[0.3em] text-fg">
                    {household.codigoActivo}
                  </span>
                  <button
                    type="button"
                    onClick={() => void manejarCopiar()}
                    aria-label="Copiar código"
                    className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-border text-fg-muted"
                  >
                    {copiado ? (
                      <Check size={18} aria-hidden="true" />
                    ) : (
                      <Copy size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
              ) : (
                <p className="text-center text-sm text-fg-muted">
                  No tenés un código activo. Generá uno nuevo.
                </p>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={() => void manejarGenerarCodigo()}
                disabled={generandoCodigo}
              >
                <RefreshCw size={16} aria-hidden="true" />
                {generandoCodigo ? "Generando…" : "Generar nuevo código"}
              </Button>
            </div>
          )}
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-fg-muted">Personalización</h2>
          <Link
            href="/hogar/categorias"
            className="flex min-h-14 items-center gap-3 rounded-xl border border-border bg-bg-elevated px-4 py-3"
          >
            <Tags size={18} className="text-fg-muted" aria-hidden="true" />
            <span className="flex-1 text-sm font-medium text-fg">Categorías de compras y gastos</span>
            <ChevronRight size={18} className="text-fg-muted" aria-hidden="true" />
          </Link>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold text-fg-muted">Tus datos</h2>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void manejarExportar()}
            disabled={exportando}
          >
            <Download size={16} aria-hidden="true" />
            {exportando ? "Preparando…" : "Descargar todos mis datos"}
          </Button>
          <p className="text-xs text-fg-muted">
            Baja un archivo con todas tus listas, gastos, tareas e historial.
          </p>
        </section>

        <Button
          type="button"
          variant="ghost"
          className="mt-auto"
          onClick={() => void cerrarSesion()}
        >
          <LogOut size={16} aria-hidden="true" /> Cerrar sesión
        </Button>
      </div>

      <ListaFormSheet
        abierto={sheetRenombrarAbierto}
        titulo="Nombre del hogar"
        labelBoton="Guardar"
        valorInicial={household.nombre}
        cargando={guardandoNombre}
        onCerrar={() => setSheetRenombrarAbierto(false)}
        onGuardar={manejarRenombrar}
      />
    </main>
  );
}
