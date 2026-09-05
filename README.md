# Hogar — Listas y Gastos

PWA para gestionar listas de compras y gastos mensuales compartidos entre dos personas, con
sincronización en tiempo real y funcionamiento offline. Pensada para uso diario desde el celular:
en la fila del supermercado, con mala señal, con una sola mano.

## Funcionalidades

- **Listas de compras**: múltiples listas, items agrupados por categoría, agregado rápido (2
  toques), check de comprado con carga opcional de monto, total en vivo, cierre de compra con
  historial, sugerencias de items frecuentes, edición y borrado con deshacer.
- **Gastos mensuales**: carga de gastos fijos y variables por responsable (vos / tu pareja /
  compartido), gastos recurrentes que se generan solos cada mes, categorías con color e ícono.
  Cerrar una lista de compras genera automáticamente el gasto correspondiente — no se carga la
  misma plata dos veces.
- **Resumen**: total del mes, por persona y por categoría, comparación contra el mes anterior,
  gráfico de torta por categoría y de barras de evolución mensual, historial de compras cerradas
  (con detalle), exportación a CSV.
- **100% offline-first**: todo funciona sin conexión y sincroniza solo al volver la señal.
- **Instalable como PWA** en Android e iOS.

## Stack

Next.js 16 (App Router, Turbopack) + TypeScript estricto + Tailwind CSS v4 + Firebase (Firestore +
Auth) + Recharts.

## 1. Crear el proyecto en Firebase

