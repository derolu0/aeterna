// ==========================================
// SISTEMA MULTILINGUA - AGGIUNTA INIZIALE
// ==========================================

let activityChartInstance = null;
let currentLanguage = localStorage.getItem('app_language') || 'it';
let currentDetailId = null;
let currentDetailType = null;

// Funzione principale cambio lingua
function toggleLanguage() {
    // 1. Cambia lingua
    currentLanguage = currentLanguage === 'it' ? 'en' : 'it';
    localStorage.setItem('app_language', currentLanguage);
    
    // 2. Aggiorna testi fissi
    applyTranslations();
    updateLangButton();
    
    // 3. Ricarica liste
    if (typeof loadFontane === 'function') loadFontane();
    if (typeof loadBeverini === 'function') loadBeverini();
    if (typeof loadNews === 'function') loadNews();
    
    // 4. Se c'è una scheda aperta, ricaricala tradotta!
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && (activeScreen.id.includes('detail'))) {
        if (currentDetailId && currentDetailType) {
            showDetail(currentDetailId, currentDetailType);
        }
    }
    
    // 5. Chiudi menu
    setTimeout(() => {
        const modal = document.getElementById('top-menu-modal');
        if(modal) modal.style.display = 'none';
    }, 300);
}

// Applica le traduzioni ai testi statici (data-i18n)
function applyTranslations() {
    const t = window.translations[currentLanguage];
    if (!t) return;

    // 1. Traduzione generica per elementi con data-i18n (es. Menu laterale)
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (t[key]) element.textContent = t[key];
    });

    // 2. HOME & MENU (Usa gli ID che hai messo nell'HTML)
    setText('home-title', t.home_title);

    // MODIFICA QUESTA RIGA: sostituisci setText con innerHTML
    const subtitleEl = document.getElementById('home-subtitle');
    if (subtitleEl) {
        subtitleEl.innerHTML = t.home_subtitle; 
    }

    setText('nav-fontane', t.tab_fountains);
    setText('nav-beverini', t.tab_drinkers);
    setText('nav-map', t.tab_map);
    setText('nav-news', t.tab_news);
    setText('nav-btn-text', t.navigate_btn); // Bottone Naviga Verso

    // 3. TITOLI SCHERMATE (Fontane, Beverini, News)
    setText('fountains-title', t.screen_fountains);
    setText('fountains-subtitle', t.subtitle_fountains);
    
    setText('drinkers-title', t.screen_drinkers);
    setText('drinkers-subtitle', t.subtitle_drinkers);

    setText('news-title', t.screen_news);
    setText('news-subtitle', t.subtitle_news);

    // 4. MAPPA & LEGENDA
    setText('map-title', t.screen_map);
    setText('legend-title', t.legend_title);
    setText('legend-fontana', t.legend_item_fountain);
    setText('legend-beverino', t.legend_item_drinker);
    setText('legend-pos', t.legend_item_position);
    
    // 5. PLACEHOLDER (Barre di ricerca)
    const mapSearch = document.getElementById('map-search-input');
    if (mapSearch) mapSearch.placeholder = t.map_search_placeholder;
    
    const listSearch = document.getElementById('search-input');
    if (listSearch) listSearch.placeholder = t.search_placeholder;
    
    // Cerca anche la barra dei beverini (se ha una classe specifica o id diverso)
    document.querySelectorAll('.search-input').forEach(el => {
        el.placeholder = t.search_placeholder;
    });

    // 6. FILTRI (Usa le classi speciali che abbiamo aggiunto)
    document.querySelectorAll('.trans-filter-all').forEach(el => {
        // Mantiene l'icona se presente, cambia solo il testo
        updateFilterText(el, t.filter_all);
    });
    document.querySelectorAll('.trans-filter-working').forEach(el => {
        updateFilterText(el, t.filter_working);
    });
    document.querySelectorAll('.trans-filter-broken').forEach(el => {
        updateFilterText(el, t.filter_broken);
    });
    document.querySelectorAll('.trans-filter-maintenance').forEach(el => {
        updateFilterText(el, t.filter_maintenance);
    });

    // 7. Aggiorna bottone lingua nel menu
    updateLangButton();
}

// --- FUNZIONI DI SUPPORTO ---

// Funzione sicura per impostare testo tramite ID
function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

// Funzione per aggiornare i filtri mantenendo l'icona <i>
function updateFilterText(btn, newText) {
    const icon = btn.querySelector('i');
    if (icon) {
        // Se c'è l'icona, riscriviamo: icona + spazio + testo
        btn.innerHTML = '';
        btn.appendChild(icon);
        btn.appendChild(document.createTextNode(' ' + newText));
    } else {
        // Solo testo
        btn.textContent = newText;
    }
}

// Aggiorna icona e testo del pulsante nel menu
function updateLangButton() {
    const flag = document.getElementById('lang-flag');
    const label = document.getElementById('lang-label');
    if (flag && label) {
        if (currentLanguage === 'it') {
            flag.textContent = '🇬🇧';
            label.textContent = 'Switch to English';
        } else {
            flag.textContent = '🇮🇹';
            label.textContent = 'Passa a Italiano';
        }
    }
}

// Helper per recuperare testo dinamico (se manca inglese, usa italiano)
function getLocalizedText(item, field) {
    if (currentLanguage === 'en') {
        return item[field + '_en'] || item[field] || '';
    }
    return item[field] || '';
}

// Avvio automatico delle traduzioni
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    updateLangButton();
});
// ==========================================
// SISTEMA CONTROLLO REMOTO (MANUTENZIONE & PRIVACY)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Avvia il "radar" che ascolta i comandi da Firebase
    initRemoteControl();
});

function initRemoteControl() {
    // Aspetta che Firebase sia pronto
    if (!window.db || !window.onSnapshot) {
        setTimeout(initRemoteControl, 500);
        return;
    }

    const configRef = window.doc(window.db, "config", "general_settings");
    
    // ASCOLTO IN TEMPO REALE
    window.onSnapshot(configRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const isAdmin = localStorage.getItem('abc_admin_logged') === 'true';

            // 1. GESTIONE MANUTENZIONE
            const isMaintenance = data.maintenanceMode === true;
            
            // Aggiorna interruttore admin
            const maintBtn = document.getElementById('global-maintenance-toggle');
            if (maintBtn) maintBtn.checked = isMaintenance;

            // Se manutenzione attiva E non sono admin -> BLOCCA
            const maintenanceScreen = document.getElementById('maintenance-mode');
            if (maintenanceScreen) {
                if (isMaintenance && !isAdmin) {
                    maintenanceScreen.style.display = 'flex';
                    document.body.style.overflow = 'hidden';
                } else {
                    maintenanceScreen.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            }

            // 2. GESTIONE PRIVACY (KILL SWITCH)
            const isTrackingAllowed = data.analyticsEnabled !== false; 
            
            // Aggiorna interruttore admin
            const privacyBtn = document.getElementById('global-privacy-toggle');
            const privacyText = document.getElementById('privacy-status-text');
            if (privacyBtn) privacyBtn.checked = isTrackingAllowed;
            
            if (window.firebaseAnalytics && window.setAnalyticsCollectionEnabled) {
                if (isTrackingAllowed) {
                    window.setAnalyticsCollectionEnabled(window.firebaseAnalytics, true);
                    if(privacyText) {
                        privacyText.textContent = "✅ Tracciamento ATTIVO";
                        privacyText.style.color = "#166534";
                    }
                } else {
                    window.setAnalyticsCollectionEnabled(window.firebaseAnalytics, false);
                    console.warn("🚫 ANALYTICS DISATTIVATO DA REMOTO");
                    if(privacyText) {
                        privacyText.textContent = "🛡️ PROTEZIONE ATTIVA (No Dati)";
                        privacyText.style.color = "#ef4444";
                    }
                }
            }
        }
    });
}

// --- FUNZIONI PER I PULSANTI ADMIN ---

// Toggle Manutenzione
async function toggleGlobalMaintenance(checkbox) {
    if (currentUserRole !== 'admin') { checkbox.checked = !checkbox.checked; return; }
    
    const newState = checkbox.checked;
    if (confirm(newState ? "🔴 BLOCCARE L'APP A TUTTI GLI UTENTI?" : "🟢 RIAPRIRE L'APP?")) {
        await updateConfig('maintenanceMode', newState);
        showToast(newState ? "Manutenzione ATTIVATA" : "Manutenzione DISATTIVATA", "warning");
    } else {
        checkbox.checked = !newState;
    }
}

// Toggle Privacy (Analytics)
async function toggleGlobalAnalytics(checkbox) {
    if (currentUserRole !== 'admin') { checkbox.checked = !checkbox.checked; return; }
    
    const newState = checkbox.checked;
    const msg = newState 
        ? "⚠️ Stai riattivando il tracciamento dati." 
        : "🛡️ Stai per DISABILITARE Analytics per tutti.";

    if (confirm(msg)) {
        await updateConfig('analyticsEnabled', newState);
        showToast(newState ? "Analytics ATTIVATO" : "Analytics DISATTIVATO", "success");
    } else {
        checkbox.checked = !newState;
    }
}

// Helper per salvare su Firebase
async function updateConfig(key, value) {
    try {
        const configRef = window.doc(window.db, "config", "general_settings");
        await window.setDoc(configRef, { 
            [key]: value,
            lastUpdate: new Date().toISOString()
        }, { merge: true });
    } catch (e) {
        console.error(e);
        showToast("Errore di connessione", "error");
    }
}
// ============================================
// SERVICE WORKER FUNCTIONS - VERSIONE CORRETTA
// ============================================

// Registrazione Service Worker - VERSIONE MIGLIORATA
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        // Usa percorso corretto
        const swUrl = './sw.js';
        
        return navigator.serviceWorker.register(swUrl)
            .then(function(registration) {
                console.log('✅ Service Worker registrato con successo:', registration.scope);
                
                // Controlla se è la prima registrazione
                if (!navigator.serviceWorker.controller) {
                    console.log('🔄 Service Worker installato per la prima volta');
                } else {
                    console.log('📱 Service Worker già attivo');
                }
                
                // Controlla aggiornamenti
                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    console.log('🔄 Nuova versione Service Worker trovata');
                    
                    newWorker.addEventListener('statechange', function() {
                        console.log(`📊 Stato SW: ${newWorker.state}`);
                        
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                // Nuovo content disponibile
                                showToast('Nuova versione disponibile! Ricarica la pagina.', 'info', 10000);
                                
                                // Aggiungi pulsante per forzare aggiornamento
                                setTimeout(() => {
                                    if (confirm('È disponibile un aggiornamento. Vuoi ricaricare l\'applicazione?')) {
                                        window.location.reload();
                                    }
                                }, 2000);
                            } else {
                                console.log('📱 Service Worker installato per la prima volta');
                            }
                        }
                    });
                });
                
                // Verifica periodicamente aggiornamenti (ogni ora)
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);
                
                return registration;
            })
            .catch(function(error) {
                console.error('❌ Errore durante la registrazione del Service Worker:', error);
                
                // Fallback: mostra messaggio utente friendly
                if (error.message.includes('404')) {
                    console.warn('⚠️ Service Worker non trovato. Modalità offline non disponibile.');
                }
                
                return null;
            });
    } else {
        console.warn('⚠️ Service Worker non supportato dal browser');
        return null;
    }
}

// Controlla stato Service Worker
function checkServiceWorkerStatus() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration()
            .then(function(registration) {
                if (registration) {
                    console.log('Service Worker attivo:', registration.active ? 'Sì' : 'No');
                    console.log('Scope:', registration.scope);
                } else {
                    console.log('Nessun Service Worker registrato');
                }
            });
    }
}

// Forza aggiornamento Service Worker
function forceServiceWorkerUpdate() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistration()
            .then(function(registration) {
                if (registration) {
                    registration.update();
                    showToast('Aggiornamento Service Worker forzato', 'info');
                }
            });
    }
}

// Pulisci cache Service Worker (per sviluppo)
function clearServiceWorkerCache() {
    if ('serviceWorker' in navigator) {
        caches.keys().then(function(cacheNames) {
            cacheNames.forEach(function(cacheName) {
                caches.delete(cacheName);
                console.log('Cache eliminata:', cacheName);
            });
            showToast('Cache Service Worker pulita', 'info');
        });
        
        // Deregistra Service Worker
        navigator.serviceWorker.getRegistrations()
            .then(function(registrations) {
                registrations.forEach(function(registration) {
                    registration.unregister();
                    console.log('Service Worker deregistrato');
                });
            });
    }
}

// Verifica supporto API
function checkServiceWorkerSupport() {
    const supports = {
        serviceWorker: 'serviceWorker' in navigator,
        sync: 'sync' in (navigator.serviceWorker || {}),
        periodicSync: 'periodicSync' in (navigator.serviceWorker || {}),
        push: 'PushManager' in window,
        notification: 'Notification' in window,
        cache: 'caches' in window
    };
    
    console.log('Supporto API:', supports);
    return supports;
}

// Firebase Collections
const COLLECTIONS = {
    FONTANE: 'fontane',
    BEVERINI: 'beverini',
    NEWS: 'news'
};

// ============================================
// GESTIONE ERRORI COMPLETA
// ============================================

class AppError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', details = {}) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date().toISOString();
    }
}

class FirebaseError extends AppError {
    constructor(message, code, details) {
        super(message, `FIREBASE_${code}`, details);
        this.name = 'FirebaseError';
    }
}

class NetworkError extends AppError {
    constructor(message, details) {
        super(message, 'NETWORK_ERROR', details);
        this.name = 'NetworkError';
    }
}

class ValidationError extends AppError {
    constructor(message, field, value) {
        super(message, 'VALIDATION_ERROR', { field, value });
        this.name = 'ValidationError';
    }
}

// Error handler globale
window.addEventListener('error', function(event) {
    console.error('Errore globale:', event.error);
    logErrorToAnalytics(event.error, 'GLOBAL_ERROR', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
    });
    event.preventDefault();
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Promise non gestita:', event.reason);
    logErrorToAnalytics(event.reason, 'UNHANDLED_PROMISE_REJECTION', {
        promise: event.promise
    });
});

// Funzioni di gestione errori
async function handleError(context, error, userMessage = null) {
    console.error(`[${context}]`, error);
    
    // Log per analytics
    logErrorToAnalytics(error, context);
    
    // Gestione specifica per tipo di errore
    if (error instanceof FirebaseError) {
        await handleFirebaseError(context, error);
    } else if (error instanceof NetworkError) {
        await handleNetworkError(context, error);
    } else if (error instanceof ValidationError) {
        await handleValidationError(context, error);
    } else {
        await handleGenericError(context, error);
    }
    
    // Mostra messaggio all'utente (ora disattivato in showToast)
    if (userMessage) {
        showToast(userMessage, 'error', 5000);
    }
    
    // Log attività
    logActivity(`Errore in ${context}: ${error.message}`);
}

async function handleFirebaseError(context, error) {
    console.error(`Firebase Error [${context}]:`, error.code, error.details);
    
    switch (error.code) {
        case 'FIREBASE_PERMISSION_DENIED':
            showToast('Accesso negato. Verifica i permessi.', 'error');
            if (context.includes('admin')) {
                logoutAdmin();
            }
            break;
        case 'FIREBASE_UNAVAILABLE':
            showToast('Servizio temporaneamente non disponibile', 'error');
            saveOfflineData(context, error.details.data);
            break;
        case 'FIREBASE_NOT_FOUND':
            showToast('Dato non trovato nel database', 'warning');
            break;
        default:
            showToast('Errore database: ' + error.message, 'error');
    }
}

async function handleNetworkError(context, error) {
    console.warn(`Network Error [${context}]:`, error.details);
    
    if (error.details.data) {
        saveOfflineData(context, error.details.data);
    }
    
    document.getElementById('offline-indicator').style.display = 'block';
    showToast('Connessione assente. Modalità offline attiva.', 'warning', 3000);
}

async function handleValidationError(context, error) {
    console.warn(`Validation Error [${context}]:`, error.details);
    
    const field = error.details.field;
    if (field) {
        const input = document.getElementById(field);
        if (input) {
            input.style.borderColor = 'var(--primary-red)';
            input.focus();
            
            setTimeout(() => {
                input.style.borderColor = '';
            }, 3000);
        }
    }
    
    showToast(error.message, 'error');
}

async function handleGenericError(context, error) {
    console.error(`Generic Error [${context}]:`, error);
    
    let userMessage = 'Si è verificato un errore';
    
    if (error.message.includes('quota')) {
        userMessage = 'Limite database raggiunto. Contatta l\'amministratore.';
    } else if (error.message.includes('timeout')) {
        userMessage = 'Timeout operazione. Riprova.';
    } else if (error.message.includes('storage')) {
        userMessage = 'Errore archiviazione. Verifica lo spazio.';
    }
    
    showToast(userMessage, 'error');
}

// Funzioni di validazione
function validateFontanaData(data) {
    const errors = [];
    
    if (!data.nome || data.nome.trim().length < 2) {
        errors.push(new ValidationError('Nome fontana richiesto (min 2 caratteri)', 'fontana-nome', data.nome));
    }
    
    if (!data.indirizzo || data.indirizzo.trim().length < 5) {
        errors.push(new ValidationError('Indirizzo richiesto', 'fontana-indirizzo', data.indirizzo));
    }
    
    if (!isValidCoordinate(data.latitudine, data.longitudine)) {
        errors.push(new ValidationError('Coordinate non valide', 'fontana-latitudine', data.latitudine));
    }
    
    if (!['funzionante', 'non-funzionante', 'manutenzione'].includes(data.stato)) {
        errors.push(new ValidationError('Stato non valido', 'fontana-stato', data.stato));
    }
    
    return errors;
}

function validateBeverinoData(data) {
    const errors = [];
    
    if (!data.nome || data.nome.trim().length < 2) {
        errors.push(new ValidationError('Nome beverino richiesto', 'beverino-nome', data.nome));
    }
    
    if (!isValidCoordinate(data.latitudine, data.longitudine)) {
        errors.push(new ValidationError('Coordinate non valide', 'beverino-latitudine', data.latitudine));
    }
    
    return errors;
}

// Wrapper per funzioni Firebase
async function safeFirebaseOperation(operation, context, ...args) {
    try {
        return await operation(...args);
    } catch (error) {
        throw new FirebaseError(
            error.message,
            error.code || 'UNKNOWN',
            { operation: context, args }
        );
    }
}

// ============================================
// PERFORMANCE OPTIMIZATIONS
// ============================================

// Cache per immagini
const imageCache = new Map();
const MAX_IMAGE_CACHE_SIZE = 50;

// Lazy loading per immagini
function setupLazyLoading() {
    if (typeof IntersectionObserver === 'undefined') return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                const src = img.getAttribute('data-src');
                
                if (src && !img.src.includes(src)) {
                    loadImageWithCache(img, src);
                }
                observer.unobserve(img);
            }
        });
    }, {
        rootMargin: '50px',
        threshold: 0.1
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        observer.observe(img);
    });
}

// Caricamento immagini con cache
function loadImageWithCache(imgElement, src) {
    if (imageCache.has(src)) {
        imgElement.src = imageCache.get(src);
        return;
    }
    
    const img = new Image();
    img.onload = () => {
        if (imageCache.size >= MAX_IMAGE_CACHE_SIZE) {
            const firstKey = imageCache.keys().next().value;
            imageCache.delete(firstKey);
        }
        imageCache.set(src, src);
        imgElement.src = src;
    };
    
    img.onerror = () => {
        imgElement.src = './images/sfondo-home.jpg';
    };
    
    img.src = src;
}

