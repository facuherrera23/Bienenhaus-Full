import { supabase, supabaseUrl } from './supabase';
import type { Json } from '../types/database';
import type {
    MlAutoReplyTemplate,
    MlCategory,
    MlConnectionInfo,
    MlItemMetrics,
    MlListingType,
    MlMetaRow,
    MlMetrics,
    MlOperation,
    MlOrder,
    MlOverview,
    MlQuestion,
    MlQueueRow,
    MlSettings,
    MlSyncStatus,
} from '../types/ml';
import type { Database } from '../types/database';
import { ML_OPERATION_LABEL, ML_SYNC_STATUS_LABEL, ML_SYNC_STATUS_TONE } from '../types/ml';

// ============================================================
// Re-export types and constants
// ============================================================

export type {
    MlOperation,
    MlSyncStatus,
    MlConnectionInfo,
    MlOverview,
    MlSettings,
    MlQueueRow,
    MlMetaRow,
    MlCategory,
    MlListingType,
    MlQuestion,
    MlOrder,
    MlMetrics,
    MlItemMetrics,
    MlAutoReplyTemplate,
};

export { ML_OPERATION_LABEL, ML_SYNC_STATUS_LABEL, ML_SYNC_STATUS_TONE };

// ============================================================
// DB row types with embedded relations
// ============================================================

export type QueueApiRow = Database['public']['Tables']['ml_sync_queue']['Row'] & {
    property: { title: string; code: number } | { title: string; code: number }[] | null;
};

export type MetaApiRow = Database['public']['Tables']['property_ml_meta']['Row'] & {
    property: { title: string; code: number } | { title: string; code: number }[] | null;
};

// ============================================================
// Embed helper
// ============================================================

export function embedProperty(
    v: { title: string; code: number } | { title: string; code: number }[] | null,
): {
    title: string | null;
    code: number | null;
} {
    if (!v) return { title: null, code: null };
    return Array.isArray(v)
        ? { title: v[0]?.title ?? null, code: v[0]?.code ?? null }
        : { title: v.title, code: v.code };
}

// ============================================================
// Mappers
// ============================================================

export function toMlQueueRow(q: QueueApiRow): MlQueueRow {
    const prop = embedProperty(q.property);
    return {
        id: q.id,
        property_id: q.property_id,
        operation: q.operation,
        status: q.status,
        attempts: q.attempts,
        max_attempts: q.max_attempts,
        next_attempt_at: q.next_attempt_at,
        ml_item_id: q.ml_item_id,
        last_error: q.last_error,
        created_at: q.created_at,
        property_title: prop.title,
        property_code: prop.code,
    };
}

export function toMlMetaRow(m: MetaApiRow): MlMetaRow {
    const prop = embedProperty(m.property);
    return {
        property_id: m.property_id,
        ml_item_id: m.ml_item_id,
        status: m.status,
        permalink: m.permalink,
        price: m.price === null ? null : Number(m.price),
        last_sync_at: m.last_sync_at,
        last_sync_status: m.last_sync_status,
        property_title: prop.title,
        property_code: prop.code,
    };
}

// ============================================================
// SELECT strings
// ============================================================

const ML_QUEUE_SELECT = `
  id, property_id, operation, status, attempts, max_attempts, next_attempt_at, ml_item_id, last_error, created_at, property:properties(title, code)
`.trim();

const ML_META_SELECT = `
  property_id, ml_item_id, status, permalink, price, last_sync_at, last_sync_status, property:properties(title, code)
`.trim();

// ============================================================
// API Functions - Connection
// ============================================================

export async function fetchMlOverview(): Promise<MlOverview> {
    const { data, error } = await supabase.rpc('ml_get_connection').returns<MlOverview>().single();
    if (error) throw new Error(error.message);
    return data ?? { ml_enabled: false, connection: null };
}

export async function setMlEnabled(enabled: boolean): Promise<void> {
    await upsertSetting('ml_enabled', { value: enabled });
}

export async function setMlAppId(appId: string): Promise<void> {
    await upsertSetting('ml_app_id', { value: appId });
}

export async function setMlDefaults(defaults: {
    category_id: string;
    listing_type_id: string;
    condition: string;
}): Promise<void> {
    await upsertSetting('ml_defaults', defaults);
}

async function upsertSetting(key: string, value: Record<string, unknown>): Promise<void> {
    const { data } = await supabase.from('site_settings').select('id').eq('key', key).maybeSingle();

    if (data) {
        const { error } = await supabase
            .from('site_settings')
            .update({ value: value as Json })
            .eq('id', data.id);
        if (error) throw new Error(error.message);
    } else {
        const { error } = await supabase
            .from('site_settings')
            .insert({ key, value: value as Json, value_type: 'json', is_public: false });
        if (error) throw new Error(error.message);
    }
}

export async function fetchMlSettings(): Promise<MlSettings> {
    const { data, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['ml_app_id', 'ml_defaults']);

    if (error) throw new Error(error.message);

    const settings: MlSettings = {
        app_id: '',
        defaults: { category_id: '', listing_type_id: 'gold_pro', condition: 'used' },
    };

    for (const s of data ?? []) {
        if (s.key === 'ml_app_id') {
            settings.app_id = String((s.value as { value?: unknown }).value ?? '');
        }
        if (s.key === 'ml_defaults') {
            settings.defaults = {
                category_id: String((s.value as { category_id?: unknown }).category_id ?? ''),
                listing_type_id: String(
                    (s.value as { listing_type_id?: unknown }).listing_type_id ?? 'gold_pro',
                ),
                condition: String((s.value as { condition?: unknown }).condition ?? 'used'),
            };
        }
    }

    return settings;
}

