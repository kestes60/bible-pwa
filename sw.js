// Cache version constant - increment this to bust the cache
const CACHE_VERSION = "bible-pwa-v31";

// Get the base path from the service worker's own location
// e.g., if SW is at /bible-pwa/sw.js, base is /bible-pwa/
const SW_PATH = self.location.pathname;
const BASE_PATH = SW_PATH.substring(0, SW_PATH.lastIndexOf('/') + 1);

console.log('Service Worker base path:', BASE_PATH);

// WEB: 66 books + books.json = 67 files
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

// KRV (Korean) Bible data files to precache (67 files)
const KRV_PRECACHE_FILES = [
  `${BASE_PATH}data/krv/books.json`,
  `${BASE_PATH}data/krv/1_Chronicles.json`,
  `${BASE_PATH}data/krv/1_Corinthians.json`,
  `${BASE_PATH}data/krv/1_John.json`,
  `${BASE_PATH}data/krv/1_Kings.json`,
  `${BASE_PATH}data/krv/1_Peter.json`,
  `${BASE_PATH}data/krv/1_Samuel.json`,
  `${BASE_PATH}data/krv/1_Thessalonians.json`,
  `${BASE_PATH}data/krv/1_Timothy.json`,
  `${BASE_PATH}data/krv/2_Chronicles.json`,
  `${BASE_PATH}data/krv/2_Corinthians.json`,
  `${BASE_PATH}data/krv/2_John.json`,
  `${BASE_PATH}data/krv/2_Kings.json`,
  `${BASE_PATH}data/krv/2_Peter.json`,
  `${BASE_PATH}data/krv/2_Samuel.json`,
  `${BASE_PATH}data/krv/2_Thessalonians.json`,
  `${BASE_PATH}data/krv/2_Timothy.json`,
  `${BASE_PATH}data/krv/3_John.json`,
  `${BASE_PATH}data/krv/Acts.json`,
  `${BASE_PATH}data/krv/Amos.json`,
  `${BASE_PATH}data/krv/Colossians.json`,
  `${BASE_PATH}data/krv/Daniel.json`,
  `${BASE_PATH}data/krv/Deuteronomy.json`,
  `${BASE_PATH}data/krv/Ecclesiastes.json`,
  `${BASE_PATH}data/krv/Ephesians.json`,
  `${BASE_PATH}data/krv/Esther.json`,
  `${BASE_PATH}data/krv/Exodus.json`,
  `${BASE_PATH}data/krv/Ezekiel.json`,
  `${BASE_PATH}data/krv/Ezra.json`,
  `${BASE_PATH}data/krv/Galatians.json`,
  `${BASE_PATH}data/krv/Genesis.json`,
  `${BASE_PATH}data/krv/Habakkuk.json`,
  `${BASE_PATH}data/krv/Haggai.json`,
  `${BASE_PATH}data/krv/Hebrews.json`,
  `${BASE_PATH}data/krv/Hosea.json`,
  `${BASE_PATH}data/krv/Isaiah.json`,
  `${BASE_PATH}data/krv/James.json`,
  `${BASE_PATH}data/krv/Jeremiah.json`,
  `${BASE_PATH}data/krv/Job.json`,
  `${BASE_PATH}data/krv/Joel.json`,
  `${BASE_PATH}data/krv/John.json`,
  `${BASE_PATH}data/krv/Jonah.json`,
  `${BASE_PATH}data/krv/Joshua.json`,
  `${BASE_PATH}data/krv/Jude.json`,
  `${BASE_PATH}data/krv/Judges.json`,
  `${BASE_PATH}data/krv/Lamentations.json`,
  `${BASE_PATH}data/krv/Leviticus.json`,
  `${BASE_PATH}data/krv/Luke.json`,
  `${BASE_PATH}data/krv/Malachi.json`,
  `${BASE_PATH}data/krv/Mark.json`,
  `${BASE_PATH}data/krv/Matthew.json`,
  `${BASE_PATH}data/krv/Micah.json`,
  `${BASE_PATH}data/krv/Nahum.json`,
  `${BASE_PATH}data/krv/Nehemiah.json`,
  `${BASE_PATH}data/krv/Numbers.json`,
  `${BASE_PATH}data/krv/Obadiah.json`,
  `${BASE_PATH}data/krv/Philemon.json`,
  `${BASE_PATH}data/krv/Philippians.json`,
  `${BASE_PATH}data/krv/Proverbs.json`,
  `${BASE_PATH}data/krv/Psalms.json`,
  `${BASE_PATH}data/krv/Revelation.json`,
  `${BASE_PATH}data/krv/Romans.json`,
  `${BASE_PATH}data/krv/Ruth.json`,
  `${BASE_PATH}data/krv/Song_of_Solomon.json`,
  `${BASE_PATH}data/krv/Titus.json`,
  `${BASE_PATH}data/krv/Zechariah.json`,
  `${BASE_PATH}data/krv/Zephaniah.json`
];