// Debounce migliorato
function advancedDebounce(func, wait, immediate = false) {
    let timeout, result;
    const debounced = function(...args) {
        const context = this;
        const later = function() {
            timeout = null;
            if (!immediate) result = func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) result = func.apply(context, args);
        return result;
    };
    
    debounced.cancel = function() {
        clearTimeout(timeout);
        timeout = null;
    };
    
    return debounced;
}

// ============================================
// OFFLINE SYNC
// ============================================

let syncState = {
    isSyncing: false,
    lastSync: null,
    pendingChanges: 0,
    retryCount: 0
};

// Inizializza offline sync
function initializeOfflineSync() {
    if (!navigator.onLine) {
        enableOfflineMode();
    }
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setInterval(checkSyncStatus, 60000);
    loadSyncState();
}

// Abilita modalità offline
function enableOfflineMode() {
    document.getElementById('offline-indicator').style.display = 'block';
    showToast('Modalità offline attiva. Le modifiche saranno sincronizzate dopo.', 'info', 5000);
}

// Disabilita modalità offline
function disableOfflineMode() {
    document.getElementById('offline-indicator').style.display = 'none';
    triggerAutoSync();
}

// Gestisci evento online
function handleOnline() {
    disableOfflineMode();
    showToast('Connessione ripristinata. Sincronizzazione in corso...', 'success');
    checkForPendingSync();
}

// Gestisci evento offline
function handleOffline() {
    enableOfflineMode();
}

// Aggiungi operazione a coda sync
async function addToSyncQueue(operation, collection, data, docId = null) {
    const syncItem = {
        operation,
        collection,
        data,
        docId: docId || data.id,
        timestamp: Date.now(),
        metadata: {
            userAgent: navigator.userAgent,
            location: currentLatLng,
            appVersion: '2.0.0'
        }
    };
    
    try {
        await saveToLocalSyncQueue(syncItem);
        
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.ready;
            
            if ('sync' in registration) {
                await registration.sync.register('sync-data');
            }
        }
        
        updateSyncUI();
        return true;
    } catch (error) {
        console.error('[Offline] Errore aggiunta a coda sync:', error);
        saveSyncItemToLocalStorage(syncItem);
        return false;
    }
}

// Salva in coda sync locale
async function saveToLocalSyncQueue(item) {
    const queue = await getLocalSyncQueue();
    queue.push(item);
    
    if (queue.length > 100) {
        queue.splice(0, queue.length - 100);
    }
    
    localStorage.setItem('localSyncQueue', JSON.stringify(queue));
    syncState.pendingChanges = queue.length;
    saveSyncState();
}

// Ottieni coda sync locale
async function getLocalSyncQueue() {
    const queue = localStorage.getItem('localSyncQueue');
    return queue ? JSON.parse(queue) : [];
}

// Salva sync item in localStorage
function saveSyncItemToLocalStorage(item) {
    const pendingItems = JSON.parse(localStorage.getItem('pendingSyncItems') || '[]');
    pendingItems.push(item);
    localStorage.setItem('pendingSyncItems', JSON.stringify(pendingItems));
}

// Trigger sync automatica
async function triggerAutoSync() {
    if (syncState.isSyncing) return;
    
    syncState.isSyncing = true;
    updateSyncUI();
    
    try {
        const queue = await getLocalSyncQueue();
        
        if (queue.length === 0) {
            syncState.isSyncing = false;
            return;
        }
        
        let successCount = 0;
        let failCount = 0;
        
        for (let i = 0; i < queue.length; i += 5) {
            const batch = queue.slice(i, i + 5);
            
            const results = await Promise.allSettled(
                batch.map(item => syncSingleItem(item))
            );
            
            results.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    successCount++;
                    removeFromLocalSyncQueue(batch[index].id);
                } else {
                    failCount++;
                    incrementRetryCount(batch[index].id);
                }
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        syncState.lastSync = Date.now();
        syncState.pendingChanges = await getLocalSyncQueue().length;
        syncState.retryCount = 0;
        
        showSyncResults(successCount, failCount);
        
    } catch (error) {
        console.error('[Sync] Errore durante sync:', error);
        syncState.retryCount++;
        scheduleRetry();
    } finally {
        syncState.isSyncing = false;
        updateSyncUI();
        saveSyncState();
    }
}

// Sincronizza singolo elemento
async function syncSingleItem(item) {
    const { doc, setDoc, deleteDoc } = await import(
        "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"
    );
    
    try {
        switch (item.operation) {
            case 'CREATE':
            case 'UPDATE':
                const docRef = doc(window.db, item.collection, item.docId);
                await setDoc(docRef, item.data);
                break;
            case 'DELETE':
                const deleteRef = doc(window.db, item.collection, item.docId);
                await deleteDoc(deleteRef);
                break;
        }
        return { success: true, id: item.id };
    } catch (error) {
        throw new Error(`Sync fallito: ${error.message}`);
    }
}

// Rimuovi dalla coda locale
function removeFromLocalSyncQueue(itemId) {
    const queue = JSON.parse(localStorage.getItem('localSyncQueue') || '[]');
    const newQueue = queue.filter(item => item.id !== itemId);
    localStorage.setItem('localSyncQueue', JSON.stringify(newQueue));
}

// Programma retry
function scheduleRetry() {
    const backoffDelay = Math.min(300000, Math.pow(2, syncState.retryCount) * 5000);
    
    setTimeout(() => {
        if (navigator.onLine) {
            triggerAutoSync();
        }
    }, backoffDelay);
}

// Mostra risultati sync
function showSyncResults(successCount, failCount) {
    if (successCount > 0 || failCount > 0) {
        const message = `Sincronizzazione: ${successCount} successi, ${failCount} falliti`;
        
        if (failCount === 0) {
            showToast(message, 'success');
        } else {
            showToast(message, 'warning');
        }
    }
}

// Controlla stato sync
async function checkSyncStatus() {
    if (!navigator.onLine) return;
    
    const localQueue = await getLocalSyncQueue();
    
    if (localQueue.length > 0 && !syncState.isSyncing) {
        triggerAutoSync();
    }
}

// Verifica dati pendenti
async function checkForPendingSync() {
    const localQueue = await getLocalSyncQueue();
    const pendingStorage = JSON.parse(localStorage.getItem('pendingSyncItems') || '[]');
    
    if (localQueue.length > 0 || pendingStorage.length > 0) {
        if (pendingStorage.length > 0) {
            pendingStorage.forEach(item => {
                addToSyncQueue(item.operation, item.collection, item.data, item.docId);
            });
            localStorage.removeItem('pendingSyncItems');
        }
        
        setTimeout(() => triggerAutoSync(), 2000);
    }
}

// Aggiorna UI sync
function updateSyncUI() {
    return;
}

// Salva stato sync
function saveSyncState() {
    localStorage.setItem('syncState', JSON.stringify(syncState));
}

// Carica stato sync
function loadSyncState() {
    const savedState = localStorage.getItem('syncState');
    if (savedState) {
        syncState = JSON.parse(savedState);
        updateSyncUI();
    }
}

// Funzione per salvataggio dati offline
function saveOfflineData(context, data) {
    try {
        const offlineData = JSON.parse(localStorage.getItem('offlineData') || '[]');
        offlineData.push({
            type: context,
            data: data,
            timestamp: new Date().toISOString(),
            attempts: 0
        });
        localStorage.setItem('offlineData', JSON.stringify(offlineData));
        
        showToast('Dati salvati offline. Sincronizzazione in background.', 'info');
        
    } catch (error) {
        console.error('Errore salvataggio offline:', error);
    }
}

// ============================================
// ANALYTICS FUNCTIONS
// ============================================

function logErrorToAnalytics(error, context, additionalData = {}) {
    const errorLog = {
        timestamp: new Date().toISOString(),
        context,
        error: {
            name: error.name,
            message: error.message,
            code: error.code,
            stack: error.stack
        },
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        url: window.location.href,
        ...additionalData
    };
    
    const analyticsLog = JSON.parse(localStorage.getItem('analytics_errors') || '[]');
    analyticsLog.push(errorLog);
    
    if (analyticsLog.length > 100) {
        analyticsLog.splice(0, analyticsLog.length - 100);
    }
    
    localStorage.setItem('analytics_errors', JSON.stringify(analyticsLog));
    
    // Firebase Analytics se disponibile
    if (window.firebaseAnalytics) {
        window.firebaseAnalytics.logEvent('error_occurred', {
            error_context: context,
            error_message: error.message.substring(0, 100),
            error_code: error.code || 'none'
        });
    }
}

function logPerformanceMetric(name, duration) {
    const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
    metrics.push({
        name,
        duration,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
    });
    
    if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
    }
    
    localStorage.setItem('performance_metrics', JSON.stringify(metrics));
}

// ============================================
// VARIABILI GLOBALI E GESTIONE RUOLI
// ============================================

let appData = {
    fontane: [],
    beverini: [],
    news: []
};
let currentLatLng = null;
let screenHistory = ['home-screen'];
let currentFilter = {
    fontane: 'all',
    beverini: 'all'
};
let activityLog = [];
let searchResults = [];
let searchMarker = null;
let map = null;
let clusterGroup = null;
let markers = new Map();

// Variabili per la gestione del doppio tocco/uscita
let backPressTimer = null;
const EXIT_TOAST_TIMEOUT = 2000; 

let searchTimeout;
let isAdminAuthenticated = false;
let adminAuthTimeout = null;

// ============================================
// NUOVO: GESTIONE RUOLI AMMINISTRATORE
// ============================================
let currentUserRole = 'editor'; // 'admin' (completo) o 'editor' (limitato)

// (QUI SOTTO NON C'È PIÙ NESSUNA LISTA DI EMAIL - CORRETTO)

// ============================================
// NUOVA FUNZIONE CENTRALE PER RESET SCROLL (AGGIORNATA)
// ============================================
function resetScroll() {
    // 1. Resetta lo scroll della finestra principale
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
    });

    // 2. Resetta lo scroll delle aree di lista (Fontane/Beverini/News list)
    document.querySelectorAll('.content-area').forEach(area => {
        area.scrollTop = 0;
    });

    // 3. Resetta lo scroll delle schede dettaglio (dove c'è l'immagine)
    document.querySelectorAll('.detail-content').forEach(detail => {
        detail.scrollTop = 0;
    });
}
// Rimosso: window.addEventListener('load', resetScroll);


// ============================================
// FUNZIONI ORIGINALI (MODIFICATE CON NUOVE FEATURES)
// ============================================

// Firebase Firestore functions
// ============================================
// SISTEMA DI NOTIFICHE E EVIDENZIAZIONE
// ============================================
function checkAndNotifyUpdates(newData, type) {
    const storedData = localStorage.getItem('fontaneBeveriniData');
    if (!storedData) return; 
    
    const parsedData = JSON.parse(storedData);
    const oldList = parsedData[type] || [];
    
    if (oldList.length === 0) return; 

    // Recupera o inizializza la lista delle evidenziazioni
    let highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "fixed": []}');

    let newItemsCount = 0;
    let fixedItemsCount = 0;
    let lastNewName = "";
    let lastFixedName = "";

    newData.forEach(newItem => {
        const existsOld = oldList.find(oldItem => oldItem.id === newItem.id);
        
        if (!existsOld) {
            // È NUOVO
            newItemsCount++;
            lastNewName = newItem.titolo || newItem.nome;
            if (!highlights.new.includes(newItem.id)) {
                highlights.new.push(newItem.id);
            }
        } else {
            // È RIPARATO? (Solo fontane/beverini)
            if (type !== 'news') {
                const wasBroken = ['non-funzionante', 'manutenzione'].includes(existsOld.stato);
                const isWorking = newItem.stato === 'funzionante';
                
                if (wasBroken && isWorking) {
                    fixedItemsCount++;
                    lastFixedName = newItem.nome;
                    if (!highlights.fixed.includes(newItem.id)) {
                        highlights.fixed.push(newItem.id);
                    }
                }
            }
        }
    });

    // Salva le evidenziazioni
    localStorage.setItem('app_highlights', JSON.stringify(highlights));

    // NOTIFICHE RAGGRUPPATE
    if (newItemsCount > 0) {
        let title = type === 'news' ? '📰 Nuova Notizia' : '✨ Nuovo arrivo';
        let body = newItemsCount === 1 ? `È stato aggiunto: ${lastNewName}` : `Ci sono ${newItemsCount} nuovi elementi!`;
        sendSystemNotification(title, body);
    }

    if (fixedItemsCount > 0) {
        let title = '✅ Riparazione Completata';
        let body = fixedItemsCount === 1 ? `${lastFixedName} è tornata in funzione!` : `${fixedItemsCount} punti acqua riparati!`;
        setTimeout(() => sendSystemNotification(title, body), 1000);
    }
}

function sendSystemNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
            navigator.serviceWorker.ready.then(registration => {
                registration.showNotification(title, {
                    body: body,
                    icon: './images/icona-avvio-192.png',
                    badge: './images/icona-avvio-72.png',
                    vibrate: [200, 100, 200]
                });
            });
        } else {
            new Notification(title, { body: body, icon: './images/icona-avvio-192.png' });
        }
    } else {
        // Fallback Toast se notifiche negate
        showToast(`${title}: ${body}`, 'success', 5000);
    }
}

async function loadFirebaseData(type) {
    try {
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        const collectionMap = {
            'fontane': 'fontane',
            'beverini': 'beverini',
            'news': 'news'
        };
        
        const collectionName = collectionMap[type];
        const dataRef = collection(window.db, collectionName);
        const snapshot = await safeFirebaseOperation(getDocs, `getDocs_${type}`, dataRef);
        
        const data = [];
        snapshot.forEach(doc => {
            const docData = doc.data();
            data.push({ 
                id: doc.id, 
                // Dati Comuni
                nome: docData.nome || '',
                nome_en: docData.nome_en || '', // NUOVO: Carica nome inglese
                indirizzo: docData.indirizzo || '',
                stato: docData.stato || 'funzionante',
                latitudine: docData.latitudine || 0,
                longitudine: docData.longitudine || 0,
                immagine: docData.immagine || '',
                
                // Dati Fontane
                anno: docData.anno || '',
                descrizione: docData.descrizione || '',
                descrizione_en: docData.descrizione_en || '', // NUOVO: Carica descrizione inglese
                storico: docData.storico || '',
                storico_en: docData.storico_en || '', // NUOVO: Carica storico inglese
                
                // Dati News
                titolo: docData.titolo || '',
                titolo_en: docData.titolo_en || '', // NUOVO
                contenuto: docData.contenuto || '',
                contenuto_en: docData.contenuto_en || '', // NUOVO
                data: docData.data || new Date().toISOString().split('T')[0],
                categoria: docData.categoria || '',
                fonte: docData.fonte || '',
                
                last_modified: docData.last_modified || new Date().toISOString()
            });
        });
        
        // >>> CONTROLLO NOTIFICHE <<<
        checkAndNotifyUpdates(data, type);
        // >>> FINE CONTROLLO <<<

        appData[type] = data;
        saveLocalData();
        
        showToast(`${data.length} ${type} caricati da Firebase`, 'success');
        logActivity(`${data.length} ${type} caricati da Firebase`);
        
        return data;
    } catch (error) {
        await handleError(`loadFirebaseData_${type}`, error, `Utilizzo dati locali per ${type}`);
        loadLocalData(type);
        return appData[type];
    }
}

