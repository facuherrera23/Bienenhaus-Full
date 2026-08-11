# ADR 001: Arquitectura General — Preact + Supabase + Edge Functions

## Status

Accepted

## Context

Bienenhaus necesita una arquitectura full-stack moderna para una inmobiliaria con:

- Landing pública de alto rendimiento (SEO, PWA, Core Web Vitals)
- Panel administrativo completo (CRUD, ML integration, chat, visitas, leads)
- Escalabilidad y mantenibilidad a largo plazo

## Decision

**Stack elegido:**

- **Frontend:** Preact 10 + TypeScript 5.8 (strict mode) + Vite 7
- **Backend:** Supabase (PostgreSQL 17, Auth, Realtime, Storage, Edge Functions Deno 2)
- **State Management:** TanStack Query 5 (server state) + preact-signals 2 (global UI state)
- **Routing:** Wouter 3 (hash routing para admin en GitHub Pages)
- **Testing:** Vitest 4 (unit) + Playwright 1.62 (E2E + Visual Regression)
- **Deploy:** GitHub Pages (landing `/`, admin `/admin/` hash routing)

**Arquitectura:**

```
┌─────────────────┐     ┌─────────────────┐
│   Landing       │     │   Admin         │
│   (Preact)      │     │   (Preact)      │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     ▼
            ┌─────────────────┐
            │   Supabase      │
            │  (PostgreSQL    │
            │   Auth, Realtime,│
            │   Storage, Edge) │
            └─────────────────┘
```

**Code Splitting:** Lazy loading con `lazy()` + `Suspense` para todas las páginas admin (28 chunks).

**State Management:**

- Server state: TanStack Query (cache, invalidation, retries)
- Global UI state: preact-signals (sidebar, toasts, auth, modals)
- No Redux/Zustand — signals son suficientes y más ligeros

## Consequences

### Positivos

- Preact ~3kb vs React 40kb → mejor Core Web Vitals
- Supabase maneja Auth/DB/Realtime/Storage → menos infra
- Edge Functions (Deno) → cold starts rápidos, TypeScript nativo
- TypeScript strict en todo el repo → catch bugs en compile-time
- Code splitting → carga inicial ~1KB admin entry point
- GitHub Pages gratis + CDN global

### Negativos

- Preact ecosystem menor que React (menos librerías compatibles)
- Supabase vendor lock-in (migración futura compleja)
- Edge Functions Deno 2 → debugging remoto limitado
- Hash routing en admin → URLs menos limpias, SEO nulo para admin

### Riesgos

- Supabase breaking changes en Edge Functions API
- Preact 11 breaking changes (migration path unclear)
- GitHub Pages limits (1GB, 100GB/month bandwidth)

## Alternatives Considered

| Opción                     | Por qué no                                               |
| -------------------------- | -------------------------------------------------------- |
| React + Next.js + Vercel   | Bundle mayor, costo Vercel, overkill para landing simple |
| React + Supabase + Railway | Más infra a mantener, costo mayor                        |
| Vue + Supabase             | Team más familiarizado con React/Preact                  |
| Remix + Supabase           | Overkill, learning curve alto                            |

## References

- [Preact Docs](https://preactjs.com/)
- [Supabase Docs](https://supabase.com/docs)
- [TanStack Query](https://tanstack.com/query)
- [preact-signals](https://preactjs.com/guide/v10/signals/)
