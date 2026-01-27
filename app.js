// ==========================================
// AETERNA LEXICON IN MOTU - FILOSOFIA DATASET
// Versione pulita e corretta
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

// ==========================================
// VARIABILI GLOBALI
// ==========================================

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
let currentUserRole = 'editor'; // 'admin' (completo) o 'editor' (limitato)

// ==========================================
// FUNZIONE LOG ACTIVITY
// ==========================================
window.activityLog = JSON.parse(localStorage.getItem('activityLog') || '[]');

function logActivity(description) {
    const timestamp = new Date().toLocaleString('it-IT');
    
    if (!window.activityLog) window.activityLog = [];

    window.activityLog.unshift({ description, timestamp });

    if (window.activityLog.length > 50) {
        window.activityLog = window.activityLog.slice(0, 50);
    }

    try {
        localStorage.setItem('activityLog', JSON.stringify(window.activityLog));
    } catch (e) { console.warn("Local storage full"); }
    
    if (typeof updateActivityLog === 'function' && document.getElementById('activity-list')) {
        updateActivityLog();
    }
}

// ==========================================
// GESTIONE LINGUA
// ==========================================

function toggleLanguage() {
    currentLanguage = currentLanguage === 'it' ? 'en' : 'it';
    localStorage.setItem('app_language', currentLanguage);
    
    applyTranslations();
    updateLangButton();
    
    if (typeof loadFilosofi === 'function') loadFilosofi();
    if (typeof loadOpere === 'function') loadOpere();
    if (typeof loadConcetti === 'function') loadConcetti();
    
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen && (activeScreen.id.includes('detail'))) {
        if (currentDetailId && currentDetailType) {
            showDetail(currentDetailId, currentDetailType);
        }
    }
    
    setTimeout(() => {
        const modal = document.getElementById('top-menu-modal');
        if(modal) modal.style.display = 'none';
    }, 300);
}

function applyTranslations() {
    const t = window.translations[currentLanguage];
    if (!t) return;

    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (t[key]) element.textContent = t[key];
    });

    setText('nav-filosofi', t.tab_filosophers);
    setText('nav-opere', t.tab_works);
    setText('nav-map', t.tab_map);
    setText('nav-concetti', t.tab_concepts);
    setText('nav-btn-text', t.navigate_btn);

    setText('filosofi-title', t.screen_philosophers);
    setText('filosofi-subtitle', t.subtitle_philosophers);
    
    setText('opere-title', t.screen_works);
    setText('opere-subtitle', t.subtitle_works);

    setText('concetti-title', t.screen_concepts);
    setText('concetti-subtitle', t.subtitle_concepts);

    setText('map-title', t.screen_map);
    setText('legend-title', t.legend_title);
    setText('legend-filosofo', t.legend_item_philosopher);
    setText('legend-opera', t.legend_item_work);
    setText('legend-pos', t.legend_item_position);
    
    const mapSearch = document.getElementById('map-search-input');
    if (mapSearch) mapSearch.placeholder = t.map_search_placeholder;
    
    const listSearch = document.getElementById('search-input');
    if (listSearch) listSearch.placeholder = t.search_placeholder;
    
    document.querySelectorAll('.search-input').forEach(el => {
        el.placeholder = t.search_placeholder;
    });

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

    updateLangButton();
}

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

// ==========================================
// GESTIONE REMOTE CONTROL E CONFIGURAZIONE
// ==========================================

function initRemoteControl() {
    if (!window.db) {
        setTimeout(initRemoteControl, 500);
        return;
    }

    window.db.collection("config").doc("general_settings")
        .onSnapshot((docSnap) => {
            if (docSnap.exists) {
                const data = docSnap.data();
                const isAdmin = localStorage.getItem('abc_admin_logged') === 'true';

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

                const isTrackingAllowed = data.analyticsEnabled !== false;
                const privacyBtn = document.getElementById('global-privacy-toggle');
                if (privacyBtn) privacyBtn.checked = isTrackingAllowed;
            }
        });
}

