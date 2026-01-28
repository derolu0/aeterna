// ==========================================
// AETERNA LEXICON IN MOTU - FILOSOFIA DATASET
// Sostituisce app.js originale mantenendo accessi Firebase esistenti
// ==========================================

// Gestione Variabili Globali Sicura (Evita errore "already declared")
if (typeof activityChartInstance === 'undefined') var activityChartInstance = null;
if (typeof currentLanguage === 'undefined') var currentLanguage = localStorage.getItem('app_language') || 'it';
if (typeof currentDetailId === 'undefined') var currentDetailId = null;
if (typeof currentDetailType === 'undefined') var currentDetailType = null;

// Firebase Collections (MODIFICATE per Filosofia)
const COLLECTIONS = {
    FILOSOFI: 'filosofi',      // ex-FONTANE
    OPERE: 'opere',           // ex-BEVERINI
    CONCETTI: 'concetti'      // ex-NEWS
};

// ==========================================
// FUNZIONE LOG ACTIVITY
// ==========================================
window.activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');

function logActivity(description) {
    const timestamp = new Date().toLocaleString('it-IT');
    
    // Sicurezza: se activityLog non è definito, lo inizializziamo
    if (!window.activityLog) window.activityLog = [];

    window.activityLog.unshift({ description, timestamp });

    // Manteniamo solo gli ultimi 50 log per non appesantire localStorage
    if (window.activityLog.length > 50) {
        window.activityLog = window.activityLog.slice(0, 50);
    }

    try {
        localStorage.setItem('activityLog', JSON.stringify(window.activityLog));
    } catch (e) { console.warn("Local storage full"); }
    
    // Se la funzione di aggiornamento UI esiste, la chiamiamo
    if (typeof updateActivityLog === 'function' && document.getElementById('activity-list')) {
        updateActivityLog();
    }
}

// ==========================================

// Funzione principale cambio lingua
function toggleLanguage() {
    // 1. Cambia lingua
    currentLanguage = currentLanguage === 'it' ? 'en' : 'it';
    localStorage.setItem('app_language', currentLanguage);
    
    // 2. Aggiorna testi fissi
    applyTranslations();
    updateLangButton();
    
    // 3. Ricarica liste
    if (typeof loadFilosofi === 'function') loadFilosofi();
    if (typeof loadOpere === 'function') loadOpere();
    if (typeof loadConcetti === 'function') loadConcetti();
    
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

    // 1. Traduzione generica per elementi con data-i18n
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (t[key]) element.textContent = t[key];
    });

    // 2. HOME & MENU (Aggiornati per Filosofia)
    
    setText('nav-filosofi', t.tab_filosophers);
    setText('nav-opere', t.tab_works);
    setText('nav-map', t.tab_map);
    setText('nav-concetti', t.tab_concepts);
    setText('nav-btn-text', t.navigate_btn);

    // 3. TITOLI SCHERMATE (Filosofi, Opere, Concetti)
    setText('filosofi-title', t.screen_philosophers);
    setText('filosofi-subtitle', t.subtitle_philosophers);
    
    setText('opere-title', t.screen_works);
    setText('opere-subtitle', t.subtitle_works);

    setText('concetti-title', t.screen_concepts);
    setText('concetti-subtitle', t.subtitle_concepts);

    // 4. MAPPA & LEGENDA (Aggiornata per Filosofi)
    setText('map-title', t.screen_map);
    setText('legend-title', t.legend_title);
    setText('legend-filosofo', t.legend_item_philosopher);
    setText('legend-opera', t.legend_item_work);
    setText('legend-pos', t.legend_item_position);
    
    // 5. PLACEHOLDER (Barre di ricerca)
    const mapSearch = document.getElementById('map-search-input');
    if (mapSearch) mapSearch.placeholder = t.map_search_placeholder;
    
    const listSearch = document.getElementById('search-input');
    if (listSearch) listSearch.placeholder = t.search_placeholder;
    
    document.querySelectorAll('.search-input').forEach(el => {
        el.placeholder = t.search_placeholder;
    });

    // 6. FILTRI (Aggiornati per Filosofia)
    document.querySelectorAll('.trans-filter-all').forEach(el => {
        updateFilterText(el, t.filter_all);
    });
    document.querySelectorAll('.trans-filter-classic').forEach(el => {
        updateFilterText(el, t.filter_classic);
    });
    document.querySelectorAll('.trans-filter-contemporary').forEach(el => {
        updateFilterText(el, t.filter_contemporary);
    });
    document.querySelectorAll('.trans-filter-ontology').forEach(el => {
        updateFilterText(el, t.filter_ontology);
    });
    document.querySelectorAll('.trans-filter-ethics').forEach(el => {
        updateFilterText(el, t.filter_ethics);
    });

    // 7. Aggiorna bottone lingua nel menu
    updateLangButton();
}

// --- FUNZIONI DI SUPPORTO ---

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function updateFilterText(btn, newText) {
    const icon = btn.querySelector('i');
    if (icon) {
        btn.innerHTML = '';
        btn.appendChild(icon);
        btn.appendChild(document.createTextNode(' ' + newText));
    } else {
        btn.textContent = newText;
    }
}

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

function getLocalizedText(item, field) {
    if (currentLanguage === 'en') {
        return item[field + '_en'] || item[field] || '';
    }
    return item[field] || '';
}

function initRemoteControl() {
    // Se il db non è ancora pronto, riprova tra poco
    if (!window.db) {
        setTimeout(initRemoteControl, 500);
        return;
    }

    // VERSIONE CORRETTA (COMPAT)
    window.db.collection("config").doc("general_settings")
        .onSnapshot((docSnap) => {
            if (docSnap.exists) {
                const data = docSnap.data();
                const isAdmin = localStorage.getItem('abc_admin_logged') === 'true';

                // 1. GESTIONE MANUTENZIONE
                const isMaintenance = data.maintenanceMode === true;
                const maintBtn = document.getElementById('global-maintenance-toggle');
                if (maintBtn) maintBtn.checked = isMaintenance;

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

                // 2. GESTIONE PRIVACY
                const isTrackingAllowed = data.analyticsEnabled !== false;
                const privacyBtn = document.getElementById('global-privacy-toggle');
                if (privacyBtn) privacyBtn.checked = isTrackingAllowed;
            }
        });
}

// Helper per aggiornare config (COMPAT)
async function updateConfig(key, value) {
    try {
        // VERSIONE CORRETTA (COMPAT)
        await window.db.collection("config").doc("general_settings").set({ 
            [key]: value,
            lastUpdate: new Date().toISOString()
        }, { merge: true });
    } catch (e) {
        console.error(e);
        showToast("Errore di connessione", "error");
    }
}

// --- FUNZIONI PER I PULSANTI ADMIN ---

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

