# AGENTS.md — BIENENHAUS Knowledge Base

> **Hierarchical context for OpenCode agents working on Bienenhaus.**
> This file is the single source of truth for project conventions, architecture, and agent instructions.
> Update it when architecture decisions change.

---

## 🎯 Project Identity

**Bienenhaus Propiedades** — Landing pública + Panel administrativo integral para inmobiliaria.
Full-stack moderno: Preact + TypeScript + Supabase (PostgreSQL 17, Auth, Realtime, Storage, Edge Functions).
Deploy: GitHub Pages (landing en `/`, admin en `/admin/` hash routing).

---

## 🏗️ Architecture Overview

```
bienenhaus/
├── apps/
│   ├── landing/          # Public landing (Preact + Vite)
│   │   ├── src/components/   # Hero, Navbar, Catalog, PropertyCard, PropertyModal, etc.
│   │   ├── src/hooks/        # useReveal, useSpotlight, useCountUp
│   │   ├── src/lib/          # content, images, newsletter, supabase-data, supabase
│   │   ├── src/styles/       # landing.css (design system: 3000+ lines)
│   │   └── src/data/         # properties.ts + generated/*.json
│   │
│   └── admin/            # Admin panel (Preact + Vite + Supabase)
│       ├── src/components/   # Shell, Sidebar, Topbar, ToastHost, PropertyImageGallery, etc.
│       ├── src/hooks/        # useReveal
│       ├── src/lib/          # agents, chat, leads, ml, newsletter, properties, visits, csv, supabase, query, store
│       ├── src/pages/        # 20+ pages (Dashboard, Properties, Leads, Agents, ML, Visits, Chat, Trash, etc.)
│       ├── src/store/        # preact-signals global state (app.ts)
│       ├── src/styles.css    # Tokens from @bienenhaus/ui + admin layout
│       ├── src/types/        # Generated DB types + manual domain types
│       └── src/test/         # Vitest setup + mocks
│       └── e2e/              # Playwright tests (5 suites)
│
├── packages/
│   └── bienenhaus-ui/    # Shared UI (Button, tokens.css)
│
├── supabase/
│   ├── config.toml       # Local config (ports, auth, realtime, storage, MFA, etc.)
│   ├── seed.sql          # Admin user + sample properties + agents + leads
│   ├── migrations/       # 36 migrations (0001_foundation → 0036_fix_owners_audit_trigger)
│   └── functions/        # 14 Edge Functions (Deno 2)
│       ├── _shared/      # crypto (AES-256-GCM), ml (API helpers), auto_reply, visits
│       └── *.ts          # Individual functions
│
├── scripts/
│   ├── serve.mjs         # Demo server single-port (Node, SPA fallback, proxy Supabase)
│   ├── build-pages.mjs   # Build for GitHub Pages (out/)
│   └── configure-smtp.mjs # SMTP config via Management API
│
└── .github/workflows/    # CI (typecheck → test → e2e → build) + Deploy Pages + Daily Backup
```

---

## 🛠️ Tech Stack (Canonical Versions)

| Layer            | Technology                 | Version | Notes                              |
| ---------------- | -------------------------- | ------- | ---------------------------------- |
| Runtime          | Node.js                    | ≥20     | LTS                                |
| Package Manager  | pnpm                       | 11.20.0 | Workspaces                         |
| Frontend         | Preact                     | 10.26+  | React-compatible, 3kb              |
| Bundler          | Vite                       | 7.x     |                                    |
| Language         | TypeScript                 | 5.8+    | **Strict mode everywhere**         |
| Router           | Wouter                     | 3.10+   | Preact-native                      |
| Server State     | TanStack Query             | 5.x     | Admin only                         |
| Global State     | preact-signals             | 2.x     | Fine-grained reactivity            |
| Icons            | Lucide Preact              | 1.28+   |                                    |
| Charts           | Recharts                   | 3.10+   | Dashboard                          |
| Validation       | Zod                        | 3.24+   | Type-safe schemas                  |
| Testing (Unit)   | Vitest                     | 4.x     | jsdom + testing-library            |
| Testing (E2E)    | Playwright                 | 1.62+   | Chromium                           |
| Error Monitoring | Sentry                     | 10.x    | Admin only (opt-in DSN)            |
| CSS              | CSS Modules + Custom Props | —       | Design tokens in `:root`           |
| Database         | PostgreSQL                 | 17      | Supabase local + cloud             |
| Auth             | Supabase Auth              | —       | PKCE, refresh rotation, MFA (TOTP) |
| API              | PostgREST                  | —       | Auto-generated, OpenAPI            |
| Realtime         | Supabase Realtime          | —       | WebSockets (chat, visits)          |
| Storage          | Supabase Storage           | —       | 4 buckets                          |
| Edge Functions   | Deno 2                     | —       | 14 functions                       |
| CI/CD            | GitHub Actions             | —       | TypeCheck → Unit → E2E → Build     |
| Deploy           | GitHub Pages               | —       | Landing `/`, Admin `/admin/`       |

