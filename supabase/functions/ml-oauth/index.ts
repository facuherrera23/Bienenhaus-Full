import { createClient } from 'npm:@supabase/supabase-js@2';
import { encrypt } from '../_shared/crypto.ts';
import { exchangeCode, getMe, runMlApiCallWithRetry } from '../_shared/ml.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } },
);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
};

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

interface OauthState {
  admin?: string;
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
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  if (req.method !== 'GET') {
    return respond(405, { error: 'Method not allowed' });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const stateRaw = url.searchParams.get('state');

  // El redirect_uri registrado en la app de ML puede ser /ml-oauth o
  // /ml-oauth/callback; en ambos casos ML redirige con code + state.
  if (!code || !stateRaw) {
    return respond(200, {
      message:
        'Endpoint OAuth de BIENENHAUS. Usá /callback con ?code= y ?state= para completar la conexión con Mercado Libre.',
    });
  }

  let state: OauthState = {};
  try {
    state = JSON.parse(atob(stateRaw)) as OauthState;
  } catch {
    state = {};
  }

const adminUrl = state.admin ?? Deno.env.get('ADMIN_BASE_URL') ?? '/admin';
    const validatedAdminUrl = isInternalUrl(adminUrl)
      ? adminUrl
      : (console.warn('[ml-oauth] blocked external redirect:', adminUrl), Deno.env.get('ADMIN_BASE_URL') ?? '/admin');
    const redirectUri = `${Deno.env.get('SUPABASE_URL') ?? ''}/functions/v1/ml-oauth`;

  try {
    const tokenResult = await runMlApiCallWithRetry('', () => exchangeCode(code, redirectUri), 'exchangeCode');
    if (!tokenResult.ok) {
      return respond(429, { error: tokenResult.error, retry_after: 60 });
    }
    const tokens = tokenResult.data;

    const userResult = await runMlApiCallWithRetry(tokens.access_token, () => getMe(tokens.access_token), 'getMe');
    if (!userResult.ok) {
      return respond(429, { error: userResult.error, retry_after: 60 });
    }
    const user = userResult.data;

    const access = await encrypt(tokens.access_token);
    const refresh = await encrypt(tokens.refresh_token);

    await supabase
      .from('ml_connection')
      .delete()
      .eq('provider', 'mercadolibre');

    const { error: insertError } = await supabase.from('ml_connection').insert({
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
    });

    if (insertError) {
      console.error('ml-oauth insert error', insertError);
      return respond(500, { error: 'No se pudo guardar la conexión' });
    }

    await supabase.from('activity_log').insert({
      action: 'ml_sync',
      entity_type: 'ml_connection',
      metadata: { event: 'oauth_connect', ml_user_id: user.id, nickname: user.nickname },
    });

    const redirectTarget = validatedAdminUrl.endsWith('/admin')
      ? `${validatedAdminUrl}/mercadolibre?ml=connected=1`
      : `${validatedAdminUrl}/admin/mercadolibre?ml=connected=1`;
    return Response.redirect(redirectTarget, 302);
  } catch (err) {
    console.error('ml-oauth error', err);
    return respond(500, { error: (err as Error).message });
  }
});
