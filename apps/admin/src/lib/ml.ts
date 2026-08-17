import { supabase, supabaseUrl } from '@bienenhaus/supabase';
import { type Database, type Json } from '../types/database';
import {
    ML_OPERATION_LABEL,
    ML_SYNC_STATUS_LABEL,
    ML_SYNC_STATUS_TONE,
    type ImportFilters,
    type ImportMlListingsResult,
    type ImportSelectedParams,
    type MlAutoReplyTemplate,
    type MlCategory,
    type MlConnectionInfo,
    type MlDeadLetterRow,
    type MlItemMetrics,
    type MlItemStatus,
    type MlListingType,
    type MlMetrics,
    type MlMetaRow,
    type MlOperation,
    type MlOrder,
    type MlOverview,
    type MlQuestion,
    type MlQueueRow,
    type MlSettings,
    type MlSyncStatus,
    type PreviewItem,
    type PreviewResult,
} from '../types/ml';

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
    MlDeadLetterRow,
    ImportMlListingsResult,
    MlItemStatus,
    ImportFilters,
    PreviewItem,
    PreviewResult,
    ImportSelectedParams,
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
    ml_item_id: string | null;
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
        .in('key', ['ml_app_id', 'ml_defaults', 'ml_client_secret', 'ml_webhook_secret']);

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
        if (s.key === 'ml_client_secret') {
            settings.client_secret = String((s.value as { value?: unknown }).value ?? '');
        }
        if (s.key === 'ml_webhook_secret') {
            settings.webhook_secret = String((s.value as { value?: unknown }).value ?? '');
        }
    }

    return settings;
}

export function buildAuthorizeUrl(appId: string, state: string, codeChallenge: string): string {
    const redirectUri = `${supabaseUrl}/functions/v1/ml-oauth`;
    return (
        'https://auth.mercadolibre.com.ar/authorization' +
        `?response_type=code&client_id=${encodeURIComponent(appId)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${encodeURIComponent(state)}` +
        `&code_challenge=${encodeURIComponent(codeChallenge)}` +
        `&code_challenge_method=S256`
    );
}

export const ML_REDIRECT_URI = `${supabaseUrl}/functions/v1/ml-oauth`;

export async function testMlCredentials(appId: string): Promise<{ ok: boolean; name?: string; message: string }> {
    try {
        const res = await fetch(`https://api.mercadolibre.com/applications/${encodeURIComponent(appId)}`, {
            headers: { Accept: 'application/json' },
        });
        if (res.ok) {
            const data = (await res.json()) as { name?: string };
            return { ok: true, name: data.name, message: `App válida: ${data.name ?? appId}` };
        }
        const text = await res.text().catch(() => '');
        if (res.status === 404) return { ok: false, message: `No existe la app ${appId} en ML` };
        return { ok: false, message: `ML respondió ${res.status}: ${text.slice(0, 200)}` };
    } catch (err) {
        return { ok: false, message: err instanceof Error ? err.message : 'Error de red' };
    }
}