async function saveFirebaseData(type, item, id = null) {
    try {
        const { doc, setDoc, updateDoc, collection, addDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        let savedId;
        const collectionName = COLLECTIONS[type.toUpperCase()];
        
        if (id) {
            const docRef = doc(window.db, collectionName, id);
            await updateDoc(docRef, item);
            savedId = id;
        } else {
            const dataRef = collection(window.db, collectionName);
            const newDoc = await addDoc(dataRef, item);
            savedId = newDoc.id;
        }
        
        return savedId;
    } catch (error) {
        console.error(`Errore nel salvataggio ${type}:`, error);
        throw error;
    }
}

async function deleteFirebaseData(type, id) {
    try {
        const { doc, deleteDoc } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        const collectionName = COLLECTIONS[type.toUpperCase()];
        const docRef = doc(window.db, collectionName, id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error(`Errore nell'eliminazione ${type}:`, error);
        throw error;
    }
}

// Local Storage functions
function saveLocalData() {
    try {
        localStorage.setItem('fontaneBeveriniData', JSON.stringify(appData));
        localStorage.setItem('fontaneBeveriniLastSync', new Date().toISOString());
    } catch (error) {
        console.error('Errore nel salvataggio locale:', error);
    }
}

function loadLocalData(type = null) {
    try {
        const savedData = localStorage.getItem('fontaneBeveriniData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (type) {
                return parsedData[type] || [];
            }
            appData = parsedData;
        }
    } catch (error) {
        console.error('Errore nel caricamento locale:', error);
    }
    return type ? [] : appData;
}

// Funzioni principali
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function getStatusText(stato) {
    const statusMap = {
        'funzionante': 'Funzionante',
        'non-funzionante': 'Non Funzionante',
        'manutenzione': 'In Manutenzione'
    };
    return statusMap[stato] || 'Stato sconosciuto';
}

function formatDate(dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('it-IT', options);
}

// ======================================================
// MODIFICA: Funzione showToast() con output visivo rimosso
// ======================================================
function showToast(message, type = 'info', duration = 3000) {
    console.log(`[Toast Disabled] Tipo: ${type}, Messaggio: ${message}`);
}
// ======================================================
// FINE MODIFICA
// ======================================================

function logActivity(description) {
    const timestamp = new Date().toLocaleString('it-IT');
    activityLog.unshift({ description, timestamp });

    if (activityLog.length > 10) {
        activityLog = activityLog.slice(0, 10);
    }

    localStorage.setItem('activityLog', JSON.stringify(activityLog));
    updateActivityLog();
}

function updateActivityLog() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    activityList.innerHTML = '';
    activityLog.forEach(activity => {
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <div class="activity-desc">${activity.description}</div>
            <div class="activity-time">${activity.timestamp}</div>
        `;
        activityList.appendChild(activityItem);
    });
}

function updateDashboardStats() {
    document.getElementById('total-fontane').textContent = appData.fontane.length;
    document.getElementById('fontane-funzionanti').textContent = appData.fontane.filter(f => f.stato === 'funzionante').length;
    document.getElementById('fontane-non-funzionanti').textContent = appData.fontane.filter(f => f.stato === 'non-funzionante').length;
    document.getElementById('fontane-manutenzione').textContent = appData.fontane.filter(f => f.stato === 'manutenzione').length;
    
    document.getElementById('total-beverini').textContent = appData.beverini.length;
    document.getElementById('beverini-funzionanti').textContent = appData.beverini.filter(b => b.stato === 'funzionante').length;
    document.getElementById('beverini-non-funzionanti').textContent = appData.beverini.filter(b => b.stato === 'non-funzionante').length;
    document.getElementById('beverini-manutenzione').textContent = appData.beverini.filter(b => b.stato === 'manutenzione').length;
    
    document.getElementById('total-news').textContent = appData.news.length;
}

// Admin Authentication
function openAdminPanel() {
    if (isAdminAuthenticated) {
        showAdminPanel();
    } else {
        showAdminAuth();
    }
}

function showAdminAuth() {
    document.getElementById('admin-auth').style.display = 'flex';
    document.getElementById('admin-password').focus();
}

function closeAdminAuth() {
    document.getElementById('admin-auth').style.display = 'none';
    document.getElementById('admin-password').value = '';
    document.getElementById('auth-error').style.display = 'none';
}

// ========================================================
// NUOVA FUNZIONE DI LOGIN SICURA (SENZA SUPER_ADMINS)
// ========================================================
async function checkAdminAuth() {
    const emailInput = document.getElementById('admin-email');
    const passInput = document.getElementById('admin-password');
    const errorElement = document.getElementById('auth-error');

    // 1. Pulizia rigorosa dell'email (rimuove spazi invisibili prima e dopo)
    const email = emailInput.value.trim();
    const password = passInput.value;

    try {
        // Login Firebase standard
        await window.firebaseSignIn(window.auth, email, password);
        
        isAdminAuthenticated = true;
        localStorage.setItem('abc_admin_logged', 'true');
        
        // Sblocca interfaccia manutenzione se presente
        const maintScreen = document.getElementById('maintenance-mode');
        if (maintScreen) maintScreen.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Forza l'inizializzazione dei controlli remoti
        if (typeof initRemoteControl === 'function') initRemoteControl();

        // 2. CONTROLLO RUOLI (Versione Robusta)
        let isSuperAdmin = false;
        try {
            const docRef = window.doc(window.db, "impostazioni", "ruoli");
            const docSnap = await window.getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                // Normalizza la lista dal DB: tutto minuscolo e senza spazi
                const dbAdmins = (data.super_admins || []).map(e => e.trim().toLowerCase());
                const myEmail = email.toLowerCase();
                
                // DEBUG: Scrive nella console cosa sta succedendo (così capiamo se funziona)
                console.log("LOGIN DEBUG - Email inserita:", myEmail);
                console.log("LOGIN DEBUG - Lista DB:", dbAdmins);

                if (dbAdmins.includes(myEmail)) {
                    isSuperAdmin = true;
                }
            }
        } catch (e) {
            console.error("Errore lettura ruoli DB:", e);
        }

        // 3. Assegnazione Ruolo
        if (isSuperAdmin) {
            currentUserRole = 'admin';
            showToast('Benvenuto Amministratore (Accesso Completo)', 'success');
        } else {
            currentUserRole = 'editor';
            showToast('Benvenuto Operatore (Accesso Modifica)', 'info');
        }
        
        closeAdminAuth();
        
        // Apre il pannello admin in modo sicuro
        if (typeof showAdminPanel === 'function') {
            showAdminPanel();
        } else {
             document.getElementById('admin-panel').style.display = 'flex';
        }
        
    } catch (error) {
        console.error("Errore Auth:", error);
        errorElement.style.display = 'block';
        errorElement.textContent = "Email o password errati";
        passInput.value = '';
    }
}

function showAdminPanel() {
    document.getElementById('admin-panel').style.display = 'flex';
    
    // NUOVO: Nascondi sezioni sensibili se non è admin
    const restrictedSections = document.querySelectorAll('.import-export-section, .backup-section, .analytics-actions-section');
    
    restrictedSections.forEach(section => {
        if (currentUserRole === 'admin') {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });

    loadAdminFontane();
    loadAdminBeverini();
    loadAdminNews();
    updateDashboardStats();
    
    // ✅ CARICA ANALYTICS DASHBOARD
    loadAnalyticsDashboard();
    updatePerformanceMetrics();
    
    const savedLog = localStorage.getItem('activityLog');
    if (savedLog) {
        activityLog = JSON.parse(savedLog);
        updateActivityLog();
    }
}

function closeAdminPanel() {
    document.getElementById('admin-panel').style.display = 'none';
}

function logoutAdmin() {
    isAdminAuthenticated = false;
    currentUserRole = null; // Reset ruolo
    
    // --- NUOVO: Rimuove il "pass" per la manutenzione ---
    localStorage.removeItem('abc_admin_logged');
    // ----------------------------------------------------

    if (adminAuthTimeout) {
        clearTimeout(adminAuthTimeout);
        adminAuthTimeout = null;
    }
    closeAdminPanel();
    showToast('Logout amministratore effettuato', 'success');
    logActivity('Logout amministratore');

    // --- NUOVO: Ricarica la pagina per riapplicare eventuali blocchi ---
    // Diamo 1 secondo per leggere il toast di conferma
    setTimeout(() => window.location.reload(), 1000);
}

// Navigation and Screen Management
function showScreen(screenId) {
    const currentScreen = screenHistory[screenHistory.length - 1];
    
    if (currentScreen === screenId) return;
    
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none';
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.style.display = 'flex';
        setTimeout(() => {
            targetScreen.classList.add('active');
        }, 10);
        
        screenHistory.push(screenId);
        if (screenHistory.length > 10) {
            screenHistory = screenHistory.slice(-10);
        }
        
        // ✅ CORREZIONE FONDAMENTALE: Forza lo scroll all'inizio della pagina per tutte le schermate
        resetScroll();
        
        initializeScreenContent(screenId);
    }
    
    updateTabBar(screenId);
    
    // CORREZIONE: Nascondi sempre il pulsante di navigazione quando si cambia schermata
    document.getElementById('fixed-navigate-btn').classList.add('hidden');
    
    // Pulisci il backPressTimer se navighiamo in avanti dalla Home
    if (backPressTimer) {
        clearTimeout(backPressTimer);
        backPressTimer = null;
        const toast = document.getElementById('toast');
        if (toast) toast.classList.remove('show');
    }
}

function goBack() {
    // CORREZIONE: Nascondi subito il pulsante di navigazione all'inizio di goBack
    document.getElementById('fixed-navigate-btn').classList.add('hidden');
    
    if (screenHistory.length > 1) {
        screenHistory.pop();
        const previousScreen = screenHistory[screenHistory.length - 1];
        
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        const targetScreen = document.getElementById(previousScreen);
        if (targetScreen) {
            targetScreen.style.display = 'block';
            setTimeout(() => {
                targetScreen.classList.add('active');
            }, 10);
            
            // ✅ CORREZIONE: Forza lo scroll anche quando si torna indietro
            resetScroll();
            
            initializeScreenContent(previousScreen);
        }
        updateTabBar(previousScreen);
    } else {
        showScreen('home-screen');
    }
}

function updateTabBar(activeScreen) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    const activeTab = document.querySelector(`.tab-btn[data-target="${activeScreen}"]`);
    if (activeTab) activeTab.classList.add('active');
}

function initializeScreenContent(screenId) {
    switch(screenId) {
        case 'fontane-screen':
            loadFontane();
            break;
        case 'beverini-screen':
            loadBeverini();
            break;
        case 'mappa-screen':
            initMappa();
            break;
        case 'news-screen':
            loadNews();
            break;
    }
}
// Data Loading Functions
async function loadFontane() {
    const fontaneList = document.getElementById('fontane-list');
    if (!fontaneList) return;
    
    showSkeletonLoader(fontaneList);
    
    try {
        await loadFirebaseData('fontane');
        renderGridItems(fontaneList, getFilteredItems('fontane'), 'fontana');
    } catch (error) {
        showToast('Errore nel caricamento fontane', 'error');
    }
}

async function loadBeverini() {
    const beveriniList = document.getElementById('beverini-list');
    if (!beveriniList) return;
    
    showSkeletonLoaderCompact(beveriniList);
    
    try {
        await loadFirebaseData('beverini');
        renderCompactItems(beveriniList, getFilteredItems('beverini'), 'beverino');
    } catch (error) {
        showToast('Errore nel caricamento beverini', 'error');
    }
}

async function loadNews() {
    const newsList = document.getElementById('news-list');
    if (!newsList) return;
    
    try {
        await loadFirebaseData('news');
        renderNewsItems(newsList, appData.news);
    } catch (error) {
        showToast('Errore nel caricamento news', 'error');
    }
}

function getFilteredItems(type) {
    const items = appData[type];
    const filter = currentFilter[type];

    if (!items || filter === 'all') {
        return items || [];
    }

    return items.filter(item => item.stato === filter);
}

function setFilter(type, stato) {
    currentFilter[type] = stato;

    document.querySelectorAll(`#${type}-screen .filter-btn`).forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`#${type}-screen .filter-btn.${stato}`).classList.add('active');

    if (type === 'fontane') {
        renderGridItems(document.getElementById('fontane-list'), getFilteredItems('fontane'), 'fontana');
    } else if (type === 'beverini') {
        renderCompactItems(document.getElementById('beverini-list'), getFilteredItems('beverini'), 'beverino');
    }
}

const debouncedFilter = debounce(function(type, query) {
    const container = document.getElementById(`${type}-list`);
    if (!container) return;
    
    let items;
    if (type === 'beverini') {
        items = container.getElementsByClassName('compact-item');
    } else {
        items = container.getElementsByClassName('grid-item');
    }

    let visibleCount = 0;
    for (let i = 0; i < items.length; i++) {
        let name, address;

        if (type === 'beverini') {
            name = items[i].getElementsByClassName('compact-item-name')[0].textContent;
            address = items[i].getElementsByClassName('compact-item-address')[0].textContent;
        } else {
            name = items[i].getElementsByClassName('item-name')[0].textContent;
            address = items[i].getElementsByClassName('item-address')[0].textContent;
        }

        const isVisible = name.toLowerCase().includes(query.toLowerCase()) ||
                         address.toLowerCase().includes(query.toLowerCase());
        items[i].style.display = isVisible ? 'flex' : 'none';
        if (isVisible) visibleCount++;
    }

    if (visibleCount === 0 && query) {
        const existingEmptyStates = container.getElementsByClassName('empty-state');
        for (let i = 0; i < existingEmptyStates.length; i++) {
            existingEmptyStates[i].remove();
        }
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-state-icon"><i class="fas fa-search"></i></div>
            <div class="empty-state-text">Nessun risultato trovato</div>
            <div class="empty-state-subtext">Prova a modificare i termini di ricerca</div>
        `;
        container.appendChild(emptyState);
    } else if (query === '') {
        const emptyStates = container.getElementsByClassName('empty-state');
        for (let i = 0; i < emptyStates.length; i++) {
            emptyStates[i].remove();
        }
    }
}, 300);

// Rendering Functions
function showSkeletonLoader(container, count = 6) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeletonItem = document.createElement('div');
        skeletonItem.className = 'grid-item';
        skeletonItem.innerHTML = `
            <div class="skeleton-loader skeleton-image"></div>
            <div class="item-content">
                <div class="skeleton-loader skeleton-text"></div>
                <div class="skeleton-loader skeleton-text short"></div>
                <div class="item-footer">
                    <div class="skeleton-loader skeleton-text" style="width: 80px;"></div>
                    <div class="skeleton-loader skeleton-text" style="width: 40px;"></div>
                </div>
            </div>
        `;
        container.appendChild(skeletonItem);
    }
}

function showSkeletonLoaderCompact(container, count = 6) {
    container.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const skeletonItem = document.createElement('div');
        skeletonItem.className = 'compact-item';
        skeletonItem.innerHTML = `
            <div class="skeleton-loader" style="width: 80px; height: 80px;"></div>
            <div class="compact-item-content">
                <div class="compact-item-header">
                    <div class="skeleton-loader skeleton-text" style="width: 70%;"></div>
                    <div class="skeleton-loader skeleton-text" style="width: 20px; height: 20px;"></div>
                </div>
                <div class="skeleton-loader skeleton-text short" style="width: 90%;"></div>
                <div class="compact-item-footer">
                    <div class="skeleton-loader skeleton-text" style="width: 80px;"></div>
                    <div class="skeleton-loader skeleton-text" style="width: 40px;"></div>
                </div>
            </div>
        `;
        container.appendChild(skeletonItem);
    }
}
function renderGridItems(container, items, type) {
    // 1. GESTIONE STATO VUOTO (Tuo codice originale mantenuto)
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-${type === 'fontana' ? 'monument' : 'faucet'}"></i></div>
                <div class="empty-state-text">Nessun elemento trovato</div>
                <div class="empty-state-subtext">Prova a cambiare i filtri di ricerca</div>
            </div>
        `;
        return;
    }
    
    // 2. RECUPERA HIGHLIGHTS (Badge Nuovo/Riparato)
    const highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "fixed": []}');

    // 3. HELPER PER TRADURRE LO STATO (Funzionante -> Working)
    const getStatusLabel = (stato) => {
        const statusKey = {
            'funzionante': 'status_working',
            'non-funzionante': 'status_broken',
            'manutenzione': 'status_maintenance'
        }[stato] || 'status_working';
        
        // Se esiste la traduzione usa quella, altrimenti usa lo stato originale
        return (translations && translations[currentLanguage]) ? translations[currentLanguage][statusKey] : stato;
    };

    container.innerHTML = '';
    
    items.forEach(item => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        
        // GESTORE CLICK (Mantiene la tua logica di navigazione)
        gridItem.onclick = () => {
            // Nota: passo item.id come nel tuo codice originale
            showDetail(item.id, type);                      
        };
        
        // LOGICA BADGE (Mantenuta)
        let badgeHTML = '';
        if (highlights.new.includes(item.id)) badgeHTML = '<span class="badge-new">NUOVO</span>';
        else if (highlights.fixed.includes(item.id)) badgeHTML = '<span class="badge-fixed">RIPARATO</span>';

        // LOGICA IMMAGINE CUSTOM (Mantenuta)
        const hasCustomImage = item.immagine && item.immagine.trim() !== '';
        
        // RENDER HTML (Aggiornato con getLocalizedText e getStatusLabel)
        gridItem.innerHTML = `
            <div class="item-image-container">
                <img src="${item.immagine || './images/sfondo-home.jpg'}" 
                     alt="${getLocalizedText(item, 'nome')}" 
                     class="item-image" 
                     onerror="this.style.display='none'; this.parentElement.classList.add('fallback-active'); this.parentElement.innerHTML += '<div class=\\'image-fallback\\'><i class=\\'fas fa-image\\'></i></div>';">
            </div>
            <div class="item-content">
                <div class="item-name">${getLocalizedText(item, 'nome')} ${badgeHTML}</div>
                
                <div class="item-address">${item.indirizzo}</div>
                
                <div class="item-footer">
                    <span class="item-status status-${item.stato}">${getStatusLabel(item.stato)}</span>
                    
                    <span class="image-indicator ${hasCustomImage ? 'image-custom' : 'image-default'}">
                        ${hasCustomImage ? '<i class="fas fa-check"></i>' : '<i class="fas fa-image"></i>'}
                    </span>
                </div>
            </div>
        `;
        container.appendChild(gridItem);
    });
}

function renderCompactItems(container, items, type) {
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-faucet"></i></div>
                <div class="empty-state-text">Nessun elemento trovato</div>
                <div class="empty-state-subtext">Prova a cambiare i filtri di ricerca</div>
            </div>
        `;
        return;
    }
    
    // Recupera highlights
    const highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "fixed": []}');

    // Helper per tradurre lo stato (come abbiamo fatto per le fontane)
    const getStatusLabel = (stato) => {
        const statusKey = {
            'funzionante': 'status_working',
            'non-funzionante': 'status_broken',
            'manutenzione': 'status_maintenance'
        }[stato] || 'status_working';
        return (translations && translations[currentLanguage]) ? translations[currentLanguage][statusKey] : stato;
    };

    container.innerHTML = '';
    items.forEach(item => {
        const compactItem = document.createElement('div');
        compactItem.className = 'compact-item';

        // Badge Logic
        let badgeHTML = '';
        if (highlights.new.includes(item.id)) badgeHTML = '<span class="badge-new">NUOVO</span>';
        else if (highlights.fixed.includes(item.id)) badgeHTML = '<span class="badge-fixed">RIPARATO</span>';

        const totalLength = (item.nome || '').length + (item.indirizzo || '').length;
        if (totalLength > 100) compactItem.classList.add('very-long-content');
        else if (totalLength > 60) compactItem.classList.add('long-content');

        compactItem.onclick = () => {
            showDetail(item.id, type);
            currentLatLng = { lat: item.latitudine, lng: item.longitudine };            
        };

        const hasCustomImage = item.immagine && item.immagine.trim() !== '';
        
        // USA getLocalizedText QUI
        compactItem.innerHTML = `
            <div class="compact-item-image-container">
                <img src="${item.immagine || './images/default-beverino.jpg'}"
                     alt="${getLocalizedText(item, 'nome')}" 
                     class="compact-item-image"
                     onerror="this.style.display='none'; this.parentElement.classList.add('fallback-active'); this.parentElement.innerHTML += '<div class=\\'compact-image-fallback\\'><i class=\\'fas fa-faucet\\'></i></div>';">
            </div>
            <div class="compact-item-content">
                <div class="compact-item-header">
                    <div class="compact-item-name">${getLocalizedText(item, 'nome')} ${badgeHTML}</div>
                    <span class="image-indicator ${hasCustomImage ? 'image-custom' : 'image-default'}">
                        ${hasCustomImage ? '<i class="fas fa-check"></i>' : '<i class="fas fa-image"></i>'}
                    </span>
                </div>
                <div class="compact-item-address">${item.indirizzo}</div>
                <div class="compact-item-footer">
                    <span class="compact-item-status status-${item.stato}">${getStatusLabel(item.stato)}</span>
                </div>
            </div>
        `;
        container.appendChild(compactItem);
    });
}

function renderNewsItems(container, news) {
    if (!news || news.length === 0) {
        container.innerHTML = '<div class="no-results">Nessuna news disponibile</div>';
        return;
    }
    
    // Recupera highlights (per badge NUOVO)
    const highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "fixed": []}');
    
    container.innerHTML = '';
    // Ordina per data decrescente
    const sortedNews = [...news].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    sortedNews.forEach(item => {
        let badgeHTML = '';
        if (highlights.new.includes(item.id)) {
            badgeHTML = '<span class="badge-new" style="float: right;">NUOVO</span>';
        }

        const newsCard = document.createElement('div');
        newsCard.className = 'news-card';
        
        // QUI AVVIENE LA MAGIA per le News:
        newsCard.innerHTML = `
            <div class="news-header">
                <div class="news-title">${getLocalizedText(item, 'titolo')} ${badgeHTML}</div>
                <div class="news-date">${formatDate(item.data)}</div>
            </div>
            <div class="news-content">${getLocalizedText(item, 'contenuto')}</div>
            <div class="news-footer">
                <span class="news-category">${item.categoria}</span>
                <span class="news-source">Fonte: ${item.fonte}</span>
            </div>
        `;
        container.appendChild(newsCard);
    });
}

// Detail View
function showDetail(id, type) {
    // 1. MEMORIA PER CAMBIO LINGUA
    currentDetailId = id;
    currentDetailType = type;

    // Disabilita il ripristino automatico dello scroll del browser (SPESSO È QUESTO IL COLPEVOLE)
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    let item, screenId, titleElement, contentElement;
    const isFontana = (type === 'fontana' || type === 'fontane');

    // 2. IDENTIFICAZIONE ELEMENTI
    if (isFontana) {
        item = appData.fontane.find(f => f.id == id);
        screenId = 'fontana-detail-screen';
        titleElement = document.getElementById('fontana-detail-title');
        contentElement = document.getElementById('fontana-detail-content');
    } else {
        item = appData.beverini.find(b => b.id == id);
        screenId = 'beverino-detail-screen';
        titleElement = document.getElementById('beverino-detail-title');
        contentElement = document.getElementById('beverino-detail-content');
    }
    
    if (!item) {
        showToast('Elemento non trovato', 'error');
        return;
    }

    // 3. LOGICA TITOLI E TESTI
    const t = (window.translations && window.translations[currentLanguage]) ? window.translations[currentLanguage] : {};
    if (t.screen_fountains) {
        titleElement.textContent = isFontana ? t.screen_fountains : t.screen_drinkers;
    }

    const defaultImage = isFontana ? './images/sfondo-home.jpg' : './images/default-beverino.jpg';
    
    // Helper stato
    const getStatusLabel = (stato) => {
        const key = {
            'funzionante': 'status_working',
            'non-funzionante': 'status_broken',
            'manutenzione': 'status_maintenance'
        }[stato] || 'status_working';
        return t[key] || stato;
    };

    // 4. GENERAZIONE HTML
    contentElement.innerHTML = `
        <div class="detail-header-image">
            <img src="${item.immagine || defaultImage}" class="detail-image" onerror="this.src='${defaultImage}'">
        </div>
        <div class="detail-info">
            <h2 class="detail-name">${getLocalizedText(item, 'nome')}</h2>
            <div class="info-row">
                <span class="info-label"><i class="fas fa-map-marker-alt"></i></span>
                <span class="info-value">${item.indirizzo}</span>
            </div>
            <div class="info-row">
                <span class="item-status status-${item.stato}">${getStatusLabel(item.stato)}</span>
            </div>
            ${item.anno ? `<div class="info-row">${t.label_year || 'Anno'}: ${item.anno}</div>` : ''}
            <div class="detail-description">${getLocalizedText(item, 'descrizione') || ''}</div>
            ${getLocalizedText(item, 'storico') ? `<div class="detail-history"><h3>${t.label_history || 'Storia'}</h3><p>${getLocalizedText(item, 'storico')}</p></div>` : ''}
            <div class="detail-actions">
                <button class="detail-action-btn primary" onclick="navigateTo(${item.latitudine}, ${item.longitudine})">
                    <i class="fas fa-location-arrow"></i> ${t.navigate_btn || 'Naviga'}
                </button>
                <button class="detail-action-btn" onclick="openReportScreen('${(getLocalizedText(item, 'nome') || '').replace(/'/g, "\\\\'")}')" style="background: #ef4444; color: white;">
                    <i class="fas fa-bullhorn"></i> ${t.report_btn || 'Segnala'}
                </button>
            </div>
        </div>
    `;
    
    currentLatLng = { lat: item.latitudine, lng: item.longitudine };
    
    // 5. CAMBIO SCHERMATA
    showScreen(screenId);
    
    // 6. RESET SCROLL "NUCLEARE" (Agisce su tutto)
    // Usiamo requestAnimationFrame per sincronizzarci col rendering del browser
    requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        
        const activeScreen = document.getElementById(screenId);
        if (activeScreen) activeScreen.scrollTop = 0;
        
        if (contentElement) contentElement.scrollTop = 0;
    });

    // Doppio controllo dopo 50ms per sicurezza (se l'immagine carica lentamente)
    setTimeout(() => {
        window.scrollTo(0, 0);
        const activeScreen = document.getElementById(screenId);
        if (activeScreen) activeScreen.scrollTop = 0;
    }, 50);
}
// ✅ generateDetailHTML con logica condizionale per nascondere la descrizione vuota
function generateDetailHTML(item, type) {
    let specificFields = '';
    if (type === 'fontana') {
        specificFields = `
            ${item.anno ? `<div class="info-item"><span class="info-label">Anno:</span><span class="info-value">${item.anno}</span></div>` : ''}
            ${item.storico ? `<div class="info-item"><span class="info-label">Storico:</span><span class="info-value">${item.storico}</span></div>` : ''}
        `;
    }
    
    // MODIFICA: Determina l'immagine di fallback condizionale
    const fallbackImage = type === 'fontana' ? './images/sfondo-home.jpg' : './images/default-beverino.jpg';

    // ✅ LOGICA CONDIZIONALE: crea il blocco HTML solo se la descrizione non è vuota.
    const descriptionHTML = (item.descrizione && item.descrizione.trim())
        ? `
            <div class="detail-info">
                <div class="info-item">
                    <span class="info-label">Descrizione:</span>
                    <span class="info-value">${item.descrizione}</span>
                </div>
            </div>
        ` 
        : ''; // Se vuota, la riga non appare

    return `
        <img src="${item.immagine || fallbackImage}" class="detail-image" alt="${item.nome}" onerror="this.src='${fallbackImage}'">
        <div class="detail-info">
            <div class="info-item">
                <span class="info-label">${type === 'fontana' ? 'Indirizzo:' : 'Posizione:'}</span>
                <span class="info-value">${item.indirizzo}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Stato:</span>
                <span class="info-value">${getStatusText(item.stato)}</span>
            </div>
            ${specificFields}
        </div>
        ${descriptionHTML}
        <div class="detail-actions">
            <button class="detail-action-btn primary" onclick="navigateTo(${item.latitudine}, ${item.longitudine})">
                <i class="fas fa-map-marker-alt"></i> Naviga
            </button>
            <button class="detail-action-btn secondary" onclick="shareItem('${item.id}', '${type}')">
                <i class="fas fa-share-alt"></i> Condividi
            </button>
        </div>
    `;
}

// Navigation
function navigateTo(lat, lng) {
    currentLatLng = { lat, lng };
    document.getElementById('navigation-modal').style.display = 'flex';
}

function navigateToFixed() {
    if (!currentLatLng) return;
    navigateTo(currentLatLng.lat, currentLatLng.lng);
}

function openGoogleMaps() {
    if (!currentLatLng) return;
    const { lat, lng } = currentLatLng;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    window.open(url, '_blank');
    closeNavigationModal();
    showToast('Apertura Google Maps...', 'info');
}

function openAppleMaps() {
    if (!currentLatLng) return;
    const { lat, lng } = currentLatLng;
    const url = `http://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`;
    window.open(url, '_blank');
    closeNavigationModal();
    showToast('Apertura Apple Maps...', 'info');
}

