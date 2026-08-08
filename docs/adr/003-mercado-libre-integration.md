# ADR 003: Integración Mercado Libre — OAuth + Sync Queue + Webhooks

## Status

Accepted

## Context

Bienenhaus publica propiedades en Mercado Libre (ML) para mayor exposición. La integración requiere:

- OAuth 2.0 para autorizar la cuenta ML del usuario
- Publicar/actualizar/eliminar propiedades en ML desde el admin
- Sincronización automática de estados (publicada, pausada, vendida)
- Auto-respuesta a preguntas de compradores
- Webhooks para notificaciones en tiempo real (preguntas, órdenes)
- Tokens ML cifrados (AES-256-GCM) en DB

## Decision

### Arquitectura de Integración

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Admin     │────▶│  ML OAuth   │────▶│  ML API     │
│   (Admin)   │     │  (Edge Fn)  │     │  (REST)     │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────┐
│              Supabase DB                        │
│  ml_connection (tokens cifrados)                │
│  ml_sync_queue (cola de operaciones)            │
│  property_ml_meta (estado por propiedad)        │
└─────────────────────────────────────────────────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────────────────────────────────────────┐
│           Edge Functions (Deno 2)               │
│  ml-oauth      │ ml-sync      │ ml-webhook       │
│  ml-categories │ ml-metrics   │ ml-answer-question│
└─────────────────────────────────────────────────┘
```

### Flujo OAuth (`ml-oauth` edge function)

1. Admin hace clic "Conectar Mercado Libre" → redirect a ML OAuth
2. ML callback a `/functions/v1/ml-oauth?code=...&state=...`
3. Edge function intercambia code por `access_token` + `refresh_token`
4. Tokens cifrados con AES-256-GCM (`crypto.ts`) → guardados en `ml_connection`
5. Redirect de vuelta a admin con success

### Sincronización (`ml-sync` + `ml-sync-queue`)

```sql
CREATE TABLE ml_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id),
  operation text CHECK (operation IN ('publish', 'update', 'delete')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payload jsonb,
  attempts int DEFAULT 0,
  last_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

- Admin encola operaciones via `ml-bulk-enqueue` (manual) o triggers automáticos
- `ml-sync` (cron cada 5 min) procesa cola: publica/actualiza/elimina en ML
- Reintentos exponenciales (max 3) con backoff
- `property_ml_meta` guarda `ml_item_id`, `status`, `permalink`, `last_synced_at`

### Webhooks (`ml-webhook` + `ml-answer-question`)

- ML envía notificaciones a `/functions/v1/ml-webhook`
- Tipos: `questions` (preguntas), `orders` (órdenes de compra)
- `ml-answer-question`: auto-responde preguntas usando templates configurables
- Verificación HMAC con `ML_WEBHOOK_SECRET`

### Cifrado Tokens (`crypto.ts` — AES-256-GCM)

```typescript
// CRYPTO_SECRET (32 bytes) en env vars
export async function encrypt(plaintext: string): Promise<string>;
export async function decrypt(ciphertext: string): Promise<string>;
// Formato: iv (12 bytes) + ciphertext + authTag (16 bytes) → base64
```

### Configuración Defaults (`ml-categories`, `ml-listing-types`)

- Sync automático de categorías y listing types de ML al iniciar
- Admin configura defaults por propiedad: `category_id`, `listing_type_id`, `condition`

## Consequences

### Positivos

- Separación clara: OAuth ↔ Sync ↔ Webhooks (edge functions independientes)
- Tokens cifrados → incluso con acceso a DB, tokens ML no legibles
- Cola de sincronización → resiliente a fallos ML, reintentos automáticos
- Webhooks → tiempo real sin polling
- Defaults configurables → admin no hardcodea IDs de ML

### Negativos

- Complejidad alta: 6 edge functions + cola + webhooks + cifrado
- ML API rate limits estrictos (requiere backoff inteligente)
- Tokens expiran (6 hrs access, 30 días refresh) → refresh automático crítico
- ML cambia API sin aviso previo (versionado manual necesario)

### Riesgos

- Token refresh falla → sync se detiene (alerting necesario)
- ML API breaking changes sin aviso (monitoreo logs crítico)
- Webhook HMAC verification failure → data loss silenciosa
- Rate limits ML → sync queue se acumula (alerting + backpressure)

## Alternatives Considered

| Opción                         | Por qué no                                      |
| ------------------------------ | ----------------------------------------------- |
| ML SDK oficial (Node)          | No existe para Deno/Edge, requiere Node runtime |
| Polling en vez de webhooks     | Latencia alta, mayor carga API ML               |
| Tokens en plaintext            | Riesgo seguridad inaceptable                    |
| Sync síncrono en request admin | Bloquea UI, timeouts frecuentes                 |

## References

- [ML API Docs](https://developers.mercadolibre.com.ar/)
- [ML OAuth Guide](https://developers.mercadolibre.com.ar/es_ar/autenticacion-y-autorizacion)
- [ML Webhooks](https://developers.mercadolibre.com.ar/es_ar/notificaciones)
- [AES-GCM Web Crypto](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/encrypt)
