# ADR 005: Design System — @bienenhaus/ui Atoms Migration

## Status
Accepted

## Context
El proyecto tenía dos implementaciones de Button:
- `packages/bienenhaus-ui/src/Button.tsx` (raíz, legacy)
- `packages/bienenhaus-ui/src/components/atoms/Button/Button.tsx` (átomo, nuevo con styles.* + variante icon)

Esto causaba inconsistencia, duplicación y confusión sobre cuál era la fuente de verdad. Además, el admin usaba clases CSS globales (`.btn`, `.btn--primary`, `.icon-btn`, `.badge--*`, `.spin`) en lugar de componentes tipados.

## Decision
1. **Canonizar** `components/atoms/Button` como única implementación
2. **Eliminar** `src/Button.tsx` + `src/Button.module.css` (legacy)
3. **Actualizar** `src/index.ts` para exportar desde `./components/atoms/Button`
4. **Migrar** Login.tsx a usar `@bienenhaus/ui` Button atom
5. **Limpiar** clases globales muertas en `apps/admin/src/styles.css`

## Consequences
### Positive
- Single source of truth para Button
- Type-safe props (variant, size, fullWidth, loading, icon)
- Consistency con design tokens (`--bh-*`)
- Tree-shaking: solo se importa lo que se usa
- Tests + Stories en un solo lugar (25 test files / 549 tests)

### Negative
- Breaking change para consumidores externos (ninguno en el repo)
- Requiere migración manual en admin (parcialmente completada)

### Risks
- Migración manual propensa a errores JSX (mitigado: solo Login.tsx migrado; resto documentado para Fase 1c+)

---

# ADR 006: Shared Supabase Client — @bienenhaus/supabase Unification

## Status
Accepted

## Context
Tres instancias de Supabase Client en el repo:
1. `apps/admin/src/lib/supabase.ts` — tipado con `Database`, singleton
2. `apps/landing/src/lib/supabase-data.ts` — usa `@bienenhaus/supabase` + realtime
3. `apps/landing/src/lib/supabase.ts` — fetch directo a REST/RPC (sin tipar)

Problemas: 3 conexiones WebSocket, inconsistencia de tipos, duplicación de lógica auth/realtime.

## Decision
1. **Canonizar** `@bienenhaus/supabase` como paquete compartido
2. **Exportar** `createTypedClient<Database>()` para queries type-safe en admin
3. **Migrar** `apps/admin/src/lib/supabase.ts` a re-export desde shared + `getAdminSupabase()` singleton
4. **Mantener** `apps/landing/src/lib/supabase-data.ts` usando shared client
5. **Deprecar** `apps/landing/src/lib/supabase.ts` (fetch directo) — migración futura

## Consequences
### Positive
- Single WebSocket connection (shared singleton)
- Type-safe admin queries via `createTypedClient<Database>()`
- Centralized auth helpers (`getAuthUser`, `onAuthStateChange`, etc.)
- Eliminada duplicación de config (auth, realtime, headers)

### Negative
- Admin ya no tiene su propio `createAdminClient` con service_role (usa shared + RLS)
- Landing fetch directo sigue existiendo (tech debt documentado)

### Risks
- Cambio en shared afecta ambos apps (mitigado: tests + typecheck en CI)

---

# ADR 007: Admin Migration Strategy — Phased Atoms Adoption

## Status
Accepted

## Context
Admin tiene 38 archivos con `btn--` (215 usos), 25 con `icon-btn` (61 usos), 20 con `badge--` (44 usos), ~13 con `spin` (29 usos). Migración manual completa es riesgosa y lenta.

## Decision
**Fase 1 (completada):**
- Canonizar atoms en `@bienenhaus/ui` (ADR 005)
- Migrar Login.tsx (único consumidor crítico de Button)
- Limpiar clases globales muertas en styles.css
- Verificar gate completo (typecheck + tests + build)

**Fase 1c+ (en curso):**
- QA visual por módulos (Login/Dashboard primero)
- Responsive audit + animaciones premium
- Migración batch A/B con script asistido o codemod

**Fase 2 (futura):**
- Migración completa restante (Leads, Properties, Agents, Owners, ML, Visits, Chat, Trash, Reports, Site, Tasar)
- Eliminar estilos legacy de `apps/admin/src/styles/`

## Consequences
### Positive
- Riesgo controlado: solo Login.tsx tocado en Fase 1
- Feedback temprano: QA visual en módulos críticos
- Flexibilidad: codemod puede generarse tras validar patrones

### Negative
- Coexistencia temporal de atoms + clases globales
- Inconsistencia visual en módulos no migrados

### Risks
- Regression visual en módulos legacy (mitigado: E2E visual tests + manual QA)
- Deuda técnica residual si Fase 2 se posterga

---

# ADR 008: Testing Strategy — Coverage Expansion for Core Modules

## Status
Accepted

## Context
Cobertura global 88.49% statements, pero módulos críticos (ML sync, chat, visits, supabase client) tenían 0% o <50%. Tests existentes enfocados en validators, csv, leads, properties.

## Decision
Añadir tests unitarios para:
- **ML mappers** (`toMlQueueRow`, `toMlMetaRow`, `embedProperty`)
- **Chat embed helpers + mappers** (`embedAgentName`, `toChannelRow`, `toMessageRow`)
- **Visits embed helpers + mappers** (`embedVisitName`, `toVisitRow`)
- **Admin Supabase client** (`getAdminSupabase` singleton + cache)

Herramientas: Vitest + vi.hoisted mocks para `@bienenhaus/supabase`.

## Consequences
### Positive
- Coverage ↑ para lógica de negocio crítica
- Regression protection para mappers (frecuentemente modificados)
- Documentación viva de contratos de datos

### Negative
- Tests acoplados a implementación actual (mock de supabase)
- Mantenimiento extra al cambiar esquemas DB

### Risks
- Falsa sensación de seguridad (tests no cubren integración real con Supabase)
- Mitigado: E2E tests cubren flujos críticos end-to-end