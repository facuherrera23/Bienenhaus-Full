# Plan de Remediación Completa — Módulo Mercado Libre (ML)

**Objetivo:** Llevar el módulo ML de ~95% funcional a 100% production-ready con type safety estricta, tests completos, observabilidad, dead letter queue, y performance optimizada.

---

## Estado Actual (Resumen)

| Área                  | % Completo | Bloqueadores para 100%                                                                             |
| --------------------- | ---------- | -------------------------------------------------------------------------------------------------- |
| OAuth & Conexión      | 95%        | Redirect URI hardcodeado, salt fijo crypto, race condition multi-admin                             |
| Sync Queue & Worker   | 90%        | Sin dead letter queue, imágenes secuenciales, batch size fijo, error categorization duplicada      |
| Webhooks & Auto-reply | 85%        | ML_WEBHOOK_SECRET obligatorio sin fallback, deduplicación faltante, solo loggea payments/shipments |
| Métricas              | 80%        | N+1 problem, sin cache, timeout fijo, solo 50 orders                                               |
| Admin UI              | 90%        | Sin paginación real, sin filtros avanzados, skeleton genérico                                      |
| Type Safety           | 70%        | as unknown as, any implícito, casts sin validación en paths críticos                               |
| Testing               | 0%         | Cero tests — unit, integration, E2E, contract                                                      |
| Observabilidad        | 60%        | Logs sin estructura, sin métricas latencia, sin alertas                                            |
| Seguridad             | 85%        | Rate limiting solo en ML APIs, secrets no rotados, token revocation faltante                       |

---

## Criterios de Aceptación — 100% Funcional

El módulo se considera 100% funcional cuando TODOS los siguientes criterios se cumplen:

### Funcionalidad Core

- [ ] OAuth flow completo sin race conditions, con revocación de tokens al desconectar
- [ ] Sync queue procesa jobs con dead letter queue visible y recuperable desde UI
- [ ] Webhooks manejan todos los topics (questions, orders, items, payments, shipments) con deduplicación
- [ ] Auto-reply funciona para todos los triggers configurables
- [ ] Métricas cargan en <2s con cache y paginación completa
- [ ] Imágenes se suben en paralelo (Promise.allSettled)

### Type Safety (Strict)

- [ ] Cero any en código ML (ml.ts, crypto.ts, auto_reply.ts, edge functions)
- [ ] Cero as unknown as / as Type sin validación runtime (Zod schemas)
- [ ] Tipos generados de DB sincronizados con tipos manuales (ml.ts ↔ database.ts)
- [ ] RPC callRpc type-safe sin casts

### Testing (Cobertura Mínima)

| Tipo        | Cobertura Mínima  | Archivos Objetivo                                  |
| ----------- | ----------------- | -------------------------------------------------- |
| Unit        | 80%               | ml.ts, crypto.ts, auto_reply.ts, ml.api.ts mappers |
| Integration | 50%               | OAuth flow, sync queue job, webhook handling       |
| E2E         | 3 flujos críticos | Connect → Publish → Webhook order → Auto-reply     |
| Contract    | 100%              | ML API response schemas validados con Zod          |

### Observabilidad

- [ ] Structured JSON logs con job_id, duration_ms, ml_api_latency_ms, status
- [ ] Métricas Prometheus/Grafana: ml_sync_job_duration, ml_webhook_latency, ml_queue_depth, ml_sync_success_rate
- [ ] Alertas: jobs failed > 3 en 1h, queue depth > 100, webhook 5xx > 5%
- [ ] Dashboard admin: queue status real-time, sync history con filtros, métricas cached

### Performance

- [ ] Sync job <1s (actual ~3-5s) — paralelización imágenes + batch ML API
- [ ] Webhook processing <100ms (actual ~200-500ms)
- [ ] Metrics fetch <2s (actual ~5-10s) — cache 5min + batch requests
- [ ] Queue pagination infinita + filtros en UI

### Seguridad

