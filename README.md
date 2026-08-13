# 🏠 BIENENHAUS PROPIEDADES

Landing pública + Panel administrativo integral para inmobiliaria. Una solución full-stack moderna que combina una landing page de alto rendimiento con un CRM completo, integración Mercado Libre, agenda de visitas, chat interno, módulo de propietarios, **tasaciones profesionales** y sistema de papelera con recuperación.

---

## ✨ Características principales

### 🌐 Landing Pública (`apps/landing`)

- **Hero Section** con imagen de fondo local, CTA y scroll suave
- **Catálogo de propiedades** con filtros en tiempo real (tipo, operación, ubicación, precio, dormitorios), ordenamiento, paginación "Cargar más" y modal de detalle con galería, video YouTube y formulario de contacto
- **Newsletter** con suscripción, validación, doble opt-in y almacenamiento en Supabase
- **SEO & PWA**: meta tags Open Graph, JSON-LD, favicon, manifest.webmanifest, service worker
- **Identidad visual BIENENHAUS**: logo, favicon, colores, tipografías (Playfair Display + Inter)
- **Performance**: CSS Modules por componente, plugin de Critical CSS, builds auditados con Lighthouse CI (desktop ≥ 98)

### 🎛️ Panel Administrativo (`apps/admin`)

- **Dashboard** con KPIs reales, gráficos Recharts (leads por estado/origen/mes, propiedades por estado) y actividad reciente
- **CRUD Propiedades**: formulario completo, galería drag & drop con conversión WebP, portada, video YouTube, bulk actions (publicar/actualizar/eliminar en ML), export CSV
- **Análisis de Precio** por propiedad (`/propiedades/:id/analisis`): comparables, gauge de posicionamiento vs. mercado
- **Leads**: tabla con selección múltiple, auto-asignación round-robin, bulk "mover a papelera", export CSV, WhatsApp click-to-chat en detalle
- **Agentes**: grid + formulario (foto, especialidades, redes), toggle activo/inactivo
- **Propietarios**: CRUD completo (personas físicas/jurídicas), vinculación a propiedades, timeline de comunicaciones, generación de reportes PDF
- **Planes de Acción**: planes por propiedad y dashboard global con tareas, prioridades y estados (pricing, marketing, condition, legal)
- **Comunicaciones**: registro de emails, WhatsApp, llamadas y reuniones por propietario
- **Reportes**: generador de reportes para propietarios (análisis de precio, resúmenes de visitas, actualizaciones de mercado)
- **Tasaciones (Tasar)**: formulario profesional de valuación de inmuebles (120+ campos) con análisis comparativo, mapa interactivo (Leaflet + Nominatim), fotos, borradores, finalización con bloqueo, historial de cambios y exportación PDF/impresión
- **Mercado Libre**: OAuth, sync queue, auto-publicación/auto-update/auto-delete, sync programado por cron, defaults (categoría, listing_type, condición), estado por propiedad
- **Newsletter Admin**: listar, buscar, soft delete, export CSV
- **Usuarios Admin**: CRUD con roles (super_admin, admin, staff, viewer), invitación edge function, reset password, guards por ruta
- **Auditoría**: log de acciones de staff con filtros (`/auditoria`)
- **Agenda de Visitas**: calendario mes/semana/día, CRUD modal, filtros, estados coloreados
- **Chat Interno**: canales directo/grupo/propiedad/lead, realtime (Supabase Realtime), adjuntos, respuestas, reads
- **Papelera Universal**: soft delete en 4 tablas (propiedades, leads, agentes, newsletter), restore, purge, contadores reactivos
- **Configuración Sitio**: CMS para textos/imágenes de la landing
- **UX**: Command Palette (⌘K), breadcrumbs, lazy-loading de páginas, design system `@bienenhaus/ui` con 24+ componentes

---

## 🏗️ Arquitectura