---

## 📐 Conventions (Enforced)

### Naming

- **Files**: kebab-case (`PropertyCard.tsx`, `use-properties.ts`)
- **Components**: PascalCase (`PropertyCard`, `DashboardCharts`)
- **Hooks**: camelCase + `use` prefix (`useProperties`, `useReveal`)
- **Utilities**: camelCase (`mapProperty`, `getPublicUrl`)
- **Constants**: UPPER_SNAKE_CASE (`STORAGE_BUCKETS`, `PAGE_SIZE`)
- **Types/Interfaces**: PascalCase + semantic suffix (`PropertyCardData`, `AdminRole`)

### TypeScript

- `strict: true` in all `tsconfig.json`
- **Generated DB types**: `apps/admin/src/types/database.ts` (2642 lines)
- **Manual domain types**: `apps/admin/src/types/*.ts` (admin, leads, agents, ml, etc.)
- **Landing static data types**: `apps/landing/src/data/generated.d.ts`

### CSS / Design System

- **Landing**: `apps/landing/src/styles/landing.css` — `:root` variables (colors, fonts, spacing, easing, durations, radius, z-index)
- **Admin**: `apps/admin/src/styles.css` — imports `@bienenhaus/ui/tokens.css` + admin layout
- **Shared tokens**: `--bh-*` prefix in admin, `--accent`, `--bg-*`, `--text-*` in landing — **unify via `@bienenhaus/ui/tokens.css`**
- **Fonts**: Playfair Display (headings) + Inter (body)
- **Accessibility**: `:focus-visible`, `prefers-reduced-motion`, skip links, ARIA labels

### State Management

- **Admin**: TanStack Query (server state) + preact-signals (global UI: sidebar, toasts, modals)
- **Landing**: Direct Supabase + local hooks (`useProperties`, `useLocations`) + Realtime channels

### API Patterns

- **Admin**: `lib/*.ts` (pure functions) → `lib/*.api.ts` (TanStack hooks) → components
- **Edge Functions**: Consistent pattern — `createClient` + service_role → CORS → auth check → logic → `respond()`
- **RPC Helper**: `callRpc<Fn>(fn, params)` with full type safety in `supabase.ts`

---

## 🔑 Critical Modules (Read First)

| Module                  | Why Critical                                         | Key Files                                                                            |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Auth & Roles**        | Gates all admin + edge functions                     | `admin.ts`, `admin.api.ts`, `adminUsers.ts`, edge `_shared/auth`                     |
| **ML Integration**      | Main property ingestion; OAuth, sync queue, webhooks | `ml.ts`, `ml.api.ts`, `ml-sync`, `ml-webhook`, `ml-oauth`, `crypto.ts`               |
| **Properties CRUD**     | Business core; images, video, ML sync, soft delete   | `properties.ts`, `properties.api.ts`, `PropertyFormPage`, `PropertyImageGallery`     |
| **Leads Pipeline**      | Conversion; auto-assign, scoring, tags, WhatsApp     | `leads.ts`, `leads.api.ts`, `LeadsPage`, `LeadDetailPage`                            |
| **Visits Calendar**     | Agent agenda; QR check-in, reminders, realtime       | `visits.ts`, `visits.api.ts`, `VisitsPage`, `qr-checkin`, `visits-process-reminders` |
| **Internal Chat**       | Real-time comms; Realtime + attachments              | `chat.ts`, `chat.api.ts`, `ChatPage`, `chat_channels`, `chat_messages`               |
| **Trash / Soft Delete** | Data recovery; 4 tables + reactive counters          | `activity.ts`, `TrashPage`, migrations `0019`, `0033`                                |
| **Site Settings CMS**   | Controls landing dynamically                         | `site.ts`, `site-settings.ts`, `ConfigPage`, `SitePage`                              |

---

## ⚠️ Known Weak Points (Address Proactively)