// KJV Bible data files to precache (67 files)
const KJV_PRECACHE_FILES = [
  `${BASE_PATH}data/kjv/books.json`,
  `${BASE_PATH}data/kjv/1_Chronicles.json`,
  `${BASE_PATH}data/kjv/1_Corinthians.json`,
  `${BASE_PATH}data/kjv/1_John.json`,
  `${BASE_PATH}data/kjv/1_Kings.json`,
  `${BASE_PATH}data/kjv/1_Peter.json`,
  `${BASE_PATH}data/kjv/1_Samuel.json`,
  `${BASE_PATH}data/kjv/1_Thessalonians.json`,
  `${BASE_PATH}data/kjv/1_Timothy.json`,
  `${BASE_PATH}data/kjv/2_Chronicles.json`,
  `${BASE_PATH}data/kjv/2_Corinthians.json`,
  `${BASE_PATH}data/kjv/2_John.json`,
  `${BASE_PATH}data/kjv/2_Kings.json`,
  `${BASE_PATH}data/kjv/2_Peter.json`,
  `${BASE_PATH}data/kjv/2_Samuel.json`,
  `${BASE_PATH}data/kjv/2_Thessalonians.json`,
  `${BASE_PATH}data/kjv/2_Timothy.json`,
  `${BASE_PATH}data/kjv/3_John.json`,
  `${BASE_PATH}data/kjv/Acts.json`,
  `${BASE_PATH}data/kjv/Amos.json`,
  `${BASE_PATH}data/kjv/Colossians.json`,
  `${BASE_PATH}data/kjv/Daniel.json`,
  `${BASE_PATH}data/kjv/Deuteronomy.json`,
  `${BASE_PATH}data/kjv/Ecclesiastes.json`,
  `${BASE_PATH}data/kjv/Ephesians.json`,
  `${BASE_PATH}data/kjv/Esther.json`,
  `${BASE_PATH}data/kjv/Exodus.json`,
  `${BASE_PATH}data/kjv/Ezekiel.json`,
  `${BASE_PATH}data/kjv/Ezra.json`,
  `${BASE_PATH}data/kjv/Galatians.json`,
  `${BASE_PATH}data/kjv/Genesis.json`,
  `${BASE_PATH}data/kjv/Habakkuk.json`,
  `${BASE_PATH}data/kjv/Haggai.json`,
  `${BASE_PATH}data/kjv/Hebrews.json`,
  `${BASE_PATH}data/kjv/Hosea.json`,
  `${BASE_PATH}data/kjv/Isaiah.json`,
  `${BASE_PATH}data/kjv/James.json`,
  `${BASE_PATH}data/kjv/Jeremiah.json`,
  `${BASE_PATH}data/kjv/Job.json`,
  `${BASE_PATH}data/kjv/Joel.json`,
  `${BASE_PATH}data/kjv/John.json`,
  `${BASE_PATH}data/kjv/Jonah.json`,
  `${BASE_PATH}data/kjv/Joshua.json`,
  `${BASE_PATH}data/kjv/Jude.json`,
  `${BASE_PATH}data/kjv/Judges.json`,
  `${BASE_PATH}data/kjv/Lamentations.json`,
  `${BASE_PATH}data/kjv/Leviticus.json`,
  `${BASE_PATH}data/kjv/Luke.json`,
  `${BASE_PATH}data/kjv/Malachi.json`,
  `${BASE_PATH}data/kjv/Mark.json`,
  `${BASE_PATH}data/kjv/Matthew.json`,
  `${BASE_PATH}data/kjv/Micah.json`,
  `${BASE_PATH}data/kjv/Nahum.json`,
  `${BASE_PATH}data/kjv/Nehemiah.json`,
  `${BASE_PATH}data/kjv/Numbers.json`,
  `${BASE_PATH}data/kjv/Obadiah.json`,
  `${BASE_PATH}data/kjv/Philemon.json`,
  `${BASE_PATH}data/kjv/Philippians.json`,
  `${BASE_PATH}data/kjv/Proverbs.json`,
  `${BASE_PATH}data/kjv/Psalms.json`,
  `${BASE_PATH}data/kjv/Revelation.json`,
  `${BASE_PATH}data/kjv/Romans.json`,
  `${BASE_PATH}data/kjv/Ruth.json`,
  `${BASE_PATH}data/kjv/Song_of_Solomon.json`,
  `${BASE_PATH}data/kjv/Titus.json`,
  `${BASE_PATH}data/kjv/Zechariah.json`,
  `${BASE_PATH}data/kjv/Zephaniah.json`
];