```
landing/
├── apps/
│   ├── landing/              # Landing pública (Preact + Vite)
│   │   ├── src/
│   │   │   ├── components/   # Hero, Navbar, Catalog, PropertyCard, PropertyModal, Services, Team, Stats, Process, Contact, Footer, VideoModal, JsonLd, TransitionStrip
│   │   │   ├── hooks/        # useReveal, useSpotlight, useCountUp
│   │   │   ├── lib/          # content, images, newsletter, site-settings, supabase-data, supabase, brand-icons
│   │   │   ├── data/         # properties.ts + generated/*.json (agents, locations, properties)
│   │   │   └── styles/       # landing.css + modules/*.module.css por componente
│   │   ├── public/           # favicon, manifest.webmanifest, sw.js, pwa-512x512.png
│   │   ├── plugins/          # critical-css.ts
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── admin/                # Panel admin (Preact + Vite + Supabase)
│       ├── src/
│       │   ├── components/   # Shell, Sidebar, Topbar, ToastHost, CommandPalette, Breadcrumb, DashboardCharts, ErrorBoundary, ImageLightbox, PropertyImageGallery, QuickPropertyActions, RecentActivity + owners/
│       │   ├── hooks/        # useReveal
│       │   ├── lib/          # agents, chat, leads, ml, newsletter, properties, visits, owners/, valuationApi, valuationCalculations, valuationService, activity, auth, csv, image-compression, sentry, site, supabase, validators + api/, query/, utils/
│       │   ├── pages/        # 30+ páginas (Dashboard, Properties, Leads, Agents, Owners, Tasar, ActionPlans, Communications, Reports, AuditLog, ML, Visits, Chat, Trash, etc.)
│       │   ├── schemas/      # valuationSchemas.ts (Zod)
│       │   ├── store/        # preact-signals global state (app.ts)
│       │   ├── styles/       # styles.css + shell.css, sidebar.css, topbar.css
│       │   ├── types/        # database.ts (generado) + tipos por dominio (admin, leads, agents, ml, owners, valuationTypes, etc.)
│       │   ├── test/         # Vitest setup + supabase-mock
│       │   └── e2e/          # Playwright (7 suites + auth.setup + global-setup)
│       ├── index.html
│       ├── vite.config.ts    # base: '/admin/', proxy Supabase en dev
│       └── package.json
│
├── packages/
│   ├── bienenhaus-ui/        # Design system compartido: atoms (Avatar, Badge, Button, Chip, Divider, IconButton, Spinner, ToastHost, Tooltip) + molecules (Breadcrumb, Checkbox, Dropdown, EmptyState, FormField, Input, Metric, Pagination, RadioGroup, SearchInput, Select, StatCard, Switch, Tabs, Textarea) + tokens.css. Cada componente con stories y tests.
│   └── bienenhaus-supabase/  # Cliente Supabase compartido (singleton). Usado por la landing (supabase-data). Helpers compartidos: auth, crypto (AES-256-GCM), ml, visits, auto_reply. ⚠️ El admin conserva su cliente tipado propio (deuda pendiente de migrar).
│
├── scripts/
│   ├── serve.mjs             # Demo server single-port (Node http, SPA fallback, proxy Supabase)
│   ├── build-pages.mjs       # Build para GitHub Pages (out/)
│   ├── configure-smtp.mjs    # Config SMTP vía Management API
│   ├── create-og-image.ts    # Genera OG images
│   ├── optimize-hero.ts      # Optimiza imágenes del hero
│   └── fetch-data.mjs        # Fetch de datos para la landing
│
├── supabase/
│   ├── config.toml           # Config local (ports, auth, realtime, storage, MFA)
│   ├── seed.sql              # Seed PRODUCTION-READY (taxonomías + site settings, SIN datos demo)
│   ├── migrations/           # 61 migraciones SQL (0001_foundation → 0062_chat_ai_assistant)
│   │   ├── 0001_foundation.sql            # Schema base + enums + taxonomías
│   │   ├── 0002_admin_auth.sql            # Tabla admin_users + roles
│   │   ├── 0003_taxonomies.sql            # categories, property_types, locations, features
│   │   ├── 0004_properties.sql            # Tabla properties + triggers
│   │   ├── 0005_leads_cms.sql             # Leads + site settings CMS
│   │   ├── 0006_mercado_libre.sql         # Integración ML (connection, sync_queue)
│   │   ├── 0007_rls_triggers_seed.sql     # RLS + triggers + seed inicial
│   │   ├── 0008_grants.sql                # Grants de seguridad
│   │   ├── 0009_audit_write_policies.sql  # Políticas de escritura para auditoría
│   │   ├── 0010_agent_matricula.sql       # Matrícula de agentes
│   │   ├── 0011_agent_photos_storage.sql  # Storage para fotos de agentes
│   │   ├── 0012_site_web_enhancements.sql # Mejoras sitio web
│   │   ├── 0013_contact_landing.sql       # Formulario de contacto landing
│   │   ├── 0014_ml_admin.sql              # Admin de ML
│   │   ├── 0015_ml_defaults.sql           # Defaults de publicación ML
│   │   ├── 0016_fix_ml_triggers.sql       # Fix triggers ML
│   │   ├── 0017_newsletter.sql            # Newsletter subscribers
│   │   ├── 0018_property_video_url.sql    # Video URL por propiedad
│   │   ├── 0019_soft_delete_tables.sql    # Soft delete en 4 tablas
│   │   ├── 0020_visits_calendar.sql       # Agenda de visitas
│   │   ├── 0021_internal_chat.sql         # Chat interno (canales, mensajes, reads)
│   │   ├── 0022_ml_webhook.sql            # Webhook ML (preguntas, órdenes)
│   │   ├── 0023_audit_log.sql             # activity_log + properties_history
│   │   ├── 0024_visits_enhancements.sql   # QR check-in, reminders, disponibilidad
│   │   ├── 0025_ml_auto_reply.sql         # Auto-respuesta a preguntas ML
│   │   ├── 0026_fix_audit_trigger.sql     # Fix trigger auditoría
│   │   ├── 0027_ml_orders_auto_reply.sql  # Auto-reply órdenes de compra
│   │   ├── 0028_rate_limit.sql            # Rate limiting (auth, RPCs)
│   │   ├── 0029_lead_tags_score.sql       # Tags y scoring de leads
│   │   ├── 0030_agent_permissions_commission_schedule.sql
│   │   ├── 0031_public_agents_view.sql    # Vista pública de agentes
│   │   ├── 0032_owners_module.sql         # Módulo propietarios: owners, price analyses, action plans, communications, reports
│   │   ├── 0033_fix_ml_grants.sql         # Fix grants ML
│   │   ├── 0034_ml_auto_delete.sql        # Auto-delete de publicaciones ML
│   │   ├── 0035_ml_sync_cron.sql          # Cron de sync ML
│   │   ├── 0036_fix_owners_audit_trigger.sql
│   │   ├── 0037_security_hardening.sql    # Endurecimiento de seguridad
│   │   ├── 0038_enable_realtime.sql       # Habilitar Realtime
│   │   ├── 0039_fix_audit_trigger_key_ambiguous.sql
│   │   ├── 0041_agents_realtime_shadow.sql # Tabla shadow agents_realtime
│   │   ├── 0042_security_hardening_rpc.sql # RPCs endurecidos (ml_enqueue, ml_get_connection)
│   │   ├── 0043_security_hardening_rpc_fix.sql
│   │   ├── 0044_valuation.sql             # Módulo Tasar: property_valuations, comparables, images, history, geocode_cache
│   │   ├── 0045_valuation_trigger_grants.sql
│   │   ├── 0046_valuation_add_missing_columns.sql
│   │   ├── 0047_fix_ml_auto_triggers.sql
│   │   ├── 0048_admin_users_hardening.sql
│   │   ├── 0049_admin_password_change_rpc.sql
│   │   ├── 0050_restrict_sync_agents_realtime.sql
│   │   ├── 0051_restrict_sync_agents_authenticated.sql
│   │   ├── 0053_trash_retention.sql       # trash_retention_policies
│   │   ├── 0054_site_settings_versions.sql # site_settings_versions (versionado CMS)
│   │   ├── 0055_site_settings_i18n.sql    # locale es-AR en site_settings
│   │   ├── 0056_ml_dead_letter_queue.sql  # ml_sync_dead_letter + rate_limit_logs
│   │   ├── 0057_ml_webhook_dedup.sql
│   │   ├── 0058_property_drafts.sql       # property_drafts (borradores de propiedades)
│   │   ├── 0059_ml_production_hardening.sql
│   │   ├── 0060_ml_connection_client_credentials.sql # client_id/secret cifrados en ml_connection
│   │   ├── 0061_combined_security_hardening.sql # RLS en tablas Tasar + retención + i18n
│   │   └── 0062_chat_ai_assistant.sql # Agente IA del chat (is_ai + seed Asistente BIENENHAUS)
│   ├── functions/            # 18 Edge Functions (Deno 2)
│   │   ├── admin-user-invite/          # Invitar/reset/remove admin users
│   │   ├── audit-log/                  # Log de acciones de staff
│   │   ├── chat-ai/                    # Asistente IA del chat interno (Gemini Flash)
│   │   ├── chat-upload/                # Upload de adjuntos del chat interno
│   │   ├── contact-submit/             # Formulario contacto landing (rate-limit + emails Resend)
│   │   ├── convert-image/              # Conversión/optimización de imágenes (WebP)
│   │   ├── ml-answer-question/         # Auto-respuesta a preguntas ML
│   │   ├── ml-bulk-enqueue/            # Encola sync masivo desde el admin
│   │   ├── ml-categories/              # Sync categorías ML
│   │   ├── ml-listing-types/           # Sync listing types ML
│   │   ├── ml-metrics/                 # Métricas de publicación ML
│   │   ├── ml-oauth/                   # OAuth ML callback
│   │   ├── ml-revoke-tokens/           # Revoca tokens ML
│   │   ├── ml-sync/                    # Queue processor (publish/update/delete ML)
│   │   ├── ml-webhook/                 # Webhook ML (preguntas, órdenes)
│   │   ├── process-retention-policies/ # Procesa políticas de retención de papelera
│   │   ├── qr-checkin/                 # Check-in por QR de visitas
│   │   ├── visits-process-reminders/   # Recordatorios de visitas
│   │   └── _shared/                    # crypto (AES-256-GCM), http (CORS+respond), ml (API helpers), auth, rate-limit, validaciones (leads/properties/visits/chat/site), auto_reply, visits
│   └── config.toml
│
├── docs/
│   ├── adr/                  # 4 ADRs (arquitectura, auth, ML, testing)
│   ├── api/                  # edge-functions.md
│   ├── design/               # Capturas + guías de diseño (landing/admin)
│   ├── features/             # valuation/ (architecture.md + audit.md)
│   ├── reviews/              # Planes de remediación por módulo
│   └── runbooks/             # backup-restore, deploy, incident-response, rollback
│
├── .github/workflows/        # 4 workflows (CI, Deploy Pages, Backup diario, Lighthouse CI)
├── package.json              # Workspace root (pnpm)
└── README.md
```

