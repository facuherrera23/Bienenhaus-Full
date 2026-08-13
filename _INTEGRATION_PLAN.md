# _INTEGRATION_PLAN.md — Plan de Integración Inteligente

**Generado:** 2026-08-11  
**Rama:** `production-integration`  
**Objetivo:** Integrar selectivamente correcciones de `./_CORRECCIONES_IA/bienenhaus/` sin romper funcionalidades existentes.

---

## 1. Resumen Ejecutivo

El proyecto actual (`master`) y las correcciones (`_CORRECCIONES_IA/`) comparten **~95% de la base de código**. Las diferencias son **puntuales y críticas**:

| Área                        | Estado Actual                            | Correcciones                         | Acción                              |
| --------------------------- | ---------------------------------------- | ------------------------------------ | ----------------------------------- |
| **Seguridad (Migraciones)** | 0037 C2 comentado, 0060 = ML credentials | 0037 C2 activo, 0060 = RLS hardening | **FUSIONAR** (aplicar ambos)        |
| **Tasar/Tasaciones**        | Wizard 8 pasos                           | Listado + formulario single-page     | **REEMPLAZAR UI** (mantener lógica) |
| **Mercado Libre**           | Completo, funcional, DB credentials      | Simplificado, solo env vars          | **CONSERVAR ACTUAL**                |
| **Edge Functions**          | ml-oauth con getMlCredentials            | ml-oauth simplificado                | **CONSERVAR ACTUAL**                |
| **Chat validation**         | Tipos básicos                            | Tipos discriminados                  | **MEJORAR**                         |
| **Archivos basura**         | `VisitsPage.tsx.bak`                     | No existe                            | **ELIMINAR**                        |

---

## 2. Análisis Detallado por Categoría

### 2.1 Migraciones de Base de Datos (CRÍTICO)

| Migración                                  | Actual                                                                                                                        | Correcciones                                                                                                                                                                                                 | Decisión                                            |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| **0037_security_hardening.sql**            | C2 comentado (NO revoca overloads cortos)                                                                                     | **C2 ACTIVO** - revoca `submit_contact`/`subscribe_newsletter` sin honeypot                                                                                                                                  | **APLICAR CORRECCIÓN** - Fix de seguridad real      |
| **0041_agents_realtime_shadow.sql**        | `if not exists`, `drop if exists` (idempotente)                                                                               | Sintaxis limpia pero no idempotente                                                                                                                                                                          | **CONSERVAR ACTUAL** - Más seguro para re-ejecución |
| **0042_security_hardening_rpc.sql**        | Idéntico                                                                                                                      | Idéntico                                                                                                                                                                                                     | -                                                   |
| **0044_valuation.sql**                     | `if not exists`, `drop if exists`                                                                                             | Sintaxis limpia                                                                                                                                                                                              | **CONSERVAR ACTUAL** - Más seguro                   |
| **0046_valuation_add_missing_columns.sql** | 927 bytes                                                                                                                     | 900 bytes                                                                                                                                                                                                    | **COMPARAR Y FUSIONAR**                             |
| **0047_fix_ml_auto_triggers.sql**          | 7462 bytes                                                                                                                    | 6916 bytes                                                                                                                                                                                                   | **COMPARAR Y FUSIONAR**                             |
| **0048_admin_users_hardening.sql**         | 2508 bytes                                                                                                                    | 2591 bytes                                                                                                                                                                                                   | **COMPARAR Y FUSIONAR**                             |
| **0059_ml_production_hardening.sql**       | Idéntico                                                                                                                      | Idéntico                                                                                                                                                                                                     | -                                                   |
| **0060**                                   | **`ml_connection_client_credentials.sql`** (agrega `client_id_encrypted`, `client_secret_encrypted` + `get_ml_credentials()`) | **`security_hardening_missing_rls.sql`** (RLS para `trash_retention_policies`, `site_settings_versions`, `ml_sync_dead_letter`, `rate_limit_logs`, `property_drafts`, `property_valuations` + limpieza 0053) | **APLICAR AMBAS** - Son complementarias             |

**Riesgo:** La migración 0060 actual ya está en la BD (commit 11/8 07:01). La de correcciones es **diferente**. Debemos:

1. Verificar si 0060 actual ya se aplicó en producción
2. Crear **0061** que combine: RLS hardening de correcciones + mantener credenciales ML si no existen

### 2.2 Módulo Tasar/Tasaciones (MAJOR UI CHANGE)

**Actual (Wizard):**

