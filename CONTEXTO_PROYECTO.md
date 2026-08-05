# CONTEXTO_PROYECTO.md — BIENENHAUS PROPIEDADES

> Documento de referencia para que cualquier IA pueda entender la arquitectura, convenciones, patrones y estado actual del código. Úsalo como punto de partida antes de tocar cualquier archivo.

---

## 1. Visión General

**Producto**: Landing pública + Panel administrativo integral para inmobiliaria (BIENENHAUS Propiedades).

**Stack principal**:
- **Frontend**: Preact 10.26 + Vite 7 + TypeScript 5.8 (strict) + Wouter (router) + TanStack Query 5 (server state) + preact-signals 2 (state global) + Lucide Preact (iconos) + Recharts (gráficos) + Zod (validación) + React Hook Form + CSS Modules
- **Backend/Infra**: Supabase (PostgreSQL 17 + Auth + Realtime + Storage + Edge Functions Deno 2)
- **Monorepo**: pnpm workspaces (apps/admin, apps/landing, packages/bienenhaus-ui)
- **CI/CD**: GitHub Actions (typecheck, tests, E2E Playwright, deploy GitHub Pages, backup diario pg_dump)
- **Testing**: Vitest (unit), Playwright (E2E), MSW (mocks)
- **Monitoreo**: Sentry (solo admin, opcional via `VITE_SENTRY_DSN`)

**Apps**:
- `apps/landing` — Landing pública (Preact, puerto 5174 dev)
- `apps/admin` — Panel admin (Preact, puerto 5175 dev, base `/admin/`, hash routing)

**Demo single-port**: `pnpm build && node scripts/serve.mjs` → Landing en `/`, Admin en `/admin/`, proxy Supabase en `/rest`, `/auth`, `/storage`, `/functions`.

---

## 2. Estructura del Monorepo

