import { supabase, supabaseUrl } from './supabase';

export type MlOperation = 'publish' | 'update' | 'delete';
export type MlSyncStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';

export const ML_OPERATION_LABEL: Record<MlOperation, string> = {
  publish: 'Publicar',
  update: 'Actualizar',
  delete: 'Eliminar',
};

export const ML_SYNC_STATUS_LABEL: Record<MlSyncStatus, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  success: 'Éxito',
  failed: 'Falló',
  cancelled: 'Cancelada',
};

export const ML_SYNC_STATUS_TONE: Record<MlSyncStatus, string> = {
  pending: 'neutral',
  processing: 'warning',
  success: 'success',
  failed: 'danger',
  cancelled: 'neutral',
};

// ---------------------------------------------------------------------------
// Conexión
// ---------------------------------------------------------------------------

export interface MlConnectionInfo {
  id: string;
  provider: string;
  site_id: string;
  user_id: number | null;
  nickname: string | null;
  email: string | null;
  token_expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MlOverview {
  ml_enabled: boolean;
  connection: MlConnectionInfo | null;
}

export async function fetchMlOverview(): Promise<MlOverview> {
  const { data, error } = await supabase.rpc('ml_get_connection');
  if (error) throw new Error(error.message);
  return (data ?? { ml_enabled: false, connection: null }) as MlOverview;
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
    const { error } = await supabase.from('site_settings').update({ value }).eq('id', data.id);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from('site_settings')
      .insert({ key, value, value_type: 'json', is_public: false });
    if (error) throw new Error(error.message);
  }
}