function closeNavigationModal() {
    document.getElementById('navigation-modal').style.display = 'none';
    currentLatLng = null;
}

// Map Functions
function initMappa() {
    if (!map) {
        map = L.map('map').setView([40.8518, 14.2681], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        clusterGroup = L.markerClusterGroup();
        map.addLayer(clusterGroup);

        addMapControls();
        setupSearchAutocomplete();
    }

    clusterGroup.clearLayers();
    markers.clear();

    appData.fontane.forEach(fontana => {
        if (isValidCoordinate(fontana.latitudine, fontana.longitudine)) {
            const marker = createMarker(fontana, 'fontana');
            const markerId = `fontana-${fontana.id}`;

            markers.set(markerId, marker);
            clusterGroup.addLayer(marker);
        }
    });

    appData.beverini.forEach(beverino => {
        if (isValidCoordinate(beverino.latitudine, beverino.longitudine)) {
            const marker = createMarker(beverino, 'beverino');
            const markerId = `beverino-${beverino.id}`;

            markers.set(markerId, marker);
            clusterGroup.addLayer(marker);
        }
    });

    if (markers.size > 0) {
        const bounds = clusterGroup.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.1));
        }
    }

    requestUserLocation();
}

function createMarker(item, type) {
    const icon = getIconForType(type);
    const marker = L.marker([item.latitudine, item.longitudine], { icon });

    marker.bindPopup(`
        <div class="leaflet-popup-content">
            <div class="popup-title">${item.nome}</div>
            <p>${item.indirizzo}</p>
            <p>Stato: ${getStatusText(item.stato)}</p>
            <button class="popup-btn" onclick="showDetail('${item.id}', '${type}')">Dettagli</button>
            <button class="popup-btn" onclick="navigateTo(${item.latitudine}, ${item.longitudine})" style="margin-top: 5px; background: var(--primary-green);">Naviga</button>
        </div>
    `);

    return marker;
}

function isValidCoordinate(lat, lng) {
    return !isNaN(lat) && !isNaN(lng) &&
           lat >= -90 && lat <= 90 &&
           lng >= -180 && lng <= 180;
}

function getIconForType(type) {
    const iconConfigs = {
        fontana: {
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        },
        beverino: {
            iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
        }
    };

    return L.icon(iconConfigs[type] || iconConfigs.fontana);
}

function addMapControls() {
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'map-controls';
    
    const locateBtn = document.createElement('button');
    locateBtn.className = 'map-control-btn';
    locateBtn.innerHTML = '<i class="fas fa-location-arrow"></i>';
    locateBtn.title = 'Centra sulla mia posizione';
    locateBtn.onclick = requestUserLocation;
    
    const fitBoundsBtn = document.createElement('button');
    fitBoundsBtn.className = 'map-control-btn';
    fitBoundsBtn.innerHTML = '<i class="fas fa-expand"></i>';
    fitBoundsBtn.title = 'Mostra tutti i punti';
    fitBoundsBtn.onclick = fitMapToMarkers;
    
    controlsContainer.appendChild(locateBtn);
    controlsContainer.appendChild(fitBoundsBtn);
    document.getElementById('mappa-screen').appendChild(controlsContainer);
}

function requestUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                if (window.userMarker) {
                    map.removeLayer(window.userMarker);
                }
                window.userMarker = L.marker([latitude, longitude], {
                    icon: L.icon({
                        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                        iconSize: [25, 41],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34]
                    })
                })
                .addTo(map)
                .bindPopup('La tua posizione');

                map.setView([latitude, longitude], 16);
                showToast('Posizione corrente visualizzata sulla mappa', 'success');
            },
            error => {
                handleGeolocationError(error);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    } else {
        showToast('Geolocalizzazione non supportata dal browser', 'error');
    }
}

function handleGeolocationError(error) {
    let message = 'Errore nel rilevamento posizione';

    switch(error.code) {
        case error.PERMISSION_DENIED:
            message = 'Autorizzazione alla geolocalizzazione negata.';
            break;
        case error.POSITION_UNAVAILABLE:
            message = 'Posizione non disponibile. Verifica che il GPS sia attivo.';
            break;
        case error.TIMEOUT:
            message = 'Timeout nel rilevamento. Riprova in zona con migliore ricezione.';
            break;
        default:
            message = `Errore: ${error.message}`;
    }

    showToast(message, 'error');
}

function fitMapToMarkers() {
    if (markers.size > 0) {
        const bounds = clusterGroup.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.1));
            showToast('Vista adattata a tutti i punti', 'success');
        }
    } else {
        showToast('Nessun punto da mostrare', 'info');
    }
}

// Share Function
function shareItem(id, type) {
    let item;
    if (type === 'fontana') {
        item = appData.fontane.find(f => f.id == id);
    } else {
        item = appData.beverini.find(b => b.id == id);
    }
    if (!item) {
        showToast('Elemento non trovato', 'error');
        return;
    }
    
    const text = `${item.nome} - ${item.indirizzo}`;
    const url = `${window.location.origin}${window.location.pathname}?${type}=${id}`;
    
    if (navigator.share) {
        navigator.share({
            title: item.nome,
            text: text,
            url: url
        })
        .then(() => showToast('Condivisione completata', 'success'))
        .catch(error => {
            if (error.name !== 'AbortError') {
                showToast('Errore nella condivisione', 'error');
            }
        });
    } else {
        navigator.clipboard.writeText(`${text} - ${url}`)
            .then(() => showToast('Link copiato negli appunti', 'success'))
            .catch(() => {
                const textArea = document.createElement('textarea');
                textArea.value = `${text} - ${url}`;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                showToast('Link copiato negli appunti', 'success');
            });
    }
}