```
landing/
├── apps/
│   ├── landing/                 # Landing pública
│   │   ├── src/
│   │   │   ├── components/      # Hero, Navbar, Catalog, PropertyCard, PropertyModal, Footer, Stats, Services, Process, Contact, Team, TransitionStrip, VideoModal, JsonLd
│   │   │   ├── hooks/           # useReveal, useSpotlight, useCountUp
│   │   │   ├── lib/             # supabase.ts, content.ts, newsletter.ts, images.ts, site-settings.ts, supabase-data.ts
│   │   │   ├── data/            # properties.ts, contactFieldConfigs.ts, generated.d.ts (tipos Supabase)
│   │   │   ├── App.tsx          # Página única (SPA)
│   │   │   ├── main.tsx         # Entry point
│   │   │   └── styles/          # landing.css (design system completo: tokens, reset, components, utilities)
│   │   ├── public/              # favicon, manifest, hero image
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── admin/                   # Panel administrativo
│       ├── src/
│       │   ├── components/      # Shell, Sidebar, Topbar, ToastHost, DashboardCharts, RecentActivity, QuickPropertyActions, PropertyImageGallery, ImageLightbox, CommandPalette + owners/ (10 componentes)
│       │   ├── hooks/           # useReveal
│       │   ├── lib/             # 23 archivos .ts + 4 .api.ts + sentry.ts + validators.ts + supabase.ts + csv.ts + adminUsers.ts + activity.ts + chat.ts + ml.ts + ml.api.ts + newsletter.ts + site.ts + visits.ts + leads.ts + agents.ts + properties.ts
│       │   ├── pages/           # 28 páginas .tsx (Dashboard, Properties, PropertiesPage, PropertyFormPage, Leads, LeadDetail, LeadForm, Agents, AgentForm, AdminUsers, Trash, Visits, Chat, MercadoLibre, Newsletter, Site, Config, AuditLog + Owners (7 páginas) + PriceAnalysis + ActionPlans (3) + Communications + Reports)
│       │   ├── store/           # app.ts (signals globales: authSession, authUserRole, authLoading, sidebarCollapsed, mobileMenuOpen, toasts + initAuth())
│       │   ├── types/           # database.ts (generado), properties.ts, owners.ts, admin.ts, etc.
│       │   ├── App.tsx          # Router (wouter), ProtectedRoutes, withRoleGuard, RoleRouteProps
│       │   ├── main.tsx         # Entry + initAuth() + Sentry init
│       │   └── styles/          # styles.css (design system admin + componentes)
│       ├── index.html
│       ├── vite.config.ts       # base: '/admin/', proxy Supabase en dev
│       └── package.json
│
├── packages/
│   └── bienenhaus-ui/           # Shared UI (Button, tokens.css)
│
├── scripts/
│   ├── serve.mjs                # Demo server single-port (Node http, SPA fallback, proxy Supabase)
│   ├── build-pages.mjs          # Build para GitHub Pages (genera out/)
│   ├── fetch-data.mjs
│   └── configure-smtp.mjs
│
├── supabase/
│   ├── config.toml              # Config local (puertos, auth, realtime, storage, edge functions, functions.ml-oauth/webhook verify_jwt=false)
│   ├── seed.sql                 # Admin user, propiedades ejemplo, agentes, leads
│   ├── migrations/              # 32 migraciones SQL (0001_foundation → 0032_owners_module)
│   └── functions/               # 14 Edge Functions (Deno 2)
│       ├── _shared/             # crypto.ts (AES-256-GCM), ml.ts (API helpers), visits.ts, auto_reply.ts
│       ├── admin-user-invite/   # Invitar/reset/remove admin users
│       ├── audit-log/           # Log acciones staff → activity_log
│       ├── contact-submit/      # Form contacto landing (honeypot + rate limit)
│       ├── ml-answer-question/  # Auto-respuesta preguntas ML
│       ├── ml-bulk-enqueue/     # Encola sync masivo desde admin
│       ├── ml-categories/       # Sync categorías ML
│       ├── ml-ingest/           # Ingesta propiedades (legacy, solo local)
│       ├── ml-listing-types/    # Sync listing types ML
│       ├── ml-metrics/          # Métricas publicación ML
│       ├── ml-oauth/            # OAuth callback ML, guarda tokens cifrados
│       ├── ml-sync/             # Procesa cola ml_sync_queue (publish/update/delete)
│       ├── ml-webhook/          # Webhook ML (preguntas, órdenes)
│       ├── qr-checkin/          # Check-in visita por QR
│       └── visits-process-reminders/ # Recordatorios visitas (scheduled)
│
├── .github/workflows/
│   ├── ci.yml                   # TypeCheck + Tests (unit + E2E) en push/PR a master
│   ├── deploy-pages.yml         # Build + Deploy GitHub Pages (landing en /, admin en /admin/)
│   └── backup.yml               # pg_dump diario 03:00 UTC (retención 90 días)
│
├── .omo/                        # Planes y drafts de trabajo (planeación estructurada)
│   ├── planes/modulo-propietarios.md     # Plan v1.0 (7 fases, 2026-08-04)
│   ├── drafts/ml-enterprise-hardening.md # Draft hardening ML (9 componentes C1-C9)
│   └── plans/fix-admin-lib-ts-errors.md  # Plan previo
│
├── package.json                 # Workspace root (scripts dev, build, demo, typecheck, format, test)
├── pnpm-workspace.yaml          # packages: apps/*, packages/*; allowBuilds: esbuild, msw
├── tsconfig.base.json           # TS strict, paths @/*, @admin/*, @landing/*
├── README.md                    # Documentación completa del proyecto
└── .env.example, .env.smtp, .gitignore, .prettierrc
```

---

## 3. Convenciones de Código (OBLIGATORIAS)

