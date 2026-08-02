#!/usr/bin/env node
/**
 * Servidor de demo de un solo puerto para BIENENHAUS.
 *
 *   GET/POST  /                      -> apps/landing/dist  (landing pública)
 *   GET/POST  /admin/...             -> apps/admin/dist    (panel admin, base /admin/)
 *   GET/POST  /rest/* /auth/* /storage/* /functions/* -> proxy a Supabase local
 *
 * Uso:  node scripts/serve.mjs   (puerto por defecto 5173, o via PORT=xxxx)
 */
import { createServer, request } from 'node:http';
import { existsSync } from 'node:fs';
import { stat, readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const LANDING = join(ROOT, 'apps', 'landing', 'dist');
const ADMIN = join(ROOT, 'apps', 'admin', 'dist');
const PORT = Number(process.env.PORT || 5173);
const SB_HOST = '127.0.0.1';
const SB_PORT = 54321;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

function isSupabasePath(p) {
  return /^\/(rest|auth|storage|functions)(\/|$)/.test(p);
}

function safePath(base, rel) {
  const target = normalize(join(base, rel));
  if (!target.startsWith(base)) return null;
  return target;
}

function decodePathname(p) {
  try {
    return decodeURIComponent(p);
  } catch {
    return p;
  }
}

async function sendFile(fp, res) {
  try {
    const info = await stat(fp);
    if (!info.isFile()) return false;
    const body = await readFile(fp);
    const type = MIME[extname(fp).toLowerCase()] ?? 'application/octet-stream';
    res.writeHead(200, {
      'content-type': type,
      'content-length': body.length,
      'cache-control': 'no-cache',
    });
    res.end(body);
    return true;
  } catch {
    return false;
  }
}

async function serveApp(root, relPath, res) {
  const decoded = decodePathname(relPath);
  const fp = safePath(root, decoded);
  if (fp && (await sendFile(fp, res))) return;

  const index = join(root, 'index.html');
  if (await sendFile(index, res)) return;

  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  res.end('Not found');
}

function proxySupabase(req, res) {
  const target = request(
    {
      host: SB_HOST,
      port: SB_PORT,
      path: req.url,
      method: req.method,
      headers: { ...req.headers, host: `${SB_HOST}:${SB_PORT}` },
    },
    (tres) => {
      res.writeHead(tres.statusCode ?? 502, {
        ...tres.headers,
        'access-control-allow-origin': '*',
      });
      tres.pipe(res);
    },
  );
  target.on('error', (err) => {
    res.writeHead(502, { 'content-type': 'text/plain; charset=utf-8' });
    res.end(`Bad gateway: ${err.message}`);
  });
  req.pipe(target);
}

function corsPreflight(res) {
  res.writeHead(204, {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'access-control-allow-headers': 'authorization, x-client-info, apikey, content-type, x-supabase-api-version',
    'access-control-max-age': '86400',
  });
  res.end();
}

const server = createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return corsPreflight(res);

  let pathname;
  try {
    pathname = new URL(req.url, 'http://localhost').pathname;
  } catch {
    res.writeHead(400);
    return res.end('Bad request');
  }

  if (isSupabasePath(pathname)) return proxySupabase(req, res);

  if (pathname === '/admin') {
    res.writeHead(302, { location: '/admin/' });
    return res.end();
  }

  if (pathname.startsWith('/admin/')) {
    return serveApp(ADMIN, pathname.slice('/admin/'.length), res);
  }

  return serveApp(LANDING, pathname, res);
});

server.on('connection', (socket) => socket.setTimeout(120000));

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[bienenhaus] demo server en http://localhost:${PORT}`);
  console.log(`[bienenhaus] landing:  http://localhost:${PORT}/`);
  console.log(`[bienenhaus] admin:    http://localhost:${PORT}/admin/`);
  console.log(`[bienenhaus] proxy:    /rest /auth /storage /functions -> ${SB_HOST}:${SB_PORT}`);
});