// RVR (Spanish) Bible data files to precache (67 files)
const RVR_PRECACHE_FILES = [
  `${BASE_PATH}data/rvr/books.json`,
  `${BASE_PATH}data/rvr/1_Chronicles.json`,
  `${BASE_PATH}data/rvr/1_Corinthians.json`,
  `${BASE_PATH}data/rvr/1_John.json`,
  `${BASE_PATH}data/rvr/1_Kings.json`,
  `${BASE_PATH}data/rvr/1_Peter.json`,
  `${BASE_PATH}data/rvr/1_Samuel.json`,
  `${BASE_PATH}data/rvr/1_Thessalonians.json`,
  `${BASE_PATH}data/rvr/1_Timothy.json`,
  `${BASE_PATH}data/rvr/2_Chronicles.json`,
  `${BASE_PATH}data/rvr/2_Corinthians.json`,
  `${BASE_PATH}data/rvr/2_John.json`,
  `${BASE_PATH}data/rvr/2_Kings.json`,
  `${BASE_PATH}data/rvr/2_Peter.json`,
  `${BASE_PATH}data/rvr/2_Samuel.json`,
  `${BASE_PATH}data/rvr/2_Thessalonians.json`,
  `${BASE_PATH}data/rvr/2_Timothy.json`,
  `${BASE_PATH}data/rvr/3_John.json`,
  `${BASE_PATH}data/rvr/Acts.json`,
  `${BASE_PATH}data/rvr/Amos.json`,
  `${BASE_PATH}data/rvr/Colossians.json`,
  `${BASE_PATH}data/rvr/Daniel.json`,
  `${BASE_PATH}data/rvr/Deuteronomy.json`,
  `${BASE_PATH}data/rvr/Ecclesiastes.json`,
  `${BASE_PATH}data/rvr/Ephesians.json`,
  `${BASE_PATH}data/rvr/Esther.json`,
  `${BASE_PATH}data/rvr/Exodus.json`,
  `${BASE_PATH}data/rvr/Ezekiel.json`,
  `${BASE_PATH}data/rvr/Ezra.json`,
  `${BASE_PATH}data/rvr/Galatians.json`,
  `${BASE_PATH}data/rvr/Genesis.json`,
  `${BASE_PATH}data/rvr/Habakkuk.json`,
  `${BASE_PATH}data/rvr/Haggai.json`,
  `${BASE_PATH}data/rvr/Hebrews.json`,
  `${BASE_PATH}data/rvr/Hosea.json`,
  `${BASE_PATH}data/rvr/Isaiah.json`,
  `${BASE_PATH}data/rvr/James.json`,
  `${BASE_PATH}data/rvr/Jeremiah.json`,
  `${BASE_PATH}data/rvr/Job.json`,
  `${BASE_PATH}data/rvr/Joel.json`,
  `${BASE_PATH}data/rvr/John.json`,
  `${BASE_PATH}data/rvr/Jonah.json`,
  `${BASE_PATH}data/rvr/Joshua.json`,
  `${BASE_PATH}data/rvr/Jude.json`,
  `${BASE_PATH}data/rvr/Judges.json`,
  `${BASE_PATH}data/rvr/Lamentations.json`,
  `${BASE_PATH}data/rvr/Leviticus.json`,
  `${BASE_PATH}data/rvr/Luke.json`,
  `${BASE_PATH}data/rvr/Malachi.json`,
  `${BASE_PATH}data/rvr/Mark.json`,
  `${BASE_PATH}data/rvr/Matthew.json`,
  `${BASE_PATH}data/rvr/Micah.json`,
  `${BASE_PATH}data/rvr/Nahum.json`,
  `${BASE_PATH}data/rvr/Nehemiah.json`,
  `${BASE_PATH}data/rvr/Numbers.json`,
  `${BASE_PATH}data/rvr/Obadiah.json`,
  `${BASE_PATH}data/rvr/Philemon.json`,
  `${BASE_PATH}data/rvr/Philippians.json`,
  `${BASE_PATH}data/rvr/Proverbs.json`,
  `${BASE_PATH}data/rvr/Psalms.json`,
  `${BASE_PATH}data/rvr/Revelation.json`,
  `${BASE_PATH}data/rvr/Romans.json`,
  `${BASE_PATH}data/rvr/Ruth.json`,
  `${BASE_PATH}data/rvr/Song_of_Solomon.json`,
  `${BASE_PATH}data/rvr/Titus.json`,
  `${BASE_PATH}data/rvr/Zechariah.json`,
  `${BASE_PATH}data/rvr/Zephaniah.json`
];