async function updateConfig(key, value) {
    try {
        await window.db.collection("config").doc("general_settings").set({ 
            [key]: value,
            lastUpdate: new Date().toISOString()
        }, { merge: true });
    } catch (e) {
        console.error(e);
        showToast("Errore di connessione", "error");
    }
}

async function toggleGlobalMaintenance(checkbox) {
    if (currentUserRole !== 'admin') { 
        checkbox.checked = !checkbox.checked; 
        return; 
    }
    
    const newState = checkbox.checked;
    if (confirm(newState ? "🔴 BLOCCARE L'APP A TUTTI GLI UTENTI?" : "🟢 RIAPRIRE L'APP?")) {
        await updateConfig('maintenanceMode', newState);
        showToast(newState ? "Manutenzione ATTIVATA" : "Manutenzione DISATTIVATA", "warning");
    } else {
        checkbox.checked = !newState;
    }
}

async function toggleGlobalAnalytics(checkbox) {
    if (currentUserRole !== 'admin') { 
        checkbox.checked = !checkbox.checked; 
        return; 
    }
    
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

// ==========================================
// SERVICE WORKER
// ==========================================

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

// ==========================================
// GESTIONE ERRORI
// ==========================================

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
    
    const offlineIndicator = document.getElementById('offline-indicator');
    if (offlineIndicator) offlineIndicator.style.display = 'block';
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

// ==========================================
// FIREBASE DATA FUNCTIONS
// ==========================================

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
                ...docData
            };
            
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
        
        if (type === 'filosofi') {
            updateAllSelects();
        }
        
        return data;

    } catch (error) {
        console.error(`Errore loadFirebaseData_${type}:`, error);
        return loadLocalData(type);
    }
}

async function saveFirebaseData(type, item, id = null) {
    try {
        const collectionName = COLLECTIONS[type.toUpperCase()] || type;
        const collectionRef = window.db.collection(collectionName);
        
        let savedId;
        if (id) {
            await collectionRef.doc(id).update(item);
            savedId = id;
        } else {
            const docRef = await collectionRef.add(item);
            savedId = docRef.id;
        }
        return savedId;
    } catch (error) {
        console.error(`Errore nel salvataggio ${type}:`, error);
        throw error;
    }
}

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

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

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

function showToast(message, type = 'info', duration = 3000) {
    console.log(`[Toast Disabled] Tipo: ${type}, Messaggio: ${message}`);
}

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

// ==========================================
// NAVIGATION AND SCREEN MANAGEMENT
// ==========================================

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

// ==========================================
// DATA LOADING FUNCTIONS
// ==========================================

