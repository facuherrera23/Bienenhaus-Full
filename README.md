# 🏠 BIENENHAUS PROPIEDADES

Landing pública + Panel administrativo integral para inmobiliaria. Una solución full-stack moderna que combina una landing page de alto rendimiento con un CRM completo, integración Mercado Libre, agenda de visitas, chat interno y sistema de papelera con recuperación.

---

## ✨ Características principales

### 🌐 Landing Pública (`apps/landing`)
- **Hero Section** con imagen de fondo local, CTA y scroll suave
- **Catálogo de propiedades** con filtros en tiempo real (tipo, operación, ubicación, precio, dormitorios), ordenamiento, paginación "Cargar más" y modal de detalle con galería, video YouTube y formulario de contacto
- **Newsletter** con suscripción, validación, doble opt-in y almacenamiento en Supabase
- **SEO & PWA**: meta tags Open Graph, favicon, manifest.webmanifest, service-ready
- **Identidad visual BIENENHAUS**: logo, favicon, colores, tipografías (Playfair Display + Inter)

### 🎛️ Panel Administrativo (`apps/admin`)
- **Dashboard** con KPIs reales, gráficos Recharts (leads por estado/origen/mes, propiedades por estado)
- **CRUD Propiedades**: formulario completo, galería drag & drop con conversión WebP, portada, video YouTube, bulk actions (publicar/actualizar/eliminar en ML), export CSV
- **Leads**: tabla con selección múltiple, auto-asignación round-robin, bulk "mover a papelera", export CSV, WhatsApp click-to-chat en detalle
- **Agentes**: grid + formulario (foto, especialidades, redes), toggle activo/inactivo
- **Mercado Libre**: OAuth, sync queue, defaults (categoría, listing_type, condición), estado por propiedad, sync manual/auto
- **Newsletter Admin**: listar, buscar, soft delete, export CSV
- **Usuarios Admin**: CRUD con roles (super_admin, admin, staff, viewer), invitación edge function, reset password
- **Agenda de Visitas**: calendario mes/semana/día, CRUD modal, filtros, estados coloreados
- **Chat Interno**: canales directo/grupo/propiedad/lead, realtime (Supabase Realtime), adjuntos, respuestas, reads
- **Papelera Universal**: soft delete en 4 tablas (propiedades, leads, agentes, newsletter), restore, purge, contadores reactivos
- **Configuración Sitio**: CMS para textos/imágenes de la landing

---

## 🏗️ Arquitectura

