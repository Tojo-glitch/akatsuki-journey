// ================================================================
//  Service Worker — TradeLog PWA (Phase 6)
//  - Cache-first for static assets
//  - Network-first for API calls
//  - Offline fallback page
// ================================================================

const CACHE_NAME   = 'tradelog-v3'
const STATIC_CACHE = 'tradelog-static-v3'

// Assets to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
]

// ── Install ──────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(PRECACHE_URLS))
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_NAME && k !== STATIC_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch ─────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // Supabase API calls → network-first, no cache
  if (url.hostname.includes('supabase.co')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'Offline — changes not saved' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    )
    return
  }

  // Google Fonts → cache-first
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached =>
          cached || fetch(event.request).then(resp => { cache.put(event.request, resp.clone()); return resp })
        )
      )
    )
    return
  }

  // App shell (HTML, JS, CSS) → cache-first, update in background
  if (event.request.mode === 'navigate' || url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(STATIC_CACHE).then(cache =>
        cache.match(event.request).then(cached => {
          const fetchPromise = fetch(event.request).then(resp => {
            if (resp.ok) cache.put(event.request, resp.clone())
            return resp
          })
          return cached || fetchPromise
        })
      )
    )
    return
  }

  // Default → network
  event.respondWith(fetch(event.request))
})