1. Andá a [console.firebase.google.com](https://console.firebase.google.com) y creá un proyecto nuevo.
2. **Authentication** → pestaña *Sign-in method* → habilitá:
   - **Email/contraseña**
   - **Google**
3. **Firestore Database** → *Crear base de datos* → modo producción → elegí una región (ej. `southamerica-east1`, la más cercana a Argentina).
4. **Configuración del proyecto** (ícono de engranaje) → *Tus apps* → agregá una app **Web** (ícono `</>`). Copiá los valores del objeto `firebaseConfig` que te muestra.

## 2. Configurar variables de entorno

```bash
cp .env.example .env.local
```

Completá `.env.local` con los valores que copiaste en el paso anterior:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

Sin este archivo, la app funciona igual pero te muestra siempre la pantalla de login (Firebase
queda deshabilitado, no crashea) — vas a ver un aviso en la consola del navegador recordándotelo.

## 3. Desplegar las reglas de seguridad de Firestore

Las reglas (`firestore.rules`) son necesarias para que la app pueda leer/escribir — sin ellas,
Firestore rechaza todo por default.

```bash
npm install -g firebase-tools   # si no lo tenés instalado
firebase login
firebase init firestore         # elegí "usar un archivo existente" cuando pregunte por rules/indexes
firebase deploy --only firestore:rules,firestore:indexes
```

## 4. Correr en local

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## 5. Probar el flujo de onboarding

1. Registrate con email/contraseña (o Google) → te pide crear un hogar.
2. Creá el hogar → te muestra un código de invitación de 6 caracteres, válido 7 días.
3. Desde otro navegador (o ventana de incógnito), registrate con otra cuenta → elegí "Ya tengo un
   código de invitación" → ingresá el código → quedás vinculado al mismo hogar.

## 6. Instalar como PWA

- **Android (Chrome)**: menú ⋮ → *Instalar app* (o el banner automático que aparece).
- **iOS (Safari)**: botón compartir → *Agregar a pantalla de inicio*. iOS no muestra un banner
  automático — es siempre este paso manual.
- **Íconos**: los de `public/icons/` son un placeholder generado (casa simple, color de marca).
  Reemplazalos por tu propio logo cuando quieras — mismos nombres y tamaños, y listo.
- **Splash screen en iOS**: Safari 16.4+ arma la pantalla de carga sola a partir del manifest
  (`background_color` + `theme_color` + ícono 512×512), que ya está configurado. En versiones más
  viejas de iOS puede no mostrarse — es una limitación conocida de Safari, no de la app; si querés
  cubrir esos casos hay que agregar imágenes `apple-touch-startup-image` por cada resolución de
  dispositivo (no incluidas acá por ser una matriz de ~15 assets).

## 7. Deploy a producción (Vercel)

1. Subí el repo a GitHub/GitLab/Bitbucket.
2. En [vercel.com](https://vercel.com) → *Add New Project* → importá el repo. Vercel detecta Next.js
   automáticamente, no hace falta tocar la configuración de build.
3. En *Environment Variables*, cargá las mismas 6 variables de `.env.local` (paso 2).
4. Deploy. Cuando termine, tu app va a estar en `https://tu-proyecto.vercel.app`.
5. **Volvé a Firebase Console** → Authentication → Settings → *Authorized domains* → agregá el
   dominio de Vercel (`tu-proyecto.vercel.app`). Sin este paso, el login con Google falla en
   producción con un error de dominio no autorizado.
6. Si usás un dominio propio, agregalo también ahí una vez que lo conectes en Vercel.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo (Turbopack) |
| `npm run build` | Build de producción |
| `npm run start` | Sirve el build de producción |
| `npm run lint` | ESLint |

## Estructura del proyecto

```
src/
├── app/                    # Rutas (App Router): (auth), (onboarding), (app)
├── components/
│   ├── ui/                 # Button, Input, Sheet, PantallaCargando — primitivos
│   ├── layout/              # BottomNav, ConnectionBanner, ServiceWorkerRegister
│   ├── listas/               # Todo lo de listas de compras
│   ├── gastos/                # Todo lo de gastos y recurrentes
│   ├── resumen/                # Gráficos, comparación, totales
│   └── historial/               # Detalle de compras cerradas
├── hooks/                  # useAuth, useListas, useItems, useGastosDelMes, etc.
├── lib/
│   ├── firebase/            # config.ts (init + persistencia offline), auth.ts
│   ├── services/             # Toda la lógica de Firestore, sin JSX
│   ├── utils/                  # moneda, fechas, csv, agregaciones, cn
│   └── constants/               # Categorías predefinidas
├── contexts/                # AuthContext, ToastContext
└── types/                   # Un archivo por entidad de Firestore
```

## Notas de arquitectura

- **Offline-first**: Firestore usa `persistentLocalCache` (IndexedDB) — la app lee, agrega y edita
  sin conexión; los cambios se sincronizan solos al volver la señal. Un banner discreto avisa
  cuando no hay conexión.
- **UI optimista**: al usar el SDK modular de Firestore con `onSnapshot`, cada cambio se refleja en
  la interfaz al instante, antes de que el servidor confirme — no hay una capa de estado optimista
  manual, lo resuelve el propio SDK.
- **Service worker manual** (`public/sw.js`): esta versión de Next.js (16) usa Turbopack como
  bundler por defecto, que no soporta plugins de webpack — por eso no se usa `next-pwa`. Solo se
  registra en producción (`npm run build && npm run start`), nunca en `npm run dev`.
- **Reglas de Firestore**: nadie puede leer o escribir datos de un household al que no pertenece.
  El código de invitación es el ID del documento en `codigosInvitacion` — nunca se puede listar,
  solo buscar por código exacto.
- **Gastos recurrentes 100% client-side**: no hay Cloud Functions en este stack (evita necesitar el
  plan Blaze de Firebase). Cada vez que alguien abre la pestaña de Gastos, se chequea si el gasto
  del mes de cada plantilla recurrente ya se generó (campo `ultimaGeneracion`); si no, se genera en
  ese momento, incluso retroactivamente si nadie abrió la app en todo un mes.
- **Manejo de errores**: los errores de Firebase Auth se traducen a mensajes en español (ver
  `lib/utils/errores.ts`); las escrituras a Firestore que fallan (no offline — offline se encola
  normalmente, sino errores reales como permisos) muestran un toast; hay un `error.tsx` global que
  atrapa errores de render inesperados en vez de mostrar una pantalla en blanco.

## Licencia

Proyecto personal — sin licencia específica.