```
landing/
├── apps/
│   ├── landing/          # Landing pública (Preact + Vite)
│   │   ├── src/
│   │   │   ├── components/   # Hero, Navbar, Catalog, PropertyCard, PropertyModal, Footer, etc.
│   │   │   ├── hooks/        # useReveal, useSiteContent
│   │   │   ├── lib/          # content, images, newsletter, supabase
│   │   │   ├── pages/        # Landing page
│   │   │   └── styles/       # landing.css (design system completo)
│   │   ├── public/           # favicon, manifest, hero image
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── admin/            # Panel admin (Preact + Vite + Supabase)
│       ├── src/
│       │   ├── components/   # Shell, Sidebar, ToastHost, PropertyImageGallery, DashboardCharts, QuickPropertyActions, RecentActivity
│       │   ├── hooks/        # useReveal
│       │   ├── lib/          # agents, chat, leads, ml, newsletter, properties, visits, csv, supabase, query (TanStack Query), store (preact-signals)
│       │   ├── pages/        # Dashboard, PropertiesPage, PropertyFormPage, LeadsPage, LeadDetailPage, LeadFormPage, AgentsPage, AgentFormPage, AdminUsersPage, TrashPage, VisitsPage, ChatPage, MercadoLibrePage, NewsletterPage, SitePage, ConfigPage
│       │   ├── store/        # preact-signals global state
│       │   └── styles/       # styles.css (design system + componentes admin)
│       ├── index.html
│       ├── vite.config.ts   # base: '/admin/', proxy Supabase en dev
│       └── package.json
│
├── packages/
│   └── bienenhaus-ui/    # Shared UI components (Button, tokens.css)
│
├── scripts/
│   └── serve.mjs         # Demo server single-port (Node http, SPA fallback, proxy Supabase)
│
├── supabase/
│   ├── config.toml       # Config local (ports, auth, realtime, storage, auth hooks)
│   ├── seed.sql          # Admin user, propiedades ejemplo, agentes, leads
│   ├── migrations/       # 31 migraciones SQL (foundation → public_agents_view)
│   │   ├── 0001_foundation.sql
│   │   ├── 0002_admin_auth.sql
│   │   ├── 0003_taxonomies.sql
│   │   ├── 0004_properties.sql
│   │   ├── 0005_leads_cms.sql
│   │   ├── 0006_mercado_libre.sql
│   │   ├── 0007_rls_triggers_seed.sql
│   │   ├── 0008_grants.sql
│   │   ├── 0009_audit_write_policies.sql
│   │   ├── 0010_agent_matricula.sql
│   │   ├── 0011_agent_photos_storage.sql
│   │   ├── 0012_site_web_enhancements.sql
│   │   ├── 0013_contact_landing.sql
│   │   ├── 0014_ml_admin.sql
│   │   ├── 0015_ml_defaults.sql
│   │   ├── 0016_fix_ml_triggers.sql
│   │   ├── 0017_newsletter.sql
│   │   ├── 0018_property_video_url.sql
│   │   ├── 0019_soft_delete_tables.sql
│   │   ├── 0020_visits_calendar.sql
│   │   ├── 0021_internal_chat.sql
│   │   ├── 0022_ml_webhook.sql
│   │   ├── 0023_audit_log.sql
│   │   ├── 0024_visits_enhancements.sql
│   │   ├── 0025_ml_auto_reply.sql
│   │   ├── 0026_fix_audit_trigger.sql
│   │   ├── 0027_ml_orders_auto_reply.sql
│   │   ├── 0028_rate_limit.sql
│   │   ├── 0029_lead_tags_score.sql
│   │   ├── 0030_agent_permissions_commission_schedule.sql
│   │   └── 0031_public_agents_view.sql
│   ├── functions/        # Edge Functions (Deno)
│   │   ├── admin-user-invite/     # Invitar/reset/remove admin users
│   │   ├── audit-log/             # Log de acciones de staff
│   │   ├── contact-submit/        # Formulario contacto landing (rate-limit)
│   │   ├── ml-answer-question/    # Auto-respuesta a preguntas ML
│   │   ├── ml-bulk-enqueue/       # Encola sync masivo desde el admin
│   │   ├── ml-categories/         # Sync categorías ML
│   │   ├── ml-ingest/             # (legacy, solo local) Ingesta de propiedades
│   │   ├── ml-listing-types/      # Sync listing types ML
│   │   ├── ml-metrics/            # Métricas de publicación ML
│   │   ├── ml-oauth/              # OAuth ML callback
│   │   ├── ml-sync/               # Queue processor (publish/update/delete ML)
│   │   ├── ml-webhook/            # Webhook ML (preguntas, órdenes)
│   │   ├── qr-checkin/            # Check-in por QR de visitas
│   │   ├── visits-process-reminders/ # Recordatorios de visitas
│   │   └── _shared/               # crypto (AES-256-GCM), ml (API helpers), auth
│   ├── config.toml
│   ├── seed.sql
│   └── seed.sql
│
├── assets/
│   └── images/
│       ├── hero/
│       │   └── hero-baner.png
│       └── logos/
│           ├── logo-bienenhaus.png
│           ├── favicon.ico
│           └── pwa-512x512.png
│
├── scripts/
│   └── serve.mjs         # Demo server single-port (Node http, no deps)
│
├── package.json          # Workspace root (pnpm)
├── tsconfig.json         # (referencias)
└── README.md
```

---