---

## 🛠️ Tecnologías

### Frontend

| Tecnología                    | Versión                | Uso                                                          |
| ----------------------------- | ---------------------- | ------------------------------------------------------------ |
| **Preact**                    | 10.26+                 | UI library (similar a React, 3kb)                            |
| **Vite**                      | 7.x                    | Bundler + dev server                                         |
| **TypeScript**                | 5.8+                   | Tipado estático estricto                                     |
| **Wouter (preact)**           | 3.10+                  | Router minimalista (hash routing en admin)                   |
| **TanStack Query**            | 5.x                    | Server state, caching, invalidation (admin)                  |
| **preact-signals**            | 2.x                    | Reactive state global (store)                                |
| **Lucide Preact**             | 1.28+                  | Iconos SVG                                                   |
| **Recharts**                  | 3.10+                  | Gráficos dashboard                                           |
| **Leaflet**                   | 1.9+                   | Mapas interactivos (módulo Tasar)                            |
| **React Hook Form**           | 7.84+                  | Formularios (Tasar, OwnerForm) + resolvers Zod               |
| **Zod**                       | 3.24+                  | Validación de esquemas (tipos derivados)                     |
| **Sentry**                    | 10.x (@sentry/browser) | Monitoreo de errores del admin (tracing + replay)            |
| **browser-image-compression** | 2.x                    | Compresión de imágenes en cliente (Tasar)                    |
| **CSS Modules**               | -                      | Estilos scoped + design tokens (`@bienenhaus/ui/tokens.css`) |

### Backend / Infraestructura

| Tecnología         | Versión | Uso                                                                        |
| ------------------ | ------- | -------------------------------------------------------------------------- |
| **Supabase**       | 2.x     | Postgres + Auth + Realtime + Storage + Edge Functions                      |
| **PostgreSQL**     | 17      | Base de datos principal                                                    |
| **PostgREST**      | -       | API REST auto-generada                                                     |
| **Realtime**       | -       | WebSockets para chat/visitas/agentes                                       |
| **Storage**        | -       | Buckets: property-images, agent-photos, site-images, chat-files            |
| **Edge Functions** | Deno 2  | 18 funciones (webhooks ML, OAuth, sync, visitas, contact, chat, retention, asistente IA) |
| **Deno**           | 2       | Runtime edge functions                                                     |

