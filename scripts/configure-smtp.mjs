#!/usr/bin/env node
/**
 * Configura SMTP (y opcionalmente Site URL + Redirect URLs) en Supabase Cloud
 * vía Management API.
 *
 * Env requerido:
 *   SUPABASE_ACCESS_TOKEN   personal access token (sbp_...) — Settings → Access Tokens
 *   SUPABASE_PROJECT_REF    (default: rnldqiwwzhjnurkguihu)
 *
 * Env para SMTP (proveedor de email):
 *   SMTP_HOST=smtp.resend.com
 *   SMTP_PORT=465
 *   SMTP_USER=resend
 *   SMTP_PASS=re_xxxxxxxx
 *   SMTP_SENDER_NAME=BIENENHAUS
 *   SMTP_SENDER_EMAIL=no-reply@<tu-dominio>
 *
 * Env opcional (auth links):
 *   SITE_URL=https://<tu-dominio>
 *   REDIRECT_URLS="https://<tu-dominio>/admin/**"
 *
 * Uso:
 *   $env:SUPABASE_ACCESS_TOKEN="sbp_..." ; node scripts/configure-smtp.mjs
 */
import { get } from 'node:https';

const REF = process.env.SUPABASE_PROJECT_REF || 'rnldqiwwzhjnurkguihu';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN || '';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = get(
      {
        hostname: 'api.supabase.com',
        path,
        method,
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'content-type': 'application/json',
          ...(data ? { 'content-length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let out = '';
        res.on('data', (c) => (out += c));
        res.on('end', () => resolve({ status: res.statusCode, body: out }));
      },
    );
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

if (!TOKEN) {
  console.error('Falta SUPABASE_ACCESS_TOKEN (personal access token, prefijo sbp_).');
  process.exit(1);
}

const patch = {};

if (process.env.SMTP_HOST) {
  patch.smtp_enabled = true;
  patch.smtp_host = process.env.SMTP_HOST;
  patch.smtp_port = Number(process.env.SMTP_PORT || 587);
  patch.smtp_user = process.env.SMTP_USER || '';
  patch.smtp_pass = process.env.SMTP_PASS || '';
  patch.smtp_sender_name = process.env.SMTP_SENDER_NAME || '';
  patch.smtp_sender_email = process.env.SMTP_SENDER_EMAIL || '';
  patch.smtp_admin_email = process.env.SMTP_ADMIN_EMAIL || '';
}

if (process.env.SITE_URL) patch.site_url = process.env.SITE_URL;
// Nota: la Management API une las URLs del allow list con newline (no soporta
// listas). Solo se aplica la primera; URLs extra se agregan en el dashboard
// (Authentication → URL Configuration → Redirect URLs).
if (process.env.REDIRECT_URLS) {
  const first = process.env.REDIRECT_URLS.split(/\r?\n/).map((s) => s.trim()).filter(Boolean)[0];
  if (first) patch.uri_allow_list = first;
}

if (Object.keys(patch).length === 0) {
  console.error('No hay nada que configurar. Seteá SMTP_* y/o SITE_URL/REDIRECT_URLS.');
  process.exit(1);
}

console.log(`PATCH /v1/projects/${REF}/config/auth`, JSON.stringify(patch, null, 2).replace(/("smtp_(pass|user)": ")[^"]*(")/g, '$1***$3'));

const res = await request('PATCH', `/v1/projects/${REF}/config/auth`, patch);
if (res.status >= 200 && res.status < 300) {
  const cfg = JSON.parse(res.body);
  console.log('OK. smtp_enabled =', cfg.smtp_enabled, '| smtp_host =', cfg.smtp_host, '| sender =', cfg.smtp_sender_email, '| site_url =', cfg.site_url);
} else {
  console.error(`Fallo (${res.status}):`, res.body);
  process.exit(1);
}
