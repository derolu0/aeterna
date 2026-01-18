// ==========================================
// AETERNA LEXICON IN MOTU - FILOSOFIA DATASET
// Sostituisce app.js originale mantenendo accessi Firebase esistenti
// ==========================================

let activityChartInstance = null;
let currentLanguage = localStorage.getItem('app_language') || 'it';
let currentDetailId = null;
let currentDetailType = null;

// Firebase Collections (MODIFICATE per Filosofia)
const COLLECTIONS = {
    FILOSOFI: 'filosofi',      // ex-FONTANE
    OPERE: 'opere',           // ex-BEVERINI
    CONCETTI: 'concetti'      // ex-NEWS
};

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
    setText('home-title', t.home_title);
    
    const subtitleEl = document.getElementById('home-subtitle');
    if (subtitleEl) {
        subtitleEl.innerHTML = t.home_subtitle; 
    }

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

// Avvio automatico delle traduzioni
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    updateLangButton();
});

// ==========================================
// SISTEMA CONTROLLO REMOTO (MANUTENZIONE & PRIVACY)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    initRemoteControl();
});

function initRemoteControl() {
    if (!window.db || !window.onSnapshot) {
        setTimeout(initRemoteControl, 500);
        return;
    }

    const configRef = window.doc(window.db, "config", "general_settings");
    
    window.onSnapshot(configRef, (docSnap) => {
        if (docSnap.exists()) {
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

            // 2. GESTIONE PRIVACY (KILL SWITCH)
            const isTrackingAllowed = data.analyticsEnabled !== false; 
            
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

// Funzioni di validazione per Filosofia
function validateFilosofoData(data) {
    const errors = [];
    
    if (!data.nome || data.nome.trim().length < 2) {
        errors.push(new ValidationError('Nome filosofo richiesto (min 2 caratteri)', 'filosofo-nome', data.nome));
    }
    
    if (!data.scuola || data.scuola.trim().length < 3) {
        errors.push(new ValidationError('Scuola di pensiero richiesta', 'filosofo-scuola', data.scuola));
    }
    
    if (!data.periodo || !['classico', 'contemporaneo', 'medioevale', 'moderno'].includes(data.periodo)) {
        errors.push(new ValidationError('Periodo non valido', 'filosofo-periodo', data.periodo));
    }
    
    return errors;
}

function validateOperaData(data) {
    const errors = [];
    
    if (!data.titolo || data.titolo.trim().length < 2) {
        errors.push(new ValidationError('Titolo opera richiesto', 'opera-titolo', data.titolo));
    }
    
    if (!data.autore_id || data.autore_id.trim().length === 0) {
        errors.push(new ValidationError('Autore richiesto', 'opera-autore', data.autore_id));
    }
    
    if (!data.anno || isNaN(parseInt(data.anno))) {
        errors.push(new ValidationError('Anno non valido', 'opera-anno', data.anno));
    }
    
    return errors;
}

function validateConcettoData(data) {
    const errors = [];
    
    if (!data.parola || data.parola.trim().length < 2) {
        errors.push(new ValidationError('Parola chiave richiesta', 'concetto-parola', data.parola));
    }
    
    if (!data.definizione || data.definizione.trim().length < 10) {
        errors.push(new ValidationError('Definizione troppo breve (min 10 caratteri)', 'concetto-definizione', data.definizione));
    }
    
    return errors;
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
let activityLog = [];
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
    try {
        const { collection, getDocs } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js");
        
        const collectionMap = {
            'filosofi': 'filosofi',
            'opere': 'opere',
            'concetti': 'concetti'
        };
        
        const collectionName = collectionMap[type];
        const dataRef = collection(window.db, collectionName);
        const snapshot = await safeFirebaseOperation(getDocs, `getDocs_${type}`, dataRef);
        
        const data = [];
        snapshot.forEach(doc => {
            const docData = doc.data();
            let itemData = { 
                id: doc.id, 
                last_modified: docData.last_modified || new Date().toISOString()
            };
            
            if (type === 'filosofi') {
                itemData = {
                    ...itemData,
                    nome: docData.nome || '',
                    nome_en: docData.nome_en || '',
                    scuola: docData.scuola || '',
                    periodo: docData.periodo || 'classico',
                    anni_vita: docData.anni_vita || '',
                    luogo_nascita: docData.luogo_nascita || '',
                    biografia: docData.biografia || '',
                    biografia_en: docData.biografia_en || '',
                    ritratto: docData.ritratto || '',
                    opere_principali: docData.opere_principali || [],
                    concetti_principali: docData.concetti_principali || [],
                    coordinate: docData.coordinate || null
                };
            } else if (type === 'opere') {
                itemData = {
                    ...itemData,
                    titolo: docData.titolo || '',
                    titolo_en: docData.titolo_en || '',
                    autore_id: docData.autore_id || '',
                    autore_nome: docData.autore_nome || '',
                    anno: docData.anno || '',
                    periodo: docData.periodo || '',
                    lingua: docData.lingua || '',
                    sintesi: docData.sintesi || '',
                    sintesi_en: docData.sintesi_en || '',
                    pdf_url: docData.pdf_url || '',
                    concetti: docData.concetti || []
                };
            } else if (type === 'concetti') {
                itemData = {
                    ...itemData,
                    parola: docData.parola || '',
                    parola_en: docData.parola_en || '',
                    definizione: docData.definizione || '',
                    definizione_en: docData.definizione_en || '',
                    esempio_citazione: docData.esempio_citazione || '',
                    autore_riferimento: docData.autore_riferimento || '',
                    opera_riferimento: docData.opera_riferimento || '',
                    periodo_storico: docData.periodo_storico || '',
                    evoluzione: docData.evoluzione || ''
                };
            }
            
            data.push(itemData);
        });
        
        checkAndNotifyUpdates(data, type);

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
} // <--- QUESTA PARENTESI MANCAVA! È FONDAMENTALE.

function updateDashboardStats() {
    // Funzione helper per evitare crash se l'elemento non esiste
    const safeSetText = (id, text) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        }
    };
    
    // ... il resto della funzione updateDashboardStats continua qui ...
    
    // Filosofi
    if (appData.filosofi) {
        safeSetText('total-filosofi', appData.filosofi.length);
        safeSetText('filosofi-classici', appData.filosofi.filter(f => f.periodo === 'classico').length);
        safeSetText('filosofi-contemporanei', appData.filosofi.filter(f => f.periodo === 'contemporaneo').length);
        safeSetText('filosofi-medioevali', appData.filosofi.filter(f => f.periodo === 'medioevale').length);
    }
    
    // Opere
    if (appData.opere) {
        safeSetText('total-opere', appData.opere.length);
        safeSetText('opere-classiche', appData.opere.filter(o => o.periodo === 'classico').length);
        safeSetText('opere-contemporanee', appData.opere.filter(o => o.periodo === 'contemporaneo').length);
    }
    
    // Concetti
    if (appData.concetti) {
        safeSetText('total-concetti', appData.concetti.length);
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

// ========================================================
// NUOVA FUNZIONE DI LOGIN SICURA
// ========================================================
async function checkAdminAuth() {
    const emailInput = document.getElementById('admin-email');
    const passInput = document.getElementById('admin-password');
    const errorElement = document.getElementById('auth-error');

    const email = emailInput.value.trim();
    const password = passInput.value;

    try {
        await window.firebaseSignIn(window.auth, email, password);
        
        isAdminAuthenticated = true;
        localStorage.setItem('abc_admin_logged', 'true');
        
        const maintScreen = document.getElementById('maintenance-mode');
        if (maintScreen) maintScreen.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        if (typeof initRemoteControl === 'function') initRemoteControl();

        // 2. CONTROLLO RUOLI
        let isSuperAdmin = false;
        try {
            const docRef = window.doc(window.db, "impostazioni", "ruoli");
            const docSnap = await window.getDoc(docRef);
            
            if (docSnap.exists()) {
                const data = docSnap.data();
                const dbAdmins = (data.super_admins || []).map(e => e.trim().toLowerCase());
                const myEmail = email.toLowerCase();
                
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

    loadAdminFilosofi();
    loadAdminOpere();
    loadAdminConcetti();
    updateDashboardStats();
    
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
async function loadFilosofi() {
    const filosofiList = document.getElementById('filosofi-list');
    if (!filosofiList) return;
    
    showSkeletonLoader(filosofiList);
    
    try {
        await loadFirebaseData('filosofi');
        renderGridItems(filosofiList, getFilteredItems('filosofi'), 'filosofo');
    } catch (error) {
        showToast('Errore nel caricamento filosofi', 'error');
    }
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

    document.querySelectorAll(`#${type}-screen .filter-btn`).forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`#${type}-screen .filter-btn.${filterValue}`).classList.add('active');

    if (type === 'filosofi') {
        renderGridItems(document.getElementById('filosofi-list'), getFilteredItems('filosofi'), 'filosofo');
    } else if (type === 'opere') {
        renderCompactItems(document.getElementById('opere-list'), getFilteredItems('opere'), 'opera');
    } else if (type === 'concetti') {
        renderConcettiItems(document.getElementById('concetti-list'), getFilteredItems('concetti'));
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

// CONTINUA NELLA PARTE 2...
// ============================================
// FUNZIONI DI RENDERING PER FILOSOFIA
// ============================================

function renderGridItems(container, items, type) {
    if (!items || items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fas fa-${type === 'filosofo' ? 'user-graduate' : 'book'}"></i></div>
                <div class="empty-state-text">Nessun elemento trovato</div>
                <div class="empty-state-subtext">Prova a cambiare i filtri di ricerca</div>
            </div>
        `;
        return;
    }
    
    const highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "updated": []}');

    container.innerHTML = '';
    
    items.forEach(item => {
        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item';
        
        gridItem.onclick = () => {
            showDetail(item.id, type);
        };
        
        let badgeHTML = '';
        if (highlights.new.includes(item.id)) badgeHTML = '<span class="badge-new">NUOVO</span>';
        else if (highlights.updated.includes(item.id)) badgeHTML = '<span class="badge-updated">AGGIORNATO</span>';

        const hasCustomImage = item.ritratto && item.ritratto.trim() !== '';
        const defaultImage = type === 'filosofo' ? './images/default-filosofo.jpg' : './images/default-opera.jpg';
        
        // Traduzione periodo
        const getPeriodoLabel = (periodo) => {
            const periodoKey = {
                'classico': 'period_classic',
                'contemporaneo': 'period_contemporary',
                'medioevale': 'period_medieval',
                'moderno': 'period_modern'
            }[periodo] || periodo;
            
            return (translations && translations[currentLanguage]) ? 
                translations[currentLanguage][periodoKey] : periodo;
        };

        // Per filosofi
        if (type === 'filosofo') {
            gridItem.innerHTML = `
                <div class="item-image-container">
                    <img src="${item.ritratto || defaultImage}" 
                         alt="${getLocalizedText(item, 'nome')}" 
                         class="item-image" 
                         onerror="this.style.display='none'; this.parentElement.classList.add('fallback-active'); this.parentElement.innerHTML += '<div class=\\'image-fallback\\'><i class=\\'fas fa-user-graduate\\'></i></div>';">
                </div>
                <div class="item-content">
                    <div class="item-name">${getLocalizedText(item, 'nome')} ${badgeHTML}</div>
                    <div class="item-scuola">${item.scuola}</div>
                    <div class="item-footer">
                        <span class="item-period periodo-${item.periodo}">${getPeriodoLabel(item.periodo)}</span>
                        <span class="image-indicator ${hasCustomImage ? 'image-custom' : 'image-default'}">
                            ${hasCustomImage ? '<i class="fas fa-check"></i>' : '<i class="fas fa-image"></i>'}
                        </span>
                    </div>
                </div>
            `;
        }
        // Per opere (se necessario nella griglia)
        container.appendChild(gridItem);
    });
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
        return (translations && translations[currentLanguage]) ? 
            translations[currentLanguage][periodoKey] : periodo;
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
        container.appendChild(concettoCard);
    });
}

// Detail View per Filosofia
function showDetail(id, type) {
    currentDetailId = id;
    currentDetailType = type;

    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }

    let item, screenId, titleElement, contentElement;
    const isFilosofo = (type === 'filosofo' || type === 'filosofi');

    if (isFilosofo) {
        item = appData.filosofi.find(f => f.id == id);
        screenId = 'filosofo-detail-screen';
        titleElement = document.getElementById('filosofo-detail-title');
        contentElement = document.getElementById('filosofo-detail-content');
    } else if (type === 'opera') {
        item = appData.opere.find(o => o.id == id);
        screenId = 'opera-detail-screen';
        titleElement = document.getElementById('opera-detail-title');
        contentElement = document.getElementById('opera-detail-content');
    } else {
        item = appData.concetti.find(c => c.id == id);
        screenId = 'concetto-detail-screen';
        titleElement = document.getElementById('concetto-detail-title');
        contentElement = document.getElementById('concetto-detail-content');
    }
    
    if (!item) {
        showToast('Elemento non trovato', 'error');
        return;
    }

    const t = (window.translations && window.translations[currentLanguage]) ? window.translations[currentLanguage] : {};
    
    if (t.screen_philosophers) {
        if (isFilosofo) {
            titleElement.textContent = t.screen_philosophers;
        } else if (type === 'opera') {
            titleElement.textContent = t.screen_works;
        } else {
            titleElement.textContent = t.screen_concepts;
        }
    }

    // Helper per periodo
    const getPeriodoLabel = (periodo) => {
        const key = {
            'classico': 'period_classic',
            'contemporaneo': 'period_contemporary',
            'medioevale': 'period_medieval',
            'moderno': 'period_modern'
        }[periodo] || periodo;
        return t[key] || periodo;
    };

    // Genera HTML in base al tipo
    let detailHTML = '';
    const defaultImage = isFilosofo ? './images/default-filosofo.jpg' : './images/default-opera.jpg';
    
    if (isFilosofo) {
        detailHTML = `
            <div class="detail-header-image">
                <img src="${item.ritratto || defaultImage}" class="detail-image" onerror="this.src='${defaultImage}'">
            </div>
            <div class="detail-info">
                <h2 class="detail-name">${getLocalizedText(item, 'nome')}</h2>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-graduation-cap"></i></span>
                    <span class="info-value">${item.scuola}</span>
                </div>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-calendar-alt"></i></span>
                    <span class="info-value">${item.anni_vita}</span>
                </div>
                <div class="info-row">
                    <span class="item-period periodo-${item.periodo}">${getPeriodoLabel(item.periodo)}</span>
                </div>
                ${item.luogo_nascita ? `<div class="info-row">
                    <span class="info-label"><i class="fas fa-map-marker-alt"></i></span>
                    <span class="info-value">${item.luogo_nascita}</span>
                </div>` : ''}
                <div class="detail-description">${getLocalizedText(item, 'biografia') || ''}</div>
                ${item.opere_principali && item.opere_principali.length > 0 ? 
                    `<div class="detail-opere">
                        <h3>${t.label_main_works || 'Opere principali'}</h3>
                        <ul>
                            ${item.opere_principali.map(operaId => {
                                const opera = appData.opere.find(o => o.id === operaId);
                                return opera ? `<li>${getLocalizedText(opera, 'titolo')} (${opera.anno})</li>` : '';
                            }).join('')}
                        </ul>
                    </div>` : ''}
                ${item.concetti_principali && item.concetti_principali.length > 0 ? 
                    `<div class="detail-concetti">
                        <h3>${t.label_main_concepts || 'Concetti principali'}</h3>
                        <div class="concetti-tags">
                            ${item.concetti_principali.map(concetto => 
                                `<span class="concetto-tag">${concetto}</span>`
                            ).join('')}
                        </div>
                    </div>` : ''}
            </div>
        `;
    } else if (type === 'opera') {
        detailHTML = `
            <div class="detail-header-image">
                <img src="${item.immagine || defaultImage}" class="detail-image" onerror="this.src='${defaultImage}'">
            </div>
            <div class="detail-info">
                <h2 class="detail-name">${getLocalizedText(item, 'titolo')}</h2>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-user"></i></span>
                    <span class="info-value">${item.autore_nome}</span>
                </div>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-calendar"></i></span>
                    <span class="info-value">${item.anno}</span>
                </div>
                <div class="info-row">
                    <span class="item-period periodo-${item.periodo}">${getPeriodoLabel(item.periodo)}</span>
                </div>
                ${item.lingua ? `<div class="info-row">
                    <span class="info-label"><i class="fas fa-language"></i></span>
                    <span class="info-value">${item.lingua}</span>
                </div>` : ''}
                <div class="detail-description">${getLocalizedText(item, 'sintesi') || ''}</div>
                ${item.concetti && item.concetti.length > 0 ? 
                    `<div class="detail-concetti">
                        <h3>${t.label_related_concepts || 'Concetti correlati'}</h3>
                        <div class="concetti-tags">
                            ${item.concetti.map(concetto => 
                                `<span class="concetto-tag">${concetto}</span>`
                            ).join('')}
                        </div>
                    </div>` : ''}
                ${item.pdf_url ? `
                <div class="detail-actions">
                    <button class="detail-action-btn primary" onclick="window.open('${item.pdf_url}', '_blank')">
                        <i class="fas fa-file-pdf"></i> ${t.read_pdf || 'Leggi PDF'}
                    </button>
                </div>` : ''}
            </div>
        `;
    } else {
        // Concetto
        detailHTML = `
            <div class="detail-info">
                <h2 class="detail-name">${getLocalizedText(item, 'parola')}</h2>
                <div class="info-row">
                    <span class="info-label"><i class="fas fa-history"></i></span>
                    <span class="info-value">${item.periodo_storico}</span>
                </div>
                ${item.autore_riferimento ? `<div class="info-row">
                    <span class="info-label"><i class="fas fa-user"></i></span>
                    <span class="info-value">${item.autore_riferimento}</span>
                </div>` : ''}
                ${item.opera_riferimento ? `<div class="info-row">
                    <span class="info-label"><i class="fas fa-book"></i></span>
                    <span class="info-value">${item.opera_riferimento}</span>
                </div>` : ''}
                <div class="detail-description">
                    <h3>${t.label_definition || 'Definizione'}</h3>
                    <p>${getLocalizedText(item, 'definizione')}</p>
                </div>
                ${item.esempio_citazione ? `
                <div class="detail-citazione">
                    <h3>${t.label_example_quote || 'Esempio/Citazione'}</h3>
                    <blockquote>${item.esempio_citazione}</blockquote>
                </div>` : ''}
                ${item.evoluzione ? `
                <div class="detail-evoluzione">
                    <h3>${t.label_historical_evolution || 'Evoluzione storica'}</h3>
                    <p>${item.evoluzione}</p>
                </div>` : ''}
                <div class="detail-actions">
                    <button class="detail-action-btn" onclick="showConceptNetwork('${item.parola}')">
                        <i class="fas fa-project-diagram"></i> ${t.view_concept_network || 'Vedi rete concettuale'}
                    </button>
                </div>
            </div>
        `;
    }
    
    if (contentElement) {
        contentElement.innerHTML = detailHTML;
    }
    
    if (item.coordinate && isFilosofo) {
        currentLatLng = { lat: item.coordinate.lat, lng: item.coordinate.lng };
    }
    
    showScreen(screenId);
    
    requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
        
        const activeScreen = document.getElementById(screenId);
        if (activeScreen) activeScreen.scrollTop = 0;
        
        if (contentElement) contentElement.scrollTop = 0;
    });

    setTimeout(() => {
        window.scrollTo(0, 0);
        const activeScreen = document.getElementById(screenId);
        if (activeScreen) activeScreen.scrollTop = 0;
    }, 50);
}

// Map Functions (Aggiornata per Filosofi)
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

    appData.filosofi.forEach(filosofo => {
        if (filosofo.coordinate && isValidCoordinate(filosofo.coordinate.lat, filosofo.coordinate.lng)) {
            const marker = createMarker(filosofo, 'filosofo');
            const markerId = `filosofo-${filosofo.id}`;

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
    const icon = getIconForType(type, item.periodo);
    const marker = L.marker([item.coordinate.lat, item.coordinate.lng], { icon });

    marker.bindPopup(`
        <div class="leaflet-popup-content">
            <div class="popup-title">${item.nome}</div>
            <p><strong>Periodo:</strong> ${getPeriodoText(item.periodo)}</p>
            <p><strong>Scuola:</strong> ${item.scuola}</p>
            <p><strong>Luogo di nascita:</strong> ${item.luogo_nascita || 'Non specificato'}</p>
            <button class="popup-btn" onclick="showDetail('${item.id}', '${type}')">Dettagli</button>
            <button class="popup-btn" onclick="centerOnLocation(${item.coordinate.lat}, ${item.coordinate.lng})" 
                    style="margin-top: 5px; background: var(--primary-blue);">
                <i class="fas fa-location-arrow"></i> Centra qui
            </button>
        </div>
    `);

    return marker;
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
    if (markers.size > 0) {
        const bounds = clusterGroup.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.1));
            showToast('Vista adattata a tutti i filosofi', 'success');
        }
    } else {
        showToast('Nessun filosofo da mostrare', 'info');
    }
}

function centerOnLocation(lat, lng) {
    if (map) {
        map.setView([lat, lng], 14);
        showToast('Mappa centrata sulla posizione', 'success');
    }
}

// ============================================
// MAPPA CONCETTUALE (NUOVA FUNZIONALITÀ)
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
            createConceptNetwork(container);
        } catch (error) {
            console.error('Errore creazione rete concettuale:', error);
            container.innerHTML = '<div class="error-state">Errore nella creazione della rete concettuale</div>';
        }
    }, 100);
}

function createConceptNetwork(container) {
    const nodes = new vis.DataSet([]);
    const edges = new vis.DataSet([]);
    
    // Aggiungi filosofi
    appData.filosofi.forEach((filosofo, index) => {
        nodes.add({
            id: `f-${filosofo.id}`,
            label: filosofo.nome,
            group: 'filosofo',
            value: 30,
            shape: 'circle',
            color: filosofo.periodo === 'contemporaneo' ? 
                { background: '#8b5cf6', border: '#7c3aed' } : 
                { background: '#3b82f6', border: '#1d4ed8' },
            font: { color: 'white', size: 14 },
            title: `${filosofo.nome}<br>${filosofo.scuola}<br>${filosofo.periodo}`
        });
    });
    
    // Aggiungi concetti
    appData.concetti.forEach((concetto, index) => {
        nodes.add({
            id: `c-${concetto.id}`,
            label: concetto.parola,
            group: 'concetto',
            value: 25,
            shape: 'box',
            color: { background: '#10b981', border: '#059669' },
            font: { color: 'white', size: 13 },
            title: `${concetto.parola}<br>${concetto.definizione.substring(0, 100)}...`
        });
    });
    
    // Crea connessioni (esempio: collegamenti filosofo-concetto)
    appData.filosofi.forEach(filosofo => {
        if (filosofo.concetti_principali) {
            filosofo.concetti_principali.forEach(concettoNome => {
                const concetto = appData.concetti.find(c => c.parola === concettoNome);
                if (concetto) {
                    edges.add({
                        from: `f-${filosofo.id}`,
                        to: `c-${concetto.id}`,
                        label: 'elabora',
                        color: filosofo.periodo === 'contemporaneo' ? '#f59e0b' : '#10b981',
                        width: 2,
                        arrows: 'to',
                        dashes: false
                    });
                }
            });
        }
    });
    
    // Collegamenti tra filosofi (influenze)
    // Esempio di collegamenti (dovrebbero essere nel dataset)
    const influenze = [
        { from: 'Platone', to: 'Aristotele', label: 'maestro' },
        { from: 'Aristotele', to: 'Tommaso d\'Aquino', label: 'influenza' },
        { from: 'Nietzsche', to: 'Foucault', label: 'ispirazione' },
        { from: 'Hegel', to: 'Marx', label: 'dialettica' }
    ];
    
    influenze.forEach(influenza => {
        const filosofoFrom = appData.filosofi.find(f => f.nome.includes(influenza.from));
        const filosofoTo = appData.filosofi.find(f => f.nome.includes(influenza.to));
        
        if (filosofoFrom && filosofoTo) {
            edges.add({
                from: `f-${filosofoFrom.id}`,
                to: `f-${filosofoTo.id}`,
                label: influenza.label,
                color: '#6b7280',
                width: 1,
                arrows: 'to',
                dashes: true
            });
        }
    });
    
    const data = { nodes, edges };
    const options = {
        nodes: {
            shape: 'dot',
            size: 25,
            font: {
                size: 14,
                face: 'Inter, -apple-system, sans-serif'
            },
            borderWidth: 2,
            shadow: true
        },
        edges: {
            width: 2,
            smooth: {
                type: 'continuous',
                roundness: 0.5
            },
            font: {
                size: 11,
                align: 'middle',
                strokeWidth: 0
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
            selectionWidth: 3
        },
        physics: {
            enabled: true,
            solver: 'forceAtlas2Based',
            forceAtlas2Based: {
                gravitationalConstant: -50,
                centralGravity: 0.01,
                springLength: 200,
                springConstant: 0.08,
                damping: 0.4,
                avoidOverlap: 1
            },
            stabilization: {
                enabled: true,
                iterations: 1000,
                updateInterval: 100,
                onlyDynamicEdges: false,
                fit: true
            }
        },
        interaction: {
            dragNodes: true,
            dragView: true,
            zoomView: true,
            hover: true,
            tooltipDelay: 200,
            hideEdgesOnDrag: false,
            hideEdgesOnZoom: false
        },
        layout: {
            improvedLayout: true
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
                }
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
                }
            }
        }
    };
    
    // Crea la rete
    const network = new vis.Network(container, data, options);
    
    // Gestisci eventi
    network.on("click", function(params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const node = nodes.get(nodeId);
            
            if (nodeId.startsWith('f-')) {
                const filosofoId = nodeId.substring(2);
                showDetail(filosofoId, 'filosofo');
            } else if (nodeId.startsWith('c-')) {
                const concettoId = nodeId.substring(2);
                showDetail(concettoId, 'concetto');
            }
        }
    });
    
    network.on("hoverNode", function(params) {
        const node = nodes.get(params.node);
        if (node) {
            // Aggiungi effetto hover
        }
    });
    
    // Aggiungi controlli UI
    addNetworkControls(network);
}

function addNetworkControls(network) {
    const controlsHTML = `
        <div class="network-controls">
            <button class="network-btn" onclick="network.fit()" title="Adatta vista">
                <i class="fas fa-expand"></i>
            </button>
            <button class="network-btn" onclick="network.stabilize()" title="Stabilizza rete">
                <i class="fas fa-sync"></i>
            </button>
            <button class="network-btn" onclick="togglePhysics()" title="Attiva/Disattiva fisica">
                <i class="fas fa-atom"></i>
            </button>
        </div>
    `;
    
    const container = document.getElementById('concetto-network-container');
    const controlsDiv = document.createElement('div');
    controlsDiv.innerHTML = controlsHTML;
    container.parentNode.insertBefore(controlsDiv, container.nextSibling);
}

function togglePhysics() {
    // Funzione per attivare/disattivare la fisica della rete
    console.log('Toggle physics');
}

function showConceptNetwork(conceptName) {
    showScreen('mappa-concettuale-screen');
    setTimeout(() => {
        loadConcettoNetwork();
        // Qui potresti aggiungere logica per evidenziare il concetto specifico
    }, 500);
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

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">${checkboxHtml}</td>
            <td>${filosofo.id}</td>
            <td>${filosofo.nome}</td>
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

function editFilosofo(id) {
    const filosofo = appData.filosofi.find(f => f.id == id);
    if (!filosofo) return;
    
    document.getElementById('filosofo-id').value = filosofo.id;
    
    // Campi Italiani
    document.getElementById('filosofo-nome').value = filosofo.nome || '';
    document.getElementById('filosofo-scuola').value = filosofo.scuola || '';
    document.getElementById('filosofo-periodo').value = filosofo.periodo || 'classico';
    document.getElementById('filosofo-anni').value = filosofo.anni_vita || '';
    document.getElementById('filosofo-luogo').value = filosofo.luogo_nascita || '';
    document.getElementById('filosofo-biografia').value = filosofo.biografia || '';
    
    // Campi Inglesi
    if(document.getElementById('filosofo-nome-en')) 
        document.getElementById('filosofo-nome-en').value = filosofo.nome_en || '';
    if(document.getElementById('filosofo-biografia-en')) 
        document.getElementById('filosofo-biografia-en').value = filosofo.biografia_en || '';
    
    // Coordinate (se presenti)
    if (filosofo.coordinate) {
        document.getElementById('filosofo-lat').value = filosofo.coordinate.lat || '';
        document.getElementById('filosofo-lng').value = filosofo.coordinate.lng || '';
    }
    
    document.getElementById('filosofo-ritratto').value = filosofo.ritratto || '';
    
    showAdminTab('filosofi-admin');
}

async function saveFilosofo(e) {
    e.preventDefault();
    
    try {
        const id = document.getElementById('filosofo-id').value;
        const nome = document.getElementById('filosofo-nome').value.trim();
        const scuola = document.getElementById('filosofo-scuola').value.trim();
        const periodo = document.getElementById('filosofo-periodo').value;
        const anni = document.getElementById('filosofo-anni').value.trim();
        const luogo = document.getElementById('filosofo-luogo').value.trim();
        const biografia = document.getElementById('filosofo-biografia').value.trim();
        const lat = document.getElementById('filosofo-lat').value;
        const lng = document.getElementById('filosofo-lng').value;
        const ritratto = document.getElementById('filosofo-ritratto').value.trim();
        
        // Campi inglesi
        const nome_en = document.getElementById('filosofo-nome-en') ? 
            document.getElementById('filosofo-nome-en').value.trim() : '';
        const biografia_en = document.getElementById('filosofo-biografia-en') ? 
            document.getElementById('filosofo-biografia-en').value.trim() : '';
        
        const filosofoData = {
            nome,
            nome_en,
            scuola,
            periodo,
            anni_vita: anni,
            luogo_nascita: luogo,
            biografia,
            biografia_en,
            ritratto,
            last_modified: new Date().toISOString()
        };
        
        // Aggiungi coordinate se disponibili
        if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
            filosofoData.coordinate = {
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            };
        }
        
        const validationErrors = validateFilosofoData(filosofoData);
        if (validationErrors.length > 0) throw validationErrors[0];
        
        let savedId;
        const operation = id ? 'UPDATE' : 'CREATE';
        
        if (navigator.onLine) {
            if (id && id.trim() !== '') {
                savedId = await safeFirebaseOperation(saveFirebaseData, 'update_filosofo', 'filosofi', filosofoData, id);
                const index = appData.filosofi.findIndex(f => f.id == id);
                if (index !== -1) appData.filosofi[index] = { id, ...filosofoData };
                showToast('Filosofo modificato con successo', 'success');
            } else {
                savedId = await safeFirebaseOperation(saveFirebaseData, 'create_filosofo', 'filosofi', filosofoData);
                appData.filosofi.push({ id: savedId, ...filosofoData });
                showToast(`Filosofo aggiunto con successo (ID: ${savedId})`, 'success');
            }
        } else {
            savedId = id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await addToSyncQueue(operation, 'filosofi', filosofoData, savedId);
            if (operation === 'UPDATE') {
                const index = appData.filosofi.findIndex(f => f.id == id);
                if (index !== -1) appData.filosofi[index] = { id: savedId, ...filosofoData };
            } else {
                appData.filosofi.push({ id: savedId, ...filosofoData });
            }
            showToast('Filosofo salvato localmente.', 'info');
        }
        
        saveLocalData();
        loadAdminFilosofi();
        resetFilosofoForm();
        loadFilosofi();
        updateDashboardStats();
        
    } catch (error) {
        await handleError('saveFilosofo', error, 'Errore nel salvataggio del filosofo');
    }
}

function resetFilosofoForm() {
    document.getElementById('filosofo-form').reset();
    document.getElementById('filosofo-id').value = '';
}

async function deleteFilosofo(id) {
    if (currentUserRole !== 'admin') {
        showToast('Non hai i permessi per eliminare', 'error');
        return;
    }

    if (!confirm('Sei sicuro di voler eliminare questo filosofo?')) return;
    
    try {
        if (navigator.onLine) {
            await deleteFirebaseData('filosofi', id);
        } else {
            const filosofo = appData.filosofi.find(f => f.id == id);
            if (filosofo) {
                await addToSyncQueue('DELETE', 'filosofi', filosofo, id);
            }
        }
        
        appData.filosofi = appData.filosofi.filter(f => f.id != id);
        
        saveLocalData();
        loadAdminFilosofi();
        loadFilosofi();
        updateDashboardStats();
        
        showToast('Filosofo eliminato con successo', 'success');
        logActivity('Filosofo eliminato');
    } catch (error) {
        showToast('Errore nell\'eliminazione del filosofo', 'error');
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

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">${checkboxHtml}</td>
            <td>${opera.id}</td>
            <td>${opera.titolo}</td>
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

async function saveOpera(e) {
    e.preventDefault();
    
    const id = document.getElementById('opera-id').value;
    const titolo = document.getElementById('opera-titolo').value.trim();
    const autore_id = document.getElementById('opera-autore').value;
    const autore_nome = document.getElementById('opera-autore').options[document.getElementById('opera-autore').selectedIndex].text;
    const anno = document.getElementById('opera-anno').value;
    const periodo = document.getElementById('opera-periodo').value;
    const lingua = document.getElementById('opera-lingua').value;
    const sintesi = document.getElementById('opera-sintesi').value.trim();
    const pdf_url = document.getElementById('opera-pdf').value.trim();
    const immagine = document.getElementById('opera-immagine').value.trim();
    const concettiInput = document.getElementById('opera-concetti').value;
    
    // Campi inglesi
    const titolo_en = document.getElementById('opera-titolo-en') ? 
        document.getElementById('opera-titolo-en').value.trim() : '';
    const sintesi_en = document.getElementById('opera-sintesi-en') ? 
        document.getElementById('opera-sintesi-en').value.trim() : '';
    
    const operaData = {
        titolo,
        titolo_en,
        autore_id,
        autore_nome,
        anno,
        periodo,
        lingua,
        sintesi,
        sintesi_en,
        pdf_url,
        immagine,
        concetti: concettiInput.split(',').map(c => c.trim()).filter(c => c !== ''),
        last_modified: new Date().toISOString()
    };
    
    try {
        const validationErrors = validateOperaData(operaData);
        if (validationErrors.length > 0) throw validationErrors[0];
        
        let savedId;
        const operation = id ? 'UPDATE' : 'CREATE';

        if (navigator.onLine) {
            if (id && id.trim() !== '') {
                savedId = await safeFirebaseOperation(saveFirebaseData, 'update_opera', 'opere', operaData, id);
                const index = appData.opere.findIndex(o => o.id == id);
                if (index !== -1) appData.opere[index] = { id, ...operaData };
                showToast('Opera modificata con successo', 'success');
            } else {
                savedId = await safeFirebaseOperation(saveFirebaseData, 'create_opera', 'opere', operaData);
                appData.opere.push({ id: savedId, ...operaData });
                showToast(`Opera aggiunta con successo (ID: ${savedId})`, 'success');
            }
        } else {
            savedId = id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await addToSyncQueue(operation, 'opere', operaData, savedId);
            if (operation === 'UPDATE') {
                const index = appData.opere.findIndex(o => o.id == id);
                if (index !== -1) appData.opere[index] = { id: savedId, ...operaData };
            } else {
                appData.opere.push({ id: savedId, ...operaData });
            }
            showToast('Opera salvata localmente.', 'info');
        }
        
        saveLocalData();
        loadAdminOpere();
        resetOperaForm();
        loadOpere();
        updateDashboardStats();
        
    } catch (error) {
        await handleError('saveOpera', error, 'Errore nel salvataggio dell\'opera');
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

        const row = document.createElement('tr');
        row.innerHTML = `
            <td style="text-align: center;">${checkboxHtml}</td>
            <td>${concetto.id}</td>
            <td>${concetto.parola}</td>
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

async function saveConcetto(e) {
    e.preventDefault();
    
    const id = document.getElementById('concetto-id').value;
    const parola = document.getElementById('concetto-parola').value;
    const definizione = document.getElementById('concetto-definizione').value;
    const citazione = document.getElementById('concetto-citazione').value;
    const autore = document.getElementById('concetto-autore').value;
    const opera = document.getElementById('concetto-opera').value;
    const periodo = document.getElementById('concetto-periodo').value;
    const evoluzione = document.getElementById('concetto-evoluzione').value;
    
    // Campi inglesi
    const parola_en = document.getElementById('concetto-parola-en') ? 
        document.getElementById('concetto-parola-en').value : '';
    const definizione_en = document.getElementById('concetto-definizione-en') ? 
        document.getElementById('concetto-definizione-en').value : '';
    
    const concettoData = {
        parola,
        parola_en,
        definizione,
        definizione_en,
        esempio_citazione: citazione,
        autore_riferimento: autore,
        opera_riferimento: opera,
        periodo_storico: periodo,
        evoluzione,
        last_modified: new Date().toISOString()
    };
    
    try {
        const validationErrors = validateConcettoData(concettoData);
        if (validationErrors.length > 0) throw validationErrors[0];
        
        let savedId;
        const operation = id ? 'UPDATE' : 'CREATE';

        if (navigator.onLine) {
            if (id && id.trim() !== '') {
                savedId = await safeFirebaseOperation(saveFirebaseData, 'update_concetto', 'concetti', concettoData, id);
                const index = appData.concetti.findIndex(c => c.id == id);
                if (index !== -1) {
                    appData.concetti[index] = { id, ...concettoData };
                }
                showToast('Concetto modificato con successo', 'success');
            } else {
                savedId = await safeFirebaseOperation(saveFirebaseData, 'create_concetto', 'concetti', concettoData);
                appData.concetti.push({ id: savedId, ...concettoData });
                showToast(`Concetto aggiunto con successo (ID: ${savedId})`, 'success');
            }
        } else {
            savedId = id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await addToSyncQueue(operation, 'concetti', concettoData, savedId);
            
            if (id) {
                const index = appData.concetti.findIndex(c => c.id == id);
                if (index !== -1) appData.concetti[index] = { id: savedId, ...concettoData };
            } else {
                appData.concetti.push({ id: savedId, ...concettoData });
            }
            showToast('Concetto salvato localmente.', 'info');
        }
        
        saveLocalData();
        loadAdminConcetti();
        resetConcettoForm();
        loadConcetti();
        updateDashboardStats();
        
    } catch (error) {
        await handleError('saveConcetto', error, 'Errore nel salvataggio del concetto');
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
// IMPORT/EXPORT FUNCTIONS - FILOSOFIA
// ============================================

function exportDataToExcel(type) {
    if (currentUserRole !== 'admin') {
        showToast('Funzione riservata agli amministratori', 'error');
        return;
    }

    try {
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

function downloadTemplate(type) {
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

    showToast(`Template ${type} scaricato con successo`, 'success');
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

    const tipo = document.getElementById('report-type').value;
    const descrizione = document.getElementById('report-desc').value;
    
    const emailDestinatario = "aeterna.lexicon@abc.napoli.it"; 
    const oggetto = encodeURIComponent(`Segnalazione App Aeterna Lexicon: ${tipo}`);
    
    const corpo = encodeURIComponent(
        `Gentile Assistenza Aeterna Lexicon,\n\n` +
        `Vorrei segnalare il seguente problema:\n` +
        `TIPO: ${tipo}\n\n` +
        `DESCRIZIONE:\n${descrizione}\n\n` +
        `---\nInviato dall'App Aeterna Lexicon in Motu`
    );

    window.location.href = `mailto:${emailDestinatario}?subject=${oggetto}&body=${corpo}`;
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
// Initialize App (MODIFICATO E CORRETTO)
// ============================================

// --- 1. AGGIUNGIAMO LA FUNZIONE CHE MANCAVA ---
function checkOnlineStatus() {
    const isOnline = navigator.onLine;
    const offlineIndicator = document.getElementById('offline-indicator');
    
    if (offlineIndicator) {
        if (isOnline) {
            offlineIndicator.style.display = 'none';
        } else {
            offlineIndicator.style.display = 'block';
            // Controllo di sicurezza per evitare errori se showToast non è ancora pronto
            if (typeof showToast === 'function') {
                showToast('Sei offline. Modalità limitata attiva.', 'warning');
            } else {
                console.warn('Sei offline (showToast non disponibile)');
            }
        }
    }
}

// --- 2. INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', function() {
    console.log("%c Aeterna Lexicon in Motu v1.0 ", "background: #3b82f6; color: white; padding: 4px; border-radius: 3px;");
    console.log("%c Dataset filosofico per l'analisi del linguaggio ", "font-size: 10px; color: #64748b; font-style: italic;");
    
    // Caricamento dati locali (con controllo sicurezza)
    if (typeof loadLocalData === 'function') loadLocalData();
    
    // Controllo connessione (ora la funzione esiste qui sopra!)
    checkOnlineStatus();
    
    // Mostra la home
    if (typeof showScreen === 'function') showScreen('home-screen');
    
    // Gestione URL
    if (typeof handleUrlParameters === 'function') handleUrlParameters();
    
    // Setup tasto indietro
    if (typeof setupBackButtonHandler === 'function') setupBackButtonHandler();
    
    // Permessi Notifiche
    if ('Notification' in window && Notification.permission !== 'granted') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') console.log('Notifiche attivate!');
        });
    }

    // Gestione Highlights
    const lastHighlightTime = localStorage.getItem('last_highlight_time');
    const now = Date.now();
    if (lastHighlightTime && (now - parseInt(lastHighlightTime)) > 24 * 60 * 60 * 1000) {
        localStorage.removeItem('app_highlights');
        localStorage.setItem('last_highlight_time', now.toString());
    }
    if (!lastHighlightTime) localStorage.setItem('last_highlight_time', now.toString());
    
    // Service Worker
    if ('serviceWorker' in navigator) {
        setTimeout(() => {
            if (typeof registerServiceWorker === 'function') registerServiceWorker();
        }, 1000);
    }
    
    // Caricamento Dati Firebase
    setTimeout(async () => {
        try {
            if (typeof loadFirebaseData === 'function') {
                await loadFirebaseData('filosofi');
                await loadFirebaseData('opere');
                await loadFirebaseData('concetti');
                
                if (document.getElementById('filosofi-list') && typeof loadFilosofi === 'function') loadFilosofi();
                if (document.getElementById('opere-list') && typeof loadOpere === 'function') loadOpere();
                if (document.getElementById('concetti-list') && typeof loadConcetti === 'function') loadConcetti();
            }
        } catch (error) {
            if (typeof showToast === 'function') showToast('Utilizzo dati locali', 'info');
        }
    }, 1000);
    
    // Event Listeners Vari
    const pwdInput = document.getElementById('admin-password');
    if (pwdInput) {
        pwdInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && typeof checkAdminAuth === 'function') checkAdminAuth();
        });
    }
    
    const authModal = document.getElementById('admin-auth');
    if (authModal) {
        authModal.addEventListener('click', function(e) {
            if (e.target === this && typeof closeAdminAuth === 'function') closeAdminAuth();
        });
    }
    
    window.addEventListener('online', checkOnlineStatus);
    window.addEventListener('offline', checkOnlineStatus);
    
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            // Fallback gestito nei template
        }
    }, true);
    
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && adminPanel.style.display === 'flex') {
                if (typeof closeAdminPanel === 'function') closeAdminPanel();
            }
        });
        
        adminPanel.addEventListener('click', function(e) {
            if (e.target === this && typeof closeAdminPanel === 'function') closeAdminPanel();
        });
    }
    
    if (typeof initializeOfflineSync === 'function') initializeOfflineSync();
    
    setTimeout(() => {
        if (typeof setupLazyLoading === 'function') setupLazyLoading();
    }, 1000);
    
    if (typeof logActivity === 'function') logActivity('Applicazione Aeterna Lexicon avviata');

    // === PARTE FONDAMENTALE MANCANTE NEL TUO CODICE ===
    // Questo serve a far sparire il logo di caricamento!
    const splash = document.getElementById('splash-screen');
    if (splash) {
        setTimeout(() => {
            splash.style.transition = 'opacity 0.5s ease';
            splash.style.opacity = '0'; // Dissolvenza
            setTimeout(() => {
                splash.style.display = 'none'; // Rimozione
            }, 500);
        }, 1500); // Ritardo per mostrare il logo
    }
    // ==================================================
});

console.log('✨ Aeterna Lexicon in Motu - App filosofica inizializzata');