# ADR 004: Estrategia de Testing — Unit + E2E + Visual Regression

## Status
Accepted

## Context
El proyecto requiere una estrategia de testing que:
- Detecte regresiones en CI/CD
- Cubra lógica de negocio crítica (auth, ML sync, leads, properties)
- Valide UI visual (CSS, layout, responsive)
- Sea rápida en CI (< 5 min total)
- Detecte flakiness temprano

## Decision

### Pirámide de Testing
```
         ▁▂▃▄▅▆▇
        ███████  E2E (Playwright) — 22 tests, ~20s
       █████████ Visual Regression — 5 tests, ~15s
      ███████████ Unit (Vitest) — 107 tests, ~3s
     █████████████ Static Analysis (TypeCheck) — ~5s
```

### 1. Unit Tests (Vitest 4 + jsdom)
- **Ubicación:** `apps/admin/src/lib/__tests__/`, `apps/admin/src/test/`
- **Qué testear:**
  - Pure functions: `csv.ts`, `validators.ts`, `crypto.ts`
  - Hooks: `useList`, `useItem`, `useMutation` (mocking Supabase)
  - Utils: `formatLockoutTime`, `getLockoutRemainingMs`
- **Mocking:** MSW para API, `supabase-mock.ts` para client
- **Cobertura objetivo:** >80% en `lib/` puro, 100% en validators/crypto

### 2. E2E Tests (Playwright 1.62 + Chromium)
- **Ubicación:** `apps/admin/e2e/*.spec.ts`
- **Suites (22 tests):**
  - `login.spec.ts` (3) — auth flow, rate limit, dashboard redirect
  - `admin-pages.spec.ts` (5) — navegación, sidebar, páginas principales
  - `create-property.spec.ts` (2) — CRUD propiedades
  - `owners-crud.spec.ts` (3) — CRUD propietarios
  - `visits-agents-ml.spec.ts` (4) — visitas, agentes, ML
  - `visual.spec.ts` (5) — Visual Regression
- **CI Config:** `retries: 2` en CI, `workers: 1` en CI
- **Fixtures:** Usuario E2E creado via Admin API en CI setup

### 3. Visual Regression (Playwright Screenshots)
- **Ubicación:** `apps/admin/e2e/visual.spec.ts`
- **Baselines:** 5 screenshots (KPI, Charts, Propiedades, Leads, Agentes)
- **Thresholds:**
  - `threshold: 0.1` (10% pixel diff) para componentes estables
  - `threshold: 0.15` para páginas con datos dinámicos
  - `maxDiffPixels` ajustado por tamaño de página
- **Update:** `pnpm test:e2e --project=chromium e2e/visual.spec.ts --update-snapshots`

### 4. Static Analysis (TypeScript + ESLint + Prettier)
- **TypeScript:** `strict: true`, `noImplicitAny: true`, `noUncheckedIndexedAccess: true`
- **ESLint:** `eslint-plugin-preact`, `typescript-eslint`
- **Prettier:** Single quote, trailing comma, 100 char width

### CI Pipeline (`.github/workflows/ci.yml`)
```yaml
jobs:
  typecheck: pnpm typecheck
  test: pnpm test
  e2e:
    needs: [typecheck, test]
    steps:
      - supabase start
      - supabase db reset
      - create E2E user
      - pnpm test:e2e
  build: pnpm build
```

### Flakiness Management
- **Retries:** `test.use({ retries: 2 })` en CI
- **Timeouts generosos:** 60s para navegación, 30s para elementos
- **Wait strategies:** `waitForLoadState('networkidle')` + `expect(locator).toBeVisible({ timeout: 30000 })`
- **Selectors robustos:** `getByRole`, `getByLabel`, `getByPlaceholder` > CSS selectors

### Test Data Management
- **Seed SQL:** `supabase/seed.sql` — datos determinísticos
- **E2E user:** Creado via Admin API en CI (`e2e-test@bienenhaus.local`)
- **Cleanup:** Tests limpian sus datos (soft delete + cleanup en teardown)
- **Isolation:** `storageState: undefined` en visual tests

### Coverage Thresholds
```json
{
  "coverage": {
    "thresholds": {
      "lines": 80,
      "functions": 80,
      "branches": 70,
      "statements": 80
    }
  }
}
```

## Consequences

### Positivos
- Feedback rápido: TypeCheck (5s) → Unit (3s) → E2E (20s) → Visual (15s)
- E2E tests cubren flujos críticos reales (login, CRUD, ML sync)
- Visual regression detecta CSS regressions invisibles a tests funcionales
- Flakiness controlada con retries y timeouts apropiados
- CI fail-fast: typecheck → unit → e2e → build

### Negativos
- E2E tests lentos (~20s) — paralelismo limitado por Supabase local
- Visual regression requiere mantenimiento de baselines (OS/browser specific)
- Seed data determinístico pero frágil (cambios en seed rompen tests)
- No hay contract testing para edge functions

### Riesgos
- Flakiness residual en tests que dependen de Supabase local (network, timing)
- Visual regression baselines OS-specific (Win vs Linux en CI)
- E2E tests no cubren edge functions directamente (solo via UI)

## Alternatives Considered
| Opción | Por qué no |
|--------|------------|
| Cypress | Más lento, menos control sobre network, sintaxis menos familiar |
| Jest + React Testing Library | Requiere React, no compatible con Preact + jsdom nativo |
| Storybook + Chromatic | Costo alto, solo visual, no funcional |
| Cypress Component Testing | Soporte Preact experimental |

## References
- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [OWASP Testing Guide](https://owasp.org/www-project-testing-guide/)