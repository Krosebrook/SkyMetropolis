const CACHE_NAME = 'sky-metropolis-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.css',
  '/index.tsx',
  '/manifest.json',
  '/metadata.json'
];

self.addEventListener('install', (event) => {
  // Perform install steps: Cache the App Shell
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_CACHE);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignore non-GET methods
  if (event.request.method !== 'GET') {
    return;
  }

  // GUIDANCE: Offline Strategy for Single Page Apps (SPA)
  // 1. Navigation Requests (e.g. reloading the page):
  //    Always try to serve the cached 'index.html' if the network fails. 
  //    This ensures the app shell loads offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((response) => {
        // Return cache if available, else fetch, else fallback to cache (if fetch fails)
        return response || fetch(event.request).catch(() => {
             return caches.match('/index.html');
        });
      })
    );
    return;
  }

  // 2. Asset Requests (Scripts, Images, CSS):
  //    Stale-While-Revalidate: Serve from cache immediately, but update cache in background.
  //    Also dynamically cache new assets (like CDNs) as they are loaded.
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(event.request).then((response) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Check if we received a valid response
            if (networkResponse && networkResponse.status === 200) {
                // Clone the response to put in cache
                cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => {
             // Network failed. If we didn't have a cache match, we are offline and missing this asset.
          });
          
        // Return cached response immediately if available, else wait for network
        return response || fetchPromise;
      });
    })
  );
});