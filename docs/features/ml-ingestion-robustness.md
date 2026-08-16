# Propuesta de Arquitectura — Robustez de la Ingestión Mercado Libre

> **Fecha:** 2026-08-16
> **Estado:** Propuesta (pendiente de revisión Oracle y aprobación)
> **Alcance:** `supabase/functions/ml-*` + migraciones 0035–0065 + admin (`ml.ts`, `ml.api.ts`, `MercadoLibrePage`)
> **Relacionado:** [`docs/reviews/ML_MODULE_REMEDIATION_PLAN.md`](../reviews/ML_MODULE_REMEDIATION_PLAN.md) — plan previo, mayormente implementado; este documento cubre la **deuda restante**.

---

## 1. Resumen ejecutivo

La integración con Mercado Libre ya tiene la base sólida: dead letter queue, rate limiting propio, schemas Zod, deduplicación de webhooks, logging estructurado, revocación de tokens y batch configurable. Quedan **8 debilidades** verificadas en el código que afectan robustez en producción:

1. **Race condition en refresh de tokens** (dos invocaciones concurrentes refrescan el mismo `refresh_token` → el primero se invalida).
2. **Claim de jobs no atómico** (select-then-update en `ml-sync`; dos invocaciones solapadas pueden procesar el mismo job).
3. **Sin circuit breaker global ante 429** (el backoff es por-item; si ML limita la cuenta, todo el batch quema intentos).
4. **Latencia de sincronización de 5 min** (el webhook `items` solo encola; nada dispara `ml-sync` hasta el cron).
5. **Sin reconciliación de drift** (no se maneja `item_deleted` ni hay job que compare publicaciones ML vs `property_ml_meta`).
6. **Índices únicos duplicados** (0059 `uq_ml_sync_active_job` ≡ 0065 `uq_ml_sync_queue_active`).
7. **`retryDeadLetter` es un insert directo desde el cliente** (no pasa por RPC; puede colisionar con el índice único y no re-enqueuea con la semántica de `ml_enqueue`).
8. **`ml-sync` es un monolito de 931 líneas sin tests** (lógica de claim/backoff/mapping no testeada).

Se propone un abordaje en **3 fases**: endurecimiento inmediato (Fase 0), latencia casi en tiempo real (Fase 1), y resiliencia/escalabilidad con tests (Fase 2).

---

## 2. Arquitectura actual (verificada)

```
[DB triggers / Admin UI]
        │  ml_enqueue / ml_enqueue_batch (RPC, dedupe atómico ON CONFLICT DO NOTHING)
        ▼
   ml_sync_queue ────────────────► [pg_cron] cada 5 min ──► ml-sync (edge function)
   (pending/processing/success/            │ x-sync-secret (Vault)
    failed, attempts, next_attempt_at,     │
    locked_by, locked_at, ml_item_id)      │
        ▲                                  ▼
        │                          ML API (items, pictures)
        │                        success → property_ml_meta
        │                        fail ×5 → ml_sync_dead_letter
        │
[ml-webhook]  questions / orders / items / payments / shipments
   │  x-meli-signature (timing-safe) + dedup (user_id, resource, topic, sent_at)
   ▼
ml_questions / ml_orders / ml_payments / ml_shipments + auto-reply
```

### Componentes clave (con evidencia)

| Componente | Archivo | Notas verificadas |
|---|---|---|
| Claim de jobs | `ml-sync/index.ts:763-817` | Requeue de stuck (`processing` + `locked_at < now-15min` → `pending`); fetch `status='pending'`, `locked_by IS NULL`, `next_attempt_at <= now`, `LIMIT BATCH_SIZE`; luego **UPDATE por job** con `lockId = randomUUID()` |
| Backoff | `ml-sync/index.ts:869-902` | Lineal: `next_attempt_at = now + attempts * 5min`; `max_attempts` default 5 → `moveToDeadLetter` |
| Éxito | `ml-sync/index.ts:827-860` | `ml_sync_history` + upsert `property_ml_meta` + queue `success` |
| Token access | `_shared/ml.ts:167-196` | `expiresIn > 5min` → decrypt y return; si no, `refreshToken()` y UPDATE `ml_connection` **sin lock de fila** |
| Webhook items | `ml-webhook/index.ts:372-389` | Busca `property_ml_meta` por `ml_item_id` → `ml_enqueue(update)`; **no fetchea el item en ML, no maneja `item_deleted`** |
| DLQ retry (admin) | `apps/admin/src/lib/ml.ts:783-815` | `retryDeadLetter`: insert directo en `ml_sync_queue` con `attempts=0` + marca `resolved_at`; no usa `ml_enqueue` |
| Cron | `supabase/migrations/0035_ml_sync_cron.sql` | `ml-sync-every-5-min` → `net.http_post` a `/functions/v1/ml-sync` con `x-sync-secret` desde Vault |
| Dedup webhook | `supabase/migrations/0059` | Índice único `(user_id, resource, topic, sent_at)`; transición `received → processed/failed` |
| Índice activo | `0059 uq_ml_sync_active_job` + `0065 uq_ml_sync_queue_active` | **Ambos**: `UNIQUE (property_id, operation) WHERE status IN ('pending','processing')` — redundantes |