| Aspecto | Regla | Referencia |
|---------|-------|------------|
| **TypeScript** | `strict: true`, `noUnusedLocals/Parameters: true`, `noEmit: true` | `tsconfig.base.json` |
| **Imports** | Alias: `@/...`, `@lib/...`, `@components/...`, `@pages/...`, `@store/...`, `@types/...` (admin) | `apps/admin/vite.config.ts` |
| **Naming** | kebab-case archivos, PascalCase componentes, camelCase variables | README |
| **Componentes** | 1 archivo por componente, co-located styles (CSS Modules) | Patrón en `components/` |
| **Estado** | `preact-signals` para global, TanStack Query para server state | `store/app.ts`, `lib/*.api.ts` |
| **Validación** | Zod schemas en `validators.ts` + `z.infer<>` | `lib/validators.ts` |
| **Soft Delete** | Columna `deleted_at` + `.is('deleted_at', null)` por defecto, TrashPage para restaurar/purgar | `properties.ts`, `TrashPage.tsx` |
| **RLS** | Policies: staff (all), viewer (select), anon (public select solo `status='publicada'`) | Migraciones 0007, 0009, 0023, 0026 |
| **Edge Functions** | Deno 2, secrets via env, `verify_jwt=false` para ml-oauth/webhook | `supabase/config.toml` |
| **Cifrado ML** | AES-256-GCM con `CRYPTO_SECRET` → `lib/crypto.ts` | `_shared/crypto.ts` |
| **Build** | `tsc --noEmit && vite build` (typecheck antes de build) | `package.json` scripts |

---

## 4. Base de Datos (PostgreSQL 17 via Supabase)

### Tablas Principales
| Tabla | Propósito | Soft Delete | RLS Key |
|-------|-----------|-------------|---------|
| `properties` | Propiedades (status, listing_type, price, location, images, video) | ✅ | `status='publicada'` para public |
| `leads` | Contactos (status, intent, source, assigned_to agent) | ✅ | staff CRUD, anon none |
| `agents` | Asesores (foto, especialidades, redes, activo) | ✅ | staff CRUD |
| `admin_users` | Usuarios panel (roles, must_change_password) | ❌ | staff CRUD |
| `newsletter_subscribers` | Suscripciones (source, status) | ✅ | anon insert, staff select |
| `visits` | Agenda (agent, property, lead, datetime, status, type) | ✅ | staff CRUD |
| `chat_channels` | Canales (direct, group, property, lead) | ✅ | participants |
| `chat_messages` | Mensajes (text, file, image, reply) | ✅ | participants |
| `activity_log` | Auditoría legacy (staff actions) | ❌ | staff insert/select |

### Tablas MercadoLibre
| Tabla | Propósito |
|-------|-----------|
| `ml_connection` | Conexión ML (tokens cifrados AES-256-GCM) |
| `ml_sync_queue` | Cola sync (publish/update/delete, retries, locked_by, attempts) |
| `ml_sync_history` | Historial sync (queue_id, operation, status, attempt, response, error) |
| `property_ml_meta` | Estado publicación ML por propiedad (ml_item_id, permalink, price, status, raw) |

### Tablas Módulo Propietarios (nuevo — migración 0032)
| Tabla | Propósito |
|-------|-----------|
| `owners` | Propietarios (tipo, contacto preferido, datos fiscales, notas) |
| `property_owners` | Vinculación propiedad-propietario (% propiedad, contacto principal, rol) |
| `property_price_analyses` | Análisis de precio (precio mercado, comparables, tendencia, recomendación) |
| `property_action_plans` | Planes de acción por propiedad (categoría, prioridad, status, fechas) |
| `action_plan_tasks` | Tareas de planes (status, due_date, assigned_to) |
| `owner_communications` | Timeline comunicaciones (tipo, status, asunto, contenido, WhatsApp/email) |
| `owner_reports` | Reportes generados (tipo, content_json, title, status) |

### Enums Clave
- `property_status`: `borrador | publicada | pausada | vendida | alquilada`
- `listing_type`: `venta | alquiler | alquiler_temporario`
- `lead_status`: `nuevo | en_proceso | calificado | descartado | cerrado`
- `lead_intent`: `compra | alquiler | informacion | otro`
- `lead_source`: `landing | ml | whatsapp | email | telefono | referencia | otro`
- `visit_status`: `programada | confirmada | realizada | cancelada | no_show`
- `chat_channel_type`: `direct | group | property | lead`
- `admin_role`: `super_admin | admin | staff | viewer`
- **Nuevos (owners)**: `owner_type`, `owner_preferred_contact`, `price_status`, `market_trend`, `action_plan_category`, `action_plan_priority`, `action_plan_status`, `communication_type`, `communication_status`, `report_type`