- [ ] Rate limiting propio en todas edge functions ML (no solo ML APIs)
- [ ] Secrets rotados documentados + procedimiento
- [ ] Token revocation en disconnect
- [ ] Webhook signature verification con fallback graceful (no 500 si secret missing)

---

## Plan de Trabajo Priorizado

### FASE 1 — CRÍTICO (Bloquean 100%) — ~4 días

#### 1.1 Dead Letter Queue + UI Recuperación

Archivos nuevos:

- supabase/migrations/0037_ml_dead_letter_queue.sql — tabla ml_sync_dead_letter
- supabase/functions/ml-sync/index.ts — mover jobs failed > max_attempts a dead letter
- apps/admin/src/lib/ml.api.ts — useMlDeadLetter, useRetryDeadLetter, useDeleteDeadLetter
- apps/admin/src/pages/MercadoLibrePage.tsx — pestaña Dead Letter con tabla + acciones

Tabla ml_sync_dead_letter:

```sql
CREATE TABLE ml_sync_dead_letter (
    id BIGSERIAL PRIMARY KEY,
    original_queue_id INT NOT NULL REFERENCES ml_sync_queue(id),
    property_id UUID NOT NULL REFERENCES properties(id),
    operation ml_operation NOT NULL,
    attempts INT NOT NULL,
    max_attempts INT NOT NULL,
    last_error TEXT,
    payload JSONB,
    ml_item_id INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    moved_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES admin_users(id),
    resolution_notes TEXT
);
CREATE INDEX idx_ml_dead_letter_property ON ml_sync_dead_letter(property_id);
CREATE INDEX idx_ml_dead_letter_moved_at ON ml_sync_dead_letter(moved_at DESC);
```

Lógica en ml-sync: Al fallar job con attempts >= max_attempts → INSERT en dead_letter + DELETE de queue + log en ml_sync_history con status='dead_letter'.

#### 1.2 Type Safety — Zod Schemas para ML API

Archivo nuevo: supabase/functions/_shared/ml.schemas.ts

```typescript
import { z } from 'zod';

export const MlTokenResponseSchema = z.object({
    access_token: z.string(),
    token_type: z.string(),
    expires_in: z.number(),
    scope: z.string(),
    user_id: z.number(),
    refresh_token: z.string(),
});

export const MlItemSchema = z.object({
    id: z.string(),
    title: z.string(),
    price: z.number(),
    status: z.string(),
    permalink: z.string(),
    listing_type_id: z.string(),
    sold_quantity: z.number().optional(),
    available_quantity: z.number().optional(),
    currency_id: z.string().optional(),
    pictures: z.array(z.object({ source: z.string().url() })).optional(),
    attributes: z.array(z.object({ id: z.string(), value_name: z.string() })).optional(),
});

export const MlCategorySchema = z.object({ id: z.string(), name: z.string() });
export const MlListingTypeSchema = z.object({ id: z.string(), name: z.string() });

export const MlQuestionSchema = z.object({
    id: z.number(),
    item_id: z.number(),
    text: z.string().nullable(),
    from: z.object({ user_id: z.number(), nickname: z.string() }).nullable(),
    date_created: z.string(),
    status: z.enum(['UNANSWERED', 'ANSWERED', 'CLOSED']),
    answer: z.object({ text: z.string(), status: z.string(), date_created: z.string() }).optional(),
});

export const MlOrderSchema = z.object({
    id: z.string(),
    status: z.string(),
    shipping: z.object({ status: z.string() }).nullable().optional(),
    payments: z.array(z.object({ status: z.string() })).optional(),
    order_items: z.array(z.object({ item: z.object({ id: z.number() }) })).optional(),
    buyer: z.object({ id: z.number(), nickname: z.string() }).nullable().optional(),
    total_amount: z.number().nullable().optional(),
    currency_id: z.string().nullable().optional(),
    date_created: z.string().nullable().optional(),
    date_closed: z.string().nullable().optional(),
});
```

Uso en ml.ts:

```typescript
// ANTES: return text ? (JSON.parse(text) as unknown) : null;
// DESPUÉS:
const parsed = JSON.parse(text);
return MlItemSchema.parse(parsed); // throws si inválido → catch → categorizeMlError
```

Eliminar as unknown as en ml-sync, ml-webhook, ml-metrics.

#### 1.3 Rate Limiting en Edge Functions

Archivo nuevo: supabase/functions/_shared/rate-limit.ts

```typescript
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
);

const WINDOWS = {
    'ml-sync': { requests: 30, windowMs: 60_000 },
    'ml-webhook': { requests: 100, windowMs: 60_000 },
    'ml-metrics': { requests: 10, windowMs: 60_000 },
    'ml-answer-question': { requests: 20, windowMs: 60_000 },
    'ml-bulk-enqueue': { requests: 5, windowMs: 60_000 },
} as const;

type FnName = keyof typeof WINDOWS;

export async function checkRateLimit(
    fnName: FnName,
    identifier: string,
): Promise<{
    allowed: boolean;
    retryAfter?: number;
    remaining: number;
}> {
    const config = WINDOWS[fnName];
    const key = `ratelimit:${fnName}:${identifier}`;
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const { data: logs } = await supabase
        .from('rate_limit_logs')
        .select('created_at')
        .eq('key', key)
        .gte('created_at', new Date(windowStart).toISOString());

    const count = logs?.length ?? 0;
    if (count >= config.requests) {
        const oldest = logs?.[0]?.created_at ? new Date(logs[0].created_at).getTime() : now;
        const retryAfter = Math.ceil((oldest + config.windowMs - now) / 1000);
        return { allowed: false, retryAfter: Math.max(1, retryAfter), remaining: 0 };
    }

    await supabase.from('rate_limit_logs').insert({ key, created_at: new Date().toISOString() });
    return { allowed: true, remaining: config.requests - count - 1 };
}
```

Aplicar en TODAS las edge functions ML (inicio de handler):

```typescript
const clientIp = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';
const rl = await checkRateLimit('ml-sync', clientIp);
if (!rl.allowed) return respond(429, { error: 'Rate limited', retry_after: rl.retryAfter });
```

#### 1.4 Webhook Deduplication

Migración: supabase/migrations/0038_ml_webhook_dedup.sql

```sql
ALTER TABLE ml_webhook_events
ADD CONSTRAINT uq_ml_webhook_event UNIQUE (resource, attempts, topic);
```

En ml-webhook/index.ts: Antes de procesar, verificar si ya existe evento con mismo resource+attempts+topic → si existe y status='processed', return 200 OK sin reprocesar.

---

### FASE 2 — ALTO (Calidad Producción) — ~5 días

#### 2.1 Parallel Image Upload en ml-sync

En supabase/functions/ml-sync/index.ts — prepareImagesForML:

```typescript
async function prepareImagesForML(
    accessToken: string,
    images: { url: string; storage_path?: string }[],
): Promise<string[]> {
    const downloadUpload = async (img: { storage_path: string }) => {
        // ... download from Supabase Storage
        // ... upload to ML
        return mainVariation?.url ?? null;
    };

    const validImages = images
        .slice(0, 12)
        .filter((i): i is { storage_path: string } => !!i.storage_path);
    const results = await Promise.allSettled(validImages.map(downloadUpload));

    const urls: string[] = [];
    results.forEach((r, i) => {
        if (r.status === 'fulfilled' && r.value) urls.push(r.value);
        else
            console.warn(
                `[ml-sync] Image ${validImages[i].storage_path} failed:`,
                r.status === 'rejected' ? r.reason : 'no url',
            );
    });
    return urls;
}
```

Impacto: 12 imágenes secuenciales (~20s) → paralelo (~3-5s).

#### 2.2 Configurable Batch Size + Backpressure

En ml-sync/index.ts:

```typescript
const BATCH_SIZE = Number(Deno.env.get('ML_SYNC_BATCH_SIZE') ?? '10');
const MAX_CONCURRENT_JOBS = Number(Deno.env.get('ML_SYNC_MAX_CONCURRENT') ?? '3');

async function processJobsConcurrently(jobs: QueueJob[], accessToken: string) {
    const results = [];
    for (let i = 0; i < jobs.length; i += MAX_CONCURRENT_JOBS) {
        const batch = jobs.slice(i, i + MAX_CONCURRENT_JOBS);
        const batchResults = await Promise.allSettled(
            batch.map((job) =>
                runJob(job.id, job.operation, job.property_id, job.ml_item_id, accessToken),
            ),
        );
        results.push(...batchResults);
    }
    return results;
}
```

#### 2.3 Metrics Caching (5 min)

En ml-metrics/index.ts:

```typescript
const CACHE_TTL_MS = 5 * 60 * 1000;
const cacheKey = `ml_metrics:${connection.user_id}`;

async function getCachedMetrics(): Promise<MetricsResponse | null> {
    const { data } = await supabase
        .from('site_settings')
        .select('value, updated_at')
        .eq('key', cacheKey)
        .maybeSingle();
    if (!data) return null;
    const age = Date.now() - new Date(data.updated_at).getTime();
    if (age > CACHE_TTL_MS) return null;
    return data.value as MetricsResponse;
}

async function setCachedMetrics(metrics: MetricsResponse): Promise<void> {
    await supabase.from('site_settings').upsert({
        key: cacheKey,
        value: metrics,
        value_type: 'json',
        is_public: false,
    });
}
```

#### 2.4 Structured Logging (JSON)

Archivo nuevo: supabase/functions/_shared/logger.ts

```typescript
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    function: string;
    job_id?: string | number;
    property_id?: string;
    ml_item_id?: number | string;
    operation?: string;
    duration_ms?: number;
    ml_api_latency_ms?: number;
    status?: 'success' | 'failed' | 'rate_limited' | 'retry';
    error?: string;
    metadata?: Record<string, unknown>;
}

function log(level: LogLevel, entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
    const out: LogEntry = { timestamp: new Date().toISOString(), level, ...entry };
    console.log(JSON.stringify(out));
}

export const logger = {
    debug: (e: Omit<LogEntry, 'timestamp' | 'level'>) => log('debug', e),
    info: (e: Omit<LogEntry, 'timestamp' | 'level'>) => log('info', e),
    warn: (e: Omit<LogEntry, 'timestamp' | 'level'>) => log('warn', e),
    error: (e: Omit<LogEntry, 'timestamp' | 'level'>) => log('error', e),
};
```

Uso en ml-sync:

```typescript
const start = Date.now();
const result = await runJob(...);
const duration = Date.now() - start;
logger.info({
    function: 'ml-sync',
    job_id: job.id,
    property_id: job.property_id,
    operation: job.operation,
    duration_ms: duration,
    status: result.ok ? 'success' : 'failed',
    error: result.error,
});
```

#### 2.5 Unit Tests — Vitest (Cobertura 80%)

Archivos nuevos:

```
apps/admin/src/lib/__tests__/
├── ml.mappers.test.ts        # toMlQueueRow, toMlMetaRow, embedProperty
├── ml.settings.test.ts       # fetchMlSettings, upsertSetting, buildAuthorizeUrl
├── ml.queue.test.ts          # fetchMlQueue, fetchMlMeta (mock supabase)
├── crypto.test.ts            # encrypt/decrypt roundtrip
├── auto_reply.test.ts        # getActiveTemplate, sendQuestionAnswer (mock fetch)
└── ml.schemas.test.ts        # Zod schemas validation contra samples reales
```

Ejemplo ml.mappers.test.ts:

```typescript
import { describe, it, expect } from 'vitest';
import { toMlQueueRow, toMlMetaRow, embedProperty } from '../ml';

describe('ml mappers', () => {
    it('toMlQueueRow maps nested property correctly', () => {
        const row = {
            id: 1,
            property_id: 'abc',
            operation: 'publish' as const,
            status: 'pending' as const,
            attempts: 0,
            max_attempts: 5,
            next_attempt_at: '2024-01-01T00:00:00Z',
            ml_item_id: null,
            last_error: null,
            created_at: '2024-01-01T00:00:00Z',
            property: { title: 'Casa', code: 123 },
        };
        const mapped = toMlQueueRow(row);
        expect(mapped.property_title).toBe('Casa');
        expect(mapped.property_code).toBe(123);
        expect(mapped.operation).toBe('publish');
    });

    it('embedProperty handles array and null', () => {
        expect(embedProperty(null)).toEqual({ title: null, code: null });
        expect(embedProperty([{ title: 'A', code: 1 }])).toEqual({ title: 'A', code: 1 });
        expect(embedProperty({ title: 'B', code: 2 })).toEqual({ title: 'B', code: 2 });
    });
});
```

Config Vitest: apps/admin/vitest.config.ts — environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'].

#### 2.6 Integration Tests — OAuth + Sync + Webhook

Archivo: apps/admin/src/test/ml.integration.test.ts

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('ML Integration (local supabase)', () => {
    let supabase: SupabaseClient;
    let testPropertyId: string;

    beforeAll(async () => {
        supabase = createClient(localUrl, localAnonKey);
        // Seed test property + ml_connection mock
    });

    it('OAuth flow: exchangeCode → encrypt → store → getAccessToken → refresh', async () => {
        // Mock ML token endpoint → verify crypto roundtrip
    });

    it('Sync queue: enqueue publish → ml-sync processes → meta updated', async () => {
        // Call ml-bulk-enqueue → call ml-sync → verify property_ml_meta
    });

    it('Webhook: questions topic → auto-reply template → answer sent', async () => {
        // POST ml-webhook with questions payload → verify ml_questions answered
    });
});
```

---

### FASE 3 — MEDIO (Nice to Have) — ~3 días

#### 3.1 Paginación Real + Filtros Avanzados en UI

En ml.api.ts: useMlQueue con page, pageSize reactivos + useInfiniteQuery.
En MercadoLibrePage.tsx: Infinite scroll, filtros por fecha, propiedad, error text search.

#### 3.2 Alertas (Sentry + Slack)

En ml-sync y ml-webhook: captureException con tags function, job_id, property_id.
Reglas Sentry: Alert si ml_sync_job_failed > 3 en 1h, ml_webhook_5xx > 5% en 5min.

#### 3.3 Token Revocation on Disconnect

En ml.ts:

```typescript
export async function revokeMlTokens(accessToken: string): Promise<void> {
    await fetchWithTimeout(`${ML_API}/oauth/revoke`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: accessToken }),
    });
}
```

En disconnectMl: Obtener token activo → revokeMlTokens → luego DELETE ml_connection.

#### 3.4 Multi-Connection Support (Preparación)

Migración: ml_connection agregar admin_user_id UUID REFERENCES admin_users(id) + unique constraint (provider, admin_user_id).
Cambio breaking: Requiere migración de datos + UI para seleccionar conexión.

---

## Estrategia de Testing Detallada

### Unit Tests (Vitest) — Target: 80% coverage

| Módulo        | Funciones a Testear                                                                                                                                                                     | Casos Críticos                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| ml.ts         | exchangeCode, refreshToken, getAccessToken, mlCreateItem, mlUpdateItem, mlCloseItem, mlUploadPictures, runMlApiCallWithRetry, categorizeMlError, fetchMlCategories, fetchMlListingTypes | Token refresh 5min buffer, rate limit retry, error categorization (429, 401, 400, 404, 500, network), idempotency keys |
| crypto.ts     | encrypt, decrypt                                                                                                                                                                        | Roundtrip encrypt→decrypt, IV único por llamada, key derivation determinística                                         |
| auto_reply.ts | getActiveTemplate, getMlAccessToken, sendQuestionAnswer, sendOrderMessage                                                                                                               | Template active/inactive, token null handling, idempotency, ML API error propagation                                   |
| ml.api.ts     | toMlQueueRow, toMlMetaRow, embedProperty, fetchMlSettings, buildAuthorizeUrl, upsertSetting                                                                                             | Null property, array property, settings parsing, URL encoding                                                          |
| ml.schemas.ts | Todos los Zod schemas                                                                                                                                                                   | Valid samples parse, invalid samples reject, optional fields                                                           |

### Integration Tests — Target: 50% coverage

| Flujo             | Setup                                                     | Verificación                                                           |
| ----------------- | --------------------------------------------------------- | ---------------------------------------------------------------------- |
| OAuth completo    | Mock ML /oauth/token + /users/me                          | Tokens cifrados en DB, getAccessToken descifra, refresh automático     |
| Sync publish      | Property en DB + images en Storage + ml_connection activa | ml-sync crea item en ML (mock), property_ml_meta upsert, queue=success |
| Sync update       | Property con ml_item_id en meta                           | ml-sync actualiza item, meta updated                                   |
| Sync delete       | Property con ml_item_id                                   | ml-sync cierra item, meta status=closed                                |
| Webhook questions | ml-webhook recibe question payload                        | ml_questions upsert, auto-reply si template activa                     |
| Webhook orders    | ml-webhook recibe order payload                           | ml_orders upsert, status derivado correcto, auto-reply por trigger     |

### E2E Tests (Playwright) — 3 Flujos Críticos

Archivo: apps/admin/e2e/ml-flows.spec.ts

```typescript
import { test, expect } from '@playwright/test';

