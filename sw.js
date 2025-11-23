// Cache version constant - increment this to bust the cache
const CACHE_VERSION = "bible-pwa-v4";

// Get the base path from the service worker's own location
// e.g., if SW is at /bible-pwa/sw.js, base is /bible-pwa/
const SW_PATH = self.location.pathname;
const BASE_PATH = SW_PATH.substring(0, SW_PATH.lastIndexOf('/') + 1);

console.log('Service Worker base path:', BASE_PATH);

// Complete list of Bible data files to precache
// All 66 Bible books + books.json manifest (67 total files)
const PRECACHE_FILES = [
  `${BASE_PATH}data/books.json`,
  `${BASE_PATH}data/1_Chronicles.json`,
  `${BASE_PATH}data/1_Corinthians.json`,
  `${BASE_PATH}data/1_John.json`,
  `${BASE_PATH}data/1_Kings.json`,
  `${BASE_PATH}data/1_Peter.json`,
  `${BASE_PATH}data/1_Samuel.json`,
  `${BASE_PATH}data/1_Thessalonians.json`,
  `${BASE_PATH}data/1_Timothy.json`,
  `${BASE_PATH}data/2_Chronicles.json`,
  `${BASE_PATH}data/2_Corinthians.json`,
  `${BASE_PATH}data/2_John.json`,
  `${BASE_PATH}data/2_Kings.json`,
  `${BASE_PATH}data/2_Peter.json`,
  `${BASE_PATH}data/2_Samuel.json`,
  `${BASE_PATH}data/2_Thessalonians.json`,
  `${BASE_PATH}data/2_Timothy.json`,
  `${BASE_PATH}data/3_John.json`,
  `${BASE_PATH}data/Acts.json`,
  `${BASE_PATH}data/Amos.json`,
  `${BASE_PATH}data/Colossians.json`,
  `${BASE_PATH}data/Daniel.json`,
  `${BASE_PATH}data/Deuteronomy.json`,
  `${BASE_PATH}data/Ecclesiastes.json`,
  `${BASE_PATH}data/Ephesians.json`,
  `${BASE_PATH}data/Esther.json`,
  `${BASE_PATH}data/Exodus.json`,
  `${BASE_PATH}data/Ezekiel.json`,
  `${BASE_PATH}data/Ezra.json`,
  `${BASE_PATH}data/Galatians.json`,
  `${BASE_PATH}data/Genesis.json`,
  `${BASE_PATH}data/Habakkuk.json`,
  `${BASE_PATH}data/Haggai.json`,
  `${BASE_PATH}data/Hebrews.json`,
  `${BASE_PATH}data/Hosea.json`,
  `${BASE_PATH}data/Isaiah.json`,
  `${BASE_PATH}data/James.json`,
  `${BASE_PATH}data/Jeremiah.json`,
  `${BASE_PATH}data/Job.json`,
  `${BASE_PATH}data/Joel.json`,
  `${BASE_PATH}data/John.json`,
  `${BASE_PATH}data/Jonah.json`,
  `${BASE_PATH}data/Joshua.json`,
  `${BASE_PATH}data/Jude.json`,
  `${BASE_PATH}data/Judges.json`,
  `${BASE_PATH}data/Lamentations.json`,
  `${BASE_PATH}data/Leviticus.json`,
  `${BASE_PATH}data/Luke.json`,
  `${BASE_PATH}data/Malachi.json`,
  `${BASE_PATH}data/Mark.json`,
  `${BASE_PATH}data/Matthew.json`,
  `${BASE_PATH}data/Micah.json`,
  `${BASE_PATH}data/Nahum.json`,
  `${BASE_PATH}data/Nehemiah.json`,
  `${BASE_PATH}data/Numbers.json`,
  `${BASE_PATH}data/Obadiah.json`,
  `${BASE_PATH}data/Philemon.json`,
  `${BASE_PATH}data/Philippians.json`,
  `${BASE_PATH}data/Proverbs.json`,
  `${BASE_PATH}data/Psalms.json`,
  `${BASE_PATH}data/Revelation.json`,
  `${BASE_PATH}data/Romans.json`,
  `${BASE_PATH}data/Ruth.json`,
  `${BASE_PATH}data/Song_of_Solomon.json`,
  `${BASE_PATH}data/Titus.json`,
  `${BASE_PATH}data/Zechariah.json`,
  `${BASE_PATH}data/Zephaniah.json`
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Combine app shell files with all precached Bible data files
      const allFiles = [
        // App shell
        `${BASE_PATH}`,
        `${BASE_PATH}index.html`,
        `${BASE_PATH}manifest.json`,
        // Icons
        `${BASE_PATH}icons/icon-72x72.png`,
        `${BASE_PATH}icons/icon-96x96.png`,
        `${BASE_PATH}icons/icon-128x128.png`,
        `${BASE_PATH}icons/icon-144x144.png`,
        `${BASE_PATH}icons/icon-152x152.png`,
        `${BASE_PATH}icons/icon-192x192.png`,
        `${BASE_PATH}icons/icon-256x256.png`,
        `${BASE_PATH}icons/icon-384x384.png`,
        `${BASE_PATH}icons/icon-512x512.png`,
        // Bible data files (66 books + books.json manifest = 67 files)
        ...PRECACHE_FILES
      ];

      return cache.addAll(allFiles);
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

  // Normalize pathname to handle both root and subpath deployments
  // Check if pathname contains /data/ and ends with .json
  const isDataRequest = url.pathname.includes('/data/') && url.pathname.endsWith('.json');

  console.log('SW fetch:', url.pathname, 'isData:', isDataRequest);

  // Smart caching strategy for Bible data files
  // Pattern: /data/*.json files (books and individual books)
  if (isDataRequest) {
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