// Search Functions
async function searchAddressOnMap(query) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=it&accept-language=it`,
            {
                headers: {
                    'User-Agent': 'FontaneBeveriniNapoli/1.0'
                }
            }
        );

        const results = await response.json();

        if (results.length > 0) {
            return results;
        } else {
            showToast('Nessun risultato trovato', 'warning');
            return [];
        }
    } catch (error) {
        showToast('Errore nella ricerca', 'error');
        return [];
    }
}

function handleMapSearch(event) {
    if (event.key === 'Enter') {
        performMapSearch();
    }
}

async function performMapSearch() {
    const query = document.getElementById('map-search-input').value.trim();
    if (!query) return;

    showToast('Ricerca in corso...', 'info');

    const results = await searchAddressOnMap(query);
    displaySearchResults(results);
}

function displaySearchResults(results) {
    searchResults = results;
    const container = document.getElementById('map-search-results');

    if (results.length === 0) {
        container.innerHTML = '<div class="search-result-item">Nessun risultato trovato</div>';
        container.style.display = 'block';
        return;
    }

    container.innerHTML = results.map((result, index) => `
        <div class="search-result-item" onclick="selectSearchResult(${index})">
            <div class="search-result-name">${result.display_name.split(',')[0]}</div>
            <div class="search-result-address">${result.display_name}</div>
        </div>
    `).join('');

    container.style.display = 'block';
}

function selectSearchResult(index) {
    const result = searchResults[index];

    if (searchMarker) {
        map.removeLayer(searchMarker);
    }

    searchMarker = L.marker([result.lat, result.lon])
        .addTo(map)
        .bindPopup(`
            <div class="leaflet-popup-content">
                <div class="popup-title">${result.display_name.split(',')[0]}</div>
                <p>${result.display_name}</p>
                <button class="popup-btn" onclick="centerOnSearchResult(${result.lat}, ${result.lon})">Centra qui</button>
                <button class="popup-btn" onclick="addAsNewPoint('${result.display_name}', ${result.lat}, ${result.lon})"
                        style="background: var(--primary-green); margin-top: 5px;">
                    Aggiungi come nuovo punto
                </button>
            </div>
        `)
        .openPopup();

    map.setView([result.lat], [result.lon], 16);

    document.getElementById('map-search-results').style.display = 'none';
    document.getElementById('map-search-input').value = '';

    showToast('Risultato trovato!', 'success');
}

function centerOnSearchResult(lat, lng) {
    map.setView([lat, lng], 16);
}

function addAsNewPoint(name, lat, lng) {
    const type = name.toLowerCase().includes('fontana') ? 'fontana' : 'beverino';

    showAdminTab(`${type}-admin`);

    document.getElementById(`${type}-nome`).value = name.split(',')[0];
    document.getElementById(`${type}-indirizzo`).value = name;
    document.getElementById(`${type}-latitudine`).value = lat;
    document.getElementById(`${type}-longitudine`).value = lng;

    showToast(`Compila i campi mancanti e salva il nuovo ${type}`, 'info');
}

function setupSearchAutocomplete() {
    const searchInput = document.getElementById('map-search-input');

    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        const query = this.value.trim();

        if (query.length < 3) {
            document.getElementById('map-search-results').style.display = 'none';
            return;
        }

        searchTimeout = setTimeout(async () => {
            const results = await searchAddressOnMap(query);
            displaySearchResults(results);
        }, 500);
    });

    document.addEventListener('click', function(e) {
        if (!e.target.closest('.map-search-container')) {
            document.getElementById('map-search-results').style.display = 'none';
        }
    });
}

// Location Functions
function getCurrentLocationCoordinatesOnly(type) {
    showToast('Rilevamento coordinate in corso...', 'info');

    if (!navigator.geolocation) {
        showToast('Geolocalizzazione non supportata dal browser', 'error');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            document.getElementById(`${type}-latitudine`).value = lat.toFixed(6);
            document.getElementById(`${type}-longitudine`).value = lng.toFixed(6);

            showToast('Coordinate rilevate con successo!', 'success');
            logActivity(`Coordinate rilevate per ${type}`);
        },
        handleGeolocationError,
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 60000
        }
    );
}

async function getCurrentLocationWithAddress(type) {
    showToast('Rilevamento posizione e indirizzo...', 'info');

    if (!navigator.geolocation) {
        showToast('Geolocalizzazione non supportata dal browser', 'error');
        return;
    }

    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve,
                reject,
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }
            );
        });
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        document.getElementById(`${type}-latitudine`).value = lat.toFixed(6);
        document.getElementById(`${type}-longitudine`).value = lng.toFixed(6);

        try {
            const address = await reverseGeocode(lat, lng);
            if (address) {
                document.getElementById(`${type}-indirizzo`).value = address;
                showToast('Posizione e indirizzo rilevati!', 'success');
                logActivity(`Posizione e indirizzo rilevati per ${type}`);
            } else {
                document.getElementById(`${type}-indirizzo`).value = `Coordinate: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                showToast('Posizione rilevata (indirizzo non disponibile)', 'warning');
            }
        } catch (geocodeError) {
            document.getElementById(`${type}-indirizzo`).value = `Coordinate: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            showToast('Posizione rilevata - inserisci indirizzo manualmente', 'warning');
        }

    } catch (error) {
        handleGeolocationError(error);
    }
}

async function reverseGeocode(lat, lng) {
    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'it-IT,it;q=0.9',
                    'User-Agent': 'FontaneBeveriniNapoli/1.0'
                }
            }
        );
        
        const data = await response.json();
        
        if (data && data.address) {
            const parts = [];
            if (data.address.road) parts.push(data.address.road);
            if (data.address.house_number) parts.push(data.address.house_number);
            
            if (parts.length > 0) {
                let formattedAddress = parts.join(', ');
                
                if (data.address.city || data.address.town || data.address.village) {
                    const city = data.address.city || data.address.town || data.address.village;
                    if (data.address.postcode) {
                        formattedAddress += `, ${data.address.postcode} ${city}`;
                    } else {
                        formattedAddress += `, ${city}`;
                    }
                }
                return formattedAddress;
            }
            
            return data.address.city || data.address.town || data.address.village || null;
        }
    } catch (error) {
        console.error('Errore reverse geocoding:', error);
    }
    
    return null;
}

// Admin Panel Functions
document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
        this.classList.add('active');
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId).classList.add('active');
    });
});

function showAdminTab(tabId) {
    document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(content => content.classList.remove('active'));
    document.querySelector(`.admin-tab-btn[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(tabId).classList.add('active');
}

// Fontane Admin
async function loadAdminFontane() {
    const tbody = document.getElementById('fontane-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Ordina per ID decrescente (i più recenti in alto)
    const sortedFontane = [...appData.fontane].sort((a, b) => {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idB - idA; 
    });

    sortedFontane.forEach(fontana => {
        // Pulsante singolo elimina (solo Admin)
        const deleteButton = currentUserRole === 'admin' 
            ? `<button class="delete-btn" onclick="deleteFontana('${fontana.id}')">Elimina</button>` 
            : '';
            
        // NUOVO: Checkbox selezione multipla (SOLO ADMIN)
        const checkboxHtml = currentUserRole === 'admin'
            ? `<input type="checkbox" class="select-item-fontane" value="${fontana.id}" onchange="updateDeleteButtonState('fontane')">`
            : ''; 

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">${checkboxHtml}</td>
            <td>${fontana.id}</td>
            <td>${fontana.nome}</td>
            <td>${fontana.indirizzo}</td>
            <td><span class="item-status status-${fontana.stato}">${getStatusText(fontana.stato)}</span></td>
            <td class="admin-item-actions">
                <button class="edit-btn" onclick="editFontana('${fontana.id}')">Modifica</button>
                ${deleteButton}
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Resetta lo stato del pulsante elimina multiplo
    updateDeleteButtonState('fontane');
}

function editFontana(id) {
    const fontana = appData.fontane.find(f => f.id == id);
    if (!fontana) return;
    
    document.getElementById('fontana-id').value = fontana.id;
    
    // Campi Italiani
    document.getElementById('fontana-nome').value = fontana.nome || '';
    document.getElementById('fontana-descrizione').value = fontana.descrizione || '';
    document.getElementById('fontana-storico').value = fontana.storico || '';
    
    // Campi Inglesi (NUOVI - Usa ?. per sicurezza)
    if(document.getElementById('fontana-nome-en')) 
        document.getElementById('fontana-nome-en').value = fontana.nome_en || '';
    if(document.getElementById('fontana-descrizione-en')) 
        document.getElementById('fontana-descrizione-en').value = fontana.descrizione_en || '';
    if(document.getElementById('fontana-storico-en')) 
        document.getElementById('fontana-storico-en').value = fontana.storico_en || '';

    // Altri dati
    document.getElementById('fontana-indirizzo').value = fontana.indirizzo || '';
    document.getElementById('fontana-stato').value = fontana.stato || 'funzionante';
    document.getElementById('fontana-anno').value = fontana.anno || '';
    document.getElementById('fontana-latitudine').value = fontana.latitudine || '';
    document.getElementById('fontana-longitudine').value = fontana.longitudine || '';
    document.getElementById('fontana-immagine').value = fontana.immagine || '';
    
    showAdminTab('fontane-admin');
}

// MODIFICA: saveFontana con supporto offline
async function saveFontana(e) {
    e.preventDefault();
    
    try {
        const id = document.getElementById('fontana-id').value;
        const nome = document.getElementById('fontana-nome').value.trim();
        const indirizzo = document.getElementById('fontana-indirizzo').value.trim();
        const stato = document.getElementById('fontana-stato').value;
        const anno = document.getElementById('fontana-anno').value.trim();
        const descrizione = document.getElementById('fontana-descrizione').value.trim();
        const storico = document.getElementById('fontana-storico').value.trim();
        const latitudine = parseFloat(document.getElementById('fontana-latitudine').value) || 0;
        const longitudine = parseFloat(document.getElementById('fontana-longitudine').value) || 0;
        const immagine = document.getElementById('fontana-immagine').value.trim();
        
        // RECUPERO CAMPI INGLESI (Nuova parte fondamentale!)
        const nome_en = document.getElementById('fontana-nome-en') ? document.getElementById('fontana-nome-en').value.trim() : '';
        const descrizione_en = document.getElementById('fontana-descrizione-en') ? document.getElementById('fontana-descrizione-en').value.trim() : '';
        const storico_en = document.getElementById('fontana-storico-en') ? document.getElementById('fontana-storico-en').value.trim() : '';
        
        const fontanaData = {
            nome,
            nome_en, // SALVA INGLESE
            indirizzo,
            stato,
            anno,
            descrizione,
            descrizione_en, // SALVA INGLESE
            storico,
            storico_en, // SALVA INGLESE
            latitudine,
            longitudine,
            immagine,
            last_modified: new Date().toISOString()
        };
        
        // Validazione
        const validationErrors = validateFontanaData(fontanaData);
        if (validationErrors.length > 0) throw validationErrors[0];
        
        let savedId;
        const operation = id ? 'UPDATE' : 'CREATE';
        
        if (navigator.onLine) {
            if (id && id.trim() !== '') {
                savedId = await safeFirebaseOperation(saveFirebaseData, 'update_fontana', 'fontane', fontanaData, id);
                const index = appData.fontane.findIndex(f => f.id == id);
                if (index !== -1) appData.fontane[index] = { id, ...fontanaData };
                showToast('Fontana modificata con successo', 'success');
            } else {
                savedId = await safeFirebaseOperation(saveFirebaseData, 'create_fontana', 'fontane', fontanaData);
                appData.fontane.push({ id: savedId, ...fontanaData });
                showToast(`Fontana aggiunta con successo (ID: ${savedId})`, 'success');
            }
        } else {
            savedId = id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await addToSyncQueue(operation, 'fontane', fontanaData, savedId);
            if (operation === 'UPDATE') {
                const index = appData.fontane.findIndex(f => f.id == id);
                if (index !== -1) appData.fontane[index] = { id: savedId, ...fontanaData };
            } else {
                appData.fontane.push({ id: savedId, ...fontanaData });
            }
            showToast('Fontana salvata localmente.', 'info');
        }
        
        saveLocalData();
        loadAdminFontane();
        resetFontanaForm();
        loadFontane();
        updateDashboardStats();
        
    } catch (error) {
        await handleError('saveFontana', error, 'Errore nel salvataggio della fontana');
    }
}

function resetFontanaForm() {
    document.getElementById('fontana-form').reset();
    document.getElementById('fontana-id').value = '';
}

async function deleteFontana(id) {
    // NUOVO: Controllo permessi
    if (currentUserRole !== 'admin') {
        showToast('Non hai i permessi per eliminare', 'error');
        return;
    }

    if (!confirm('Sei sicuro di voler eliminare questa fontana?')) return;
    
    try {
        if (navigator.onLine) {
            await deleteFirebaseData('fontane', id);
        } else {
            // Offline: aggiungi a coda sync
            const fontana = appData.fontane.find(f => f.id == id);
            if (fontana) {
                await addToSyncQueue('DELETE', 'fontane', fontana, id);
            }
        }
        
        appData.fontane = appData.fontane.filter(f => f.id != id);
        
        saveLocalData();
        loadAdminFontane();
        loadFontane();
        updateDashboardStats();
        
        showToast('Fontana eliminata con successo', 'success');
        logActivity('Fontana eliminata');
    } catch (error) {
        showToast('Errore nell\'eliminazione della fontana', 'error');
    }
}
// Beverini Admin
async function loadAdminBeverini() {
    const tbody = document.getElementById('beverini-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const sortedBeverini = [...appData.beverini].sort((a, b) => {
        const idA = parseInt(a.id.replace(/\D/g, '')) || 0;
        const idB = parseInt(b.id.replace(/\D/g, '')) || 0;
        return idB - idA;
    });

    sortedBeverini.forEach(beverino => {
        const deleteButton = currentUserRole === 'admin' 
            ? `<button class="delete-btn" onclick="deleteBeverino('${beverino.id}')">Elimina</button>` 
            : '';

        // Checkbox SOLO ADMIN
        const checkboxHtml = currentUserRole === 'admin'
            ? `<input type="checkbox" class="select-item-beverini" value="${beverino.id}" onchange="updateDeleteButtonState('beverini')">`
            : '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">${checkboxHtml}</td>
            <td>${beverino.id}</td>
            <td>${beverino.nome}</td>
            <td>${beverino.indirizzo}</td>
            <td><span class="item-status status-${beverino.stato}">${getStatusText(beverino.stato)}</span></td>
            <td class="admin-item-actions">
                <button class="edit-btn" onclick="editBeverino('${beverino.id}')">Modifica</button>
                ${deleteButton}
            </td>
        `;
        tbody.appendChild(row);
    });
    updateDeleteButtonState('beverini');
}

// ✅ MODIFICA A: editBeverino con caricamento campo descrizione
function editBeverino(id) {
    const beverino = appData.beverini.find(b => b.id == id);
    if (!beverino) return;
    
    document.getElementById('beverino-id').value = beverino.id;
    document.getElementById('beverino-nome').value = beverino.nome || '';
    document.getElementById('beverino-indirizzo').value = beverino.indirizzo || '';
    document.getElementById('beverino-stato').value = beverino.stato || 'funzionante';
    document.getElementById('beverino-descrizione').value = beverino.descrizione || ''; 
    
    // Campi Inglesi (NUOVI)
    if(document.getElementById('beverino-nome-en'))
        document.getElementById('beverino-nome-en').value = beverino.nome_en || '';
    if(document.getElementById('beverino-descrizione-en'))
        document.getElementById('beverino-descrizione-en').value = beverino.descrizione_en || '';
    
    document.getElementById('beverino-latitudine').value = beverino.latitudine || '';
    document.getElementById('beverino-longitudine').value = beverino.longitudine || '';
    document.getElementById('beverino-immagine').value = beverino.immagine || '';
    
    showAdminTab('beverini-admin');
}

// ✅ MODIFICA B: saveBeverino con salvataggio campo descrizione e supporto offline
async function saveBeverino(e) {
    e.preventDefault();
    
    const id = document.getElementById('beverino-id').value;
    const nome = document.getElementById('beverino-nome').value.trim();
    const indirizzo = document.getElementById('beverino-indirizzo').value.trim();
    const stato = document.getElementById('beverino-stato').value;
    const latitudine = parseFloat(document.getElementById('beverino-latitudine').value) || 0;
    const longitudine = parseFloat(document.getElementById('beverino-longitudine').value) || 0;
    const immagine = document.getElementById('beverino-immagine').value.trim();
    const descrizione = document.getElementById('beverino-descrizione').value.trim();
    
    // Recupero campi inglesi
    const nome_en = document.getElementById('beverino-nome-en') ? document.getElementById('beverino-nome-en').value.trim() : '';
    const descrizione_en = document.getElementById('beverino-descrizione-en') ? document.getElementById('beverino-descrizione-en').value.trim() : '';
    
    const beverinoData = {
        nome,
        nome_en, // SALVA INGLESE
        indirizzo,
        stato,
        latitudine,
        longitudine,
        immagine,
        descrizione, 
        descrizione_en, // SALVA INGLESE
        last_modified: new Date().toISOString()
    };
    
    try {
        const validationErrors = validateBeverinoData(beverinoData);
        if (validationErrors.length > 0) throw validationErrors[0];
        
        let savedId;
        const operation = id ? 'UPDATE' : 'CREATE';
        
        if (navigator.onLine) {
            if (id && id.trim() !== '') {
                savedId = await safeFirebaseOperation(saveFirebaseData, 'update_beverino', 'beverini', beverinoData, id);
                const index = appData.beverini.findIndex(b => b.id == id);
                if (index !== -1) appData.beverini[index] = { id, ...beverinoData };
                showToast('Beverino modificato con successo', 'success');
            } else {
                savedId = await safeFirebaseOperation(saveFirebaseData, 'create_beverino', 'beverini', beverinoData);
                appData.beverini.push({ id: savedId, ...beverinoData });
                showToast(`Beverino aggiunto con successo (ID: ${savedId})`, 'success');
            }
        } else {
            savedId = id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await addToSyncQueue(operation, 'beverini', beverinoData, savedId);
            if (operation === 'UPDATE') {
                const index = appData.beverini.findIndex(b => b.id == id);
                if (index !== -1) appData.beverini[index] = { id: savedId, ...beverinoData };
            } else {
                appData.beverini.push({ id: savedId, ...beverinoData });
            }
            showToast('Beverino salvato localmente.', 'info');
        }
        
        saveLocalData();
        loadAdminBeverini();
        resetBeverinoForm();
        loadBeverini();
        updateDashboardStats();
        
    } catch (error) {
        await handleError('saveBeverino', error, 'Errore nel salvataggio del beverino');
    }
}

function resetBeverinoForm() {
    document.getElementById('beverino-form').reset();
    document.getElementById('beverino-id').value = '';
}

async function deleteBeverino(id) {
    // NUOVO: Controllo permessi
    if (currentUserRole !== 'admin') {
        showToast('Non hai i permessi per eliminare', 'error');
        return;
    }

    if (!confirm('Sei sicuro di voler eliminare questo beverino?')) return;
    
    try {
        if (navigator.onLine) {
            await deleteFirebaseData('beverini', id);
        } else {
            const beverino = appData.beverini.find(b => b.id == id);
            if (beverino) {
                await addToSyncQueue('DELETE', 'beverini', beverino, id);
            }
        }
        
        appData.beverini = appData.beverini.filter(b => b.id != id);
        
        saveLocalData();
        loadAdminBeverini();
        loadBeverini();
        updateDashboardStats();
        
        showToast('Beverino eliminato con successo', 'success');
        logActivity('Beverino eliminato');
    } catch (error) {
        showToast('Errore nell\'eliminazione del beverino', 'error');
    }
}

// News Admin
async function loadAdminNews() {
    const tbody = document.getElementById('news-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    // Ordina news per data (più recenti in alto)
    const sortedNews = [...appData.news].sort((a, b) => new Date(b.data) - new Date(a.data));

    sortedNews.forEach(news => {
        const deleteButton = currentUserRole === 'admin' 
            ? `<button class="delete-btn" onclick="deleteNews('${news.id}')">Elimina</button>` 
            : '';

        // Checkbox SOLO ADMIN
        const checkboxHtml = currentUserRole === 'admin'
            ? `<input type="checkbox" class="select-item-news" value="${news.id}" onchange="updateDeleteButtonState('news')">`
            : '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">${checkboxHtml}</td>
            <td>${news.id}</td>
            <td>${news.titolo}</td>
            <td>${formatDate(news.data)}</td>
            <td>${news.categoria}</td>
            <td class="admin-item-actions">
                <button class="edit-btn" onclick="editNews('${news.id}')">Modifica</button>
                ${deleteButton}
            </td>
        `;
        tbody.appendChild(row);
    });
    updateDeleteButtonState('news');
}

function editNews(id) {
    const news = appData.news.find(n => n.id == id);
    if (!news) return;
    
    document.getElementById('news-id').value = news.id;
    
    // Campi Italiani
    document.getElementById('news-titolo').value = news.titolo || '';
    document.getElementById('news-contenuto').value = news.contenuto || '';
    document.getElementById('news-data').value = news.data || '';
    document.getElementById('news-categoria').value = news.categoria || '';
    document.getElementById('news-fonte').value = news.fonte || '';
    
    // Campi Inglesi (NUOVI)
    if(document.getElementById('news-titolo-en'))
        document.getElementById('news-titolo-en').value = news.titolo_en || '';
    if(document.getElementById('news-contenuto-en'))
        document.getElementById('news-contenuto-en').value = news.contenuto_en || '';
    
    showAdminTab('news-admin');
}

async function saveNews(e) {
    e.preventDefault();
    
    const id = document.getElementById('news-id').value;
    const titolo = document.getElementById('news-titolo').value;
    const contenuto = document.getElementById('news-contenuto').value;
    const data = document.getElementById('news-data').value;
    const categoria = document.getElementById('news-categoria').value;
    const fonte = document.getElementById('news-fonte').value;
    
    // RECUPERO CAMPI INGLESI
    const titolo_en = document.getElementById('news-titolo-en') ? document.getElementById('news-titolo-en').value : '';
    const contenuto_en = document.getElementById('news-contenuto-en') ? document.getElementById('news-contenuto-en').value : '';
    
    const newsData = {
        titolo,
        titolo_en, // SALVA INGLESE
        contenuto,
        contenuto_en, // SALVA INGLESE
        data,
        categoria,
        fonte,
        last_modified: new Date().toISOString()
    };
    
    try {
        let savedId;
        const operation = id ? 'UPDATE' : 'CREATE';

        if (navigator.onLine) {
            if (id && id.trim() !== '') {
                savedId = await safeFirebaseOperation(saveFirebaseData, 'update_news', 'news', newsData, id);
                const index = appData.news.findIndex(n => n.id == id);
                if (index !== -1) {
                    appData.news[index] = { id, ...newsData };
                }
                showToast('News modificata con successo', 'success');
            } else {
                savedId = await safeFirebaseOperation(saveFirebaseData, 'create_news', 'news', newsData);
                appData.news.push({ id: savedId, ...newsData });
                showToast(`News aggiunta con successo (ID: ${savedId})`, 'success');
            }
        } else {
            // Offline logic
            savedId = id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await addToSyncQueue(operation, 'news', newsData, savedId);
            
            if (id) {
                const index = appData.news.findIndex(n => n.id == id);
                if (index !== -1) appData.news[index] = { id: savedId, ...newsData };
            } else {
                appData.news.push({ id: savedId, ...newsData });
            }
            showToast('News salvata localmente.', 'info');
        }
        
        saveLocalData();
        loadAdminNews();
        resetNewsForm();
        loadNews();
        updateDashboardStats();
        
    } catch (error) {
        await handleError('saveNews', error, 'Errore nel salvataggio della news');
    }
}

function resetNewsForm() {
    document.getElementById('news-form').reset();
    document.getElementById('news-id').value = '';
}

async function deleteNews(id) {
    // NUOVO: Controllo permessi
    if (currentUserRole !== 'admin') {
        showToast('Non hai i permessi per eliminare', 'error');
        return;
    }

    if (!confirm('Sei sicuro di voler eliminare questa news?')) return;
    
    try {
        if (navigator.onLine) {
            await deleteFirebaseData('news', id);
        } else {
            const news = appData.news.find(n => n.id == id);
            if (news) {
                await addToSyncQueue('DELETE', 'news', news, id);
            }
        }
        
        appData.news = appData.news.filter(n => n.id != id);
        
        saveLocalData();
        loadAdminNews();
        loadNews();
        updateDashboardStats();
        
        showToast('News eliminata con successo', 'success');
        logActivity('News eliminata');
    } catch (error) {
        showToast('Errore nell\'eliminazione della news', 'error');
    }
}

// Import/Export Functions
function exportDataToExcel(type) {
    // Controllo permessi
    if (currentUserRole !== 'admin') {
        showToast('Funzione riservata agli amministratori', 'error');
        return;
    }

    try {
        let data, filename, sheetName;
        let excelData = [];

        switch(type) {
            case 'fontane':
                data = appData.fontane;
                filename = 'fontane_export.xlsx';
                sheetName = 'Fontane';
                // Mappatura Esplicita per Fontane
                excelData = data.map(item => ({
                    'ID': item.id,
                    'Nome': item.nome || '',
                    'Nome_EN': item.nome_en || '', // NUOVO
                    'Indirizzo': item.indirizzo || '',
                    'Stato': item.stato || '',
                    'Anno': item.anno || '',
                    'Descrizione': item.descrizione || '',
                    'Descrizione_EN': item.descrizione_en || '', // NUOVO
                    'Storico': item.storico || '',
                    'Storico_EN': item.storico_en || '', // NUOVO
                    'Latitudine': item.latitudine || 0,
                    'Longitudine': item.longitudine || 0,
                    'Immagine': item.immagine || ''
                }));
                break;

            case 'beverini':
                data = appData.beverini;
                filename = 'beverini_export.xlsx';
                sheetName = 'Beverini';
                // Mappatura Esplicita per Beverini
                excelData = data.map(item => ({
                    'ID': item.id,
                    'Nome': item.nome || '',
                    'Nome_EN': item.nome_en || '', // NUOVO
                    'Indirizzo': item.indirizzo || '',
                    'Stato': item.stato || '',
                    'Descrizione': item.descrizione || '',
                    'Descrizione_EN': item.descrizione_en || '', // NUOVO
                    'Latitudine': item.latitudine || 0,
                    'Longitudine': item.longitudine || 0,
                    'Immagine': item.immagine || ''
                }));
                break;

            case 'news':
                data = appData.news;
                filename = 'news_export.xlsx';
                sheetName = 'News';
                // Mappatura Esplicita per News
                excelData = data.map(item => ({
                    'ID': item.id,
                    'Titolo': item.titolo || '',
                    'Titolo_EN': item.titolo_en || '', // NUOVO
                    'Data': item.data || '',
                    'Contenuto': item.contenuto || '',
                    'Contenuto_EN': item.contenuto_en || '', // NUOVO
                    'Categoria': item.categoria || '',
                    'Fonte': item.fonte || ''
                }));
                break;
        }

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);

        XLSX.writeFile(wb, filename);

        showToast(`Dati ${type} esportati in Excel con successo`, 'success');
        logActivity(`Dati ${type} esportati in Excel`);
    } catch (error) {
        console.error(error);
        showToast('Errore nell\'esportazione Excel', 'error');
    }
}

function handleFileImport(type, files) {
    // NUOVO: Controllo permessi
    if (currentUserRole !== 'admin') {
        showToast('Funzione riservata agli amministratori', 'error');
        return;
    }

    if (files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();

    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            if (type === 'all') {
                let importedCount = 0;

                if (workbook.SheetNames.includes('Fontane')) {
                    const fontaneSheet = workbook.Sheets['Fontane'];
                    const fontaneData = XLSX.utils.sheet_to_json(fontaneSheet);
                    importedCount += importFontane(fontaneData);
                }

                if (workbook.SheetNames.includes('Beverini')) {
                    const beveriniSheet = workbook.Sheets['Beverini'];
                    const beveriniData = XLSX.utils.sheet_to_json(beveriniSheet);
                    importedCount += importBeverini(beveriniData);
                }

                if (workbook.SheetNames.includes('News')) {
                    const newsSheet = workbook.Sheets['News'];
                    const newsData = XLSX.utils.sheet_to_json(newsSheet);
                    importedCount += importNews(newsData);
                }

                if (importedCount > 0) {
                    saveLocalData();
                    loadAdminFontane();
                    loadAdminBeverini();
                    loadAdminNews();
                    updateDashboardStats();
                    showToast(`${importedCount} elementi importati con successo`, 'success');
                    logActivity('Tutti i dati importati da Excel');
                } else {
                    showToast('Nessun dato valido trovato nel file', 'warning');
                }
            } else {
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                switch (type) {
                    case 'fontane':
                        importFontane(jsonData);
                        break;
                    case 'beverini':
                        importBeverini(jsonData);
                        break;
                    case 'news':
                        importNews(jsonData);
                        break;
                }
            }

            document.getElementById(`import-${type}-file`).value = '';
        } catch (error) {
            showToast('Errore nell\'importazione Excel', 'error');
        }
    };

    reader.readAsArrayBuffer(file);
}

function importFontane(data) {
    const newFontane = data.map((item) => ({
        nome: item.Nome || item.nome || '',
        nome_en: item.Nome_EN || item.nome_en || '', // LEGGE EXCEL INGLESE
        indirizzo: item.Indirizzo || item.indirizzo || '',
        stato: item.Stato || item.stato || 'funzionante',
        anno: item.Anno || item.anno || '',
        descrizione: item.Descrizione || item.descrizione || '',
        descrizione_en: item.Descrizione_EN || item.descrizione_en || '', // LEGGE EXCEL INGLESE
        storico: item.Storico || item.storico || '',
        storico_en: item.Storico_EN || item.storico_en || '', // LEGGE EXCEL INGLESE
        latitudine: parseFloat(item.Latitudine) || parseFloat(item.latitudine) || 0,
        longitudine: parseFloat(item.Longitudine) || parseFloat(item.longitudine) || 0,
        immagine: item.Immagine || item.immagine || '',
        last_modified: new Date().toISOString()
    }));

    let importedCount = 0;
    
    newFontane.forEach(async (fontana) => {
        try {
            const id = await saveFirebaseData('fontane', fontana);
            appData.fontane.push({ id, ...fontana });
            importedCount++;
            
            if (importedCount === newFontane.length) {
                saveLocalData();
                loadAdminFontane();
                showToast(`${importedCount} fontane importate con successo!`, 'success');
            }
        } catch (error) {
            console.error('Errore import fontana:', error);
        }
    });

    return newFontane.length;
}

function importBeverini(data) {
    const newBeverini = data.map((item) => ({
        nome: item.Nome || item.nome || '',
        nome_en: item.Nome_EN || item.nome_en || '', // LEGGE EXCEL INGLESE
        indirizzo: item.Indirizzo || item.indirizzo || '',
        stato: item.Stato || item.stato || 'funzionante',
        descrizione: item.Descrizione || item.descrizione || '',
        descrizione_en: item.Descrizione_EN || item.descrizione_en || '', // LEGGE EXCEL INGLESE
        latitudine: parseFloat(item.Latitudine) || parseFloat(item.latitudine) || 0,
        longitudine: parseFloat(item.Longitudine) || parseFloat(item.longitudine) || 0,
        immagine: item.Immagine || item.immagine || '',
        last_modified: new Date().toISOString()
    }));

    let importedCount = 0;
    
    newBeverini.forEach(async (beverino) => {
        try {
            const id = await saveFirebaseData('beverini', beverino);
            appData.beverini.push({ id, ...beverino });
            importedCount++;
            
            if (importedCount === newBeverini.length) {
                saveLocalData();
                loadAdminBeverini();
                showToast(`${importedCount} beverini importati con successo!`, 'success');
            }
        } catch (error) {
            console.error('Errore import beverino:', error);
        }
    });

    return newBeverini.length;
}

function importNews(data) {
    const newNews = data.map((item) => ({
        titolo: item.Titolo || item.titolo || '',
        titolo_en: item.Titolo_EN || item.titolo_en || '', // LEGGE EXCEL INGLESE
        contenuto: item.Contenuto || item.contenuto || '',
        contenuto_en: item.Contenuto_EN || item.contenuto_en || '', // LEGGE EXCEL INGLESE
        data: item.Data || item.data || new Date().toISOString().split('T')[0],
        categoria: item.Categoria || item.categoria || '',
        fonte: item.Fonte || item.fonte || '',
        last_modified: new Date().toISOString()
    }));

    let importedCount = 0;
    
    newNews.forEach(async (news) => {
        try {
            const id = await saveFirebaseData('news', news);
            appData.news.push({ id, ...news });
            importedCount++;
            
            if (importedCount === newNews.length) {
                saveLocalData();
                loadAdminNews();
                showToast(`${importedCount} news importate con successo!`, 'success');
            }
        } catch (error) {
            console.error('Errore import news:', error);
        }
    });

    return newNews.length;
}
function downloadTemplate(type) {
    let columns = [];
    let filename = '';
    let sheetName = '';

    switch (type) {
        case 'fontane':
            // ABBIAMO AGGIUNTO LE COLONNE _EN
            columns = [
                'Nome', 'Nome_EN', 
                'Indirizzo', 
                'Stato', 
                'Anno', 
                'Descrizione', 'Descrizione_EN',
                'Storico', 'Storico_EN',
                'Latitudine', 'Longitudine', 
                'Immagine'
            ];
            filename = 'template_fontane_multilingua.xlsx';
            sheetName = 'Fontane';
            break;
            
        case 'beverini':
            // ABBIAMO AGGIUNTO LE COLONNE _EN
            columns = [
                'Nome', 'Nome_EN',
                'Indirizzo', 
                'Stato', 
                'Latitudine', 'Longitudine', 
                'Immagine', 
                'Descrizione', 'Descrizione_EN'
            ];
            filename = 'template_beverini_multilingua.xlsx';
            sheetName = 'Beverini';
            break;
            
        case 'news':
            // ABBIAMO AGGIUNTO LE COLONNE _EN
            columns = [
                'Titolo', 'Titolo_EN',
                'Contenuto', 'Contenuto_EN',
                'Data', 
                'Categoria', 
                'Fonte'
            ];
            filename = 'template_news_multilingua.xlsx';
            sheetName = 'News';
            break;
    }

    const ws = XLSX.utils.aoa_to_sheet([columns]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);

    showToast(`Template ${type} (multilingua) scaricato con successo`, 'success');
}

// Utility Functions
function showInfoModal(title, message) {
    document.getElementById('info-modal-title').textContent = title;
    document.getElementById('info-modal-message').textContent = message;
    document.getElementById('info-modal').style.display = 'flex';
}

function closeInfoModal() {
    document.getElementById('info-modal').style.display = 'none';
}

function checkOnlineStatus() {
    const offlineIndicator = document.getElementById('offline-indicator');
    if (!navigator.onLine) {
        offlineIndicator.style.display = 'block';
    } else {
        offlineIndicator.style.display = 'none';
    }
}

function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const fontanaId = urlParams.get('fontana');
    const beverinoId = urlParams.get('beverino');
    if (fontanaId) {
        showDetail(fontanaId, 'fontana');
    } else if (beverinoId) {
        showDetail(beverinoId, 'beverino');
    }
}

