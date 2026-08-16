# Runbook: ML-Sync (Fase 0 Robustez)

> **Versión**: 1.0 | **Fecha**: 2026-08-16 | **Migración base**: 0066_ml_sync_robustness

---

## 1. Arquitectura rápida

| Componente | Responsabilidad |
|---|---|
| `ml_sync_queue` | Cola de jobs (publish/update/delete) con `attempts`, `max_attempts`, `next_attempt_at`, `locked_by`, `locked_at` |
| `ml_claim_jobs(p_batch_size)` | RPC atómico: `FOR UPDATE SKIP LOCKED` + incrementa `attempts` + setea `locked_by=gen_random_uuid()` |
| `ml_sync_cooldown` | Circuit breaker: si ML API devuelve 429, se activa cooldown (default 60s) por `connection_id` |
| `ml_retry_dead_letter(p_dead_letter_id)` | RPC transaccional: reinserta en queue + marca DL resuelta; devuelve `{retried, reason}` |
| `ml_sync_dead_letter` | Dead letter queue con `resolved_at`, `resolved_by`, `resolution_notes` |
| Edge function `ml-sync` | Procesador: claim → cooldown check → token → process batch → rate_limited abort |

---

## 2. Escenarios de incidente y resolución

### 2.1 Cooldown activo persistente (circuit breaker no se recupera)

**Síntoma**: `ml_sync_cooldown` tiene filas con `cooldown_until > now()` por > 30 min. Nuevos jobs devuelven 429.

**Diagnóstico**:
```sql
SELECT * FROM ml_sync_cooldown WHERE cooldown_until > now();
```

**Causas típicas**:
- ML API sigue rate limiteando (tokens inválidos, cuota agotada)
- `getMlCooldown` en edge function no expira correctamente (bug en lógica de tiempo)

**Resolución**:
```sql
-- 1. Forzar expiración inmediata (limpiar cooldown)
DELETE FROM ml_sync_cooldown WHERE cooldown_until > now();

-- 2. Verificar tokens ML válidos
SELECT id, token_expires_at, is_active FROM ml_connection WHERE is_active = true;
-- Si token_expires_at < now() → tokens expirados → requiere re-OAuth

-- 3. Re-ejecutar ml-sync manualmente
curl -X POST https://<project>.supabase.co/functions/v1/ml-sync \
  -H "Authorization: Bearer <SERVICE_ROLE_KEY>" \
  -H "x-sync-secret: <ML_SYNC_SECRET>"
```

**Prevención**: Alerta si `cooldown_active > 0` por > 15 min.

---

### 2.2 Dead letter queue creciendo (dead letters no se resuelven)

**Síntoma**: `ml_sync_dead_letter` con `status='pending'` > 5 items.

**Diagnóstico**:
```sql
SELECT id, property_id, operation, attempts, max_attempts, last_error, created_at
FROM ml_sync_dead_letter
WHERE status = 'pending'
ORDER BY created_at;
```

**Causas típicas**:
- Error permanente en ML API (validación, permisos, item no existe)
- `ml_item_id` inválido para update/delete
- Rate limit persistente que agotó `max_attempts`

**Resolución por caso**:

| Causa | Acción |
|---|---|
| Item no existe en ML (404) | `DELETE FROM ml_sync_dead_letter WHERE id = X;` o re-asignar `ml_item_id` válido y `ml_retry_dead_letter(X)` |
| Permisos/tokens | Verificar `ml_connection` tokens válidos → re-OAuth si expirados → `ml_retry_dead_letter(X)` |
| Validación ML (400) | Revisar `last_error` → corregir datos en property → `ml_retry_dead_letter(X)` |
| Rate limit agotado | Esperar cooldown → `ml_retry_dead_letter(X)` (reinserta con attempts=0) |

**Retry masivo** (cuidado: solo si causa resuelta):
```sql
-- Reintentar TODAS las dead letters pending
SELECT ml_retry_dead_letter(id) FROM ml_sync_dead_letter WHERE status = 'pending';
```

---

### 2.3 Jobs stuck en `processing` (reaper F0.6 no limpia)

**Síntoma**: `ml_sync_queue` con `status='processing'` y (`locked_at IS NULL` OR `locked_at < now() - 15 min`) > 0.

