import { createClient } from 'npm:@supabase/supabase-js@2';
import { getMlAccessToken, sendQuestionAnswer } from '../_shared/auto_reply.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY') ?? '';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type',
  'access-control-allow-methods': 'POST, OPTIONS',
};

function respond(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'content-type': 'application/json' },
  });
}

async function isAuthorized(req: Request): Promise<boolean> {
  const auth = req.headers.get('authorization') ?? '';
  if (!auth.startsWith('Bearer ')) return false;
  const token = auth.slice(7);
  // SERVICE_ROLE_KEY auth removed — use JWT + admin role only

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return respond(405, { error: 'Method not allowed' });
  if (!(await isAuthorized(req))) return respond(401, { error: 'No autorizado' });

  let payload: { question_id?: unknown; answer?: unknown };
  try {
    payload = await req.json();
  } catch {
    return respond(400, { error: 'JSON inválido' });
  }

  const questionId = typeof payload.question_id === 'string' ? payload.question_id.trim() : '';
  const answer = typeof payload.answer === 'string' ? payload.answer.trim() : '';
  if (!questionId || !answer) {
    return respond(400, { error: 'question_id y answer son requeridos' });
  }

  const { data: question } = await supabase
    .from('ml_questions')
    .select('id, question_id, status, ml_item_id')
    .eq('question_id', questionId)
    .maybeSingle();

  if (!question) {
    return respond(404, { error: 'Pregunta no encontrada' });
  }

  let accessToken: string;
  try {
    accessToken = (await getMlAccessToken(supabase)) ?? '';
    if (!accessToken) {
      return respond(400, { error: 'No hay una cuenta de Mercado Libre conectada' });
    }
  } catch (err) {
    return respond(500, { error: `No se pudo obtener token: ${(err as Error).message}` });
  }

  // Idempotency key based on question_id
  const idempotencyKey = `answer:${questionId}`;

  try {
    await sendQuestionAnswer(supabase, questionId, answer, accessToken, idempotencyKey);
  } catch (err) {
    return respond(502, { error: `No se pudo responder en Mercado Libre: ${(err as Error).message}` });
  }

  return respond(200, { ok: true, question_id: questionId });
});
