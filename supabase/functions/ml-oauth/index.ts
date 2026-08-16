import { createClient } from 'npm:@supabase/supabase-js@2';
import { encrypt } from '../_shared/crypto.ts';
import {
    exchangeCode,
    getMe,
    runMlApiCallWithRetry,
    getMlCredentials,
} from '../_shared/ml.ts';
import { jsonResponse, optionsResponse } from '../_shared/http.ts';
import { requireAdmin } from '../_shared/auth.ts';
import { rateLimitMiddleware } from '../_shared/rate-limit.ts';

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } },
);

interface OauthState {
    nonce: string;
    admin: string;
    exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
    let binary = '';
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(value: string): Uint8Array {
    const padded =
        value.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (value.length % 4)) % 4);
    const binary = atob(padded);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function sha256(value: string): Promise<Uint8Array> {
    return new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
}

async function hmac(value: string, clientSecret: string): Promise<string> {
    const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(clientSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    return base64UrlEncode(
        new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))),
    );
}

function timingSafeEqual(a: string, b: string): boolean {
    const ba = new TextEncoder().encode(a);
    const bb = new TextEncoder().encode(b);
    if (ba.length !== bb.length) return false;
    let diff = 0;
    for (let i = 0; i < ba.length; i++) diff |= ba[i] ^ bb[i];
    return diff === 0;
}

function isInternalUrl(url: string): boolean {
    const adminBaseUrl = Deno.env.get('ADMIN_BASE_URL');
    if (adminBaseUrl && url.startsWith(adminBaseUrl)) return true;
    const bienenhausAdminRegex = /^https?:\/\/([a-z0-9-]+\.)?bienenhaus\.com\.ar\/admin/;
    if (bienenhausAdminRegex.test(url)) return true;
    if (url.startsWith('/admin')) return true;
    return false;
}

