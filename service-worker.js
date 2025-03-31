const CACHE_NAME = 'epico-app-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js',
  '/manifest.json',
  '/images/logo.png',
  '/images/profile-placeholder.png',
  '/images/icon-72x72.png',
  '/images/icon-96x96.png',
  '/images/icon-128x128.png',
  '/images/icon-144x144.png',
  '/images/icon-152x152.png',
  '/images/icon-192x192.png',
  '/images/icon-384x384.png',
  '/images/icon-512x512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-solid-900.woff2',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/webfonts/fa-regular-400.woff2',
  '/materie/programming/lezione1.html',
  '/materie/programming/lezione2.html',
  '/materie/programming/lezione3.html',
  '/materie/architecture/lezione1.html',
  '/materie/architecture/lezione2.html',
  '/materie/architecture/lezione3.html',
  '/materie/webdev/lezione1.html',
  '/materie/webdev/lezione2.html',
  '/materie/webdev/lezione3.html',
  '/preferiti.html',
  '/recenti.html',
  '/impostazioni.html'
];

// Installazione del Service Worker
self.addEventListener('install', event => {
  // Performing install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache aperta');
        return cache.addAll(urlsToCache);
      })
  );
});

// Attivazione del Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            // Elimina cache vecchie
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Gestione delle richieste di rete
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - restituisci la risposta
        if (response) {
          return response;
        }

        // IMPORTANTE: Clona la richiesta. Una richiesta è un flusso e
        // può essere consumata solo una volta. Poiché vogliamo sia la 
        // cache che recuperare la richiesta, dobbiamo clonarla.
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then(
          response => {
            // Controlla se abbiamo ricevuto una risposta valida
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // IMPORTANTE: Clona la risposta. Una risposta è un flusso
            // e può essere consumata solo una volta. Poiché vogliamo inviare
            // la risposta al browser e salvarla nella cache, dobbiamo clonarla.
            const responseToCache = response.clone();

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

// Gestione degli errori di rete
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request);
      })
  );
});