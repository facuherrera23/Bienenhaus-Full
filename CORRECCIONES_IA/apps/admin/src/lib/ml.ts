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

export type DeadLetterApiRow = Database['public']['Tables']['ml_sync_dead_letter']['Row'] & {
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

export function toDeadLetterRow(d: DeadLetterApiRow): {
    id: number;
    original_queue_id: number;
    property_id: string;
    operation: string;
    attempts: number;
    max_attempts: number;
    last_error: string | null;
    payload: Record<string, unknown>;
    ml_item_id: number | null;
    created_at: string | null;
    moved_at: string | null;
    resolved_at: string | null;
    resolved_by: string | null;
    resolution_notes: string | null;
    property_title: string | null;
    property_code: number | null;
} {
    const prop = embedProperty(d.property);
    return {
        id: d.id,
        original_queue_id: d.original_queue_id,
        property_id: d.property_id,
        operation: d.operation,
        attempts: d.attempts,
        max_attempts: d.max_attempts,
        last_error: d.last_error,
        payload: d.payload as Record<string, unknown>,
        ml_item_id: d.ml_item_id,
        created_at: d.created_at,
        moved_at: d.moved_at,
        resolved_at: d.resolved_at ?? null,
        resolved_by: d.resolved_by ?? null,
        resolution_notes: d.resolution_notes ?? null,
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

const ML_DEAD_LETTER_SELECT = `
  id, original_queue_id, property_id, operation, attempts, max_attempts, last_error, payload, ml_item_id, created_at, moved_at, resolved_at, resolved_by, resolution_notes, property:properties(title, code)
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
        defaults: { category_id: '', listing_type_id: 'silver', condition: 'not_specified' },
    };

    for (const s of data ?? []) {
        if (s.key === 'ml_app_id') {
            settings.app_id = String((s.value as { value?: unknown }).value ?? '');
        }
        if (s.key === 'ml_defaults') {
            settings.defaults = {
                category_id: String((s.value as { category_id?: unknown }).category_id ?? ''),
                listing_type_id: String(
                    (s.value as { listing_type_id?: unknown }).listing_type_id ?? 'silver',
                ),
                condition: String((s.value as { condition?: unknown }).condition ?? 'not_specified'),
            };
        }
    }

    return settings;
}

export async function buildAuthorizeUrl(appId: string): Promise<string> {
    const redirectUri = `${supabaseUrl}/functions/v1/ml-oauth`;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) throw new Error('Sesión de administrador no disponible');
    const response = await fetch(`${supabaseUrl}/functions/v1/ml-oauth`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'start', admin: window.location.origin }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(String(body.error ?? 'No se pudo iniciar OAuth'));
    return (
        'https://auth.mercadolibre.com.ar/authorization' +
        `?response_type=code&client_id=${encodeURIComponent(appId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${encodeURIComponent(body.state)}` +
        `&code_challenge=${encodeURIComponent(body.code_challenge)}` +
        '&code_challenge_method=S256'
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

export async function revokeMlTokens(): Promise<void> {
    // Get active connection to get access token
    const { data: conn } = await supabase
        .from('ml_connection')
        .select('access_token_encrypted, access_token_iv')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (conn?.access_token_encrypted && conn?.access_token_iv) {
        // Import decrypt dynamically to avoid circular dependency
        const { decrypt } = await import('./_shared/crypto');
        const accessToken = await decrypt(conn.access_token_encrypted, conn.access_token_iv);

        // Call ML revoke endpoint
        const res = await fetch('https://api.mercadolibre.com/oauth/revoke', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({ token: accessToken }),
        });

        if (!res.ok) {
            const text = await res.text();
            throw new Error(`ML token revocation failed (${res.status}): ${text.slice(0, 300)}`);
        }
    }

    // Then delete connection
    await disconnectMl();
}

// ============================================================
// API Functions - Queue
// ============================================================

export async function fetchMlQueue(filters?: {
    status?: MlSyncStatus;
    operation?: MlOperation;
    page?: number;
    pageSize?: number;
}): Promise<MlQueueRow[]> {
    const apiFilters: Record<string, string | number | boolean | undefined> = { deleted_at: 'is.null' };

    if (filters?.status) apiFilters.status = `eq.${filters.status}`;
    if (filters?.operation) apiFilters.operation = `eq.${filters.operation}`;

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const { data, error } = await supabase
        .from('ml_sync_queue')
        .select(ML_QUEUE_SELECT)
        .match(apiFilters)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize + pageSize - 1)
        .returns<QueueApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toMlQueueRow);
}

export async function fetchMlQueueInfinite(pageParam = 1, pageSize = 50): Promise<{
    data: MlQueueRow[];
    page: number;
    hasNextPage: boolean;
}> {
    const { data, error } = await supabase
        .from('ml_sync_queue')
        .select(ML_QUEUE_SELECT)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .range((pageParam - 1) * pageSize, pageParam * pageSize - 1)
        .returns<QueueApiRow[]>();

    if (error) throw new Error(error.message);
    const rows = (data ?? []).map(toMlQueueRow);
    return {
        data: rows,
        page: pageParam,
        hasNextPage: rows.length === pageSize,
    };
}

// ============================================================
// API Functions - Meta
// ============================================================

export async function fetchMlMeta(filters?: { property_id?: string; page?: number; pageSize?: number }): Promise<MlMetaRow[]> {
    const apiFilters: Record<string, string | number | boolean | undefined> = { deleted_at: 'is.null' };

    if (filters?.property_id) apiFilters.property_id = `eq.${filters.property_id}`;

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 100;
    const { data, error } = await supabase
        .from('property_ml_meta')
        .select(ML_META_SELECT)
        .match(apiFilters)
        .order('last_sync_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize + pageSize - 1)
        .returns<MetaApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toMlMetaRow);
}

export async function fetchMlMetaInfinite(pageParam = 1, pageSize = 100): Promise<{
    data: MlMetaRow[];
    page: number;
    hasNextPage: boolean;
}> {
    const { data, error } = await supabase
        .from('property_ml_meta')
        .select(ML_META_SELECT)
        .is('deleted_at', null)
        .order('last_sync_at', { ascending: false })
        .range((pageParam - 1) * pageSize, pageParam * pageSize - 1)
        .returns<MetaApiRow[]>();

    if (error) throw new Error(error.message);
    const rows = (data ?? []).map(toMlMetaRow);
    return {
        data: rows,
        page: pageParam,
        hasNextPage: rows.length === pageSize,
    };
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

export async function fetchMlQuestions(filters?: { status?: string; page?: number; pageSize?: number }): Promise<MlQuestion[]> {
    const apiFilters: Record<string, string | number | boolean | undefined> = {};

    if (filters?.status) apiFilters.status = `eq.${filters.status}`;

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const { data, error } = await supabase
        .from('ml_questions')
        .select('*')
        .match(apiFilters)
        .order('received_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize + pageSize - 1)
        .returns<Database['public']['Tables']['ml_questions']['Row'][]>();

    if (error) throw new Error(error.message);
    return (data ?? []) as MlQuestion[];
}

export async function fetchMlQuestionsInfinite(pageParam = 1, pageSize = 50): Promise<{
    data: MlQuestion[];
    page: number;
    hasNextPage: boolean;
}> {
    const { data, error } = await supabase
        .from('ml_questions')
        .select('*')
        .order('received_at', { ascending: false })
        .range((pageParam - 1) * pageSize, pageParam * pageSize - 1)
        .returns<Database['public']['Tables']['ml_questions']['Row'][]>();

    if (error) throw new Error(error.message);
    const rows = (data ?? []) as MlQuestion[];
    return {
        data: rows,
        page: pageParam,
        hasNextPage: rows.length === pageSize,
    };
}

export async function fetchMlOrders(filters?: { status?: string; page?: number; pageSize?: number }): Promise<MlOrder[]> {
    const apiFilters: Record<string, string | number | boolean | undefined> = {};

    if (filters?.status) apiFilters.status = `eq.${filters.status}`;

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const { data, error } = await supabase
        .from('ml_orders')
        .select('*')
        .match(apiFilters)
        .order('received_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize + pageSize - 1)
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

// ============================================================
// API Functions - Dead Letter Queue
// ============================================================

export async function fetchMlDeadLetter(filters?: {
    status?: string;
    page?: number;
    pageSize?: number;
}): Promise<{
    data: Array<{
        id: number;
        original_queue_id: number;
        property_id: string;
        operation: string;
        attempts: number;
        max_attempts: number;
        last_error: string | null;
        payload: Record<string, unknown>;
        ml_item_id: number | null;
        created_at: string | null;
        moved_at: string | null;
        resolved_at: string | null;
        resolved_by: string | null;
        resolution_notes: string | null;
        property_title: string | null;
        property_code: number | null;
    }>;
    count: number;
    page: number;
    hasNextPage: boolean;
}> {
    const apiFilters: Record<string, string | number | boolean | undefined> = {};

    if (filters?.status) apiFilters.status = `eq.${filters.status}`;

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;

    const { data, error, count } = await supabase
        .from('ml_sync_dead_letter')
        .select(ML_DEAD_LETTER_SELECT, { count: 'exact' })
        .match(apiFilters)
        .order('moved_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)
        .returns<any[]>();

    if (error) throw new Error(error.message);
    return {
        data: (data ?? []).map(toDeadLetterRow),
        count: count ?? 0,
        page,
        hasNextPage: (data?.length ?? 0) === 50,
    };
}

export async function retryDeadLetter(id: number): Promise<void> {
    // Get dead letter item
    const { data: item, error } = await supabase
        .from('ml_sync_dead_letter')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !item) throw new Error('Dead letter item not found');

    // Re-insert into queue
    const { error: insertError } = await supabase.from('ml_sync_queue').insert({
        property_id: item.property_id,
        operation: item.operation,
        status: 'pending',
        attempts: 0,
        max_attempts: item.max_attempts,
        next_attempt_at: new Date().toISOString(),
        ml_item_id: item.ml_item_id,
        payload: item.payload,
    });

    if (insertError) throw new Error(insertError.message);

    // Mark as resolved
    await supabase
        .from('ml_sync_dead_letter')
        .update({ resolved_at: new Date().toISOString(), resolved_by: (await supabase.auth.getUser()).data.user?.id ?? null })
        .eq('id', id);
}

export async function deleteDeadLetter(id: number): Promise<void> {
    const { error } = await supabase.from('ml_sync_dead_letter').delete().eq('id', id);
    if (error) throw new Error(error.message);
}