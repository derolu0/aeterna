const CACHE_NAME = 'aeterna-lexicon-v5.2.6-PHILOSOPHIA';
const STATIC_CACHE = 'static-philosophy-v2';
const DYNAMIC_CACHE = 'dynamic-philosophy-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './analytics.js',
  './firebase-init.js',
  './manifest.json',
  './translations.js',
  './images/logo-app.png',
  './images/logo-comune.png',
  './images/sfondo-home.jpg',
  './images/sfondo-home-mobile.jpg',
  './images/default-filosofo.jpg',
  './images/default-opera.jpg',
  './images/icona-avvio-144.png',
  './images/icona-avvio-192.png',
  './images/icona-avvio-512.png',
  './images/icona-avvio-splash.png',
  './images/apple-touch-icon.png',
  './images/favicon.ico',
  './images/favicon-16x16.png',
  './images/favicon-32x32.png',
  './images/marker-blue.png',
  './images/marker-green.png',
  './images/marker-orange.png',
  './images/marker-red.png'
];

const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css',
  'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis-network.min.css',
  'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
  'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png'
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('[Service Worker] Installazione Aeterna Lexicon...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[Service Worker] Caching asset statici filosofici');
        
        const cachePromises = STATIC_ASSETS.map(url => {
          return fetch(url, { mode: 'no-cors' })
            .then(response => {
              if (response.ok || response.type === 'opaque') {
                return cache.put(url, response.clone());
              }
              console.warn(`[Service Worker] Asset non trovato: ${url}`);
              return Promise.resolve();
            })
            .catch(error => {
              console.warn(`[Service Worker] Errore caching ${url}:`, error.message);
              return Promise.resolve();
            });
        });
        
        const externalPromises = EXTERNAL_ASSETS.map(url => {
          return fetch(url)
            .then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
              return Promise.resolve();
            })
            .catch(error => {
              console.warn(`[Service Worker] Errore caching esterno ${url}:`, error.message);
              return Promise.resolve();
            });
        });
        
        return Promise.all([...cachePromises, ...externalPromises]);
      })
      .then(() => {
        console.log('[Service Worker] Installazione dataset filosofico completata');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[Service Worker] Errore installazione:', error);
        return self.skipWaiting();
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('[Service Worker] Attivazione dataset filosofico...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Pulisce le vecchie versioni (incluse quelle vecchie dell'app fontane)
          if (!cacheName.includes('philosophy') && 
              cacheName !== STATIC_CACHE && 
              cacheName !== DYNAMIC_CACHE) {
            console.log('[Service Worker] Cancellazione vecchia cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Attivazione completata - Dataset filosofico pronto');
      
      // Pre-cache dati filosofici di esempio (offline fallback)
      return caches.open(DYNAMIC_CACHE).then(cache => {
        const filosofiEsempio = [
          {
            id: "F01",
            nome: "Platone",
            periodo: "classico",
            scuola: "Filosofia antica",
            anni: "428/427 a.C. - 348/347 a.C.",
            luogo_nascita: {
              citta: "Atene",
              paese: "Grecia",
              coordinate: { lat: 37.9838, lng: 23.7275 }
            },
            biografia: "Fondatore dell'Accademia e autore dei Dialoghi.",
            concetti_principali: ["Idea", "Bene", "Anima", "Stato"]
          },
          {
            id: "F02",
            nome: "Friedrich Nietzsche",
            periodo: "contemporaneo",
            scuola: "Filosofia continentale",
            anni: "1844-1900",
            luogo_nascita: {
              citta: "Röcken",
              paese: "Germania",
              coordinate: { lat: 51.2372, lng: 12.0914 }
            },
            biografia: "Filosofo tedesco, critico della morale tradizionale.",
            concetti_principali: ["Oltreuomo", "Volontà di potenza", "Morte di Dio"]
          }
        ];
        
        const opereEsempio = [
          {
            id: "O01",
            titolo: "La Repubblica",
            autore: "Platone",
            anno: "380 a.C.",
            periodo: "classico",
            sintesi: "Dialogo sull'organizzazione dello Stato ideale."
          },
          {
            id: "O02",
            titolo: "Così parlò Zarathustra",
            autore: "Friedrich Nietzsche",
            anno: "1883",
            periodo: "contemporaneo",
            sintesi: "Opera poetica che presenta la figura dell'Oltreuomo."
          }
        ];
        
        const concettiEsempio = [
          {
            id: "C01",
            parola: "Verità",
            definizione: "Concetto centrale della filosofia, variamente interpretato.",
            periodo: "entrambi",
            esempio: "La verità è adaequatio rei et intellectus (Tommaso d'Aquino)"
          },
          {
            id: "C02",
            parola: "Potere",
            definizione: "Capacità di influenzare il comportamento altrui.",
            periodo: "contemporaneo",
            esempio: "Il potere non è un'istituzione, non è una struttura... (Foucault)"
          }
        ];
        
        // Crea risorse offline
        const offlineData = {
          filosofi: filosofiEsempio,
          opere: opereEsempio,
          concetti: concettiEsempio,
          timestamp: new Date().toISOString(),
          source: "service-worker-offline"
        };
        
        const response = new Response(JSON.stringify(offlineData), {
          headers: { 'Content-Type': 'application/json' }
        });
        
        return cache.put('/offline-data.json', response);
      });
    })
    .then(() => {
      return self.clients.claim();
    })
    .catch(error => {
      console.error('[Service Worker] Errore attivazione:', error);
    })
  );
});