test.describe('ML Critical Flows', () => {
    test('Connect → Publish Property → Verify on ML', async ({ page }) => {
        // 1. Login admin
        // 2. Go to /mercadolibre
        // 3. Enter ML App ID, click Connect
        // 4. Mock ML OAuth callback → return to page with connected=1
        // 5. Go to Properties, create new property with images
        // 6. Bulk enqueue publish
        // 7. Trigger ml-sync (or wait cron)
        // 8. Verify queue shows success, meta has ml_item_id + permalink
        // 9. Click permalink → verify ML item loads (mock)
    });

    test('Webhook Order → Auto-reply Sent', async ({ page }) => {
        // 1. Create auto-reply template for 'order_paid'
        // 2. POST ml-webhook with order status=paid
        // 3. Verify ml_orders updated, auto_reply_sent timestamp set
        // 4. Verify ML API /orders/{id}/messages called with template message
    });

    test('Dead Letter Queue → Manual Retry → Success', async ({ page }) => {
        // 1. Create property that will fail ML validation (price=0)
        // 2. Enqueue publish → ml-sync processes → moves to dead letter
        // 3. Go to ML page → Dead Letter tab
        // 4. Fix property (add price)
        // 5. Click "Retry" → verify moves back to queue → processes → success
    });
});
```

### Contract Tests — ML API Response Validation

Archivo: apps/admin/src/test/ml.contract.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { MlItemSchema, MlTokenResponseSchema, MlQuestionSchema } from '../lib/ml.schemas';

import itemSample from './fixtures/ml-responses/item.json';
import tokenSample from './fixtures/ml-responses/token.json';
import questionSample from './fixtures/ml-responses/question.json';

describe('ML API Contract Tests', () => {
    it('MlItemSchema validates real item response', () => {
        const result = MlItemSchema.safeParse(itemSample);
        expect(result.success).toBe(true);
    });

    it('MlTokenResponseSchema validates OAuth response', () => {
        expect(MlTokenResponseSchema.safeParse(tokenSample).success).toBe(true);
    });

    it('MlQuestionSchema validates webhook question', () => {
        expect(MlQuestionSchema.safeParse(questionSample).success).toBe(true);
    });
});
```

---

## Archivos a Crear / Modificar (Checklist)

### Nuevos Archivos