async function loadFilosofi() {
    const container = document.getElementById('filosofi-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    const sortedList = [...(appData.filosofi || [])].sort((a, b) => a.nome.localeCompare(b.nome));

    if (sortedList.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-state-icon"><i class="fas fa-user-graduate"></i></div><div class="empty-state-text">Nessun elemento trovato</div></div>';
        return;
    }
    
    const highlights = JSON.parse(localStorage.getItem('app_highlights') || '{"new": [], "updated": []}');

    sortedList.forEach(item => {
        let hasCoords = false;
        if (item.coordinate && item.coordinate.lat) hasCoords = true;
        else if (item.lat && item.lng) hasCoords = true;

        const gridItem = document.createElement('div');
        gridItem.className = 'grid-item animate-in'; 
        
        let badgeHTML = '';
        if (highlights.new.includes(item.id)) badgeHTML = '<span class="badge-new">NUOVO</span>';
        else if (highlights.updated.includes(item.id)) badgeHTML = '<span class="badge-updated">AGGIORNATO</span>';
        
        const imgUrl = item.ritratto && item.ritratto.trim() !== '' ? item.ritratto : 'images/default-filosofo.jpg';
        
        const getPeriodoLabel = (periodo) => {
            return (window.translations && window.translations[currentLanguage] && window.translations[currentLanguage]['period_' + periodo]) 
                ? window.translations[currentLanguage]['period_' + periodo] : periodo;
        };

        gridItem.innerHTML = `
            <div class="item-header" style="background-image: url('${imgUrl}'); background-size: cover; height: 150px; border-radius: 10px 10px 0 0; position: relative;">
                <span class="item-period-badge ${item.periodo || 'classico'}" style="position: absolute; bottom: 10px; right: 10px; padding: 4px 8px; border-radius: 12px; background: rgba(255,255,255,0.9); font-size: 0.8rem; font-weight: bold;">
                    ${getPeriodoLabel(item.periodo) || item.periodo || ''}
                </span>
            </div>
            <div class="item-content" style="padding: 15px;">
                <h3 class="item-name" style="margin: 0 0 5px 0; font-size: 1.2rem; font-weight: 700;">${item.nome} ${badgeHTML}</h3>
                
                <div class="item-scuola" style="color: #666; font-size: 0.9rem; margin-bottom: 10px;">
                    🏛️ ${item.scuola || 'Scuola non definita'}
                </div>
                
                <div class="item-details" style="font-size: 0.85rem; color: #888; margin-bottom: 15px;">
                    <div>📅 ${item.anni_vita || 'Anni sconosciuti'}</div>
                    <div>📍 ${item.luogo_nascita || 'Luogo sconosciuto'}</div>
                </div>
                
                <div class="item-actions" style="display: flex; gap: 10px; margin-top: auto;">
                    <button onclick="showDetail('${item.id}', 'filosofo')" class="btn-detail" style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid #ddd; background: #fff; cursor: pointer;">
                        Scheda
                    </button>
                    
                    ${hasCoords ? `
                        <button onclick="goToMap('${item.id}')" class="btn-map" style="flex: 1; padding: 8px; border-radius: 6px; border: none; background: #e0f2fe; color: #0284c7; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 5px;">
                            🗺️ Mappa
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        container.appendChild(gridItem);
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

    const allBtns = document.querySelectorAll(`#${type}-screen .filter-btn`);
    allBtns.forEach(btn => {
        btn.classList.remove('active');
    });

    const activeBtn = document.querySelector(`#${type}-screen .filter-btn.${filterValue}`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    const container = document.getElementById(`${type}-list`);
    
    if (container) {
        if (type === 'filosofi') {
            loadFilosofi();
        } else if (type === 'opere') {
            renderCompactItems(container, getFilteredItems('opere'), 'opera');
        } else if (type === 'concetti') {
            renderConcettiItems(container, getFilteredItems('concetti'));
        }
    }
}

// ==========================================
// RENDERING FUNCTIONS
// ==========================================

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
        
        concettoCard.addEventListener('click', (e) => {
            if (!e.target.classList.contains('badge-analysis')) {
                openComparativeAnalysis(item.parola, item.id);
            }
        });
        
        container.appendChild(concettoCard);
    });
}

// ==========================================
// DETAIL VIEW
// ==========================================

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

    const getPeriodoLabel = (periodo) => {
        const key = {
            'classico': 'period_classic',
            'contemporaneo': 'period_contemporary',
            'medioevale': 'period_medieval',
            'moderno': 'period_modern'
        }[periodo] || periodo;
        return t[key] || periodo;
    };

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
                    ${hasComparativeAnalysis(item.parola) ? `
                    <button class="detail-action-btn analysis-btn" onclick="openComparativeAnalysis('${item.parola}', '${item.id}')">
                        <i class="fas fa-chart-line"></i> ${t.view_comparative_analysis || 'Analisi Comparativa'}
                    </button>
                    ` : ''}
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

// ==========================================
// MAP FUNCTIONS
// ==========================================

function initMappa() {
    if (!document.getElementById('map') || window.map) return;

    console.log("Inizializzazione Mappa Leaflet...");

    window.map = L.map('map').setView([41.9028, 12.4964], 5); 

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(window.map);

    window.markers = new Map(); 
    window.clusterGroup = L.markerClusterGroup();
    window.map.addLayer(clusterGroup);

    addMapControls();
    setupSearchAutocomplete();
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
    const mapTabBtn = document.getElementById('nav-map');
    if (mapTabBtn) mapTabBtn.click();

    const filosofo = appData.filosofi.find(f => f.id === id);
    if (!filosofo) return;

    setTimeout(() => {
        if(window.map) window.map.invalidateSize();
        centerMapOnFilosofo(filosofo);
    }, 300);
}

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

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

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

async function checkAdminAuth() {
    const emailInput = document.getElementById('admin-email');
    const passInput = document.getElementById('admin-password');
    const errorElement = document.getElementById('auth-error');

    const email = emailInput.value.trim();
    const password = passInput.value;

    try {
        await window.auth.signInWithEmailAndPassword(email, password);
        
        isAdminAuthenticated = true;
        localStorage.setItem('abc_admin_logged', 'true');
        
        const maintScreen = document.getElementById('maintenance-mode');
        if (maintScreen) maintScreen.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        if (typeof initRemoteControl === 'function') initRemoteControl();

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
    
    const restrictedSections = document.querySelectorAll('.import-export-section, .backup-section, .analytics-actions-section');
    
    restrictedSections.forEach(section => {
        if (currentUserRole === 'admin') {
            section.style.display = 'block';
        } else {
            section.style.display = 'none';
        }
    });
    
    if (typeof initAdminForms === 'function') {
        setTimeout(initAdminForms, 100);
    } else {
        console.warn("initAdminForms function not found");
    }
    
    loadAdminFilosofi();
    loadAdminOpere();
    loadAdminConcetti();
    
    updateDashboardStats();
    
    if (typeof refreshAnalyticsDashboard === 'function') {
        refreshAnalyticsDashboard();
    }
    if (typeof updatePerformanceMetrics === 'function') {
        updatePerformanceMetrics();
    }
    
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

// ==========================================
// DASHBOARD AND ACTIVITY LOG
// ==========================================

function updateActivityLog() {
    const activityList = document.getElementById('activity-list');
    if (!activityList) return;
    
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
    const safeSetText = (id, text) => {
        const el = document.getElementById(id);
        if (el) {
            el.textContent = text;
        }
    };

    if (appData.filosofi) {
        safeSetText('total-filosofi', appData.filosofi.length);
        safeSetText('filosofi-classici', appData.filosofi.filter(f => f.periodo === 'classico').length);
        safeSetText('filosofi-contemporanei', appData.filosofi.filter(f => f.periodo === 'contemporaneo').length);
        safeSetText('filosofi-medioevali', appData.filosofi.filter(f => f.periodo === 'medioevale').length);
    }
    
    if (appData.opere) {
        safeSetText('total-opere', appData.opere.length);
        safeSetText('opere-classiche', appData.opere.filter(o => o.periodo === 'classico').length);
        safeSetText('opere-contemporanee', appData.opere.filter(o => o.periodo === 'contemporaneo').length);
    }
    
    if (appData.concetti) {
        safeSetText('total-concetti', appData.concetti.length);
        safeSetText('concetti-ontologia', appData.concetti.filter(c => c.categoria === 'ontologia').length);
        safeSetText('concetti-etica', appData.concetti.filter(c => c.categoria === 'etica').length);
    }
}

// ==========================================
// ADMIN FUNCTIONS - FILOSOFI
// ==========================================

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
    const filosofo = appData.filosofi.find(f => f.id == id);
    if (!filosofo) return;
    
    document.getElementById('filosofo-id').value = filosofo.id;
    document.getElementById('filosofo-nome').value = filosofo.nome || '';
    document.getElementById('filosofo-scuola').value = filosofo.scuola || '';
    document.getElementById('filosofo-periodo').value = filosofo.periodo || 'classico';
    document.getElementById('filosofo-anni').value = filosofo.anni_vita || '';
    document.getElementById('filosofo-luogo').value = filosofo.luogo_nascita || '';
    document.getElementById('filosofo-biografia').value = filosofo.biografia || '';
    
    if(document.getElementById('filosofo-nome-en')) 
        document.getElementById('filosofo-nome-en').value = filosofo.nome_en || '';
    if(document.getElementById('filosofo-biografia-en')) 
        document.getElementById('filosofo-biografia-en').value = filosofo.biografia_en || '';
    
    if (filosofo.coordinate) {
        document.getElementById('filosofo-lat').value = filosofo.coordinate.lat || '';
        document.getElementById('filosofo-lng').value = filosofo.coordinate.lng || '';
    }
    
    document.getElementById('filosofo-ritratto').value = filosofo.ritratto || '';
    
    showAdminTab('filosofi-admin');
}

async function saveFilosofo(e) {
    e.preventDefault();

    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    try {
        const id = getVal('filosofo-id');
        const nome = getVal('filosofo-nome');
        const scuola = getVal('filosofo-scuola');
        const periodo = document.getElementById('filosofo-periodo') ? document.getElementById('filosofo-periodo').value : 'classico';
        const anni = getVal('filosofo-anni');
        const luogo = getVal('filosofo-luogo');
        const biografia = getVal('filosofo-biografia');
        const lat = getVal('filosofo-lat');
        const lng = getVal('filosofo-lng');
        const ritratto = getVal('filosofo-ritratto');
        
        const nome_en = getVal('filosofo-nome-en');
        const biografia_en = getVal('filosofo-biografia-en');

        if (!nome) {
            showToast("Il nome è obbligatorio", "error");
            return;
        }

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

        if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
            filosofoData.coordinate = {
                lat: parseFloat(lat),
                lng: parseFloat(lng)
            };
        }

        let savedId;
        const operation = id ? 'UPDATE' : 'CREATE';

        if (navigator.onLine && window.db) {
            if (id && id.trim() !== '') {
                await saveFirebaseData('filosofi', filosofoData, id);
                savedId = id;
                
                const index = appData.filosofi.findIndex(f => f.id == id);
                if (index !== -1) appData.filosofi[index] = { id, ...filosofoData };
                
                showToast('Filosofo modificato con successo', 'success');
            } else {
                savedId = await saveFirebaseData('filosofi', filosofoData);
                appData.filosofi.push({ id: savedId, ...filosofoData });
                showToast(`Filosofo aggiunto (ID: ${savedId})`, 'success');
            }
        } else {
            savedId = id || `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            if (typeof addToSyncQueue === 'function') {
                await addToSyncQueue(operation, 'filosofi', filosofoData, savedId);
            }

            if (operation === 'UPDATE') {
                const index = appData.filosofi.findIndex(f => f.id == id);
                if (index !== -1) appData.filosofi[index] = { id: savedId, ...filosofoData };
            } else {
                appData.filosofi.push({ id: savedId, ...filosofoData });
            }
            showToast('Filosofo salvato localmente (Offline).', 'info');
        }

        saveLocalData();
        loadAdminFilosofi();
        loadFilosofi();
        
        const form = document.getElementById('filosofo-form');
        if (form) form.reset();
        const idField = document.getElementById('filosofo-id');
        if (idField) idField.value = '';

        if (typeof updateDashboardStats === 'function') updateDashboardStats();

    } catch (error) {
        console.error("Errore salvataggio:", error);
        if (typeof handleError === 'function') {
            await handleError('saveFilosofo', error, 'Errore nel salvataggio');
        } else {
            showToast('Errore nel salvataggio: ' + error.message, 'error');
        }
    }
}

// ==========================================
// ADMIN FUNCTIONS - OPERE
// ==========================================

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
    
    const autoreSelect = document.getElementById('opera-autore');
    if (autoreSelect) {
        autoreSelect.value = opera.autore_id || '';
    }
    
    document.getElementById('opera-anno').value = opera.anno || '';
    document.getElementById('opera-periodo').value = opera.periodo || '';
    document.getElementById('opera-lingua').value = opera.lingua || '';
    document.getElementById('opera-sintesi').value = opera.sintesi || '';
    
    if(document.getElementById('opera-titolo-en'))
        document.getElementById('opera-titolo-en').value = opera.titolo_en || '';
    if(document.getElementById('opera-sintesi-en'))
        document.getElementById('opera-sintesi-en').value = opera.sintesi_en || '';
    
    document.getElementById('opera-pdf').value = opera.pdf_url || '';
    document.getElementById('opera-immagine').value = opera.immagine || '';
    
    if(document.getElementById('opera-concetti') && opera.concetti) {
        document.getElementById('opera-concetti').value = opera.concetti.join(', ');
    }
    
    showAdminTab('opere-admin');
}

async function saveOpera(event) {
    event.preventDefault();
    
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
        
        if (!titolo) {
            showToast("Il titolo è obbligatorio", "error");
            return;
        }
        
        if (!autoreId) {
            showToast("Devi selezionare un autore", "error");
            return;
        }
        
        let autoreNome = '';
        if (autoreSelect && autoreSelect.selectedIndex >= 0) {
            autoreNome = autoreSelect.options[autoreSelect.selectedIndex].text;
        }
        
        if (!autoreNome && autoreId) {
            const filosofo = appData.filosofi.find(f => f.id === autoreId);
            autoreNome = filosofo ? filosofo.nome : 'Autore sconosciuto';
        }

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
                await saveFirebaseData('opere', operaData, id);
                savedId = id;
                
                const index = appData.opere.findIndex(o => o.id === id);
                if (index !== -1) {
                    appData.opere[index] = { id, ...operaData };
                }
            } else {
                savedId = await saveFirebaseData('opere', operaData);
                appData.opere.push({ id: savedId, ...operaData });
            }
            
            showToast('Opera salvata con successo!', 'success');
        } else {
            savedId = id || `local_${Date.now()}`;
            if (typeof addToSyncQueue === 'function') {
                await addToSyncQueue(id ? 'UPDATE' : 'CREATE', 'opere', operaData, savedId);
            }
            showToast('Opera salvata localmente (offline)', 'info');
        }
        
        saveLocalData();
        loadAdminOpere();
        if (typeof loadOpere === 'function') loadOpere();
        
        document.getElementById('opera-form').reset();
        document.getElementById('opera-id').value = '';
        
        updateAllSelects();
        
    } catch (error) {
        console.error("Errore salvataggio opera:", error);
        showToast("Errore: " + error.message, "error");
    }
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

// ==========================================
// ADMIN FUNCTIONS - CONCETTI
// ==========================================

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
    
    if(document.getElementById('concetto-parola-en'))
        document.getElementById('concetto-parola-en').value = concetto.parola_en || '';
    if(document.getElementById('concetto-definizione-en'))
        document.getElementById('concetto-definizione-en').value = concetto.definizione_en || '';
    
    showAdminTab('concetti-admin');
}

async function saveConcetto(event) {
    event.preventDefault();

    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : '';
    };

    try {
        const id = getVal('concetto-id');

        const selAutore = document.getElementById('concetto-autore');
        const autoreId = selAutore ? selAutore.value : '';
        let autoreNome = '';
        if (selAutore && selAutore.selectedIndex >= 0) {
            autoreNome = selAutore.options[selAutore.selectedIndex].text;
            if (autoreNome === 'Seleziona un filosofo...') autoreNome = '';
        }

        const selOpera = document.getElementById('concetto-opera');
        const operaId = selOpera ? selOpera.value : '';
        let operaTitolo = '';
        if (selOpera && selOpera.selectedIndex >= 0) {
            operaTitolo = selOpera.options[selOpera.selectedIndex].text;
            if (operaTitolo.startsWith('Seleziona')) operaTitolo = '';
        }

        if (!getVal('concetto-parola')) {
            showToast("La parola chiave è obbligatoria", "error");
            return;
        }

        const concettoData = {
            parola: getVal('concetto-parola'),
            parola_en: getVal('concetto-parola-en'),
            
            definizione: getVal('concetto-definizione'),
            definizione_en: getVal('concetto-definizione-en'),
            
            citazione: getVal('concetto-citazione') || getVal('concetto-esempio'),
            
            autore_riferimento_id: autoreId,
            opera_riferimento_id: operaId,
            
            autore_riferimento_nome: autoreNome,
            opera_riferimento_titolo: operaTitolo,
            
            periodo_storico: getVal('concetto-periodo'),
            evoluzione_storica: getVal('concetto-evoluzione'),
            
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        const database = window.db || db; 

        if (id && id.trim() !== '') {
            await database.collection('concetti').doc(id).update(concettoData);
            showToast('Concetto aggiornato con successo', 'success');
        } else {
            await database.collection('concetti').add(concettoData);
            showToast('Nuovo concetto salvato!', 'success');
        }

        const form = document.getElementById('concetto-form');
        if (form) form.reset();
        document.getElementById('concetto-id').value = '';

        if (typeof closeModal === 'function') closeModal('add-concetto-modal');

        if (typeof loadConcettiList === 'function') loadConcettiList();
        else if (typeof loadAdminConcetti === 'function') loadAdminConcetti();
        else if (typeof loadConcetti === 'function') loadConcetti();

    } catch (error) {
        console.error("Errore salvataggio concetto:", error);
        showToast("Errore: " + error.message, "error");
    }
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

// ==========================================
// MENU A TENDINA E FORM FUNCTIONS
// ==========================================

function updateAllSelects() {
    console.log("🔄 Aggiornamento menu a tendina...");

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

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log("🚀 Avvio Aeterna Lexicon...");

    try {
        loadLocalData();
        if (typeof applyTranslations === 'function') applyTranslations();
        if (typeof updateLangButton === 'function') updateLangButton();
        if (typeof showScreen === 'function') showScreen('home-screen');
        if (typeof handleUrlParameters === 'function') handleUrlParameters();
        if (typeof setupBackButtonHandler === 'function') setupBackButtonHandler();
        if (typeof checkOnlineStatus === 'function') checkOnlineStatus();
        if (typeof detectAndShowInstallInstructions === 'function') detectAndShowInstallInstructions();
    } catch (e) { console.warn("Errore init UI:", e); }

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

    setTimeout(async () => {
        if (typeof initRemoteControl === 'function') initRemoteControl();
        if (typeof registerServiceWorker === 'function') registerServiceWorker();

        if (window.firebaseInitialized || window.db) {
            try {
                console.log("📥 Inizio download dati...");
                
                await loadFirebaseData('filosofi');
                await Promise.all([
                    loadFirebaseData('opere'),
                    loadFirebaseData('concetti')
                ]);
                
                console.log("✅ Dati scaricati. Aggiornamento UI...");

                updateAllSelects(); 
                if (typeof initMap === 'function') initMap();
                if (typeof loadMapMarkers === 'function') loadMapMarkers();

                loadFilosofi();
                loadOpere();
                loadConcetti();
                
                if(document.getElementById('admin-panel') && document.getElementById('admin-panel').style.display !== 'none') {
                    showAdminPanel();
                }

            } catch (error) {
                console.warn("⚠️ Errore caricamento dati remoti:", error);
            }
        }
    }, 100);

    const fForm = document.getElementById('filosofo-form');
    if(fForm) fForm.onsubmit = saveFilosofo;
    
    const oForm = document.getElementById('opera-form');
    if(oForm) oForm.onsubmit = saveOpera;
    
    const cForm = document.getElementById('concetto-form');
    if(cForm) cForm.onsubmit = saveConcetto;

    const navMap = document.getElementById('nav-map');
    if (navMap) {
        navMap.addEventListener('click', function() {
            setTimeout(() => {
                if (window.map) window.map.invalidateSize();
            }, 200);
        });
    }
    
    if (typeof ExcelWorker !== 'undefined') {
        console.log('✅ ExcelWorker pronto');
    }
});

// ==========================================
// EXPORT FUNCTIONS
// ==========================================

window.openComparativeAnalysis = openComparativeAnalysis;
window.closeComparativeAnalysis = closeComparativeAnalysis;
window.exportAnalysisToExcel = exportAnalysisToExcel;
window.shareAnalysis = shareAnalysis;
window.hasComparativeAnalysis = hasComparativeAnalysis;