// Fetch Strategy - Gestione richieste
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  const url = new URL(event.request.url);
  
  // Skip chrome-extension, data:, blob:, etc.
  if (url.protocol === 'chrome-extension:' || 
      url.protocol === 'chrome:' || 
      url.protocol === 'about:' ||
      url.protocol === 'data:' ||
      url.protocol === 'blob:' ||
      url.protocol === 'file:') {
    return;
  }
  
  // Firebase e API - sempre network first
  if (url.href.includes('firebase') ||
      url.href.includes('firestore') ||
      url.href.includes('firebasestorage') ||
      url.href.includes('googleapis.com') ||
      url.href.includes('nominatim') ||
      url.href.includes('/analytics') ||
      url.href.includes('/filosofi/') ||
      url.href.includes('/opere/') ||
      url.href.includes('/concetti/')) {
    
    // Per dati filosofici: network con fallback offline
    if (url.href.includes('/filosofi') || 
        url.href.includes('/opere') || 
        url.href.includes('/concetti')) {
      
      event.respondWith(
        fetch(event.request)
          .then(response => {
            if (response.ok) {
              // Salva in cache per uso offline
              const clone = response.clone();
              caches.open(DYNAMIC_CACHE)
                .then(cache => cache.put(event.request, clone))
                .catch(err => console.warn('[SW] Cache put error:', err));
            }
            return response;
          })
          .catch(error => {
            console.log('[SW] Offline per dati filosofici, usando cache:', error.message);
            return caches.match(event.request)
              .then(cachedResponse => {
                if (cachedResponse) {
                  return cachedResponse;
                }
                // Fallback a dati offline
                return caches.match('/offline-data.json')
                  .then(offlineResponse => {
                    if (offlineResponse) {
                      return offlineResponse;
                    }
                    return new Response(JSON.stringify({ 
                      error: 'Offline mode',
                      message: 'Dati non disponibili offline'
                    }), {
                      status: 503,
                      headers: { 'Content-Type': 'application/json' }
                    });
                  });
              });
          })
      );
      return;
    }
    
    // Altre richieste Firebase/API - solo network
    return fetch(event.request);
  }
  
  // Mappe OpenStreetMap - cache con refresh
  if (url.href.includes('tile.openstreetmap.org') || 
      url.href.includes('cdn.rawgit.com')) {
    event.respondWith(
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Aggiorna cache in background
            fetch(event.request)
              .then(response => {
                if (response.ok) {
                  caches.open(DYNAMIC_CACHE)
                    .then(cache => cache.put(event.request, response));
                }
              })
              .catch(() => {});
            return cachedResponse;
          }
          
          return fetch(event.request)
            .then(response => {
              if (response.ok) {
                const clone = response.clone();
                caches.open(DYNAMIC_CACHE)
                  .then(cache => cache.put(event.request, clone));
              }
              return response;
            });
        })
    );
    return;
  }
  
  // Gestione standard - Cache First con fallback network
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Aggiorna cache in background per risorse non critiche
          if (!event.request.url.includes('index.html') && 
              !event.request.url.includes('app.js') &&
              !event.request.url.includes('style.css')) {
            fetch(event.request)
              .then(response => {
                if (response.ok) {
                  const clone = response.clone();
                  caches.open(DYNAMIC_CACHE)
                    .then(cache => cache.put(event.request, clone));
                }
              })
              .catch(() => {});
          }
          return cachedResponse;
        }
        
        return fetch(event.request)
          .then(response => {
            if (!response.ok) {
              // Fallback per HTML
              if (event.request.url.includes('index.html') || 
                  event.request.headers.get('accept')?.includes('text/html')) {
                return caches.match('./index.html');
              }
              return response;
            }
            
            const responseToCache = response.clone();
            caches.open(DYNAMIC_CACHE)
              .then(cache => {
                if (event.request.url.startsWith('http')) {
                  return cache.put(event.request, responseToCache);
                }
              })
              .catch(err => console.warn('[SW] Cache put error:', err));
            
            return response;
          })
          .catch(error => {
            console.warn('[Service Worker] Fetch fallback:', error.message);
            
            // Fallback intelligente basato sul tipo di risorsa
            if (event.request.headers.get('accept')?.includes('text/html')) {
              return caches.match('./index.html');
            }
            
            if (event.request.destination === 'image') {
              if (event.request.url.includes('filosofo')) {
                return caches.match('./images/default-filosofo.jpg');
              }
              if (event.request.url.includes('opera')) {
                return caches.match('./images/default-opera.jpg');
              }
              return caches.match('./images/logo-app.png');
            }

            if (event.request.destination === 'style') {
              return caches.match('./style.css');
            }
            
            if (event.request.destination === 'script') {
              return caches.match('./app.js')
                .then(scriptResponse => {
                  if (scriptResponse) return scriptResponse;
                  return new Response('console.log("Modalità offline attiva");', {
                    headers: { 'Content-Type': 'application/javascript' }
                  });
                });
            }
            
            if (event.request.destination === 'font') {
              return new Response('', {
                headers: { 'Content-Type': 'font/woff2' }
              });
            }
            
            // Fallback generico
            return new Response(`
              <!DOCTYPE html>
              <html>
                <head>
                  <title>Aeterna Lexicon - Offline</title>
                  <style>
                    body { 
                      font-family: 'Inter', sans-serif; 
                      padding: 20px; 
                      text-align: center;
                      background: #f8fafc;
                    }
                    .offline-container { 
                      max-width: 400px; 
                      margin: 50px auto; 
                      background: white;
                      padding: 30px;
                      border-radius: 20px;
                      box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    }
                    h1 { color: #3b82f6; }
                    p { color: #6b7280; }
                  </style>
                </head>
                <body>
                  <div class="offline-container">
                    <h1>📚 Modalità Offline</h1>
                    <p>L'app Aeterna Lexicon è disponibile offline con funzionalità limitate.</p>
                    <p>Riprova quando la connessione sarà disponibile per accedere al dataset completo.</p>
                    <button onclick="location.reload()" style="margin-top:20px;padding:10px 20px;background:#3b82f6;color:white;border:none;border-radius:10px;">
                      Ricarica
                    </button>
                  </div>
                </body>
              </html>
            `, {
              status: 503,
              headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
          });
      })
  );
});

