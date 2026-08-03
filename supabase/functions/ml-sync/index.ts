import { createClient } from 'npm:@supabase/supabase-js@2';
import { decrypt, encrypt } from '../_shared/crypto.ts';
import {
  getMe,
  mlCloseItem,
  mlCreateItem,
  mlGetItem,
  mlSetDescription,
  mlUpdateItem,
  mlUploadPictures,
  refreshToken,
  type MlItem,
} from '../_shared/ml.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-sync-secret',
  'access-control-allow-methods': 'POST, OPTIONS',
};

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

async function isAuthorized(req: Request): Promise<boolean> {
  const secret = Deno.env.get('ML_SYNC_SECRET');
  if (secret && req.headers.get('x-sync-secret') === secret) return true;

  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  if (token && token === Deno.env.get('SERVICE_ROLE_KEY')) return true;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return false;
  const { data: admins } = await supabase
    .from('admin_users')
    .select('role, is_active')
    .eq('id', data.user.id)
    .limit(1);
  const admin = admins?.[0];
  return !!admin && admin.is_active && ['super_admin', 'admin', 'staff'].includes(admin.role);
}

interface ConnectionRow {
  id: string;
  nickname: string | null;
  email: string | null;
  access_token_encrypted: string;
  access_token_iv: string;
  refresh_token_encrypted: string;
  refresh_token_iv: string;
  token_expires_at: string;
}

async function getAccessToken(conn: ConnectionRow): Promise<string> {
  const expiresIn = new Date(conn.token_expires_at).getTime() - Date.now();
  if (expiresIn > 5 * 60 * 1000) {
    return await decrypt(conn.access_token_encrypted, conn.access_token_iv);
  }

  const refresh = await decrypt(conn.refresh_token_encrypted, conn.refresh_token_iv);
  const tokens = await refreshToken(refresh);
  const access = await encrypt(tokens.access_token);
  const refreshEnc = await encrypt(tokens.refresh_token);

  await supabase
    .from('ml_connection')
    .update({
      access_token_encrypted: access.data,
      access_token_iv: access.iv,
      refresh_token_encrypted: refreshEnc.data,
      refresh_token_iv: refreshEnc.iv,
      token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    })
    .eq('id', conn.id);

  return tokens.access_token;
}

interface PropertyRow {
  id: string;
  title: string;
  description: string | null;
  listing_type: string;
  price: number | null;
  currency: string;
  address: string | null;
  area_total: number | null;
  area_covered: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  garages: number | null;
  images: { url: string; storage_path?: string }[];
}

async function fetchProperty(id: string): Promise<PropertyRow | null> {
  const { data } = await supabase
    .from('properties')
    .select(
      'id, title, description, listing_type, price, currency, address, area_total, area_covered, bedrooms, bathrooms, garages, images:property_images(url, storage_path)',
    )
    .eq('id', id)
    .maybeSingle();
  return (data as PropertyRow | null) ?? null;
}

async function fetchDefaults(): Promise<{ category_id: string; listing_type_id: string; condition: string }> {
  const { data } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'ml_defaults')
    .maybeSingle();
  const value = data?.value ?? {};
  return {
    category_id: String(value.category_id ?? ''),
    listing_type_id: String(value.listing_type_id ?? 'gold_pro'),
    condition: String(value.condition ?? 'used'),
  };
}

// Download images from Supabase storage and upload to ML
async function prepareImagesForML(
  accessToken: string,
  images: { url: string; storage_path?: string }[],
  supabaseUrl: string,
  serviceRoleKey: string
): Promise<string[]> {
  const files: Array<{ data: Uint8Array; name: string; type: string }> = [];

  for (const img of images.slice(0, 12)) {
    if (!img.storage_path) continue;

    try {
      // Download from Supabase storage
      const { data: fileData, error } = await supabase.storage
        .from('property-images')
        .download(img.storage_path);

      if (error || !fileData) {
        console.warn(`No se pudo descargar imagen ${img.storage_path}:`, error);
        continue;
      }

      const arrayBuffer = await fileData.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      // Determine content type from path
      const ext = img.storage_path.split('.').pop()?.toLowerCase();
      const contentType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';

      files.push({
        data: uint8Array,
        name: `image_${Date.now()}.${ext || 'jpg'}`,
        type: contentType,
      });
    } catch (err) {
      console.warn(`Error preparando imagen ${img.storage_path}:`, err);
    }
  }

  if (files.length === 0) return [];

  // Upload to ML
  const urls = await mlUploadPictures(accessToken, files);
  return urls;
}

