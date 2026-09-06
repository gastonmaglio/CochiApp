import type { Metadata, Viewport } from "next";
import { Fraunces, Geist_Mono, Nunito_Sans } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { ConnectionBanner } from "@/components/layout/ConnectionBanner";
import { ServiceWorkerRegister } from "@/components/layout/ServiceWorkerRegister";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CochiApp — Listas y Gastos",
  description: "Listas de compras y gastos del hogar, compartidos en tiempo real entre los dos.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CochiApp",
  },
  icons: {
    icon: [{ url: "/favicon-32.png", sizes: "32x32", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#3f7a3d",
};

// Aplica el tema guardado ANTES de que React hidrate, para evitar un flash del tema
// equivocado (ej. sistema en claro pero el usuario había elegido oscuro a mano).
const SCRIPT_TEMA_INICIAL = `
try {
  var t = localStorage.getItem('cochiapp-tema');
  if (t !== 'claro' && t !== 'oscuro') {
    t = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'oscuro' : 'claro';
  }
  document.documentElement.setAttribute('data-theme', t === 'oscuro' ? 'dark' : 'light');
} catch (e) {}
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${nunitoSans.variable} ${fraunces.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA_INICIAL }} />
      </head>
      <body className="flex min-h-full flex-col bg-bg text-fg">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <ConnectionBanner />
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