### Base de Datos (PostgreSQL 17)

- **Tablas principales**: `properties`, `leads`, `agents`, `admin_users`, `newsletter_subscribers`, `visits`, `chat_channels`, `chat_messages`, `chat_channel_participants`, `chat_message_reads`, `agent_availability`, `visit_reminders`
- **Módulo Propietarios**: `owners`, `property_owners`, `property_price_analyses`, `property_action_plans`, `action_plan_tasks`, `owner_communications`, `owner_reports`
- **Módulo Tasar**: `property_valuations` (120+ campos), `valuation_comparables`, `valuation_images`, `valuation_history` (auditoría automática), `geocode_cache`
- **Tablas ML**: `ml_connection`, `ml_sync_queue`, `ml_sync_history`, `property_ml_meta`, `agents_realtime`
- **Auditoría**: `activity_log`, `properties_history`, triggers `audit_property_change`, `audit_property_create`
- **RLS**: Políticas por tabla (public select solo `status = 'publicada'`, staff CRUD, soft delete via `deleted_at`, Tasar staff-only con defensa en profundidad)
- **Triggers**: `set_updated_at`, `audit_property_change`, `properties_ml_auto_publish`, `properties_ml_auto_update`, `ml_auto_delete`, `sync_agents_realtime`, `valuation_history_trigger`, `valuation_prevent_locked_update`
- **Enums**: `property_status`, `listing_type`, `lead_status`, `lead_intent`, `lead_source`, `visit_status`, `chat_channel_type`, `admin_role`, `owner_type`, `owner_preferred_contact`, `price_status`, `market_trend`, `action_plan_category`, `action_plan_priority`, `action_plan_status`, `communication_type`, `communication_status`, `report_type`

### Infraestructura & DevOps

- **pnpm** 11.20+ (workspaces)
- **Node.js** ≥ 20 (CI usa Node 22)
- **Docker**: Supabase CLI local (PostgreSQL, Studio, Realtime, Storage, Kong, Auth, Meta, Imgproxy, Logflare, Vector)
- **Demo Server**: `scripts/serve.mjs` (Node puro, single-port, proxy Supabase)
- **GitHub Actions**: CI (typecheck → test → E2E → build) + Deploy Pages + Backup diario + Lighthouse CI

---

## 📋 Requisitos

- **Node.js** ≥ 20 (LTS recomendado; CI usa 22)
- **pnpm** ≥ 11.20 (corepack habilitado)
- **Docker** + **Docker Compose** (para Supabase local)
- **Supabase CLI** (`corepack pnpm dlx supabase` o `npx supabase`)
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

Esto levanta: PostgreSQL (54322), Studio (54323), Kong API (54321), Realtime, Storage, Auth, Meta, Imgproxy, Logflare, Vector.

### 4. Aplicar migraciones y seed

```bash
corepack pnpm dlx supabase db reset
# o
npx supabase db reset
```

Ejecuta las **61 migraciones** + `seed.sql`.

> **Seed production-ready**: el seed NO incluye datos demo. Solo crea taxonomías
> (categorías, tipos de propiedad, ubicaciones, features, tags) y el contenido
> CMS del sitio. Propiedades, agentes, leads y usuarios se crean desde el panel.

### 4.1 (Opcional) Crear usuario admin

Sin seed de usuario demo, creá el primer admin desde la CLI o el dashboard de
Supabase Auth, y registralo en `admin_users` (rol `super_admin`).

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

| Variable | Descripción        | Ejemplo |
| -------- | ------------------ | ------- |
| `PORT`   | Puerto demo server | `5173`  |

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

| Variable                 | Descripción                                                           | App   |
| ------------------------ | --------------------------------------------------------------------- | ----- |
| `VITE_SUPABASE_URL`      | URL del proyecto Supabase (local `http://127.0.0.1:54321` / cloud)    | ambas |
| `VITE_SUPABASE_ANON_KEY` | Anon key (pública por diseño)                                         | ambas |
| `VITE_BASE_PATH`         | Base path de build (ej: `/admin/`)                                    | admin |
| `VITE_SENTRY_DSN`        | DSN de Sentry. **Opcional**: sin DSN no se inicializa ni reporta nada | admin |
| `VITE_APP_VERSION`       | Release reportado a Sentry. Default `dev`; en CI = SHA del commit     | admin |

### Edge Functions (supabase/functions/.env)

Copiar `supabase/functions/.env.example` → `supabase/functions/.env` y completar:

| Variable           | Descripción                                                   | Requerida |
| ------------------ | ------------------------------------------------------------- | --------- |
| `CRYPTO_SECRET`    | Clave AES-256-GCM para cifrar tokens ML                       | ✅        |
| `ML_CLIENT_ID`     | Client ID app Mercado Libre                                   | ✅        |
| `ML_CLIENT_SECRET` | Client Secret app Mercado Libre                               | ✅        |
| `ML_SYNC_SECRET`   | Secret compartido para invocar ml-sync                        | No        |
| `ADMIN_BASE_URL`   | Base URL admin para redirect OAuth                            | No        |
| `RESEND_API_KEY`   | API key de Resend para `contact-submit` (emails de consultas) | No*       |
| `GEMINI_API_KEY`   | API key de Google AI Studio para `chat-ai` (asistente IA del chat) | No*   |