| Area                            | Issue                                                                 | Severity  | Fix Strategy                                                              |
| ------------------------------- | --------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------- |
| **Testing**                     | Only 2 unit tests; 5 E2E suites flaky                                 | 🔴 High   | Add Vitest coverage; stabilize Playwright with `test.use({ retries: 2 })` |
| **Type Safety**                 | `any` in edge functions; `as unknown as` in `callRpc`                 | 🟡 Medium | Replace with proper generics; add `noImplicitAny`                         |
| **Supabase Client Duplication** | 3 instances (landing supabase, landing supabase-data, admin supabase) | 🟡 Medium | Create `@bienenhaus/supabase` shared package                              |
| **Bundle Size (Landing)**       | `@supabase/supabase-js` (47kb gz) for 2 RPCs only                     | 🟡 Medium | Replace with lightweight fetch client or RPC-only wrapper                 |
| **Design Token Drift**          | Landing (`--accent`) vs Admin (`--bh-accent`)                         | 🟡 Medium | Unify in `@bienenhaus/ui/tokens.css`                                      |
| **Edge Function Duplication**   | CORS, auth, `respond()` repeated 14×                                  | 🟡 Medium | Extract to `_shared/http.ts`, `_shared/auth.ts`                           |
| **Documentation**               | No ADRs, no API docs, no runbooks                                     | 🟡 Medium | Add `docs/adr/`, `docs/api/`, `docs/runbooks/`                            |

---

## 🧹 Dead Code (Remove)

| Path                                    | Reason                                        |
| --------------------------------------- | --------------------------------------------- |
| `Fix/`                                  | Dev artifacts (`.exe`, `.html`, loose `.tsx`) |
| `deepseek_html_*.html` (4 files)        | AI-generated HTML in root                     |
| `apps/landing/src.zip`                  | Unused backup                                 |
| `CONTEXTO_PROYECTO.md`                  | Duplicates README                             |
| `modulo-tasar.md`                       | Unimplemented feature doc                     |
| `.omo/run-continuation/*.json` (60+)    | Old OpenCode sessions                         |
| `apps/admin/scripts/find-unmatched*.ts` | Debug scripts                                 |
| `ml-ingest` edge function               | Legacy ("local only, not deployed")           |

---

## ♻️ Reusable Components (Promote to `@bienenhaus/ui`)

| Component                | Current Location                 | Used In          | Action                         |
| ------------------------ | -------------------------------- | ---------------- | ------------------------------ |
| `Button`                 | `@bienenhaus/ui`                 | Admin (partial)  | ✅ Migrate all usages          |
| `ErrorBoundary`          | `admin/components/`              | App root         | ✅ Move to `@bienenhaus/ui`    |
| `ToastHost` / `useToast` | `admin/store/app.ts`             | Global admin     | ✅ Extract to package          |
| `useReveal`              | Both apps (`hooks/useReveal.ts`) | Landing + Admin  | ✅ Already shared conceptually |
| `PropertyImageGallery`   | `admin/components/`              | PropertyFormPage | ⚠️ Admin-only for now          |

---

## 🔧 MCP Usage Protocol (Priority Order)

**Always use the most efficient tool for the task:**

1. **CodeGraph** — Understand symbols, call paths, blast radius before editing
2. **LSP** — Navigate definitions, references, rename symbols
3. **Grep** — Find implementations, patterns across codebase
4. **Context7** — Official docs for libraries (Preact, Vite, TanStack, Supabase, Zod, Playwright, Recharts)
5. **Individual Files** — Read only when symbols insufficient
6. **WebSearch** — Last resort for info not in docs

### MCP-Specific Instructions

| MCP            | When to Use                                                         | Project Context                                    |
| -------------- | ------------------------------------------------------------------- | -------------------------------------------------- |
| **codegraph**  | Before any edit; trace call paths; find blast radius                | `codegraph_explore("PropertyFormPage save flow")`  |
| **lsp**        | Go-to-definition; find-references; rename                           | `lsp_goto_definition` on `useProperties`           |
| **grep**       | Search patterns; find TODOs; locate duplicates                      | `grep("as unknown as")`                            |
| **context7**   | Library APIs; migration guides; best practices                      | `context7_query-docs("/preact/preact", "signals")` |
| **supabase**   | **Never assume schema** — verify tables, RLS, migrations, functions | `supabase_list_tables`, `supabase_execute_sql`     |
| **github**     | Review history; understand context of changes; link PRs             | `github_get_pull_request_files`                    |
| **playwright** | Validate critical flows; visual regression; E2E                     | `playwright_browser_navigate` + snapshot           |
| **docker**     | Inspect Supabase local stack; logs; containers                      | `docker_list_containers`                           |
| **filesystem** | Read/write project files (prefer over Read/Write tools)             | Already scoped to project root                     |