- 8 pasos navegables (`STEPS` array, `stepIndex`, `goToStep`, `renderStepContent`)
- Rutas: `/tasar` (redirige a wizard), `/tasar/nueva`, `/tasar/:id`
- `TasarPage.module.css`: 338 líneas (wizard-stepper, valuation-step-card, etc.)

**Correcciones (Listado + Single Page):**

- **Listado** en `/tasar`: búsqueda, filtro (all/draft/finalized), tabla completa
- **Formulario** en `/tasar/nueva` y `/tasar/:id`: todas las secciones verticales
- **Nuevos hooks:** `useValuations`, `useDeleteValuation` en `valuationApi.ts`
- **Nuevo CSS:** `valuation-list-card`, `valuation-list-toolbar`, `valuation-table`, `valuation-form-stack`, `valuation-section-heading`, `valuation-section-icon`, `valuation-form-footer` (+193 líneas)
- **Routing:** `/tasar` = listado, `/tasar/nueva` = nueva, `/tasar/:id` = editar

**Decisión:** **REEMPLAZAR** `TasarPage.tsx` y `TasarPage.module.css` por la versión de correcciones.

- **MANTENER** toda la lógica de `valuationService.ts`, `valuationCalculations.ts`, `valuationSchemas.ts`, `valuationTypes.ts`
- **MANTENER** hooks `useValuation`, `useValuationDrafts`, `useLoadValuationDraft`, `useSaveValuationDraft`, `useFinalizeValuation`, `useEnableEditValuation`
- **AGREGAR** hooks `useValuations`, `useDeleteValuation` (ya existen en correcciones)

### 2.3 Mercado Libre (CONSERVAR ACTUAL - REGLA EXPLÍCITA)

| Componente                   | Actual                                                                                     | Correcciones                                    | Decisión                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------- | -------------------------------------------------------------- |
| **ml-oauth**                 | `getMlCredentials()` lee `site_settings` (ml_app_id, ml_client_secret) + fallback env vars | Solo env vars `ML_CLIENT_ID`/`ML_CLIENT_SECRET` | **CONSERVAR ACTUAL** - Más flexible, ya implementado y probado |
| **ml-sync**                  | 31151 bytes                                                                                | 31151 bytes (idéntico)                          | -                                                              |
| **ml-webhook**               | 16341 bytes                                                                                | 15944 bytes                                     | **COMPARAR** - Diferencia menor (397 bytes)                    |
| **ml.ts (\_shared)**         | 17622 bytes                                                                                | 16045 bytes                                     | **COMPARAR** - Refactor en correcciones                        |
| **ml.schemas.ts (\_shared)** | 10626 bytes                                                                                | 10626 bytes (idéntico)                          | -                                                              |

**Verificación requerida:** Ejecutar tests de OAuth → publicar → webhook → preguntas → cerrar antes de confirmar.

### 2.4 Edge Functions - Mejoras Menores

| Archivo              | Diferencia                                                                                                                                  | Decisión                                                              |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `chat-validation.ts` | Correcciones: tipos de retorno discriminados (`{valid: true, data} \| {valid: false, error}`) vs actual (`{valid: boolean, error?, data?}`) | **APLICAR** - Mejora type safety                                      |
| `ml.ts (_shared)`    | 1577 bytes menos en correcciones                                                                                                            | **COMPARAR Y DECIDIR** - Verificar que no rompa ml-sync/webhook/oauth |
| `crypto.ts`          | Idéntico                                                                                                                                    | -                                                                     |
| `http.ts`            | Idéntico                                                                                                                                    | -                                                                     |
| `rate-limit.ts`      | Idéntico                                                                                                                                    | -                                                                     |
| `visits.ts`          | Idéntico                                                                                                                                    | -                                                                     |

### 2.5 Archivos a Eliminar

| Archivo                                   | Razón                                         |
| ----------------------------------------- | --------------------------------------------- |
| `apps/admin/src/pages/VisitsPage.tsx.bak` | Backup innecesario, no existe en correcciones |

### 2.6 Package.json / Dependencias

- Ambos proyectos usan las mismas versiones (pnpm 11.20, Node ≥20, Preact 10.26, etc.)
- **No hay cambios de dependencias** en correcciones

---

## 3. Archivos a Tocar / No Tocar

### ✅ ARCHIVOS A REEMPLAZAR (copiar de correcciones → actual)

