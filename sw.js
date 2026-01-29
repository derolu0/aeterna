/**
 * SERVICE WORKER - AETERNA LEXICON (Versione Semplificata)
 * Versione 4.0.0 - Allineato con app senza analytics/multilingua
 */

const APP_VERSION = '4.0.0';
const CACHE_NAME = `aeterna-lexicon-${APP_VERSION}`;
const BASE_URL = 'https://derolu0.github.io/aeterna/';

// Asset essenziali (SOLO quelli che esistono davvero)
const ESSENTIAL_ASSETS = [
  // HTML e entry point
  BASE_URL,
  BASE_URL + 'index.html',
  
  // CSS
  BASE_URL + 'style.css',
  BASE_URL + 'comparative-styles.css',
  
  // JavaScript CORE (senza analytics/translations)
  BASE_URL + 'app.js',
  BASE_URL + 'firebase-init.js',
  BASE_URL + 'geocoding-manager.js',
  BASE_URL + 'linguistic-analysis.js',
  BASE_URL + 'analytics.js', // Solo stub per compatibilità
  
  // Workers
  BASE_URL + 'workers/geocoding-worker.js',
  BASE_URL + 'workers/excel-worker.js',
  
  // Manifest e icon
  BASE_URL + 'manifest.json',
  
  // Immagini ESSENZIALI
  BASE_URL + 'images/logo-app.png',
  BASE_URL + 'images/default-filosofo.jpg',
  BASE_URL + 'images/default-opera.jpg',
  BASE_URL + 'images/icona-avvio-192.png',
  
  // Marker mappa
  BASE_URL + 'images/marker-green.png',
  BASE_URL + 'images/marker-orange.png',
  BASE_URL + 'images/marker-red.png'
];

// Asset esterni (CDN)
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis-network.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis-network.min.css'
];

// ==================== INSTALL ====================
self.addEventListener('install', event => {
  console.log(`[SW ${APP_VERSION}] Installazione app filosofica...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching asset essenziali...');
        
        // Cache asset locali
        const localPromises = ESSENTIAL_ASSETS.map(url => {
          return fetch(url, { mode: 'no-cors' })
            .then(response => {
              if (response.ok || response.type === 'opaque') {
                return cache.put(url, response);
              }
              console.warn(`[SW] Asset non trovato: ${url}`);
              return Promise.resolve();
            })
            .catch(err => {
              console.warn(`[SW] Errore caching ${url}:`, err.message);
              return Promise.resolve();
            });
        });
        
        // Cache asset esterni
        const externalPromises = EXTERNAL_ASSETS.map(url => {
          return fetch(url)
            .then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
              return Promise.resolve();
            })
            .catch(err => {
              console.warn(`[SW] Errore caching esterno ${url}:`, err.message);
              return Promise.resolve();
            });
        });
        
        return Promise.all([...localPromises, ...externalPromises]);
      })
      .then(() => {
        console.log('[SW] Installazione completata');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Errore installazione:', error);
        return self.skipWaiting();
      })
  );
});

// ==================== ACTIVATE ====================
self.addEventListener('activate', event => {
  console.log(`[SW ${APP_VERSION}] Attivazione...`);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Cancella cache vecchie
          if (cacheName !== CACHE_NAME && cacheName.startsWith('aeterna-lexicon')) {
            console.log('[SW] Cancellazione cache vecchia:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[SW] Cache pulita, prendo controllo');
      return self.clients.claim();
    })
  );
});

// ==================== FETCH ====================
self.addEventListener('fetch', event => {
  // Solo richieste GET
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip protocolli speciali
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'data:' ||
      url.protocol === 'blob:') {
    return;
  }
  
  // Per il nostro dominio
  if (url.href.includes('derolu0.github.io/aeterna/')) {
    
    // Firebase/API - sempre network
    if (url.href.includes('firebase') ||
        url.href.includes('googleapis.com') ||
        url.href.includes('/filosofi/') ||
        url.href.includes('/opere/') ||
        url.href.includes('/concetti/')) {
      
      event.respondWith(
        fetch(event.request)
          .catch(() => {
            // Offline fallback per dati filosofici
            return caches.match(BASE_URL + 'index.html')
              .then(response => response || offlineFallback());
          })
      );
      return;
    }
    
    // Risorse statiche - Cache First
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Aggiorna cache in background
            fetchAndCache(event.request);
            return cachedResponse;
          }
          
          return fetchAndCache(event.request)
            .catch(() => {
              // Fallback generico
              if (event.request.destination === 'image') {
                return caches.match(BASE_URL + 'images/logo-app.png');
              }
              if (event.request.headers.get('accept')?.includes('text/html')) {
                return caches.match(BASE_URL + 'index.html');
              }
              return offlineFallback();
            });
        })
    );
  }
});

// ==================== FUNZIONI HELPER ====================
function fetchAndCache(request) {
  return fetch(request)
    .then(response => {
      if (!response.ok) throw new Error('Network response not ok');
      
      const responseToCache = response.clone();
      caches.open(CACHE_NAME)
        .then(cache => cache.put(request, responseToCache))
        .catch(err => console.warn('[SW] Cache put error:', err));
      
      return response;
    });
}

function offlineFallback() {
  return new Response(`
    <!DOCTYPE html>
    <html lang="it">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Aeterna Lexicon - Offline</title>
      <style>
        body {
          font-family: 'Inter', sans-serif;
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 20px;
        }
        .offline-container {
          max-width: 400px;
          background: rgba(255,255,255,0.1);
          padding: 30px;
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        h1 { margin-bottom: 20px; }
        p { margin-bottom: 20px; opacity: 0.9; }
        button {
          background: white;
          color: #3b82f6;
          border: none;
          padding: 12px 24px;
          border-radius: 50px;
          font-weight: bold;
          cursor: pointer;
        }
      </style>
    </head>
    <body>
      <div class="offline-container">
        <h1>📚 Modalità Offline</h1>
        <p>L'app Aeterna Lexicon è disponibile con funzionalità limitate.</p>
        <p>Riprova quando la connessione sarà disponibile.</p>
        <button onclick="location.reload()">Ricarica</button>
      </div>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}

// ==================== SYNC ====================
self.addEventListener('sync', event => {
  if (event.tag === 'sync-philosophy-data') {
    console.log('[SW] Sync dati filosofici...');
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Sincronizza dati offline
  const clients = await self.clients.matchAll();
  clients.forEach(client => {
    client.postMessage({
      type: 'DATA_SYNCED',
      timestamp: new Date().toISOString()
    });
  });
}

// ==================== MESSAGES ====================
self.addEventListener('message', event => {
  const { data } = event;
  
  switch(data?.type) {
    case 'GET_VERSION':
      event.ports?.[0]?.postMessage({
        version: APP_VERSION,
        cache: CACHE_NAME,
        assets: ESSENTIAL_ASSETS.length
      });
      break;
      
    case 'CLEAR_CACHE':
      caches.delete(CACHE_NAME)
        .then(() => {
          event.ports?.[0]?.postMessage({ success: true });
        });
      break;
      
    case 'CHECK_UPDATE':
      self.registration.update()
        .then(() => {
          event.ports?.[0]?.postMessage({ updateAvailable: true });
        });
      break;
  }
});

console.log(`[SW ${APP_VERSION}] Service Worker pronto - App filosofica`);