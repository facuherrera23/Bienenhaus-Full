# BLOQUEADORES — Plan de Remediación

> **Origen**: Revisión de módulos marcados `[✓]` (ML, Properties, Leads, Visits, Chat, Trash) — 2026-08-10.
> **Veredicto de la revisión**: Ningún módulo `[✓]` es verificable como completado en el estado actual del working tree. Los entregables existen, pero el código **no compila, no pasa typecheck y los tests no corren** por 4 bloqueadores transversales + 5 hitos de fase ausentes + defectos puntuales.
> **Restricción**: Este documento es SOLO planificación. No modifica código.

---

## Resumen ejecutivo

| # | Bloqueador / Hito | Severidad | Estado |
|---|---|---|---|
| B1 | `setup.ts` roto (JSX en `.ts`, paréntesis, `afterEach` vacío) | 🔴 Bloquea TODOS los tests | Abierto |
| B2 | Imports `_shared/*` apuntan a rutas inexistentes desde admin | 🔴 Bloquea tests de 5 módulos | Abierto |
| B3 | 26 errores de typecheck en 7 archivos | 🔴 Bloquea build | Abierto |
| B4 | Colisión de numeración de migraciones (0037/0038/0041) | 🔴 Rompe `supabase db reset` | Abierto |
| H1 | ML F3 — Token revocation incompleto (UI llama función inexistente) | 🟠 Hito `[✓]` no cumplido | Abierto |
| H2 | Chat F2 — Push notifications (`send-push` no existe) | 🟠 Hito `[✓]` no cumplido | Abierto |
| H3 | Chat F2 — Full-text search (sin tsvector/trigram) | 🟠 Hito `[✓]` no cumplido | Abierto |
| H4 | Leads F2 — Kanban drag-drop (sin RPC ni handlers) | 🟠 Hito `[✓]` no cumplido | Abierto |
| H5 | Visits F2 — Reminders reales (solo simulación) | 🟠 Hito `[✓]` no cumplido | Abierto |
| D1 | `TrashTable.tsx` (import duplicado + `React.ChangeEvent` sin import) | 🟡 Defecto | Abierto |
| D2 | `leads.ts` (funciones de validación duplicadas) | 🟡 Defecto → 24 tests fallan | Abierto |
| D3 | `ML` en raíz (0 bytes, residuo) | 🟢 Limpieza | Abierto |
| D4 | Faltan integration tests de Visits y Chat | 🟢 Cobertura | Abierto |

**Resultado de tests con workaround** (setup arreglado temporalmente): 38 archivos → 33 FAIL / 5 PASS; 174 tests → **142 passed / 32 failed**.
Suites que pasan: `api-client`, `chat.threading`, `csv`, `validators`, `valuationCalculations`.

---

## FASE 1 — Bloqueadores transversales

### B1. Arreglar `apps/admin/src/test/setup.ts`

**Problemas encontrados** (85 líneas):

| Línea | Problema | Impacto |
|---|---|---|
| L20 | JSX `<a>` dentro de archivo `.ts` | esbuild: "Expected `>` but found `href`" |
| L35-37 | JSX `<svg>` dentro de `.ts` | ídem |
| L79 | `createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: '...' }),` — falta `}` de cierre del objeto | SyntaxError |
| L84-85 | `afterEach(() => { });` — vacío, nunca llama `cleanup()` | Tests montan DOM que no se limpia entre tests |

**Fix propuesto**:
- [ ] Renombrar a `setup.tsx` (permitir JSX) o reemplazar JSX por `h()`/`createElement` de preact.
- [ ] Corregir L79: `{ data: { signedUrl: 'https://test.com/signed' }})` → `{ data: { signedUrl: 'https://test.com/signed' }})` con ambos cierres: `} })` + `)` de `mockResolvedValue` + `,`. (El objeto del mock debe cerrarse con `}`, el objeto externo con `}`, y el call con `)`.)
- [ ] L84-85: `afterEach(() => { cleanup(); });` (importar `cleanup` de `@testing-library/preact` — ya importado en L2).
- [ ] Si se renombra a `.tsx`: actualizar `setupFiles: ['./src/test/setup.tsx']` en `apps/admin/vitest.config.ts`.
- [ ] Verificación: `pnpm --filter @bienenhaus/admin test` → 0 errores de transform en el setup; correr `api-client.test.ts` aislado.