export async function startMlOAuth(): Promise<{ state: string; code_challenge: string }> {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('No hay sesion iniciada');

    const url = `${supabaseUrl}/functions/v1/ml-oauth`;
    const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!apikey) throw new Error('VITE_SUPABASE_ANON_KEY no configurada');

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey,
        },
        body: JSON.stringify({
            action: 'start',
            admin: window.location.origin + '/admin',
        }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`No se pudo iniciar OAuth: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { state?: string; code_challenge?: string };
    if (!data.state || !data.code_challenge) {
        throw new Error('Respuesta OAuth invalida del servidor');
    }
    return { state: data.state, code_challenge: data.code_challenge };
}

export async function disconnectMl(): Promise<void> {
    const { data: conn } = await supabase
        .from('ml_connection')
        .select('id')
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (!conn) return;

    const { error } = await supabase.from('ml_connection').delete().eq('id', conn.id);
    if (error) throw new Error(error.message);
}

export async function bulkEnqueueMl(
    propertyIds: string[],
    operation: 'publish' | 'update' | 'delete',
): Promise<{ enqueued: number; skipped: number }> {
    if (propertyIds.length === 0) throw new Error('No hay propiedades seleccionadas');

    const {
        data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('No hay sesion iniciada');

    const url = `${supabaseUrl}/functions/v1/ml-bulk-enqueue`;
    const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!apikey) throw new Error('VITE_SUPABASE_ANON_KEY no configurada');

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey,
        },
        body: JSON.stringify({ property_ids: propertyIds, operation }),
    });
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`No se pudo encolar en Mercado Libre: ${res.status} ${text}`);
    }
    const data = (await res.json()) as { enqueued?: number; skipped?: number };
    return { enqueued: data.enqueued ?? 0, skipped: data.skipped ?? 0 };
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
    let query = supabase
        .from('ml_sync_queue')
        .select(ML_QUEUE_SELECT)
        .order('created_at', { ascending: false });

    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.operation) query = query.eq('operation', filters.operation);

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const { data, error } = await query
        .range((page - 1) * pageSize, page * pageSize - 1)
        .returns<QueueApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toMlQueueRow);
}

export async function fetchMlQueueInfinite(
    pageParam = 1,
    pageSize = 50,
): Promise<{
    data: MlQueueRow[];
    page: number;
    hasNextPage: boolean;
}> {
    const { data, error } = await supabase
        .from('ml_sync_queue')
        .select(ML_QUEUE_SELECT)
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

export async function fetchMlQueueStats(): Promise<{
    pending: number;
    processing: number;
    success: number;
    failed: number;
}> {
    const countBy = async (status: MlSyncStatus): Promise<number> => {
        const { count, error } = await supabase
            .from('ml_sync_queue')
            .select('*', { count: 'exact', head: true })
            .eq('status', status);
        if (error) throw new Error(error.message);
        return count ?? 0;
    };
    const [pending, processing, success, failed] = await Promise.all([
        countBy('pending'),
        countBy('processing'),
        countBy('success'),
        countBy('failed'),
    ]);
    return { pending, processing, success, failed };
}

// ============================================================
// API Functions - Meta
// ============================================================

export async function fetchMlMeta(filters?: {
    property_id?: string;
    page?: number;
    pageSize?: number;
}): Promise<MlMetaRow[]> {
    let query = supabase
        .from('property_ml_meta')
        .select(ML_META_SELECT)
        .order('last_sync_at', { ascending: false });

    if (filters?.property_id) query = query.eq('property_id', filters.property_id);

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 100;
    const { data, error } = await query
        .range((page - 1) * pageSize, page * pageSize - 1)
        .returns<MetaApiRow[]>();

    if (error) throw new Error(error.message);
    return (data ?? []).map(toMlMetaRow);
}

export async function fetchMlMetaInfinite(
    pageParam = 1,
    pageSize = 100,
): Promise<{
    data: MlMetaRow[];
    page: number;
    hasNextPage: boolean;
}> {
    const { data, error } = await supabase
        .from('property_ml_meta')
        .select(ML_META_SELECT)
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

export async function fetchMlCategories(parentId?: string | unknown): Promise<MlCategory[]> {
    const effectiveParentId = typeof parentId === 'string' ? parentId : undefined;
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error('Sin sesión activa');

    const url = new URL(`${supabaseUrl}/functions/v1/ml-categories`);
    if (effectiveParentId) url.searchParams.set('parent_id', effectiveParentId);
    const res = await fetch(url, {
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

export async function fetchMlQuestions(filters?: {
    status?: string;
    page?: number;
    pageSize?: number;
}): Promise<MlQuestion[]> {
    const apiFilters: Record<string, string | number | boolean | undefined> = {};

    if (filters?.status) apiFilters.status = `eq.${filters.status}`;

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const { data, error } = await supabase
        .from('ml_questions')
        .select('*')
        .match(apiFilters)
        .order('received_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)
        .returns<Database['public']['Tables']['ml_questions']['Row'][]>();

    if (error) throw new Error(error.message);
    return (data ?? []) as MlQuestion[];
}

export async function fetchMlQuestionsInfinite(
    pageParam = 1,
    pageSize = 50,
): Promise<{
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

export async function fetchMlOrders(filters?: {
    status?: string;
    page?: number;
    pageSize?: number;
}): Promise<MlOrder[]> {
    const apiFilters: Record<string, string | number | boolean | undefined> = {};

    if (filters?.status) apiFilters.status = `eq.${filters.status}`;

    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 50;
    const { data, error } = await supabase
        .from('ml_orders')
        .select('*')
        .match(apiFilters)
        .order('received_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1)
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
        ml_item_id: string | null;
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
        .returns<DeadLetterApiRow[]>();

    if (error) throw new Error(error.message);
    return {
        data: (data ?? []).map(toDeadLetterRow),
        count: count ?? 0,
        page,
        hasNextPage: (data?.length ?? 0) === 50,
    };
}

export async function retryDeadLetter(id: number): Promise<void> {
    // RPC atómico (0066): re-inserta en ml_sync_queue y resuelve la dead letter
    // en una sola transacción; evita reintentos duplicados si ya hay un job activo.
    const { data, error } = await supabase.rpc('ml_retry_dead_letter', {
        p_dead_letter_id: id,
    });

    if (error) throw new Error(error.message);

    const result = data as { retried: boolean; reason?: string } | null;
    if (!result?.retried) {
        const reason = result?.reason ?? 'unknown';
        if (reason === 'active_job_exists') {
            throw new Error('Ya existe una operación activa para esta propiedad');
        }
        if (reason === 'already_resolved') {
            throw new Error('La dead letter ya fue resuelta');
        }
        throw new Error('No se pudo reintentar la dead letter');
    }
}

export async function deleteDeadLetter(id: number): Promise<void> {
    const { error } = await supabase.from('ml_sync_dead_letter').delete().eq('id', id);
    if (error) throw new Error(error.message);
}

// ============================================================
// API Functions - Webhook Topics Registration
// ============================================================

export type MlWebhookTopic = 'questions' | 'orders' | 'items' | 'payments' | 'shipments';

export interface RegisterWebhookResult {
    ok: boolean;
    topic: string;
    error?: string;
}

/**
 * Registra todos los tópicos de webhook para el usuario ML conectado.
 * Llama a la edge function ml-oauth (que internamente usa registerMlWebhooks).
 */
export async function registerMlWebhooks(): Promise<RegisterWebhookResult[]> {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('No hay sesión iniciada');

    const url = `${supabaseUrl}/functions/v1/ml-oauth`;
    const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!apikey) throw new Error('VITE_SUPABASE_ANON_KEY no configurada');

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey,
        },
        body: JSON.stringify({ action: 'register_webhooks' }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`No se pudieron registrar webhooks: ${res.status} ${text}`);
    }
    return (await res.json()) as RegisterWebhookResult[];
}

/**
 * Verifica qué tópicos de webhook están registrados para el usuario ML conectado.
 */
export async function getMlWebhookStatus(): Promise<Record<string, boolean>> {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('No hay sesión iniciada');

    const url = `${supabaseUrl}/functions/v1/ml-oauth`;
    const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!apikey) throw new Error('VITE_SUPABASE_ANON_KEY no configurada');

    const res = await fetch(`${url}?action=webhook_status`, {
        headers: {
            Authorization: `Bearer ${token}`,
            apikey,
        },
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`No se pudo obtener estado de webhooks: ${res.status} ${text}`);
    }
    return (await res.json()) as Record<string, boolean>;
}

// ============================================================
// API Functions - Import Listings from ML
// ============================================================

/**
 * Obtiene preview de listings de ML con filtros (sin importar).
 * Útil para mostrar lista con checkboxes antes de importar.
 */
export async function fetchMlImportPreview(params: ImportFilters & { preview_limit?: number } = {}): Promise<PreviewResult> {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('No hay sesión iniciada');

    const url = `${supabaseUrl}/functions/v1/ml-import-listings`;
    const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!apikey) throw new Error('VITE_SUPABASE_ANON_KEY no configurada');

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey,
        },
        body: JSON.stringify({ ...params, preview_only: true }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`No se pudo obtener preview: ${res.status} ${text}`);
    }
    return (await res.json()) as PreviewResult;
}

/**
 * Importa listings seleccionados de Mercado Libre al sistema.
 * Llama a la edge function ml-import-listings con lista de ml_item_ids.
 */
export async function importSelectedMlListings(params: ImportSelectedParams): Promise<ImportMlListingsResult> {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('No hay sesión iniciada');

    const url = `${supabaseUrl}/functions/v1/ml-import-listings`;
    const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!apikey) throw new Error('VITE_SUPABASE_ANON_KEY no configurada');

    // The edge function expects specific ml_item_ids; we'll pass them as a special param
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey,
        },
        body: JSON.stringify({ selected_ids: params.ml_item_ids }),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`No se pudo importar selección: ${res.status} ${text}`);
    }
    return (await res.json()) as ImportMlListingsResult;
}

/**
 * Importa listings de Mercado Libre al sistema (con filtros opcionales).
 * Llama a la edge function ml-import-listings que hace fetch paginado de /users/{user_id}/items/search
 * y mapea cada item a property + property_ml_meta.
 */
export async function importMlListings(params?: ImportFilters): Promise<ImportMlListingsResult> {
    const {
        data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('No hay sesión iniciada');

    const url = `${supabaseUrl}/functions/v1/ml-import-listings`;
    const apikey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!apikey) throw new Error('VITE_SUPABASE_ANON_KEY no configurada');

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            apikey,
        },
        body: JSON.stringify(params ?? {}),
    });

    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`No se pudo importar de ML: ${res.status} ${text}`);
    }
    return (await res.json()) as ImportMlListingsResult;
}

// ============================================================
// API Functions - Client Secret (for edge functions)
// ============================================================

/**
 * Obtiene el client_secret de Mercado Libre desde site_settings.
 * Usado por edge functions para intercambiar tokens OAuth.
 * El valor se guarda encriptado en la BD, esta función lo devuelve en texto plano
 * (la edge function tiene la clave de encriptación en Deno.env).
 */
export async function fetchMlClientSecret(): Promise<string | null> {
    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', 'ml_client_secret')
        .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data?.value) return null;
    return String((data.value as { value?: unknown }).value ?? '');
}
