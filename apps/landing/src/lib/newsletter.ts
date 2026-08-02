import { SUPABASE_ANON_KEY, supabaseBaseUrl } from './supabase';

/**
 * Suscribe un email a la newsletter vía el RPC público subscribe_newsletter.
 * Devuelve true si es una suscripción nueva, false si el email ya existía.
 */
export async function subscribeNewsletter(
  email: string,
  honeypot = ''
): Promise<boolean> {
  const res = await fetch(`${supabaseBaseUrl}/rest/v1/rpc/subscribe_newsletter`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ p_email: email, p_source: 'landing_footer', p_hp: honeypot }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text ? `No se pudo suscribir (${res.status})` : `No se pudo suscribir (${res.status})`);
  }

  return (await res.json()) as boolean;
}