// CUV (Chinese) Bible data files to precache (67 files)
const CUV_PRECACHE_FILES = [
  `${BASE_PATH}data/cuv/books.json`,
  `${BASE_PATH}data/cuv/1_Chronicles.json`,
  `${BASE_PATH}data/cuv/1_Corinthians.json`,
  `${BASE_PATH}data/cuv/1_John.json`,
  `${BASE_PATH}data/cuv/1_Kings.json`,
  `${BASE_PATH}data/cuv/1_Peter.json`,
  `${BASE_PATH}data/cuv/1_Samuel.json`,
  `${BASE_PATH}data/cuv/1_Thessalonians.json`,
  `${BASE_PATH}data/cuv/1_Timothy.json`,
  `${BASE_PATH}data/cuv/2_Chronicles.json`,
  `${BASE_PATH}data/cuv/2_Corinthians.json`,
  `${BASE_PATH}data/cuv/2_John.json`,
  `${BASE_PATH}data/cuv/2_Kings.json`,
  `${BASE_PATH}data/cuv/2_Peter.json`,
  `${BASE_PATH}data/cuv/2_Samuel.json`,
  `${BASE_PATH}data/cuv/2_Thessalonians.json`,
  `${BASE_PATH}data/cuv/2_Timothy.json`,
  `${BASE_PATH}data/cuv/3_John.json`,
  `${BASE_PATH}data/cuv/Acts.json`,
  `${BASE_PATH}data/cuv/Amos.json`,
  `${BASE_PATH}data/cuv/Colossians.json`,
  `${BASE_PATH}data/cuv/Daniel.json`,
  `${BASE_PATH}data/cuv/Deuteronomy.json`,
  `${BASE_PATH}data/cuv/Ecclesiastes.json`,
  `${BASE_PATH}data/cuv/Ephesians.json`,
  `${BASE_PATH}data/cuv/Esther.json`,
  `${BASE_PATH}data/cuv/Exodus.json`,
  `${BASE_PATH}data/cuv/Ezekiel.json`,
  `${BASE_PATH}data/cuv/Ezra.json`,
  `${BASE_PATH}data/cuv/Galatians.json`,
  `${BASE_PATH}data/cuv/Genesis.json`,
  `${BASE_PATH}data/cuv/Habakkuk.json`,
  `${BASE_PATH}data/cuv/Haggai.json`,
  `${BASE_PATH}data/cuv/Hebrews.json`,
  `${BASE_PATH}data/cuv/Hosea.json`,
  `${BASE_PATH}data/cuv/Isaiah.json`,
  `${BASE_PATH}data/cuv/James.json`,
  `${BASE_PATH}data/cuv/Jeremiah.json`,
  `${BASE_PATH}data/cuv/Job.json`,
  `${BASE_PATH}data/cuv/Joel.json`,
  `${BASE_PATH}data/cuv/John.json`,
  `${BASE_PATH}data/cuv/Jonah.json`,
  `${BASE_PATH}data/cuv/Joshua.json`,
  `${BASE_PATH}data/cuv/Jude.json`,
  `${BASE_PATH}data/cuv/Judges.json`,
  `${BASE_PATH}data/cuv/Lamentations.json`,
  `${BASE_PATH}data/cuv/Leviticus.json`,
  `${BASE_PATH}data/cuv/Luke.json`,
  `${BASE_PATH}data/cuv/Malachi.json`,
  `${BASE_PATH}data/cuv/Mark.json`,
  `${BASE_PATH}data/cuv/Matthew.json`,
  `${BASE_PATH}data/cuv/Micah.json`,
  `${BASE_PATH}data/cuv/Nahum.json`,
  `${BASE_PATH}data/cuv/Nehemiah.json`,
  `${BASE_PATH}data/cuv/Numbers.json`,
  `${BASE_PATH}data/cuv/Obadiah.json`,
  `${BASE_PATH}data/cuv/Philemon.json`,
  `${BASE_PATH}data/cuv/Philippians.json`,
  `${BASE_PATH}data/cuv/Proverbs.json`,
  `${BASE_PATH}data/cuv/Psalms.json`,
  `${BASE_PATH}data/cuv/Revelation.json`,
  `${BASE_PATH}data/cuv/Romans.json`,
  `${BASE_PATH}data/cuv/Ruth.json`,
  `${BASE_PATH}data/cuv/Song_of_Solomon.json`,
  `${BASE_PATH}data/cuv/Titus.json`,
  `${BASE_PATH}data/cuv/Zechariah.json`,
  `${BASE_PATH}data/cuv/Zephaniah.json`
];