> *Sin `RESEND_API_KEY` la función `contact-submit` guarda el lead pero los
> emails de consulta fallan en silencio.
>
> *Sin `GEMINI_API_KEY` el endpoint `chat-ai` responde 503 ("Asistente IA no
> configurado") y el chat funciona normalmente sin el asistente.

### Demo Server (scripts/serve.mjs)

Lee `process.env.PORT` (default 5173). Proxy a Supabase local en `127.0.0.1:54321`.

---

## ▶️ Ejecución

### Desarrollo (Hot Reload)

```bash
# Terminal 1: Supabase
corepack pnpm dlx supabase start

# Terminal 2: Landing (puerto 5173)
pnpm dev

# Terminal 3: Admin (puerto 5174)
pnpm dev:admin
```

> El admin dev server usa el puerto **5174** (baseURL de los E2E de Playwright).
> La landing usa el **5173**.

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

| Script               | Descripción                                               |
| -------------------- | --------------------------------------------------------- |
| `pnpm dev`           | Levanta landing en dev (puerto 5173)                      |
| `pnpm dev:admin`     | Levanta admin en dev (puerto 5174)                        |
| `pnpm build`         | Build todas las apps (`pnpm -r build`)                    |
| `pnpm demo`          | Inicia demo server single-port (`node scripts/serve.mjs`) |
| `pnpm typecheck`     | Typecheck todas las apps (`pnpm -r typecheck`)            |
| `pnpm test`          | Tests unitarios (`pnpm -r test`)                          |
| `pnpm test:coverage` | Tests unitarios con cobertura (admin)                     |
| `pnpm test:e2e`      | Tests E2E Playwright (admin)                              |
| `pnpm format`        | Prettier en todo el repo                                  |

### Apps (`apps/landing/package.json`, `apps/admin/package.json`)

| Script                  | Descripción                                                |
| ----------------------- | ---------------------------------------------------------- |
| `pnpm dev`              | `vite` (dev server + HMR)                                  |
| `pnpm build`            | `tsc --noEmit && vite build`                               |
| `pnpm preview`          | `vite preview`                                             |
| `pnpm typecheck`        | `tsc --noEmit`                                             |
| `pnpm test`             | `vitest run` (admin)                                       |
| `pnpm test:watch`       | `vitest` (admin)                                           |
| `pnpm test:ui`          | `vitest --ui` (admin)                                      |
| `pnpm test:coverage`    | `vitest run --coverage` (admin)                            |
| `pnpm test:integration` | `vitest run --config vitest.integration.config.ts` (admin) |
| `pnpm test:e2e`         | `playwright test` (admin)                                  |

### Supabase CLI

| Comando                         | Descripción                   |
| ------------------------------- | ----------------------------- |
| `supabase start`                | Inicia stack local            |
| `supabase stop`                 | Detiene stack                 |
| `supabase db reset`             | Reset DB + migraciones + seed |
| `supabase db push`              | Aplica migraciones pendientes |
| `supabase migration new <name>` | Crea nueva migración          |
| `supabase functions deploy`     | Despliega Edge Functions      |
| `supabase db diff`              | Diff schema vs migraciones    |

---

## 🗄️ Base de Datos

### Motor

- **PostgreSQL 17** (via Supabase local Docker)

### ORM / Acceso

- **`@bienenhaus/supabase`** — cliente compartido (singleton) usado por landing y admin
- **Supabase JS Client** (`@supabase/supabase-js` v2)
- **PostgREST** (API REST auto-generada)
- **Supabase Realtime** (WebSockets para chat/visitas/agentes)

### Migraciones

- Ubicación: `supabase/migrations/*.sql` (**61 archivos**, numerados 0001–0062)
- Naming: `NNNN_descripcion_corta.sql`
- Aplicar: `supabase db push` / `supabase db reset`
- Crear nueva: `supabase migration new nombre_corto`

### Tablas clave

| Tabla                                         | Descripción                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------------------- |
| `properties`                                  | Propiedades (status, listing_type, price, location, images, video, soft delete) |
| `leads`                                       | Contactos (status, intent, source, assigned_to agent, tags, score, soft delete) |
| `agents`                                      | Asesores (foto, especialidades, redes, activo, soft delete)                     |
| `admin_users`                                 | Usuarios panel (roles, must_change_password)                                    |
| `newsletter_subscribers`                      | Suscripciones (source, status, soft delete)                                     |
| `visits`                                      | Agenda (agent, property, lead, datetime, status, type)                          |
| `chat_channels` / `chat_messages`             | Canales y mensajes (direct, group, property, lead; reply, soft delete)          |
| `owners`                                      | Propietarios (persona física/jurídica, preferencia de contacto)                 |
| `property_price_analyses`                     | Análisis de precio por propiedad (status vs. mercado, tendencia)                |
| `property_action_plans` / `action_plan_tasks` | Planes de acción y tareas por propiedad                                         |
| `owner_communications`                        | Timeline de comunicaciones con propietarios (email, WhatsApp, call, meeting)    |
| `owner_reports`                               | Reportes generados para propietarios (price_analysis, visit_summary, etc.)      |
| `property_valuations`                         | Tasaciones (120+ campos, port exacto de TAI.html, drafts/finalizadas)           |
| `valuation_comparables`                       | Comparables de mercado (datos, fotos, coeficientes)                             |
| `valuation_history`                           | Historial de cambios de tasaciones (auditoría automática)                       |
| `geocode_cache`                               | Cache de geocoding (Nominatim)                                                  |
| `ml_connection`                               | Conexión ML (tokens cifrados AES-256-GCM)                                       |
| `ml_sync_queue`                               | Cola sync (publish/update/delete, retries)                                      |
| `ml_sync_dead_letter`                         | Cola de mensajes muertos de sync ML (0056)                                      |
| `property_ml_meta`                            | Estado publicación ML por propiedad                                             |
| `agents_realtime`                             | Tabla shadow para realtime de agentes                                           |
| `property_drafts`                             | Borradores de propiedades (0058)                                                |
| `site_settings_versions`                      | Versionado de contenido CMS (0054)                                              |
| `trash_retention_policies`                    | Políticas de retención de papelera (0053)                                       |
| `rate_limit_logs`                             | Logs de rate limiting (0056)                                                    |

---

## 🔌 API

### PostgREST (Auto-generada)

Base: `http://localhost:54321/rest/v1/`

- Auth: `apikey` + `Authorization: Bearer <jwt>`
- Filtros: `?select=*,relation(*)&status=eq.publicada&order=created_at.desc`
- Docs: `http://localhost:54321/rest/v1/` (OpenAPI)

### RPCs (funciones SQL expuestas)

- `ml_enqueue(property_id, operation)` — encola sync ML (endurecido, staff-only)
- `ml_get_connection()` — devuelve la conexión ML del staff
- `ml_auto_delete()` / `ml_auto_update()` — mantienen sincronización ML
- `sync_agents_realtime()` — sincroniza la tabla shadow de agentes
- `valuation_prevent_locked_update()` — trigger que bloquea edición de tasaciones finalizadas
- `valuation_history_trigger()` — auditoría automática de cambios en tasaciones
- RPCs de landing: `subscribe_newsletter`, `submit_contact`, `get_public_properties`, `get_public_locations` (rate-limit + honeypot)

### Edge Functions (Deno)

Base: `http://localhost:54321/functions/v1/`

| Función                      | Método                                  | Descripción                                                           |
| ---------------------------- | --------------------------------------- | --------------------------------------------------------------------- |
| `admin-user-invite`          | POST `{action, email, full_name, role}` | Invite/reset/remove admin users                                       |
| `audit-log`                  | POST                                    | Registra acciones de staff en `activity_log`                          |
| `chat-upload`                | POST                                    | Upload de adjuntos del chat interno                                   |
| `chat-ai`                    | POST `{channel_id, message_id}`         | Asistente IA del chat (Gemini Flash, responde como agente virtual)    |
| `contact-submit`             | POST                                    | Formulario de contacto landing (honeypot + rate limit + email Resend) |
| `convert-image`              | POST                                    | Conversión/optimización de imágenes (WebP)                            |
| `ml-answer-question`         | POST                                    | Auto-respuesta a preguntas de publicaciones ML                        |
| `ml-bulk-enqueue`            | POST                                    | Encola propiedades para sync masivo                                   |
| `ml-categories`              | GET                                     | Sincroniza categorías ML                                              |
| `ml-listing-types`           | GET                                     | Sincroniza listing types ML                                           |
| `ml-metrics`                 | GET                                     | Métricas de publicación ML                                            |
| `ml-oauth`                   | GET `/callback?code=&state=`            | OAuth callback ML, guarda tokens cifrados                             |
| `ml-revoke-tokens`           | POST                                    | Revoca tokens de conexión ML                                          |
| `ml-sync`                    | POST                                    | Procesa cola `ml_sync_queue` (publish/update/delete)                  |
| `ml-webhook`                 | POST                                    | Webhook ML (preguntas, órdenes de compra)                             |
| `process-retention-policies` | POST (scheduled)                        | Procesa políticas de retención de papelera                            |
| `qr-checkin`                 | POST                                    | Check-in de visita por QR                                             |
| `visits-process-reminders`   | POST (scheduled)                        | Genera recordatorios de visitas                                       |

#### Autenticación Edge Functions

- Header: `Authorization: Bearer <service_role_key>` o `x-sync-secret: <ML_SYNC_SECRET>`
- Validación: `is_admin()` / `is_staff()` via JWT
- Helpers compartidos en `_shared/`: `http.ts` (CORS + `respond()`), `rate-limit.ts`, validaciones Zod por dominio (leads, properties, visits, chat, site), `crypto.ts` (AES-256-GCM)

---

## 🔗 Integraciones

| Integración                 | Propósito                                                               | Configuración                                                                                               |
| --------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Mercado Libre**           | Publicar/actualizar/eliminar propiedades, OAuth, auto-delete, cron sync | `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `CRYPTO_SECRET`                                                         |
| **Supabase Auth**           | Email/password, magic link, rate limits, MFA (TOTP)                     | `auth` config.toml                                                                                          |
| **Supabase Storage**        | Imágenes propiedades/agentes/sitio/chat                                 | Buckets: `property-images`, `agent-photos`, `site-images`, `chat-files` (fotos de tasaciones: base64 en DB) |
| **Supabase Realtime**       | Chat, visitas, agentes, notificaciones                                  | Habilitado en config.toml + migración 0038                                                                  |
| **Supabase Edge Functions** | Webhooks ML, OAuth, sync, visitas, contacto                             | Deno 2, secrets via env                                                                                     |
| **Leaflet + Nominatim**     | Mapas y geocoding del módulo Tasar                                      | CDN, sin API key                                                                                            |
| **Resend**                  | Emails transaccionales (contact-submit)                                 | `RESEND_API_KEY` (dominio bienenhaus.com.ar verificado)                                                     |
| **Sentry**                  | Monitoreo de errores (admin, release por commit)                        | `VITE_SENTRY_DSN`, `VITE_APP_VERSION`                                                                       |
| **WhatsApp Click-to-Chat**  | Leads detalle                                                           | `wa.me/<phone>?text=...`                                                                                    |
| **MercadoPago/Stripe**      | (Preparado) Reservas online                                             | -                                                                                                           |

---

## 🔒 Seguridad

| Mecanismo                  | Implementación                                                                                    |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| **Autenticación**          | Supabase Auth (email/password, JWT, refresh rotation, MFA TOTP)                                   |
| **Autorización**           | RLS policies por tabla (`is_staff()`, `is_admin()`, ownership) + guards por ruta                  |
| **Roles Admin**            | `super_admin`, `admin`, `staff`, `viewer` (tabla `admin_users`)                                   |
| **Cifrado Tokens ML**      | AES-256-GCM (`CRYPTO_SECRET` → `lib/crypto.ts`)                                                   |
| **Soft Delete**            | Columna `deleted_at` + RLS (`deleted_at IS NULL` para public)                                     |
| **RPCs endurecidos**       | Migraciones 0037/0042/0043: `ml_enqueue`, `ml_get_connection` y helpers solo accesibles por staff |
| **Defensa en profundidad** | Módulo Tasar: RLS `is_staff()` + owner read, sin acceso anon                                      |
| **CORS**                   | Configurado en Edge Functions + demo server (`*`)                                                 |
| **Rate Limiting**          | Auth (email/sms/signin), Edge Functions, RPCs landing (honeypot + ventana por hora)               |
| **Validación**             | Zod schemas en formularios admin (Tasar, owners, auth)                                            |
| **CSP / Headers**          | Demo server + Vite dev server                                                                     |
| **Secrets**                | Variables de entorno, `.env.example`, nunca en git                                                |

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

| Variable                 | Valor                                                          |
| ------------------------ | -------------------------------------------------------------- |
| `VITE_SUPABASE_URL`      | `https://rnldqiwwzhjnurkguihu.supabase.co`                     |
| `VITE_SUPABASE_ANON_KEY` | anon key del cloud (pública por diseño)                        |
| `SITE_DOMAIN`            | opcional; si se define escribe `out/CNAME` para dominio custom |
| `VITE_SENTRY_DSN`        | opcional; si se define, el admin reporta errores a Sentry      |

**Pasos una sola vez:**

1. En GitHub: Settings → Pages → Source = **GitHub Actions**.
2. Habilitar Pages en el repo y correr el workflow (o hacer push a `main`/`master`).
3. Para dominio propio: configurar `SITE_DOMAIN`, agregar el CNAME/apex en el
   DNS y setear el custom domain en Settings → Pages.
4. En Supabase Cloud (proyecto `rnldqiwwzhjnurkguihu`): en **Auth → URL
   Configuration** setear `Site URL` = `https://<tu-dominio.com>` y agregar
   `https://<tu-dominio.com>/admin/**` en _Redirect URLs_ (el callback de login
   entra por `/admin/`).
5. Verificar **Edge Functions** activas y los webhooks de MercadoLibre.

**Anti-spam (landing):** `subscribe_newsletter` y `submit_contact` validan un
**honeypot** (`p_hp` oculto; si viene lleno responden éxito falso sin insertar)
y aplican **rate limit** por ventana de tiempo (50 altas/hora newsletter, 30
consultas/hora contacto + 1 por email cada 24h).

### CI (`.github/workflows/ci.yml`)

Pipeline en cada push/PR a `master`: **TypeCheck → Unit Tests → E2E → Build**
(Node 22, pnpm 11.20). El job E2E levanta Supabase local, aplica migraciones +
seed, crea un usuario de test vía Admin API y corre Playwright.

### Lighthouse CI (`.github/workflows/lighthouse-ci.yml`)

Auditoría de performance de la **landing** en cada PR (`workflow_dispatch`
manual también). Presets desktop (Performance ≥ 98) y mobile, usando
`apps/landing/lighthouserc*.json`. Los fallos no bloquean el PR
(`continue-on-error`) pero dejan comentario con los budgets.

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
comparte con el usuario. El login usa `signInWithPassword` (sin emails).

El formulario de contacto de la landing sí envía emails vía **Resend**
(`contact-submit` + `RESEND_API_KEY`).

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

| Variable                   | Valor                                                        |
| -------------------------- | ------------------------------------------------------------ |
| `SUPABASE_ACCESS_TOKEN`    | PAT `sbp_...` (dashboard → account → access tokens)          |
| `SMTP_HOST/PORT/USER/PASS` | datos del proveedor                                          |
| `SMTP_SENDER_EMAIL`        | `no-reply@<tu-dominio>` (dominio verificado en el proveedor) |
| `SMTP_SENDER_NAME`         | `BIENENHAUS`                                                 |
| `SITE_URL`                 | `https://bienenhaus.com.ar/admin` (ya aplicado)              |
| `REDIRECT_URLS`            | `https://bienenhaus.com.ar/admin/**` (ya aplicado)           |

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
2. `supabase db reset` → DB limpia + seed (production-ready, sin datos demo)
3. `pnpm dev` / `pnpm dev:admin` → hot reload
4. Cambios DB → `supabase migration new nombre` → edita SQL → `supabase db push`
5. Cambios Edge Functions → `supabase functions serve` (local) → `supabase functions deploy`

### Convenciones

- **TypeScript strict**: `tsc --noEmit` en cada build
- **Prettier**: `pnpm format` antes de commit
- **Naming**: kebab-case archivos, PascalCase componentes, camelCase variables
- **Componentes**: Un archivo por componente, co-located styles (CSS Modules)
- **Design System**: componentes reutilizables en `@bienenhaus/ui` (atoms/molecules, cada uno con `*.stories.tsx` + `*.test.tsx`)
- **Estado**: `preact-signals` para global, TanStack Query para server state
- **Estilos**: Design tokens en `@bienenhaus/ui/tokens.css` (admin) / `landing.css` (landing)
- **Tipos**: esquemas Zod como fuente de verdad → tipos derivados (ej. `valuationSchemas.ts` → `valuationTypes.ts`)

### Testing

```bash
pnpm test            # Unit (Vitest): admin + @bienenhaus/ui
pnpm test:e2e        # E2E (Playwright): login, admin-pages, create-property,
                     #   owners-crud, visits-agents-ml, tasar, visual
```

- **Unit**: componentes (`Shell`, `Sidebar`, `Topbar`, `ErrorBoundary`, `OwnerForm`, componentes de `@bienenhaus/ui`), lógica pura (`csv`, `validators`, `valuationCalculations`), APIs (`owners/api`)
- **E2E**: corre contra Supabase local (`supabase start` + `db reset` + usuario de test); el proyecto `setup` autentica una vez (`auth.setup.ts`) y comparte `storageState` entre suites (`workers=1` para evitar carreras sobre los fixtures)
- **Visual regression**: `visual.spec.ts` con baselines por plataforma (no corre en CI/Linux sin baselines)
- **Estado actual (2026-08)**: suite E2E completa verde — 20 passed, 5 skipped (baselines visuales). Fix aplicado: invalidación con prefijos puros en `valuationApi.ts`, `properties.api.ts`, `agents.api.ts` y `visits.api.ts` (compatibilidad con TanStack Query ≥ 5.101, que no tolera `undefined` en claves de invalidación)

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
- [x] **Módulo Tasar (valuaciones)** — hecho: formulario 120+ campos, comparables, mapa, PDF, borradores, historial
- [x] **Módulo Propietarios** — hecho: CRUD, price analysis, action plans, comunicaciones, reportes PDF
- [x] **Tipado inductivo** — hecho: tipos generados en `apps/admin/src/types/database.ts` y esquemas Zod
- [x] **Design System** — hecho (en evolución): `@bienenhaus/ui` con 24+ componentes, stories y tests
- [ ] **Tests** (ampliar cobertura: sync ML, chat)
- [ ] **Storybook** (runner) para el design system (`@bienenhaus/ui` ya tiene stories)
- [ ] **i18n** (es/en/pt) con `i18next` o similar
- [ ] **Analytics** (Plausible/Umami + eventos custom)
- [x] **Backup automatizado** — hecho: `.github/workflows/backup.yml` (pg_dump diario, retención 90 días)
- [x] **Monitoreo** — Sentry integrado en el admin + Lighthouse CI; pendiente uptime monitor
- [x] **CI/CD completo** — hecho: CI (typecheck/test/E2E/build) + Deploy Pages + Backup + Lighthouse
- [x] **E2E estable** — hecho (2026-08): 7 suites verdes tras fix de invalidación de query keys (TanStack Query ≥ 5.101)
- [ ] **Unificar clientes Supabase** — migrar el admin al paquete `@bienenhaus/supabase` (elimina 2ª/3ª instancia)
- [x] **Extender fix de invalidación** — hecho (2026-08): prefijos puros en `agents.api.ts` + `visits.api.ts`; `ml.api.ts` verificado OK (invalidaciones de página con claves literales puras)

---

## 📄 Licencia

> **Pendiente de definir** — Actualmente código privado. Definir licencia antes de publicación (MIT, Apache 2.0, propietaria, etc.).

---

## 👤 Autor

**Facundo Herrera** — `hfacundo45@gmail.com`

---

## 📝 Observaciones

| Aspecto                    | Estado | Comentario                                                                                            |
| -------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| **README**                 | ✅     | Actualizado a estado 2026-08-13 (61 migraciones, 18 edge functions, puertos dev reales, E2E verde)    |
| **Tests automatizados**    | ✅     | Vitest (admin + @bienenhaus/ui) + Playwright E2E (7 suites)                                           |
| **CI/CD**                  | ✅     | GitHub Actions: CI (typecheck/test/E2E/build) + Deploy Pages + Backup diario + Lighthouse CI          |
| **Docker Compose prod**    | ❌     | Solo Supabase local CLI                                                                               |
| **Variables producción**   | ⚠️     | Documentadas; faltan algunos vars/secrets en el repo (ej. `VITE_SENTRY_DSN`, `SUPABASE_ACCESS_TOKEN`) |
| **Edge Functions secrets** | ⚠️     | Requieren `supabase secrets set` en cloud                                                             |
| **Tipado DB → TS**         | ✅     | Tipos generados (`database.ts`) + esquemas Zod con tipos derivados                                    |
| **Tests E2E críticos**     | ✅     | Login, admin-pages, create-property, owners-crud, visits-agents-ml, tasar, visual — **verde**         |
| **Documentación API**      | ⚠️     | `docs/api/edge-functions.md` + OpenAPI auto-generada; sin OpenAPI custom                              |
| **Monitoreo/Logs**         | ✅     | Sentry en admin (release por commit) + Lighthouse CI + Supabase logs; falta uptime monitor            |
| **Dead code**              | ✅     | Limpiado: `ml-ingest` eliminado, scripts de debug, archivos AI sueltos, `CORRECCIONES_IA/` pendiente  |

> **Recomendación**: Antes de ir a producción, setear los secrets/variables que
> faltan en el repo (Sentry DSN, Supabase access token), configurar SMTP si se
> necesitan emails de auth, y documentar runbooks de incidentes (caída
> Supabase, rate limit ML, migración fallida).

### Deuda técnica conocida (2026-08)

| Deuda                            | Detalle                                                                                                                                                                                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Clientes Supabase duplicados** | 3 instancias: admin (`supabase.ts` tipado), landing (`supabase-data.ts` via `@bienenhaus/supabase`), landing fetch directo (`supabase.ts`). Migrar admin al paquete compartido.                                                           |
| **Invalidación de query keys**   | Fix completo (2026-08): prefijos puros en `valuationApi.ts`, `properties.api.ts`, `agents.api.ts`, `visits.api.ts`; `ml.api.ts` verificado OK (invalidaciones de página con claves literales puras, sin `queryKeys.x()` con `undefined`). |
| **Lint debt**                    | ~258 errores pre-existentes en 91 archivos (`no-explicit-any`, `no-duplicate-imports`); CI lint es diff-scoped.                                                                                                                           |
| **Coverage unit**                | Pocos tests unitarios para módulos críticos (sync ML, chat, visits).                                                                                                                                                                      |
| **Docs operativas**              | Sin ADRs nuevos post-004, runbooks parciales.                                                                                                                                                                                             |