### Migraciones Recientes (últimas 5)
1. `0032_owners_module.sql` — 7 tablas + 8 enums + RLS + triggers + grants (módulo propietarios)
2. `0031_public_agents_view.sql` — Vista pública de agentes
3. `0030_agent_permissions_commission_schedule.sql` — Permisos/comisiones/horarios agentes
4. `0029_lead_tags_score.sql` — Tags JSONB + score CRM en leads
5. `0028_rate_limit.sql` — Rate limit anti-spam landing (newsletter/contacto)

### Funciones/RPCs BD
- `log_audit()` — SECURITY DEFINER, escribe en `audit_logs` bypassando RLS
- `audit_trigger()` — Trigger genérico para auditoría (COALESCE + to_jsonb)
- `ml_enqueue()` — Encola sync ML (property_id, operation, force)
- Triggers: `properties_ml_auto_publish`, `properties_ml_auto_update`, `set_updated_at`

---

## 5. Edge Functions (Deno 2) — Catálogo

| Función | Trigger | Propósito | Auth |
|---------|---------|-----------|------|
| `ml-oauth` | GET `/callback?code&state` | OAuth ML → guarda tokens cifrados | `verify_jwt=false` |
| `ml-sync` | POST (cron/manual) | Procesa `ml_sync_queue` (publish/update/delete) | service_role / ML_SYNC_SECRET |
| `ml-webhook` | POST (ML webhook) | Preguntas/órdenes ML → `ml_sync_queue` + auto-reply | `verify_jwt=false` |
| `ml-ingest` | POST (legacy) | Ingesta propiedades desde ML (solo local) | service_role |
| `ml-bulk-enqueue` | POST (admin) | Encola propiedades para sync masivo | service_role |
| `ml-answer-question` | POST | Auto-respuesta preguntas ML | service_role |
| `ml-categories` | GET | Sync categorías ML | service_role |
| `ml-listing-types` | GET | Sync listing types ML | service_role |
| `ml-metrics` | GET | Métricas publicación ML | service_role |
| `contact-submit` | POST (landing) | Form contacto (honeypot + rate limit) | anon |
| `admin-user-invite` | POST | Invite/reset/remove admin users | service_role |
| `audit-log` | POST | Log acciones staff → `activity_log` | service_role |
| `qr-checkin` | POST | Check-in visita por QR | service_role |
| `visits-process-reminders` | POST (scheduled) | Genera recordatorios visitas | service_role |

**Shared helpers** (`_shared/`):
- `crypto.ts` — AES-256-GCM encrypt/decrypt (tokens ML)
- `ml.ts` — `exchangeCode`, `refreshToken`, `getMe`, `publishProperty`, `updateProperty`, `deleteProperty`, `getCategories`, `getListingTypes`, `answerQuestion`, `categorizeMlError`, `isRetryableError`
- `visits.ts` — Helpers recordatorios
- `auto_reply.ts` — Lógica auto-respuesta ML

---

## 6. Frontend — Patrones Críticos

### Admin Store (`apps/admin/src/store/app.ts`)
```typescript
// Signals globales
authSession: signal<Session | null>(null)
authLoading: signal(true)
authUserRole: signal<'super_admin'|'admin'|'staff'|'viewer'|null>(null)
sidebarCollapsed: signal(false)
mobileMenuOpen: signal(false)
toasts: signal<ToastItem[]>([])

// initAuth() — llamado en main.tsx
// - getSession + fetchUserRole(email)
// - onAuthStateChange → update signals + redirect SIGNED_IN/SIGNED_OUT
// - cleanAuthHash() limpia hash URL con tokens
```

### API Pattern (cada módulo = `lib/{module}.ts` + `lib/{module}.api.ts`)
```typescript
// lib/properties.ts — Funciones puras Supabase (CRUD, upload, ML bulk)
export async function fetchProperties(filters): Promise<PropertyRow[]>
export async function createProperty(data): Promise<PropertyRow>
export async function uploadPropertyImage(file, propertyId): Promise<string>

// lib/properties.api.ts — Hooks TanStack Query
export const propertiesKeys = { all: ['properties'], lists: () => ..., list: (filters) => ..., detail: (id) => ... }
export function useProperties(filters) { return useQuery({ queryKey: propertiesKeys.list(filters), queryFn: () => fetchProperties(filters) }) }
export function useCreateProperty() { return useMutation({ mutationFn: createProperty, onSuccess: () => queryClient.invalidateQueries({ queryKey: propertiesKeys.all }) }) }
```

