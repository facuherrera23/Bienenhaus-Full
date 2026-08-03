import { createClient } from 'npm:@supabase/supabase-js@2';
import { encrypt } from '../_shared/crypto.ts';
import { exchangeCode, getMe } from '../_shared/ml.ts';

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  if (req.method !== 'GET') {
    return respond(405, { error: 'Method not allowed' });
  }

  const url = new URL(req.url);
  const isCallback = url.pathname.endsWith('/callback');

  if (!isCallback) {
    return respond(200, {
      message:
        'Endpoint OAuth de BIENENHAUS. Usá /callback con ?code= y ?state= para completar la conexión con Mercado Libre.',
    });
  }

  const code = url.searchParams.get('code');
  const stateRaw = url.searchParams.get('state');

  if (!code || !stateRaw) {
    return respond(400, { error: 'Faltan los parámetros code o state' });
  }

  let state: OauthState = {};
  try {
    state = JSON.parse(atob(stateRaw)) as OauthState;
  } catch {
    state = {};
  }

  const adminUrl = state.admin ?? Deno.env.get('ADMIN_BASE_URL') ?? 'http://localhost:5173/admin';
  const redirectUri = `${Deno.env.get('SUPABASE_URL') ?? ''}/functions/v1/ml-oauth`;

  try {
    const tokens = await exchangeCode(code, redirectUri);
    const user = await getMe(tokens.access_token);

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

    const redirectTarget = adminUrl.endsWith('/admin')
      ? `${adminUrl}/mercadolibre?ml=connected=1`
      : `${adminUrl}/admin/mercadolibre?ml=connected=1`;
    return Response.redirect(redirectTarget, 302);
  } catch (err) {
    console.error('ml-oauth error', err);
    return respond(500, { error: (err as Error).message });
  }
});
