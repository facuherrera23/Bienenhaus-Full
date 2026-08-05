/**
 * Helpers de la API de Mercado Libre (OAuth + items).
 */

import { decrypt, encrypt } from './crypto.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const ML_AUTH_URL = 'https://auth.mercadolibre.com.ar/authorization';
export const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
export const ML_API = 'https://api.mercadolibre.com';

export interface MlTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  user_id: number;
  refresh_token: string;
}

function credentials(): { clientId: string; clientSecret: string } {
  const clientId = Deno.env.get('ML_CLIENT_ID') ?? '';
  const clientSecret = Deno.env.get('ML_CLIENT_SECRET') ?? '';
  if (!clientId || !clientSecret) {
    throw new Error('ML_CLIENT_ID / ML_CLIENT_SECRET no configurados');
  }
  return { clientId, clientSecret };
}

export async function exchangeCode(
  code: string,
  redirectUri: string,
): Promise<MlTokenResponse> {
  const { clientId, clientSecret } = credentials();
  const res = await fetch(ML_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ML token exchange falló (${res.status}): ${text.slice(0, 300)}`);
  }
  return JSON.parse(text) as MlTokenResponse;
}

export async function refreshToken(refresh: string): Promise<MlTokenResponse> {
  const { clientId, clientSecret } = credentials();
  const res = await fetch(ML_TOKEN_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
      accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refresh,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ML token refresh falló (${res.status}): ${text.slice(0, 300)}`);
  }
  return JSON.parse(text) as MlTokenResponse;
}

// ============================================================
// Access token de la conexión (descifrado + refresh automático)
// ============================================================

export interface MlConnectionRow {
  id: string;
  access_token_encrypted: string;
  access_token_iv: string;
  refresh_token_encrypted: string;
  refresh_token_iv: string;
  token_expires_at: string;
}

export async function getAccessToken(
  supabase: SupabaseClient,
  conn: MlConnectionRow,
): Promise<string> {
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

export interface MlUser {
  id: number;
  nickname: string;
  email: string;
  site_id: string;
}

export async function getMe(accessToken: string): Promise<MlUser> {
  const res = await fetch(`${ML_API}/users/me`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`ML getMe falló (${res.status})`);
  return await res.json();
}

export interface MlItemPayload {
  title: string;
  category_id?: string;
  price: number;
  currency_id: string;
  available_quantity: number;
  buying_mode: 'buy_it_now';
  listing_type_id?: string;
  condition: 'new' | 'used';
  pictures?: { source: string }[];
  description?: { plain_text: string };
  [key: string]: unknown;
}

export interface MlItem {
  id: string;
  title: string;
  price: number;
  status: string;
  permalink: string;
  listing_type_id: string;
  [key: string]: unknown;
}

async function api(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<unknown> {
  const res = await fetch(`${ML_API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      accept: 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ML API ${path} falló (${res.status}): ${text.slice(0, 300)}`);
  }
  return text ? (JSON.parse(text) as unknown) : null;
}

export function mlCreateItem(accessToken: string, payload: MlItemPayload): Promise<unknown> {
  return api('/items', accessToken, { method: 'POST', body: JSON.stringify(payload) });
}

export function mlUpdateItem(accessToken: string, itemId: string, payload: Record<string, unknown>): Promise<unknown> {
  return api(`/items/${itemId}`, accessToken, { method: 'PUT', body: JSON.stringify(payload) });
}

export function mlSetDescription(
  accessToken: string,
  itemId: string,
  plainText: string,
): Promise<unknown> {
  return api(`/items/${itemId}/description`, accessToken, {
    method: 'PUT',
    body: JSON.stringify({ plain_text: plainText.slice(0, 20000) }),
  });
}

export function mlCloseItem(accessToken: string, itemId: string): Promise<unknown> {
  return mlUpdateItem(accessToken, itemId, { status: 'closed' });
}

export function mlGetItem(accessToken: string, itemId: string): Promise<MlItem> {
  return api(`/items/${itemId}`, accessToken, { method: 'GET' }) as Promise<MlItem>;
}

// ============================================================
// Picture upload to Mercado Libre
// ============================================================

export interface MlPictureUploadResponse {
  id: string;
  max_size: number;
  max_width: number;
  max_height: number;
  quality: number;
  variations: Array<{ id: string; url: string; width: number; height: number; size: number }>;
}

export interface MlPicture {
  id: string;
  url: string;
  secure_url: string;
  size: string;
  max_size: number;
  width: number;
  height: number;
  quality: number;
  variation_id: string;
}

export async function mlUploadPicture(
  accessToken: string,
  file: Uint8Array<ArrayBuffer>,
  fileName: string,
  contentType: string
): Promise<MlPictureUploadResponse> {
  const formData = new FormData();
  const blob = new Blob([file], { type: 'image/jpeg' });
  formData.append('file', blob, fileName);

  const res = await fetch(`${ML_API}/pictures`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    body: formData,
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`ML picture upload falló (${res.status}): ${text.slice(0, 500)}`);
  }
  return JSON.parse(text) as MlPictureUploadResponse;
}