// ============================================
// ANALYTICS DASHBOARD FUNCTIONS
// ============================================

// Carica dashboard analytics
function loadAnalyticsDashboard() {
    if (!window.Analytics) {
        console.warn('Analytics non inizializzato');
        return;
    }

    // Aggiorna statistiche
    updateAnalyticsStats();
    
    // Aggiorna tabelle
    updateAnalyticsTables();
    
    // Aggiorna info sessione
    updateSessionInfo();
    
    // Aggiorna info storage
    updateStorageInfo();
    
    // Aggiorna grafico
    updateActivityChart();
}

// Aggiorna statistiche
function updateAnalyticsStats() {
    try {
        const today = new Date().toDateString();
        const allEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        const allErrors = JSON.parse(localStorage.getItem('analytics_errors') || '[]');
        
        // Eventi di oggi
        const todayEvents = allEvents.filter(event => 
            new Date(event.timestamp).toDateString() === today
        );
        
        // Sessioni di oggi (eventi di tipo SESSION_START)
        const todaySessions = todayEvents.filter(event => event.type === 'SESSION_START');
        
        // Errori di oggi
        const todayErrors = allErrors.filter(error => 
            new Date(error.timestamp).toDateString() === today
        );
        
        // Page views
        const pageViews = todayEvents.filter(event => event.type === 'PAGE_VIEW').length;
        
        // Aggiorna UI
        document.getElementById('analytics-session-count').textContent = todaySessions.length;
        document.getElementById('analytics-events-count').textContent = todayEvents.length;
        document.getElementById('analytics-pageviews-count').textContent = pageViews;
        document.getElementById('analytics-errors-count').textContent = todayErrors.length;
        
    } catch (error) {
        console.error('Errore aggiornamento stats:', error);
    }
}

// Aggiorna tabelle
function updateAnalyticsTables() {
    updateErrorsTable();
    updateEventsTable();
}

