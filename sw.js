/**
 * SERVICE WORKER - AETERNA LEXICON IN MOTU
 * Versione 5.0.0 - FIXED (Icone & Percorsi corretti)
 */

const APP_VERSION = '8.0.6';
const CACHE_NAME = `aeterna-lexicon-${APP_VERSION}`;
// Usa il percorso base corretto per GitHub Pages
const BASE_URL = 'https://derolu0.github.io/aeterna/';

// Lista ASSET ESSENZIALI da scaricare subito
// Se uno di questi manca, l'installazione fallisce.
const ESSENTIAL_ASSETS = [
    // 1. Pagine e Stili
    BASE_URL,
    BASE_URL + 'index.html',
    BASE_URL + 'style.css',
    BASE_URL + 'comparative-styles.css',

    // 2. JavaScript Core (I file che hai caricato)
    BASE_URL + 'app.js',
    BASE_URL + 'firebase-init.js',
    BASE_URL + 'geocoding-manager.js',
    BASE_URL + 'linguistic-analysis.js',
    // Nota: analytics.js rimosso perché mancante

    // 3. Workers (Assumiamo siano nella root, non in /workers/)
    BASE_URL + 'excel-worker.js',
    // BASE_URL + 'geocoding-worker.js', // Scommenta solo se hai caricato questo file

    // 4. Configurazione
    BASE_URL + 'manifest.json',

    // 5. IMMAGINI DI BASE
    BASE_URL + 'images/favicon.ico',
    BASE_URL + 'images/logo-app.png',
    BASE_URL + 'images/apple-touch-icon.png',
    BASE_URL + 'images/default-filosofo.jpg',
    BASE_URL + 'images/default-opera.jpg',
    BASE_URL + 'images/sfondo-home.jpg',

    // 6. ICONE PWA (Tutte le dimensioni standard)
    BASE_URL + 'images/icona-avvio-72.png',
    BASE_URL + 'images/icona-avvio-96.png',
    BASE_URL + 'images/icona-avvio-128.png',
    BASE_URL + 'images/icona-avvio-144.png',
    BASE_URL + 'images/icona-avvio-152.png',
    BASE_URL + 'images/icona-avvio-192.png',
    BASE_URL + 'images/icona-avvio-384.png',
    BASE_URL + 'images/icona-avvio-512.png'
];

// ==================== INSTALLAZIONE ====================
self.addEventListener('install', (event) => {
    console.log(`[SW ${APP_VERSION}] Installazione in corso...`);
    self.skipWaiting(); // Forza l'attivazione immediata

    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            console.log(`[SW] Caching di ${ESSENTIAL_ASSETS.length} file essenziali...`);
            
            // Tentativo di caching robusto: se un file manca, non blocca tutto
            // (Utile se manca qualche icona specifica)
            try {
                // Proviamo a scaricare tutto in blocco
                return await cache.addAll(ESSENTIAL_ASSETS);
            } catch (error) {
                console.warn('[SW] Caching in blocco fallito, provo singolarmente...', error);
                
                // Fallback: scarica uno per uno e ignora gli errori sui file mancanti
                return Promise.all(
                    ESSENTIAL_ASSETS.map(url => {
                        return cache.add(url).catch(e => {
                            console.warn(`[SW] Impossibile trovare: ${url} (Ignorato)`);
                        });
                    })
                );
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

// ==================== GESTIONE RICHIESTE (FETCH) ====================
self.addEventListener('fetch', (event) => {
    // Ignora richieste non http (es. chrome-extension)
    if (!event.request.url.startsWith('http')) return;

    // Strategia: Stale-While-Revalidate per file statici
    // (Usa la cache subito, ma aggiorna in background)
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Se c'è in cache, usalo
            if (cachedResponse) {
                // Aggiorna la cache in background per la prossima volta (opzionale)
                // fetch(event.request).then(response => {
                //    caches.open(CACHE_NAME).then(cache => cache.put(event.request, response));
                // });
                return cachedResponse;
            }

            // Altrimenti scarica dalla rete
            return fetch(event.request)
                .then((networkResponse) => {
                    // Se la risposta è valida, salvala in cache dinamica
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                        return networkResponse;
                    }

                    // Clona la risposta per salvarla
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                })
                .catch(() => {
                    // Se siamo offline e la risorsa manca...
                    // Se è una pagina HTML, mostra la pagina offline (se esiste) o la home
                    if (event.request.headers.get('accept').includes('text/html')) {
                        return caches.match(BASE_URL + 'index.html');
                    }
                    // Se è un'immagine, mostra un placeholder (se vuoi)
                    return null;
                });
        })
    );
});