---

## 🧪 Testing Protocol

### Unit Tests (Vitest)

```bash
pnpm test                    # Run all
pnpm test:watch              # Watch mode
pnpm test:ui                 # Visual UI
```

- **Location**: `apps/admin/src/lib/__tests__/`, `apps/admin/src/test/`
- **Patterns**: Pure functions (`csv.ts`, `validators.ts`), hooks (`api/hooks.ts`)
- **Mocking**: MSW for API, `supabase-mock.ts` for Supabase client

### E2E Tests (Playwright)

```bash
pnpm test:e2e               # Full suite
pnpm test:e2e --headed      # Debug visually
```

- **Location**: `apps/admin/e2e/*.spec.ts`
- **Suites**: `login.spec.ts`, `admin-pages.spec.ts`, `create-property.spec.ts`, `owners-crud.spec.ts`, `visits-agents-ml.spec.ts`
- **CI**: Runs against local Supabase (`supabase start` + `db reset`)
- **Flaky Tests**: Mark with `test.use({ retries: 2 })`; investigate root cause

### Visual Regression (Playwright MCP)

- Capture baseline: `playwright_browser_take_screenshot` with `fullPage: true`
- Compare on changes: Hero, Catalog, PropertyModal, Dashboard, PropertyForm
- Threshold: 0.1% pixel difference

---

## 🚀 Development Workflow

### Start Development

```bash
# Terminal 1: Supabase local
pnpm dlx supabase start

# Terminal 2: Apply migrations + seed
pnpm dlx supabase db reset

# Terminal 3: Landing (port 5174)
pnpm dev

# Terminal 4: Admin (port 5175)
pnpm dev:admin
```

### Before Any Change

1. **CodeGraph** the area: `codegraph_explore("feature name")`
2. **LSP** check types: `lsp_diagnostics` on target files
3. **Grep** for patterns: `grep("similar pattern")`
4. **Context7** for library usage: `context7_query-docs("/tanstack/query", "useMutation")`
5. **Supabase** verify schema: `supabase_list_tables`, `supabase_execute_sql("SELECT ...")`

### After Implementation

1. **TypeCheck**: `pnpm typecheck` (must pass)
2. **Unit Tests**: `pnpm test` (must pass)
3. **E2E**: `pnpm test:e2e` (critical paths)
4. **Visual**: Playwright MCP snapshot key pages
5. **Build**: `pnpm build` (must pass)

### Git Workflow

- **Branch**: `feature/<short-name>` or `fix/<issue>`
- **Commits**: Conventional (`feat:`, `fix:`, `refactor:`, `chore:`)
- **PR**: Link related issues; include screenshots for UI changes
- **Review**: Self-review first (check architecture, types, accessibility, performance)

---

## 📝 Documentation Standards

### When to Create/Update Docs

- New module/feature → `docs/features/<name>.md`
- Architecture decision → `docs/adr/<number>-<title>.md` (ADR format)
- API change → `docs/api/<endpoint>.md`
- Complex debugging → `docs/runbooks/<issue>.md`
- Breaking change → CHANGELOG + migration guide

### ADR Template

```markdown
# ADR <number>: <Title>

## Status

Proposed | Accepted | Superseded

## Context

What problem are we solving?

## Decision

What did we decide?

## Consequences

- Positive:
- Negative:
- Risks:
```

---

## 🎨 Design Standards (Landing & Admin)

### Visual Hierarchy