export interface MlSettings {
  app_id: string;
  defaults: { category_id: string; listing_type_id: string; condition: string };
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
    if (s.key === 'ml_app_id') settings.app_id = String((s.value as { value?: unknown }).value ?? '');
    if (s.key === 'ml_defaults') {
      settings.defaults = {
        category_id: String((s.value as { category_id?: unknown }).category_id ?? ''),
        listing_type_id: String((s.value as { listing_type_id?: unknown }).listing_type_id ?? 'gold_pro'),
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
  const { error } = await supabase.from('ml_connection').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Cola de sincronización
// ---------------------------------------------------------------------------

export interface MlQueueRow {
  id: number;
  property_id: string;
  operation: MlOperation;
  status: MlSyncStatus;
  attempts: number;
  max_attempts: number;
  next_attempt_at: string;
  ml_item_id: number | null;
  last_error: string | null;
  created_at: string;
  property_title: string | null;
  property_code: number | null;
}

export interface QueueApiRow {
  id: number;
  property_id: string;
  operation: MlOperation;
  status: MlSyncStatus;
  attempts: number;
  max_attempts: number;
  next_attempt_at: string;
  ml_item_id: number | null;
  last_error: string | null;
  created_at: string;
  property: { title: string; code: number } | { title: string; code: number }[] | null;
}

export function embedProperty(v: { title: string; code: number } | { title: string; code: number }[] | null): {
  title: string | null;
  code: number | null;
} {
  if (!v) return { title: null, code: null };
  return Array.isArray(v) ? { title: v[0]?.title ?? null, code: v[0]?.code ?? null } : { title: v.title, code: v.code };
}

export async function fetchMlQueue(): Promise<MlQueueRow[]> {
  const { data, error } = await supabase
    .from('ml_sync_queue')
    .select(
      'id, property_id, operation, status, attempts, max_attempts, next_attempt_at, ml_item_id, last_error, created_at, property:properties(title, code)',
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map((q: QueueApiRow) => {
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
  });
}

// ---------------------------------------------------------------------------
// Estado de propiedades en Mercado Libre
// ---------------------------------------------------------------------------

export interface MlMetaRow {
  property_id: string;
  ml_item_id: number | null;
  status: string | null;
  permalink: string | null;
  price: number | null;
  last_sync_at: string | null;
  last_sync_status: MlSyncStatus | null;
  property_title: string | null;
  property_code: number | null;
}

export interface MetaApiRow {
  property_id: string;
  ml_item_id: number | null;
  status: string | null;
  permalink: string | null;
  price: number | null;
  last_sync_at: string | null;
  last_sync_status: MlSyncStatus | null;
  property: { title: string; code: number } | { title: string; code: number }[] | null;
}

export async function fetchMlMeta(): Promise<MlMetaRow[]> {
  const { data, error } = await supabase
    .from('property_ml_meta')
    .select(
      'property_id, ml_item_id, status, permalink, price, last_sync_at, last_sync_status, property:properties(title, code)',
    )
    .order('last_sync_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((m: MetaApiRow) => {
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
  });
}

// ---------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------

export async function enqueueMl(propertyId: string, operation: MlOperation): Promise<void> {
  const { error } = await supabase.rpc('ml_enqueue', {
    p_property_id: propertyId,
    p_operation: operation,
  });
  if (error) throw new Error(error.message);
}

export async function syncNow(): Promise<{ processed: number }> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sin sesión activa');

  const res = await fetch(`${supabaseUrl}/functions/v1/ml-sync`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text ? `Sync falló (${res.status}): ${text.slice(0, 200)}` : `Sync falló (${res.status})`);
  }
  return await res.json();
}

export interface MlCategory {
  id: string;
  name: string;
}

export interface MlListingType {
  id: string;
  name: string;
}

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

export interface MlQuestion {
  id: number;
  question_id: string;
  property_id: string | null;
  ml_item_id: number;
  question_text: string | null;
  answer_text: string | null;
  status: 'unanswered' | 'answered' | 'deleted';
  from_user_id: number | null;
  from_user_nickname: string | null;
  date_created: string | null;
  date_updated: string | null;
  received_at: string;
}

export interface MlOrder {
  id: number;
  order_id: string;
  property_id: string | null;
  ml_item_id: number;
  buyer_id: number | null;
  buyer_nickname: string | null;
  status: 'new' | 'confirmed' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: number | null;
  currency: string;
  date_created: string | null;
  date_closed: string | null;
  received_at: string;
}

export async function fetchMlQuestions(): Promise<MlQuestion[]> {
  const { data, error } = await supabase
    .from('ml_questions')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as MlQuestion[];
}

export async function fetchMlOrders(): Promise<MlOrder[]> {
  const { data, error } = await supabase
    .from('ml_orders')
    .select('*')
    .order('received_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []) as MlOrder[];
}

export interface MlMetrics {
  items: MlItemMetrics[];
  total_visits: number;
  total_questions: number;
  unanswered_questions: number;
  total_sales: number;
  total_revenue: number;
  conversion_rate: number;
}

export interface MlItemMetrics {
  item_id: string;
  title: string;
  visits: number;
  questions: number;
  sold_quantity: number;
  available_quantity: number;
  price: number;
  currency_id: string;
  status: string;
  permalink: string;
}

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

export interface MlAutoReplyTemplate {
  id: number;
  name: string;
  trigger: 'new_question' | 'new_order' | 'order_paid' | 'order_shipped' | 'order_delivered';
  message: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function fetchMlAutoReplyTemplates(): Promise<MlAutoReplyTemplate[]> {
  const { data, error } = await supabase
    .from('ml_auto_reply_templates')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as MlAutoReplyTemplate[];
}

export async function createMlAutoReplyTemplate(template: Omit<MlAutoReplyTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<MlAutoReplyTemplate> {
  const { data, error } = await supabase
    .from('ml_auto_reply_templates')
    .insert(template)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MlAutoReplyTemplate;
}

export async function updateMlAutoReplyTemplate(id: number, template: Partial<MlAutoReplyTemplate>): Promise<MlAutoReplyTemplate> {
  const { data, error } = await supabase
    .from('ml_auto_reply_templates')
    .update(template)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return data as MlAutoReplyTemplate;
}

export async function deleteMlAutoReplyTemplate(id: number): Promise<void> {
  const { error } = await supabase.from('ml_auto_reply_templates').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

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

export async function bulkEnqueueMl(propertyIds: string[], operation: MlOperation): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Sin sesión activa');

  const res = await fetch(`${supabaseUrl}/functions/v1/ml-bulk-enqueue`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ property_ids: propertyIds, operation }),
  });
  if (!res.ok) throw new Error(`Error encolando en lote`);
}