### Zod + React Hook Form
```typescript
// validators.ts
export const propertySchema = z.object({
  title: z.string().min(3),
  price: z.number().positive(),
  // ...
})
export type PropertyFormValues = z.infer<typeof propertySchema>

// En página:
const form = useForm<PropertyFormValues>({ resolver: zodResolver(propertySchema) })
```

### Rutas Admin (`App.tsx`)
- Hash routing (wouter-preact)
- `ProtectedRoutes` + `Switch` + `Route`
- `withRoleGuard(Component, minRole)` — wrapper que chequea `authUserRole.value` vs `ROLE_RANK`
- Rutas nuevas (módulo propietarios):
  - `/propietarios` → `OwnersPage`
  - `/propietarios/nuevo` → `OwnerFormPage`
  - `/propietarios/:id` → `OwnerDetailPage`
  - `/propiedades/:id/analisis` → `PriceAnalysisPage`
  - `/propiedades/:id/planes` → `ActionPlansPage`
  - `/planes-accion` → `ActionPlansDashboard`
  - `/planes-accion/:id` → `ActionPlanDetailPage`
  - `/comunicaciones` → `CommunicationsPage`
  - `/reportes` → `ReportsPage`

### Sidebar (`Sidebar.tsx`)
- `NavItem[]` con `href`, `label`, `icon`, `roles?: AdminRole[]`
- Filtrado por `authUserRole.value` via `hasMinRole()`
- Items propietarios pendientes de integrar (Fase 7 del plan)

---

## 7. Módulo Propietarios — Estado Actual

**Plan**: `.omo/planes/modulo-propietarios.md` (v1.0, 2026-08-04, 7 fases)

| Fase | Estado | Entregables |
|------|--------|-------------|
| 1. Fundación | ✅ 90% | Migración `0032_owners_module.sql`, `types/owners.ts`, `lib/owners/schemas.ts`, `lib/owners/owners.ts` (API consolidada), `lib/owners/index.ts` (barrel) |
| 2. CRUD Propietarios | ⚠️ 80% | 10 páginas + 10 componentes creados, **tsc falla con 245 errores** (imports unused, null handling, iconos faltantes) |
| 3. Vinculación Propiedad↔Propietario | ❌ | Falta tab en `PropertyFormPage` + `PropertyOwnerManager` |
| 4. Análisis de Precio | ❌ | Página existe, sin integrar |
| 5. Planes de Acción | ❌ | Páginas existen, sin integrar + dashboard global |
| 6. Comunicaciones y Reportes | ❌ | Páginas existen, sin integrar |
| 7. Dashboard + Polish | ❌ | KPIs, Sidebar nav, TrashPage, Router, PropertyFormPage tabs |

**Archivos nuevos sin commitear** (git status):
- `supabase/migrations/0032_owners_module.sql`
- `apps/admin/src/types/owners.ts`
- `apps/admin/src/lib/owners/` (schemas.ts, owners.ts, index.ts — **faltan**: price-analysis.ts, action-plans.ts, communications.ts, *.api.ts)
- `apps/admin/src/components/owners/` (10 componentes)
- `apps/admin/src/pages/` (OwnersPage, OwnerFormPage, OwnerDetailPage, PriceAnalysisPage, ActionPlansPage, ActionPlansDashboard, ActionPlanDetailPage, CommunicationsPage, ReportsPage)

**Bloqueadores TS actuales** (245 errores):
- TS6133/TS6196: ~120 imports/vars no usados (limpieza mecánica)
- TS18047/TS2339: Event target null → cast `(e.currentTarget as HTMLInputElement).value`
- TS2322/TS2345: `string | null` → `string` en mappings owners.ts + páginas (usar `?? ''`)
- TS2304/TS2552: Faltan exports en `types/owners.ts`: `REPORT_TYPE_LABEL`, `COMMUNICATION_STATUS_TONE`, `CommunicationType`, `actionPlanSchema` (typo por `actionPlanTaskSchema`)
- TS6192: Import declarations completamente unused → borrar línea completa

---

## 8. Testing & Calidad

