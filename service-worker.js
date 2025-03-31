const CACHE_NAME = 'lezioni-programmazione-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/app.js',
  '/lezioni/lezione1.html',
  // aggiungi altri file che vuoi rendere disponibili offline
];

// Installazione del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Recupero delle risorse
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - restituisci la risposta
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
            // Controlla se abbiamo ricevuto una risposta valida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clona la risposta
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});