// Cache version constant - increment this to bust the cache
const CACHE_VERSION = "bible-pwa-v2";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll([
        // App shell
        "/",
        "/index.html",
        "/manifest.json",
        // Books manifest - needed for offline book list
        "/data/books.json",
        // Icons
        "/icons/icon-72x72.png",
        "/icons/icon-96x96.png",
        "/icons/icon-128x128.png",
        "/icons/icon-144x144.png",
        "/icons/icon-152x152.png",
        "/icons/icon-192x192.png",
        "/icons/icon-256x256.png",
        "/icons/icon-384x384.png",
        "/icons/icon-512x512.png"
      ]);
    })
  );
});

// Clean up old caches when activating a new Service Worker version
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_VERSION)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Smart caching strategy for Bible data files
  // Pattern: /data/*.json files (books and individual books)
  if (url.pathname.startsWith("/data/") && url.pathname.endsWith(".json")) {
    event.respondWith(cacheFirstWithNetworkUpdate(event.request));
  } else {
    // Default strategy for all other requests: cache-first with network fallback
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request);
      })
    );
  }
});

/**
 * Cache-first with network update strategy
 * Benefits for Bible data:
 * - Returns cached version immediately (fast load)
 * - Updates cache from network in background (fresh data for next visit)
 * - Works offline for previously accessed books
 * - Gracefully handles network failures
 */
function cacheFirstWithNetworkUpdate(request) {
  return caches.match(request).then((cached) => {
    // Return cached version immediately if available
    if (cached) {
      // Fetch from network in background to update cache
      fetchAndUpdateCache(request).catch(() => {
        // Network fetch failed - that's ok, we have the cached version
      });
      return cached;
    }

    // No cache - fetch from network and cache it
    return fetch(request).then((response) => {
      // Only cache successful responses
      if (!response || response.status !== 200) {
        return response;
      }

      const responseToCache = response.clone();
      caches.open(CACHE_VERSION).then((cache) => {
        cache.put(request, responseToCache);
      }).catch(() => {
        // Cache update failed - that's ok, we still have the response
      });

      return response;
    }).catch(() => {
      // Network fetch failed and no cache available
      // Return offline response
      return new Response("Offline - data not available", {
        status: 503,
        statusText: "Service Unavailable",
        headers: new Headers({ "Content-Type": "text/plain" })
      });
    });
  });
}

/**
 * Fetch from network and update cache in background
 * Errors are intentionally caught and ignored (doesn't break offline experience)
 */
function fetchAndUpdateCache(request) {
  return fetch(request).then((response) => {
    // Only cache successful responses
    if (!response || response.status !== 200) {
      return response;
    }

    const responseToCache = response.clone();
    return caches.open(CACHE_VERSION).then((cache) => {
      cache.put(request, responseToCache);
      return response;
    });
  });
}
