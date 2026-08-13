import { createClient } from 'npm:@supabase/supabase-js@2';
import {
    getActiveTemplate,
    getMlAccessToken,
    sendOrderMessage,
    sendQuestionAnswer,
} from '../_shared/auto_reply.ts';
import { ML_API } from '../_shared/ml.ts';
import { jsonResponse, optionsResponse } from '../_shared/http.ts';
import { checkRateLimit } from '../_shared/rate-limit.ts';
import {
    MlQuestionSchema,
    MlOrderSchema,
    MlWebhookPayloadSchema,
    parseMlResponse,
} from '../_shared/ml.schemas.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';
const ML_WEBHOOK_SECRET = Deno.env.get('ML_WEBHOOK_SECRET') ?? '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

const RATE_LIMIT_FN = 'ml-webhook';

function timingSafeEqual(a: string, b: string): boolean {
    const ba = new TextEncoder().encode(a);
    const bb = new TextEncoder().encode(b);
    if (ba.length !== bb.length) return false;
    let diff = 0;
    for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
    return diff === 0;
}

interface LogEntry {
    timestamp: string;
    level: 'debug' | 'info' | 'warn' | 'error';
    function: string;
    topic?: string;
    resource?: string;
    user_id?: number;
    status?:
        | 'received'
        | 'processed'
        | 'failed'
        | 'deduplicated'
        | 'auto_reply_sent'
        | 'unhandled'
        | number;
    duration_ms?: number;
    error?: string;
    question_id?: string;
    order_id?: string;
    trigger?: string;
    attempts?: number;
}

function log(entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'info', ...entry }));
}
function logWarn(entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'warn', ...entry }));
}
function logError(entry: Omit<LogEntry, 'timestamp' | 'level'>): void {
    console.log(JSON.stringify({ timestamp: new Date().toISOString(), level: 'error', ...entry }));
}

async function verifySignature(req: Request): Promise<boolean> {
    if (!ML_WEBHOOK_SECRET) return false;
    const signature = req.headers.get('x-meli-signature');
    if (!signature) return false;
    return timingSafeEqual(signature, ML_WEBHOOK_SECRET);
}

async function logWebhookEvent(
    payload: MlWebhookPayload,
    status: 'received' | 'processed' | 'failed' | 'deduplicated',
    error?: string,
): Promise<void> {
    const { data: existing } = await supabase
        .from('ml_webhook_events')
        .select('id')
        .eq('user_id', payload.user_id)
        .eq('resource', payload.resource)
        .eq('topic', payload.topic)
        .eq('sent_at', payload.sent)
        .maybeSingle();
    const row = {
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
    };
    if (existing?.id) {
        await supabase
            .from('ml_webhook_events')
            .update({
                status,
                error: error ?? null,
                payload: JSON.stringify(payload),
                attempts: payload.attempts,
            })
            .eq('id', existing.id);
    } else {
        await supabase.from('ml_webhook_events').insert(row);
    }
}

async function getMlClientId(): Promise<string | null> {
    const { data: settings } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['ml_app_id']);

    const clientId = (settings?.find((s) => s.key === 'ml_app_id')?.value?.value as string) ?? '';
    if (clientId) return clientId;

    // Fallback a env vars (legacy)
    return Deno.env.get('ML_CLIENT_ID') ?? null;
}

async function validateNotificationBinding(payload: MlWebhookPayload): Promise<boolean> {
    const clientId = await getMlClientId();
    if (clientId && String(payload.application_id) !== clientId) return false;
    const { data: connection } = await supabase
        .from('ml_connection')
        .select('user_id')
        .eq('provider', 'mercadolibre')
        .eq('is_active', true)
        .eq('user_id', payload.user_id)
        .maybeSingle();
    return !!connection;
}

