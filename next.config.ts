import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "cochiapp",
  project: "cochiapp",
  silent: true,
  // Sin authToken: no sube source maps (no hace falta esa credencial extra para lo que
  // pedimos, que es solo enterarnos de que un error pasó). Los stack traces en Sentry
  // van a verse minificados en vez de con el código original.
});