| Archivo                                           | Prioridad                                                  |
| ------------------------------------------------- | ---------------------------------------------------------- |
| `apps/admin/src/pages/TasarPage.tsx`              | 🔴 CRÍTICO                                                 |
| `apps/admin/src/pages/TasarPage.module.css`       | 🔴 CRÍTICO                                                 |
| `apps/admin/src/lib/valuationApi.ts`              | 🔴 CRÍTICO (agregar `useValuations`, `useDeleteValuation`) |
| `supabase/functions/_shared/chat-validation.ts`   | 🟡 MEDIO                                                   |
| `supabase/migrations/0037_security_hardening.sql` | 🔴 CRÍTICO (descomentar C2)                                |

### 🔀 ARCHIVOS A FUSIONAR (combinar lo mejor de ambos)

| Archivo                                                      | Estrategia                                                                                                               |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `supabase/migrations/0060_*.sql`                             | Crear **0061_combined_security_hardening.sql** que incluya: RLS de correcciones + mantener credenciales ML si no existen |
| `supabase/migrations/0046_valuation_add_missing_columns.sql` | Diff y fusionar                                                                                                          |
| `supabase/migrations/0047_fix_ml_auto_triggers.sql`          | Diff y fusionar                                                                                                          |
| `supabase/migrations/0048_admin_users_hardening.sql`         | Diff y fusionar                                                                                                          |
| `supabase/functions/_shared/ml.ts`                           | Comparar y decidir (correcciones más limpio, actual más completo)                                                        |

### 🚫 ARCHIVOS QUE NO DEBEN TOCARSE (Mercado Libre funcional)

| Archivo                                          | Razón                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------- |
| `supabase/functions/ml-oauth/index.ts`           | Actual soporta credenciales en BD (site_settings) - MÁS FLEXIBLE |
| `apps/admin/src/lib/ml.ts`                       | Lógica completa de ML, ya probada                                |
| `apps/admin/src/lib/ml.api.ts`                   | Hooks de ML funcionando                                          |
| `apps/admin/src/pages/MercadoLibrePage.tsx`      | UI completa de ML                                                |
| `apps/admin/src/types/ml.ts`                     | Tipos de ML                                                      |
| `supabase/functions/ml-sync/index.ts`            | Procesador de cola                                               |
| `supabase/functions/ml-webhook/index.ts`         | Webhook handler                                                  |
| `supabase/functions/ml-answer-question/index.ts` | Auto-respuesta                                                   |
| `supabase/functions/ml-metrics/index.ts`         | Métricas                                                         |
| `supabase/functions/ml-categories/index.ts`      | Categorías                                                       |
| `supabase/functions/ml-listing-types/index.ts`   | Listing types                                                    |
| `supabase/functions/ml-bulk-enqueue/index.ts`    | Bulk enqueue                                                     |
| `supabase/functions/ml-revoke-tokens/index.ts`   | Revocación                                                       |

### 🗑️ ARCHIVOS A ELIMINAR

| Archivo                                   |
| ----------------------------------------- |
| `apps/admin/src/pages/VisitsPage.tsx.bak` |

---

## 4. Migraciones Requeridas (Orden de Aplicación)

```bash
# 1. Fix seguridad inmediato (0037 - descomentar C2)
# Ya está en BD, pero C2 está comentado. Aplicar versión corregida.

# 2. Migración combinada 0061 (RLS hardening + preservar ML credentials)
# 0061_combined_security_hardening.sql

# 3. Migraciones de diff (0046, 0047, 0048) - solo si hay cambios reales
```

**Estrategia 0061:**

```sql
-- Incluir todo de 0060_security_hardening_missing_rls.sql (correcciones)
-- PERO verificar si columnas client_id_encrypted ya existen (0060 actual)
-- Si no existen, agregarlas; si existen, solo hacer RLS hardening
```

---

## 5. Riesgos Identificados

| Riesgo                                       | Probabilidad | Impacto    | Mitigación                                                           |
| -------------------------------------------- | ------------ | ---------- | -------------------------------------------------------------------- |
| **Migración 0060 conflictiva**               | Alta         | 🔴 Crítico | Crear 0061 que sea idempotente y combine ambos                       |
| **Tasar UI breaking change**                 | Media        | 🟡 Medio   | Tests E2E: crear → editar → guardar draft → finalizar → exportar PDF |
| **ml.ts refactor rompe ML**                  | Baja         | 🔴 Crítico | NO tocar ml.ts a menos que diff sea trivial; tests completos ML      |
| **chat-validation.ts types rompen ChatPage** | Baja         | 🟡 Medio   | Verificar imports en ChatPage.tsx y chat.ts                          |
| **Pérdida de credenciales ML en BD**         | Media        | 🔴 Crítico | Verificar que 0061 NO borre columnas client_id_encrypted             |

---