### B2. Resolver imports `_shared/*` inexistentes desde admin

**Causa raíz**: los módulos `_shared/*-validation.ts`, `_shared/crypto.ts`, `_shared/auto_reply.ts` y `ml.schemas.ts` viven SOLO en `supabase/functions/_shared/` (ecosistema Deno). El admin los importa como si estuvieran dentro de `apps/admin/`, y no hay alias ni copia local.

**Archivos afectados**:

| Archivo | Import roto |
|---|---|
| `apps/admin/src/lib/properties.ts` L27 | `../../_shared/properties-validation` |
| `apps/admin/src/lib/visits.ts` L29 | `../../_shared/visits-validation` |
| `apps/admin/src/lib/leads.ts` L19, L30, L981, L991 | `../../_shared/leads-validation` |
| `apps/admin/src/lib/chat.ts` L17, L697, L707, L722 | `../../_shared/chat-validation` |
| `apps/admin/src/lib/ml.ts` L277 | `../_shared/crypto` (dinámico) |
| `apps/admin/src/pages/ConfigPage.tsx` L27, L138 | `../../_shared/site-validation` |
| Tests en `apps/admin/src/lib/__tests__/` | `../_shared/auto_reply`, `../_shared/crypto`, `../_shared/properties-validation`, `../_shared/visits-validation`, `../ml.schemas` |

**Fix propuesto** (elegir A o B; recomiendo A):
- [ ] **Opción A (recomendada)**: Crear `apps/admin/src/lib/_shared/` con copias TS/Zod puras de: `properties-validation.ts`, `visits-validation.ts`, `leads-validation.ts`, `chat-validation.ts`, `site-validation.ts`, `crypto.ts`, `auto_reply.ts`, `ml.schemas.ts`. Adaptar solo lo necesario (quitar imports Deno, quedar zod + webcrypto). Agregar alias `_shared` en `vitest.config.ts` y `tsconfig` del admin.
- [ ] **Opción B**: Configurar alias `_shared` → `supabase/functions/_shared` en vite/tsconfig del admin. ⚠️ Riesgo: arrastra dependencias Deno (`jsr:`, `deno.land`) que vitest/tsc no resuelven. Solo viable si los archivos son 100% puros.
- [ ] Verificación: `pnpm --filter @bienenhaus/admin test` → los suites de ml/properties/visits/chat/leads dejan de fallar por resolución.

### B3. Corregir 26 errores de typecheck en 7 archivos

| Archivo | Líneas | Error | Causa probable |
|---|---|---|---|
| `apps/admin/src/lib/ml.ts` | L317, L360, L435, L473 | TS1134 ×4 | `.range((filters?.page ?? 1) - 1) * (filters?.pageSize ?? N), ...` — falta un paréntesis: debe ser `.range(((filters?.page ?? 1) - 1) * (filters?.pageSize ?? N), ...)` |
| `apps/admin/src/lib/chat.ts` | L764 | TS1005 `'}' expected` | Bloque sin cerrar (relacionado con imports dinámicos L697-722) |
| `apps/admin/src/lib/site.ts` | L295 | TS1005 `')' expected` | Paréntesis sin cerrar |
| `apps/admin/src/lib/trash.ts` | L277 | TS1005 `'}' expected` | Bloque sin cerrar |
| `apps/admin/src/lib/visits.ts` | L749 | TS1136 | Asignación/expresión mal formada |
| `apps/admin/src/pages/ConfigPage.tsx` | L161, L244 | TS1472, TS1005 | JSX o expresión malformada |
| `apps/admin/src/pages/VisitsPage.tsx` | L460-561 | 16 errores (TS1005/TS1381/TS17015/TS1382/TS1109/TS1128) | Fragment JSX roto a partir de L460 |