## 🛠️ Tecnologías

### Frontend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Preact** | 10.26+ | UI library (similar a React, 3kb) |
| **Vite** | 7.x | Bundler + dev server |
| **TypeScript** | 5.8+ | Tipado estático estricto |
| **Wouter** | 3.10+ | Router minimalista (Preact) |
| **TanStack Query** | 5.x | Server state, caching, invalidation |
| **preact-signals** | 2.x | Reactive state global (store) |
| **Lucide Preact** | 1.28+ | Iconos SVG |
| **Recharts** | 3.10+ | Gráficos dashboard |
| **Zod** | 3.24+ | Validación esquemas |
| **Sentry** | 10.x (@sentry/browser) | Monitoreo de errores del admin (tracing + replay) |
| **CSS Modules** | - | Estilos scoped + design tokens |

### Backend / Infraestructura
| Tecnología | Versión | Uso |
|------------|---------|-----|
| **Supabase** | 2.x | Postgres + Auth + Realtime + Storage + Edge Functions |
| **PostgreSQL** | 17 | Base de datos principal |
| **PostgREST** | - | API REST auto-generada |
| **Realtime** | - | WebSockets para chat/visitas |
| **Storage** | - | Buckets: property-images, agent-photos |
| **Edge Functions** | Deno 2 | 14 funciones (webhooks ML, OAuth, sync, visitas, contact) |
| **Deno** | 2 | Runtime edge functions |

### Base de Datos (PostgreSQL 17)
- **Tablas principales**: `properties`, `leads`, `agents`, `admin_users`, `newsletter_subscribers`, `visits`, `chat_channels`, `chat_messages`, `chat_channel_participants`, `chat_message_reads`, `visits`, `agent_availability`, `visit_reminders`
- **Tablas ML**: `ml_connection`, `ml_sync_queue`, `ml_sync_history`, `property_ml_meta`, `property_ml_meta`
- **Auditoría**: `activity_log`, `properties_history`, triggers `audit_property_change`, `audit_property_create`
- **RLS**: Políticas por tabla (public select solo `status = 'publicada'`, staff CRUD, soft delete via `deleted_at`)
- **Triggers**: `set_updated_at`, `audit_property_change`, `properties_ml_auto_publish`, `properties_ml_auto_update`
- **Enums**: `property_status`, `listing_type`, `lead_status`, `lead_intent`, `lead_source`, `visit_status`, `chat_channel_type`, `admin_role`

### Infraestructura & DevOps
- **pnpm** 11.18+ (workspaces)
- **Node.js** ≥ 20
- **Docker**: Supabase CLI local (PostgreSQL, Studio, Realtime, Storage, Kong, Auth, Meta, Imgproxy, Logflare, Vector)
- **Demo Server**: `scripts/serve.mjs` (Node puro, single-port, proxy Supabase)

---

## 📋 Requisitos

- **Node.js** ≥ 20
- **pnpm** ≥ 11.18 (corepack habilitado)
- **Docker** + **Docker Compose** (para Supabase local)
- **Supabase CLI** ≥ 2.109 (`corepack pnpm dlx supabase` o `npx supabase`)
- **Git**

---

## 🚀 Instalación

### 1. Clonar el repositorio
```bash
git clone <repo-url>
cd landing
```

### 2. Instalar dependencias (workspace root)
```bash
corepack enable
corepack pnpm install
```

### 3. Levantar Supabase local
```bash
corepack pnpm dlx supabase start
# o
npx supabase start
```
Esto levanta: PostgreSQL (54322), Studio (54323), Kong API (54321), Realtime, Storage, Auth, Kong, Meta, Imgproxy, Logflare, Vector.

### 4. Aplicar migraciones y seed
```bash
corepack pnpm dlx supabase db reset
# o
npx supabase db reset
```
Ejecuta todas las migraciones (31) + `seed.sql` (admin user, propiedades ejemplo, agentes, leads).