## 6. Conflictos Detectados

| Conflicto                             | Descripción                                           | Resolución                      |
| ------------------------------------- | ----------------------------------------------------- | ------------------------------- |
| **Dos 0060 diferentes**               | Actual = ML credentials, Correcciones = RLS hardening | Migración 0061 combinada        |
| **TasarPage completamente diferente** | Wizard vs Single-page + Listado                       | Reemplazar UI, mantener lógica  |
| **ml-oauth enfoques distintos**       | DB credentials vs env vars only                       | Conservar actual (más flexible) |

---

## 7. Dependencias y Variables de Entorno

**No hay cambios** en:

- `package.json` (root, admin, landing)
- `pnpm-lock.yaml`
- `.env.example` / `.env.production.template`
- `tsconfig.base.json`
- `vite.config.ts`

**Variables de entorno existentes son suficientes.**

---

## 8. Orden Recomendado de Implementación

### Paso 1: Seguridad Inmediata (30 min)

1. Aplicar fix 0037 (descomentar C2 - revocar overloads sin honeypot)
2. Eliminar `VisitsPage.tsx.bak`

### Paso 2: Migración 0061 Combinada (1 hora)

1. Crear `0061_combined_security_hardening.sql`
2. Aplicar en local (`supabase db push`)
3. Verificar RLS en Supabase Studio

### Paso 3: Rediseño Tasar (2-3 horas)

1. Reemplazar `TasarPage.tsx` y `TasarPage.module.css`
2. Verificar `valuationApi.ts` tiene `useValuations`, `useDeleteValuation`
3. Tests manuales: listado → nueva → editar → draft → finalizar → eliminar

### Paso 4: Mejoras Menores (30 min)

1. Aplicar `chat-validation.ts` types discriminados
2. Revisar `ml.ts` diff (decidir si aplicar)

### Paso 5: Validación Completa (2 horas)

```bash
pnpm install --frozen-lockfile
pnpm -r typecheck
pnpm -r build
pnpm -r test
pnpm --filter @bienenhaus/admin test:e2e
```

### Paso 6: Tests de Integración Críticos

- **Tasar:** Crear → editar → guardar draft → salir → volver → continuar → agregar comparables → calcular → finalizar → exportar PDF/CSV
- **ML:** OAuth → publicar → actualizar → webhook → pregunta → respuesta → cerrar
- **Chat:** Crear canal → enviar mensaje → adjuntar archivo → URL firmada → permisos
- **Properties:** CRUD completo → cambiar precio → sync ML → archivar

---

## 9. Estrategia de Rollback

```bash
# Si algo falla en producción:
git checkout main                    # Rama estable
supabase db reset                    # Recrear BD desde migraciones main
supabase functions deploy            # Re-desplegar edge functions main
pnpm build && node scripts/build-pages.mjs  # Rebuild landing
# Deploy GitHub Pages automático via workflow
```

**Punto de no retorno:** Después de aplicar migración 0061 en producción.

---

## 10. Checklist de Validación Pre-Deploy

- [ ] `pnpm -r typecheck` pasa (0 errores)
- [ ] `pnpm -r build` pasa (admin + landing)
- [ ] `pnpm -r test` pasa (unit tests)
- [ ] `pnpm --filter @bienenhaus/admin test:e2e` pasa (E2E)
- [ ] Migración 0061 aplicada en local sin errores
- [ ] RLS verificado en Supabase Studio (todas las tablas nuevas tienen policies)
- [ ] Tasar: listado muestra borradores/finalizados, búsqueda funciona, formulario single-page renderiza todos los campos
- [ ] ML: OAuth completo, publicación, webhook, preguntas, métricas
- [ ] Chat: mensajes, archivos, URLs firmadas
- [ ] No hay `console.log` innecesarios, no hay `TODO`/`FIXME` críticos
- [ ] `VisitsPage.tsx.bak` eliminado

---

## 11. Notas Finales

> **REGLA DE ORO:** Mercado Libre NO SE TOCA. Está funcional, probado y el usuario lo pidió explícitamente. Cualquier diferencia en ML se ignora a menos que sea un bug real demostrado.

> **Tasar:** El rediseño es la mayor cambio visual. La lógica de cálculo (valuationCalculations), validaciones (valuationSchemas), servicios (valuationService) y API (valuationApi) **se mantienen intactas**. Solo cambia la presentación.

> **Migración 0061:** Es el punto más delicado. Debe ser idempotente, no destructiva, y combinar lo mejor de ambos mundos: RLS hardening de correcciones + preservar credenciales ML del actual.
