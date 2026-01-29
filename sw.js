/**
 * SERVICE WORKER - AETERNA LEXICON IN MOTU
 * Versione 4.0.0 - Offline con dati integrati
 */

const APP_VERSION = '9.1.1';
const CACHE_NAME = `aeterna-lexicon-${APP_VERSION}`;

// Lista asset essenziali
const ESSENTIAL_ASSETS = [
    // Pagine e stili
    './',
    './index.html',
    './style.css',
    './comparative-styles.css',
    
    // JavaScript
    './app.js',
    './firebase-init.js',
    './linguistic-analysis.js',
    
    // Configurazione
    './manifest.json',
    
    // Immagini
    './images/logo-app.png',
    './images/favicon.ico'
];

// ==================== INSTALLAZIONE ====================
self.addEventListener('install', (event) => {
    console.log(`[SW ${APP_VERSION}] Installazione in corso...`);
    self.skipWaiting(); // Forza l'attivazione immediata

    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log(`[SW] Caching di ${ESSENTIAL_ASSETS.length} file essenziali...`);
            
            try {
                // Prova a cache tutto
                return await cache.addAll(ESSENTIAL_ASSETS);
            } catch (error) {
                console.warn('[SW] Alcuni file non sono stati cacheati:', error);
                // Continua comunque
                return Promise.resolve();
            }
        })
    );
});

// ==================== ATTIVAZIONE ====================
self.addEventListener('activate', (event) => {
    console.log(`[SW ${APP_VERSION}] Attivazione...`);
    
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    // Cancella tutte le cache vecchie diverse da quella attuale
                    if (key !== CACHE_NAME) {
                        console.log('[SW] Rimozione vecchia cache:', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// ==================== GESTIONE RICHIESTE ====================
self.addEventListener('fetch', (event) => {
    // Ignora richieste non http
    if (!event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Se c'è in cache, usalo
            if (cachedResponse) {
                return cachedResponse;
            }

            // Altrimenti scarica dalla rete
            return fetch(event.request)
                .then((networkResponse) => {
                    // Se la risposta è valida, salvala in cache
                    if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }

                    return networkResponse;
                })
                .catch(() => {
                    // Se siamo offline e la richiesta è per HTML, mostra la home
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match('./index.html');
                    }
                    
                    // Per altre risorse, puoi mostrare un fallback
                    return new Response('Offline - Dati integrati disponibili', {
                        status: 200,
                        headers: { 'Content-Type': 'text/plain' }
                    });
                });
        })
    );
});

console.log(`[SW ${APP_VERSION}] Service Worker pronto`);