| Herramienta | Config | Qué cubre |
|-------------|--------|-----------|
| **Vitest** | `vitest.config.ts` + `src/test/setup.tsx` (mocks Supabase, wouter, react-query, signals, lucide) | Unit: Login.test.tsx (único test actual) |
| **Playwright** | `playwright.config.ts` + `e2e/*.spec.ts` | E2E: login, admin-pages, visits-agents-ml |
| **Coverage** | `@vitest/coverage-v8` | Objetivo >90% en `lib/ml*.ts` y lógica edge functions (via mocks) |
| **Typecheck** | `pnpm typecheck` (tsc --noEmit en ambos apps) | Obligatorio en CI y pre-build |
| **Lint/Format** | Prettier 3.6 + `pnpm format` | Pre-commit recomendado |

**E2E críticos cubiertos**: Login, navegación admin, visits/agents/ML pages rendering.
**Faltantes**: Crear propiedad, sync ML, chat, módulo propietarios.

---

## 9. Deployment & Operación

### GitHub Pages (Producción)
- **Workflow**: `.github/workflows/deploy-pages.yml` en push a `main/master`
- **Build**: `node scripts/build-pages.mjs` → genera `out/` (landing en raíz, admin en `/admin/`)
- **Vars de repo requeridas**:
  - `VITE_SUPABASE_URL` (ej: `https://rnldqiwwzhjnurkguihu.supabase.co`)
  - `VITE_SUPABASE_ANON_KEY` (anon key cloud)
  - `SITE_DOMAIN` (opcional, para CNAME custom domain)
  - `VITE_SENTRY_DSN` (opcional, para error tracking admin)
- **Supabase Cloud**: Auth → Site URL = `https://<dominio>/admin`, Redirect URLs = `https://<dominio>/admin/**`

### Variables de Entorno
| Scope | Variables |
|-------|-----------|
| **Root/Demo** | `PORT=5173` |
| **Supabase Local** | Puertos: API 54321, DB 54322, Studio 54323, Realtime 54325, Storage 54326, Mailpit 54324 |
| **Apps** (`.env` por app) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_BASE_PATH` (admin), `VITE_SENTRY_DSN` (opcional), `VITE_APP_VERSION` (SHA en CI) |
| **Edge Functions** (`supabase/functions/.env`) | `CRYPTO_SECRET` (AES-256), `ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_SYNC_SECRET` (opcional), `ADMIN_BASE_URL` (opcional) |

### Backup Diario
- Workflow `.github/workflows/backup.yml` → 03:00 UTC
- `pg_dump` schema `public` via Supabase CLI
- Artifact retención 90 días, ejecutable manual (`workflow_dispatch`)
- Requiere secret `SUPABASE_ACCESS_TOKEN` (PAT `sbp_...`)

### SMTP (Emails)
- **Hoy**: No se envían emails (invites/reset devuelven link al admin)
- **Para producción**: Resend (smtp.resend.com:465, user `resend`, pass API key `re_xxx`)
- Dominio `bienenhaus.com.ar` verificado en Resend (DKIM/SPF)
- Script `scripts/configure-smtp.mjs` aplica credenciales + setea `site_url` + `redirect_urls`
- Ya aplicado: `site_url = https://bienenhaus.com.ar/admin`, `uri_allow_list = https://bienenhaus.com.ar/admin/**`

---

## 10. Roadmap Pendiente (del README)

- [ ] **Reserva online** (hold 24-48h, formulario, señal MercadoPago/Stripe)
- [ ] **CRM Kanban** (pipeline visual leads, drag & drop, etapas personalizables)
- [ ] **Notificaciones push/email** (Realtime + edge function + SendGrid/Resend)
- [x] **Tipado inductivo** — Tipos generados en `apps/admin/src/types/database.ts` y `apps/landing/src/data/generated.d.ts`
- [ ] **Tests** (ampliar cobertura: crear propiedad, sync ML, chat)
- [ ] **Storybook** para `packages/bienenhaus-ui`
- [ ] **i18n** (es/en/pt) con `i18next`
- [ ] **Analytics** (Plausible/Umami + eventos custom)
- [x] **Backup automatizado** — `.github/workflows/backup.yml`
- [x] **Monitoreo** — Sentry integrado en admin (falta `VITE_SENTRY_DSN` en repo), pendiente uptime monitor