- [ ] supabase/migrations/0037_ml_dead_letter_queue.sql
- [ ] supabase/migrations/0038_ml_webhook_dedup.sql
- [ ] supabase/migrations/0039_ml_rate_limit_logs.sql (tabla para rate limiting)
- [ ] supabase/functions/_shared/ml.schemas.ts
- [ ] supabase/functions/_shared/rate-limit.ts
- [ ] supabase/functions/_shared/logger.ts
- [ ] apps/admin/src/lib/**tests**/ml.mappers.test.ts
- [ ] apps/admin/src/lib/**tests**/ml.settings.test.ts
- [ ] apps/admin/src/lib/**tests**/ml.queue.test.ts
- [ ] apps/admin/src/lib/**tests**/crypto.test.ts
- [ ] apps/admin/src/lib/**tests**/auto_reply.test.ts
- [ ] apps/admin/src/lib/**tests**/ml.schemas.test.ts
- [ ] apps/admin/src/test/ml.integration.test.ts
- [ ] apps/admin/src/test/ml.contract.test.ts
- [ ] apps/admin/e2e/ml-flows.spec.ts
- [ ] apps/admin/src/test/fixtures/ml-responses/*.json (samples reales)

### Archivos a Modificar

- [ ] supabase/functions/ml-oauth/index.ts — revocación tokens, validación adminUrl estricta
- [ ] supabase/functions/ml-sync/index.ts — dead letter, parallel images, configurable batch, structured logging
- [ ] supabase/functions/ml-webhook/index.ts — deduplicación, fallback secret missing, rate limit
- [ ] supabase/functions/ml-answer-question/index.ts — rate limit
- [ ] supabase/functions/ml-bulk-enqueue/index.ts — rate limit
- [ ] supabase/functions/ml-categories/index.ts — rate limit
- [ ] supabase/functions/ml-listing-types/index.ts — rate limit
- [ ] supabase/functions/ml-metrics/index.ts — cache 5min, structured logging, rate limit
- [ ] supabase/functions/_shared/ml.ts — eliminar as unknown as, usar Zod schemas, deduplicar categorizeMlError
- [ ] supabase/functions/_shared/crypto.ts — sin cambios (ya limpio)
- [ ] supabase/functions/_shared/auto_reply.ts — usar Zod schemas, structured logging
- [ ] apps/admin/src/lib/ml.ts — callRpc sin casts, disconnectMl llama revocación
- [ ] apps/admin/src/lib/ml.api.ts — useMlDeadLetter, useRetryDeadLetter, infinite query queue
- [ ] apps/admin/src/pages/MercadoLibrePage.tsx — Dead Letter tab, pagination infinita, filtros avanzados
- [ ] apps/admin/vitest.config.ts — configuración test environment
- [ ] apps/admin/src/test/setup.ts — mocks Supabase, MSW handlers
- [ ] package.json — scripts test:ml, test:ml:integration, test:ml:e2e

---

## Comandos de Validación (CI/CD)

```bash
# TypeCheck estricto (debe pasar sin errores)
pnpm typecheck

# Unit tests (cobertura ≥ 80% en archivos ML)
pnpm test -- --coverage

# Integration tests (requiere supabase local running)
pnpm dlx supabase start
pnpm test:ml:integration

# E2E tests (requiere build + preview server)
pnpm build
pnpm test:e2e -- --project=chromium --grep="ML Critical"

# Lint solo archivos ML (diff-scoped)
pnpm lint -- --files "supabase/functions/**/ml-*/**/*.ts" "apps/admin/src/lib/ml*.ts" "apps/admin/src/pages/MercadoLibrePage.tsx"
```

---

## Métricas de Éxito (KPIs)

| KPI                          | Baseline Actual | Target 100%             | Medición                       |
| ---------------------------- | --------------- | ----------------------- | ------------------------------ |
| Sync job latency (p95)       | ~5s             | <1s                     | Structured logs duration_ms    |
| Webhook latency (p95)        | ~500ms          | <100ms                  | Structured logs duration_ms    |
| Metrics fetch time           | ~8s             | <2s                     | Browser DevTools / Sentry      |
| Queue processing rate        | 10 jobs/cron    | 30 jobs/cron (paralelo) | ml_sync_history count          |
| Dead letter recovery rate    | N/A             | >90%                    | Dead letter resolved / total   |
| TypeScript errors (ML files) | ~15             | 0                       | pnpm typecheck                 |
| Test coverage (ML modules)   | 0%              | ≥80%                    | Vitest coverage report         |
| E2E pass rate                | N/A             | 100% (3 flujos)         | Playwright report              |
| Security findings (ML)       | 3 medium        | 0                       | Sentry/Dependabot/Manual audit |

---

## Cronograma Sugerido (2 semanas / 1 ingeniero)

| Semana | Días | Entregables                                                      |
| ------ | ---- | ---------------------------------------------------------------- |
| 1      | 1-2  | Dead Letter Queue (DB + Edge Function + UI básico)               |
| 1      | 3-4  | Zod Schemas + Type Safety cleanup (eliminar todos as unknown as) |
| 1      | 5    | Rate Limiting en todas edge functions ML + Webhook deduplication |
| 2      | 1-2  | Parallel image upload + Configurable batch + Metrics cache       |
| 2      | 3    | Structured logging + Unit tests (80% coverage)                   |
| 2      | 4    | Integration tests + E2E 3 flujos críticos                        |
| 2      | 5    | Paginación UI + Alertas + Token revocation + Documentación       |

---

## Riesgos y Mitigaciones

| Riesgo                                      | Probabilidad | Impacto | Mitigación                                                         |
| ------------------------------------------- | ------------ | ------- | ------------------------------------------------------------------ |
| ML API changes rompen schemas               | Media        | Alto    | Contract tests con samples reales + CI semanal contra ML sandbox   |
| Rate limiting propio bloquea sync legítimo  | Baja         | Medio   | Configurable via env, logs claros, alerta en 429 propio            |
| Dead letter queue crece sin control         | Media        | Medio   | UI visible, alerta si >50 items, job cron limpieza >30 días        |
| Tests flaky por Supabase local              | Alta         | Medio   | test.use({ retries: 2 }), seed determinístico, cleanup entre tests |
| Parallel image upload excede ML rate limits | Media        | Medio   | p-limit concurrency 3, backoff exponencial en 429                  |

---

## Definition of Done (Por Fase)

### Fase 1 Done When:

- [ ] Dead letter queue creada, migración aplicada, edge function mueve jobs fallidos
- [ ] UI muestra pestaña Dead Letter con retry/delete
- [ ] Cero as unknown as / any en ml.ts, ml-sync, ml-webhook, ml-metrics, auto_reply.ts
- [ ] Zod schemas validan todas las respuestas ML en runtime
- [ ] Rate limiting activo en 8 edge functions ML
- [ ] Webhook deduplicación evita doble procesamiento

### Fase 2 Done When:

- [ ] Imágenes suben en paralelo (Promise.allSettled)
- [ ] Batch size y concurrencia configurables por env
- [ ] Métricas cacheadas 5min, dashboard carga <2s
- [ ] Structured JSON logs en todas edge functions ML
- [ ] Unit tests pasan con ≥80% coverage en módulos ML
- [ ] Integration tests pasan contra Supabase local

### Fase 3 Done When:

- [ ] E2E 3 flujos críticos pasan en CI
- [ ] Paginación infinita + filtros en UI
- [ ] Alertas configuradas en Sentry
- [ ] Token revocation en disconnect
- [ ] Documentación actualizada (README ML, ADR si aplica)
- [ ] Code review aprobado + merge a main

---

## Referencias y Recursos

- ML API Docs: https://developers.mercadolibre.com.ar/
- Supabase Edge Functions: https://supabase.com/docs/guides/functions
- Zod: https://zod.dev/
- Vitest: https://vitest.dev/
- Playwright: https://playwright.dev/
- AGENTS.md — Sección Known Weak Points y Critical Modules > ML Integration

---

**Documento vivo** — Actualizar conforme se completan tareas. Cada fase debe tener PR separado con tests pasando antes de merge.
