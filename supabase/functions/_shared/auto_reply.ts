/**
 * Auto-respuesta para Mercado Libre: plantillas + envío de respuestas.
 * Compartido entre ml-webhook y ml-answer-question.
 */

import { decrypt, encrypt } from './crypto.ts';
import { ML_API, refreshToken } from './ml.ts';

export interface MlConnectionRow {
  id: string;
  access_token_encrypted: string;
  access_token_iv: string;
  refresh_token_encrypted: string;
  refresh_token_iv: string;
  token_expires_at: string;
}

/** Devuelve la plantilla activa para un trigger (p.ej. 'new_question'). */
export async function getActiveTemplate(
  supabase: any,
  trigger: string,
): Promise<{ id: number; message: string } | null> {
  const { data } = await supabase
    .from('ml_auto_reply_templates')
    .select('id, message')
    .eq('trigger', trigger)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1);
  return (data?.[0] ?? null) as { id: number; message: string } | null;
}

/**
 * Devuelve el access token de la conexión ML activa, refrescándolo si
 * está por expirar. Retorna null si no hay conexión activa.
 */
export async function getMlAccessToken(supabase: any): Promise<string | null> {
  const { data } = await supabase
    .from('ml_connection')
    .select(
      'id, access_token_encrypted, access_token_iv, refresh_token_encrypted, refresh_token_iv, token_expires_at',
    )
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1);

  const conn = (data?.[0] ?? null) as MlConnectionRow | null;
  if (!conn) return null;

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

/**
 * Responde una pregunta en Mercado Libre y marca la pregunta como respondida.
 * Lanza un error si ML rechaza la respuesta.
 */
export async function sendQuestionAnswer(
  supabase: any,
  questionId: string,
  text: string,
  accessToken: string,
): Promise<void> {
  const res = await fetch(`${ML_API}/answers?api_version=4`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      accept: 'application/json',
      'x-format-new': 'true',
    },
    body: JSON.stringify({ question_id: Number(questionId), text }),
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`ML answer falló (${res.status}): ${body.slice(0, 300)}`);
  }

  await supabase
    .from('ml_questions')
    .update({
      status: 'answered',
      answer_text: text,
      date_updated: new Date().toISOString(),
    })
    .eq('question_id', questionId);
}

/**
 * Envía un mensaje al comprador dentro del pack de una orden.
 * Endpoint de mensajes de órdenes de ML: POST /orders/{order_id}/messages.
 * Lanza un error si ML rechaza el envío.
 */
export async function sendOrderMessage(
  supabase: any,
  orderId: string,
  text: string,
  accessToken: string,
): Promise<void> {
  const params = new URLSearchParams({
    message: text,
    mark_as_read: 'true',
  });
  const res = await fetch(`${ML_API}/orders/${orderId}/messages?${params.toString()}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${accessToken}`,
      'content-type': 'application/json',
      accept: 'application/json',
    },
  });

  const body = await res.text();
  if (!res.ok) {
    throw new Error(`ML order message falló (${res.status}): ${body.slice(0, 300)}`);
  }

  await supabase
    .from('ml_orders')
    .update({ auto_reply_sent: new Date().toISOString() })
    .eq('order_id', orderId);
}