// Main install handler that does the precaching
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      // Combine app shell files with all precached Bible data files
      const allFiles = [
        // App shell
        `${BASE_PATH}`,
        `${BASE_PATH}index.html`,
        `${BASE_PATH}manifest.json`,
        // Stylesheets and scripts
        `${BASE_PATH}styles/main.css`,
        `${BASE_PATH}scripts/config/versions.js`,
        `${BASE_PATH}scripts/app.js`,
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
        // Bible data files (WEB)
        ...PRECACHE_FILES,
        // KJV Bible data files
        ...KJV_PRECACHE_FILES,
        // KRV (Korean) Bible data files
        ...KRV_PRECACHE_FILES,
        // RVR (Spanish) Bible data files
        ...RVR_PRECACHE_FILES,
        // CUV (Chinese) Bible data files
        ...CUV_PRECACHE_FILES
      ];

      return cache.addAll(allFiles);
    }).then(() => {
      // Activate immediately without waiting for other tabs to close
      self.skipWaiting();
    })
  );
});

// ✅ Add this snippet *right after* the main install handler
self.addEventListener('install', () => {
  console.log('SW install complete, cache version:', CACHE_VERSION);
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
    }).then(() => {
      // Claim all clients immediately so new SW takes control
      return clients.claim();
    })
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  const pathname = url.pathname;

  // Determine request type
  const isNavigationRequest = event.request.mode === 'navigate' ||
                             pathname === BASE_PATH ||
                             pathname === `${BASE_PATH}index.html` ||
                             pathname === '/';

  const isDataRequest = pathname.includes('/data/') && pathname.endsWith('.json');

  console.log('SW fetch:', pathname, 'nav:', isNavigationRequest, 'data:', isDataRequest);

  // 1. NAVIGATION REQUESTS (HTML shell) - network-first strategy
  // Try network first for fresh content, fall back to cache for offline
  if (isNavigationRequest) {
    event.respondWith(networkFirstStrategy(event.request));
  }
  // 2. BIBLE DATA REQUESTS - cache-first with network update
  // Return cached version immediately, update in background
  else if (isDataRequest) {
    event.respondWith(cacheFirstWithNetworkUpdate(event.request));
  }
  // 3. STATIC ASSETS (images, etc.) - cache-first
  // Return cached version, no network update
  else {
    event.respondWith(cacheFirstStrategy(event.request));
  }
});

/**
 * Network-first strategy for HTML shell (index.html, navigation)
 * Tries to fetch from network first for fresh content.
 * On success: updates cache and returns fresh response
 * On failure: falls back to cached version for offline support
 */
function networkFirstStrategy(request) {
  return fetch(request).then((networkResponse) => {
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const responseToCache = networkResponse.clone();
      caches.open(CACHE_VERSION).then((cache) => {
        cache.put(request, responseToCache);
      }).catch(() => {
        // Cache update failed - still return network response
      });
    }
    return networkResponse;
  }).catch(() => {
    // Network failed - try cache
    return caches.match(request).then((cached) => {
      if (cached) return cached;
      // No network and no cache - offline response
      return new Response("Offline - please check your connection", {
        status: 503,
        statusText: "Service Unavailable",
        headers: new Headers({ "Content-Type": "text/plain" })
      });
    });
  });
}

/**
 * Cache-first strategy for static assets (images, icons)
 * Returns cached version immediately without network check.
 * No background updates.
 */
function cacheFirstStrategy(request) {
  return caches.match(request).then((cached) => {
    if (cached) return cached;
    // Not in cache - fetch and cache it
    return fetch(request).then((response) => {
      if (!response || response.status !== 200) {
        return response;
      }
      const responseToCache = response.clone();
      caches.open(CACHE_VERSION).then((cache) => {
        cache.put(request, responseToCache);
      }).catch(() => {
        // Cache update failed - still return network response
      });
      return response;
    }).catch(() => {
      // Network failed and no cache
      return new Response("Resource not available", {
        status: 404,
        statusText: "Not Found",
        headers: new Headers({ "Content-Type": "text/plain" })
      });
    });
  });
}

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