**Fix propuesto**:
- [ ] `ml.ts`: corregir los 4 `.range(...)` — agregar paréntesis para que la multiplicación quede DENTRO del primer argumento: `.range(((page ?? 1) - 1) * (pageSize ?? N), (page ?? 1) * (pageSize ?? N) - 1)` (comparar con L334 que está bien: `.range((pageParam - 1) * pageSize, pageParam * pageSize - 1)`).
- [ ] `chat.ts`/`site.ts`/`trash.ts`/`visits.ts`: leer el bloque completo y cerrar la estructura.
- [ ] `ConfigPage.tsx`/`VisitsPage.tsx`: reparar el JSX (fragment roto en VisitsPage L460+).
- [ ] Verificación: `pnpm typecheck` → 0 errores.

### B4. Renumerar migraciones colisionadas

**Colisiones** (2 archivos por número → `supabase db reset` falla):

| Número | Archivo existente (aplicado) | Archivo nuevo (colisiona) |
|---|---|---|
| 0037 | `0037_security_hardening.sql` | `0037_ml_dead_letter_queue.sql` |
| 0038 | `0038_enable_realtime.sql` | `0038_ml_webhook_dedup.sql` |
| 0041 | `0041_agents_realtime_shadow.sql` | `0041_property_drafts.sql` |

**Fix propuesto** (los nuevos van DESPUÉS de todo lo aplicado — último número actual: 0055):
- [ ] `0037_ml_dead_letter_queue.sql` → `0056_ml_dead_letter_queue.sql`
- [ ] `0038_ml_webhook_dedup.sql` → `0057_ml_webhook_dedup.sql`
- [ ] `0041_property_drafts.sql` → `0058_property_drafts.sql`
- [ ] Verificar que no haya dependencias entre las 3 renumeradas ni de migraciones posteriores (0042-0055) hacia ellas. Revisar referencias en SQL (tablas/triggers).
- [ ] Verificación: `supabase start` + `supabase db reset` → 0 errores.

---

## FASE 2 — Hitos de fase `[✓]` pendientes

### H1. ML F3 — Token revocation (incompleto)

**Hallazgo corregido de la revisión**: la UI SÍ tiene el botón "Revocar tokens en ML" (`MercadoLibrePage.tsx` L442-449) y un `revokeMutation` (L187) — **pero** `revokeMutation` hace `fetch` a `/functions/v1/ml-revoke-tokens` y **esa edge function NO existe** (Test-Path = False). Además `disconnectMl()` (ml.ts L256) hace DELETE sin revocar.

**Fix propuesto**:
- [ ] **Opción 1 (recomendada)**: Crear edge function `supabase/functions/ml-revoke-tokens/index.ts` (patrón `_shared/http.ts` + `_shared/crypto.ts`): revocar access+refresh token en `https://api.mercadolibre.com/oauth/revoke`, luego borrar `ml_connection`. Verificar `verify_jwt: true`.
- [ ] **Opción 2**: Reemplazar el `fetch` en `MercadoLibrePage.tsx` L187-194 por el hook ya existente `useRevokeMlTokens` (`ml.api.ts` L326) que llama a `revokeMlTokens()` (ml.ts L265, ya implementado client-side).
- [ ] Hacer que `disconnectMl()` (ml.ts L256) llame `revokeMlTokens()` antes del DELETE (o al menos ofrecer la opción en la UI).
- [ ] Verificación: E2E manual — conectar ML fake, revocar, confirmar toast + borrado de conexión + token invalidado en ML.

### H2. Chat F2 — Push notifications (NO implementado)

**Evidencia**: `supabase/functions/send-push/` no existe.

**Fix propuesto**:
- [ ] Migración: tabla `push_subscriptions` (user_id, endpoint, keys, created_at) + RLS.
- [ ] Edge function `supabase/functions/send-push/index.ts` (VAPID + Web Push, patrón `_shared`).
- [ ] Service Worker en admin (`public/sw.js`) + suscripción en `ChatPage`.
- [ ] Verificación: recibir push en segundo plano con datos reales.

### H3. Chat F2 — Full-text search (NO implementado)

**Evidencia**: sin tsvector/trigram/ilike en `chat.ts` ni migraciones de chat (solo 0002/0007 pre-existentes).