---

## 3. Lo ya resuelto (no duplicar)

El plan anterior (`ML_MODULE_REMEDIATION_PLAN.md`) ya está implementado en gran parte:

| Ítem del plan | Estado | Dónde |
|---|---|---|
| Dead letter queue + UI retry | ✅ | Migración 0056 + `MercadoLibrePage` (pestaña DLQ) + `ml.ts:783-820` |
| Zod schemas ML API | ✅ | `_shared/ml.schemas.ts` (309 líneas) |
| Rate limiting propio | ✅ | `_shared/rate-limit.ts` (166 líneas) aplicado en todas las funciones ML |
| Webhook deduplicación | ✅ | Migración 0059 (índice `uq_ml_webhook_event_identity`) |
| Structured logging | ✅ | `LogEntry` en `ml-sync` (status success/failed/rate_limited/retry/dead_letter) |
| Token revocation on disconnect | ✅ | `ml-revoke-tokens` + `disconnectMl` |
| Batch/concurrencia configurables | ✅ | `BATCH_SIZE`, `MAX_CONCURRENT_JOBS` en `ml-sync` |
| Client credentials cifrados | ✅ | Migración 0060 + `get_ml_credentials()` |
| `ml_item_id` como `text` | ✅ | Migración 0064 |
| Webhook secret configurable | ✅ | Migración 0063 (`site_settings.ml_webhook_secret`) |

> ⚠️ **No** está implementado del plan previo: cache de métricas en `ml-metrics` (Fase 2.3) — verificado sin `CACHE`/`site_settings` en el archivo.

---

## 4. Debilidades restantes (con evidencia)

### W1 — Race condition en refresh de tokens
`_shared/ml.ts:167-196`. Dos invocaciones concurrentes (webhook + cron + trigger manual) pueden ver `expiresIn <= 5min`, refrescar ambas y escribir `ml_connection` — la segunda sobrescribe la primera. Mercado Libre **rota el `refresh_token`** en cada refresh: el primero queda invalidado y la próxima vez que se use el token guardado, ML responde 400 `invalid_grant`. **Impacto:** sincronización rota hasta reconectar manualmente.

### W2 — Claim de jobs no atómico
`ml-sync/index.ts:770-817`. El fetch (`WHERE status='pending' AND locked_by IS NULL`) y el UPDATE por job son operaciones separadas. Dos invocaciones solapadas de `ml-sync` (cron + manual) pueden leer el mismo job como disponible y procesarlo dos veces (publish duplicado en ML, update/delete sobre el mismo item). Mitigación parcial: índice único evita *encolar* duplicados, pero no evita *reclamar* el mismo job dos veces.

### W3 — Sin circuit breaker global ante 429
`_shared/ml.ts` `runMlApiCallWithRetry` hace retry/backoff **por llamada**. Si ML rate-limita la cuenta (ej. 429 global por app), cada job del batch intenta, espera su backoff individual y quema `attempts` — todos fallan con 429 en la misma ventana y terminan en DLQ sin que nadie corte el batch. Falta un cooldown global por cuenta (pausar el worker N segundos/minutos al recibir el primer 429).

### W4 — Latencia de sincronización de 5 minutos
`ml-webhook/index.ts:372-389` (handleItems) solo encola el update; el procesamiento real espera al cron de 5 min. Para cambios de precio/stock hechos desde ML (o desde la web del vendedor), la propiedad local queda desactualizada hasta 5 min. No existe disparo directo webhook → `ml-sync` (el mecanismo `net.http_post` con `x-sync-secret` ya existe para el cron, se puede reutilizar).

### W5 — Sin reconciliación de drift
- **`item_deleted` no manejado:** si la publicación se elimina en ML (por ML, por el vendedor o por moderación), no hay webhook `items/deleted` registrado ni lógica en `handleItems`; `property_ml_meta` queda con un `ml_item_id` fantasma y `status` obsoleto.
- **Sin job de reconciliación:** nada compara periódicamente los items activos en ML (`/users/{id}/items/search`) contra `property_ml_meta` para detectar borrados, precios cambiados en ML o items huérfanos.

### W6 — Índices únicos duplicados
0059 creó `uq_ml_sync_active_job` y 0065 creó `uq_ml_sync_queue_active` con **la misma definición** (`UNIQUE (property_id, operation) WHERE status IN ('pending','processing')`). Mantenimiento duplicado, ambigüedad en error de constraint y costo de escritura redundante.

