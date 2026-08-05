import { createClient } from 'npm:@supabase/supabase-js@2';
import { getActiveTemplate, getMlAccessToken, sendOrderMessage, sendQuestionAnswer } from '../_shared/auto_reply.ts';
import { ML_API } from '../_shared/ml.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
const ML_WEBHOOK_SECRET = Deno.env.get('ML_WEBHOOK_SECRET') ?? '';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-meli-signature',
  'access-control-allow-methods': 'POST, OPTIONS',
};

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

function timingSafeEqual(a: string, b: string): boolean {
  const ba = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  if (ba.length !== bb.length) return false;
  let diff = 0;
  for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
  return diff === 0;
}

/**
 * ML envía en x-meli-signature el auth_token fijo registrado al suscribir el tópico
 * (no firma el body). ML_WEBHOOK_SECRET debe ser ese mismo auth_token. Sin secret
 * seteado se acepta en modo degradado para no romper notificaciones existentes.
 */
async function verifySignature(req: Request): Promise<boolean> {
  if (!ML_WEBHOOK_SECRET) {
    console.warn('ML_WEBHOOK_SECRET no está seteado: webhook sin verificación de firma.');
    return true;
  }
  const signature = req.headers.get('x-meli-signature');
  if (!signature) return false;
  return timingSafeEqual(signature, ML_WEBHOOK_SECRET);
}

interface WebhookPayload {
  user_id: number;
  resource: string;
  topic: 'questions' | 'orders' | 'items' | 'payments' | 'shipments';
  application_id: number;
  attempts: number;
  sent: string;
  received: string;
}

async function logWebhookEvent(
  payload: WebhookPayload,
  status: 'received' | 'processed' | 'failed',
  error?: string
): Promise<void> {
  await supabase.from('ml_webhook_events').insert({
    user_id: payload.user_id,
    resource: payload.resource,
    topic: payload.topic,
    application_id: payload.application_id,
    attempts: payload.attempts,
    sent_at: payload.sent,
    received_at: payload.received,
    status,
    error: error ?? null,
    payload: JSON.stringify(payload),
  });
}

