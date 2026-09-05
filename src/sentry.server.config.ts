import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Foco en errores, no en performance tracing — mantiene el bundle/runtime más simple.
  tracesSampleRate: 0,
});