### W7 — `retryDeadLetter` sin semántica de enqueue
`apps/admin/src/lib/ml.ts:783-815`. Hace `INSERT` directo a `ml_sync_queue` con `attempts=0`, `next_attempt_at=now`, `status='pending'`. Problemas:
- No usa `ml_enqueue` RPC → no respeta `p_internal`/validaciones/RLS consistentes.
- Puede colisionar con `uq_ml_sync_queue_active` si ya existe un job pending/processing para esa propiedad+operación → error 23505 crudo en la UI.
- No valida que el item de DLQ no haya sido resuelto/ignorado antes.

### W8 — `ml-sync` monolítico sin tests
931 líneas con claim, backoff, mapping de atributos, subida de imágenes, DLQ y logging acoplados en un solo handler. La lógica pura (cálculo de `next_attempt_at`, decisión finalFailed, mapping de atributos) no tiene tests unitarios. Cualquier cambio de robustez (Fase 0/1) sin tests incrementa riesgo de regresión.

---

## 5. Propuesta por fases

### Fase 0 — Endurecimiento inmediato (~1-2 días, sin cambio de latencia)

| # | Cambio | Archivos | Criterio de éxito |
|---|---|---|---|
| F0.1 | **Serializar refresh de tokens**: `SELECT ... FOR UPDATE` sobre `ml_connection` (o advisory lock `pg_advisory_xact_lock(hashtext(id))`) antes de refrescar; re-leer `token_expires_at` tras adquirir el lock y saltar si otro ya refrescó | `_shared/ml.ts` | Dos invocaciones concurrentes con token expirado → exactamente 1 refresh, ambas obtienen token válido |
| F0.2 | **Claim atómico**: reemplazar select+update por un solo `UPDATE ml_sync_queue SET status='processing', locked_by=..., locked_at=now() WHERE id = ANY(...) AND status='pending' AND locked_by IS NULL AND next_attempt_at <= now() RETURNING id` (o RPC `ml_claim_jobs(batch_size)`) | `ml-sync/index.ts` (+ RPC en migración si aplica) | Dos `ml-sync` concurrentes no procesan el mismo job |
| F0.3 | **Circuit breaker 429 global**: al recibir el primer 429, persistir `ml_sync_cooldown_until` (tabla nueva o `site_settings`) y abortar el resto del batch; el cron no reclama jobs mientras el cooldown esté activo | `_shared/ml.ts` + `ml-sync/index.ts` + migración | Batch con 429 → 1 solo intento fallido por ventana, resto del batch no quema attempts |
| F0.4 | **Consolidar índices duplicados**: dropear `uq_ml_sync_active_job` (0059), conservar `uq_ml_sync_queue_active` (0065) — o viceversa, documentarlo en el ADR | Migración nueva | Un solo constraint `UNIQUE (property_id, operation) WHERE status IN (...)`. Verificar que `ml_enqueue` usa `ON CONFLICT` contra el índice conservado |
| F0.5 | **RPC `ml_retry_dead_letter(dead_letter_id)`**: re-enqueue vía RPC con semántica `ml_enqueue` (dedupe, validación estado DLQ, marca `resolved_at`/`resolved_by`) | Migración + `ml.ts`/`ml.api.ts` | `retryDeadLetter` del admin usa el RPC; sin error 23505; idempotente |
| F0.6 | **Reaper de stuck más robusto**: el requeue actual (`locked_at < now-15min`) también debe exigir `locked_by IS NOT NULL` y loggear el rescate (hoy un job `processing` sin `locked_at` queda colgado para siempre) | `ml-sync/index.ts` | Todo job `processing` se rescata o se marca `failed` con error explícito |

### Fase 1 — Latencia casi en tiempo real (~2-3 días)

| # | Cambio | Archivos | Criterio de éxito |
|---|---|---|---|
| F1.1 | **Webhook `items` dispara `ml-sync`**: tras encolar el update, `net.http_post` a `/functions/v1/ml-sync` con `x-sync-secret` (mismo mecanismo del cron) — o invocación directa del worker si el payload lo permite | `ml-webhook/index.ts` | Cambio de item en ML reflejado localmente en <10s (vs 5 min) |
| F1.2 | **Manejar `item_deleted`**: registrar tópico `items/deleted` y/o en `handleItems` verificar estado del item en ML (GET `/items/{id}`); si `deleted`/`closed` → encolar `delete` y limpiar `property_ml_meta` | `ml-webhook/index.ts` + README webhook | Borrado en ML → `property_ml_meta` sin item fantasma en <1 min |
| F1.3 | **Job de reconciliación `ml-reconcile`** (cron diario): `GET /users/{id}/items/search` → comparar contra `property_ml_meta` → encolar updates/borrados faltantes + reporte | Edge function nueva + migración cron (como 0035) | Drift detectado y auto-corregido en ≤24h; reporte en `ml_sync_history` |

