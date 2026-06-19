// ============================================================
// SERVICE WORKER – Horizon Store
// Enables offline support, asset caching, and PWA functionality
// ============================================================

// ============================================================
// Cache name – increment this version to force cache updates
// ============================================================
const CACHE_NAME = 'horizon-store-v1';

// ============================================================
// List of core assets to cache on installation
// These files are required for the app to work offline
// ============================================================
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/src/css/style.css',
  '/src/js/app.js',
  '/src/js/store.js',
  '/src/js/validators.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;400;500;600;700;800&display=swap'
];

// ============================================================
// INSTALL EVENT – Cache core assets when the service worker is installed
// ============================================================
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Installation complete!');
        // Force the waiting service worker to become active
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// ============================================================
// ACTIVATE EVENT – Clean up old caches when a new version is activated
// ============================================================
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        // Keep only the current cache, delete all others
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activation complete!');
        // Claim all clients so the service worker takes control immediately
        return self.clients.claim();
      })
  );
});

// ============================================================
// FETCH EVENT – Serve cached assets when offline
// ============================================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // ============================================================
  // Skip cross-origin requests (e.g., external APIs, analytics)
  // Only handle same-origin requests and CDN resources
  // ============================================================
  const isSameOrigin = url.origin === self.location.origin;
  const isCDN =
    url.hostname === 'cdnjs.cloudflare.com' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com';

  if (!isSameOrigin && !isCDN) {
    // Let the browser handle non-cached requests normally
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // ============================================================
        // Cache-First strategy:
        // 1. Return cached response if available
        // 2. Otherwise, fetch from network and cache for future use
        // ============================================================
        if (cachedResponse) {
          console.log('[SW] Serving from cache:', event.request.url);
          return cachedResponse;
        }

        console.log('[SW] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Don't cache non-successful responses (e.g., 404, 500)
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }

            // Clone the response before using it (it's a stream)
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                try {
                  cache.put(event.request, responseToCache);
                } catch (error) {
                  console.warn('[SW] Could not cache:', event.request.url, error);
                }
              });

            return networkResponse;
          })
          .catch(() => {
            // ============================================================
            // Offline fallback – return a generic response if both cache and network fail
            // ============================================================
            console.warn('[SW] Offline – no response available for:', event.request.url);

            // Return a simple offline page for HTML requests
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return new Response(
                `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Offline – Horizon Store</title>
                  <style>
                    body { font-family: sans-serif; text-align: center; padding: 3rem; background: #0a0f1e; color: #eef2ff; }
                    h1 { color: #4f9eff; }
                    a { color: #4f9eff; }
                  </style>
                </head>
                <body>
                  <h1>📡 You are offline</h1>
                  <p>Horizon Store is not available right now. Please check your internet connection.</p>
                  <p><a href="/">↻ Try again</a></p>
                </body>
                </html>
                `,
                { status: 503, headers: { 'Content-Type': 'text/html' } }
              );
            }

            // For non-HTML requests, return a simple error response
            return new Response('Offline – try again later.', { status: 503 });
          });
      })
  );
});

// ============================================================
// MESSAGE EVENT – Handle messages from the main page (e.g., skip waiting)
// ============================================================
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ============================================================
// LOG: Service Worker started
// ============================================================
console.log('[SW] Service Worker initialized for Horizon Store');
