import { createClient } from 'npm:@supabase/supabase-js@2';
import { decrypt, encrypt } from '../_shared/crypto.ts';
import { ML_API, refreshToken } from '../_shared/ml.ts';

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

interface MlAttribute {
  id: string;
  name: string;
  value_name: string;
  value_id?: string | number;
}

interface MlPicture {
  url: string;
  secure_url?: string;
}

interface MlItem {
  id: string;
  title: string;
  price: number;
  currency_id: string;
  condition: string; // 'new' or 'used'
  status: string; // 'active', 'closed', etc.
  permalink?: string;
  attributes: MlAttribute[];
  pictures: MlPicture[];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function getAttributeValue(attributes: MlAttribute[], id: string): string | null {
  const attr = attributes.find((a) => a.id === id);
  return attr ? attr.value_name : null;
}

function parseNumber(value: string | null): number | null {
  if (value === null || value === undefined) return null;
  let cleaned = value.replace(/[^\d.,]/g, '');
  if (cleaned.includes(',') && cleaned.includes('.')) {
    // Último separador es el decimal: quitar el otro
    cleaned = cleaned.replace(/[.,](?=.*[.,])/g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  }
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

interface ConnectionRow {
  id: string;
  nickname: string | null;
  email: string | null;
  user_id: number | null;
  access_token_encrypted: string;
  access_token_iv: string;
  refresh_token_encrypted: string;
  refresh_token_iv: string;
  token_expires_at: string;
}

interface ResultEntry {
  item_id: string;
  status: 'imported' | 'updated' | 'error';
  error: string | null;
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return respond(405, { error: 'Method not allowed' });

  if (!(await isAuthorized(req))) return respond(401, { error: 'No autorizado' });

  const { data: conns, error: connError } = await supabase
    .from('ml_connection')
    .select('id, nickname, email, access_token_encrypted, access_token_iv, refresh_token_encrypted, refresh_token_iv, token_expires_at, user_id')
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1);

  if (connError) {
    console.error('Error fetching ML connection:', connError);
    return respond(500, { error: 'Error de conexión' });
  }

  const conn = conns?.[0] ?? null;
  if (!conn) {
    return respond(400, { error: 'No hay una cuenta de Mercado Libre conectada' });
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(conn);
  } catch (err) {
    console.error('Error getting access token:', err);
    return respond(500, { error: 'No se pudo obtener token de acceso' });
  }

  const userId = conn.user_id;
  if (!userId) {
    return respond(400, { error: 'Conexión ML sin user_id' });
  }

  const searchUrl = `${ML_API}/users/${userId}/items/search?status=active&limit=50`;
  let itemsResponse: { results?: string[] } | string[];
  try {
    const res = await fetch(searchUrl, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`ML search failed (${res.status})`);
    }
    itemsResponse = await res.json();
  } catch (err) {
    console.error('Error fetching ML items:', err);
    return respond(500, { error: 'Error al obtener publicaciones de ML' });
  }

  const itemIds = Array.isArray(itemsResponse) ? itemsResponse : itemsResponse.results ?? [];
  const MAX_ITEMS = 25;
  const limitedIds = itemIds.slice(0, MAX_ITEMS);
  const truncated = itemIds.length > MAX_ITEMS;
  if (truncated) {
    console.warn(`Truncated ML items from ${itemIds.length} to ${MAX_ITEMS}`);
  }

  const results: ResultEntry[] = [];
  let imported = 0;
  let updated = 0;
  let errors = 0;

  for (const itemId of limitedIds) {
    try {
      const itemResp = await fetch(`${ML_API}/items/${itemId}`, {
        headers: { authorization: `Bearer ${accessToken}` },
      });
      if (!itemResp.ok) {
        throw new Error(`Failed to fetch item ${itemId} (${itemResp.status})`);
      }
      const item: MlItem = await itemResp.json();
      const attributes = item.attributes ?? [];

      let description: string | null = null;
      try {
        const descResp = await fetch(`${ML_API}/items/${itemId}/description`, {
          headers: { authorization: `Bearer ${accessToken}` },
        });
        if (descResp.ok) {
          const descData = await descResp.json();
          description = descData.plain_text ?? null;
        }
      } catch {
        // La descripción puede faltar (404) o fallar; se ignora
      }

      const title = item.title.length > 120 ? item.title.slice(0, 120) : item.title;
      const slug = slugify(title);

      const status = item.status === 'active' ? 'publicada' : 'borrador';

      let listingType: 'venta' | 'alquiler' = 'venta';
      const opAttr = attributes.find((a) => a.id === 'OPERATION');
      const opValue = opAttr?.value_name?.toLowerCase() ?? '';
      if (opValue.includes('alquiler')) {
        listingType = 'alquiler';
      } else if (opValue.includes('venta')) {
        listingType = 'venta';
      } else if (attributes.some((a) => (a.value_name?.toLowerCase() ?? '').includes('alquiler'))) {
        listingType = 'alquiler';
      }

      const price = item.price > 0 ? item.price : null;
      const currency = item.currency_id === 'ARS' ? 'ARS' : 'USD';
      const areaTotal = parseNumber(getAttributeValue(attributes, 'TOTAL_AREA'));
      const areaCovered = parseNumber(getAttributeValue(attributes, 'COVERED_AREA'));
      const bedrooms = parseNumber(getAttributeValue(attributes, 'ROOMS'));
      const bathrooms = parseNumber(getAttributeValue(attributes, 'BATHROOMS'));
      const garages = parseNumber(getAttributeValue(attributes, 'GARAGES'));
      const yearBuilt = parseNumber(getAttributeValue(attributes, 'YEAR_BUILT'));
      const floors = parseNumber(getAttributeValue(attributes, 'FLOORS'));

      const numericId = /^\d+$/.test(String(item.id)) ? Number(item.id) : null;
      const { data: existingMeta, error: metaError } = numericId !== null
        ? await supabase
            .from('property_ml_meta')
            .select('property_id, ml_item_id')
            .eq('ml_item_id', numericId)
            .maybeSingle()
        : await supabase
            .from('property_ml_meta')
            .select('property_id, ml_item_id')
            .filter('raw->>id', 'eq', String(item.id))
            .maybeSingle();

      let propertyId: string;
      let isUpdate = false;

      if (metaError) {
        throw metaError;
      }

      const propertyPayload = {
        title,
        description: description,
        status,
        listing_type: listingType,
        price,
        currency,
        address: null,
        area_total: areaTotal ?? null,
        area_covered: areaCovered ?? null,
        bedrooms,
        bathrooms,
        garages,
        year_built: yearBuilt,
        floors,
        amenities: [],
        featured: false,
        video_url: null,
      };

      if (existingMeta) {
        propertyId = existingMeta.property_id;
        isUpdate = true;
        const { error: propUpdateError } = await supabase
          .from('properties')
          .update(propertyPayload)
          .eq('id', propertyId);
        if (propUpdateError) throw propUpdateError;
      } else {
        let finalSlug = slug;
        let attempts = 0;
        const maxAttempts = 5;
        let insertedId: string | null = null;
        while (attempts < maxAttempts) {
          const { data: insertData, error: insertErr } = await supabase
            .from('properties')
            .insert({ ...propertyPayload, slug: finalSlug })
            .select('id')
            .maybeSingle();

          if (!insertErr && insertData) {
            insertedId = insertData.id;
            break;
          }
          if (insertErr?.code === '23505') {
            // Slug conflict, try again with incremental suffix
            attempts++;
            finalSlug = `${slug}-${item.id}-${attempts}`;
            continue;
          }
          throw insertErr;
        }
        if (!insertedId) throw new Error(`No se pudo insertar la propiedad (slug: ${slug})`);
        propertyId = insertedId;
      }

      const metaUpsert = {
        property_id: propertyId,
        ml_item_id: numericId,
        status: item.status,
        permalink: item.permalink ?? null,
        price: price ?? null,
        published_at: isUpdate ? undefined : new Date().toISOString(),
        last_sync_at: new Date().toISOString(),
        last_sync_status: 'success',
        raw: item,
      };

      const { error: metaUpsertError } = await supabase
        .from('property_ml_meta')
        .upsert(metaUpsert, { onConflict: 'property_id' });

      if (metaUpsertError) throw metaUpsertError;

      if (isUpdate) {
        await supabase.from('property_images').delete().eq('property_id', propertyId);
      }

      const imagesToInsert = (item.pictures ?? []).map((pic, index) => ({
        property_id: propertyId,
        url: pic.secure_url ?? pic.url,
        alt: '',
        position: index,
        is_cover: index === 0,
      }));

      if (imagesToInsert.length > 0) {
        const { error: imagesError } = await supabase
          .from('property_images')
          .insert(imagesToInsert);
        if (imagesError) throw imagesError;
      }

      results.push({
        item_id: item.id,
        status: isUpdate ? 'updated' : 'imported',
        error: null,
      });
      if (isUpdate) updated++;
      else imported++;
    } catch (err) {
      errors++;
      results.push({
        item_id: itemId,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
      console.error(`Error processing ML item ${itemId}:`, err);
    }
  }

  return respond(200, {
    processed: results.length,
    imported,
    updated,
    errors,
    results,
  });
});