// Background Sync per dati filosofici offline
self.addEventListener('sync', event => {
  console.log('[Service Worker] Sync event:', event.tag);
  
  if (event.tag === 'sync-philosophy-data') {
    event.waitUntil(
      syncPhilosophyData().catch(error => {
        console.error('[Service Worker] Sync error:', error);
        return Promise.resolve();
      })
    );
  }
  
  if (event.tag === 'sync-analytics') {
    event.waitUntil(
      syncAnalyticsData().catch(error => {
        console.error('[Service Worker] Analytics sync error:', error);
        return Promise.resolve();
      })
    );
  }
});

// Sincronizza dati filosofici offline
async function syncPhilosophyData() {
  console.log('[Service Worker] Sincronizzazione dati filosofici offline...');
  
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const requests = await cache.keys();
    
    // Trova richieste di dati filosofici in cache
    const philosophyRequests = requests.filter(req => 
      req.url.includes('/filosofi') || 
      req.url.includes('/opere') || 
      req.url.includes('/concetti')
    );
    
    if (philosophyRequests.length === 0) {
      console.log('[Service Worker] Nessun dato filosofico da sincronizzare');
      return Promise.resolve();
    }
    
    const syncPromises = philosophyRequests.map(async (request) => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
          console.log(`[Service Worker] Dato sincronizzato: ${request.url}`);
        }
      } catch (error) {
        console.warn(`[Service Worker] Sync fallito per ${request.url}:`, error.message);
      }
    });
    
    await Promise.all(syncPromises);
    console.log(`[Service Worker] Sincronizzati ${philosophyRequests.length} elementi filosofici`);
    
    // Notifica ai client
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'DATA_SYNC_COMPLETE',
        count: philosophyRequests.length,
        timestamp: new Date().toISOString()
      });
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Errore sincronizzazione:', error);
    return Promise.resolve();
  }
}