### 4.1 (Opcional) Verificar seed
Credenciales admin por defecto:
- **Email**: `admin@bienenhaus.com`
- **Password**: `Bienenhaus2026!` (must_change_password = true)

### 5. Build de producción
```bash
pnpm build
# o
corepack pnpm -r build
```
Genera `apps/landing/dist/` y `apps/admin/dist/`.

---

## ⚙️ Variables de entorno

### Raíz / Demo Server
| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `PORT` | Puerto demo server | `5173` |

### Supabase Local (config.toml)
Gestionado por `supabase start`. Puertos por defecto:
- API: `54321`
- DB: `54322`
- Studio: `54323`
- Realtime: `54325`
- Storage: `54326`
- Mailpit: `54324`

### Apps (`.env` por app: `apps/landing/.env`, `apps/admin/.env`)
Copiar el `.env.example` correspondiente y completar:

| Variable | Descripción | App |
|----------|-------------|-----|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase (local `http://127.0.0.1:54321` / cloud) | ambas |
| `VITE_SUPABASE_ANON_KEY` | Anon key (pública por diseño) | ambas |
| `VITE_BASE_PATH` | Base path de build (ej: `/admin/`) | admin |
| `VITE_SENTRY_DSN` | DSN de Sentry. **Opcional**: sin DSN no se inicializa ni reporta nada | admin |
| `VITE_APP_VERSION` | Release reportado a Sentry. Default `dev`; en CI = SHA del commit | admin |

### Edge Functions (supabase/functions/.env)
Copiar `supabase/functions/.env.example` → `supabase/functions/.env` y completar:

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `CRYPTO_SECRET` | Clave AES-256-GCM para cifrar tokens ML | ✅ |
| `ML_CLIENT_ID` | Client ID app Mercado Libre | ✅ |
| `ML_CLIENT_SECRET` | Client Secret app Mercado Libre | ✅ |
| `ML_SYNC_SECRET` | Secret compartido para invocar ml-sync | No |
| `ADMIN_BASE_URL` | Base URL admin para redirect OAuth | No |

### Demo Server (scripts/serve.mjs)
Lee `process.env.PORT` (default 5173). Proxy a Supabase local en `127.0.0.1:54321`.

---

## ▶️ Ejecución

### Desarrollo (Hot Reload)
```bash
# Terminal 1: Supabase
corepack pnpm dlx supabase start

# Terminal 2: Landing (puerto 5174)
pnpm dev

# Terminal 3: Admin (puerto 5175)
pnpm dev:admin
```

### Demo Single-Port (Producción-like)
```bash
# Requiere builds previos
pnpm build
corepack pnpm demo
# o
node scripts/serve.mjs
```
Acceso:
- Landing: `http://localhost:5173/`
- Admin: `http://localhost:5173/admin/`
- Proxy Supabase: `/rest`, `/auth`, `/storage`, `/functions` → `127.0.0.1:54321`

### Solo Admin (con proxy Vite en dev)
```bash
pnpm dev:admin
# Vite proxy: /rest, /auth, /storage, /functions → 127.0.0.1:54321
```

---

## 📜 Scripts

### Root (`package.json`)
| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Levanta landing en dev (puerto 5174) |
| `pnpm dev:admin` | Levanta admin en dev (puerto 5175) |
| `pnpm build` | Build todas las apps (`tsc --noEmit && vite build`) |
| `pnpm demo` | Inicia demo server single-port (`node scripts/serve.mjs`) |
| `pnpm typecheck` | Typecheck todas las apps (`tsc --noEmit`) |
| `pnpm format` | Prettier en todo el repo |

### Apps (`apps/landing/package.json`, `apps/admin/package.json`)
| Script | Descripción |
|--------|-------------|
| `pnpm dev` | `vite` (dev server + HMR) |
| `pnpm build` | `tsc --noEmit && vite build` |
| `pnpm preview` | `vite preview` |
| `pnpm typecheck` | `tsc --noEmit` |