**Diagnóstico**:
```sql
SELECT id, property_id, operation, locked_by, locked_at, updated_at
FROM ml_sync_queue
WHERE status = 'processing'
  AND (locked_at IS NULL OR locked_at < now() - interval '15 minutes');
```

**Resolución**:
```sql
-- Requeue manual (lo que hace el reaper automático)
UPDATE ml_sync_queue
SET status = 'pending', locked_by = NULL, locked_at = NULL
WHERE status = 'processing'
  AND (locked_at IS NULL OR locked_at < now() - interval '15 minutes');
```

**Causa raíz**: Edge function `ml-sync` se crasheó mid-proceso (OOM, timeout, uncaught exception). Revisar logs en Supabase Dashboard → Edge Functions → ml-sync → Logs.

---

### 2.4 `ml_claim_jobs` falla o devuelve vacío inesperadamente

**Síntoma**: Logs muestran `claim_failed` o queue tiene pending pero claim devuelve `[]`.

**Diagnóstico**:
```sql
-- Verificar jobs elegibles
SELECT count(*) FROM ml_sync_queue
WHERE status = 'pending'
  AND locked_by IS NULL
  AND next_attempt_at <= now();

-- Verificar RPC existe y grants
SELECT proname, proacl FROM pg_proc WHERE proname = 'ml_claim_jobs';
```

**Resolución**:
- `claim_failed` → revisar error en logs (permisos, schema, FK)
- Devuelve vacío pero hay pending → verificar `next_attempt_at` (puede ser futuro por backoff)

---

### 2.5 Rollback migración 0066 (emergencia)

**Solo si la migración rompe producción críticamente**.

```sql
-- 1. Dropear RPCs
DROP FUNCTION IF EXISTS ml_claim_jobs(int);
DROP FUNCTION IF EXISTS ml_retry_dead_letter(bigint);

-- 2. Dropear tabla cooldown
DROP TABLE IF EXISTS ml_sync_cooldown;

-- 3. Recrear índice dropeado (si era necesario)
CREATE UNIQUE INDEX uq_ml_sync_active_job
ON ml_sync_queue (property_id, operation)
WHERE status IN ('pending', 'processing');

-- 4. Verificar estado
SELECT 'rollback_complete' as status;
```

**Nota**: Esto NO revierte datos insertados en `ml_sync_cooldown` ni dead letters resueltas. Solo schema.

---

## 3. Operaciones rutinarias

### 3.1 Monitoreo diario (5 min)
```sql
-- Dashboard rápido
SELECT * FROM (
    SELECT 'queue_pending' as metric, count(*) as value FROM ml_sync_queue WHERE status='pending'
    UNION ALL SELECT 'queue_processing', count(*) FROM ml_sync_queue WHERE status='processing'
    UNION ALL SELECT 'queue_rate_limited', count(*) FROM ml_sync_queue WHERE status='rate_limited'
    UNION ALL SELECT 'dead_letter_pending', count(*) FROM ml_sync_dead_letter WHERE status='pending'
    UNION ALL SELECT 'cooldown_active', count(*) FROM ml_sync_cooldown WHERE cooldown_until > now()
) t;
```

### 3.2 Reintento dead letters semanal
```sql
SELECT ml_retry_dead_letter(id) FROM ml_sync_dead_letter WHERE status = 'pending';
```

### 3.3 Limpieza dead letters resueltas antiguas (>90 días)
```sql
DELETE FROM ml_sync_dead_letter
WHERE status IN ('resolved', 'ignored')
  AND resolved_at < now() - interval '90 days';
```

---

## 4. Contactos y escalación

| Nivel | Contacto | Canal |
|---|---|---|
| L1 (ops) | On-call dev | Slack #alerts-ml-sync |
| L2 (lead) | Tech lead | Llamada + Slack |
| L3 (emergencia) | CTO | Teléfono directo |

---

## 5. Referencias

- Migración: `supabase/migrations/0066_ml_sync_robustness.sql`
- Edge function: `supabase/functions/ml-sync/index.ts`
- Shared lib: `supabase/functions/_shared/ml.ts`
- Admin lib: `apps/admin/src/lib/ml.ts`
- Propuesta: `docs/features/ml-ingestion-robustness.md`