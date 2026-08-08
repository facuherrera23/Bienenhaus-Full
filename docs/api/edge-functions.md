# API Reference — Edge Functions (Supabase)

Base URL: `https://<project-ref>.supabase.co/functions/v1/`

Autenticación: `Authorization: Bearer <access_token>` (JWT de Supabase Auth)
Rate Limit: 100 req/min por IP (configurable en `config.toml`)

---

## admin-user-invite

Gestión de usuarios administradores (invitar, reset password, eliminar).

### POST `/functions/v1/admin-user-invite`

Headers:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

#### Invite User

```json
{
    "action": "invite",
    "email": "nuevo@admin.com",
    "full_name": "Juan Pérez",
    "role": "staff"
}
```

**Response 200:**

```json
{
    "ok": true,
    "link": "https://bienenhaus.com.ar/admin/#/recovery?code=...",
    "user_id": "uuid"
}
```

#### Reset Password

```json
{
    "action": "reset",
    "email": "admin@bienenhaus.com"
}
```

**Response 200:**

```json
{
    "ok": true,
    "link": "https://bienenhaus.com.ar/admin/#/recovery?code=..."
}
```

#### Remove User

```json
{
    "action": "remove",
    "email": "old@admin.com"
}
```

**Response 200:**

```json
{
    "ok": true
}
```

**Error Codes:**

- `400` — JSON inválido, email inválido, rol inválido
- `401` — No autorizado (requiere rol admin)
- `404` — Usuario no encontrado
- `409` — Email ya existe
- `500` — Error interno

---

## ml-oauth

Callback de OAuth Mercado Libre. **No llamar directamente** — es callback de ML.

### GET `/functions/v1/ml-oauth?code=...&state=...`

Callback de ML tras autorización. Intercambia `code` por tokens, cifra y guarda en `ml_connection`.

**Redirect:** `/admin/#/mercadolibre?connected=true`

---

## ml-sync

Procesa la cola de sincronización con Mercado Libre.

### POST `/functions/v1/ml-sync`

Headers:

```
Authorization: Bearer <access_token>  (admin)
x-sync-secret: <ML_SYNC_SECRET>       (opcional, para cron externo)
Content-Type: application/json
```

**Body (opcional):**

```json
{
    "limit": 50
}
```

**Response 200:**

```json
{
  "processed": 3,
  "succeeded": 2,
  "failed": 1,
  "details": [
    { "property_id": "uuid", "operation": "publish", "status: "completed" },
    { "property_id": "uuid", "operation": "update", "status: "completed" },
    { "property_id": "uuid", "operation": "delete", "status: "failed", "error": "ML rate limit" }
  ]
}
```

**Cron:** Se ejecuta cada 5 min via `pg_cron` (ver migración `0035_ml_sync_cron.sql`)

---

## ml-webhook

Webhook de Mercado Libre (preguntas, órdenes). **No llamar directamente** — es endpoint público de ML.

### POST `/functions/v1/ml-webhook`

Headers:

```
Content-Type: application/json
X-Signature: <HMAC-SHA256>  (verificado con ML_WEBHOOK_SECRET)
```

**Body (pregunta):**

```json
{
    "topic": "questions",
    "resource": "/questions/123456789",
    "user_id": 123456789,
    "application_id": 12345
}
```

**Body (orden):**

```json
{
    "topic": "orders",
    "resource": "/orders/987654321",
    "user_id": 123456789
}
```

**Response 200:** `{ "ok": true }`

**Verificación HMAC:**

```typescript
const expected = crypto
    .createHmac('sha256', ML_WEBHOOK_SECRET)
    .update(JSON.stringify(body))
    .digest('hex');
```

---

## ml-answer-question

Auto-respuesta a preguntas de compradores en ML.

### POST `/functions/v1/ml-answer-question`

Headers:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**

```json
{
    "question_id": "123456789",
    "answer": "La propiedad tiene 3 dormitorios y 2 baños. ¿Quiere agendar una visita?"
}
```

**Response 200:**

```json
{ "ok": true, "question_id": "123456789" }
```

**Lógica:** Busca template por palabras clave, si no hay template usa respuesta genérica.

---

## ml-bulk-enqueue

Encola múltiples propiedades para sincronización masiva.

### POST `/functions/v1/ml-bulk-enqueue`

Headers:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**

```json
{
    "property_ids": ["uuid1", "uuid2", "uuid3"],
    "operation": "publish" // "publish" | "update" | "delete"
}
```

**Response 200:**

```json
{
  "enqueued": 3,
  "skipped": 0,
  "results": [
    { "property_id": "uuid1", "status: "enqueued" },
    { "property_id": "uuid2", "status: "enqueued" },
    { "property_id": "uuid3", "status: "skipped", "reason": "ya en cola" }
  ]
}
```

---

## ml-categories

Sincroniza categorías de Mercado Libre.

### GET `/functions/v1/ml-categories`

Headers:

```
Authorization: Bearer <access_token>
```

**Response 200:**