async function handleQuestions(payload: WebhookPayload): Promise<void> {
  // Resource format: /questions/{question_id}
  const questionId = payload.resource.split('/').pop();
  if (!questionId) return;

  // 1) Si hay una plantilla de auto-respuesta activa, respondemos automáticamente
  const template = await getActiveTemplate(supabase, 'new_question');

  if (template) {
    let token: string | null = null;
    try {
      token = await getMlAccessToken(supabase);
    } catch (err) {
      console.warn('Auto-reply: no se pudo obtener token ML:', (err as Error).message);
    }

    if (token) {
      // Consultamos la pregunta en ML para conocer el item y el texto
      const res = await fetch(`${ML_API}/questions/${questionId}?api_version=4`, {
        headers: { authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const q = await res.json();
        const itemId: unknown = q?.item_id;
        let propertyId: string | null = null;
        let mlItemId: number | null = typeof itemId === 'number' ? itemId : null;

        if (itemId != null) {
          const { data: meta } = await supabase
            .from('property_ml_meta')
            .select('property_id, ml_item_id')
            .eq('ml_item_id', Number(itemId))
            .maybeSingle();
          if (meta) {
            propertyId = meta.property_id;
            mlItemId = meta.ml_item_id;
          }
        }

        await supabase.from('ml_questions').upsert(
          {
            question_id: questionId,
            property_id: propertyId,
            ml_item_id: mlItemId ?? 0,
            question_text: typeof q?.text === 'string' ? q.text : null,
            from_user_id: typeof q?.from?.user_id === 'number' ? q.from.user_id : null,
            from_user_nickname: typeof q?.from?.nickname === 'string' ? q.from.nickname : null,
            date_created: typeof q?.date_created === 'string' ? q.date_created : null,
            status: 'answered',
            answer_text: template.message,
            date_updated: new Date().toISOString(),
          },
          { onConflict: 'question_id' },
        );

        try {
          await sendQuestionAnswer(supabase, questionId, template.message, token);
        } catch (err) {
          // Si ML rechaza la respuesta, dejamos la pregunta sin responder para retomarla manualmente
          await supabase
            .from('ml_questions')
            .update({ status: 'unanswered', answer_text: null })
            .eq('question_id', questionId);
          console.warn('Auto-reply falló:', (err as Error).message);
        }
        return;
      }
    }
  }

  // 2) Sin plantilla activa (o sin token): comportamiento original, solo registrar
  const { data: item } = await supabase
    .from('property_ml_meta')
    .select('property_id, ml_item_id')
    .eq('ml_item_id', questionId)
    .maybeSingle();

  if (item) {
    await supabase.from('ml_questions').upsert({
      question_id: questionId,
      property_id: item.property_id,
      ml_item_id: item.ml_item_id,
      status: 'unanswered',
      received_at: new Date().toISOString(),
    });
  }
}

const ORDER_STATUS_TRIGGER: Record<string, string> = {
  confirmed: 'new_order',
  paid: 'order_paid',
  shipped: 'order_shipped',
  delivered: 'order_delivered',
};

/** Deriva el estado interno (ml_orders.status) desde la orden de ML. */
function deriveOrderStatus(order: any): string {
  if (!order || order.status === 'cancelled') return 'cancelled';
  if (order.status === 'payment_required') return 'new';

  const shippingStatus = order.shipping?.status;
  if (shippingStatus === 'delivered') return 'delivered';
  if (shippingStatus === 'shipped' || shippingStatus === 'sent') return 'shipped';

  const approved = (order.payments ?? []).some((p: any) => p?.status === 'approved');
  if (approved) return 'paid';

  if (order.status === 'confirmed') return 'confirmed';
  return 'new';
}

async function handleOrders(payload: WebhookPayload): Promise<void> {
  // Resource format: /orders/{order_id}
  const orderId = payload.resource.split('/').pop();
  if (!orderId) return;

  let token: string | null = null;
  try {
    token = await getMlAccessToken(supabase);
  } catch (err) {
    console.warn('orders: no se pudo obtener token ML:', (err as Error).message);
  }

  // Consultamos la orden en ML para conocer item, comprador y estado
  let order: any = null;
  if (token) {
    const res = await fetch(`${ML_API}/orders/${orderId}`, {
      headers: { authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      try {
        order = await res.json();
      } catch {
        order = null;
      }
    } else {
      console.warn(`orders: GET /orders/${orderId} -> ${res.status}`);
    }
  }

  const status = deriveOrderStatus(order);

  const itemId: unknown = order?.order_items?.[0]?.item?.id;
  let propertyId: string | null = null;
  let mlItemId: number | null = typeof itemId === 'number' ? itemId : null;
  if (itemId != null) {
    const { data: meta } = await supabase
      .from('property_ml_meta')
      .select('property_id, ml_item_id')
      .eq('ml_item_id', Number(itemId))
      .maybeSingle();
    if (meta) {
      propertyId = meta.property_id;
      mlItemId = meta.ml_item_id;
    }
  }

  const { data: existing } = await supabase
    .from('ml_orders')
    .select('status')
    .eq('order_id', orderId)
    .maybeSingle();
  const prevStatus = existing?.status ?? null;

  const orderPayload: Record<string, unknown> = {
    order_id: orderId,
    ml_item_id: mlItemId ?? 0,
    status,
    received_at: new Date().toISOString(),
  };
  if (propertyId) orderPayload.property_id = propertyId;
  if (order) {
    if (typeof order.buyer?.id === 'number') orderPayload.buyer_id = order.buyer.id;
    if (typeof order.buyer?.nickname === 'string') orderPayload.buyer_nickname = order.buyer.nickname;
    if (typeof order.total_amount === 'number') orderPayload.total_amount = order.total_amount;
    if (typeof order.currency_id === 'string') orderPayload.currency = order.currency_id;
    if (typeof order.date_created === 'string') orderPayload.date_created = order.date_created;
    if (typeof order.date_closed === 'string') orderPayload.date_closed = order.date_closed;
  }

  await supabase.from('ml_orders').upsert(orderPayload, { onConflict: 'order_id' });

  // Auto-respuesta: solo cuando el estado cambia (o es la primera vez)
  const trigger = ORDER_STATUS_TRIGGER[status];
  if (trigger && token && prevStatus !== status) {
    const template = await getActiveTemplate(supabase, trigger);
    if (template) {
      try {
        await sendOrderMessage(supabase, orderId, template.message, token);
        console.info(`Auto-reply orden ${orderId} (${trigger}): enviado`);
      } catch (err) {
        console.warn(`Auto-reply orden ${orderId} (${trigger}) falló:`, (err as Error).message);
      }
    }
  }
}

async function handleItems(payload: WebhookPayload): Promise<void> {
  // Resource format: /items/{item_id}
  const itemId = payload.resource.split('/').pop();
  if (!itemId) return;

  const { data: meta } = await supabase
    .from('property_ml_meta')
    .select('property_id, ml_item_id')
    .eq('ml_item_id', Number(itemId))
    .maybeSingle();

  if (meta) {
    // Trigger a sync for this property to update status
    await supabase.rpc('ml_enqueue', {
      p_property_id: meta.property_id,
      p_operation: 'update',
      p_internal: true,
    });
  }
}

async function handlePayments(payload: WebhookPayload): Promise<void> {
  // Resource format: /payments/{payment_id}
  const paymentId = payload.resource.split('/').pop();
  if (!paymentId) return;

  // Could link to order if needed
  await supabase.from('ml_payments').upsert({
    payment_id: paymentId,
    status: 'pending',
    received_at: new Date().toISOString(),
    payload: JSON.stringify(payload),
  });
}

async function handleShipments(payload: WebhookPayload): Promise<void> {
  // Resource format: /shipments/{shipment_id}
  const shipmentId = payload.resource.split('/').pop();
  if (!shipmentId) return;

  await supabase.from('ml_shipments').upsert({
    shipment_id: shipmentId,
    status: 'pending',
    received_at: new Date().toISOString(),
    payload: JSON.stringify(payload),
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return respond(405, { error: 'Method not allowed' });

  const verified = await verifySignature(req);
  if (!verified) return respond(401, { error: 'Invalid signature' });

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return respond(400, { error: 'Invalid JSON' });
  }

  await logWebhookEvent(payload, 'received');

  try {
    switch (payload.topic) {
      case 'questions':
        await handleQuestions(payload);
        break;
      case 'orders':
        await handleOrders(payload);
        break;
      case 'items':
        await handleItems(payload);
        break;
      case 'payments':
        await handlePayments(payload);
        break;
      case 'shipments':
        await handleShipments(payload);
        break;
      default:
        console.warn(`Unhandled webhook topic: ${payload.topic}`);
    }
    await logWebhookEvent(payload, 'processed');
    return respond(200, { ok: true });
  } catch (err) {
    await logWebhookEvent(payload, 'failed', (err as Error).message);
    return respond(500, { error: (err as Error).message });
  }
});