async function handleQuestions(payload: MlWebhookPayload): Promise<void> {
    const questionId = payload.resource.split('/').pop();
    if (!questionId) return;

    const template = await getActiveTemplate(supabase, 'new_question');

    if (template) {
        let token: string | null = null;
        try {
            token = await getMlAccessToken(supabase);
        } catch (err) {
            logWarn({ function: 'ml-webhook', topic: 'questions', error: (err as Error).message });
        }

        if (token) {
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
                        from_user_nickname:
                            typeof q?.from?.nickname === 'string' ? q.from.nickname : null,
                        date_created: typeof q?.date_created === 'string' ? q.date_created : null,
                        status: 'answered',
                        answer_text: template.message,
                        date_updated: new Date().toISOString(),
                    },
                    { onConflict: 'question_id' },
                );

                try {
                    await sendQuestionAnswer(
                        supabase,
                        questionId,
                        template.message,
                        token,
                        `answer:${questionId}`,
                    );
                } catch (err) {
                    await supabase
                        .from('ml_questions')
                        .update({ status: 'unanswered', answer_text: null })
                        .eq('question_id', questionId);
                    logWarn({
                        function: 'ml-webhook',
                        topic: 'questions',
                        question_id: questionId,
                        error: (err as Error).message,
                    });
                }
                return;
            }
        }
    }

    // Sin plantilla activa: solo registrar
    const { data: item } = await supabase
        .from('property_ml_meta')
        .select('property_id, ml_item_id')
        .eq('ml_item_id', Number(questionId))
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

function deriveOrderStatus(order: MlOrderSchema | null): string {
    if (!order || order.status === 'cancelled') return 'cancelled';
    if (order.status === 'payment_required') return 'new';

    const shippingStatus = order.shipping?.status;
    if (shippingStatus === 'delivered') return 'delivered';
    if (shippingStatus === 'shipped' || shippingStatus === 'sent') return 'shipped';

    const approved = (order.payments ?? []).some((p) => p?.status === 'approved');
    if (approved) return 'paid';

    if (order.status === 'confirmed') return 'confirmed';
    return 'new';
}