### Fase 2 — Resiliencia, tests y observabilidad (~2-3 días)

| # | Cambio | Archivos | Criterio de éxito |
|---|---|---|---|
| F2.1 | **Extraer lógica pura** a `_shared` (cálculo `next_attempt_at`, `isFinalFailed`, mapping de atributos, decisión de claim) | `_shared/ml-sync-logic.ts` + `ml-sync/index.ts` | Funciones puras exportadas, sin dependencia de Supabase/Deno |
| F2.2 | **Tests unitarios** (Vitest admin + Deno test para edge): backoff, finalFailed, claim (con mock), mapping atributos, dedup, retryDeadLetter RPC | `apps/admin/src/lib/__tests__/ml.*.test.ts` + `supabase/functions/**/__tests__` | Cobertura ≥80% en lógica extraída |
| F2.3 | **Backoff exponencial con jitter** (reemplaza el lineal `attempts*5min`) | `_shared/ml-sync-logic.ts` | Retries distribuidos; menos thundering herd post-cooldown |
| F2.4 | **Observabilidad**: métricas de cola (depth por estado), tasa de éxito, DLQ count, alertas (job failed >3/h, DLQ >50) | `ml-sync` logging + (opcional) Sentry edge | Dashboards/alertas accionables |

---

## 6. Criterios de aceptación globales

- [ ] Dos `ml-sync` concurrentes no procesan el mismo job (W2) y el refresh de tokens es idempotente (W1).
- [ ] Un 429 global no quema intentos del resto del batch (W3).
- [ ] Cambios de item vía webhook se reflejan en <10s (W4).
- [ ] Borrado en ML detectado y reconciliado en ≤24h sin items fantasma (W5).
- [ ] Un solo índice único activo documentado (W6).
- [ ] DLQ retry idempotente vía RPC, sin errores 23505 en UI (W7).
- [ ] Lógica de sincronización con tests ≥80% en el código extraído (W8).
- [ ] `pnpm typecheck` + `pnpm test` + E2E ML verdes.

---

## 7. Archivos afectados

**Edge functions**
- `supabase/functions/_shared/ml.ts` (F0.1, F0.3)
- `supabase/functions/ml-sync/index.ts` (F0.2, F0.3, F0.6, F2.1, F2.3)
- `supabase/functions/ml-webhook/index.ts` (F1.1, F1.2)
- `supabase/functions/ml-reconcile/index.ts` (nueva, F1.3)
- `supabase/functions/_shared/ml-sync-logic.ts` (nueva, F2.1)

**Migraciones**
- `supabase/migrations/0066_ml_sync_robustness.sql` (F0.3 cooldown, F0.4 drop índice, F0.5 RPC)
- `supabase/migrations/0067_ml_reconcile_cron.sql` (F1.3, patrón de 0035)

**Admin**
- `apps/admin/src/lib/ml.ts` (F0.5: usar RPC en `retryDeadLetter`)
- `apps/admin/src/lib/ml.api.ts` (si cambia la firma)
- `apps/admin/src/lib/__tests__/ml.*.test.ts` (F2.2)

**Docs**
- `docs/reviews/ML_MODULE_REMEDIATION_PLAN.md` (marcar ítems completados faltantes)
- `README.md` sección ML si cambia el flujo webhook→sync — **solo si el usuario lo pide** (contiene secrets)

---

## 8. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| F0.2 rompe el claim y deja jobs sin procesar | Baja | Alto | RPC con test de concurrencia; requeue de stuck conservado (F0.6) |
| 429 global mal calibrado pausa el sync innecesariamente | Media | Medio | Cooldown configurable (env `ML_SYNC_COOLDOWN_MS`), log de cada pausa, default conservador (60s) |
| Webhook→sync (F1.1) dispara syncs redundantes con el cron | Media | Bajo | Claim atómico (F0.2) hace el disparo idempotente; rate limit `ml-sync` 30/min propio |
| `item_deleted` requiere re-registrar tópicos en ML | Media | Medio | Fallback: reconciliación diaria (F1.3) cubre el gap aunque el tópico no esté registrado |
| Reconciliación encola muchos updates el primer día | Baja | Medio | Limitar batch + rate limit propio; dry-run inicial con reporte |

---

## 9. Decisión pendiente

- [ ] **Revisión Oracle** de esta propuesta (recomendada antes de implementar) — enfocada en F0.1/F0.2 (concurrencia) y F0.3 (cooldown global).
- [ ] Aprobación del usuario: fases completas, Fase 0 solamente, o variantes.

---

**Documento vivo** — actualizar conforme se implementen las fases. Cada fase con PR separado y tests pasando.