### Supabase CLI
| Comando | Descripción |
|---------|-------------|
| `supabase start` | Inicia stack local |
| `supabase stop` | Detiene stack |
| `supabase db reset` | Reset DB + migraciones + seed |
| `supabase db push` | Aplica migraciones pendientes |
| `supabase migration new <name>` | Crea nueva migración |
| `supabase functions deploy` | Despliega Edge Functions |
| `supabase db diff` | Diff schema vs migraciones |

---

## 🗄️ Base de Datos

### Motor
- **PostgreSQL 17** (via Supabase local Docker)

### ORM / Acceso
- **Supabase JS Client** (`@supabase/supabase-js` v2)
- **PostgREST** (API REST auto-generada)
- **Supabase Realtime** (WebSockets para chat/visitas)

### Migraciones
- Ubicación: `supabase/migrations/*.sql` (31 archivos, numerados 0001–0031)
- Naming: `NNNN_descripcion_corta.sql`
- Aplicar: `supabase db push` / `supabase db reset`
- Crear nueva: `supabase migration new nombre_corto`

### Tablas clave
| Tabla | Descripción |
|-------|-------------|
| `properties` | Propiedades (status, listing_type, price, location, images, video, soft delete) |
| `leads` | Contactos (status, intent, source, assigned_to agent, soft delete) |
| `agents` | Asesores (foto, especialidades, redes, activo, soft delete) |
| `admin_users` | Usuarios panel (roles, must_change_password) |
| `newsletter_subscribers` | Suscripciones (source, status, soft delete) |
| `visits` | Agenda (agent, property, lead, datetime, status, type) |
| `chat_channels` | Canales (direct, group, property, lead) |
| `chat_messages` | Mensajes (text, file, image, reply, soft delete) |
| `ml_connection` | Conexión ML (tokens cifrados AES-256-GCM) |
| `ml_sync_queue` | Cola sync (publish/update/delete, retries) |
| `property_ml_meta` | Estado publicación ML por propiedad |

---

## 🔌 API

### PostgREST (Auto-generada)
Base: `http://localhost:54321/rest/v1/`
- Auth: `apikey` + `Authorization: Bearer <jwt>`
- Filtros: `?select=*,relation(*)&status=eq.publicada&order=created_at.desc`
- Docs: `http://localhost:54321/rest/v1/` (OpenAPI)

### Edge Functions (Deno)
Base: `http://localhost:54321/functions/v1/`

| Función | Método | Descripción |
|---------|--------|-------------|
| `admin-user-invite` | POST `{action, email, full_name, role}` | Invite/reset/remove admin users |
| `audit-log` | POST | Registra acciones de staff en `activity_log` |
| `contact-submit` | POST | Formulario de contacto landing (honeypot + rate limit) |
| `ml-answer-question` | POST | Auto-respuesta a preguntas de publicaciones ML |
| `ml-bulk-enqueue` | POST | Encola propiedades para sync masivo |
| `ml-categories` | GET | Sincroniza categorías ML |
| `ml-listing-types` | GET | Sincroniza listing types ML |
| `ml-metrics` | GET | Métricas de publicación ML |
| `ml-oauth` | GET `/callback?code=&state=` | OAuth callback ML, guarda tokens cifrados |
| `ml-sync` | POST | Procesa cola `ml_sync_queue` (publish/update/delete) |
| `ml-webhook` | POST | Webhook ML (preguntas, órdenes de compra) |
| `qr-checkin` | POST | Check-in de visita por QR |
| `visits-process-reminders` | POST (scheduled) | Genera recordatorios de visitas |

> `ml-ingest` existe solo en local (legacy, no desplegada).

#### Autenticación Edge Functions
- Header: `Authorization: Bearer <service_role_key>` o `x-sync-secret: <ML_SYNC_SECRET>`
- Validación: `is_admin()` / `is_staff()` via JWT

---

## 🔗 Integraciones

