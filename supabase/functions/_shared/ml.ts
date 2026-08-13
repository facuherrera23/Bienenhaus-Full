/**
 * Helpers de la API de Mercado Libre (OAuth + items).
 * Credenciales de la app (client_id/client_secret) se leen de BD encriptadas.
 */

import { decrypt, encrypt } from './crypto.ts';
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const ML_AUTH_URL = 'https://auth.mercadolibre.com.ar/authorization';
export const ML_TOKEN_URL = 'https://api.mercadolibre.com/oauth/token';
export const ML_API = 'https://api.mercadolibre.com';

/**
 * Fetch con timeout configurable usando AbortController.
 * Default: 15 segundos.
 */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs = 15000,
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeoutId);
    }
}

export interface MlTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
    user_id: number;
    refresh_token: string;
}

/**
 * Obtiene client_id y client_secret desencriptados desde la BD.
 * Requiere que el caller sea staff (validado en RPC get_ml_credentials).
 */
export async function getMlAppCredentials(
    supabase: SupabaseClient,
): Promise<{ clientId: string; clientSecret: string } | null> {
    const { data, error } = await supabase.rpc('get_ml_credentials');
    if (error || !data) {
        return null;
    }

    const { client_id_encrypted, client_id_iv, client_secret_encrypted, client_secret_iv } = data;

    if (!data.client_id_encrypted || !data.client_secret_encrypted) {
        return null;
    }

    const clientId = await decrypt(client_id_encrypted, client_id_iv);
    const clientSecret = await decrypt(client_secret_encrypted, client_secret_iv);

    return { clientId, clientSecret };
}

/**
 * Obtiene credenciales de la app ML. Primero intenta BD, fallback a env vars (legacy).
 * @deprecated Usar getMlAppCredentials(supabase) en nuevo código.
 */
export async function getMlAppCredentialsLegacy(
    supabase: SupabaseClient,
): Promise<{ clientId: string; clientSecret: string }> {
    // Primero intenta BD
    const fromDb = await getMlAppCredentials(supabase);
    if (fromDb) return fromDb;

    // Fallback a env vars (legacy)
    const clientId = Deno.env.get('ML_CLIENT_ID') ?? '';
    const clientSecret = Deno.env.get('ML_CLIENT_SECRET') ?? '';
    if (!clientId || !clientSecret) {
        throw new Error('ML_CLIENT_ID / ML_CLIENT_SECRET no configurados (ni en BD ni en env)');
    }
    return { clientId, clientSecret };
}

export async function exchangeCode(
    code: string,
    redirectUri: string,
    codeVerifier?: string,
    clientId?: string,
    clientSecret?: string,
): Promise<MlTokenResponse> {
    if (!clientId || !clientSecret) {
        throw new Error('clientId y clientSecret son requeridos');
    }

    const res = await fetchWithTimeout(ML_TOKEN_URL, {
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
            ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
        }),
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`ML token exchange falló (${res.status}): ${text.slice(0, 300)}`);
    }
    return JSON.parse(text) as MlTokenResponse;
}

