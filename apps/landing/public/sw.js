/**
 * Service Worker - PWA Support for BIENENHAUS Landing
 * Cache-first strategy for static assets, network-first for API
 */

const CACHE_NAME = 'bienenhaus-v1';
const STATIC_CACHE = 'bienenhaus-static-v1';
const DYNAMIC_CACHE = 'bienenhaus-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/pwa-512x512.png',
  '/assets/images/hero/hero-baner.png',
];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch - cache-first for static, network-first for dynamic
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome-extension, data: URLs
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Static assets - cache first
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // API calls - network first with fallback
  if (isApiCall(url)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Navigation - network first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, '/'));
    return;
  }

  // Default - network first
  event.respondWith(networkFirst(request));
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|avif|ico|woff2?|svg)$/i)
  );
}

function isApiCall(url) {
  return url.pathname.startsWith('/api/') || url.pathname.startsWith('/rest/');
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, fallbackUrl = null) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) return fallback;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Background sync for contact form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'contact-form-sync') {
    event.waitUntil(syncContactForms());
  }
});

async function syncContactForms() {
  const cache = await caches.open('contact-forms');
  const requests = await cache.keys();
  
  for (const request of requests) {
    try {
      await fetch(request);
      await cache.delete(request);
    } catch {
      // Keep in cache for next sync
    }
  }
}