| Integración | Propósito | Configuración |
|-------------|-----------|---------------|
| **Mercado Libre** | Publicar/actualizar/eliminar propiedades, OAuth | `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `CRYPTO_SECRET` |
| **Supabase Auth** | Email/password, magic link, rate limits | `auth` config.toml |
| **Supabase Storage** | Imágenes propiedades/agentes | Buckets: `property-images`, `agent-photos` |
| **Supabase Realtime** | Chat, visitas, notificaciones | Habilitado en config.toml |
| **Supabase Edge Functions** | Webhooks ML, OAuth, sync, visitas, contacto | Deno 2, secrets via env |
| **Sentry** | Monitoreo de errores (admin, release por commit) | `VITE_SENTRY_DSN`, `VITE_APP_VERSION` |
| **WhatsApp Click-to-Chat** | Leads detalle | `wa.me/<phone>?text=...` |
| **MercadoPago/Stripe** | (Preparado) Reservas online | - |

---

## 🔒 Seguridad

| Mecanismo | Implementación |
|-----------|----------------|
| **Autenticación** | Supabase Auth (email/password, JWT, refresh rotation) |
| **Autorización** | RLS policies por tabla (`is_staff()`, `is_admin()`, ownership) |
| **Roles Admin** | `super_admin`, `admin`, `staff`, `viewer` (tabla `admin_users`) |
| **Cifrado Tokens ML** | AES-256-GCM (`CRYPTO_SECRET` → `lib/crypto.ts`) |
| **Soft Delete** | Columna `deleted_at` + RLS (`deleted_at IS NULL` para public) |
| **CORS** | Configurado en Edge Functions + demo server (`*`) |
| **Rate Limiting** | Auth (email/sms/signin), Edge Functions, RPCs landing (honeypot + ventana por hora) |
| **Validación** | Zod schemas en formularios admin |
| **CSP / Headers** | Demo server + Vite dev server |
| **Secrets** | Variables de entorno, `.env.example`, nunca en git |

---

## 🚢 Despliegue

### Producción (Supabase Cloud + GitHub Pages)

El sitio se publica en **GitHub Pages** con un solo proyecto: la landing en la
raíz (`/`) y el panel admin en `/admin/` (hash routing). El workflow
`.github/workflows/deploy-pages.yml` builda ambas apps en `out/` y despliega
automáticamente en cada push a `main` o `master`.

```bash
# Build manual (misma salida que CI): genera out/
node scripts/build-pages.mjs
```

**Variables de repo de GitHub** (Settings → Secrets and variables → Actions):

| Variable | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://rnldqiwwzhjnurkguihu.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | anon key del cloud (pública por diseño) |
| `SITE_DOMAIN` | opcional; si se define escribe `out/CNAME` para dominio custom |
| `VITE_SENTRY_DSN` | opcional; si se define, el admin reporta errores a Sentry |

**Pasos una sola vez:**
1. En GitHub: Settings → Pages → Source = **GitHub Actions**.
2. Habilitar Pages en el repo y correr el workflow (o hacer push a `main`/`master`).
3. Para dominio propio: configurar `SITE_DOMAIN`, agregar el CNAME/apex en el
   DNS y setear el custom domain en Settings → Pages.
4. En Supabase Cloud (proyecto `rnldqiwwzhjnurkguihu`): en **Auth → URL
   Configuration** setear `Site URL` = `https://<tu-dominio.com>` y agregar
   `https://<tu-dominio.com>/admin/**` en *Redirect URLs* (el callback de login
   entra por `/admin/`).
5. Verificar **Edge Functions** activas y los webhooks de MercadoLibre.

**Anti-spam (landing):** `subscribe_newsletter` y `submit_contact` validan un
**honeypot** (`p_hp` oculto; si viene lleno responden éxito falso sin insertar)
y aplican **rate limit** por ventana de tiempo (50 altas/hora newsletter, 30
consultas/hora contacto + 1 por email cada 24h).

### Monitoreo (Sentry)

El panel admin integra **Sentry** (`@sentry/preact`) para reportar errores de
frontend:

