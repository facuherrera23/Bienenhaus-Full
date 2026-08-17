import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, jsonResponse, optionsResponse } from '../_shared/http.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE_KEY = Deno.env.get('SERVICE_ROLE_KEY')!;
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

const ADMIN_EMAIL = 'admin@bienenhaus.com';
const FROM_EMAIL = 'no-reply@bienenhaus.com.ar';

function escapeHtml(str: string): string {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

interface ContactPayload {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    website?: string;
}

function getClientIP(req: Request): string {
    return (
        req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        req.headers.get('x-real-ip') ||
        'unknown'
    );
}

async function checkRateLimit(supabase: SupabaseClient, ip: string): Promise<boolean> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 60 * 60 * 1000);

    const { data, error } = await supabase
        .from('rate_limit')
        .select('count')
        .eq('identifier', ip)
        .eq('action', 'contact_form')
        .gte('window_start', windowStart.toISOString())
        .maybeSingle();

    if (error) {
        console.error('Rate limit check error:', error);
        return true;
    }

    if (data && data.count >= 5) {
        return false;
    }

    if (data) {
        await supabase
            .from('rate_limit')
            .update({ count: data.count + 1 })
            .eq('id', data.id);
    } else {
        await supabase.from('rate_limit').insert({
            identifier: ip,
            action: 'contact_form',
            count: 1,
            window_start: now.toISOString(),
        });
    }
    return true;
}

async function sendEmail(to: string, subject: string, html: string) {
    if (!RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY no configurada');
    }
    const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Resend error: ${err}`);
    }
    return res.json();
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') return optionsResponse(req);
    if (req.method !== 'POST') return jsonResponse(405, { error: 'Method not allowed' }, req);

    const ip = getClientIP(req);
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const allowed = await checkRateLimit(supabase, ip);
    if (!allowed) {
        return jsonResponse(429, { error: 'Demasiados intentos. Intente en 1 hora.' }, req);
    }

    let payload: ContactPayload;
    try {
        payload = await req.json();
    } catch {
        return jsonResponse(400, { error: 'JSON inválido' }, req);
    }

    if (payload.website && payload.website.trim() !== '') {
        return jsonResponse(200, { ok: true }, req);
    }

    if (!payload.name?.trim() || !payload.email?.trim() || !payload.message?.trim()) {
        return jsonResponse(400, { error: 'Faltan campos requeridos' }, req);
    }

    const { error: leadError } = await supabase.from('leads').insert({
        name: payload.name.trim(),
        email: payload.email.trim(),
        phone: payload.phone?.trim() || null,
        subject: payload.subject.trim(),
        message: payload.message.trim(),
        source: 'landing_contact',
        status: 'new',
        metadata: { ip, user_agent: req.headers.get('user-agent') },
    });
    if (leadError) {
        console.error('Lead insert error:', leadError);
        const errorMsg = leadError.detail || leadError.message || 'Error guardando consulta';
        return jsonResponse(500, { error: errorMsg }, req);
    }

    const adminHtml = `
    <h2>Nueva consulta desde la web</h2>
    <p><strong>Nombre:</strong> ${escapeHtml(payload.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Teléfono:</strong> ${escapeHtml(payload.phone || '—')}</p>
    <p><strong>Asunto:</strong> ${escapeHtml(payload.subject)}</p>
    <p><strong>Mensaje:</strong></p>
    <p>${escapeHtml(payload.message).replace(/\n/g, '<br>')}</p>
    <hr>
    <p><small>IP: ${escapeHtml(ip)}</small></p>
  `;
    try {
        await sendEmail(ADMIN_EMAIL, `[BIENENHAUS] ${payload.subject}`, adminHtml);
    } catch (e) {
        console.error('Admin email error:', e);
    }

    const userHtml = `
    <h2>Gracias por contactarnos, ${escapeHtml(payload.name)}</h2>
    <p>Recibimos tu consulta: <strong>${escapeHtml(payload.subject)}</strong></p>
    <p>Te responderemos a la brevedad.</p>
    <hr>
    <p><small>BIENENHAUS PROPIEDADES</small></p>
  `;
    try {
        await sendEmail(payload.email, `Confirmación: ${payload.subject}`, userHtml);
    } catch (e) {
        console.error('User email error:', e);
    }

    return jsonResponse(200, { ok: true }, req);
});