Deno.serve(async (req) => {
    const respond = (status: number, body: Record<string, unknown>): Response =>
        jsonResponse(status, body, req);
    if (req.method === 'OPTIONS') return optionsResponse(req);

    // Rate limiting (aplica a POST y GET)
    const rl = await rateLimitMiddleware('ml-oauth', req);
    if (rl) return rl;

    if (req.method === 'POST') {
        let body: { action?: unknown; admin?: unknown };
        try {
            body = await req.json();
        } catch {
            return respond(400, { error: 'JSON inválido' });
        }
        if (body.action !== 'start') return respond(400, { error: 'Acción inválida' });
        const token = await requireAdmin(req, supabase);
        if (!token) return respond(401, { error: 'No autorizado' });
        const { data: userData } = await supabase.auth.getUser(token);
        const adminId = userData?.user?.id;
        if (!adminId) return respond(401, { error: 'No autorizado' });
        const adminUrl =
            typeof body.admin === 'string' && isInternalUrl(body.admin)
                ? body.admin
                : (Deno.env.get('ADMIN_BASE_URL') ?? '/admin');
        const nonce = crypto.randomUUID();
        const codeVerifier = base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)));
        const challenge = base64UrlEncode(await sha256(codeVerifier));
        const exp = Date.now() + 10 * 60 * 1000;

        // Obtener client_secret de BD para HMAC
        const { clientSecret } = await getMlCredentials(supabase);
        const signature = await hmac(`${nonce}|${adminId}|${exp}`, clientSecret);
        const state = base64UrlEncode(
            new TextEncoder().encode(
                JSON.stringify({ nonce, admin: adminUrl, exp, sig: signature }),
            ),
        );
        const { error } = await supabase
            .from('ml_oauth_states')
            .insert({
                nonce,
                admin_user_id: adminId,
                admin_url: adminUrl,
                code_verifier: codeVerifier,
                expires_at: new Date(exp).toISOString(),
            });
        if (error) return respond(500, { error: 'No se pudo iniciar OAuth' });
        return respond(200, { state, code_challenge: challenge });
    }

    if (req.method !== 'GET') {
        return respond(405, { error: 'Method not allowed' });
    }

    const url = new URL(req.url);

    // Purga no bloqueante de estados OAuth expirados (>10 min pasados su expiry)
    await supabase
        .from('ml_oauth_states')
        .delete()
        .lt('expires_at', new Date(Date.now() - 10 * 60 * 1000).toISOString());

    const code = url.searchParams.get('code');
    const stateRaw = url.searchParams.get('state');

    if (!code || !stateRaw) {
        return respond(200, {
            message:
                'Endpoint OAuth de BIENENHAUS. Usá /callback con ?code= y ?state= para completar la conexión con Mercado Libre.',
        });
    }

    let state: OauthState & { sig: string };
    try {
        state = JSON.parse(new TextDecoder().decode(base64UrlDecode(stateRaw))) as OauthState & {
            sig: string;
        };
        if (!state.nonce || !state.admin || !state.exp || !state.sig || state.exp < Date.now())
            throw new Error('state expirado');
        const { clientSecret } = await getMlCredentials(supabase);
        const expected = await hmac(
            `${state.nonce}|${(await supabase.from('ml_oauth_states').select('admin_user_id').eq('nonce', state.nonce).maybeSingle()).data?.admin_user_id ?? ''}|${state.exp}`,
            clientSecret,
        );
        if (!timingSafeEqual(expected, state.sig)) throw new Error('state inválido');
    } catch {
        return respond(400, { error: 'OAuth state inválido o expirado' });
    }

    const { data: oauthState, error: oauthStateError } = await supabase
        .from('ml_oauth_states')
        .select('admin_user_id, admin_url, code_verifier')
        .eq('nonce', state.nonce)
        .is('consumed_at', null)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
    if (oauthStateError || !oauthState)
        return respond(400, { error: 'OAuth state inválido o ya utilizado' });
    await supabase
        .from('ml_oauth_states')
        .update({ consumed_at: new Date().toISOString() })
        .eq('nonce', state.nonce);

    const adminUrl = oauthState.admin_url;
    const validatedAdminUrl = isInternalUrl(adminUrl)
        ? adminUrl
        : (console.warn('[ml-oauth] blocked external redirect:', adminUrl),
          Deno.env.get('ADMIN_BASE_URL') ?? '/admin');
    const redirectUri = `${Deno.env.get('SUPABASE_URL') ?? ''}/functions/v1/ml-oauth`;

    try {
        // Obtener client_id/client_secret para exchangeCode
        const { clientId, clientSecret } = await getMlCredentials(supabase);

        const tokenResult = await runMlApiCallWithRetry(
            '',
            () => exchangeCode(code, redirectUri, oauthState.code_verifier, clientId, clientSecret),
            'exchangeCode',
        );
        if (!tokenResult.ok) return respond(429, { error: tokenResult.error, retry_after: 60 });
        const tokens = tokenResult.data;

        const userResult = await runMlApiCallWithRetry(
            tokens.access_token,
            () => getMe(tokens.access_token),
            'getMe',
        );
        if (!userResult.ok) return respond(429, { error: userResult.error, retry_after: 60 });
        const user = userResult.data;

        const access = await encrypt(tokens.access_token);
        const refresh = await encrypt(tokens.refresh_token);

        const { data: insertedConnection, error: insertError } = await supabase
            .from('ml_connection')
            .insert({
                provider: 'mercadolibre',
                site_id: user.site_id ?? 'MLA',
                user_id: user.id,
                nickname: user.nickname,
                email: user.email,
                access_token_encrypted: access.data,
                access_token_iv: access.iv,
                refresh_token_encrypted: refresh.data,
                refresh_token_iv: refresh.iv,
                token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
                is_active: true,
            })
            .select('id')
            .single();

        if (insertError || !insertedConnection?.id) {
            console.error('ml-oauth insert error', insertError);
            return respond(500, { error: 'No se pudo guardar la conexión' });
        }

        await supabase
            .from('ml_connection')
            .update({ is_active: false })
            .eq('provider', 'mercadolibre')
            .neq('id', insertedConnection.id);

        await supabase.from('activity_log').insert({
            action: 'ml_sync',
            entity_type: 'ml_connection',
            metadata: { event: 'oauth_connect', ml_user_id: user.id, nickname: user.nickname },
        });

        const redirectTarget = validatedAdminUrl.endsWith('/admin')
            ? `${validatedAdminUrl}#/mercadolibre?ml=connected=1`
            : `${validatedAdminUrl}/admin#/mercadolibre?ml=connected=1`;
        return Response.redirect(redirectTarget, 302);
    } catch (err) {
        console.error('ml-oauth error', err);
        return respond(500, { error: (err as Error).message });
    }
});