- **Headings**: Playfair Display, `--font-heading`, weights 700
- **Body**: Inter, `--font-body`, weights 400/500/600
- **Accent**: `--accent` (#1FC8C3) — primary actions, highlights
- **Surfaces**: Layered `--bg-primary` → `--bg-secondary` → `--card-bg`
- **Borders**: Subtle `--border-color` (rgba white 0.06)

### Spacing System

- **Base**: 4px (`--space-1`)
- **Scale**: 4, 8, 12, 16, 24, 32, 48, 64, 96
- **Container**: `--container-max: 1440px`, `--container-pad: 70px`

### Motion

- **Easing**: `--ease-premium: cubic-bezier(0.22, 0.61, 0.36, 1)`
- **Durations**: `--dur-fast: 200ms`, `--dur-med: 350ms`, `--dur-slow: 600ms`
- **Respect**: `prefers-reduced-motion: reduce`

### Accessibility (WCAG AA+)

- Contrast ratios ≥ 4.5:1 (text), ≥ 3:1 (UI)
- Focus visible: `outline: 2px solid var(--accent); outline-offset: 3px`
- ARIA labels on all interactive elements
- Skip link on every page
- Semantic HTML (`<main>`, `<section>`, `<article>`, `<nav>`)

---

## 🔒 Security Checklist

- [ ] **Never commit secrets** — use `.env.example` + environment variables
- [ ] **RLS enabled** on all tables — verify via `supabase_list_tables(verbose=true)`
- [ ] **Edge functions** use service_role only; validate JWT for user calls
- [ ] **ML tokens** encrypted AES-256-GCM (`crypto.ts`)
- [ ] **Rate limits** on auth (email/sms/signin), edge functions, landing RPCs
- [ ] **CORS** configured per function; no wildcard in production
- [ ] **Content Security Policy** via demo server headers

---

## 📦 Package Manager Commands

```bash
# Install
pnpm install                    # All workspaces
pnpm --filter @bienenhaus/admin install

# Dev
pnpm dev                        # Landing
pnpm dev:admin                  # Admin

# Build
pnpm build                      # All (tsc --noEmit + vite build)
pnpm --filter @bienenhaus/landing build
pnpm --filter @bienenhaus/admin build

# TypeCheck
pnpm typecheck                  # All
pnpm --filter @bienenhaus/admin typecheck

# Test
pnpm test                       # Unit (admin)
pnpm test:e2e                   # E2E (admin)

# Format
pnpm format                     # Prettier all

# Supabase
pnpm dlx supabase start
pnpm dlx supabase stop
pnpm dlx supabase db reset
pnpm dlx supabase db push
pnpm dlx supabase migration new <name>
pnpm dlx supabase functions deploy
```

---

## 🚨 Agent Instructions Summary

> **When working on Bienenhaus, always:**
>
> 1. **Start with CodeGraph** — understand the symbol graph before touching files
> 2. **Verify Supabase schema** — never assume tables/columns/RLS; use MCP
> 3. **Follow conventions** — naming, types, CSS tokens, API patterns
> 4. **Reuse before create** — check `@bienenhaus/ui`, existing hooks, components
> 5. **Type strictly** — no `any`, no `as unknown as`, generics everywhere
> 6. **Test critical paths** — unit + E2E + visual regression for UI
> 7. **Document decisions** — ADRs for architecture, runbooks for ops
> 8. **Optimize context** — CodeGraph → LSP → Grep → Context7 → Files → WebSearch
> 9. **Respect design system** — tokens, spacing, motion, accessibility
> 10. **Clean as you go** — remove dead code, consolidate duplication

---

## 📌 Quick Reference: Key Symbols

| Symbol                | File                                          | Purpose                            |
| --------------------- | --------------------------------------------- | ---------------------------------- |
| `supabase`            | `apps/admin/src/lib/supabase.ts`              | Admin Supabase client (typed)      |
| `supabase`            | `apps/landing/src/lib/supabase-data.ts`       | Landing Supabase client            |
| `useProperties`       | `apps/landing/src/lib/supabase-data.ts`       | Landing properties hook + Realtime |
| `queryClient`         | `apps/admin/src/lib/query/client.ts`          | TanStack Query client              |
| `useList` / `useItem` | `apps/admin/src/lib/api/hooks.ts`             | Generic admin query hooks          |
| `callRpc`             | `apps/admin/src/lib/supabase.ts`              | Type-safe RPC calls                |
| `STORAGE_BUCKETS`     | `apps/admin/src/lib/supabase.ts`              | Storage bucket constants           |
| `useToast`            | `apps/admin/src/store/app.ts`                 | Global toast notifications         |
| `app` (signals)       | `apps/admin/src/store/app.ts`                 | Global UI state (sidebar, modals)  |
| `Button`              | `packages/bienenhaus-ui/src/Button.tsx`       | Shared button component            |
| `ErrorBoundary`       | `apps/admin/src/components/ErrorBoundary.tsx` | Error boundary class               |

---

_Generated from comprehensive audit on 2026-08-05. Update this file when architecture evolves._