// Sincronizza analytics offline
async function syncAnalyticsData() {
  console.log('[Service Worker] Sincronizzazione analytics...');
  
  try {
    const clients = await self.clients.matchAll();
    if (clients.length === 0) {
      return Promise.resolve();
    }
    
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_ANALYTICS',
        timestamp: new Date().toISOString()
      });
    });
    
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] Errore sync analytics:', error);
    return Promise.resolve();
  }
}

// Handle messages dal client
self.addEventListener('message', event => {
  const { data, ports } = event;
  
  if (data && data.type) {
    console.log('[Service Worker] Messaggio ricevuto:', data.type);
    
    switch(data.type) {
      case 'CLEAR_CACHE':
        caches.keys()
          .then(cacheNames => {
            return Promise.all(
              cacheNames.map(cacheName => caches.delete(cacheName))
            );
          })
          .then(() => {
            if (ports && ports[0]) {
              ports[0].postMessage({ 
                success: true, 
                message: 'Cache filosofica pulita' 
              });
            }
          })
          .catch(error => {
            if (ports && ports[0]) {
              ports[0].postMessage({ 
                success: false, 
                error: error.message 
              });
            }
          });
        break;
        
      case 'CHECK_UPDATE':
        self.registration.update()
          .then(() => {
            if (ports && ports[0]) {
              ports[0].postMessage({ 
                updateAvailable: true,
                version: '5.2.0'
              });
            }
          })
          .catch(error => {
            if (ports && ports[0]) {
              ports[0].postMessage({ 
                updateAvailable: false, 
                error: error.message 
              });
            }
          });
        break;
        
      case 'GET_OFFLINE_DATA':
        caches.open(DYNAMIC_CACHE)
          .then(cache => cache.match('/offline-data.json'))
          .then(response => {
            if (response && ports && ports[0]) {
              response.json()
                .then(data => {
                  ports[0].postMessage({ 
                    success: true, 
                    data: data 
                  });
                });
            } else if (ports && ports[0]) {
              ports[0].postMessage({ 
                success: false, 
                error: 'No offline data' 
              });
            }
          })
          .catch(error => {
            if (ports && ports[0]) {
              ports[0].postMessage({ 
                success: false, 
                error: error.message 
              });
            }
          });
        break;
        
      case 'SYNC_NOW':
        syncPhilosophyData()
          .then(() => {
            if (ports && ports[0]) {
              ports[0].postMessage({ 
                success: true, 
                message: 'Sincronizzazione completata' 
              });
            }
          })
          .catch(error => {
            if (ports && ports[0]) {
              ports[0].postMessage({ 
                success: false, 
                error: error.message 
              });
            }
          });
        break;
    }
  }
});

// Gestione push notifications (per future estensioni)
self.addEventListener('push', event => {
  console.log('[Service Worker] Push notification ricevuta');
  
  const options = {
    body: 'Nuovi dati filosofici disponibili!',
    icon: './images/icona-avvio-192.png',
    badge: './images/icona-avvio-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'philosophy-update'
    },
    actions: [
      {
        action: 'explore',
        title: 'Esplora'
      },
      {
        action: 'close',
        title: 'Chiudi'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Aeterna Lexicon', options)
  );
});

self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click:', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('./');
        }
      })
    );
  }
});

// Periodic sync per aggiornamenti in background (se supportato)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-philosophy-data') {
      console.log('[Service Worker] Periodic sync per dati filosofici');
      event.waitUntil(syncPhilosophyData());
    }
  });
}

// Gestione errori globale
self.addEventListener('error', event => {
  console.error('[Service Worker] Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[Service Worker] Unhandled rejection:', event.reason);
});