- Se inicializa en `main.tsx` solo si `VITE_SENTRY_DSN` está definida; sin DSN
  no se registra ningún listener ni se envía nada.
- `release` = `VITE_APP_VERSION` (default `dev`); en CI el workflow la setea al
  SHA del commit, así cada deploy es una versión identificable en Sentry.
- Para activarlo: crear el proyecto en [sentry.io](https://sentry.io), copiar el
  DSN a una **variable de repo** `VITE_SENTRY_DSN` (Settings → Secrets and
  variables → Actions → Variables) y hacer un push. No es secret: viaja al
  bundle público (los eventos van al frontend SDK).

**Backup de base de datos:** el workflow `.github/workflows/backup.yml` corre
diario (03:00 UTC, `pg_dump` del schema `public` vía Supabase CLI, artifact con
retención de 90 días, ejecutable manual via `workflow_dispatch`). Requiere el
secret `SUPABASE_ACCESS_TOKEN` en el repo.

### Emails (SMTP)

Los invites/reset de admins **no envían email**: la edge function
`admin-user-invite` genera un link de recovery y lo devuelve al admin, que lo
comparte con el usuario. El login usa `signInWithPassword` (sin emails). Por lo
tanto hoy **no se envía ningún email**; el SMTP se necesita cuando haya
forgot-password, confirmación de alta o notificaciones.

Para configurar envío real con dominio propio:

```bash
# 1. Crear un SMTP (Resend: smtp.resend.com:465, user "resend", pass = API key re_xxx).
#    Verificar el dominio emisor en el proveedor (DKIM/SPF).
# 2. Copiar .env.smtp.example → .env.smtp, completar credenciales y correr:
node scripts/configure-smtp.mjs
# 3. Site URL / Redirect URL: el script también las setea (SITE_URL / REDIRECT_URLS)
```

> **Ya aplicado:** `site_url = https://bienenhaus.com.ar/admin` y
> `uri_allow_list = https://bienenhaus.com.ar/admin/**` (los links de recovery
> aterrizan en el admin y su callback de auth se procesa en `initAuth`).
> Si algún día querés más Redirect URLs (ej. OAuth), agregalas en el dashboard
> (Authentication → URL Configuration), porque la Management API solo guarda una.

| Variable | Valor |
|----------|-------|
| `SUPABASE_ACCESS_TOKEN` | PAT `sbp_...` (dashboard → account → access tokens) |
| `SMTP_HOST/PORT/USER/PASS` | datos del proveedor |
| `SMTP_SENDER_EMAIL` | `no-reply@<tu-dominio>` (dominio verificado en el proveedor) |
| `SMTP_SENDER_NAME` | `BIENENHAUS` |
| `SITE_URL` | `https://bienenhaus.com.ar/admin` (ya aplicado) |
| `REDIRECT_URLS` | `https://bienenhaus.com.ar/admin/**` (ya aplicado) |

Datos de Resend: host `smtp.resend.com`, puerto `465`, usuario `resend`,
password = API key (`re_xxxx`). El dominio `bienenhaus.com.ar` se verifica en
Resend → Domains (agrega los registros DNS que te da, DKIM + SPF).

Si no querés SMTP aún, al menos corregí `site_url` (sin eso los links de auth
apuntan a `localhost`). Los templates de email (inglés por defecto) se
personalizan en Auth → Email Templates del dashboard.

### Docker (Self-hosted)
```bash
# Solo Supabase stack
docker compose -f docker-compose.yml up -d
# Requiere: supabase/docker-compose.yml (generado por supabase init)
```

### Demo Server (Node puro)
```bash
pnpm build
node scripts/serve.mjs
# Puerto configurable: PORT=xxxx node scripts/serve.mjs
```

---

## 👨‍💻 Desarrollo

### Flujo recomendado
1. `supabase start` → levanta stack local
2. `supabase db reset` → DB limpia + seed
3. `pnpm dev` / `pnpm dev:admin` → hot reload
4. Cambios DB → `supabase migration new nombre` → edita SQL → `supabase db push`
6. Cambios Edge Functions → `supabase functions serve` (local) → `supabase functions deploy`

### Convenciones
- **TypeScript strict**: `tsc --noEmit` en cada build
- **Prettier**: `pnpm format` antes de commit
- **Naming**: kebab-case archivos, PascalCase componentes, camelCase variables
- **Componentes**: Un archivo por componente, co-located styles (CSS Modules)
- **Estado**: `preact-signals` para global, TanStack Query para server state
- **Estilos**: Design tokens en `tokens.css` (landing) / `:root` variables (admin)

### Estructura componente típico (admin)
```tsx
// pages/PropertiesPage.tsx
import { useQuery } from '../lib/query/hooks';
import { fetchProperties } from '../lib/properties';
import { pushToast } from '../store/app';

export function PropertiesPage() {
  const { data, isPending } = useQuery({ queryKey: ['properties'], queryFn: fetchProperties });
  // ...
}
```

---

## 🗺️ Roadmap

Mejoras coherentes con la arquitectura actual:

- [ ] **Reserva online de propiedades** (hold 24-48h, formulario, señal MercadoPago/Stripe)
- [ ] **CRM Kanban** (pipeline visual leads, drag & drop, etapas personalizables)
- [ ] **Notificaciones push/email** (Supabase Realtime + edge function + SendGrid/Resend)
- [x] **Tipado inductivo** — hecho: tipos generados en `apps/admin/src/types/database.ts` y `apps/landing/src/data/generated.d.ts`
- [ ] **Tests** (ampliar cobertura: crear propiedad, sync ML, chat)
- [ ] **Storybook** para design system (`packages/bienenhaus-ui`)
- [ ] **i18n** (es/en/pt) con `i18next` o similar
- [ ] **Analytics** (Plausible/Umami + eventos custom)
- [x] **Backup automatizado** — hecho: `.github/workflows/backup.yml` (pg_dump diario, retención 90 días)
- [x] **Monitoreo** — Sentry integrado en el admin (falta setear `VITE_SENTRY_DSN` en el repo); pendiente uptime monitor

---

## 📄 Licencia

> **Pendiente de definir** — Actualmente código privado. Definir licencia antes de publicación (MIT, Apache 2.0, propietaria, etc.).

---

## 👤 Autor

**Facundo Herrera** — `hfacundo45@gmail.com`

---

## 📝 Observaciones

| Aspecto | Estado | Comentario |
|---------|--------|------------|
| **README previo** | ✅ | Creado desde cero |
| **Tests automatizados** | ⚠️ | Vitest (Login) + Playwright E2E (login, admin-pages, visits-agents-ml) |
| **CI/CD** | ✅ | GitHub Actions: CI (typecheck/test/E2E/build) + Deploy Pages + Backup diario |
| **Docker Compose prod** | ❌ | Solo Supabase local CLI |
| **Variables producción** | ⚠️ | Documentadas; faltan algunos vars/secrets en el repo (ej. `VITE_SENTRY_DSN`, `SUPABASE_ACCESS_TOKEN`) |
| **Edge Functions secrets** | ⚠️ | Requieren `supabase secrets set` en cloud |
| **Tipado DB → TS** | ✅ | Tipos generados (`apps/admin/src/types/database.ts`, `apps/landing/src/data/generated.d.ts`) |
| **Tests E2E críticos** | ⚠️ | Login y navegación cubiertos; falta crear propiedad, sync ML, chat |
| **Documentación API** | ⚠️ | Solo PostgREST auto-generada, sin OpenAPI custom |
| **Monitoreo/Logs** | ✅ | Sentry en admin (release por commit) + Supabase logs; falta uptime monitor |

> **Recomendación**: Antes de ir a producción, configurar CI/CD (GitHub Actions), añadir tests críticos, validar variables de producción en staging, y documentar runbooks de incidentes (caída Supabase, rate limit ML, migración fallida).