// Aggiorna tabella errori
function updateErrorsTable() {
    const errorsTable = document.getElementById('analytics-errors-table');
    if (!errorsTable) return;
    
    const errors = JSON.parse(localStorage.getItem('analytics_errors') || '[]');
    const recentErrors = errors.slice(0, 10); // Ultimi 10 errori
    
    errorsTable.innerHTML = recentErrors.map(error => {
        const date = new Date(error.timestamp);
        const timeString = date.toLocaleTimeString('it-IT', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        const dateString = date.toLocaleDateString('it-IT');
        
        return `
            <tr>
                <td>${dateString} ${timeString}</td>
                <td>${error.context || 'N/A'}</td>
                <td title="${error.error?.message || 'N/A'}">
                    ${(error.error?.message || 'N/A').substring(0, 50)}${(error.error?.message || '').length > 50 ? '...' : ''}
                </td>
                <td>
                    <span class="item-status status-${error.severity || 'medium'}">
                        ${error.severity || 'medium'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
    
    if (recentErrors.length === 0) {
        errorsTable.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: var(--light-text);">
                    Nessun errore registrato
                </td>
            </tr>
        `;
    }
}

// Aggiorna tabella eventi
function updateEventsTable() {
    const eventsTable = document.getElementById('analytics-events-table');
    if (!eventsTable) return;
    
    const events = JSON.parse(localStorage.getItem('analytics_events') || '[]');
    
    // Raggruppa eventi per categoria/azione
    const eventCounts = {};
    events.forEach(event => {
        if (event.category && event.action) {
            const key = `${event.category}.${event.action}`;
            eventCounts[key] = eventCounts[key] || { count: 0, lastTime: null };
            eventCounts[key].count++;
            
            const eventTime = new Date(event.timestamp);
            if (!eventCounts[key].lastTime || eventTime > eventCounts[key].lastTime) {
                eventCounts[key].lastTime = eventTime;
            }
        }
    });
    
    // Converti in array e ordina
    const eventArray = Object.entries(eventCounts)
        .map(([key, data]) => {
            const [category, action] = key.split('.');
            return {
                category,
                action,
                count: data.count,
                lastTime: data.lastTime
            };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10
    
    eventsTable.innerHTML = eventArray.map(event => {
        const lastTime = event.lastTime ? 
            event.lastTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : 
            'N/A';
        
        return `
            <tr>
                <td>${event.category}</td>
                <td>${event.action}</td>
                <td>${event.count}</td>
                <td>${lastTime}</td>
            </tr>
        `;
    }).join('');
    
    if (eventArray.length === 0) {
        eventsTable.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: var(--light-text);">
                    Nessun evento registrato
                </td>
            </tr>
        `;
    }
}

// Aggiorna info sessione
function updateSessionInfo() {
    if (window.Analytics && window.Analytics.session) {
        document.getElementById('current-session-id').textContent = 
            window.Analytics.session.id.substring(0, 15) + '...';
        
        const statusIndicator = document.getElementById('analytics-status-indicator');
        const statusText = document.getElementById('analytics-status-text');
        
        if (window.Analytics.config.trackingEnabled) {
            statusIndicator.classList.remove('inactive');
            statusIndicator.classList.add('active');
            statusText.textContent = 'Analytics Attivo';
            statusText.className = 'status-active';
        } else {
            statusIndicator.classList.remove('active');
            statusIndicator.classList.add('inactive');
            statusText.textContent = 'Analytics Disattivo';
            statusText.className = 'status-inactive';
        }
    }
}

// Aggiorna info storage
function updateStorageInfo() {
    try {
        // Calcola storage utilizzato
        let totalSize = 0;
        const analyticsKeys = [
            'analytics_events',
            'analytics_errors',
            'analytics_pending',
            'analytics_user_id',
            'analytics_tracking_enabled'
        ];
        
        analyticsKeys.forEach(key => {
            const item = localStorage.getItem(key);
            if (item) {
                totalSize += new Blob([item]).size;
            }
        });
        
        // Converti in KB
        const sizeKB = (totalSize / 1024).toFixed(2);
        const storageUsedEl = document.getElementById('storage-used');
        if (storageUsedEl) storageUsedEl.textContent = `${sizeKB} KB`;
        
        // Eventi pendenti - FIX: Usa l'ID corretto (pending-events-count)
        const pendingEvents = JSON.parse(localStorage.getItem('analytics_pending') || '[]');
        const pendingEl = document.getElementById('pending-events-count');
        if (pendingEl) pendingEl.textContent = pendingEvents.length;
        
        // Ultimo sync
        const lastSync = localStorage.getItem('analytics_last_sync');
        const lastSyncEl = document.getElementById('last-sync-time');
        
        if (lastSync && lastSyncEl) {
            const lastSyncDate = new Date(lastSync);
            const now = new Date();
            const diffMinutes = Math.floor((now - lastSyncDate) / (1000 * 60));
            
            if (diffMinutes < 1) {
                lastSyncEl.textContent = 'Poco fa';
            } else if (diffMinutes < 60) {
                lastSyncEl.textContent = `${diffMinutes} minuti fa`;
            } else {
                lastSyncEl.textContent = lastSyncDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
            }
        }
        
    } catch (error) {
        console.warn('Errore non critico in updateStorageInfo:', error);
    }
}

// Aggiorna grafico attività
function updateActivityChart() {
    const canvas = document.getElementById('activity-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // FIX: Distruggi grafico precedente se esiste per evitare l'errore "Canvas already in use"
    // Questo usa la variabile che abbiamo messo in cima al file
    if (typeof activityChartInstance !== 'undefined' && activityChartInstance) {
        activityChartInstance.destroy();
        activityChartInstance = null;
    }
    
    // Dati fake per il grafico (ultimi 7 giorni)
    const labels = [];
    const data = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        labels.push(d.toLocaleDateString('it-IT', { weekday: 'short' }));
        data.push(Math.floor(Math.random() * 20) + 5); // Dati casuali
    }
    
    // Crea il nuovo grafico salvandolo nella variabile globale
    activityChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Attività',
                data: data,
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
                x: { grid: { display: false } }
            }
        }
    });
}

// Aggiorna metriche performance
function updatePerformanceMetrics() {
    const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
    
    if (metrics.length > 0) {
        // Calcola medie
        const firstLoadMetrics = metrics.filter(m => m.name === 'app_start' || m.name.includes('first'));
        const dataLoadMetrics = metrics.filter(m => m.name.includes('data_load') || m.name.includes('firebase'));
        const imageLoadMetrics = metrics.filter(m => m.name.includes('image') || m.name.includes('load'));
        
        const avgFirstLoad = firstLoadMetrics.length > 0 ? 
            firstLoadMetrics.reduce((sum, m) => sum + m.duration, 0) / firstLoadMetrics.length : 0;
        
        const avgDataLoad = dataLoadMetrics.length > 0 ? 
            dataLoadMetrics.reduce((sum, m) => sum + m.duration, 0) / dataLoadMetrics.length : 0;
        
        const avgImageLoad = imageLoadMetrics.length > 0 ? 
            imageLoadMetrics.reduce((sum, m) => sum + m.value || m.duration, 0) / imageLoadMetrics.length : 0;
        
        // Aggiorna UI
        document.getElementById('metric-first-load').textContent = `${Math.round(avgFirstLoad)}ms`;
        document.getElementById('metric-data-load').textContent = `${Math.round(avgDataLoad)}ms`;
        document.getElementById('metric-image-load').textContent = `${Math.round(avgImageLoad)}ms`;
    }
}

// Funzioni azioni analytics
function exportAnalyticsData() {
    if (window.Analytics && window.Analytics.exportAnalyticsData) {
        window.Analytics.exportAnalyticsData();
        showToast('Dati analytics esportati', 'success');
    } else {
        // Fallback manuale
        const allData = {
            events: JSON.parse(localStorage.getItem('analytics_events') || '[]'),
            errors: JSON.parse(localStorage.getItem('analytics_errors') || '[]'),
            performance: JSON.parse(localStorage.getItem('performance_metrics') || '[]'),
            timestamp: new Date().toISOString(),
            user_id: localStorage.getItem('analytics_user_id')
        };
        
        const dataStr = JSON.stringify(allData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `analytics_export_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showToast('Dati analytics esportati', 'success');
    }
    
    // Traccia l'evento
    if (window.Analytics) {
        window.Analytics.trackEvent('analytics', 'data_exported');
    }
}

function refreshAnalyticsDashboard() {
    loadAnalyticsDashboard();
    updatePerformanceMetrics();
    showToast('Dashboard analytics aggiornata', 'success');
    
    if (window.Analytics) {
        window.Analytics.trackEvent('analytics', 'dashboard_refreshed');
    }
}

function toggleAnalyticsTracking() {
    if (window.Analytics) {
        const newState = !window.Analytics.config.trackingEnabled;
        window.Analytics.setTrackingEnabled(newState);
        
        showToast(`Analytics ${newState ? 'attivato' : 'disattivato'}`, 'info');
        updateSessionInfo();
        
        window.Analytics.trackEvent('analytics', 'tracking_toggled', null, null, {
            new_state: newState
        });
    }
}

function resetAnalyticsData() {
    if (confirm('Sei sicuro di voler resettare tutti i dati analytics? Questa azione non può essere annullata.')) {
        // Cancella tutti i dati analytics
        const analyticsKeys = [
            'analytics_events',
            'analytics_errors',
            'analytics_pending',
            'analytics_last_sync',
            'performance_metrics'
        ];
        
        analyticsKeys.forEach(key => {
            localStorage.removeItem(key);
        });
        
        // Resetta user ID
        localStorage.removeItem('analytics_user_id');
        
        // Re-inizializza analytics
        if (window.Analytics) {
            window.Analytics.user.id = window.Analytics.getUserId();
            window.Analytics.session.id = window.Analytics.generateSessionId();
            window.Analytics.session.startTime = Date.now();
        }
        
        // Aggiorna dashboard
        loadAnalyticsDashboard();
        
        showToast('Dati analytics resettati', 'success');
        
        if (window.Analytics) {
            window.Analytics.trackEvent('analytics', 'data_reset');
        }
    }
}

function clearAnalyticsErrors() {
    if (confirm('Cancellare tutti gli errori registrati?')) {
        localStorage.removeItem('analytics_errors');
        updateErrorsTable();
        updateAnalyticsStats();
        showToast('Errori cancellati', 'success');
        
        if (window.Analytics) {
            window.Analytics.trackEvent('analytics', 'errors_cleared');
        }
    }
}

// Funzioni debug
function testAnalyticsEvent() {
    if (window.Analytics) {
        window.Analytics.trackEvent('test', 'manual_event', 'Test manuale', 1, {
            test_mode: true,
            timestamp: new Date().toISOString()
        });
        showToast('Evento test registrato', 'info');
    }
}

function testAnalyticsError() {
    if (window.Analytics) {
        const testError = new Error('Errore di test manuale');
        testError.name = 'TestError';
        testError.code = 'TEST_001';
        
        window.Analytics.trackError(testError, 'test_manual', 'low', {
            test_mode: true
        });
        showToast('Errore test registrato', 'info');
    }
}

function testPerformanceMetric() {
    const loadTime = Math.random() * 1000 + 500; // Valore casuale 500-1500ms
    logPerformanceMetric('test_manual_load', loadTime);
    showToast(`Metrica test: ${Math.round(loadTime)}ms`, 'info');
}

function forceSyncAnalytics() {
    if (window.Analytics && window.Analytics.flushQueue) {
        window.Analytics.flushQueue(true);
        localStorage.setItem('analytics_last_sync', new Date().toISOString());
        updateStorageInfo();
        showToast('Sync analytics forzato', 'info');
    }
}

// ============================================
// GESTIONE TASTO INDIETRO ANDROID (CORRETTO)
// ============================================

// Gestione tasto indietro fisico/software
function setupBackButtonHandler() {
    // Unifichiamo la gestione: funziona sia per PWA che per Browser
    // L'unica differenza è che nella PWA vogliamo "intrappolare" l'utente nell'app
    // finché non è nella home.
    
    // 1. Inseriamo uno stato iniziale fittizio per attivare la history
    window.history.pushState({ page: 'app_root' }, document.title, window.location.href);

    // 2. Ascoltiamo il cambiamento di stato (tasto indietro premuto)
    window.addEventListener('popstate', function(event) {
        // Tentiamo di gestire la navigazione internamente
        const actionTaken = handleBackNavigation();

        if (actionTaken) {
            // Se abbiamo gestito l'azione (es. chiuso un modale o cambiato schermata),
            // dobbiamo RIPRISTINARE lo stato nella history, altrimenti al prossimo
            // "back" l'app si chiuderà perché abbiamo consumato lo stato precedente.
            window.history.pushState({ page: 'app_active' }, document.title, window.location.href);
        } else {
            // Se siamo nella Home e non ci sono modali aperti (actionTaken = false),
            // lasciamo che l'evento popstate faccia il suo corso.
             if (window.matchMedia('(display-mode: standalone)').matches) {
                // Se volessimo chiedere conferma/evitare l'uscita automatica,
                // qui bisognerebbe re-iniettare uno stato, ma in questo caso 
                // vogliamo permettere l'uscita dopo il doppio tocco.
             }
        }
    });
}

/**
 * Gestisce la logica del tasto indietro.
 * @returns {boolean} true se l'azione è stata gestita internamente (non uscire), false se si deve uscire.
 */
function handleBackNavigation() {
    console.log('Tasto indietro premuto - Stato navigazione:', screenHistory);
    
    // 1. Controllo Modali/Overlay (Priorità massima)
    
    // Auth Admin
    const adminAuth = document.getElementById('admin-auth');
    if (adminAuth && adminAuth.style.display === 'flex') {
        closeAdminAuth();
        return true;
    }

    // Pannello Admin
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel && adminPanel.style.display === 'flex') {
        closeAdminPanel();
        return true;
    }
    
    // Modale Navigazione
    const navModal = document.getElementById('navigation-modal');
    if (navModal && navModal.style.display === 'flex') {
        closeNavigationModal();
        return true;
    }
    
    // Modale Info
    const infoModal = document.getElementById('info-modal');
    if (infoModal && infoModal.style.display === 'flex') {
        closeInfoModal();
        return true;
    }
    
    // Modale Istruzioni Installazione (se presente)
    const installModal = document.querySelector('.install-instructions');
    if (installModal && installModal.style.display === 'flex') {
        installModal.style.display = 'none'; // Assumendo che ci sia una funzione o stile per chiuderlo
        return true;
    }
    
    // Risultati ricerca mappa (se visibili)
    const searchResults = document.getElementById('map-search-results');
    if (searchResults && searchResults.style.display === 'block') {
        searchResults.style.display = 'none';
        return true;
    }

    // 2. Controllo Navigazione Schermate
    
    const currentScreen = screenHistory[screenHistory.length - 1]; 
    
    // Se non siamo nella home, torna indietro nella cronologia schermate
    if (currentScreen !== 'home-screen') {
        goBack();
        return true;
    } 

    // 3. Siamo nella Home e nessun modale è aperto -> Gestione Uscita (Doppio Tocco)
    
    if (backPressTimer) {
        // Doppio tocco entro il timeout: Esegui l'uscita
        clearTimeout(backPressTimer);
        backPressTimer = null;
        // Permetti al popstate handler di uscire (ritorna false)
        showToast('Uscita dall\'applicazione...', 'info', 1000); 
        return false; 
    } else {
        // Prima pressione: mostra toast di avviso e imposta il timer
        showToast('Premi di nuovo per uscire', 'warning', EXIT_TOAST_TIMEOUT);
        
        backPressTimer = setTimeout(() => {
            backPressTimer = null;
            // Nascondi il toast se il timer scade.
            const toast = document.getElementById('toast');
            if (toast) toast.classList.remove('show');
        }, EXIT_TOAST_TIMEOUT);
        
        // Dopo la prima pressione, re-inseriamo lo stato nella history
        // per intercettare la seconda pressione senza uscire.
        return true; // Azione gestita, non uscire ancora.
    }
}

// ============================================
// NUOVE FUNZIONI: ORDINAMENTO E BADGE (AGGIORNATE)
// ============================================

// Aggiorna getFilteredItems con ordinamento
function getFilteredItems(type) {
    const items = appData[type];
    const filter = currentFilter[type];

    // 1. Filtra normalmente
    let filteredList = [];
    if (!items || filter === 'all') {
        filteredList = items || [];
    } else {
        filteredList = items.filter(item => item.stato === filter);
    }

    // 2. Ordinamento Intelligente (Nuovi/Riparati in cima)
    const highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "fixed": []}');

    // Se non ci sono novità, ritorna la lista normale (ma ordinata per ID decrescente se vuoi coerenza)
    if (highlights.new.length === 0 && highlights.fixed.length === 0) {
        return filteredList;
    }

    return filteredList.sort((a, b) => {
        const isANew = highlights.new.includes(a.id);
        const isBNew = highlights.new.includes(b.id);
        const isAFixed = highlights.fixed.includes(a.id);
        const isBFixed = highlights.fixed.includes(b.id);

        // Priorità assoluta ai NUOVI
        if (isANew && !isBNew) return -1;
        if (!isANew && isBNew) return 1;

        // Seconda priorità ai RIPARATI
        if (isAFixed && !isBFixed) return -1;
        if (!isAFixed && isBFixed) return 1;

        return 0; // Nessuna priorità
    });
}

// Aggiorna renderGridItems con badge
function renderGridItems(container, items, type) {
    // 1. GESTIONE STATO VUOTO (Tuo codice originale mantenuto)
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-${type === 'fontana' ? 'monument' : 'faucet'}"></i></div>
                <div class="empty-state-text">Nessun elemento trovato</div>
                <div class="empty-state-subtext">Prova a cambiare i filtri di ricerca</div>
            </div>
        `;
        return;
    }
    
    // 2. RECUPERA HIGHLIGHTS (Badge Nuovo/Riparato)
    const highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "fixed": []}');

    // 3. HELPER PER TRADURRE LO STATO (Funzionante -> Working)
    const getStatusLabel = (stato) => {
        const statusKey = {
            'funzionante': 'status_working',
            'non-funzionante': 'status_broken',
            'manutenzione': 'status_maintenance'
        }[stato] || 'status_working';
        
        // Se esiste la traduzione usa quella, altrimenti usa lo stato originale
        return (translations && translations[currentLanguage]) ? translations[currentLanguage][statusKey] : stato;
    };

    container.innerHTML = '';
    
    items.forEach(item => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        
        // GESTORE CLICK (Mantiene la tua logica di navigazione)
        gridItem.onclick = () => {
            // Nota: passo item.id come nel tuo codice originale
            showDetail(item.id, type);
            
        };
        
        // LOGICA BADGE (Mantenuta)
        let badgeHTML = '';
        if (highlights.new.includes(item.id)) badgeHTML = '<span class="badge-new">NUOVO</span>';
        else if (highlights.fixed.includes(item.id)) badgeHTML = '<span class="badge-fixed">RIPARATO</span>';

        // LOGICA IMMAGINE CUSTOM (Mantenuta)
        const hasCustomImage = item.immagine && item.immagine.trim() !== '';
        
        // RENDER HTML (Aggiornato con getLocalizedText e getStatusLabel)
        gridItem.innerHTML = `
            <div class="item-image-container">
                <img src="${item.immagine || './images/sfondo-home.jpg'}" 
                     alt="${getLocalizedText(item, 'nome')}" 
                     class="item-image" 
                     onerror="this.style.display='none'; this.parentElement.classList.add('fallback-active'); this.parentElement.innerHTML += '<div class=\\'image-fallback\\'><i class=\\'fas fa-image\\'></i></div>';">
            </div>
            <div class="item-content">
                <div class="item-name">${getLocalizedText(item, 'nome')} ${badgeHTML}</div>
                
                <div class="item-address">${item.indirizzo}</div>
                
                <div class="item-footer">
                    <span class="item-status status-${item.stato}">${getStatusLabel(item.stato)}</span>
                    
                    <span class="image-indicator ${hasCustomImage ? 'image-custom' : 'image-default'}">
                        ${hasCustomImage ? '<i class="fas fa-check"></i>' : '<i class="fas fa-image"></i>'}
                    </span>
                </div>
            </div>
        `;
        container.appendChild(gridItem);
    });
}

// Aggiorna renderCompactItems con badge
function renderCompactItems(container, items, type) {
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-faucet"></i></div>
                <div class="empty-state-text">Nessun elemento trovato</div>
                <div class="empty-state-subtext">Prova a cambiare i filtri di ricerca</div>
            </div>
        `;
        return;
    }
    
    // Recupera highlights
    const highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "fixed": []}');

    // Helper per tradurre lo stato (come abbiamo fatto per le fontane)
    const getStatusLabel = (stato) => {
        const statusKey = {
            'funzionante': 'status_working',
            'non-funzionante': 'status_broken',
            'manutenzione': 'status_maintenance'
        }[stato] || 'status_working';
        return (translations && translations[currentLanguage]) ? translations[currentLanguage][statusKey] : stato;
    };

    container.innerHTML = '';
    items.forEach(item => {
        const compactItem = document.createElement('div');
        compactItem.className = 'compact-item';

        // Badge Logic
        let badgeHTML = '';
        if (highlights.new.includes(item.id)) badgeHTML = '<span class="badge-new">NUOVO</span>';
        else if (highlights.fixed.includes(item.id)) badgeHTML = '<span class="badge-fixed">RIPARATO</span>';

        const totalLength = (item.nome || '').length + (item.indirizzo || '').length;
        if (totalLength > 100) compactItem.classList.add('very-long-content');
        else if (totalLength > 60) compactItem.classList.add('long-content');

        compactItem.onclick = () => {
            showDetail(item.id, type);
            currentLatLng = { lat: item.latitudine, lng: item.longitudine };            
        };

        const hasCustomImage = item.immagine && item.immagine.trim() !== '';
        
        // USA getLocalizedText QUI
        compactItem.innerHTML = `
            <div class="compact-item-image-container">
                <img src="${item.immagine || './images/default-beverino.jpg'}"
                     alt="${getLocalizedText(item, 'nome')}" 
                     class="compact-item-image"
                     onerror="this.style.display='none'; this.parentElement.classList.add('fallback-active'); this.parentElement.innerHTML += '<div class=\\'compact-image-fallback\\'><i class=\\'fas fa-faucet\\'></i></div>';">
            </div>
            <div class="compact-item-content">
                <div class="compact-item-header">
                    <div class="compact-item-name">${getLocalizedText(item, 'nome')} ${badgeHTML}</div>
                    <span class="image-indicator ${hasCustomImage ? 'image-custom' : 'image-default'}">
                        ${hasCustomImage ? '<i class="fas fa-check"></i>' : '<i class="fas fa-image"></i>'}
                    </span>
                </div>
                <div class="compact-item-address">${item.indirizzo}</div>
                <div class="compact-item-footer">
                    <span class="compact-item-status status-${item.stato}">${getStatusLabel(item.stato)}</span>
                </div>
            </div>
        `;
        container.appendChild(compactItem);
    });
}