export async function mlUploadPictures(
  accessToken: string,
  files: Array<{ data: Uint8Array<ArrayBuffer>; name: string; type: string }>
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    try {
      const result = await mlUploadPicture(accessToken, file.data, file.name, file.type);
      // Usar la primera variación (original) como URL principal
      const mainVariation = result.variations.find(v => v.id === 'original') || result.variations[0];
      if (mainVariation?.url) {
        urls.push(mainVariation.url);
      }
    } catch (err) {
      console.error(`Error subiendo imagen ${file.name}:`, err);
      // Continuar con las demás imágenes
    }
  }
  return urls;
}

// ============================================================
// Error categorization for retry logic
// ============================================================

export enum MlErrorType {
  RATE_LIMIT = 'RATE_LIMIT',
  AUTH_ERROR = 'AUTH_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface MlError {
  type: MlErrorType;
  message: string;
  retryable: boolean;
  statusCode?: number;
  rawError?: unknown;
}

export function categorizeMlError(err: unknown, statusCode?: number): MlError {
  const message = err instanceof Error ? err.message : String(err);

  // Rate limiting
  if (statusCode === 429 || message.includes('rate limit') || message.includes('too many requests')) {
    return { type: MlErrorType.RATE_LIMIT, message, retryable: true, statusCode };
  }

  // Auth errors
  if (statusCode === 401 || statusCode === 403 || message.includes('invalid_token') || message.includes('unauthorized') || message.includes('access denied')) {
    return { type: MlErrorType.AUTH_ERROR, message, retryable: false, statusCode };
  }

  // Validation errors (no retry)
  if (statusCode === 400 || message.includes('validation') || message.includes('invalid') || message.includes('required')) {
    return { type: MlErrorType.VALIDATION_ERROR, message, retryable: false, statusCode };
  }

  // Not found
  if (statusCode === 404 || message.includes('not found')) {
    return { type: MlErrorType.NOT_FOUND, message, retryable: false, statusCode };
  }

  // Server errors (retryable)
  if (statusCode && statusCode >= 500) {
    return { type: MlErrorType.SERVER_ERROR, message, retryable: true, statusCode };
  }

  // Network errors
  if (message.includes('network') || message.includes('timeout') || message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT')) {
    return { type: MlErrorType.NETWORK_ERROR, message, retryable: true, statusCode };
  }

  return { type: MlErrorType.UNKNOWN, message, retryable: true, statusCode };
}

export function isRetryableError(err: unknown, statusCode?: number): boolean {
  const categorized = categorizeMlError(err, statusCode);
  return categorized.retryable;
}

// ============================================================
// Categories and Listing Types
// ============================================================

export interface MlCategory {
  id: string;
  name: string;
}

export interface MlListingType {
  id: string;
  name: string;
}

export async function fetchMlCategories(accessToken: string): Promise<MlCategory[]> {
  // Get categories for Argentina real estate (MLA1459 = Inmuebles)
  const res = await fetch(`${ML_API}/sites/MLA/categories/MLA1459`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`ML categories falló (${res.status})`);
  const data = await res.json();
  return data?.children_categories ?? [];
}

export async function fetchMlListingTypes(accessToken: string): Promise<MlListingType[]> {
  const res = await fetch(`${ML_API}/sites/MLA/listing_types`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`ML listing_types falló (${res.status})`);
  const data = await res.json();
  return data?.map((lt: { id: string; name: string }) => ({ id: lt.id, name: lt.name })) ?? [];
}