```json
[
  { "id": "MLA1234", "name": "Inmuebles", "path_from_root": [...] },
  { "id": "MLA5678", "name": "Casas", "path_from_root": [...] }
]
```

---

## ml-listing-types

Sincroniza tipos de publicación de Mercado Libre.

### GET `/functions/v1/ml-listing-types`

Headers:

```
Authorization: Bearer <access_token>
```

**Response 200:**

```json
[
    { "id": "gold_pro", "name": "Oro Premium", "exposure": "highest" },
    { "id": "gold_premium", "name": "Oro Premium", "exposure": "high" },
    { "id": "gold_special", "name": "Oro Especial", "exposure": "medium" },
    { "id": "free", "name": "Gratuita", "exposure": "low" }
]
```

---

## ml-metrics

Métricas de publicaciones en Mercado Libre.

### GET `/functions/v1/ml-metrics`

Headers:

```
Authorization: Bearer <access_token>
```

Query Params:

- `property_id` (opcional) — filtrar por propiedad
- `days` (default: 30) — ventana de tiempo

**Response 200:**

```json
{
    "total_published": 45,
    "total_views": 12340,
    "total_contacts": 234,
    "by_property": [{ "property_id": "uuid", "views": 450, "contacts": 12, "status": "active" }]
}
```

---

## qr-checkin

Check-in de visitas por QR.

### POST `/functions/v1/qr-checkin`

Headers:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**

```json
{ "visit_id": "uuid" }
```

**Response 200:**

```json
{ "code": "VIS-abc123DEF-1a2b3c", "qrUrl": "https://api.qrserver.com/...", "checkinId": 123 }
```

### GET `/functions/v1/qr-checkin?code=VIS-abc123DEF-1a2b3c`

Headers:

```
Authorization: Bearer <access_token>  (agente)
```

**Response 200:**

```json
{ "success": true, "visit": {...}, "message": "Check-in registrado correctamente" }
```

---

## visits-process-reminders

Procesa recordatorios de visitas (cron).

### POST `/functions/v1/visits-process-reminders`

**Response 200:**

```json
{ "sent": 3, "failed": 0 }
```

---

## contact-submit

Formulario de contacto de la landing pública.

### POST `/functions/v1/contact-submit`

Headers:

```
Content-Type: application/json
```

**Body:**

```json
{
    "name": "Juan Pérez",
    "email": "juan@email.com",
    "phone": "+54 9 11 1234-5678",
    "message": "Me interesa la propiedad...",
    "p_hp": "" // honeypot (debe venir vacío)
}
```

**Response 200:**

```json
{ "ok": true }
```

**Rate Limit:** 30 consultas/hora + 1 por email cada 24h (honeypot + window)

---

## audit-log

Registro de acciones de staff.

### POST `/functions/v1/audit-log`

Headers:

```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Body:**

```json
{
    "action": "create",
    "entity_type": "property",
    "entity_id": "uuid",
    "entity_title": "Casa en Palermo",
    "old_values": null,
    "new_values": { "title": "Casa en Palermo", "price": 150000 },
    "changed_fields": ["title", "price"],
    "metadata": { "source": "admin" },
    "status": "success"
}
```

### GET `/functions/v1/audit-log`

Query Params:

- `page` (default: 1)
- `pageSize` (default: 50, max: 200)
- `actor_id`, `entity_type`, `entity_id`, `action`, `status`, `from_date`, `to_date`, `search`

**Response 200:**

```json
{
  "data": [...],
  "page": 1,
  "pageSize": 50,
  "total": 123,
  "totalPages": 3
}
```

---

## Common Error Responses

| Code | Meaning                                       |
| ---- | --------------------------------------------- |
| 400  | Bad Request (JSON inválido, campos faltantes) |
| 401  | Unauthorized (token inválido/expirado)        |
| 403  | Forbidden (rol insuficiente)                  |
| 404  | Not Found                                     |
| 409  | Conflict (duplicado)                          |
| 429  | Too Many Requests (rate limit)                |
| 500  | Internal Server Error                         |
| 502  | Bad Gateway (ML API error)                    |
| 503  | Service Unavailable (Supabase down)           |

---

## Rate Limits

| Endpoint                     | Limit                  |
| ---------------------------- | ---------------------- |
| Auth (signin, signup, reset) | 100 req/5min per IP    |
| Admin API                    | 100 req/min per user   |
| ML Sync/ML Webhooks          | Respetados via backoff |
| Contact Form                 | 30/hora + 1/email/24h  |

---

## Webhooks ML — Eventos Soportados

| Topic       | Resource          | Descripción                 |
| ----------- | ----------------- | --------------------------- |
| `questions` | `/questions/{id}` | Nueva pregunta de comprador |
| `orders`    | `/orders/{id}`    | Nueva orden de compra       |
| `payments`  | `/payments/{id}`  | Pago aprobado/rechazado     |
| `shipments` | `/shipments/{id}` | Envío actualizado           |

---

## Versioning

- **v1** — Actual (estable)
- Cambios breaking → nueva versión `/functions/v2/...`
- Deprecación: 6 meses de aviso en changelog