// Aggiorna renderNewsItems con badge
function renderNewsItems(container, news) {
    if (!news || news.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-newspaper"></i></div>
                <div class="empty-state-text">Nessuna news disponibile</div>
                <div class="empty-state-subtext">Torna presto per aggiornamenti</div>
            </div>
        `;
        return;
    }
    
    // Recupera highlights
    const highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "fixed": []}');
    
    container.innerHTML = '';
    const sortedNews = [...news].sort((a, b) => new Date(b.data) - new Date(a.data));
    
    sortedNews.forEach(item => {
        // Badge Logic
        let badgeHTML = '';
        if (highlights.new.includes(item.id)) {
            badgeHTML = '<span class="badge-new" style="float: right;">NUOVO</span>';
        }

        const newsCard = document.createElement('div');
        newsCard.className = 'news-card';
        newsCard.innerHTML = `
            <div class="news-header">
                <div class="news-title">${getLocalizedText(item, 'titolo')} ${badgeHTML}</div>
                <div class="news-date">${formatDate(item.data)}</div>
            </div>
            <div class="news-content">${getLocalizedText(item, 'contenuto')}</div>
            <div class="news-footer">
                <span class="news-category">${item.categoria}</span>
                <span class="news-source">Fonte: ${item.fonte}</span>
            </div>
        `;
        container.appendChild(newsCard);
    });
}

// ============================================
// Initialize App (MODIFICATO CON NOTIFICHE)
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    loadLocalData();
    checkOnlineStatus();
    showScreen('home-screen');
    handleUrlParameters();
    
    setupBackButtonHandler();
    
    // >>> NUOVO: Richiesta Permessi Notifiche <<<
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') console.log('Notifiche attivate!');
        });
    }

    // >>> NUOVO: Pulizia Badge dopo 24 ore <<<
    const lastHighlightTime = localStorage.getItem('last_highlight_time');
    const now = Date.now();
    if (lastHighlightTime && (now - parseInt(lastHighlightTime)) > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('app_highlights');
        localStorage.setItem('last_highlight_time', now.toString());
    }
    if (!lastHighlightTime) localStorage.setItem('last_highlight_time', now.toString());
    // >>> FINE NUOVO <<<
    
    if ('serviceWorker' in navigator) {
        setTimeout(() => {
            registerServiceWorker();
        }, 1000);
    }
    
    setTimeout(async () => {
        try {
            await loadFirebaseData('fontane');
            await loadFirebaseData('beverini');
            await loadFirebaseData('news');
            
            if (document.getElementById('fontane-list').innerHTML.includes('Caricamento')) loadFontane();
            if (document.getElementById('beverini-list').innerHTML.includes('Caricamento')) loadBeverini();
            if (document.getElementById('news-list').innerHTML.includes('Caricamento')) loadNews();
            
        } catch (error) {
            showToast('Utilizzo dati locali', 'info');
        }
    }, 1000);
    
    document.getElementById('admin-password').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') checkAdminAuth();
    });
    
    document.getElementById('admin-auth').addEventListener('click', function(e) {
        if (e.target === this) closeAdminAuth();
    });
    
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            // Fallback gestito nei template
        }
    }, true);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('admin-panel').style.display === 'flex') {
            closeAdminPanel();
        }
    });
    
    document.getElementById('admin-panel').addEventListener('click', function(e) {
        if (e.target === this) closeAdminPanel();
    });
    
    initializeOfflineSync();
    setTimeout(() => {
        setupLazyLoading();
    }, 1000);
    
    logActivity('Applicazione avviata');
});

// ===== SPLASH SCREEN MANAGEMENT (VERSIONE CON PROGRESS BAR) =====

let splashProgressInterval;
let splashProgress = 0;
let splashMinTime = 1500; // Mostra per almeno 1.5 secondi
let splashStartTime = Date.now();

// Funzione per nascondere lo splash screen
function hideSplashScreen() {
    clearInterval(splashProgressInterval);
    
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        splashScreen.classList.add('hidden');
        
        // Rimuovi completamente dopo l'animazione
        setTimeout(() => {
            splashScreen.style.display = 'none';
            console.log('✅ Splash screen nascosto');
            
            // Inizializza l'app dopo che lo splash screen è nascosto
            initializeAppAfterSplash();
        }, 500);
    }
}

// Funzione per mostrare lo splash screen
function showSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        splashScreen.style.display = 'flex';
        splashScreen.classList.remove('hidden');
        splashScreen.style.opacity = '1';
        splashScreen.style.visibility = 'visible';
        
        // Resetta il progresso
        splashProgress = 0;
        splashStartTime = Date.now();
        updateSplashProgress(10); // Inizia subito con 10%
    }
}

// Aggiorna la barra di progresso
function updateSplashProgress(increment) {
    splashProgress += increment;
    if (splashProgress > 100) splashProgress = 100;
    
    const progressBar = document.querySelector('.splash-progress-bar');
    if (progressBar) {
        progressBar.style.width = splashProgress + '%';
    }
    
    // Aggiorna il testo
    const splashText = document.querySelector('.splash-text');
    if (splashText) {
        if (splashProgress < 30) {
            splashText.textContent = 'Caricamento iniziale...';
        } else if (splashProgress < 60) {
            splashText.textContent = 'Caricamento dati...';
        } else if (splashProgress < 90) {
            splashText.textContent = 'Preparazione interfaccia...';
        } else {
            splashText.textContent = 'Completamento...';
        }
    }
}

// Inizializza l'app dopo lo splash screen
function initializeAppAfterSplash() {
    console.log('🚀 App inizializzata dopo splash screen');
    
    // Contenuto corretto (senza setTimeout esterno)
    if (typeof loadAllData === 'function') {
        loadAllData();
    }
    
    // Controlla se c'è un parametro admin nell'URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('admin') && urlParams.get('admin') === 'true') {
        setTimeout(() => {
            openAdminAuth();
        }, 300);
    }
    
    // Se ci sono altri parametri, gestiscili
    if (urlParams.has('screen')) {
        const screen = urlParams.get('screen');
        setTimeout(() => {
            showScreen(screen + '-screen');
        }, 400);
    }
    
    // Forza l'aggiornamento dell'ultima schermata attiva nel caso in cui fosse 'home-screen'
    if (window.screenHistory && window.screenHistory[window.screenHistory.length - 1] === 'home-screen') {
        document.getElementById('home-screen').style.display = 'flex';
        setTimeout(() => {
            document.getElementById('home-screen').classList.add('active');
        }, 10);
    }
}

// Gestione del caricamento della pagina
window.addEventListener('load', function() {
    console.log('📄 Pagina completamente caricata');
    
    // Inizia la progress bar
    splashProgressInterval = setInterval(() => {
        const elapsed = Date.now() - splashStartTime;
        const progressNeeded = Math.min(90, Math.floor((elapsed / splashMinTime) * 100));
        
        if (progressNeeded > splashProgress) {
            updateSplashProgress(progressNeeded - splashProgress);
        }
        
        // Se è passato il tempo minimo e abbiamo raggiunto il 90%, completa
        if (elapsed >= splashMinTime && splashProgress >= 90) {
            updateSplashProgress(10); // Completa al 100%
            clearInterval(splashProgressInterval);
            hideSplashScreen();
        }
    }, 100);
    
    // Fallback: nascondi dopo 5 secondi massimo (Timeout aumentato per stabilità)
    setTimeout(() => {
        if (document.getElementById('splash-screen') && 
            !document.getElementById('splash-screen').classList.contains('hidden')) {
            console.log('⏱️ Timeout splash screen (5s)');
            hideSplashScreen();
        }
    }, 5000);
});

// Nascondi lo splash screen anche se c'è un errore di caricamento
window.addEventListener('error', function(e) {
    console.error('❌ Errore durante il caricamento:', e.message);
    
    const splashText = document.querySelector('.splash-text');
    if (splashText) {
        splashText.textContent = 'Errore di caricamento, riprovare...';
        splashText.style.color = '#ff6b6b';
    }
    
    setTimeout(() => {
        hideSplashScreen();
    }, 1000);
});

// Gestisci il caso in cui la pagina viene caricata dalla cache
if (document.readyState === 'complete') {
    console.log('⚡ Pagina già caricata dalla cache');
    
    // Mostra comunque lo splash screen brevemente per coerenza
    showSplashScreen();
    setTimeout(() => {
        updateSplashProgress(100);
        setTimeout(hideSplashScreen, 500);
    }, 800);
}

// Verifica quando la pagina è diventata interattiva
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 DOM completamente caricato e parsato');
    updateSplashProgress(20); // Aggiorna progresso
});

// Monitora il caricamento delle risorse
window.addEventListener('DOMContentLoaded', function() {
    // Conta le risorse ancora da caricare
    const resources = document.querySelectorAll('img, script, link[rel="stylesheet"]');
    let loadedResources = 0;
    const totalResources = resources.length;
    
    resources.forEach(resource => {
        if (resource.complete || resource.readyState === 'complete') {
            loadedResources++;
        } else {
            resource.addEventListener('load', function() {
                loadedResources++;
                const progress = Math.min(70, 20 + (loadedResources / totalResources) * 50);
                updateSplashProgress(progress - splashProgress);
            });
            
            resource.addEventListener('error', function() {
                loadedResources++;
                // Non bloccare per errori di risorse
            });
        }
    });
    
    // Se tutte le risorse sono già caricate
    if (loadedResources === totalResources) {
        updateSplashProgress(70);
    }
});

// ===== GESTIONE BACK BUTTON PER SPLASH =====

// Impedisci il back button quando lo splash screen è visibile
let splashVisible = true;

// Sovrascrivi la funzione goBack per gestire lo splash screen
const originalGoBack = window.goBack;
if (originalGoBack) {
    window.goBack = function() {
        if (!splashVisible) {
            originalGoBack();
        } else {
            console.log('🔙 Back button bloccato durante splash screen');
        }
    };
}

// Aggiorna lo stato quando lo splash screen è nascosto
const splashScreen = document.getElementById('splash-screen');
if (splashScreen) {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                if (splashScreen.classList.contains('hidden')) {
                    splashVisible = false;
                    console.log('🎯 Splash screen nascosto, back button abilitato');
                } else {
                    splashVisible = true;
                }
            }
        });
    });
    
    observer.observe(splashScreen, { attributes: true });
}

// Pulsante di emergenza per saltare lo splash screen (debug)
document.addEventListener('keydown', function(e) {
    // Premendo ESC durante lo splash screen, lo salti
    if (e.key === 'Escape' && splashVisible) {
        console.log('🚨 Splash screen saltato con ESC');
        hideSplashScreen();
    }
});

// Touch per saltare splash screen (doppio tap)
let lastTap = 0;
document.addEventListener('touchend', function(e) {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap;
    
    if (tapLength < 500 && tapLength > 0 && splashVisible) {
        // Doppio tap rilevato
        console.log('👆 Doppio tap per saltare splash screen');
        hideSplashScreen();
        e.preventDefault();
    }
    
    lastTap = currentTime;
});

console.log('✨ Sistema splash screen inizializzato');

// ==========================================
// NUOVE FUNZIONI: MENU E SEGNALAZIONI EMAIL
// ==========================================

// Apre/Chiude il menu a tendina (3 puntini)
function toggleMenuModal() {
    const modal = document.getElementById('top-menu-modal');
    // Se è nascosto o non ha stile display, lo mostra, altrimenti lo nasconde
    if (!modal.style.display || modal.style.display === 'none') {
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
    }
}

// Chiude il menu se clicchi sulla parte scura (fuori dal box)
function closeMenuModal(event) {
    if (event.target.id === 'top-menu-modal') {
        document.getElementById('top-menu-modal').style.display = 'none';
    }
}

// Apre la schermata rossa di segnalazione
function openReportScreen() {
    document.getElementById('top-menu-modal').style.display = 'none'; // Chiude menu
    showScreen('segnalazioni-screen'); // Mostra schermata
}

// --- VERSIONE CORRETTA E SICURA ---
function goToAdmin() {
    // 1. Chiude il menu a tendina
    const menu = document.getElementById('top-menu-modal');
    if (menu) menu.style.display = 'none';
    
    // 2. Chiama la funzione che controlla la password
    if (typeof openAdminPanel === 'function') {
        openAdminPanel(); 
    } else {
        // Fallback di sicurezza: se qualcosa non va, mostra comunque il login
        console.warn("Funzione openAdminPanel non trovata, apro login manualmente");
        const authModal = document.getElementById('admin-auth');
        if (authModal) authModal.style.display = 'flex';
    }
}

// FUNZIONE CHE PREPARA L'EMAIL
function inviaSegnalazione(event) {
    event.preventDefault();

    const tipo = document.getElementById('report-type').value;
    const descrizione = document.getElementById('report-desc').value;
    
    // INDIRIZZO EMAIL UFFICIALE
    const emailDestinatario = "fontane.beverini@abc.napoli.it"; 
    
    const oggetto = encodeURIComponent(`Segnalazione App ABC: ${tipo}`);
    
    // Costruiamo il corpo della mail in modo ordinato
    const corpo = encodeURIComponent(
        `Gentile Assistenza ABC Napoli,\n\n` +
        `Vorrei segnalare il seguente problema:\n` +
        `TIPO: ${tipo}\n\n` +
        `DESCRIZIONE E POSIZIONE:\n${descrizione}\n\n` +
        `---\nInviato dall'App ABC Napoli F&B`
    );

    // Apre l'app di posta predefinita
    window.location.href = `mailto:${emailDestinatario}?subject=${oggetto}&body=${corpo}`;
    
    // Opzionale: svuota il campo descrizione dopo l'invio
    // document.getElementById('report-desc').value = ''; 
}

// ==========================================
// FUNZIONE PER SCHERMATA CREDITI
// ==========================================

function openCreditsScreen() {
    // 1. Chiude il menu a tendina (se aperto)
    const menu = document.getElementById('top-menu-modal');
    if (menu) menu.style.display = 'none';
    
    // 2. Mostra la schermata crediti
    // (Usa la funzione showScreen che hai già nel file)
    showScreen('credits-screen');
    
    // 3. Scrolla in alto per sicurezza
    window.scrollTo(0, 0);
}

// ==========================================
// GESTIONE ELIMINAZIONE MULTIPLA (BULK DELETE)
// ==========================================

// 1. Funzione per selezionare/deselezionare tutte le righe
function toggleSelectAll(type, source) {
    const checkboxes = document.querySelectorAll(`.select-item-${type}`);
    checkboxes.forEach(cb => {
        cb.checked = source.checked;
    });
    updateDeleteButtonState(type);
}

// 2. Funzione per aggiornare lo stato del pulsante "Elimina" (Attivo/Disattivo)
function updateDeleteButtonState(type) {
    const checkboxes = document.querySelectorAll(`.select-item-${type}:checked`);
    const btn = document.getElementById(`btn-delete-sel-${type}`);
    
    if (btn) {
        const count = checkboxes.length;
        
        // Se non sei admin, il pulsante rimane nascosto/disabilitato dalla logica HTML, 
        // ma qui lo forziamo per sicurezza
        if (currentUserRole !== 'admin') {
            btn.disabled = true;
            return;
        }

        btn.disabled = count === 0;
        btn.innerHTML = `<i class="fas fa-trash"></i> Elimina Selezionati (${count})`;
        
        if (count > 0) {
            btn.style.opacity = '1';
            btn.style.cursor = 'pointer';
        } else {
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        }
    }
}

// 3. Funzione Principale: Esegue l'eliminazione
async function deleteSelectedItems(type) {
    // --- BLOCCO DI SICUREZZA ---
    if (currentUserRole !== 'admin') {
        showToast('ERRORE: Solo l\'Amministratore può eliminare elementi.', 'error');
        return;
    }
    // ---------------------------

    const checkboxes = document.querySelectorAll(`.select-item-${type}:checked`);
    const idsToDelete = Array.from(checkboxes).map(cb => cb.value);

    if (idsToDelete.length === 0) return;

    if (!confirm(`ATTENZIONE: Stai per eliminare ${idsToDelete.length} elementi.\nQuesta azione è irreversibile.\nProcedere?`)) {
        return;
    }

    showToast(`Eliminazione di ${idsToDelete.length} elementi in corso...`, 'info');
    
    // Disabilita il pulsante per evitare doppi click
    const btn = document.getElementById(`btn-delete-sel-${type}`);
    if(btn) btn.disabled = true;

    let successCount = 0;
    let failCount = 0;

    for (const id of idsToDelete) {
        try {
            // Elimina effettivamente i dati (Online o Offline queue)
            if (navigator.onLine) {
                await deleteFirebaseData(type, id);
            } else {
                // Gestione Offline
                let item;
                if (type === 'fontane') item = appData.fontane.find(f => f.id == id);
                else if (type === 'beverini') item = appData.beverini.find(b => b.id == id);
                else if (type === 'news') item = appData.news.find(n => n.id == id);

                if (item) {
                    await addToSyncQueue('DELETE', type, item, id);
                }
            }

            // Aggiorna l'array locale in memoria
            if (type === 'fontane') appData.fontane = appData.fontane.filter(f => f.id != id);
            else if (type === 'beverini') appData.beverini = appData.beverini.filter(b => b.id != id);
            else if (type === 'news') appData.news = appData.news.filter(n => n.id != id);

            successCount++;
        } catch (error) {
            console.error(`Errore eliminazione ID ${id}:`, error);
            failCount++;
        }
    }

    // Salva i cambiamenti nel LocalStorage
    saveLocalData();
    
    // Ricarica la tabella specifica per vedere i cambiamenti
    if (type === 'fontane') {
        loadAdminFontane(); // Ricarica tabella admin
        loadFontane();      // Ricarica vista utente
    } else if (type === 'beverini') {
        loadAdminBeverini();
        loadBeverini();
    } else if (type === 'news') {
        loadAdminNews();
        loadNews();
    }
    
    // Aggiorna i contatori nella dashboard
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }

    // Resetta la checkbox "Seleziona Tutti" nell'intestazione
    const selectAllCb = document.querySelector(`input[onchange="toggleSelectAll('${type}', this)"]`);
    if(selectAllCb) selectAllCb.checked = false;

    // Feedback finale
    if (failCount === 0) {
        showToast(`${successCount} elementi eliminati correttamente.`, 'success');
    } else {
        showToast(`Eliminati: ${successCount}. Falliti: ${failCount}.`, 'warning');
    }
}

console.log('✨ Sistema notifiche, badge e ordinamento inizializzato');
// ==========================================
// FUNZIONE TRADUZIONE AUTOMATICA (AI)
// ==========================================
async function autoTranslate(sourceId, targetId) {
    const sourceInput = document.getElementById(sourceId);
    const targetInput = document.getElementById(targetId);
    
    // Controllo se c'è testo da tradurre
    if (!sourceInput || !sourceInput.value.trim()) {
        showToast('Scrivi prima il testo in italiano!', 'warning');
        return;
    }

    const textToTranslate = sourceInput.value.trim();
    
    // Feedback visivo: "Sto lavorando..."
    const originalPlaceholder = targetInput.placeholder;
    targetInput.value = '';
    targetInput.placeholder = 'Traduzione in corso... ⏳';
    targetInput.disabled = true;

    try {
        // Usiamo l'API gratuita di MyMemory (limite 500 parole/giorno senza email)
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=it|en`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.responseStatus === 200) {
            // Successo!
            targetInput.value = data.responseData.translatedText;
            showToast('Traduzione completata! ✨', 'success');
        } else {
            throw new Error('Errore API');
        }
        
    } catch (error) {
        console.error("Errore traduzione:", error);
        showToast('Errore traduzione. Riprova o scrivi a mano.', 'error');
        targetInput.value = ''; // Pulisce se fallisce
    } finally {
        // Ripristina la casella
        targetInput.placeholder = originalPlaceholder;
        targetInput.disabled = false;
    }
}
// ============================================
// GESTIONE INSTALLAZIONE (Android & iOS)
// ============================================

let deferredPrompt; 

// 1. Rileva se è iOS
function isIOS() {
  return [
    'iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'
  ].includes(navigator.platform) || (navigator.userAgent.includes("Mac") && "ontouchend" in document);
}

// 2. Rileva se l'app è già installata (Standalone)
function isAppInstalled() {
    return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// 3. Gestione Android (evento automatico)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  
  // Appare la SMART BAR per Android
  showSmartInstallBanner();
});

// 4. Gestione iOS e Avvio
document.addEventListener('DOMContentLoaded', () => {
    // Se siamo su iOS e NON è installata -> Mostra la barra
    if (isIOS() && !isAppInstalled()) {
        showSmartInstallBanner();
    }
});

// Funzione per mostrare la barra
function showSmartInstallBanner() {
    // Controllo extra: se l'utente l'ha chiusa in questa sessione, non mostrarla
    if (sessionStorage.getItem('install_banner_closed')) return;

    const banner = document.getElementById('smart-install-banner');
    const btn = document.getElementById('smart-install-btn');
    
    if (banner && btn) {
        banner.style.display = 'flex';
        
        // Assegna l'azione al click
        btn.onclick = installAppLogic;
    }
}

// Logica del Click su "Installa"
async function installAppLogic() {
    // CASO ANDROID
    if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Esito installazione: ${outcome}`);
        deferredPrompt = null;
        document.getElementById('smart-install-banner').style.display = 'none';
    } 
    // CASO iOS
    else if (isIOS()) {
        // Apre il modale con le istruzioni che hai già creato
        // Assicurati che in index.html esista il div con id="ios-install-modal"
        const iosModal = document.getElementById('ios-install-modal');
        if (iosModal) {
            iosModal.style.display = 'flex';
        } else {
            alert("Per installare: Premi Condividi e poi 'Aggiungi alla schermata Home'");
        }
    }
}
// ==========================================
// SYSTEM INTEGRITY & AUTHOR SIGNATURE
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // 1. Firma Tecnica in Console (Visibile solo agli sviluppatori premendo F12)
    console.log("%c ABC Napoli F&B v1.0 ", "background: #3b82f6; color: white; padding: 4px; border-radius: 3px;");
    console.log("%c Software Architecture & Code developed by Salvatore De Rosa ", "font-size: 10px; color: #64748b; font-style: italic;");

    // 2. Easter Egg: 10 click sul logo per rivelare l'autore
    let _dbg_clicks = 0;
    // Cerca il logo o il titolo come target
    const _dbg_target = document.querySelector('.logo-container') || document.querySelector('.home-title');
    
    if (_dbg_target) {
        _dbg_target.addEventListener('click', () => {
            _dbg_clicks++;
            if (_dbg_clicks === 10) {
                alert("App developed by Salvatore De Rosa.\nOriginal Build: 2026.\nAll Rights Reserved.");
                _dbg_clicks = 0;
            }
            // Reset contatore dopo 3 secondi di inattività
            setTimeout(() => { _dbg_clicks = 0; }, 3000);
        });
    }
});
// ==========================================
// GESTIONE QR CODE (CONDIVISIONE)
// ==========================================

function openQRModal() {
    // 1. Chiudi il menu laterale
    const menu = document.getElementById('top-menu-modal');
    if (menu) menu.style.display = 'none';
    
    // 2. Apri il popup
    const qrModal = document.getElementById('qr-modal');
    if (qrModal) {
        qrModal.style.display = 'flex';
        
        // 3. Genera il QR Code (solo se vuoto o per rigenerarlo pulito)
        const container = document.getElementById('qrcode-container');
        container.innerHTML = ''; // Pulisce precedenti QR
        
        // URL UFFICIALE (Così funziona sempre, anche se lo apri da localhost)
        const officialUrl = "https://fontanebeverininapoli.github.io/";
        
        new QRCode(container, {
            text: officialUrl,
            width: 180,
            height: 180,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H // Alta correzione errori per scansione facile
        });
    }
}

function closeQRModal() {
    const qrModal = document.getElementById('qr-modal');
    if (qrModal) qrModal.style.display = 'none';
}

// Chiude cliccando fuori dal box
document.addEventListener('click', function(event) {
    const qrModal = document.getElementById('qr-modal');
    if (event.target === qrModal) {
        closeQRModal();
    }
});