**Fix propuesto**:
- [ ] Migración: columna `tsvector` en `chat_messages` + índice GIN (o índice trigram) + trigger de actualización.
- [ ] `chat.ts`: reemplazar filtro client-side por consulta tsquery en `searchMessages`.
- [ ] Verificación: búsqueda con acentos/plurales devuelve resultados correctos.

### H4. Leads F2 — Kanban drag-drop (NO implementado)

**Evidencia**: sin RPC `update_lead_order`, sin handlers `draggable`/`onDrop` en `LeadsPage.tsx`.

**Fix propuesto**:
- [ ] Migración: columna `sort_order int` en `leads` + RPC `update_lead_order(lead_ids uuid[])` (staff-only).
- [ ] `LeadsPage.tsx`: vista Kanban por estado con drag & drop (HTML5 DnD o librería existente si ya hay en el repo — verificar antes de agregar dependencia).
- [ ] Persistir orden vía RPC + invalidar query.
- [ ] Verificación: mover lead entre columnas → persiste tras refresh.

### H5. Visits F2 — Reminders reales (NO implementado)

**Evidencia**: `processReminders()` en `supabase/functions/_shared/visits.ts` L127: "Simulación de envío (email/sms/push). Conectar a un gateway cuando exista."

**Fix propuesto**:
- [ ] Integrar gateway real: email (Resend — ya usado en `contact-submit`) y/o WhatsApp/push según disponibilidad.
- [ ] Actualizar `visits-process-reminders` para invocar el envío real (con rate limit y reintentos).
- [ ] Verificación: crear visita a 1h → recibir recordatorio real.

---

## FASE 3 — Defectos puntuales

### D1. `apps/admin/src/components/TrashTable.tsx`
- [ ] `Trash2` importado 2 veces (L4 y L6) → unificar.
- [ ] `React.ChangeEvent` en L55/59/74 sin importar `React` → usar `Event`/`TargetedEvent` de preact o importar el tipo correcto.

### D2. `apps/admin/src/lib/leads.ts` — funciones de validación duplicadas
- [ ] `validateLeadForm`/`validateLeadPatch` declaradas 2 veces (sync L966/971 + async L979/990) → eliminar el par redundante (o renombrar, p.ej. `validateLeadFormSync`), manteniendo las usadas por los 24 tests.
- [ ] Verificar la 3.ª definición en `validators.ts` L344 y unificar el origen de verdad (Zod).
- [ ] Verificación: `leads.validation.test.ts` → 24/24 PASS.

### D3. Archivo `ML` en la raíz (0 bytes)
- [ ] Eliminar (residuo).

### D4. Integration tests faltantes
- [ ] `apps/admin/src/test/integration/visits-flow.test.ts` (CRUD + reminders).
- [ ] `apps/admin/src/test/integration/chat-flow.test.ts` (canales + mensajes + búsqueda).
- [ ] Requieren Supabase local (`supabase start` + `db reset`); marcar `describe.skipIf(!process.env.SUPABASE_URL)` como los 3 existentes.

---

## FASE 4 — Verificación final (Definition of Done)

- [ ] `pnpm typecheck` → 0 errores.
- [ ] `pnpm --filter @bienenhaus/admin test` → 0 fallos (con `setup.ts` arreglado).
- [ ] `supabase db reset` → aplica 0001→0058 sin colisiones.
- [ ] `pnpm test:e2e` → suites críticas verdes (requiere Supabase local).
- [ ] `pnpm build` → OK.

---

## Orden de ejecución sugerido

1. **B4** (renumerar migraciones — independiente, destraba `db reset`)
2. **B1** (setup.ts — destraba TODOS los tests)
3. **B3** (typecheck — destraba build)
4. **B2** (imports `_shared` — destraba 5 módulos de tests)
5. **D2 → D1 → D3** (defectos rápidos)
6. **H1 → H4 → H5** (hitos medianos)
7. **H3 → H2** (hitos grandes: FTS y push)
8. **D4** (integration tests)
9. **FASE 4** (verificación completa)

> **Nota**: los errores de sintaxis en `chat.ts`, `ml.ts`, `VisitsPage.tsx` pueden deberse a edición concurrente en otra terminal. Antes de corregir, confirmar con el usuario si ese trabajo sigue en curso (evitar conflicto de edición).