export async function refreshToken(
    refresh: string,
    clientId: string,
    clientSecret: string,
): Promise<MlTokenResponse> {
    const res = await fetchWithTimeout(ML_TOKEN_URL, {
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

    // Obtener credenciales de la app (BD o env vars)
    const { clientId, clientSecret } = await getMlAppCredentialsLegacy(supabase);

    const tokens = await refreshToken(refresh, clientId, clientSecret);
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
    const res = await fetchWithTimeout(`${ML_API}/users/me`, {
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
    buying_mode: 'classified';
    listing_type_id?: string;
    condition: 'new' | 'used' | 'not_specified';
    pictures?: { source: string }[];
    channels?: 'marketplace'[];
    location?: { address_line?: string };
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
    idempotencyKey?: string,
): Promise<unknown> {
    const headers: Record<string, string> = {
        authorization: `Bearer ${accessToken}`,
        'content-type': 'application/json',
        accept: 'application/json',
    };
    if (init?.headers) {
        new Headers(init.headers).forEach((value, key) => {
            headers[key] = value;
        });
    }
    if (idempotencyKey) {
        headers['x-idempotency-key'] = idempotencyKey;
    }
    const res = await fetchWithTimeout(`${ML_API}${path}`, {
        ...init,
        headers,
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`ML API ${path} falló (${res.status}): ${text.slice(0, 300)}`);
    }
    return text ? (JSON.parse(text) as unknown) : null;
}

export function mlCreateItem(
    accessToken: string,
    payload: MlItemPayload,
    idempotencyKey?: string,
): Promise<unknown> {
    return api(
        '/items',
        accessToken,
        { method: 'POST', body: JSON.stringify(payload) },
        idempotencyKey,
    );
}

export function mlUpdateItem(
    accessToken: string,
    itemId: string,
    payload: Record<string, unknown>,
    idempotencyKey?: string,
): Promise<unknown> {
    return api(
        `/items/${itemId}`,
        accessToken,
        { method: 'PUT', body: JSON.stringify(payload) },
        idempotencyKey,
    );
}

export function mlSetDescription(
    accessToken: string,
    itemId: string,
    plainText: string,
    idempotencyKey?: string,
): Promise<unknown> {
    return api(
        `/items/${itemId}/description`,
        accessToken,
        {
            method: 'PUT',
            body: JSON.stringify({ plain_text: plainText.slice(0, 20000) }),
        },
        idempotencyKey,
    );
}

export function mlCloseItem(
    accessToken: string,
    itemId: string,
    idempotencyKey?: string,
): Promise<unknown> {
    return mlUpdateItem(accessToken, itemId, { status: 'closed' }, idempotencyKey);
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
    contentType: string,
    idempotencyKey?: string,
): Promise<MlPictureUploadResponse> {
    const formData = new FormData();
    const blob = new Blob([file], { type: 'image/jpeg' });
    formData.append('file', blob, fileName);

    const headers: Record<string, string> = {
        authorization: `Bearer ${accessToken}`,
    };
    if (idempotencyKey) {
        headers['x-idempotency-key'] = idempotencyKey;
    }

    const res = await fetchWithTimeout(`${ML_API}/pictures`, {
        method: 'POST',
        headers,
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
    files: Array<{ data: Uint8Array<ArrayBuffer>; name: string; type: string }>,
    idempotencyKey?: string,
): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
        try {
            const result = await mlUploadPicture(
                accessToken,
                file.data,
                file.name,
                file.type,
                idempotencyKey,
            );
            // Usar la primera variación (original) como URL principal
            const mainVariation =
                result.variations.find((v) => v.id === 'original') || result.variations[0];
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
    if (
        statusCode === 429 ||
        message.includes('rate limit') ||
        message.includes('too many requests')
    ) {
        return { type: MlErrorType.RATE_LIMIT, message, retryable: true, statusCode };
    }

    // Auth errors
    if (
        statusCode === 401 ||
        statusCode === 403 ||
        message.includes('invalid_token') ||
        message.includes('unauthorized') ||
        message.includes('access denied')
    ) {
        return { type: MlErrorType.AUTH_ERROR, message, retryable: false, statusCode };
    }

    // Validation errors (no retry)
    if (
        statusCode === 400 ||
        message.includes('validation') ||
        message.includes('invalid') ||
        message.includes('required')
    ) {
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
    if (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('ECONNREFUSED') ||
        message.includes('ETIMEDOUT')
    ) {
        return { type: MlErrorType.NETWORK_ERROR, message, retryable: true, statusCode };
    }

    return { type: MlErrorType.UNKNOWN, message, retryable: true, statusCode };
}

export function isRetryableError(err: unknown, statusCode?: number): boolean {
    const categorized = categorizeMlError(err, statusCode);
    return categorized.retryable;
}

// ============================================================
// Rate-limited API call wrapper with retry logic
// ============================================================

export type MlApiCallResult<T> =
    { ok: true; data: T } | { ok: false; error: string; retryAfter?: number };

/**
 * Ejecuta una llamada a la API de Mercado Libre con manejo de rate limiting.
 * Si recibe 429, extrae el header Retry-After (o usa 60s por defecto),
 * espera y reintenta una vez.
 */
export async function runMlApiCall<T>(
    accessToken: string,
    fn: () => Promise<T>,
    operationName: string,
): Promise<MlApiCallResult<T>> {
    try {
        const data = await fn();
        return { ok: true, data };
    } catch (err) {
        const categorized = categorizeMlError(err);
        console.error(`[ml-api] ${operationName} failed:`, err);

        if (categorized.type === MlErrorType.RATE_LIMIT) {
            // Try to extract Retry-After from error message or use default
            const retryAfterMatch = categorized.message.match(/retry[-\s]?after[:\s]+(\d+)/i);
            const retryAfter = retryAfterMatch ? parseInt(retryAfterMatch[1], 10) : 60;
            return { ok: false, error: categorized.message, retryAfter };
        }

        return { ok: false, error: categorized.message };
    }
}

/**
 * Ejecuta una llamada a la API de ML con reintento automático en caso de rate limit.
 * Versión de conveniencia que hace el wait + retry internamente.
 */
export async function runMlApiCallWithRetry<T>(
    accessToken: string,
    fn: () => Promise<T>,
    operationName: string,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
    const result = await runMlApiCall(accessToken, fn, operationName);

    if ('retryAfter' in result && result.retryAfter !== undefined) {
        console.log(
            `[ml-api] Rate limited on ${operationName}, waiting ${result.retryAfter}s before retry...`,
        );
        await new Promise((resolve) => setTimeout(resolve, result.retryAfter * 1000));
        return await runMlApiCall(accessToken, fn, `${operationName} (retry)`);
    }

    return result;
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
    const res = await fetchWithTimeout(`${ML_API}/sites/MLA/categories/MLA1459`, {
        headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`ML categories falló (${res.status})`);
    const data = await res.json();
    return data?.children_categories ?? [];
}

export async function fetchMlListingTypes(accessToken: string): Promise<MlListingType[]> {
    const res = await fetchWithTimeout(`${ML_API}/sites/MLA/listing_types`, {
        headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`ML listing_types falló (${res.status})`);
    const data = await res.json();
    return data?.map((lt: { id: string; name: string }) => ({ id: lt.id, name: lt.name })) ?? [];
}
