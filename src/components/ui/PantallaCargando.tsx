export function PantallaCargando() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <div
        role="status"
        aria-label="Cargando"
        className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
      />
    </div>
  );
}