async function runJob(
  queueId: number,
  operation: string,
  propertyId: string,
  mlItemId: number | null,
  accessToken: string,
): Promise<{ ok: boolean; itemId?: number | null; permalink?: string; mlStatus?: string; price?: number | null; error?: string }> {
  const property = await fetchProperty(propertyId);
  if (!property) {
    return { ok: false, error: 'Propiedad no encontrada' };
  }

const defaults = await fetchDefaults();

      // Prepare images for ML (download from Supabase storage and upload to ML)
      const mlImageUrls = await prepareImagesForML(accessToken, property.images, supabaseUrl, serviceRoleKey);

      try {
        if (operation === 'publish') {
          if (property.price === null || property.price <= 0) {
            return { ok: false, error: 'La propiedad debe tener precio para publicarse' };
          }
          const payload: Record<string, unknown> = {
            title: property.title.slice(0, 60),
            price: Number(property.price),
            currency_id: property.currency,
            available_quantity: 1,
            buying_mode: 'buy_it_now',
            condition: defaults.condition === 'used' ? 'used' : 'new',
          };
          if (defaults.category_id) payload.category_id = defaults.category_id;
          if (defaults.listing_type_id) payload.listing_type_id = defaults.listing_type_id;
          if (mlImageUrls.length > 0) payload.pictures = mlImageUrls.map(url => ({ source: url }));

      const item = (await mlCreateItem(accessToken, payload as never)) as MlItem;

      if (property.description) {
        await mlSetDescription(accessToken, item.id, property.description);
      }
      return { ok: true, itemId: Number(item.id), permalink: item.permalink, mlStatus: item.status, price: Number(item.price) };
    }

    if (operation === 'update') {
      if (!mlItemId) {
        return { ok: false, error: 'La propiedad no tiene item en Mercado Libre' };
      }
      const patch: Record<string, unknown> = {
        available_quantity: 1,
        condition: defaults.condition === 'used' ? 'used' : 'new',
      };
      if (property.price !== null && property.price > 0) patch.price = Number(property.price);
      if (property.currency) patch.currency_id = property.currency;

      // Prepare images for ML
      const mlImageUrls = await prepareImagesForML(accessToken, property.images, supabaseUrl, serviceRoleKey);
      if (mlImageUrls.length > 0) patch.pictures = mlImageUrls.map(url => ({ source: url }));

      await mlUpdateItem(accessToken, String(mlItemId), patch);
      if (property.description) {
        await mlSetDescription(accessToken, String(mlItemId), property.description);
      }
      const item = await mlGetItem(accessToken, String(mlItemId));
      return { ok: true, itemId: mlItemId, permalink: item.permalink, mlStatus: item.status, price: Number(item.price) };
    }

    if (operation === 'delete') {
      if (!mlItemId) {
        return { ok: false, error: 'La propiedad no tiene item en Mercado Libre' };
      }
      await mlCloseItem(accessToken, String(mlItemId));
      return { ok: true, itemId: mlItemId, mlStatus: 'closed' };
    }

    return { ok: false, error: `Operación desconocida: ${operation}` };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return respond(405, { error: 'Method not allowed' });
  if (!(await isAuthorized(req))) return respond(401, { error: 'No autorizado' });

  const { data: conns } = await supabase
    .from('ml_connection')
    .select(
      'id, nickname, email, access_token_encrypted, access_token_iv, refresh_token_encrypted, refresh_token_iv, token_expires_at',
    )
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1);

  const conn = (conns?.[0] ?? null) as ConnectionRow | null;
  if (!conn) {
    return respond(400, { error: 'No hay una cuenta de Mercado Libre conectada' });
  }

  // Reencola jobs 'processing' colgados (> 15 min).
  await supabase
    .from('ml_sync_queue')
    .update({ status: 'pending', locked_by: null, locked_at: null })
    .eq('status', 'processing')
    .lt('locked_at', new Date(Date.now() - 15 * 60 * 1000).toISOString());

  const { data: jobs } = await supabase
    .from('ml_sync_queue')
    .select('id, property_id, operation, ml_item_id')
    .eq('status', 'pending')
    .is('locked_by', null)
    .lte('next_attempt_at', new Date().toISOString())
    .order('created_at', { ascending: true })
    .limit(10);

  if (!jobs || jobs.length === 0) {
    return respond(200, { processed: 0, results: [] });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(conn);
  } catch (err) {
    return respond(500, { error: `No se pudo obtener token: ${(err as Error).message}` });
  }

  const results: Record<string, unknown>[] = [];

  for (const job of jobs as { id: number; property_id: string; operation: string; ml_item_id: number | null }[]) {
    const lockId = crypto.randomUUID();

    const { data: attemptsRow } = await supabase
      .from('ml_sync_queue')
      .select('attempts, max_attempts')
      .eq('id', job.id)
      .maybeSingle();

    const attempts = (attemptsRow?.attempts ?? 0) + 1;
    const maxAttempts = attemptsRow?.max_attempts ?? 5;

    await supabase
      .from('ml_sync_queue')
      .update({ status: 'processing', attempts, locked_by: lockId, locked_at: new Date().toISOString(), last_error: null })
      .eq('id', job.id);

    const outcome = await runJob(job.id, job.operation, job.property_id, job.ml_item_id, accessToken);

    if (outcome.ok) {
      const { error: histError } = await supabase.from('ml_sync_history').insert({
        queue_id: job.id,
        operation: job.operation,
        status: 'success',
        attempt: attempts,
        response: {
          item_id: outcome.itemId ?? null,
          permalink: outcome.permalink ?? null,
          ml_status: outcome.mlStatus ?? null,
          price: outcome.price ?? null,
        },
      });
      const meta: Record<string, unknown> = {
        ml_item_id: outcome.itemId ?? null,
        status: outcome.mlStatus ?? null,
        permalink: outcome.permalink ?? null,
        price: outcome.price ?? null,
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
      };
      await supabase.from('property_ml_meta').upsert({ property_id: job.property_id, ...meta });
      await supabase
        .from('ml_sync_queue')
        .update({
          status: 'success',
          ml_item_id: outcome.itemId ?? null,
          locked_by: null,
          locked_at: null,
          last_error: null,
        })
        .eq('id', job.id);
      results.push({ queue_id: job.id, property_id: job.property_id, operation: job.operation, status: 'success', history_error: histError?.message ?? null });
    } else {
      const finalFailed = attempts >= maxAttempts;
      const nextAttempt = finalFailed
        ? null
        : new Date(Date.now() + attempts * 5 * 60 * 1000).toISOString();
      const errorMsg = outcome.error ?? 'Error desconocido';

      await supabase.from('ml_sync_history').insert({
        queue_id: job.id,
        operation: job.operation,
        status: 'failed',
        attempt: attempts,
        error: errorMsg,
      });
      await supabase
        .from('ml_sync_queue')
        .update({
          status: finalFailed ? 'failed' : 'pending',
          attempts,
          next_attempt_at: nextAttempt ?? new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          last_error: errorMsg,
          locked_by: null,
          locked_at: null,
        })
        .eq('id', job.id);
      await supabase
        .from('property_ml_meta')
        .upsert({
          property_id: job.property_id,
          last_sync_at: new Date().toISOString(),
          last_sync_status: 'failed',
        });
      results.push({ queue_id: job.id, property_id: job.property_id, operation: job.operation, status: 'failed', error: errorMsg });
    }
  }

  return respond(200, { processed: results.length, results });
});
