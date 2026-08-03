# Webhook de MercadoLibre

La función `ml-webhook` recibe las notificaciones de la cuenta ML conectada
y las persiste en `ml_webhook_events` (`ml_questions`, `ml_orders`,
`ml_payments`, `ml_shipments`), además de responder automáticamente preguntas
y mensajes de órdenes según las plantillas de `ml_auto_reply_templates`.

## URL

```
https://rnldqiwwzhjnurkguihu.supabase.co/functions/v1/ml-webhook
```

## Registro de tópicos

Para cada tópico que quieras recibir, registrá el webhook con el token de la
cuenta ML (para obtener el `user_id`: `GET /users/me`):

```
POST https://api.mercadolibre.com/users/{USER_ID}/topics/{topic}
Content-Type: application/json
Authorization: Bearer {ACCESS_TOKEN}

{ "callback_url": "https://rnldqiwwzhjnurkguihu.supabase.co/functions/v1/ml-webhook", "auth_token": "{TU_TOKEN}" }
```

Tópicos usados por la integración:

| Topic       | Qué genera                                  | Handler            |
|-------------|---------------------------------------------|--------------------|
| `questions` | Preguntas de compradores sobre publicaciones | `handleQuestions` |
| `orders`    | Cambios de estado de órdenes (nueva, pagada, enviada, entregada) | `handleOrders` |
| `items`     | Cambios en publicaciones (re-sync del item)  | `handleItems`      |
| `payments`  | Pagos                                          | `handlePayments`   |
| `shipments` | Envíos                                         | `handleShipments`  |

Listar registrados: `GET /users/{USER_ID}/topics/{topic}`.
Baja: `DELETE /users/{USER_ID}/topics/{topic}`.

## Firma de las notificaciones

ML devuelve en cada notificación el `auth_token` registrado en el header
`x-meli-signature` (es un token fijo por tópico, **no** una firma HMAC del body).

Para proteger el webhook:

1. Generá un token fuerte (ej. `openssl rand -hex 32`).
2. Setealo como secret de la función: `supabase secrets set ML_WEBHOOK_SECRET=<token>`.
3. Usá el **mismo valor** como `auth_token` al registrar cada tópico
   (ver "Registro de tópicos" arriba).

`verifySignature` compara `x-meli-signature` contra `ML_WEBHOOK_SECRET` con
comparación en tiempo constante (timing-safe). Si el secret **no** está seteado,
la función acepta las notificaciones en modo degradado (con warning en logs)
para no romper suscripciones existentes, pero esto deja el webhook abierto:
setear el secret es requisito para producción.

Si tus tópicos ya están registrados con un `auth_token` distinto, debés
re-registrarlos (DELETE + POST) con el token que elijas como `ML_WEBHOOK_SECRET`.

## Auto-respuestas

- Preguntas (`new_question`): responde vía `POST /answers` de ML y marca la
  pregunta como `answered`.
- Órdenes (`new_order`, `order_paid`, `order_shipped`, `order_delivered`):
  consulta la orden en ML, deriva el estado (`confirmed/paid/shipped/delivered`),
  persiste en `ml_orders` y envía el mensaje al comprador vía
  `POST /orders/{order_id}/messages`. Solo se envía cuando el estado cambia
  (se evitan duplicados). El envío queda registrado en `ml_orders.auto_reply_sent`.

Para que las auto-respuestas funcionen, la app de ML debe tener los scopes
`offline_access`, `read`, `write` (mensajes de órdenes y respuestas a preguntas).