---

## 11. Comandos de Desarrollo Diario

```bash
# Levantar stack completo
corepack enable && corepack pnpm install
corepack pnpm dlx supabase start        # Terminal 1: Supabase local
corepack pnpm dlx supabase db reset     # Aplica migraciones + seed
pnpm dev                                # Terminal 2: Landing (5174)
pnpm dev:admin                          # Terminal 3: Admin (5175)

# Solo admin (con proxy Vite)
pnpm dev:admin

# Demo single-port (requiere build previo)
pnpm build && node scripts/serve.mjs    # http://localhost:5173/ + /admin/

# Typecheck + Formato
pnpm typecheck                          # tsc --noEmit en ambos apps
pnpm format                             # Prettier en todo el repo

# Tests
pnpm test                               # Vitest run
pnpm test:e2e                           # Playwright (admin)

# Supabase
corepack pnpm dlx supabase db push      # Migraciones pendientes
corepack pnpm dlx supabase migration new nombre_corto  # Nueva migración
corepack pnpm dlx supabase functions serve  # Edge functions local
corepack pnpm dlx supabase functions deploy # Deploy edge functions
```

---

## 12. Archivos Clave para Navegación Rápida

| Qué buscar | Archivo |
|------------|---------|
| **Auth flow admin** | `apps/admin/src/store/app.ts` (`initAuth`, signals) |
| **Router + role guard** | `apps/admin/src/App.tsx` |
| **Sidebar nav** | `apps/admin/src/components/Sidebar.tsx` |
| **Patrón API módulo** | `apps/admin/src/lib/properties.ts` + `properties.api.ts` |
| **Zod schemas** | `apps/admin/src/lib/validators.ts` |
| **Tipos DB generados** | `apps/admin/src/types/database.ts` |
| **Tipos módulo** | `apps/admin/src/types/{properties,owners,admin}.ts` |
| **Edge functions ML** | `supabase/functions/ml-*/index.ts` + `_shared/ml.ts` |
| **Migraciones** | `supabase/migrations/00NN_*.sql` (orden numérico) |
| **CI/CD** | `.github/workflows/ci.yml`, `deploy-pages.yml`, `backup.yml` |
| **Plan propietarios** | `.omo/planes/modulo-propietarios.md` |
| **Draft ML hardening** | `.omo/drafts/ml-enterprise-hardening.md` |

---

## 13. Próximos Pasos Inmediatos (si continúas el trabajo)

1. **Restaurar compilación admin** (prioridad crítica):
   - Limpiar imports unused (TS6133/TS6196) en 28 archivos
   - Fix event handlers: `(e.currentTarget as HTMLInputElement).value`
   - Fix null mappings en `lib/owners/owners.ts` + páginas (`?? ''`, `?? null`)
   - Agregar exports faltantes en `types/owners.ts`: `REPORT_TYPE_LABEL`, `COMMUNICATION_STATUS_TONE`, `CommunicationType`
   - Fix typo `actionPlanSchema` → `actionPlanTaskSchema` en `ActionPlanDetailPage.tsx`
   - Agregar iconos `Plus`, `Check`, `X` donde falten
   - `pnpm typecheck` hasta 0 errores

2. **Wirear módulo propietarios** (Fase 2→7):
   - Rutas en `App.tsx` + Sidebar nav items
   - TrashPage: tipos `'owner'`, `'action_plan'`
   - DashboardCharts: 6 KPIs nuevos
   - PropertyFormPage: tabs "Propietarios", "Análisis", "Planes"
   - Integración Activity Log (triggers BD + edge function audit-log)

3. **ML Enterprise Hardening** (si se aprueba draft):
   - Ver `.omo/drafts/ml-enterprise-hardening.md` (9 componentes C1-C9, 2-3 migraciones, 2 edge functions nuevas)

---

## 14. Contacto / Autor

**Facundo Herrera** — `hfacundo45@gmail.com`

> Este documento resume el estado real del código a **2026-08-04**. Para detalles de implementación, leer los archivos fuente referenciados. El README.md tiene documentación extendida de usuario/ops.