async function handleOrders(payload: MlWebhookPayload): Promise<void> {
    const orderId = payload.resource.split('/').pop();
    if (!orderId) return;

    let token: string | null = null;
    try {
        token = await getMlAccessToken(supabase);
    } catch (err) {
        logWarn({ function: 'ml-webhook', topic: 'orders', error: (err as Error).message });
    }

    let order: MlOrderSchema | null = null;
    if (token) {
        const res = await fetch(`${ML_API}/orders/${orderId}`, {
            headers: { authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            try {
                const data = await res.json();
                order = parseMlResponse(MlOrderSchema, data, 'mlOrder');
            } catch {
                order = null;
            }
        } else {
            logWarn({
                function: 'ml-webhook',
                topic: 'orders',
                order_id: orderId,
                status: res.status,
            });
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
        if (typeof order.buyer?.nickname === 'string')
            orderPayload.buyer_nickname = order.buyer.nickname;
        if (typeof order.total_amount === 'number') orderPayload.total_amount = order.total_amount;
        if (typeof order.currency_id === 'string') orderPayload.currency = order.currency_id;
        if (typeof order.date_created === 'string') orderPayload.date_created = order.date_created;
        if (typeof order.date_closed === 'string') orderPayload.date_closed = order.date_closed;
    }

    await supabase.from('ml_orders').upsert(orderPayload, { onConflict: 'order_id' });

    const trigger = ORDER_STATUS_TRIGGER[status];
    if (trigger && token && prevStatus !== status) {
        const template = await getActiveTemplate(supabase, trigger);
        if (template) {
            try {
                await sendOrderMessage(
                    supabase,
                    orderId,
                    template.message,
                    token,
                    `order:${orderId}:${status}`,
                );
                log({
                    function: 'ml-webhook',
                    topic: 'orders',
                    order_id: orderId,
                    trigger,
                    status: 'auto_reply_sent',
                });
            } catch (err) {
                logWarn({
                    function: 'ml-webhook',
                    topic: 'orders',
                    order_id: orderId,
                    trigger,
                    error: (err as Error).message,
                });
            }
        }
    }
}

async function handleItems(payload: MlWebhookPayload): Promise<void> {
    const itemId = payload.resource.split('/').pop();
    if (!itemId) return;

    const { data: meta } = await supabase
        .from('property_ml_meta')
        .select('property_id, ml_item_id')
        .eq('ml_item_id', Number(itemId))
        .maybeSingle();

    if (meta) {
        await supabase.rpc('ml_enqueue', {
            p_property_id: meta.property_id,
            p_operation: 'update',
            p_internal: true,
        });
    }
}

async function handlePayments(payload: MlWebhookPayload): Promise<void> {
    const paymentId = payload.resource.split('/').pop();
    if (!paymentId) return;

    await supabase.from('ml_payments').upsert({
        payment_id: paymentId,
        status: 'pending',
        received_at: new Date().toISOString(),
        payload: JSON.stringify(payload),
    });
}

async function handleShipments(payload: MlWebhookPayload): Promise<void> {
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
    const respond = (status: number, body: Record<string, unknown>): Response =>
        jsonResponse(status, body, req);

    if (!ML_WEBHOOK_SECRET) {
        logError({ function: 'ml-webhook', error: 'ML_WEBHOOK_SECRET missing' });
        return respond(500, { error: 'ML_WEBHOOK_SECRET not configured' });
    }

    if (req.method === 'OPTIONS') return optionsResponse(req);
    if (req.method !== 'POST') return respond(405, { error: 'Method not allowed' });

    // Rate Limiting
    const clientIp =
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
        req.headers.get('x-real-ip') ??
        'unknown';
    const rlResult = await checkRateLimit('ml-webhook', clientIp);
    if (!rlResult.allowed) {
        return respond(429, { error: 'Rate limited', retry_after: rlResult.retryAfter });
    }

    // Verify signature
    const verified = await verifySignature(req);
    if (!verified) return respond(401, { error: 'Invalid signature' });

    let payload: MlWebhookPayload;
    try {
        const raw = await req.json();
        payload = parseMlResponse(MlWebhookPayloadSchema, raw, 'ml-webhook');
    } catch {
        return respond(400, { error: 'Invalid JSON' });
    }

    const start = Date.now();

    if (!(await validateNotificationBinding(payload))) {
        return respond(401, {
            error: 'Notificación no perteneciente a la aplicación/cuenta conectada',
        });
    }

    // Deduplication check
    const { data: existingEvent } = await supabase
        .from('ml_webhook_events')
        .select('status')
        .eq('resource', payload.resource)
        .eq('topic', payload.topic)
        .eq('sent_at', payload.sent)
        .maybeSingle();

    if (existingEvent && existingEvent.status === 'processed') {
        log({
            function: 'ml-webhook',
            topic: payload.topic,
            resource: payload.resource,
            attempts: payload.attempts,
            status: 'deduplicated',
        });
        return respond(200, { ok: true, deduplicated: true });
    }

    await logWebhookEvent(payload, 'received');

    try {
        switch (payload.topic) {
            case 'questions':
                await handleQuestions(payload);
                break;
            case 'orders':
            case 'orders_v2':
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
                logWarn({ function: 'ml-webhook', topic: payload.topic, status: 'unhandled' });
        }
        await logWebhookEvent(payload, 'processed');
        log({
            function: 'ml-webhook',
            topic: payload.topic,
            resource: payload.resource,
            duration_ms: Date.now() - start,
            status: 'processed',
        });
        return respond(200, { ok: true });
    } catch (err) {
        logError({
            function: 'ml-webhook',
            topic: payload.topic,
            resource: payload.resource,
            duration_ms: Date.now() - start,
            status: 'failed',
            error: (err as Error).message,
        });
        await logWebhookEvent(payload, 'failed', (err as Error).message);
        return respond(500, { error: (err as Error).message });
    }
});