export function buildAuthorizeUrl(appId: string): string {
    const redirectUri = `${supabaseUrl}/functions/v1/ml-oauth`;
    const state = btoa(JSON.stringify({ admin: window.location.origin }));
    return (
        'https://auth.mercadolibre.com.ar/authorization' +
        `?response_type=code&client_id=${encodeURIComponent(appId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${encodeURIComponent(state)}`
    );
}

export const ML_REDIRECT_URI = `${supabaseUrl}/functions/v1/ml-oauth`;

export async function disconnectMl(): Promise<void> {
    const { error } = await supabase
        .from('ml_connection')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Queue
// ============================================================

export async function fetchMlQueue(): Promise<MlQueueRow[]> {
    const { data, error } = await supabase
        .from('ml_sync_queue')
        .select(ML_QUEUE_SELECT)
        .order('created_at', { ascending: false })
        .limit(50)
        .returns<QueueApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toMlQueueRow);
}

// ============================================================
// API Functions - Meta
// ============================================================

export async function fetchMlMeta(): Promise<MlMetaRow[]> {
    const { data, error } = await supabase
        .from('property_ml_meta')
        .select(ML_META_SELECT)
        .order('last_sync_at', { ascending: false })
        .returns<MetaApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toMlMetaRow);
}

// ============================================================
// API Functions - Categories & Listing Types
// ============================================================

export async function fetchMlCategories(): Promise<MlCategory[]> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sin sesión activa');

    const res = await fetch(`${supabaseUrl}/functions/v1/ml-categories`, {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`No se pudieron cargar categorías`);
    return await res.json();
}

export async function fetchMlListingTypes(): Promise<MlListingType[]> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sin sesión activa');

    const res = await fetch(`${supabaseUrl}/functions/v1/ml-listing-types`, {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`No se pudieron cargar tipos de publicación`);
    return await res.json();
}

// ============================================================
// API Functions - Questions & Orders
// ============================================================

export async function fetchMlQuestions(): Promise<MlQuestion[]> {
    const { data, error } = await supabase
        .from('ml_questions')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(50)
        .returns<Database['public']['Tables']['ml_questions']['Row'][]>();

    if (error) throw new Error(error.message);
    return (data ?? []) as MlQuestion[];
}

export async function fetchMlOrders(): Promise<MlOrder[]> {
    const { data, error } = await supabase
        .from('ml_orders')
        .select('*')
        .order('received_at', { ascending: false })
        .limit(50)
        .returns<Database['public']['Tables']['ml_orders']['Row'][]>();

    if (error) throw new Error(error.message);
    return (data ?? []) as MlOrder[];
}

// ============================================================
// API Functions - Metrics
// ============================================================

export async function fetchMlMetrics(): Promise<MlMetrics> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sin sesión activa');

    const res = await fetch(`${supabaseUrl}/functions/v1/ml-metrics`, {
        method: 'GET',
        headers: { authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`No se pudieron cargar métricas`);
    return await res.json();
}

// ============================================================
// API Functions - Auto Reply Templates
// ============================================================

export async function fetchMlAutoReplyTemplates(): Promise<MlAutoReplyTemplate[]> {
    const { data, error } = await supabase
        .from('ml_auto_reply_templates')
        .select('*')
        .order('created_at', { ascending: false })
        .returns<Database['public']['Tables']['ml_auto_reply_templates']['Row'][]>();

    if (error) throw new Error(error.message);
    return (data ?? []) as MlAutoReplyTemplate[];
}

export async function createMlAutoReplyTemplate(
    template: Omit<MlAutoReplyTemplate, 'id' | 'created_at' | 'updated_at'>,
): Promise<MlAutoReplyTemplate> {
    const { data, error } = await supabase
        .from('ml_auto_reply_templates')
        .insert(template)
        .select()
        .single()
        .returns<Database['public']['Tables']['ml_auto_reply_templates']['Row']>();

    if (error) throw new Error(error.message);
    return data as MlAutoReplyTemplate;
}

export async function updateMlAutoReplyTemplate(
    id: number,
    template: Partial<MlAutoReplyTemplate>,
): Promise<MlAutoReplyTemplate> {
    const { data, error } = await supabase
        .from('ml_auto_reply_templates')
        .update(template)
        .eq('id', id)
        .select()
        .single()
        .returns<Database['public']['Tables']['ml_auto_reply_templates']['Row']>();

    if (error) throw new Error(error.message);
    return data as MlAutoReplyTemplate;
}

export async function deleteMlAutoReplyTemplate(id: number): Promise<void> {
    const { error } = await supabase.from('ml_auto_reply_templates').delete().eq('id', id);

    if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Answer Question
// ============================================================

export async function answerMlQuestion(questionId: string, answer: string): Promise<void> {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sin sesión activa');

    const res = await fetch(`${supabaseUrl}/functions/v1/ml-answer-question`, {
        method: 'POST',
        headers: {
            authorization: `Bearer ${token}`,
            'content-type': 'application/json',
        },
        body: JSON.stringify({ question_id: questionId, answer }),
    });

    if (!res.ok) throw new Error(`Error respondiendo pregunta`);
}