async function updateConfig(key, value) {
    try {
        // VERSIONE CORRETTA (COMPAT)
        await window.db.collection("config").doc("general_settings").set({ 
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

function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        const swUrl = './sw.js';
        
        return navigator.serviceWorker.register(swUrl)
            .then(function(registration) {
                console.log('✅ Service Worker registrato con successo:', registration.scope);
                
                if (!navigator.serviceWorker.controller) {
                    console.log('🔄 Service Worker installato per la prima volta');
                } else {
                    console.log('📱 Service Worker già attivo');
                }
                
                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    console.log('🔄 Nuova versione Service Worker trovata');
                    
                    newWorker.addEventListener('statechange', function() {
                        console.log(`📊 Stato SW: ${newWorker.state}`);
                        
                        if (newWorker.state === 'installed') {
                            if (navigator.serviceWorker.controller) {
                                showToast('Nuova versione disponibile! Ricarica la pagina.', 'info', 10000);
                                
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
                
                setInterval(() => {
                    registration.update();
                }, 60 * 60 * 1000);
                
                return registration;
            })
            .catch(function(error) {
                console.error('❌ Errore durante la registrazione del Service Worker:', error);
                
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

function clearServiceWorkerCache() {
    if ('serviceWorker' in navigator) {
        caches.keys().then(function(cacheNames) {
            cacheNames.forEach(function(cacheName) {
                caches.delete(cacheName);
                console.log('Cache eliminata:', cacheName);
            });
            showToast('Cache Service Worker pulita', 'info');
        });
        
        navigator.serviceWorker.getRegistrations()
            .then(function(registrations) {
                registrations.forEach(function(registration) {
                    registration.unregister();
                    console.log('Service Worker deregistrato');
                });
            });
    }
}

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

async function handleError(context, error, userMessage = null) {
    console.error(`[${context}]`, error);
    
    logErrorToAnalytics(error, context);
    
    if (error instanceof FirebaseError) {
        await handleFirebaseError(context, error);
    } else if (error instanceof NetworkError) {
        await handleNetworkError(context, error);
    } else if (error instanceof ValidationError) {
        await handleValidationError(context, error);
    } else {
        await handleGenericError(context, error);
    }
    
    if (userMessage) {
        showToast(userMessage, 'error', 5000);
    }
    
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

const imageCache = new Map();
const MAX_IMAGE_CACHE_SIZE = 50;

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

function initializeOfflineSync() {
    if (!navigator.onLine) {
        enableOfflineMode();
    }
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    setInterval(checkSyncStatus, 60000);
    loadSyncState();
}

function enableOfflineMode() {
    document.getElementById('offline-indicator').style.display = 'block';
    showToast('Modalità offline attiva. Le modifiche saranno sincronizzate dopo.', 'info', 5000);
}

function disableOfflineMode() {
    document.getElementById('offline-indicator').style.display = 'none';
    triggerAutoSync();
}

function handleOnline() {
    disableOfflineMode();
    showToast('Connessione ripristinata. Sincronizzazione in corso...', 'success');
    checkForPendingSync();
}

function handleOffline() {
    enableOfflineMode();
}

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

async function getLocalSyncQueue() {
    const queue = localStorage.getItem('localSyncQueue');
    return queue ? JSON.parse(queue) : [];
}

function saveSyncItemToLocalStorage(item) {
    const pendingItems = JSON.parse(localStorage.getItem('pendingSyncItems') || '[]');
    pendingItems.push(item);
    localStorage.setItem('pendingSyncItems', JSON.stringify(pendingItems));
}

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

function removeFromLocalSyncQueue(itemId) {
    const queue = JSON.parse(localStorage.getItem('localSyncQueue') || '[]');
    const newQueue = queue.filter(item => item.id !== itemId);
    localStorage.setItem('localSyncQueue', JSON.stringify(newQueue));
}

function scheduleRetry() {
    const backoffDelay = Math.min(300000, Math.pow(2, syncState.retryCount) * 5000);
    
    setTimeout(() => {
        if (navigator.onLine) {
            triggerAutoSync();
        }
    }, backoffDelay);
}

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

async function checkSyncStatus() {
    if (!navigator.onLine) return;
    
    const localQueue = await getLocalSyncQueue();
    
    if (localQueue.length > 0 && !syncState.isSyncing) {
        triggerAutoSync();
    }
}

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

function updateSyncUI() {
    return;
}

function saveSyncState() {
    localStorage.setItem('syncState', JSON.stringify(syncState));
}

function loadSyncState() {
    const savedState = localStorage.getItem('syncState');
    if (savedState) {
        syncState = JSON.parse(savedState);
        updateSyncUI();
    }
}

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
    // 1. Costruzione dell'oggetto errore
    const errorLog = {
        timestamp: new Date().toISOString(),
        context: context,
        error: {
            name: error.name,
            message: error.message || 'Errore sconosciuto',
            code: error.code,
            stack: error.stack
        },
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        url: window.location.href,
        ...additionalData
    };
    
    // 2. Salvataggio locale sicuro (con try-catch per evitare crash se il JSON è corrotto)
    let analyticsLog = [];
    try {
        const saved = localStorage.getItem('analytics_errors');
        if (saved) analyticsLog = JSON.parse(saved);
    } catch (e) { 
        analyticsLog = []; 
    }

    analyticsLog.push(errorLog);
    
    // Limitiamo a 50 errori per non riempire la memoria
    if (analyticsLog.length > 50) {
        analyticsLog.splice(0, analyticsLog.length - 50);
    }
    
    localStorage.setItem('analytics_errors', JSON.stringify(analyticsLog));
    
    // 3. FIX CRUCIALE: Controlliamo se la funzione logEvent esiste davvero
    // Questo è il pezzo che risolve l'errore "window.firebaseAnalytics.logEvent is not a function"
    if (window.firebaseAnalytics && typeof window.firebaseAnalytics.logEvent === 'function') {
        try {
            window.firebaseAnalytics.logEvent('error_occurred', {
                error_context: context,
                error_message: (error.message || '').substring(0, 100),
                error_code: error.code || 'none'
            });
        } catch (e) {
            console.warn('Impossibile inviare a Analytics, ma l\'errore è salvato localmente.');
        }
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

// MODIFICA: Usa 'window.appData' invece di 'let appData'
window.appData = {
    filosofi: [],    // ex-fontane
    opere: [],       // ex-beverini
    concetti: []     // ex-news
};
let currentLatLng = null;
let screenHistory = ['home-screen'];
let currentFilter = {
    filosofi: 'all',
    opere: 'all',
    concetti: 'all'
};
let searchResults = [];
let searchMarker = null;
let map = null;
let clusterGroup = null;
let markers = new Map();

let backPressTimer = null;
const EXIT_TOAST_TIMEOUT = 2000; 

let searchTimeout;
let isAdminAuthenticated = false;
let adminAuthTimeout = null;

// ============================================
// NUOVO: GESTIONE RUOLI AMMINISTRATORE
// ============================================
let currentUserRole = 'editor'; // 'admin' (completo) o 'editor' (limitato)

// ============================================
// NUOVA FUNZIONE CENTRALE PER RESET SCROLL
// ============================================
function resetScroll() {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'instant'
    });

    document.querySelectorAll('.content-area').forEach(area => {
        area.scrollTop = 0;
    });

    document.querySelectorAll('.detail-content').forEach(detail => {
        detail.scrollTop = 0;
    });
}

// ============================================
// SISTEMA DI NOTIFICHE E EVIDENZIAZIONE (AGGIORNATO)
// ============================================
function checkAndNotifyUpdates(newData, type) {
    const storedData = localStorage.getItem('filosofiOpereData');
    if (!storedData) return; 
    
    const parsedData = JSON.parse(storedData);
    const oldList = parsedData[type] || [];
    
    if (oldList.length === 0) return; 

    let highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "updated": []}');

    let newItemsCount = 0;
    let updatedItemsCount = 0;
    let lastNewName = "";
    let lastUpdatedName = "";

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
            // È AGGIORNATO? Controlla se modificato recentemente
            const oldMod = existsOld.last_modified || '1970-01-01';
            const newMod = newItem.last_modified || new Date().toISOString();
            
            if (new Date(newMod) > new Date(oldMod)) {
                updatedItemsCount++;
                lastUpdatedName = newItem.nome || newItem.titolo;
                if (!highlights.updated.includes(newItem.id)) {
                    highlights.updated.push(newItem.id);
                }
            }
        }
    });

    localStorage.setItem('app_highlights', JSON.stringify(highlights));

    // NOTIFICHE RAGGRUPPATE
    if (newItemsCount > 0) {
        let title = type === 'concetti' ? '🧠 Nuovo Concetto' : type === 'opere' ? '📚 Nuova Opera' : '🎓 Nuovo Filosofo';
        let body = newItemsCount === 1 ? `È stato aggiunto: ${lastNewName}` : `Ci sono ${newItemsCount} nuovi elementi!`;
        sendSystemNotification(title, body);
    }

    if (updatedItemsCount > 0) {
        let title = '📝 Aggiornamenti';
        let body = updatedItemsCount === 1 ? `${lastUpdatedName} è stato aggiornato` : `${updatedItemsCount} elementi aggiornati!`;
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
        showToast(`${title}: ${body}`, 'success', 5000);
    }
}

// ============================================
// FUNZIONI FIREBASE - AGGOIRNATE PER FILOSOFIA
// ============================================

async function loadFirebaseData(type) {
    if (!window.db) {
        console.warn(`[Firebase] DB non pronto per ${type}, uso dati locali.`);
        return loadLocalData(type);
    }

    try {
        const collectionMap = {
            'filosofi': 'filosofi',
            'opere': 'opere',
            'concetti': 'concetti'
        };
        const collectionName = collectionMap[type] || type;

        const snapshot = await window.db.collection(collectionName).get();
        
        const data = [];
        snapshot.forEach(doc => {
            const docData = doc.data();
            const itemData = { 
                id: doc.id, 
                ...docData  // Questo è cruciale: copia TUTTI i campi dal documento
            };
            
            // Assicurati che i campi standard esistano
            if (type === 'filosofi') {
                itemData.nome = docData.nome || '';
                itemData.scuola = docData.scuola || '';
                itemData.periodo = docData.periodo || 'classico';
                itemData.anni_vita = docData.anni_vita || '';
                itemData.luogo_nascita = docData.luogo_nascita || '';
                itemData.biografia = docData.biografia || '';
                itemData.coordinate = docData.coordinate || null;
                itemData.ritratto = docData.ritratto || '';
                itemData.opere_principali = docData.opere_principali || [];
                itemData.concetti_principali = docData.concetti_principali || [];
            } else if (type === 'opere') {
                itemData.titolo = docData.titolo || '';
                itemData.autore_id = docData.autore_id || '';
                itemData.autore_nome = docData.autore_nome || '';
                itemData.anno = docData.anno || '';
                itemData.periodo = docData.periodo || '';
                itemData.sintesi = docData.sintesi || '';
                itemData.lingua = docData.lingua || '';
                itemData.pdf_url = docData.pdf_url || '';
                itemData.concetti = docData.concetti || [];
                itemData.immagine = docData.immagine || '';
            } else if (type === 'concetti') {
                itemData.parola = docData.parola || '';
                itemData.definizione = docData.definizione || '';
                itemData.esempio_citazione = docData.esempio_citazione || '';
                itemData.autore_riferimento = docData.autore_riferimento || '';
                itemData.opera_riferimento = docData.opera_riferimento || '';
                itemData.periodo_storico = docData.periodo_storico || '';
                itemData.evoluzione = docData.evoluzione || '';
            }
            
            data.push(itemData);
        });
        
        appData[type] = data;
        saveLocalData();
        
        console.log(`✅ ${data.length} ${type} caricati da Firebase`);
        
        // AGGIUNGI QUESTA RIGA: Aggiorna immediatamente i menu a tendina
        if (type === 'filosofi') {
            updateAllSelects();
        }
        
        return data;

    } catch (error) {
        console.error(`Errore loadFirebaseData_${type}:`, error);
        return loadLocalData(type);
    }
}

// VERSIONE CORRETTA (COMPAT) - Sostituisci quella esistente
async function saveFirebaseData(type, item, id = null) {
    try {
        // Usa direttamente window.db (versione compat)
        const collectionName = COLLECTIONS[type.toUpperCase()] || type;
        const collectionRef = window.db.collection(collectionName);
        
        let savedId;
        if (id) {
            // Modifica esistente
            await collectionRef.doc(id).update(item);
            savedId = id;
        } else {
            // Nuova creazione
            const docRef = await collectionRef.add(item);
            savedId = docRef.id;
        }
        return savedId;
    } catch (error) {
        console.error(`Errore nel salvataggio ${type}:`, error);
        throw error;
    }
}

// VERSIONE CORRETTA (COMPAT) - Sostituisci quella esistente
async function deleteFirebaseData(type, id) {
    try {
        const collectionName = COLLECTIONS[type.toUpperCase()] || type;
        await window.db.collection(collectionName).doc(id).delete();
        return true;
    } catch (error) {
        console.error(`Errore nell'eliminazione ${type}:`, error);
        throw error;
    }
}

// Local Storage functions
function saveLocalData() {
    try {
        localStorage.setItem('filosofiOpereData', JSON.stringify(appData));
        localStorage.setItem('filosofiOpereLastSync', new Date().toISOString());
    } catch (error) {
        console.error('Errore nel salvataggio locale:', error);
    }
}

function loadLocalData(type = null) {
    try {
        const savedData = localStorage.getItem('filosofiOpereData');
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

function getPeriodoText(periodo) {
    const periodoMap = {
        'classico': 'Periodo Classico',
        'contemporaneo': 'Periodo Contemporaneo',
        'medioevale': 'Medioevo',
        'moderno': 'Età Moderna'
    };
    return periodoMap[periodo] || periodo;
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

function updateActivityLog() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
    // Ricarichiamo sempre la versione aggiornata
    const currentLog = window.activityLog || JSON.parse(localStorage.getItem('activityLog') || '[]');
    
    activityList.innerHTML = '';
    currentLog.forEach(activity => {
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
    // 1. Creiamo una piccola funzione interna che controlla se l'elemento esiste
    // prima di provare a scriverci. Questo evita l'errore "null".
    const safeSetText = (id, text) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        }
    };

    // 2. Ora aggiorniamo i dati usando la funzione sicura
    
    // Filosofi per periodo
    if (appData.filosofi) {
        safeSetText('total-filosofi', appData.filosofi.length);
        safeSetText('filosofi-classici', appData.filosofi.filter(f => f.periodo === 'classico').length);
        safeSetText('filosofi-contemporanei', appData.filosofi.filter(f => f.periodo === 'contemporaneo').length);
        safeSetText('filosofi-medioevali', appData.filosofi.filter(f => f.periodo === 'medioevale').length);
    }
    
    // Opere per periodo
    if (appData.opere) {
        safeSetText('total-opere', appData.opere.length);
        safeSetText('opere-classiche', appData.opere.filter(o => o.periodo === 'classico').length);
        safeSetText('opere-contemporanee', appData.opere.filter(o => o.periodo === 'contemporaneo').length);
    }
    
    // Concetti (Qui avveniva l'errore principale)
    if (appData.concetti) {
        safeSetText('total-concetti', appData.concetti.length);
        // Questi due sotto non faranno più crashare l'app se mancano nell'HTML
        safeSetText('concetti-ontologia', appData.concetti.filter(c => c.categoria === 'ontologia').length);
        safeSetText('concetti-etica', appData.concetti.filter(c => c.categoria === 'etica').length);
    }
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

// VERSIONE CORRETTA (COMPAT) - Sostituisci quella esistente
async function checkAdminAuth() {
    const emailInput = document.getElementById('admin-email');
    const passInput = document.getElementById('admin-password');
    const errorElement = document.getElementById('auth-error');

    const email = emailInput.value.trim();
    const password = passInput.value;

    try {
        // Login diretto con Auth Compat
        await window.auth.signInWithEmailAndPassword(email, password);
        
        isAdminAuthenticated = true;
        localStorage.setItem('abc_admin_logged', 'true');
        
        const maintScreen = document.getElementById('maintenance-mode');
        if (maintScreen) maintScreen.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        if (typeof initRemoteControl === 'function') initRemoteControl();

        // Controllo semplice del ruolo
        currentUserRole = 'admin';
        showToast('Benvenuto Amministratore', 'success');
        
        closeAdminAuth();
        
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
    
    // Nascondi sezioni sensibili se non è admin
    const restrictedSections = document.querySelectorAll('.import-export-section, .backup-section, .analytics-actions-section');
    
    restrictedSections.forEach(section => {
        if (currentUserRole === 'admin') {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
    
    // Inizializza i form con controllo
    if (typeof initAdminForms === 'function') {
        // Piccolo delay per assicurare che il DOM sia pronto
        setTimeout(initAdminForms, 100);
    } else {
        console.warn("initAdminForms function not found");
    }
    
    // Carica i dati nelle tabelle
    loadAdminFilosofi();
    loadAdminOpere();
    loadAdminConcetti();
    
    // Aggiorna statistiche dashboard
    updateDashboardStats();
    
    // Carica analytics e performance
    if (typeof refreshAnalyticsDashboard === 'function') {
        refreshAnalyticsDashboard();
    }
    if (typeof updatePerformanceMetrics === 'function') {
        updatePerformanceMetrics();
    }
    
    // Carica activity log con gestione sicura
    updateActivityLog();
    
    console.log("✅ Pannello admin inizializzato per ruolo:", currentUserRole);
}

function closeAdminPanel() {
    document.getElementById('admin-panel').style.display = 'none';
}

function logoutAdmin() {
    isAdminAuthenticated = false;
    currentUserRole = null;
    
    localStorage.removeItem('abc_admin_logged');
    
    if (adminAuthTimeout) {
        clearTimeout(adminAuthTimeout);
        adminAuthTimeout = null;
    }
    
    closeAdminPanel();
    showToast('Logout amministratore effettuato', 'success');
    logActivity('Logout amministratore');

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
        
        resetScroll();
        
        initializeScreenContent(screenId);
    }
    
    updateTabBar(screenId);
    
    document.getElementById('fixed-navigate-btn').classList.add('hidden');
    
    if (backPressTimer) {
        clearTimeout(backPressTimer);
        backPressTimer = null;
        const toast = document.getElementById('toast');
        if (toast) toast.classList.remove('show');
    }
}

function goBack() {
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
        case 'filosofi-screen':
            loadFilosofi();
            break;
        case 'opere-screen':
            loadOpere();
            break;
        case 'mappa-screen':
            initMappa();
            break;
        case 'concetti-screen':
            loadConcetti();
            break;
        case 'mappa-concettuale-screen':
            loadConcettoNetwork();
            break;
    }
}

// Data Loading Functions
// ==========================================
// MODIFICA: loadFilosofi (Filtri attivi + Design con Immagini)
// ==========================================
function loadFilosofi() {
    const container = document.getElementById('filosofi-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 1. Definisci il percorso esatto dell'immagine di default locale
    // MODIFICA QUI SE IL NOME DEL FILE È DIVERSO
    const defaultImage = 'images/default-filosofo.jpg'; 
    
    const filteredData = getFilteredItems('filosofi');
    const sortedList = [...filteredData].sort((a, b) => a.nome.localeCompare(b.nome));

    if (sortedList.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-user-graduate"></i></div>
                <div class="empty-state-text">Nessun filosofo trovato</div>
            </div>`;
        return;
    }
    
    const highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "updated": []}');

    sortedList.forEach(item => {
        let borderClass = 'border-default';
        if (item.periodo) {
            const p = item.periodo.toLowerCase();
            if (p.includes('classico')) borderClass = 'border-classic';
            else if (p.includes('contemporaneo')) borderClass = 'border-contemporary';
        }

        let badgeHTML = '';
        if (highlights.new.includes(item.id)) {
            badgeHTML = '<span class="badge-new" style="position:absolute; top:10px; right:10px; z-index:2;">NUOVO</span>';
        }

        // Se c'è un ritratto usa quello, altrimenti usa defaultImage
        const imageUrl = (item.ritratto && item.ritratto.trim() !== '') ? item.ritratto : defaultImage;

        const card = document.createElement('div');
        card.className = `grid-item ${borderClass}`;
        card.onclick = () => showDetail(item.id, 'filosofi');

        // Nota l'evento onerror: se l'immagine online fallisce, carica quella locale
        card.innerHTML = `
            <div class="item-image-container">
                ${badgeHTML}
                <img src="${imageUrl}" 
                     alt="${item.nome}" 
                     class="item-image"
                     onerror="this.onerror=null; this.src='${defaultImage}';">
            </div>
            <div class="item-content">
                <div class="item-header">
                    <h3 class="item-name">${item.nome}</h3>
                    <span class="item-periodo periodo-${item.periodo}">${getPeriodoText(item.periodo)}</span>
                </div>
                <p class="item-details">
                    <i class="fas fa-university"></i> ${item.scuola || 'Scuola non def.'}<br>
                    <i class="fas fa-map-marker-alt"></i> ${item.luogo_nascita || 'N/D'}
                </p>
                <div class="item-footer">
                   <span style="font-size:0.8rem; color:#666;">${item.anni_vita || ''}</span>
                   <i class="fas fa-arrow-right" style="color:var(--primary-blue)"></i>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

async function loadOpere() {
    const opereList = document.getElementById('opere-list');
    if (!opereList) return;
    
    showSkeletonLoaderCompact(opereList);
    
    try {
        await loadFirebaseData('opere');
        renderCompactItems(opereList, getFilteredItems('opere'), 'opera');
    } catch (error) {
        showToast('Errore nel caricamento opere', 'error');
    }
}

async function loadConcetti() {
    const concettiList = document.getElementById('concetti-list');
    if (!concettiList) return;
    
    try {
        await loadFirebaseData('concetti');
        renderConcettiItems(concettiList, appData.concetti);
    } catch (error) {
        showToast('Errore nel caricamento concetti', 'error');
    }
}

function getFilteredItems(type) {
    const items = appData[type];
    const filter = currentFilter[type];

    if (!items || filter === 'all') {
        return items || [];
    }

    if (type === 'filosofi') {
        return items.filter(item => item.periodo === filter);
    } else if (type === 'opere') {
        return items.filter(item => item.periodo === filter);
    } else if (type === 'concetti') {
        return items.filter(item => item.categoria === filter);
    }
    
    return items;
}

function setFilter(type, filterValue) {
    currentFilter[type] = filterValue;

    // 1. Rimuovi la classe 'active' da tutti i bottoni
    const allBtns = document.querySelectorAll(`#${type}-screen .filter-btn`);
    allBtns.forEach(btn => {
        btn.classList.remove('active');
    });

    // 2. Aggiungi 'active' SOLO se il bottone esiste (CORREZIONE IMPORTANTE)
    // Questo controllo if(activeBtn) evita che l'app si blocchi se non trova il bottone
    const activeBtn = document.querySelector(`#${type}-screen .filter-btn.${filterValue}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    // 3. Aggiorna la griglia (con controllo di sicurezza sul contenitore)
    const container = document.getElementById(`${type}-list`);
    
    if (container) {
        if (type === 'filosofi') {
            loadFilosofi(); // Usa la funzione principale che ha già la logica
        } else if (type === 'opere') {
            renderCompactItems(container, getFilteredItems('opere'), 'opera');
        } else if (type === 'concetti') {
            renderConcettiItems(container, getFilteredItems('concetti'));
        }
    }
}

const debouncedFilter = debounce(function(type, query) {
    const container = document.getElementById(`${type}-list`);
    if (!container) return;
    
    let items;
    if (type === 'opere') {
        items = container.getElementsByClassName('compact-item');
    } else if (type === 'filosofi') {
        items = container.getElementsByClassName('grid-item');
    } else {
        items = container.getElementsByClassName('concetto-card');
    }

    let visibleCount = 0;
    for (let i = 0; i < items.length; i++) {
        let name, additional;
        
        if (type === 'opere') {
            name = items[i].getElementsByClassName('compact-item-name')[0].textContent;
            additional = items[i].getElementsByClassName('compact-item-autore')[0].textContent;
        } else if (type === 'filosofi') {
            name = items[i].getElementsByClassName('item-name')[0].textContent;
            additional = items[i].getElementsByClassName('item-scuola')[0].textContent;
        } else {
            name = items[i].getElementsByClassName('concetto-parola')[0].textContent;
            additional = items[i].getElementsByClassName('concetto-definizione')[0].textContent;
        }

        const isVisible = name.toLowerCase().includes(query.toLowerCase()) ||
                         additional.toLowerCase().includes(query.toLowerCase());
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

function renderCompactItems(container, items, type) {
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-book"></i></div>
                <div class="empty-state-text">Nessun elemento trovato</div>
                <div class="empty-state-subtext">Prova a cambiare i filtri di ricerca</div>
            </div>
        `;
        return;
    }
    
    const highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "updated": []}');

    const getPeriodoLabel = (periodo) => {
        const periodoKey = {
            'classico': 'period_classic',
            'contemporaneo': 'period_contemporary',
            'medioevale': 'period_medieval',
            'moderno': 'period_modern'
        }[periodo] || periodo;
        return (window.translations && window.translations[currentLanguage]) ? 
            window.translations[currentLanguage][periodoKey] : periodo;
    };

    container.innerHTML = '';
    items.forEach(item => {
        const compactItem = document.createElement('div');
        compactItem.className = 'compact-item';

        let badgeHTML = '';
        if (highlights.new.includes(item.id)) badgeHTML = '<span class="badge-new">NUOVO</span>';
        else if (highlights.updated.includes(item.id)) badgeHTML = '<span class="badge-updated">AGGIORNATO</span>';

        const hasCustomImage = item.immagine && item.immagine.trim() !== '';
        const defaultImage = './images/default-opera.jpg';
        
        compactItem.onclick = () => {
            showDetail(item.id, type);
        };

        compactItem.innerHTML = `
            <div class="compact-item-image-container">
                <img src="${item.immagine || defaultImage}"
                     alt="${getLocalizedText(item, 'titolo')}" 
                     class="compact-item-image"
                     onerror="this.style.display='none'; this.parentElement.classList.add('fallback-active'); this.parentElement.innerHTML += '<div class=\\'compact-image-fallback\\'><i class=\\'fas fa-book\\'></i></div>';">
            </div>
            <div class="compact-item-content">
                <div class="compact-item-header">
                    <div class="compact-item-name">${getLocalizedText(item, 'titolo')} ${badgeHTML}</div>
                    <span class="image-indicator ${hasCustomImage ? 'image-custom' : 'image-default'}">
                        ${hasCustomImage ? '<i class="fas fa-check"></i>' : '<i class="fas fa-image"></i>'}
                    </span>
                </div>
                <div class="compact-item-autore">${item.autore_nome || 'Autore non specificato'}</div>
                <div class="compact-item-footer">
                    <span class="compact-item-period periodo-${item.periodo}">${getPeriodoLabel(item.periodo)}</span>
                    <span class="compact-item-anno">${item.anno || 'Anno sconosciuto'}</span>
                </div>
            </div>
        `;
        container.appendChild(compactItem);
    });
}

function renderConcettiItems(container, concetti) {
    if (!concetti || concetti.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-brain"></i></div>
                <div class="empty-state-text">Nessun concetto disponibile</div>
                <div class="empty-state-subtext">Torna presto per aggiornamenti</div>
            </div>
        `;
        return;
    }
    
    const highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "updated": []}');
    
    container.innerHTML = '';
    
    concetti.forEach(item => {
        let badgeHTML = '';
        if (highlights.new.includes(item.id)) {
            badgeHTML = '<span class="badge-new" style="float: right;">NUOVO</span>';
        } else if (highlights.updated.includes(item.id)) {
            badgeHTML = '<span class="badge-updated" style="float: right;">AGGIORNATO</span>';
        }
        
        // Aggiungi badge "Analisi" se disponibile
        if (hasComparativeAnalysis(item.parola)) {
            badgeHTML += '<span class="badge-analysis" style="float: right; margin-left: 5px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">📊 ANALISI</span>';
        }

        const concettoCard = document.createElement('div');
        concettoCard.className = 'concetto-card';
        concettoCard.innerHTML = `
            <div class="concetto-header">
                <div class="concetto-parola">${getLocalizedText(item, 'parola')} ${badgeHTML}</div>
                <div class="concetto-periodo">${item.periodo_storico || 'Periodo non specificato'}</div>
            </div>
            <div class="concetto-definizione">${getLocalizedText(item, 'definizione')}</div>
            <div class="concetto-footer">
                <span class="concetto-autore">${item.autore_riferimento || 'Autore non specificato'}</span>
                <span class="concetto-opera">${item.opera_riferimento || ''}</span>
            </div>
        `;
        
        // Aggiungi click per analisi comparativa
        concettoCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('badge-analysis')) {
                openComparativeAnalysis(item.parola, item.id);
            }
        });
        
        container.appendChild(concettoCard);
    });
}

// Detail View per Filosofia (Aggiornata con Immagini)
function showDetail(id, type) {
    currentDetailId = id;
    currentDetailType = type;

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    let item, screenId, titleElement, contentElement;
    
    // Normalizza i tipi
    const isFilosofo = (type === 'filosofo' || type === 'filosofi');
    const isOpera = (type === 'opera' || type === 'opere');
    const isConcetto = (type === 'concetto' || type === 'concetti');

    // Immagine di default (MODIFICA IL NOME SE NECESSARIO)
    const defaultFilosofoImg = 'images/default-filosofo.jpg';

    if (isFilosofo) {
        item = appData.filosofi.find(f => f.id == id);
        screenId = 'filosofo-detail-screen';
        titleElement = document.getElementById('filosofo-detail-title');
        contentElement = document.getElementById('filosofo-detail-content');
        
        if (item && contentElement) {
            const hasCoords = (item.lat || item.coordinate?.lat) && (item.lng || item.coordinate?.lng);

            // Usa l'immagine specifica o quella di default
            const imgUrl = (item.ritratto && item.ritratto.trim() !== '') ? item.ritratto : defaultFilosofoImg;

            const concettiHtml = (item.concetti_principali && item.concetti_principali.length > 0) 
                ? `<div class="detail-section" style="margin-top:15px; border-top:1px solid #eee; padding-top:15px;">
                       <h4><i class="fas fa-brain"></i> Concetti Chiave</h4>
                       <div class="tags-cloud">
                           ${item.concetti_principali.map(c => `<span class="tag-chip">${c}</span>`).join('')}
                       </div>
                   </div>` : '';

            contentElement.innerHTML = `
                <img src="${imgUrl}" 
                     class="detail-image" 
                     alt="${item.nome}" 
                     onerror="this.onerror=null; this.src='${defaultFilosofoImg}';">
                
                <div class="detail-card">
                    <div class="detail-meta-grid">
                        <div class="meta-item"><strong>Periodo:</strong> ${getPeriodoText(item.periodo)}</div>
                        <div class="meta-item"><strong>Scuola:</strong> ${item.scuola || '-'}</div>
                        <div class="meta-item"><strong>Anni:</strong> ${item.anni_vita || '-'}</div>
                        <div class="meta-item"><strong>Luogo:</strong> ${item.luogo_nascita || '-'}</div>
                    </div>
                    
                    <div class="detail-section">
                        <h4><i class="fas fa-book-open"></i> Biografia</h4>
                        <p class="biography-text">${item.biografia || 'Nessuna biografia disponibile.'}</p>
                    </div>

                    ${concettiHtml}

                    <div class="action-buttons-container" style="margin-top:25px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                        ${hasCoords ? 
                            `<button class="btn-primary" onclick="goToMap('${item.id}')">
                                <i class="fas fa-map-marked-alt"></i> Naviga sulla Mappa
                            </button>` : 
                            `<button class="btn-secondary" disabled style="opacity:0.6"><i class="fas fa-map-slash"></i> Posizione non disponibile</button>`
                        }
                        <button class="btn-warning" style="background:#f59e0b; color:white; border:none;" 
                            onclick="window.location.href='mailto:admin@aeterna.com?subject=Segnalazione ${encodeURIComponent(item.nome)}'">
                            <i class="fas fa-flag"></i> Segnalazione
                        </button>
                    </div>
                </div>
            `;
        }

    } else if (isOpera) {
        // --- LOGICA OPERE (Invariata) ---
        item = appData.opere.find(o => o.id == id);
        screenId = 'opera-detail-screen';
        titleElement = document.getElementById('opera-detail-title');
        contentElement = document.getElementById('opera-detail-content');

        if (item && contentElement) {
            const concettiCorrelati = appData.concetti.filter(c => 
                (c.opere_riferimento && c.opere_riferimento.includes(item.titolo)) ||
                (c.opera_id === item.id)
            );

            const listaConcetti = concettiCorrelati.length > 0 
                ? `<div class="tags-cloud">${concettiCorrelati.map(c => 
                    `<span class="tag-chip" onclick="showDetail('${c.id}', 'concetti')">${c.parola}</span>`
                  ).join('')}</div>`
                : '<em>Nessun concetto collegato.</em>';

            contentElement.innerHTML = `
                <div class="detail-card">
                    <div class="detail-info-row">
                        <p><strong>Autore:</strong> ${item.autore_nome}</p>
                        <p><strong>Anno:</strong> ${item.anno}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Sintesi</h4>
                        <p>${item.sintesi || 'Descrizione non disponibile.'}</p>
                    </div>
                    <div class="detail-section" style="border-top:1px solid #eee; margin-top:20px; padding-top:10px;">
                        <h4><i class="fas fa-brain"></i> Concetti Trattati</h4>
                        ${listaConcetti}
                    </div>
                </div>`;
        }
    } else if (isConcetto) {
        // --- LOGICA CONCETTI (Invariata) ---
        item = appData.concetti.find(c => c.id == id);
        screenId = 'concetto-detail-screen';
        titleElement = document.getElementById('concetto-detail-title');
        contentElement = document.getElementById('concetto-detail-content');

        if (item && contentElement) {
            contentElement.innerHTML = `
                <div class="detail-card">
                    <div class="detail-info-row">
                        <p><strong>Filosofo Rif.:</strong> ${item.autore_riferimento || '-'}</p>
                        <p><strong>Opera Rif.:</strong> ${item.opere_riferimento || '-'}</p>
                    </div>
                    <div class="detail-section">
                        <h4>Definizione</h4>
                        <p class="definition-text">${item.definizione}</p>
                    </div>
                    <div class="action-buttons-container" style="margin-top:20px; text-align:center;">
                        <button class="btn-primary" onclick="if(window.openComparativeAnalysis) window.openComparativeAnalysis('${item.parola}')">
                            <i class="fas fa-project-diagram"></i> Analisi Comparativa
                        </button>
                    </div>
                </div>`;
        }
    }

    if (item && titleElement) {
        titleElement.innerText = item.nome || item.titolo || item.parola;
    }
    
    if (screenId && typeof showScreen === 'function') {
        showScreen(screenId);
        window.scrollTo(0, 0);
    }
}

// Map Functions (Aggiornata per Filosofi)
function initMappa() {
    // Se non c'è il div o è già init, esci
    if (!document.getElementById('map') || window.map) return;

    console.log("Inizializzazione Mappa Leaflet...");

    // Crea mappa
    window.map = L.map('map').setView([41.9028, 12.4964], 5); 

    // Tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(window.map);

    // Init markers
    window.markers = new Map(); 
    window.clusterGroup = L.markerClusterGroup();
    window.map.addLayer(clusterGroup);

    addMapControls();
    setupSearchAutocomplete();
    
    // Carica i punti
    loadMapMarkers();
}

function loadMapMarkers() {
    if (typeof map === 'undefined' || typeof L === 'undefined' || !window.clusterGroup) return;

    console.log("Generazione marker sulla mappa...");

    window.clusterGroup.clearLayers();
    window.markers.clear();

    if (appData.filosofi) {
        appData.filosofi.forEach(f => {
            let lat, lng;

            if (f.coordinate && typeof f.coordinate === 'object') {
                lat = parseFloat(f.coordinate.lat);
                lng = parseFloat(f.coordinate.lng);
            } else if (f.lat && f.lng) {
                lat = parseFloat(f.lat);
                lng = parseFloat(f.lng);
            }

            if (!isNaN(lat) && !isNaN(lng)) {
                const icon = getIconForType('filosofo', f.periodo);
                const marker = L.marker([lat, lng], { icon });
                
                marker.bindPopup(`
                    <div style="text-align:center">
                        <b>${f.nome}</b><br>
                        <i>${f.luogo_nascita || ''}</i><br>
                        <button onclick="showDetail('${f.id}', 'filosofo')" style="margin-top:5px; padding:4px 8px; cursor:pointer;">
                            Dettagli
                        </button>
                    </div>
                `);
                
                window.clusterGroup.addLayer(marker);
                window.markers.set(`filosofo-${f.id}`, marker);
            }
        });
    }
}

function goToMap(id) {
    // 1. Simula click sul tab Mappa
    const mapTabBtn = document.getElementById('nav-map');
    if (mapTabBtn) mapTabBtn.click();

    // 2. Trova dati
    const filosofo = appData.filosofi.find(f => f.id === id);
    if (!filosofo) return;

    // 3. Centra dopo breve delay (per render)
    setTimeout(() => {
        if(window.map) window.map.invalidateSize();
        centerMapOnFilosofo(filosofo);
    }, 300);
}

// ==========================================
// AUTOCOMPLETE MAPPA
// ==========================================
function setupSearchAutocomplete() {
    const input = document.getElementById('map-search-input');
    const resultsContainer = document.getElementById('map-search-results');
    
    if (!input || !resultsContainer) return;
    
    input.addEventListener('input', function() {
        const query = this.value.toLowerCase();
        if (query.length < 2) {
            resultsContainer.style.display = 'none';
            return;
        }
        
        // Cerca nei filosofi caricati
        const matches = appData.filosofi.filter(f => 
            (f.nome && f.nome.toLowerCase().includes(query)) || 
            (f.luogo_nascita && f.luogo_nascita.toLowerCase().includes(query))
        );
        
        if (matches.length > 0) {
            resultsContainer.innerHTML = '';
            matches.forEach(filosofo => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.textContent = filosofo.nome;
                div.onclick = () => {
                    input.value = filosofo.nome;
                    resultsContainer.style.display = 'none';
                    if (typeof centerMapOnFilosofo === 'function') {
                        centerMapOnFilosofo(filosofo);
                    }
                };
                resultsContainer.appendChild(div);
            });
            resultsContainer.style.display = 'block';
        } else {
            resultsContainer.style.display = 'none';
        }
    });
    
    // Chiudi se clicchi fuori
    document.addEventListener('click', function(e) {
        if (e.target !== input && e.target !== resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    });
}

function getIconForType(type, periodo = null) {
    let iconColor = 'blue';
    
    if (periodo === 'contemporaneo') {
        iconColor = 'violet';
    } else if (periodo === 'classico') {
        iconColor = 'orange';
    } else if (periodo === 'medioevale') {
        iconColor = 'green';
    }
    
    return L.icon({
        iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${iconColor}.png`,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    });
}

function isValidCoordinate(lat, lng) {
    return !isNaN(lat) && !isNaN(lng) &&
           lat >= -90 && lat <= 90 &&
           lng >= -180 && lng <= 180;
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
    fitBoundsBtn.title = 'Mostra tutti i filosofi';
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
    if (window.markers.size > 0 && window.clusterGroup) {
        const bounds = window.clusterGroup.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.1));
            showToast('Vista adattata a tutti i filosofi', 'success');
        }
    } else {
        showToast('Nessun filosofo da mostrare', 'info');
    }
}

function centerMapOnFilosofo(filosofo) {
    if (window.map) {
        let lat, lng;
        if (filosofo.coordinate) { lat = filosofo.coordinate.lat; lng = filosofo.coordinate.lng; }
        else if (filosofo.lat) { lat = filosofo.lat; lng = filosofo.lng; }

        if (lat && lng) {
            window.map.setView([lat, lng], 14);
            const markerId = `filosofo-${filosofo.id}`;
            if (window.markers && window.markers.has(markerId)) {
                window.markers.get(markerId).openPopup();
            }
        } else {
            showToast('Coordinate non disponibili per questo filosofo', 'warning');
        }
    }
}

// ============================================
// MAPPA CONCETTUALE - VERSIONE POTENZIATA
// ============================================

function loadConcettoNetwork() {
    const container = document.getElementById('concetto-network-container');
    if (!container) return;
    
    container.innerHTML = '<div class="loading-network"><div class="spinner"></div><p>Caricamento rete concettuale...</p></div>';
    
    // Attendi caricamento dati
    setTimeout(() => {
        if (!window.vis) {
            console.error('Vis.js non caricato');
            container.innerHTML = '<div class="error-state">Errore: libreria di visualizzazione non caricata</div>';
            return;
        }
        
        try {
            createConceptNetworkEnhanced(container);
        } catch (error) {
            console.error('Errore creazione rete concettuale:', error);
            container.innerHTML = '<div class="error-state">Errore nella creazione della rete concettuale</div>';
        }
    }, 100);
}

function createConceptNetworkEnhanced(container) {
    const nodes = new vis.DataSet([]);
    const edges = new vis.DataSet([]);
    
    // Aggiungi filosofi
    appData.filosofi.forEach((filosofo) => {
        const analysisScore = calculateAnalysisScore(filosofo);
        const nodeSize = 25 + (analysisScore * 10);
        
        nodes.add({
            id: `f-${filosofo.id}`,
            label: filosofo.nome,
            group: 'filosofo',
            value: nodeSize,
            shape: 'circle',
            color: filosofo.periodo === 'contemporaneo' ? 
                { background: '#8b5cf6', border: '#7c3aed' } : 
                { background: '#3b82f6', border: '#1d4ed8' },
            font: { color: 'white', size: 14 },
            title: generateFilosofoTooltip(filosofo, analysisScore),
            filosofoData: filosofo,
            metadata: {
                type: 'filosofo',
                periodo: filosofo.periodo,
                concettiCount: filosofo.concetti_principali ? filosofo.concetti_principali.length : 0,
                analysisScore: analysisScore
            }
        });
    });
    
    // Aggiungi concetti
    appData.concetti.forEach((concetto) => {
        const hasAnalysis = hasComparativeAnalysis(concetto.parola);
        const nodeSize = 20 + (hasAnalysis ? 10 : 0);
        
        nodes.add({
            id: `c-${concetto.id}`,
            label: concetto.parola,
            group: 'concetto',
            value: nodeSize,
            shape: 'box',
            color: hasAnalysis ? 
                { background: '#ec4899', border: '#db2777' } : 
                { background: '#10b981', border: '#059669' },
            font: { 
                color: 'white', 
                size: 13,
                bold: hasAnalysis ? true : false
            },
            title: generateConcettoTooltip(concetto, hasAnalysis),
            concettoData: concetto,
            metadata: {
                type: 'concetto',
                hasAnalysis: hasAnalysis,
                periodo: concetto.periodo_storico
            }
        });
    });
    
    // Crea connessioni filosofo-concetto con pesi
    appData.filosofi.forEach(filosofo => {
        if (filosofo.concetti_principali) {
            filosofo.concetti_principali.forEach((concettoNome, index) => {
                const concetto = appData.concetti.find(c => c.parola === concettoNome);
                if (concetto) {
                    const weight = calculateConnectionWeight(filosofo, concetto, index);
                    
                    edges.add({
                        from: `f-${filosofo.id}`,
                        to: `c-${concetto.id}`,
                        label: 'elabora',
                        color: filosofo.periodo === 'contemporaneo' ? '#f59e0b' : '#10b981',
                        width: 1 + (weight * 2),
                        arrows: 'to',
                        dashes: false,
                        metadata: {
                            type: 'elabora',
                            weight: weight,
                            importance: index === 0 ? 'alta' : 'media'
                        }
                    });
                }
            });
        }
    });
    
    // Collegamenti tra filosofi (influenze con timeline)
    const influenze = analyzeHistoricalInfluences();
    influenze.forEach(influenza => {
        edges.add({
            from: `f-${influenza.fromId}`,
            to: `f-${influenza.toId}`,
            label: influenza.type,
            color: '#6b7280',
            width: 1 + (influenza.strength * 1.5),
            arrows: 'to',
            dashes: true,
            metadata: {
                type: 'influenza',
                strength: influenza.strength,
                evidence: influenza.evidence
            }
        });
    });
    
    const data = { nodes, edges };
    
    // Configurazione fisica avanzata
    const options = {
        nodes: {
            shape: 'dot',
            size: 25,
            font: {
                size: 14,
                face: 'Inter, -apple-system, sans-serif',
                bold: {
                    size: 15,
                    vadjust: -1
                }
            },
            borderWidth: 2,
            shadow: true,
            scaling: {
                min: 15,
                max: 50,
                label: {
                    enabled: true,
                    min: 12,
                    max: 20,
                    maxVisible: 25,
                    drawThreshold: 5
                }
            }
        },
        edges: {
            width: 2,
            smooth: {
                type: 'dynamic',
                roundness: 0.5
            },
            font: {
                size: 11,
                align: 'middle',
                strokeWidth: 0,
                background: 'rgba(255,255,255,0.8)'
            },
            arrows: {
                to: {
                    enabled: true,
                    scaleFactor: 0.8,
                    type: 'arrow'
                }
            },
            color: {
                inherit: false
            },
            selectionWidth: 3,
            hoverWidth: 2.5
        },
        physics: {
            enabled: true,
            solver: 'forceAtlas2Based',
            forceAtlas2Based: {
                gravitationalConstant: -100,
                centralGravity: 0.02,
                springLength: 150,
                springConstant: 0.06,
                damping: 0.5,
                avoidOverlap: 1.5
            },
            stabilization: {
                enabled: true,
                iterations: 1500,
                updateInterval: 100,
                onlyDynamicEdges: false,
                fit: true
            },
            barnesHut: {
                gravitationalConstant: -2000,
                centralGravity: 0.3,
                springLength: 95,
                springConstant: 0.04,
                damping: 0.09,
                avoidOverlap: 0.1
            }
        },
        interaction: {
            dragNodes: true,
            dragView: true,
            zoomView: true,
            hover: true,
            hoverConnectedEdges: true,
            tooltipDelay: 150,
            hideEdgesOnDrag: true,
            hideEdgesOnZoom: true,
            keyboard: {
                enabled: true,
                speed: { x: 10, y: 10, zoom: 0.02 },
                bindToWindow: true
            },
            multiselect: true
        },
        layout: {
            randomSeed: 42,
            improvedLayout: true,
            hierarchical: {
                enabled: false,
                direction: 'UD',
                sortMethod: 'directed',
                nodeSpacing: 150,
                treeSpacing: 200
            }
        },
        groups: {
            filosofo: {
                shape: 'circle',
                color: {
                    background: '#3b82f6',
                    border: '#1d4ed8',
                    highlight: {
                        background: '#60a5fa',
                        border: '#3b82f6'
                    },
                    hover: {
                        background: '#60a5fa',
                        border: '#3b82f6'
                    }
                },
                size: 30
            },
            concetto: {
                shape: 'box',
                color: {
                    background: '#10b981',
                    border: '#059669',
                    highlight: {
                        background: '#34d399',
                        border: '#10b981'
                    },
                    hover: {
                        background: '#34d399',
                        border: '#10b981'
                    }
                },
                size: 25
            },
            'concetto-analisi': {
                shape: 'star',
                color: {
                    background: '#ec4899',
                    border: '#db2777',
                    highlight: {
                        background: '#f472b6',
                        border: '#ec4899'
                    },
                    hover: {
                        background: '#f472b6',
                        border: '#ec4899'
                    }
                },
                size: 35
            }
        }
    };
    
    // Crea la rete
    const network = new vis.Network(container, data, options);
    
    // Gestisci eventi avanzati
    network.on("click", function(params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const node = nodes.get(nodeId);
            
            // Doppio click per analisi comparativa (se concetto)
            if (params.event.detail === 2) {
                if (nodeId.startsWith('c-')) {
                    const concettoId = nodeId.substring(2);
                    const concetto = appData.concetti.find(c => c.id === concettoId);
                    if (concetto) {
                        openComparativeAnalysis(concetto.parola, concettoId);
                    }
                }
            } 
            // Singolo click per dettagli
            else {
                if (nodeId.startsWith('f-')) {
                    const filosofoId = nodeId.substring(2);
                    showDetail(filosofoId, 'filosofo');
                } else if (nodeId.startsWith('c-')) {
                    const concettoId = nodeId.substring(2);
                    showDetail(concettoId, 'concetto');
                }
            }
        }
    });
    
    network.on("hoverNode", function(params) {
        const node = nodes.get(params.node);
        if (node) {
            // Mostra tooltip avanzato
            network.canvas.body.container.style.cursor = 'pointer';
            
            // Highlight connessioni
            network.selectNodes([params.node]);
            const connectedEdges = network.getConnectedEdges(params.node);
            network.selectEdges(connectedEdges);
        }
    });
    
    network.on("blurNode", function(params) {
        network.unselectAll();
        network.canvas.body.container.style.cursor = 'default';
    });
    
    network.on("zoom", function(params) {
        // Adatta dimensione etichette allo zoom
        const scale = params.scale;
        network.setOptions({
            nodes: {
                font: {
                    size: Math.max(10, Math.min(20, 14 / scale))
                }
            }
        });
    });
    
    // Aggiungi controlli UI avanzati
    addEnhancedNetworkControls(network);
    
    // Fit automatico con animazione
    setTimeout(() => {
        network.fit({ animation: { duration: 1000, easingFunction: 'easeInOutQuad' } });
    }, 500);
    
    // Salva riferimento alla rete per controlli esterni
    window.conceptNetwork = network;
}

function calculateAnalysisScore(filosofo) {
    let score = 0;
    
    // Punteggio basato sul numero di concetti elaborati
    if (filosofo.concetti_principali) {
        score += filosofo.concetti_principali.length * 0.2;
    }
    
    // Punteggio basato sul periodo storico
    const periodScores = {
        'classico': 1.0,
        'medioevale': 0.8,
        'moderno': 0.9,
        'contemporaneo': 1.2
    };
    score += periodScores[filosofo.periodo] || 0.5;
    
    // Punteggio basato sul numero di opere
    if (filosofo.opere_principali) {
        score += Math.min(filosofo.opere_principali.length * 0.1, 0.5);
    }
    
    return Math.min(score, 2.0); // Normalizza a max 2.0
}

function generateFilosofoTooltip(filosofo, analysisScore) {
    return `
        <div class="advanced-tooltip">
            <div class="tooltip-header">
                <strong>${filosofo.nome}</strong>
                <span class="tooltip-score">Punteggio: ${analysisScore.toFixed(1)}</span>
            </div>
            <div class="tooltip-content">
                <p><strong>Scuola:</strong> ${filosofo.scuola}</p>
                <p><strong>Periodo:</strong> ${getPeriodoText(filosofo.periodo)}</p>
                <p><strong>Concetti elaborati:</strong> ${filosofo.concetti_principali ? filosofo.concetti_principali.length : 0}</p>
                ${filosofo.luogo_nascita ? `<p><strong>Luogo:</strong> ${filosofo.luogo_nascita}</p>` : ''}
                ${filosofo.anni_vita ? `<p><strong>Vita:</strong> ${filosofo.anni_vita}</p>` : ''}
            </div>
            <div class="tooltip-footer">
                <em>Clicca per dettagli | Doppio click per analisi</em>
            </div>
        </div>
    `;
}

function generateConcettoTooltip(concetto, hasAnalysis) {
    const analysisBadge = hasAnalysis ? '<span class="tooltip-badge" style="background: #ec4899; color: white; padding: 2px 6px; border-radius: 3px; font-size: 10px;">ANALISI DISPONIBILE</span>' : '';
    
    return `
        <div class="advanced-tooltip">
            <div class="tooltip-header">
                <strong>${concetto.parola}</strong>
                ${analysisBadge}
            </div>
            <div class="tooltip-content">
                <p><strong>Definizione:</strong> ${concetto.definizione.substring(0, 100)}...</p>
                <p><strong>Periodo:</strong> ${concetto.periodo_storico || 'Non specificato'}</p>
                ${concetto.autore_riferimento ? `<p><strong>Autore principale:</strong> ${concetto.autore_riferimento}</p>` : ''}
                ${concetto.opera_riferimento ? `<p><strong>Opera:</strong> ${concetto.opera_riferimento}</p>` : ''}
            </div>
            <div class="tooltip-footer">
                <em>Clicca per dettagli | Doppio click per analisi comparativa</em>
            </div>
        </div>
    `;
}

function calculateConnectionWeight(filosofo, concetto, index) {
    let weight = 0.3; // Peso base
    
    // Importanza nella lista (primi concetti sono più importanti)
    weight += (1 / (index + 1)) * 0.3;
    
    // Concetti con analisi pesano di più
    if (hasComparativeAnalysis(concetto.parola)) {
        weight += 0.2;
    }
    
    // Filosofi contemporanei pesano di più
    if (filosofo.periodo === 'contemporaneo') {
        weight += 0.1;
    }
    
    return Math.min(weight, 0.8);
}

function analyzeHistoricalInfluences() {
    const influenze = [];
    
    // Analizza relazioni filosofiche basate su periodo e scuola
    appData.filosofi.forEach(filosofoFrom => {
        appData.filosofi.forEach(filosofoTo => {
            if (filosofoFrom.id !== filosofoTo.id) {
                // Evita auto-influenze
                let strength = 0;
                let type = 'influenza';
                let evidence = '';
                
                // 1. Influenza temporale (da più antico a più recente)
                const fromPeriodOrder = getPeriodOrder(filosofoFrom.periodo);
                const toPeriodOrder = getPeriodOrder(filosofoTo.periodo);
                
                if (fromPeriodOrder < toPeriodOrder) {
                    strength += 0.3;
                    type = 'influenza temporale';
                    evidence = `Periodo ${filosofoFrom.periodo} → ${filosofoTo.periodo}`;
                }
                
                // 2. Influenza per scuola simile
                if (filosofoFrom.scuola && filosofoTo.scuola && 
                    filosofoFrom.scuola.toLowerCase() === filosofoTo.scuola.toLowerCase()) {
                    strength += 0.4;
                    type = 'influenza di scuola';
                    evidence = `Stessa scuola: ${filosofoFrom.scuola}`;
                }
                
                // 3. Concetti in comune
                if (filosofoFrom.concetti_principali && filosofoTo.concetti_principali) {
                    const commonConcepts = filosofoFrom.concetti_principali.filter(
                        concetto => filosofoTo.concetti_principali.includes(concetto)
                    );
                    
                    if (commonConcepts.length > 0) {
                        strength += commonConcepts.length * 0.2;
                        type = 'concetti condivisi';
                        evidence = `${commonConcepts.length} concetti condivisi`;
                    }
                }
                
                // Aggiungi solo se c'è una relazione significativa
                if (strength > 0.3) {
                    influenze.push({
                        fromId: filosofoFrom.id,
                        toId: filosofoTo.id,
                        type: type,
                        strength: Math.min(strength, 1.0),
                        evidence: evidence
                    });
                }
            }
        });
    });
    
    return influenze;
}

function getPeriodOrder(periodo) {
    const order = {
        'classico': 1,
        'medioevale': 2,
        'moderno': 3,
        'contemporaneo': 4
    };
    return order[periodo] || 0;
}

function addEnhancedNetworkControls(network) {
    const controlsHTML = `
        <div class="network-controls enhanced">
            <button class="network-btn" onclick="network.fit({animation: {duration: 1000}})" title="Adatta vista">
                <i class="fas fa-expand"></i>
            </button>
            <button class="network-btn" onclick="togglePhysics()" title="Attiva/Disattiva fisica">
                <i class="fas fa-atom"></i>
            </button>
            <button class="network-btn" onclick="stabilizeNetwork()" title="Stabilizza rete">
                <i class="fas fa-sync"></i>
            </button>
            <button class="network-btn" onclick="exportNetworkImage()" title="Esporta immagine">
                <i class="fas fa-camera"></i>
            </button>
            <button class="network-btn" onclick="highlightAnalyticalConcepts()" title="Evidenzia concetti con analisi">
                <i class="fas fa-chart-line"></i>
            </button>
            <div class="network-legend">
                <span class="legend-item"><div class="legend-color filosofo"></div> Filosofo</span>
                <span class="legend-item"><div class="legend-color concetto"></div> Concetto</span>
                <span class="legend-item"><div class="legend-color concetto-analisi"></div> Con Analisi</span>
            </div>
        </div>
    `;
    
    const container = document.getElementById('concetto-network-container');
    const controlsDiv = document.createElement('div');
    controlsDiv.innerHTML = controlsHTML;
    container.parentNode.insertBefore(controlsDiv, container.nextSibling);
}

function togglePhysics() {
    if (window.conceptNetwork) {
        const currentPhysics = window.conceptNetwork.getOptions().physics.enabled;
        window.conceptNetwork.setOptions({ physics: { enabled: !currentPhysics } });
        showToast(`Fisica ${!currentPhysics ? 'attivata' : 'disattivata'}`, 'info');
    }
}

function stabilizeNetwork() {
    if (window.conceptNetwork) {
        window.conceptNetwork.stabilize(1000);
        showToast('Rete stabilizzata', 'success');
    }
}

function exportNetworkImage() {
    if (window.conceptNetwork) {
        const canvas = window.conceptNetwork.canvas.frame.canvas;
        const link = document.createElement('a');
        link.download = `mappa-concettuale-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('Immagine esportata', 'success');
    }
}

function highlightAnalyticalConcepts() {
    if (window.conceptNetwork && window.conceptNetwork.body) {
        const nodes = window.conceptNetwork.body.data.nodes;
        const analyticalNodes = nodes.getIds().filter(id => 
            id.startsWith('c-') && hasComparativeAnalysisForNode(id)
        );
        
        window.conceptNetwork.selectNodes(analyticalNodes);
        window.conceptNetwork.focus(analyticalNodes[0], {
            scale: 1.5,
            animation: { duration: 1000 }
        });
        
        showToast(`${analyticalNodes.length} concetti con analisi evidenziati`, 'info');
    }
}

function hasComparativeAnalysisForNode(nodeId) {
    if (!nodeId.startsWith('c-')) return false;
    
    const concettoId = nodeId.substring(2);
    const concetto = appData.concetti.find(c => c.id === concettoId);
    
    return concetto && hasComparativeAnalysis(concetto.parola);
}

function showConceptNetwork(conceptName) {
    showScreen('mappa-concettuale-screen');
    setTimeout(() => {
        loadConcettoNetwork();
        
        // Opzionale: evidenzia il concetto specifico
        if (conceptName && window.conceptNetwork) {
            setTimeout(() => {
                const nodes = window.conceptNetwork.body.data.nodes;
                const targetNode = nodes.getIds().find(id => {
                    if (id.startsWith('c-')) {
                        const node = nodes.get(id);
                        return node && node.label === conceptName;
                    }
                    return false;
                });
                
                if (targetNode) {
                    window.conceptNetwork.selectNodes([targetNode]);
                    window.conceptNetwork.focus(targetNode, {
                        scale: 2,
                        animation: { duration: 1500 }
                    });
                }
            }, 2000);
        }
    }, 500);
}
// ============================================
// ANALISI COMPARATIVA - NUOVA FUNZIONALITÀ
// ============================================

let currentComparativeAnalysis = null;

function openComparativeAnalysis(termine, concettoId = null) {
    currentComparativeAnalysis = {
        termine: termine,
        concettoId: concettoId,
        timestamp: new Date().toISOString()
    };
    
    // Mostra loader
    const modal = document.getElementById('comparative-analysis-modal');
    const content = document.getElementById('comparative-analysis-content');
    
    if (!modal || !content) {
        console.error('Modal analisi comparativa non trovata');
        showToast('Errore: modal analisi non disponibile', 'error');
        return;
    }
    
    content.innerHTML = `
        <div class="analysis-loading">
            <div class="spinner large"></div>
            <p>Analisi comparativa in corso...</p>
            <p class="loading-subtitle">Analizzo "${termine}" attraverso i periodi storici</p>
        </div>
    `;
    
    modal.style.display = 'flex';
    
    // Simula analisi asincrona
    setTimeout(() => {
        performComparativeAnalysis(termine, concettoId);
    }, 800);
}

function performComparativeAnalysis(termine, concettoId = null) {
    try {
        // 1. Recupera dati del concetto (se specificato)
        const concetto = concettoId ? 
            appData.concetti.find(c => c.id === concettoId) :
            appData.concetti.find(c => c.parola.toLowerCase() === termine.toLowerCase());
        
        // 2. Analizza occorrenze nei filosofi
        const analisi = analyzeTermAcrossPeriods(termine, concetto);
        
        // 3. Mostra risultati
        mostraAnalisiComparativa(analisi);
        
        // 4. Log attività
        logActivity(`Analisi comparativa eseguita per: ${termine}`);
        
    } catch (error) {
        console.error('Errore analisi comparativa:', error);
        
        const content = document.getElementById('comparative-analysis-content');
        if (content) {
            content.innerHTML = `
                <div class="analysis-error">
                    <div class="error-icon"><i class="fas fa-exclamation-triangle"></i></div>
                    <h3>Errore nell'analisi</h3>
                    <p>Non è stato possibile completare l'analisi comparativa.</p>
                    <p class="error-details">${error.message}</p>
                    <button class="btn primary" onclick="openComparativeAnalysis('${termine}', '${concettoId}')">
                        <i class="fas fa-redo"></i> Riprova
                    </button>
                </div>
            `;
        }
    }
}

function analyzeTermAcrossPeriods(termine, concetto = null) {
    const periodi = ['classico', 'medioevale', 'moderno', 'contemporaneo'];
    
    // 1. Filosofi che trattano il termine
    const filosofiConTermine = appData.filosofi.filter(filosofo => {
        // Controlla nei concetti principali
        if (filosofo.concetti_principali) {
            return filosofo.concetti_principali.some(c => 
                c.toLowerCase().includes(termine.toLowerCase())
            );
        }
        return false;
    });
    
    // 2. Opere correlate
    const opereCorrelate = appData.opere.filter(opera => {
        if (opera.concetti) {
            return opera.concetti.some(c => 
                c.toLowerCase().includes(termine.toLowerCase())
            );
        }
        return false;
    });
    
    // 3. Analisi per periodo
    const analisiPerPeriodo = {};
    
    periodi.forEach(periodo => {
        const filosofiPeriodo = filosofiConTermine.filter(f => f.periodo === periodo);
        const operePeriodo = opereCorrelate.filter(o => o.periodo === periodo);
        
        // Contesto di utilizzo (esempi)
        const contesti = [];
        
        filosofiPeriodo.forEach(filosofo => {
            if (filosofo.concetti_principali) {
                filosofo.concetti_principali.forEach(concettoNome => {
                    if (concettoNome.toLowerCase().includes(termine.toLowerCase())) {
                        contesti.push({
                            tipo: 'filosofo',
                            autore: filosofo.nome,
                            scuola: filosofo.scuola,
                            concetto: concettoNome,
                            peso: 1.0
                        });
                    }
                });
            }
        });
        
        operePeriodo.forEach(opera => {
            contesti.push({
                tipo: 'opera',
                autore: opera.autore_nome,
                titolo: opera.titolo,
                anno: opera.anno,
                peso: 0.8
            });
        });
        
        analisiPerPeriodo[periodo] = {
            occorrenze: filosofiPeriodo.length + operePeriodo.length,
            filosofiCount: filosofiPeriodo.length,
            opereCount: operePeriodo.length,
            contesti: contesti,
            filosofi: filosofiPeriodo.map(f => ({
                id: f.id,
                nome: f.nome,
                scuola: f.scuola
            })),
            opere: operePeriodo.map(o => ({
                id: o.id,
                titolo: o.titolo,
                autore: o.autore_nome,
                anno: o.anno
            }))
        };
    });
    
    // 4. Timeline evolutiva
    const timeline = generateTimeline(termine, filosofiConTermine, opereCorrelate);
    
    // 5. Trasformazioni concettuali
    const trasformazioni = analyzeConceptTransformations(termine, periodi, analisiPerPeriodo);
    
    // 6. Metriche comparative
    const metriche = {
        totalOccorrenze: Object.values(analisiPerPeriodo).reduce((sum, p) => sum + p.occorrenze, 0),
        piccoPeriodo: Object.keys(analisiPerPeriodo).reduce((a, b) => 
            analisiPerPeriodo[a].occorrenze > analisiPerPeriodo[b].occorrenze ? a : b
        ),
        diversitaScuole: calculateSchoolDiversity(filosofiConTermine),
        evoluzioneConcettuale: calculateConceptualEvolution(analisiPerPeriodo)
    };
    
    // 7. Costruisci oggetto analisi completo
    const analisiCompleta = {
        termine: termine,
        definizione: concetto ? concetto.definizione : 'Definizione non disponibile',
        definizione_en: concetto ? concetto.definizione_en : '',
        timeline: timeline,
        periodi: analisiPerPeriodo,
        trasformazioni: trasformazioni,
        metriche: metriche,
        statistiche: {
            totalFilosofi: filosofiConTermine.length,
            totalOpere: opereCorrelate.length,
            periodiCoperti: periodi.filter(p => analisiPerPeriodo[p].occorrenze > 0).length,
            scuoleCoinvolte: [...new Set(filosofiConTermine.map(f => f.scuola))].length
        },
        riferimenti: {
            filosofi: filosofiConTermine.map(f => f.id),
            opere: opereCorrelate.map(o => o.id)
        },
        metadata: {
            generatedAt: new Date().toISOString(),
            dataPoints: filosofiConTermine.length + opereCorrelate.length,
            confidence: calculateAnalysisConfidence(filosofiConTermine, opereCorrelate)
        }
    };
    
    return analisiCompleta;
}

function generateTimeline(termine, filosofi, opere) {
    const timeline = [];
    
    // Combina filosofi e opere in timeline
    filosofi.forEach(filosofo => {
        // Estrai secolo approssimativo dalla vita
        const secolo = extractCenturyFromLife(filosofo.anni_vita);
        
        if (secolo) {
            timeline.push({
                type: 'filosofo',
                label: filosofo.nome,
                periodo: filosofo.periodo,
                secolo: secolo,
                data: filosofo,
                weight: 1.0
            });
        }
    });
    
    opere.forEach(opera => {
        if (opera.anno) {
            const secolo = Math.floor(parseInt(opera.anno) / 100) + 1;
            
            timeline.push({
                type: 'opera',
                label: opera.titolo,
                periodo: opera.periodo,
                secolo: secolo,
                data: opera,
                weight: 0.7
            });
        }
    });
    
    // Ordina per secolo
    timeline.sort((a, b) => a.secolo - b.secolo);
    
    return timeline;
}

function extractCenturyFromLife(lifeString) {
    if (!lifeString) return null;
    
    // Cerca anni in formato "480-524 a.C." o "427-347 a.C."
    const match = lifeString.match(/(\d+)/);
    if (match) {
        let year = parseInt(match[1]);
        
        // Correggi per anni a.C.
        if (lifeString.toLowerCase().includes('a.c')) {
            year = -year;
        }
        
        return Math.floor((year + 100) / 100);
    }
    
    return null;
}

function analyzeConceptTransformations(termine, periodi, analisiPerPeriodo) {
    const trasformazioni = [];
    
    for (let i = 0; i < periodi.length - 1; i++) {
        const periodoFrom = periodi[i];
        const periodoTo = periodi[i + 1];
        
        const analisiFrom = analisiPerPeriodo[periodoFrom];
        const analisiTo = analisiPerPeriodo[periodoTo];
        
        if (analisiFrom.occorrenze > 0 && analisiTo.occorrenze > 0) {
            const cambiamento = {
                from: periodoFrom,
                to: periodoTo,
                tipo: determineTransformationType(analisiFrom, analisiTo),
                intensita: calculateTransformationIntensity(analisiFrom, analisiTo),
                evidenze: []
            };
            
            // Analizza scuole coinvolte
            const scuoleFrom = analisiFrom.filosofi.map(f => f.scuola);
            const scuoleTo = analisiTo.filosofi.map(f => f.scuola);
            
            if (scuoleFrom.length > 0 && scuoleTo.length > 0) {
                const scuoleComuni = scuoleFrom.filter(s => scuoleTo.includes(s));
                const scuoleNuove = scuoleTo.filter(s => !scuoleFrom.includes(s));
                
                if (scuoleNuove.length > 0) {
                    cambiamento.evidenze.push(`Nuove scuole: ${scuoleNuove.join(', ')}`);
                }
                
                if (scuoleComuni.length > 0) {
                    cambiamento.evidenze.push(`Scuole continuative: ${scuoleComuni.join(', ')}`);
                }
            }
            
            trasformazioni.push(cambiamento);
        }
    }
    
    return trasformazioni;
}

function determineTransformationType(analisiFrom, analisiTo) {
    const delta = analisiTo.occorrenze - analisiFrom.occorrenze;
    const percentuale = (delta / analisiFrom.occorrenze) * 100;
    
    if (percentuale > 50) {
        return 'espansione';
    } else if (percentuale < -30) {
        return 'riduzione';
    } else if (Math.abs(percentuale) <= 10) {
        return 'stabilità';
    } else {
        return 'trasformazione';
    }
}

function calculateTransformationIntensity(analisiFrom, analisiTo) {
    // Intensità basata su diversi fattori
    let intensity = 0;
    
    // 1. Cambiamento occorrenze
    const deltaOccorrenze = Math.abs(analisiTo.occorrenze - analisiFrom.occorrenze);
    intensity += deltaOccorrenze * 0.2;
    
    // 2. Cambiamento contesti
    const deltaContesti = Math.abs(analisiTo.contesti.length - analisiFrom.contesti.length);
    intensity += deltaContesti * 0.3;
    
    // 3. Nuove scuole
    const scuoleFrom = analisiFrom.filosofi.map(f => f.scuola);
    const scuoleTo = analisiTo.filosofi.map(f => f.scuola);
    const scuoleNuove = scuoleTo.filter(s => !scuoleFrom.includes(s)).length;
    intensity += scuoleNuove * 0.5;
    
    return Math.min(intensity, 5); // Scala 0-5
}

function calculateSchoolDiversity(filosofi) {
    if (filosofi.length === 0) return 0;
    
    const scuole = filosofi.map(f => f.scuola);
    const scuoleUniche = [...new Set(scuole)];
    
    // Diversità = numero scuole uniche / numero totale filosofi
    return (scuoleUniche.length / filosofi.length);
}

function calculateConceptualEvolution(analisiPerPeriodo) {
    const periodi = Object.keys(analisiPerPeriodo);
    let evolutionScore = 0;
    
    for (let i = 0; i < periodi.length - 1; i++) {
        const periodoFrom = periodi[i];
        const periodoTo = periodi[i + 1];
        
        const from = analisiPerPeriodo[periodoFrom];
        const to = analisiPerPeriodo[periodoTo];
        
        if (from.occorrenze > 0 && to.occorrenze > 0) {
            // Evoluzione positiva se aumentano occorrenze
            if (to.occorrenze > from.occorrenze) {
                evolutionScore += 0.3;
            }
            
            // Evoluzione concettuale se cambiano le scuole
            const scuoleFrom = from.filosofi.map(f => f.scuola);
            const scuoleTo = to.filosofi.map(f => f.scuola);
            const scuoleNuove = scuoleTo.filter(s => !scuoleFrom.includes(s)).length;
            
            if (scuoleNuove > 0) {
                evolutionScore += scuoleNuove * 0.2;
            }
        }
    }
    
    return Math.min(evolutionScore, 3); // Scala 0-3
}

function calculateAnalysisConfidence(filosofi, opere) {
    let confidence = 0;
    
    // Basato su quantità di dati
    const totalDataPoints = filosofi.length + opere.length;
    
    if (totalDataPoints >= 10) confidence = 0.9;
    else if (totalDataPoints >= 5) confidence = 0.7;
    else if (totalDataPoints >= 2) confidence = 0.5;
    else confidence = 0.3;
    
    // Aumenta se ci sono opere
    if (opere.length > 0) confidence += 0.1;
    
    return Math.min(confidence, 0.95);
}

function mostraAnalisiComparativa(analisi) {
    const content = document.getElementById('comparative-analysis-content');
    if (!content) return;
    
    const t = (window.translations && window.translations[currentLanguage]) ? 
        window.translations[currentLanguage] : {};
    
    // Traduzione periodi
    const periodoLabels = {
        'classico': t.period_classic || 'Classico',
        'medioevale': t.period_medieval || 'Medioevale',
        'moderno': t.period_modern || 'Moderno',
        'contemporaneo': t.period_contemporary || 'Contemporaneo'
    };
    
    // Costruisci HTML dell'analisi
    let html = `
        <div class="comparative-analysis">
            <div class="analysis-header">
                <h2><i class="fas fa-chart-line"></i> ${t.analysis_title || 'Analisi Comparativa'}</h2>
                <div class="analysis-subtitle">Termine: <strong>${analisi.termine}</strong></div>
                <div class="analysis-meta">
                    <span class="meta-item"><i class="fas fa-calendar"></i> ${formatDate(analisi.metadata.generatedAt)}</span>
                    <span class="meta-item"><i class="fas fa-database"></i> ${analisi.metadata.dataPoints} fonti</span>
                    <span class="meta-item"><i class="fas fa-check-circle"></i> ${(analisi.metadata.confidence * 100).toFixed(0)}% affidabilità</span>
                </div>
            </div>
            
            <div class="analysis-overview">
                <div class="overview-card">
                    <div class="overview-icon" style="background: linear-gradient(135deg, #3b82f6, #1d4ed8);">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                    <div class="overview-content">
                        <div class="overview-value">${analisi.statistiche.totalFilosofi}</div>
                        <div class="overview-label">${t.analysis_philosophers || 'Filosofi coinvolti'}</div>
                    </div>
                </div>
                <div class="overview-card">
                    <div class="overview-icon" style="background: linear-gradient(135deg, #10b981, #059669);">
                        <i class="fas fa-book"></i>
                    </div>
                    <div class="overview-content">
                        <div class="overview-value">${analisi.statistiche.totalOpere}</div>
                        <div class="overview-label">${t.analysis_works || 'Opere correlate'}</div>
                    </div>
                </div>
                <div class="overview-card">
                    <div class="overview-icon" style="background: linear-gradient(135deg, #8b5cf6, #7c3aed);">
                        <i class="fas fa-history"></i>
                    </div>
                    <div class="overview-content">
                        <div class="overview-value">${analisi.statistiche.periodiCoperti}</div>
                        <div class="overview-label">${t.analysis_periods || 'Periodi storici'}</div>
                    </div>
                </div>
                <div class="overview-card">
                    <div class="overview-icon" style="background: linear-gradient(135deg, #f59e0b, #d97706);">
                        <i class="fas fa-school"></i>
                    </div>
                    <div class="overview-content">
                        <div class="overview-value">${analisi.statistiche.scuoleCoinvolte}</div>
                        <div class="overview-label">${t.analysis_schools || 'Scuole di pensiero'}</div>
                    </div>
                </div>
            </div>
            
            <div class="analysis-section">
                <h3><i class="fas fa-timeline"></i> ${t.analysis_timeline || 'Timeline Evolutiva'}</h3>
                <div class="timeline-container">
                    ${analisi.timeline.map((event, index) => `
                        <div class="timeline-item">
                            <div class="timeline-marker periodo-${event.periodo}">
                                <i class="fas fa-${event.type === 'filosofo' ? 'user-graduate' : 'book'}"></i>
                            </div>
                            <div class="timeline-content">
                                <div class="timeline-title">${event.label}</div>
                                <div class="timeline-meta">
                                    <span class="periodo-badge periodo-${event.periodo}">${periodoLabels[event.periodo] || event.periodo}</span>
                                    <span class="timeline-century">Secolo ${event.secolo}</span>
                                </div>
                                ${event.type === 'filosofo' ? 
                                    `<div class="timeline-desc">${event.data.scuola}</div>` :
                                    `<div class="timeline-desc">${event.data.autore} (${event.data.anno})</div>`
                                }
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="analysis-section">
                <h3><i class="fas fa-balance-scale"></i> ${t.analysis_period_comparison || 'Confronto tra Periodi'}</h3>
                <div class="period-comparison">
                    ${Object.entries(analisi.periodi).map(([periodo, dati]) => `
                        <div class="period-card">
                            <div class="period-header periodo-${periodo}">
                                <h4>${periodoLabels[periodo] || periodo}</h4>
                                <span class="period-count">${dati.occorrenze} occorrenze</span>
                            </div>
                            <div class="period-stats">
                                <div class="stat-row">
                                    <span class="stat-label"><i class="fas fa-user-graduate"></i> Filosofi:</span>
                                    <span class="stat-value">${dati.filosofiCount}</span>
                                </div>
                                <div class="stat-row">
                                    <span class="stat-label"><i class="fas fa-book"></i> Opere:</span>
                                    <span class="stat-value">${dati.opereCount}</span>
                                </div>
                            </div>
                            ${dati.filosofi.length > 0 ? `
                                <div class="period-filosofi">
                                    <div class="section-subtitle">Filosofi principali:</div>
                                    <div class="filosofi-tags">
                                        ${dati.filosofi.slice(0, 3).map(f => `
                                            <span class="filosofo-tag" onclick="showDetail('${f.id}', 'filosofo')">
                                                ${f.nome}
                                            </span>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
            
            ${analisi.trasformazioni.length > 0 ? `
                <div class="analysis-section">
                    <h3><i class="fas fa-exchange-alt"></i> ${t.analysis_transformations || 'Trasformazioni Concettuali'}</h3>
                    <div class="transformations-grid">
                        ${analisi.trasformazioni.map(tr => `
                            <div class="transformation-card">
                                <div class="transformation-header">
                                    <span class="transformation-from periodo-${tr.from}">${periodoLabels[tr.from] || tr.from}</span>
                                    <i class="fas fa-arrow-right"></i>
                                    <span class="transformation-to periodo-${tr.to}">${periodoLabels[tr.to] || tr.to}</span>
                                </div>
                                <div class="transformation-type type-${tr.tipo}">
                                    <i class="fas fa-${getTransformationIcon(tr.tipo)}"></i> ${getTransformationLabel(tr.tipo)}
                                </div>
                                <div class="transformation-intensity">
                                    <div class="intensity-bar" style="width: ${(tr.intensita / 5) * 100}%"></div>
                                    <span class="intensity-label">Intensità: ${tr.intensita.toFixed(1)}/5</span>
                                </div>
                                ${tr.evidenze.length > 0 ? `
                                    <div class="transformation-evidence">
                                        <div class="evidence-title">Evidenze:</div>
                                        <ul>
                                            ${tr.evidenze.map(e => `<li>${e}</li>`).join('')}
                                        </ul>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
            
            <div class="analysis-actions">
                <button class="btn primary" onclick="exportAnalysisToExcel()">
                    <i class="fas fa-file-excel"></i> ${t.export_excel || 'Esporta in Excel'}
                </button>
                <button class="btn secondary" onclick="shareAnalysis()">
                    <i class="fas fa-share"></i> ${t.share_analysis || 'Condividi Analisi'}
                </button>
                <button class="btn" onclick="closeComparativeAnalysis()">
                    <i class="fas fa-times"></i> ${t.close || 'Chiudi'}
                </button>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
}

function getTransformationIcon(tipo) {
    const icons = {
        'espansione': 'expand',
        'riduzione': 'compress',
        'stabilità': 'pause',
        'trasformazione': 'sync'
    };
    return icons[tipo] || 'exchange-alt';
}

function getTransformationLabel(tipo) {
    const labels = {
        'espansione': 'Espansione concettuale',
        'riduzione': 'Riduzione d\'uso',
        'stabilità': 'Stabilità concettuale',
        'trasformazione': 'Trasformazione'
    };
    return labels[tipo] || tipo;
}

function hasComparativeAnalysis(termine) {
    // Controlla se il termine ha abbastanza dati per un'analisi
    const filosofiConTermine = appData.filosofi.filter(filosofo => {
        if (filosofo.concetti_principali) {
            return filosofo.concetti_principali.some(c => 
                c.toLowerCase().includes(termine.toLowerCase())
            );
        }
        return false;
    });
    
    const opereCorrelate = appData.opere.filter(opera => {
        if (opera.concetti) {
            return opera.concetti.some(c => 
                c.toLowerCase().includes(termine.toLowerCase())
            );
        }
        return false;
    });
    
    // Almeno 2 filosofi o opere
    return (filosofiConTermine.length + opereCorrelate.length) >= 2;
}

function exportAnalysisToExcel() {
    if (!currentComparativeAnalysis) {
        showToast('Nessuna analisi corrente da esportare', 'warning');
        return;
    }
    
    try {
        if (typeof ExcelWorker !== 'undefined' && ExcelWorker.exportAnalysisToExcel) {
            ExcelWorker.exportAnalysisToExcel(currentComparativeAnalysis);
        } else {
            // Fallback manuale
            const data = [
                ['Analisi Comparativa', currentComparativeAnalysis.termine],
                ['Generata il', new Date().toLocaleString()],
                [''],
                ['Periodo', 'Filosofi', 'Opere', 'Totale Occorrenze']
            ];
            
            // Aggiungi dati periodi
            Object.entries(currentComparativeAnalysis.periodi || {}).forEach(([periodo, dati]) => {
                data.push([
                    periodo,
                    dati.filosofiCount,
                    dati.opereCount,
                    dati.occorrenze
                ]);
            });
            
            // Crea file Excel
            const ws = XLSX.utils.aoa_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Analisi');
            XLSX.writeFile(wb, `analisi-${currentComparativeAnalysis.termine}-${new Date().toISOString().split('T')[0]}.xlsx`);
            
            showToast('Analisi esportata in Excel', 'success');
        }
    } catch (error) {
        console.error('Errore esportazione analisi:', error);
        showToast('Errore nell\'esportazione', 'error');
    }
}

function shareAnalysis() {
    if (!currentComparativeAnalysis) {
        showToast('Nessuna analisi da condividere', 'warning');
        return;
    }
    
    const termine = currentComparativeAnalysis.termine;
    const text = `Analisi comparativa del termine "${termine}" su Aeterna Lexicon\n\nScopri l'evoluzione di questo concetto attraverso i periodi storici.`;
    
    if (navigator.share) {
        navigator.share({
            title: `Analisi: ${termine}`,
            text: text,
            url: window.location.href
        }).catch(err => {
            console.log('Condivisione annullata:', err);
        });
    } else {
        // Fallback per browser senza Web Share API
        navigator.clipboard.writeText(`${text}\n${window.location.href}`);
        showToast('Link copiato negli appunti', 'success');
    }
}

function closeComparativeAnalysis() {
    const modal = document.getElementById('comparative-analysis-modal');
    if (modal) {
        modal.style.display = 'none';
        currentComparativeAnalysis = null;
    }
}

// ============================================
// ADMIN PANEL FUNCTIONS - FILOSOFIA
// ============================================

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

// Filosofi Admin
async function loadAdminFilosofi() {
    const tbody = document.getElementById('filosofi-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const sortedFilosofi = [...appData.filosofi].sort((a, b) => {
        const nomeA = a.nome.toLowerCase();
        const nomeB = b.nome.toLowerCase();
        return nomeA.localeCompare(nomeB);
    });

    sortedFilosofi.forEach(filosofo => {
        const deleteButton = currentUserRole === 'admin' 
            ? `<button class="delete-btn" onclick="deleteFilosofo('${filosofo.id}')">Elimina</button>` 
            : '';
            
        const checkboxHtml = currentUserRole === 'admin'
            ? `<input type="checkbox" class="select-item-filosofi" value="${filosofo.id}" onchange="updateDeleteButtonState('filosofi')">`
            : '';

        const analysisBadge = hasComparativeAnalysisForFilosofo(filosofo) ? 
            '<span class="analysis-indicator" title="Presente in analisi comparativa">📊</span>' : '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">${checkboxHtml}</td>
            <td>${filosofo.id}</td>
            <td>${filosofo.nome} ${analysisBadge}</td>
            <td>${filosofo.scuola}</td>
            <td><span class="item-period periodo-${filosofo.periodo}">${getPeriodoText(filosofo.periodo)}</span></td>
            <td class="admin-item-actions">
                <button class="edit-btn" onclick="editFilosofo('${filosofo.id}')">Modifica</button>
                ${deleteButton}
            </td>
        `;
        tbody.appendChild(row);
    });
    
    updateDeleteButtonState('filosofi');
}

function hasComparativeAnalysisForFilosofo(filosofo) {
    if (!filosofo.concetti_principali) return false;
    
    return filosofo.concetti_principali.some(concetto => 
        hasComparativeAnalysis(concetto)
    );
}

function editFilosofo(id) {
    const item = appData.filosofi.find(f => f.id == id);
    if (!item) return;

    // Popola i campi ID e Nome
    document.getElementById('filosofo-id').value = item.id;
    document.getElementById('filosofo-nome').value = item.nome || '';
    
    // Select Periodo
    const periodoSelect = document.getElementById('filosofo-periodo');
    if(periodoSelect) periodoSelect.value = item.periodo || 'classico';

    // Altri campi testuali
    document.getElementById('filosofo-scuola').value = item.scuola || '';
    document.getElementById('filosofo-anni').value = item.anni_vita || '';
    
    // --- CAMPI CHE TI MANCAVANO ---
    
    // 1. Luogo
    const luogoInput = document.getElementById('filosofo-luogo');
    if(luogoInput) luogoInput.value = item.luogo_nascita || '';

    // 2. Ritratto
    const ritrattoInput = document.getElementById('filosofo-ritratto');
    if(ritrattoInput) ritrattoInput.value = item.ritratto || '';

    // 3. Coordinate (gestisce sia numeri che stringhe)
    // Cerca lat/lng piatti OPPURE dentro l'oggetto coordinate
    const lat = item.lat || (item.coordinate ? item.coordinate.lat : '');
    const lng = item.lng || (item.coordinate ? item.coordinate.lng : '');
    
    const latInput = document.getElementById('filosofo-lat');
    const lngInput = document.getElementById('filosofo-lng');
    if(latInput) latInput.value = lat || '';
    if(lngInput) lngInput.value = lng || '';

    // 4. Concetti (Array -> Stringa per l'input)
    const concettiInput = document.getElementById('filosofo-concetti');
    if(concettiInput) {
        concettiInput.value = (item.concetti_principali && Array.isArray(item.concetti_principali)) 
            ? item.concetti_principali.join(', ') 
            : '';
    }

    // 5. Biografia
    const bioInput = document.getElementById('filosofo-biografia');
    if(bioInput) bioInput.value = item.biografia || '';

    // Apre il modale
    openModal('admin-modal-filosofo'); 
}

async function saveFilosofo() {
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    try {
        const id = getVal('filosofo-id');
        const nome = getVal('filosofo-nome');
        const periodoEl = document.getElementById('filosofo-periodo');
        const periodo = periodoEl ? periodoEl.value : 'classico';
        
        if (!nome) {
            alert("Il nome è obbligatorio");
            return;
        }

        // Conversione Concetti da Stringa a Array
        const concettiRaw = getVal('filosofo-concetti');
        const concettiArray = concettiRaw 
            ? concettiRaw.split(',').map(s => s.trim()).filter(s => s !== '')
            : [];

        // Oggetto Base con TUTTI i campi
        const filosofoData = {
            nome: nome,
            periodo: periodo,
            scuola: getVal('filosofo-scuola'),
            anni_vita: getVal('filosofo-anni'),
            luogo_nascita: getVal('filosofo-luogo'),
            ritratto: getVal('filosofo-ritratto'),
            biografia: getVal('filosofo-biografia'),
            concetti_principali: concettiArray,
            updatedAt: new Date().toISOString()
        };

        // --- FIX COORDINATE (Virgola -> Punto) ---
        let latStr = getVal('filosofo-lat').replace(',', '.');
        let lngStr = getVal('filosofo-lng').replace(',', '.');
        
        if (latStr && lngStr && !isNaN(parseFloat(latStr)) && !isNaN(parseFloat(lngStr))) {
            filosofoData.lat = parseFloat(latStr);
            filosofoData.lng = parseFloat(lngStr);
            // Salviamo anche la struttura nidificata per sicurezza mappe
            filosofoData.coordinate = {
                lat: parseFloat(latStr),
                lng: parseFloat(lngStr)
            };
        }

        // Salvataggio su Firebase
        if (window.db) {
            if (id && id.trim() !== '') {
                await db.collection('filosofi').doc(id).update(filosofoData);
            } else {
                filosofoData.createdAt = new Date().toISOString();
                await db.collection('filosofi').add(filosofoData);
            }
            
            // Notifica Successo
            if (typeof showToast === 'function') showToast('Filosofo salvato con successo!', 'success');
            else alert('Salvato con successo');

            // Chiudi modale
            if (typeof closeModal === 'function') closeModal('admin-modal-filosofo');
            
            // Ricarica la pagina per aggiornare sia la griglia che la tabella admin
            setTimeout(() => location.reload(), 500);

        } else {
            alert("Errore: Database non connesso.");
        }

    } catch (error) {
        console.error("Errore salvataggio:", error);
        alert("Errore: " + error.message);
    }
}

// Opere Admin
async function loadAdminOpere() {
    const tbody = document.getElementById('opere-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const sortedOpere = [...appData.opere].sort((a, b) => {
        const titoloA = a.titolo.toLowerCase();
        const titoloB = b.titolo.toLowerCase();
        return titoloA.localeCompare(titoloB);
    });

    sortedOpere.forEach(opera => {
        const deleteButton = currentUserRole === 'admin' 
            ? `<button class="delete-btn" onclick="deleteOpera('${opera.id}')">Elimina</button>` 
            : '';

        const checkboxHtml = currentUserRole === 'admin'
            ? `<input type="checkbox" class="select-item-opere" value="${opera.id}" onchange="updateDeleteButtonState('opere')">`
            : '';

        const analysisBadge = hasComparativeAnalysisForOpera(opera) ? 
            '<span class="analysis-indicator" title="Correlata ad analisi">📊</span>' : '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">${checkboxHtml}</td>
            <td>${opera.id}</td>
            <td>${opera.titolo} ${analysisBadge}</td>
            <td>${opera.autore_nome || 'Autore non specificato'}</td>
            <td>${opera.anno}</td>
            <td class="admin-item-actions">
                <button class="edit-btn" onclick="editOpera('${opera.id}')">Modifica</button>
                ${deleteButton}
            </td>
        `;
        tbody.appendChild(row);
    });
    updateDeleteButtonState('opere');
}

function hasComparativeAnalysisForOpera(opera) {
    if (!opera.concetti) return false;
    
    return opera.concetti.some(concetto => 
        hasComparativeAnalysis(concetto)
    );
}

function editOpera(id) {
    const opera = appData.opere.find(o => o.id == id);
    if (!opera) return;
    
    document.getElementById('opera-id').value = opera.id;
    document.getElementById('opera-titolo').value = opera.titolo || '';
    
    // Seleziona autore dalla dropdown
    const autoreSelect = document.getElementById('opera-autore');
    if (autoreSelect) {
        autoreSelect.value = opera.autore_id || '';
    }
    
    document.getElementById('opera-anno').value = opera.anno || '';
    document.getElementById('opera-periodo').value = opera.periodo || '';
    document.getElementById('opera-lingua').value = opera.lingua || '';
    document.getElementById('opera-sintesi').value = opera.sintesi || '';
    
    // Campi inglesi
    if(document.getElementById('opera-titolo-en'))
        document.getElementById('opera-titolo-en').value = opera.titolo_en || '';
    if(document.getElementById('opera-sintesi-en'))
        document.getElementById('opera-sintesi-en').value = opera.sintesi_en || '';
    
    document.getElementById('opera-pdf').value = opera.pdf_url || '';
    document.getElementById('opera-immagine').value = opera.immagine || '';
    
    // Concetti (come testo separato da virgola)
    if(document.getElementById('opera-concetti') && opera.concetti) {
        document.getElementById('opera-concetti').value = opera.concetti.join(', ');
    }
    
    showAdminTab('opere-admin');
}

async function saveOpera(event) {
    event.preventDefault();
    
    // Helper per leggere valori
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    try {
        const id = getVal('opera-id');
        const titolo = getVal('opera-titolo');
        const titolo_en = getVal('opera-titolo-en');
        const autoreSelect = document.getElementById('opera-autore');
        const autoreId = autoreSelect ? autoreSelect.value : '';
        
        // VALIDAZIONI
        if (!titolo) {
            showToast("Il titolo è obbligatorio", "error");
            return;
        }
        
        if (!autoreId) {
            showToast("Devi selezionare un autore", "error");
            return;
        }
        
        // Trova il nome dell'autore
        let autoreNome = '';
        if (autoreSelect && autoreSelect.selectedIndex >= 0) {
            autoreNome = autoreSelect.options[autoreSelect.selectedIndex].text;
        }
        
        // Se non troviamo il nome dal menu, cercalo nei dati
        if (!autoreNome && autoreId) {
            const filosofo = appData.filosofi.find(f => f.id === autoreId);
            autoreNome = filosofo ? filosofo.nome : 'Autore sconosciuto';
        }

        // Costruisci i dati dell'opera
        const operaData = {
            titolo: titolo,
            titolo_en: titolo_en || '',
            autore_id: autoreId,
            autore_nome: autoreNome,
            anno: getVal('opera-anno'),
            periodo: getVal('opera-periodo'),
            sintesi: getVal('opera-sintesi'),
            sintesi_en: getVal('opera-sintesi-en') || '',
            lingua: getVal('opera-lingua'),
            pdf_url: getVal('opera-pdf'),
            immagine: getVal('opera-immagine'),
            concetti: getVal('opera-concetti') ? 
                getVal('opera-concetti').split(',').map(c => c.trim()).filter(c => c !== '') : [],
            last_modified: new Date().toISOString()
        };

        let savedId;
        
        if (navigator.onLine && window.db) {
            if (id) {
                // Modifica esistente
                await saveFirebaseData('opere', operaData, id);
                savedId = id;
                
                // Aggiorna localmente
                const index = appData.opere.findIndex(o => o.id === id);
                if (index !== -1) {
                    appData.opere[index] = { id, ...operaData };
                }
            } else {
                // Crea nuovo
                savedId = await saveFirebaseData('opere', operaData);
                appData.opere.push({ id: savedId, ...operaData });
            }
            
            showToast('Opera salvata con successo!', 'success');
        } else {
            // Modalità offline
            savedId = id || `local_${Date.now()}`;
            if (typeof addToSyncQueue === 'function') {
                await addToSyncQueue(id ? 'UPDATE' : 'CREATE', 'opere', operaData, savedId);
            }
            showToast('Opera salvata localmente (offline)', 'info');
        }
        
        // Aggiorna UI
        saveLocalData();
        loadAdminOpere();
        if (typeof loadOpere === 'function') loadOpere();
        
        // Reset form
        document.getElementById('opera-form').reset();
        document.getElementById('opera-id').value = '';
        
        // Ricarica i menu se necessario
        updateAllSelects();
        
    } catch (error) {
        console.error("Errore salvataggio opera:", error);
        showToast("Errore: " + error.message, "error");
    }
}

function resetOperaForm() {
    document.getElementById('opera-form').reset();
    document.getElementById('opera-id').value = '';
}

async function deleteOpera(id) {
    if (currentUserRole !== 'admin') {
        showToast('Non hai i permessi per eliminare', 'error');
        return;
    }

    if (!confirm('Sei sicuro di voler eliminare questa opera?')) return;
    
    try {
        if (navigator.onLine) {
            await deleteFirebaseData('opere', id);
        } else {
            const opera = appData.opere.find(o => o.id == id);
            if (opera) {
                await addToSyncQueue('DELETE', 'opere', opera, id);
            }
        }
        
        appData.opere = appData.opere.filter(o => o.id != id);
        
        saveLocalData();
        loadAdminOpere();
        loadOpere();
        updateDashboardStats();
        
        showToast('Opera eliminata con successo', 'success');
        logActivity('Opera eliminata');
    } catch (error) {
        showToast('Errore nell\'eliminazione dell\'opera', 'error');
    }
}

// Concetti Admin
async function loadAdminConcetti() {
    const tbody = document.getElementById('concetti-table-body');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    const sortedConcetti = [...appData.concetti].sort((a, b) => {
        const parolaA = a.parola.toLowerCase();
        const parolaB = b.parola.toLowerCase();
        return parolaA.localeCompare(parolaB);
    });

    sortedConcetti.forEach(concetto => {
        const deleteButton = currentUserRole === 'admin' 
            ? `<button class="delete-btn" onclick="deleteConcetto('${concetto.id}')">Elimina</button>` 
            : '';

        const checkboxHtml = currentUserRole === 'admin'
            ? `<input type="checkbox" class="select-item-concetti" value="${concetto.id}" onchange="updateDeleteButtonState('concetti')">`
            : '';

        const analysisBadge = hasComparativeAnalysis(concetto.parola) ? 
            '<span class="analysis-indicator" title="Analisi comparativa disponibile">📊</span>' : '';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">${checkboxHtml}</td>
            <td>${concetto.id}</td>
            <td>${concetto.parola} ${analysisBadge}</td>
            <td>${concetto.autore_riferimento || 'N/A'}</td>
            <td>${concetto.periodo_storico || 'N/A'}</td>
            <td class="admin-item-actions">
                <button class="edit-btn" onclick="editConcetto('${concetto.id}')">Modifica</button>
                ${deleteButton}
            </td>
        `;
        tbody.appendChild(row);
    });
    updateDeleteButtonState('concetti');
}

function editConcetto(id) {
    const concetto = appData.concetti.find(c => c.id == id);
    if (!concetto) return;
    
    document.getElementById('concetto-id').value = concetto.id;
    document.getElementById('concetto-parola').value = concetto.parola || '';
    document.getElementById('concetto-definizione').value = concetto.definizione || '';
    document.getElementById('concetto-citazione').value = concetto.esempio_citazione || '';
    document.getElementById('concetto-autore').value = concetto.autore_riferimento || '';
    document.getElementById('concetto-opera').value = concetto.opera_riferimento || '';
    document.getElementById('concetto-periodo').value = concetto.periodo_storico || '';
    document.getElementById('concetto-evoluzione').value = concetto.evoluzione || '';
    
    // Campi inglesi
    if(document.getElementById('concetto-parola-en'))
        document.getElementById('concetto-parola-en').value = concetto.parola_en || '';
    if(document.getElementById('concetto-definizione-en'))
        document.getElementById('concetto-definizione-en').value = concetto.definizione_en || '';
    
    showAdminTab('concetti-admin');
}

async function saveConcetto(event) {
    event.preventDefault(); // Blocca il ricaricamento della pagina

    // Helper per leggere valori velocemente
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    try {
        const id = getVal('concetto-id'); // Se c'è un ID, è una modifica

        // 1. RECUPERO DATI RELAZIONALI (La parte più importante)
        // Dobbiamo prendere sia l'ID (per il link) che il NOME (per mostrarlo)
        
        // Autore
        const selAutore = document.getElementById('concetto-autore');
        const autoreId = selAutore ? selAutore.value : '';
        let autoreNome = '';
        if (selAutore && selAutore.selectedIndex >= 0) {
            autoreNome = selAutore.options[selAutore.selectedIndex].text;
            if (autoreNome === 'Seleziona un filosofo...') autoreNome = '';
        }

        // Opera
        const selOpera = document.getElementById('concetto-opera');
        const operaId = selOpera ? selOpera.value : '';
        let operaTitolo = '';
        if (selOpera && selOpera.selectedIndex >= 0) {
            operaTitolo = selOpera.options[selOpera.selectedIndex].text;
            if (operaTitolo.startsWith('Seleziona')) operaTitolo = '';
        }

        // Validazione
        if (!getVal('concetto-parola')) {
            showToast("La parola chiave è obbligatoria", "error");
            return;
        }

        // 2. COSTRUZIONE OGGETTO DATI
        const concettoData = {
            parola: getVal('concetto-parola'),
            parola_en: getVal('concetto-parola-en'), // Campo nuovo
            
            definizione: getVal('concetto-definizione'),
            definizione_en: getVal('concetto-definizione-en'), // Campo nuovo
            
            citazione: getVal('concetto-citazione') || getVal('concetto-esempio'), // Supporta entrambi gli ID vecchi/nuovi
            
            // Relazioni Forti (ID per il codice)
            autore_riferimento_id: autoreId,
            opera_riferimento_id: operaId,
            
            // Relazioni Deboli (Nomi per la lettura umana nelle liste)
            autore_riferimento_nome: autoreNome,
            opera_riferimento_titolo: operaTitolo,
            
            periodo_storico: getVal('concetto-periodo'),
            evoluzione_storica: getVal('concetto-evoluzione'),
            
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        // 3. SALVATAGGIO (Metodo diretto e sicuro)
        const database = window.db || db; 

        if (id && id.trim() !== '') {
            // MODIFICA
            await database.collection('concetti').doc(id).update(concettoData);
            showToast('Concetto aggiornato con successo', 'success');
        } else {
            // NUOVO
            await database.collection('concetti').add(concettoData);
            showToast('Nuovo concetto salvato!', 'success');
        }

        // 4. PULIZIA E AGGIORNAMENTO UI
        const form = document.getElementById('concetto-form');
        if (form) form.reset();
        document.getElementById('concetto-id').value = '';

        // Chiudi modale (se la funzione esiste)
        if (typeof closeModal === 'function') closeModal('add-concetto-modal');

        // Ricarica la lista (prova tutte le varianti possibili del tuo codice)
        if (typeof loadConcettiList === 'function') loadConcettiList();
        else if (typeof loadAdminConcetti === 'function') loadAdminConcetti();
        else if (typeof loadConcetti === 'function') loadConcetti();

    } catch (error) {
        console.error("Errore salvataggio concetto:", error);
        showToast("Errore: " + error.message, "error");
    }
}

function resetConcettoForm() {
    document.getElementById('concetto-form').reset();
    document.getElementById('concetto-id').value = '';
}

async function deleteConcetto(id) {
    if (currentUserRole !== 'admin') {
        showToast('Non hai i permessi per eliminare', 'error');
        return;
    }

    if (!confirm('Sei sicuro di voler eliminare questo concetto?')) return;
    
    try {
        if (navigator.onLine) {
            await deleteFirebaseData('concetti', id);
        } else {
            const concetto = appData.concetti.find(c => c.id == id);
            if (concetto) {
                await addToSyncQueue('DELETE', 'concetti', concetto, id);
            }
        }
        
        appData.concetti = appData.concetti.filter(c => c.id != id);
        
        saveLocalData();
        loadAdminConcetti();
        loadConcetti();
        updateDashboardStats();
        
        showToast('Concetto eliminato con successo', 'success');
        logActivity('Concetto eliminato');
    } catch (error) {
        showToast('Errore nell\'eliminazione del concetto', 'error');
    }
}

// ============================================
// GESTIONE ELIMINAZIONE MULTIPLA
// ============================================

function toggleSelectAll(type, source) {
    const checkboxes = document.querySelectorAll(`.select-item-${type}`);
    checkboxes.forEach(cb => {
        cb.checked = source.checked;
    });
    updateDeleteButtonState(type);
}

function updateDeleteButtonState(type) {
    const checkboxes = document.querySelectorAll(`.select-item-${type}:checked`);
    const btn = document.getElementById(`btn-delete-sel-${type}`);
    
    if (btn) {
        const count = checkboxes.length;
        
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

async function deleteSelectedItems(type) {
    if (currentUserRole !== 'admin') {
        showToast('ERRORE: Solo l\'Amministratore può eliminare elementi.', 'error');
        return;
    }

    const checkboxes = document.querySelectorAll(`.select-item-${type}:checked`);
    const idsToDelete = Array.from(checkboxes).map(cb => cb.value);

    if (idsToDelete.length === 0) return;

    if (!confirm(`ATTENZIONE: Stai per eliminare ${idsToDelete.length} elementi.\nQuesta azione è irreversibile.\nProcedere?`)) {
        return;
    }

    showToast(`Eliminazione di ${idsToDelete.length} elementi in corso...`, 'info');
    
    const btn = document.getElementById(`btn-delete-sel-${type}`);
    if(btn) btn.disabled = true;

    let successCount = 0;
    let failCount = 0;

    for (const id of idsToDelete) {
        try {
            if (navigator.onLine) {
                await deleteFirebaseData(type, id);
            } else {
                let item;
                if (type === 'filosofi') item = appData.filosofi.find(f => f.id == id);
                else if (type === 'opere') item = appData.opere.find(o => o.id == id);
                else if (type === 'concetti') item = appData.concetti.find(c => c.id == id);

                if (item) {
                    await addToSyncQueue('DELETE', type, item, id);
                }
            }

            if (type === 'filosofi') appData.filosofi = appData.filosofi.filter(f => f.id != id);
            else if (type === 'opere') appData.opere = appData.opere.filter(o => o.id != id);
            else if (type === 'concetti') appData.concetti = appData.concetti.filter(c => c.id != id);

            successCount++;
        } catch (error) {
            console.error(`Errore eliminazione ID ${id}:`, error);
            failCount++;
        }
    }

    saveLocalData();
    
    if (type === 'filosofi') {
        loadAdminFilosofi();
        loadFilosofi();
    } else if (type === 'opere') {
        loadAdminOpere();
        loadOpere();
    } else if (type === 'concetti') {
        loadAdminConcetti();
        loadConcetti();
    }
    
    if (typeof updateDashboardStats === 'function') {
        updateDashboardStats();
    }

    const selectAllCb = document.querySelector(`input[onchange="toggleSelectAll('${type}', this)"]`);
    if(selectAllCb) selectAllCb.checked = false;

    if (failCount === 0) {
        showToast(`${successCount} elementi eliminati correttamente.`, 'success');
    } else {
        showToast(`Eliminati: ${successCount}. Falliti: ${failCount}.`, 'warning');
    }
}
// ============================================
// IMPORT/EXPORT FUNCTIONS - INTEGRATE CON EXCELWORKER
// ============================================

function exportDataToExcel(type) {
    if (currentUserRole !== 'admin') {
        showToast('Funzione riservata agli amministratori', 'error');
        return;
    }

    try {
        // Usa ExcelWorker se disponibile
        if (typeof ExcelWorker !== 'undefined' && ExcelWorker.exportDataToExcel) {
            ExcelWorker.exportDataToExcel(type, appData[type]);
        } else {
            // Fallback alla vecchia implementazione
            let data, filename, sheetName;
            let excelData = [];

            switch(type) {
                case 'filosofi':
                    data = appData.filosofi;
                    filename = 'filosofi_export.xlsx';
                    sheetName = 'Filosofi';
                    excelData = data.map(item => ({
                        'ID': item.id,
                        'Nome': item.nome || '',
                        'Nome_EN': item.nome_en || '',
                        'Scuola': item.scuola || '',
                        'Periodo': item.periodo || '',
                        'Anni_Vita': item.anni_vita || '',
                        'Luogo_Nascita': item.luogo_nascita || '',
                        'Biografia': item.biografia || '',
                        'Biografia_EN': item.biografia_en || '',
                        'Coordinate_Lat': item.coordinate ? item.coordinate.lat : '',
                        'Coordinate_Lng': item.coordinate ? item.coordinate.lng : '',
                        'Ritratto_URL': item.ritratto || ''
                    }));
                    break;

                case 'opere':
                    data = appData.opere;
                    filename = 'opere_export.xlsx';
                    sheetName = 'Opere';
                    excelData = data.map(item => ({
                        'ID': item.id,
                        'Titolo': item.titolo || '',
                        'Titolo_EN': item.titolo_en || '',
                        'Autore_ID': item.autore_id || '',
                        'Autore_Nome': item.autore_nome || '',
                        'Anno': item.anno || '',
                        'Periodo': item.periodo || '',
                        'Lingua': item.lingua || '',
                        'Sintesi': item.sintesi || '',
                        'Sintesi_EN': item.sintesi_en || '',
                        'PDF_URL': item.pdf_url || '',
                        'Immagine_URL': item.immagine || '',
                        'Concetti': item.concetti ? item.concetti.join('; ') : ''
                    }));
                    break;

                case 'concetti':
                    data = appData.concetti;
                    filename = 'concetti_export.xlsx';
                    sheetName = 'Concetti';
                    excelData = data.map(item => ({
                        'ID': item.id,
                        'Parola': item.parola || '',
                        'Parola_EN': item.parola_en || '',
                        'Definizione': item.definizione || '',
                        'Definizione_EN': item.definizione_en || '',
                        'Esempio_Citazione': item.esempio_citazione || '',
                        'Autore_Riferimento': item.autore_riferimento || '',
                        'Opera_Riferimento': item.opera_riferimento || '',
                        'Periodo_Storico': item.periodo_storico || '',
                        'Evoluzione': item.evoluzione || ''
                    }));
                    break;
            }

            const ws = XLSX.utils.json_to_sheet(excelData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sheetName);

            XLSX.writeFile(wb, filename);
        }

        showToast(`Dati ${type} esportati in Excel con successo`, 'success');
        logActivity(`Dati ${type} esportati in Excel`);
    } catch (error) {
        console.error(error);
        showToast('Errore nell\'esportazione Excel', 'error');
    }
}

function handleFileImport(type, files) {
    if (currentUserRole !== 'admin') {
        showToast('Funzione riservata agli amministratori', 'error');
        return;
    }

    if (files.length === 0) return;

    const file = files[0];
    
    // Usa ExcelWorker se disponibile
    if (typeof ExcelWorker !== 'undefined' && ExcelWorker.handleFileImport) {
        ExcelWorker.handleFileImport(type, file, appData)
            .then(result => {
                if (result.success) {
                    // Aggiorna i dati locali
                    if (result.data.filosofi) appData.filosofi = result.data.filosofi;
                    if (result.data.opere) appData.opere = result.data.opere;
                    if (result.data.concetti) appData.concetti = result.data.concetti;
                    
                    saveLocalData();
                    loadAdminFilosofi();
                    loadAdminOpere();
                    loadAdminConcetti();
                    updateDashboardStats();
                    
                    showToast(`${result.importedCount} elementi importati con successo`, 'success');
                    logActivity('Dati importati da Excel via ExcelWorker');
                } else {
                    showToast('Errore nell\'importazione: ' + result.error, 'error');
                }
            })
            .catch(error => {
                console.error('Errore import ExcelWorker:', error);
                showToast('Errore nell\'importazione Excel', 'error');
            });
    } else {
        // Fallback alla vecchia implementazione
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                if (type === 'all') {
                    let importedCount = 0;

                    if (workbook.SheetNames.includes('Filosofi')) {
                        const filosofiSheet = workbook.Sheets['Filosofi'];
                        const filosofiData = XLSX.utils.sheet_to_json(filosofiSheet);
                        importedCount += importFilosofi(filosofiData);
                    }

                    if (workbook.SheetNames.includes('Opere')) {
                        const opereSheet = workbook.Sheets['Opere'];
                        const opereData = XLSX.utils.sheet_to_json(opereSheet);
                        importedCount += importOpere(opereData);
                    }

                    if (workbook.SheetNames.includes('Concetti')) {
                        const concettiSheet = workbook.Sheets['Concetti'];
                        const concettiData = XLSX.utils.sheet_to_json(concettiSheet);
                        importedCount += importConcetti(concettiData);
                    }

                    if (importedCount > 0) {
                        saveLocalData();
                        loadAdminFilosofi();
                        loadAdminOpere();
                        loadAdminConcetti();
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
                        case 'filosofi':
                            importFilosofi(jsonData);
                            break;
                        case 'opere':
                            importOpere(jsonData);
                            break;
                        case 'concetti':
                            importConcetti(jsonData);
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
}

function downloadTemplate(type) {
    if (currentUserRole !== 'admin') {
        showToast('Funzione riservata agli amministratori', 'error');
        return;
    }

    // Usa ExcelWorker se disponibile
    if (typeof ExcelWorker !== 'undefined' && ExcelWorker.downloadTemplate) {
        ExcelWorker.downloadTemplate(type);
    } else {
        // Fallback alla vecchia implementazione
        let columns = [];
        let filename = '';
        let sheetName = '';

        switch (type) {
            case 'filosofi':
                columns = [
                    'Nome', 'Nome_EN', 
                    'Scuola', 
                    'Periodo', 
                    'Anni_Vita', 
                    'Luogo_Nascita',
                    'Biografia', 'Biografia_EN',
                    'Coordinate_Lat', 'Coordinate_Lng',
                    'Ritratto_URL'
                ];
                filename = 'template_filosofi.xlsx';
                sheetName = 'Filosofi';
                break;
                
            case 'opere':
                columns = [
                    'Titolo', 'Titolo_EN',
                    'Autore_ID', 'Autore_Nome',
                    'Anno', 
                    'Periodo', 
                    'Lingua',
                    'Sintesi', 'Sintesi_EN',
                    'PDF_URL',
                    'Immagine_URL',
                    'Concetti'
                ];
                filename = 'template_opere.xlsx';
                sheetName = 'Opere';
                break;
                
            case 'concetti':
                columns = [
                    'Parola', 'Parola_EN',
                    'Definizione', 'Definizione_EN',
                    'Esempio_Citazione', 
                    'Autore_Riferimento', 
                    'Opera_Riferimento',
                    'Periodo_Storico',
                    'Evoluzione'
                ];
                filename = 'template_concetti.xlsx';
                sheetName = 'Concetti';
                break;
        }

        const ws = XLSX.utils.aoa_to_sheet([columns]);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, filename);
    }

    showToast(`Template ${type} scaricato con successo`, 'success');
}

// Funzioni di import legacy (mantenute per compatibilità)
function importFilosofi(data) {
    const newFilosofi = data.map((item) => ({
        nome: item.Nome || item.nome || '',
        nome_en: item.Nome_EN || item.nome_en || '',
        scuola: item.Scuola || item.scuola || '',
        periodo: item.Periodo || item.periodo || 'classico',
        anni_vita: item.Anni_Vita || item.anni_vita || '',
        luogo_nascita: item.Luogo_Nascita || item.luogo_nascita || '',
        biografia: item.Biografia || item.biografia || '',
        biografia_en: item.Biografia_EN || item.biografia_en || '',
        ritratto: item.Ritratto_URL || item.ritratto_url || '',
        coordinate: (item.Coordinate_Lat && item.Coordinate_Lng) ? {
            lat: parseFloat(item.Coordinate_Lat),
            lng: parseFloat(item.Coordinate_Lng)
        } : null,
        last_modified: new Date().toISOString()
    }));

    let importedCount = 0;
    
    newFilosofi.forEach(async (filosofo) => {
        try {
            const id = await saveFirebaseData('filosofi', filosofo);
            appData.filosofi.push({ id, ...filosofo });
            importedCount++;
            
            if (importedCount === newFilosofi.length) {
                saveLocalData();
                loadAdminFilosofi();
                showToast(`${importedCount} filosofi importati con successo!`, 'success');
            }
        } catch (error) {
            console.error('Errore import filosofo:', error);
        }
    });

    return newFilosofi.length;
}

function importOpere(data) {
    const newOpere = data.map((item) => ({
        titolo: item.Titolo || item.titolo || '',
        titolo_en: item.Titolo_EN || item.titolo_en || '',
        autore_id: item.Autore_ID || item.autore_id || '',
        autore_nome: item.Autore_Nome || item.autore_nome || '',
        anno: item.Anno || item.anno || '',
        periodo: item.Periodo || item.periodo || '',
        lingua: item.Lingua || item.lingua || '',
        sintesi: item.Sintesi || item.sintesi || '',
        sintesi_en: item.Sintesi_EN || item.sintesi_en || '',
        pdf_url: item.PDF_URL || item.pdf_url || '',
        immagine: item.Immagine_URL || item.immagine_url || '',
        concetti: (item.Concetti || '').split(';').map(c => c.trim()).filter(c => c !== ''),
        last_modified: new Date().toISOString()
    }));

    let importedCount = 0;
    
    newOpere.forEach(async (opera) => {
        try {
            const id = await saveFirebaseData('opere', opera);
            appData.opere.push({ id, ...opera });
            importedCount++;
            
            if (importedCount === newOpere.length) {
                saveLocalData();
                loadAdminOpere();
                showToast(`${importedCount} opere importati con successo!`, 'success');
            }
        } catch (error) {
            console.error('Errore import opera:', error);
        }
    });

    return newOpere.length;
}

function importConcetti(data) {
    const newConcetti = data.map((item) => ({
        parola: item.Parola || item.parola || '',
        parola_en: item.Parola_EN || item.parola_en || '',
        definizione: item.Definizione || item.definizione || '',
        definizione_en: item.Definizione_EN || item.definizione_en || '',
        esempio_citazione: item.Esempio_Citazione || item.esempio_citazione || '',
        autore_riferimento: item.Autore_Riferimento || item.autore_riferimento || '',
        opera_riferimento: item.Opera_Riferimento || item.opera_riferimento || '',
        periodo_storico: item.Periodo_Storico || item.periodo_storico || '',
        evoluzione: item.Evoluzione || item.evoluzione || '',
        last_modified: new Date().toISOString()
    }));

    let importedCount = 0;
    
    newConcetti.forEach(async (concetto) => {
        try {
            const id = await saveFirebaseData('concetti', concetto);
            appData.concetti.push({ id, ...concetto });
            importedCount++;
            
            if (importedCount === newConcetti.length) {
                saveLocalData();
                loadAdminConcetti();
                showToast(`${importedCount} concetti importati con successo!`, 'success');
            }
        } catch (error) {
            console.error('Errore import concetto:', error);
        }
    });

    return newConcetti.length;
}

// ============================================
// GESTIONE TASTO INDIETRO ANDROID
// ============================================

function setupBackButtonHandler() {
    window.history.pushState({ page: 'app_root' }, document.title, window.location.href);

    window.addEventListener('popstate', function(event) {
        const actionTaken = handleBackNavigation();

        if (actionTaken) {
            window.history.pushState({ page: 'app_active' }, document.title, window.location.href);
        }
    });
}

function handleBackNavigation() {
    console.log('Tasto indietro premuto - Stato navigazione:', screenHistory);
    
    // 1. Controllo Modali/Overlay
    const adminAuth = document.getElementById('admin-auth');
    if (adminAuth && adminAuth.style.display === 'flex') {
        closeAdminAuth();
        return true;
    }

    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel && adminPanel.style.display === 'flex') {
        closeAdminPanel();
        return true;
    }
    
    const analysisModal = document.getElementById('comparative-analysis-modal');
    if (analysisModal && analysisModal.style.display === 'flex') {
        closeComparativeAnalysis();
        return true;
    }
    
    // 2. Controllo Navigazione Schermate
    const currentScreen = screenHistory[screenHistory.length - 1]; 
    
    if (currentScreen !== 'home-screen') {
        goBack();
        return true;
    } 

    // 3. Gestione Uscita (Doppio Tocco)
    if (backPressTimer) {
        clearTimeout(backPressTimer);
        backPressTimer = null;
        showToast('Uscita dall\'applicazione...', 'info', 1000); 
        return false; 
    } else {
        showToast('Premi di nuovo per uscire', 'warning', EXIT_TOAST_TIMEOUT);
        
        backPressTimer = setTimeout(() => {
            backPressTimer = null;
            const toast = document.getElementById('toast');
            if (toast) toast.classList.remove('show');
        }, EXIT_TOAST_TIMEOUT);
        
        return true;
    }
}

// ============================================
// NUOVE FUNZIONI: MENU E TRADUZIONE AI
// ============================================

function toggleMenuModal() {
    const modal = document.getElementById('top-menu-modal');
    if (!modal.style.display || modal.style.display === 'none') {
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
    }
}

function closeMenuModal(event) {
    if (event.target.id === 'top-menu-modal') {
        document.getElementById('top-menu-modal').style.display = 'none';
    }
}

function openReportScreen() {
    document.getElementById('top-menu-modal').style.display = 'none';
    showScreen('segnalazioni-screen');
}

function goToAdmin() {
    const menu = document.getElementById('top-menu-modal');
    if (menu) menu.style.display = 'none';
    
    if (typeof openAdminPanel === 'function') {
        openAdminPanel(); 
    } else {
        const authModal = document.getElementById('admin-auth');
        if (authModal) authModal.style.display = 'flex';
    }
}

function inviaSegnalazione(event) {
    event.preventDefault();

    // Recupera i valori in modo sicuro
    const tipoEl = document.getElementById('report-type');
    const descEl = document.getElementById('report-desc');
    
    if (!tipoEl || !descEl) {
        console.error("Elementi del modulo non trovati");
        return;
    }

    const tipo = tipoEl.value;
    const descrizione = descEl.value;
    const emailDestinatario = "derolu0@gmail.com"; 
    
    const oggetto = encodeURIComponent("Segnalazione App Lexicon: " + tipo);
    const corpo = encodeURIComponent(
        "Gentile Assistenza Project Work,\n\n" +
        "Vorrei segnalare il seguente problema:\n" +
        "TIPO: " + tipo + "\n" +
        "DESCRIZIONE:\n" + descrizione + "\n\n" +
        "---\nInviato da App Aeterna Lexicon in Motu"
    );
    
    window.location.href = "mailto:" + emailDestinatario + "?subject=" + oggetto + "&body=" + corpo;

    if (typeof showToast === 'function') {
        showToast("Apertura client email...", "success");
    }

    setTimeout(() => {
        if (typeof showScreen === 'function') {
            showScreen('home-screen');
        }
        if (event.target && typeof event.target.reset === 'function') {
            event.target.reset();
        }
    }, 1500);
}

function openCreditsScreen() {
    const menu = document.getElementById('top-menu-modal');
    if (menu) menu.style.display = 'none';
    
    showScreen('credits-screen');
    window.scrollTo(0, 0);
}

// Funzione traduzione automatica AI
async function autoTranslate(sourceId, targetId) {
    const sourceInput = document.getElementById(sourceId);
    const targetInput = document.getElementById(targetId);
    
    if (!sourceInput || !sourceInput.value.trim()) {
        showToast('Scrivi prima il testo in italiano!', 'warning');
        return;
    }

    const textToTranslate = sourceInput.value.trim();
    
    const originalPlaceholder = targetInput.placeholder;
    targetInput.value = '';
    targetInput.placeholder = 'Traduzione in corso... ⏳';
    targetInput.disabled = true;

    try {
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=it|en`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.responseStatus === 200) {
            targetInput.value = data.responseData.translatedText;
            showToast('Traduzione completata! ✨', 'success');
        } else {
            throw new Error('Errore API');
        }
        
    } catch (error) {
        console.error("Errore traduzione:", error);
        showToast('Errore traduzione. Riprova o scrivi a mano.', 'error');
        targetInput.value = '';
    } finally {
        targetInput.placeholder = originalPlaceholder;
        targetInput.disabled = false;
    }
}

// ============================================
// 1. FUNZIONE CHECK ONLINE
// ============================================
function checkOnlineStatus() {
    const isOnline = navigator.onLine;
    const offlineIndicator = document.getElementById('offline-indicator');
    
    if (offlineIndicator) {
        if (isOnline) {
            offlineIndicator.style.display = 'none';
        } else {
            offlineIndicator.style.display = 'block';
            if (typeof showToast === 'function') {
                showToast('Sei offline. Modalità limitata attiva.', 'warning');
            } else {
                console.warn('Sei offline (showToast non disponibile)');
            }
        }
    }
}

// ============================================
// GESTIONE QR CODE (Versione con Libreria)
// ============================================

function openQRModal() {
    const menu = document.getElementById('top-menu-modal');
    if (menu) menu.style.display = 'none';

    const modal = document.getElementById('qr-modal'); 
    
    if (modal) {
        modal.style.display = 'flex';
        const container = document.getElementById('qrcode-container');
        
        if (container) {
            container.innerHTML = '';
            try {
                new QRCode(container, {
                    text: "https://derolu0.github.io/aeterna/",
                    width: 200,
                    height: 200,
                    colorDark : "#1e3a8a", 
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            } catch (e) {
                console.error("Errore QRCode:", e);
                container.textContent = "Errore caricamento QR. Ricarica la pagina.";
            }
        }
    }
}

function closeQRModal() {
    const modal = document.getElementById('qr-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ============================================
// GESTIONE INSTALLAZIONE PWA
// ============================================
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    showInstallPromotion();
    console.log('✅ Evento "beforeinstallprompt" catturato: App installabile');
});

function showInstallPromotion() {
    const banner = document.getElementById('smart-install-banner');
    if (banner) {
        banner.style.display = 'flex';
    }
    const installBtn = document.getElementById('menu-install-btn');
    if (installBtn) {
        installBtn.style.display = 'block'; 
    }
}

async function installPWA() {
    if (!deferredPrompt) {
        showToast('App già installata o non supportata', 'info');
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    deferredPrompt = null;
    const banner = document.getElementById('smart-install-banner');
    if (banner) banner.style.display = 'none';
}

window.addEventListener('appinstalled', () => {
    console.log('🎉 PWA Installata con successo');
    const banner = document.getElementById('smart-install-banner');
    if (banner) banner.style.display = 'none';
    deferredPrompt = null;
});

// ============================================
// RICONOSCIMENTO DISPOSITIVO E ISTRUZIONI
// ============================================
function detectAndShowInstallInstructions() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) return;

    const userAgent = navigator.userAgent || navigator.vendor || window.opera;

    if (/iPad|iPhone|iPod/.test(userAgent) && !window.MSStream) {
        setTimeout(() => {
            showToast('📱 iPhone: Premi il tasto "Condividi" e poi "Aggiungi alla schermata Home"', 'info');
        }, 2000); 
    } else if (/android/i.test(userAgent)) {
        setTimeout(() => {
            const banner = document.getElementById('smart-install-banner');
            if (!banner || banner.style.display === 'none') {
                showToast('🤖 Android: Premi su "Installa app" o sui tre puntini per aggiungere a Home', 'info');
            }
        }, 3000);
    }
}

// ==========================================
// FUNZIONI PER POPOLARE I MENU A TENDINA E FORM
// ==========================================

function updateAllSelects() {
    console.log("🔄 Aggiornamento menu a tendina...");

    // 1. POPOLA SELECT AUTORI (Opere e Concetti)
    const authorSelects = ['opera-autore', 'concetto-autore'];
    
    authorSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentVal = select.value;
        select.innerHTML = '<option value="">Seleziona un filosofo...</option>';
        
        if (!appData.filosofi || appData.filosofi.length === 0) return;
        
        const sortedFilosofi = [...appData.filosofi].sort((a, b) => 
            (a.nome || '').localeCompare(b.nome || '')
        );
        
        sortedFilosofi.forEach(f => {
            if (f.nome) { 
                const option = document.createElement('option');
                option.value = f.id; 
                option.textContent = f.nome;
                select.appendChild(option);
            }
        });
        
        if (currentVal) select.value = currentVal;
    });

    // 2. POPOLA SELECT OPERE (Solo per Concetti)
    const workSelect = document.getElementById('concetto-opera');
    if (workSelect) {
        const currentVal = workSelect.value;
        workSelect.innerHTML = '<option value="">Seleziona un\'opera (opzionale)...</option>';
        
        if (!appData.opere || appData.opere.length === 0) return;
        
        const sortedOpere = [...appData.opere].sort((a, b) => 
            (a.titolo || '').localeCompare(b.titolo || '')
        );
        
        sortedOpere.forEach(o => {
            if (o.titolo) {
                const option = document.createElement('option');
                option.value = o.id;
                option.textContent = `${o.titolo} ${o.autore_nome ? '(' + o.autore_nome + ')' : ''}`;
                workSelect.appendChild(option);
            }
        });
        
        if (currentVal) workSelect.value = currentVal;
    }
}

// Funzione per popolare la Select dei Filosofi (usata in Opere e Concetti)
async function popolaSelectFilosofi(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    const currentVal = select.value;
    select.innerHTML = '<option value="">Caricamento...</option>';
    
    try {
        const database = window.db || db; 
        const snapshot = await database.collection('filosofi').orderBy('nome').get();
        
        select.innerHTML = '<option value="">Seleziona un filosofo...</option>';
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const option = document.createElement('option');
            option.value = doc.id; 
            option.textContent = data.nome;
            select.appendChild(option);
        });

        if (currentVal) select.value = currentVal;
        
    } catch (error) {
        console.error("Errore caricamento filosofi:", error);
        select.innerHTML = '<option value="">Errore caricamento</option>';
    }
}

// Funzione per preparare il Form CONCETTI (Cascata Autore -> Opera)
async function prepareConcettoForm() {
    await popolaSelectFilosofi('concetto-autore');
    
    const selAutore = document.getElementById('concetto-autore');
    const selOpera = document.getElementById('concetto-opera');
    
    if (!selAutore || !selOpera) return;

    selAutore.onchange = async function() {
        const autoreId = this.value;
        selOpera.innerHTML = '<option value="">Caricamento...</option>';
        selOpera.disabled = true;

        if (!autoreId) {
            selOpera.innerHTML = '<option value="">Prima seleziona un filosofo</option>';
            return;
        }

        try {
            const database = window.db || db;
            const snapshot = await database.collection('opere')
                                     .where('autore_id', '==', autoreId)
                                     .get();
            
            selOpera.innerHTML = '<option value="">Seleziona un\'opera...</option>';
            
            if (snapshot.empty) {
                 selOpera.innerHTML += '<option value="">Nessuna opera trovata per questo autore</option>';
            } else {
                snapshot.forEach(doc => {
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = doc.data().titolo;
                    selOpera.appendChild(option);
                });
            }
            selOpera.disabled = false;
        } catch (e) {
            console.error(e);
            selOpera.innerHTML = '<option value="">Errore caricamento opere</option>';
        }
    };
}

window.initFormOpere = function() {
    popolaSelectFilosofi('opera-autore');
}

window.initFormConcetti = function() {
    prepareConcettoForm();
}

// ============================================================
// AUTOMAZIONE APERTURA MODALI
// ============================================================
const originalOpenModal = window.openModal || function(){};

window.openModal = function(modalId) {
    if (typeof originalOpenModal === 'function') {
        originalOpenModal(modalId);
    } else {
        const modal = document.getElementById(modalId);
        if (modal) modal.style.display = 'flex';
    }

    if (modalId === 'add-opera-modal') {
        if (typeof popolaSelectFilosofi === 'function') {
            popolaSelectFilosofi('opera-autore');
        }
    }

    if (modalId === 'add-concetto-modal') {
        if (typeof prepareConcettoForm === 'function') {
            prepareConcettoForm();
        }
    }
};

// ============================================
// INIZIALIZZAZIONE AUTOMATICA FORM ADMIN
// ============================================

function initAdminForms() {
    console.log("🎯 Inizializzazione form admin...");
    updateAllSelects();
    
    const concettoAutoreSelect = document.getElementById('concetto-autore');
    const concettoOperaSelect = document.getElementById('concetto-opera');
    
    if (concettoAutoreSelect && concettoOperaSelect) {
        concettoAutoreSelect.onchange = function() {
            const autoreId = this.value;
            concettoOperaSelect.innerHTML = '<option value="">Caricamento opere...</option>';
            concettoOperaSelect.disabled = true;
            
            if (!autoreId) {
                concettoOperaSelect.innerHTML = '<option value="">Seleziona prima un filosofo</option>';
                return;
            }
            
            const opereAutore = appData.opere.filter(opera => 
                opera.autore_id === autoreId
            );
            
            concettoOperaSelect.innerHTML = '<option value="">Seleziona un\'opera...</option>';
            
            if (opereAutore.length === 0) {
                concettoOperaSelect.innerHTML += '<option value="">Nessuna opera trovata</option>';
            } else {
                opereAutore.forEach(opera => {
                    const option = document.createElement('option');
                    option.value = opera.id;
                    option.textContent = opera.titolo;
                    concettoOperaSelect.appendChild(option);
                });
            }
            
            concettoOperaSelect.disabled = false;
        };
    }
}

// ============================================
// FUNZIONE DI GEOCODING PER FILOSOFI
// ============================================
async function cercaCoordinateFilosofo() {
    const citta = document.getElementById('filosofo-luogo').value;
    const nome = document.getElementById('filosofo-nome').value;
    
    if (!citta || !nome) {
        showToast('Inserisci almeno il luogo di nascita e il nome', 'warning');
        return;
    }
    
    try {
        showToast('Ricerca coordinate in corso...', 'info');
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(citta)}&format=json&limit=1`
        );
        const data = await response.json();
        
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            document.getElementById('filosofo-lat').value = lat.toFixed(6);
            document.getElementById('filosofo-lng').value = lng.toFixed(6);
            showToast(`Coordinate trovate per ${citta}`, 'success');
        } else {
            showToast('Luogo non trovato, usa coordinate manuali', 'error');
        }
    } catch (error) {
        console.error('Errore geocoding:', error);
        showToast('Errore nella ricerca coordinate', 'error');
    }
}

// ==========================================
// INIZIALIZZAZIONE FINALE & LISTENER UNIFICATI (CORRETTO)
// ==========================================
document.addEventListener('DOMContentLoaded', async function() {
    console.log("🚀 Avvio Aeterna Lexicon...");

    // 1. Setup Base UI
    try {
        if (typeof loadLocalData === 'function') loadLocalData();
        if (typeof applyTranslations === 'function') applyTranslations();
        if (typeof updateLangButton === 'function') updateLangButton();
        if (typeof showScreen === 'function') showScreen('home-screen'); // Mostra subito la home
        
        // Nascondi preventivamente admin e modali
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) adminPanel.style.display = 'none';
        
        if (typeof setupBackButtonHandler === 'function') setupBackButtonHandler();
        if (typeof checkOnlineStatus === 'function') checkOnlineStatus();
        if (typeof detectAndShowInstallInstructions === 'function') detectAndShowInstallInstructions();
    } catch (e) { console.warn("Errore init UI:", e); }

    // 2. Splash Screen
    const splash = document.getElementById('splash-screen');
    const progressBar = document.querySelector('.splash-progress-bar');
    if (progressBar) {
        progressBar.style.transition = 'width 1.5s ease-in-out';
        progressBar.style.width = '100%';
    }
    if (splash) {
        setTimeout(() => {
            splash.style.transition = 'opacity 0.5s ease';
            splash.style.opacity = '0'; 
            setTimeout(() => { splash.style.display = 'none'; }, 500);
        }, 1500);
    }

    // 3. Inizializzazione Remota e Caricamento Dati
    setTimeout(async () => {
        if (typeof initRemoteControl === 'function') initRemoteControl();
        if (typeof registerServiceWorker === 'function') registerServiceWorker();

        // Attendiamo che Firebase sia pronto (se usiamo window.firebaseReady promise è meglio, ma manteniamo la tua logica)
        if (window.firebaseInitialized || window.db) {
            try {
                console.log("📥 Inizio download dati...");
                
                // Sequenza corretta: Filosofi -> Altro
                if (typeof loadFirebaseData === 'function') {
                    await loadFirebaseData('filosofi');
                    await Promise.all([
                        loadFirebaseData('opere'),
                        loadFirebaseData('concetti')
                    ]);
                }
                
                console.log("✅ Dati scaricati. Aggiornamento UI...");

                // Aggiorna UI che dipende dai dati
                if (typeof updateAllSelects === 'function') updateAllSelects(); 
                if (typeof populateAdminDropdowns === 'function') populateAdminDropdowns(); // Per le nuove relazioni
                
                if (typeof initMap === 'function') initMap();
                if (typeof loadMapMarkers === 'function') loadMapMarkers();

                if (typeof loadFilosofi === 'function') loadFilosofi();
                if (typeof loadOpere === 'function') loadOpere();
                if (typeof loadConcetti === 'function') loadConcetti();
                
                // === FIX ROUTING: FORZA HOME SE NON CI SONO PARAMETRI ===
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('filosofo') || urlParams.has('concept')) {
                    if (typeof handleUrlParameters === 'function') handleUrlParameters();
                } else {
                    // NESSUN PARAMETRO: Assicuriamoci di essere sulla HOME
                    console.log("🏠 Routing: Home Screen forzata");
                    if (typeof showScreen === 'function') showScreen('home-screen');
                    // Nascondi pannello admin per sicurezza
                    if(document.getElementById('admin-panel')) {
                        document.getElementById('admin-panel').style.display = 'none';
                    }
                }

            } catch (error) {
                console.warn("⚠️ Errore caricamento dati remoti:", error);
            }
        }
    }, 100);

    // 4. Attach Event Listeners ai Form
    const fForm = document.getElementById('filosofo-form');
    if(fForm && typeof saveFilosofo === 'function') fForm.onsubmit = saveFilosofo;
    
    const oForm = document.getElementById('opera-form');
    if(oForm && typeof saveOpera === 'function') oForm.onsubmit = saveOpera;
    
    const cForm = document.getElementById('concetto-form');
    if(cForm && typeof saveConcetto === 'function') cForm.onsubmit = saveConcetto;

    const geoBtn = document.getElementById('geocoding-btn');
    if(geoBtn && typeof cercaCoordinateFilosofo === 'function') geoBtn.onclick = cercaCoordinateFilosofo;

    // 5. Fix Mappa (Resize)
    const navMap = document.getElementById('nav-map');
    if (navMap) {
        navMap.addEventListener('click', function() {
            setTimeout(() => {
                if (window.map) window.map.invalidateSize();
            }, 200);
        });
    }
    
    // 6. Init Excel Worker
    if (typeof ExcelWorker !== 'undefined') {
        console.log('✅ ExcelWorker pronto');
    }
});

// Esposizione globale funzioni utili
window.openComparativeAnalysis = openComparativeAnalysis;
window.closeComparativeAnalysis = closeComparativeAnalysis;
window.exportAnalysisToExcel = exportAnalysisToExcel;
window.shareAnalysis = shareAnalysis;
window.hasComparativeAnalysis = hasComparativeAnalysis;
function performMapSearch() {
    const input = document.getElementById('map-search-input');
    if (input && input.value.trim() !== '') {
        const query = input.value.toLowerCase();
        // Cerca nel dataset locale
        const filosofo = appData.filosofi.find(f => 
            f.nome.toLowerCase().includes(query)
        );
        
        if (filosofo) {
            goToMap(filosofo.id);
            // Nascondi i suggerimenti
            const results = document.getElementById('map-search-results');
            if(results) results.style.display = 'none';
        } else {
            showToast(`Nessun filosofo trovato per "${input.value}"`, 'warning');
        }
    }
}
// Fallback per sync
if (typeof addToSyncQueue === 'undefined') {
    window.addToSyncQueue = async function(op, type, data, id) {
        console.warn("Sincronizzazione offline non completa, salvataggio solo locale.");
        return true;
    };
}
// Funzione per aprire la modale "Smart" con i pulsanti richiesti
function openSmartModal(type, id) {
    // Usa la modale esistente se c'è, o creane una se necessario
    // Assumiamo che esista un elemento modale generico o detail-screen
    // Qui simuliamo il comportamento "Scheda Concetto" usando una modale custom
    
    let modal = document.getElementById('detail-modal');
    if (!modal) {
        // Se non esiste la crea al volo (fallback)
        modal = document.createElement('div');
        modal.id = 'detail-modal';
        modal.className = 'modal-overlay'; // Usa le tue classi CSS esistenti
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal" onclick="document.getElementById('detail-modal').style.display='none'">&times;</span>
                <h2 id="smart-modal-title"></h2>
                <div id="smart-modal-body" class="modal-body-scroll"></div>
            </div>`;
        document.body.appendChild(modal);
    }

    const data = appData[type].find(i => i.id === id);
    if (!data) return;

    const title = document.getElementById('smart-modal-title') || modal.querySelector('h2');
    const body = document.getElementById('smart-modal-body') || modal.querySelector('.modal-body-scroll');
    
    title.innerText = data.nome || data.titolo || data.parola;

    // --- LAYOUT SPECIFICO PER FILOSOFI ---
    if (type === 'filosofi') {
        const lat = data.lat || (data.coordinate ? data.coordinate.lat : null);
        const lng = data.lng || (data.coordinate ? data.coordinate.lng : null);
        const hasCoords = lat && lng;

        body.innerHTML = `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:15px; background:#f9f9f9; padding:10px; border-radius:8px;">
                <div><strong>Periodo:</strong><br>${data.periodo || '-'}</div>
                <div><strong>Scuola:</strong><br>${data.scuola || '-'}</div>
                <div><strong>Anni:</strong><br>${data.anni_vita || '-'}</div>
                <div><strong>Luogo:</strong><br>${data.luogo_nascita || '-'}</div>
            </div>
            
            <div style="margin-bottom:20px;">
                <h4>Biografia</h4>
                <p style="line-height:1.6">${data.biografia || 'Nessuna biografia disponibile.'}</p>
            </div>

            <div style="display:flex; gap:10px; justify-content:center; margin-top:20px; border-top:1px solid #eee; padding-top:15px;">
                ${hasCoords ? 
                    `<button class="btn-primary" onclick="goToMap('${data.id}'); document.getElementById('detail-modal').style.display='none'">
                        <i class="fas fa-map-marked-alt"></i> Naviga
                    </button>` : 
                    `<button class="btn-secondary" disabled style="opacity:0.5"><i class="fas fa-map-slash"></i> No Mappa</button>`
                }
                
                <button class="btn-warning" style="background:#f59e0b; color:white; border:none; padding:10px 15px; border-radius:5px;" 
                    onclick="window.location.href='mailto:admin@aeterna.com?subject=Segnalazione ${data.nome}'">
                    <i class="fas fa-flag"></i> Segnalazione
                </button>
            </div>
        `;
    }
    
    modal.style.display = 'flex';
}