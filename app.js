/**
 * AETERNA LEXICON IN MOTU - APP.JS (FIXED UI & ADMIN)
 * Project Work Filosofico - Dataset per analisi trasformazioni linguistiche
 * Versione 3.3.0 - Fix Splash Screen, PWA & Import/Export
 */

// ==================== VARIABILI DI STATO ====================
let currentScreen = 'home-screen'; // Tiene traccia della schermata attuale
let previousScreen = null;         // Per gestire il 'torna indietro'

// Dati Filosofici
let filosofiData = [];
let opereData = [];
let concettiData = [];
let currentFilter = 'all';

// Mappa Filosofica
let philosophicalMap = null;

// Mappa Concettuale
let networkInstance = null;

// PWA Installation
let deferredPrompt = null;


// ==================== INIZIALIZZAZIONE APP (FIXED) ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📚 Aeterna Lexicon - Avvio...');
    
    // 1. GESTIONE SPLASH SCREEN (Sblocco interfaccia)
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            // Aggiunge la classe .hidden per l'animazione CSS
            splash.classList.add('hidden');
            
            // Dopo 0.5s rimuove fisicamente l'elemento
            setTimeout(() => {
                splash.style.display = 'none';
            }, 500);
        } else {
            console.warn("Splash screen non trovato nell'HTML");
        }
        
        // Controlli di avvio interfaccia
        if(typeof checkMaintenanceMode === 'function') checkMaintenanceMode();
        showScreen('home-screen');
        if(typeof handleUrlParameters === 'function') handleUrlParameters();
        
        console.log('✅ Interfaccia Sbloccata');
    }, 2000); // Attesa di 2 secondi per vedere il logo
    
    // 2. CARICAMENTO DATI FIREBASE
    if (window.initializeFirebase) window.initializeFirebase();
    
    // Carica dataset
    await loadPhilosophicalData();
    
    // Setup listeners di base
    if (typeof setupConnectionListeners === 'function') setupConnectionListeners();
    
    // 3. ATTIVAZIONE IMPORT EXCEL (Fondamentale per Admin)
    // Questo attiva i listener sui pulsanti di importazione file
    if (typeof setupImportListeners === 'function') setupImportListeners();
});


// ==================== GESTIONE NAVIGAZIONE (FIXED) ====================

function showScreen(screenId) {
    // Nascondi tutte le schermate
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; // Importante per forzare il layout
    });
    
    const target = document.getElementById(screenId);
    if (target) {
        // Aggiorna lo stato per il pulsante indietro
        if (screenId !== currentScreen) {
            previousScreen = currentScreen;
        }
        currentScreen = screenId;

        // Mostra la nuova schermata
        target.classList.add('active');
        target.style.display = 'flex';
        
        // Aggiorna tab bar (barra in basso)
        updateTabBar(screenId);
        
        // Carica dati specifici se necessario
        loadScreenData(screenId);
        
        // Scroll in cima
        if(document.querySelector('.content-area')) {
             document.querySelector('.content-area').scrollTop = 0;
        }
        window.scrollTo(0,0);
    }
}

function goBack() {
    // Logica intelligente per tornare indietro
    if (currentScreen === 'home-screen') return;

    // Se siamo in un dettaglio, torniamo alla lista corretta
    if (currentScreen === 'filosofo-detail-screen') {
        showScreen('filosofi-screen');
    } else if (currentScreen === 'opera-detail-screen') {
        showScreen('opere-screen');
    } else if (currentScreen === 'concetto-detail-screen') {
        showScreen('concetti-screen');
    } else if (previousScreen && previousScreen !== currentScreen) {
        // Se c'è una storia precedente valida
        showScreen(previousScreen);
    } else {
        // Fallback sicuro alla home
        showScreen('home-screen');
    }
}

function updateTabBar(screenId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-target') === screenId) {
            btn.classList.add('active');
        }
    });
}

function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const screen = urlParams.get('screen');
    if (screen) {
        const map = {
            'filosofi': 'filosofi-screen',
            'opere': 'opere-screen',
            'concetti': 'concetti-screen',
            'mappa': 'mappa-screen',
            'analisi': 'comparative-analysis-modal' // Gestione speciale per modale
        };
        if (map[screen] && map[screen] !== 'comparative-analysis-modal') {
            showScreen(map[screen]);
        }
    }
}
// ==================== GESTIONE MENU & MODALI (FIXED) ====================

// Apre/Chiude il menu laterale
function toggleMenuModal() {
    const modal = document.getElementById('top-menu-modal');
    if (modal) {
        // Se è 'flex' o vuoto (visualizzato), nascondi. Altrimenti mostra.
        const isVisible = window.getComputedStyle(modal).display === 'flex';
        modal.style.display = isVisible ? 'none' : 'flex';
    }
}

// Chiude esplicitamente il menu
function closeMenuModal(event) {
    // Se chiamato da un evento click sull'overlay, verifica che non sia sul contenuto
    if (event && event.target && !event.target.classList.contains('modal-overlay') && !event.target.classList.contains('modal-btn')) {
        // Se clicco dentro il contenuto bianco ma non su un bottone, non chiudere (opzionale)
        // Ma per semplicità, chiudiamo se clicco sulla X o sull'overlay
        if(!event.target.closest('.close-btn')) return; 
    }
    
    const modal = document.getElementById('top-menu-modal');
    if (modal) modal.style.display = 'none';
}

// Info & Credits
function openCreditsScreen() {
    document.getElementById('top-menu-modal').style.display = 'none';
    showScreen('credits-screen');
}

// Segnalazioni
function openReportScreen() {
    document.getElementById('top-menu-modal').style.display = 'none';
    showScreen('segnalazioni-screen');
}

// ==================== GESTIONE QR CODE (FIXED) ====================

function openQRModal() {
    // Chiudi il menu prima
    document.getElementById('top-menu-modal').style.display = 'none';
    
    const modal = document.getElementById('qr-modal');
    const container = document.getElementById('qrcode-container');
    
    if (modal && container) {
        container.innerHTML = ''; // Pulisci QR precedenti
        
        // Genera QR Code
        new QRCode(container, {
            text: window.location.href,
            width: 200,
            height: 200,
            colorDark : "#000000",
            colorLight : "#ffffff",
            correctLevel : QRCode.CorrectLevel.H
        });
        
        modal.style.display = 'flex';
    }
}

function closeQRModal() {
    const modal = document.getElementById('qr-modal');
    if (modal) modal.style.display = 'none';
}

// ==================== GESTIONE ADMIN & AUTH (FIREBASE REALE) ====================

// 1. APERTURA PANNELLO
function openAdminPanel() {
    // Chiudi il menu laterale se aperto
    if (typeof closeMenuModal === 'function') closeMenuModal();

    // Controlla se l'utente è già loggato in Firebase
    const user = firebase.auth().currentUser;
    
    // Se sei loggato E la mail è quella dell'amministratore
    if (user && user.email === 'derolu0@gmail.com') {
        console.log("Utente già loggato, accesso diretto.");
        showScreen('admin-panel');
        
        // Carica subito i dati e le statistiche
        loadAllAdminData();
    } else {
        // Altrimenti apri la schermata di Login
        const authScreen = document.getElementById('admin-auth');
        if (authScreen) {
            authScreen.style.display = 'flex';
            // Pulisci i campi
            document.getElementById('admin-email').value = ''; 
            document.getElementById('admin-password').value = '';
            document.getElementById('auth-error').style.display = 'none';
        }
    }
}

// 2. CHIUSURA LOGIN (ANNULLA)
function closeAdminAuth() {
    const authScreen = document.getElementById('admin-auth');
    if (authScreen) authScreen.style.display = 'none';
}

// 3. CHIUSURA PANNELLO ADMIN
function closeAdminPanel() {
    showScreen('home-screen');
}

// 4. LOGIN CON FIREBASE (Click su "Accedi")
function checkAdminAuth() {
    const emailField = document.getElementById('admin-email');
    const passField = document.getElementById('admin-password');
    const errorMsg = document.getElementById('auth-error');

    const email = emailField ? emailField.value.trim() : '';
    const pass = passField ? passField.value : '';

    // Validazione base
    if (!email || !pass) {
        if(errorMsg) {
            errorMsg.style.display = 'block';
            errorMsg.textContent = "Inserisci email e password.";
        }
        return;
    }

    showToast("Verifica credenziali in corso...", "info");

    // Login Reale Firebase
    firebase.auth().signInWithEmailAndPassword(email, pass)
        .then((userCredential) => {
            const user = userCredential.user;

            // CONTROLLO DI SICUREZZA: Solo la tua mail può entrare
            if (user.email === 'derolu0@gmail.com') {
                // Login OK
                closeAdminAuth();
                showScreen('admin-panel');
                loadAllAdminData();
                showToast("Bentornato Salvatore", "success");
            } else {
                // Intruso: Logout immediato
                firebase.auth().signOut();
                if(errorMsg) {
                    errorMsg.style.display = 'block';
                    errorMsg.textContent = "Accesso non autorizzato.";
                }
                showToast("Accesso Negato", "error");
            }
        })
        .catch((error) => {
            console.error("Login Error:", error);
            if(errorMsg) {
                errorMsg.style.display = 'block';
                errorMsg.textContent = "Email o Password errata.";
            }
        });
}

// 5. LOGOUT
function logoutAdmin() {
    firebase.auth().signOut().then(() => {
        showScreen('home-screen');
        showToast("Logout effettuato", "info");
    }).catch((error) => {
        console.error("Errore logout", error);
    });
}

// 6. FUNZIONI DI CARICAMENTO DATI ADMIN
function loadAllAdminData() {
    // Carica le tabelle se le funzioni esistono
    if(typeof loadAdminFilosofi === 'function') loadAdminFilosofi();
    if(typeof loadAdminOpere === 'function') loadAdminOpere();
    if(typeof loadAdminConcetti === 'function') loadAdminConcetti();
    
    // Aggiorna i contatori della Dashboard
    updateAdminStats();
}

function updateAdminStats() {
    // Aggiorna solo gli elementi che esistono davvero nell'HTML
    const elFilosofi = document.getElementById('total-filosofi');
    const elOpere = document.getElementById('total-opere');
    const elConcetti = document.getElementById('total-concetti');

    if (elFilosofi && typeof filosofiData !== 'undefined') elFilosofi.textContent = filosofiData.length;
    if (elOpere && typeof opereData !== 'undefined') elOpere.textContent = opereData.length;
    if (elConcetti && typeof concettiData !== 'undefined') elConcetti.textContent = concettiData.length;
}

// 7. GESTIONE TAB DEL PANNELLO
function switchAdminTab(tabId) {
    // Rimuovi classe active da tutti i bottoni e contenuti
    document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.style.display = 'none');
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));

    // Attiva quello giusto
    const btn = document.querySelector(`button[onclick="switchAdminTab('${tabId}')"]`);
    if(btn) btn.classList.add('active');

    const content = document.getElementById(tabId);
    if (content) {
        content.style.display = 'block';
        content.classList.add('active');
    }
}

// Esposizione globale necessaria per l'HTML
window.switchAdminTab = switchAdminTab;
window.checkAdminAuth = checkAdminAuth;
window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.closeAdminAuth = closeAdminAuth;
window.logoutAdmin = logoutAdmin;

// ==================== DATI FILOSOFICI ====================

async function loadPhilosophicalData() {
    try {
        console.log('📖 Caricamento dataset filosofico...');
        
        // Carica da Firebase o dati locali
        await Promise.all([
            loadFilosofi(),
            loadOpere(),
            loadConcetti()
        ]);
        
        console.log('✅ Dataset caricato:', {
            filosofi: filosofiData.length,
            opere: opereData.length,
            concetti: concettiData.length
        });
        
        // Inizializza mappe quando necessario
        if (document.getElementById('map')) {
            // initPhilosophicalMap sarà chiamato quando si apre la schermata mappa
        }
        
    } catch (error) {
        console.error('❌ Errore caricamento dati:', error);
        showToast('Errore nel caricamento dei dati filosofici', 'error');
        // Carica dati di esempio
        loadSampleData();
    }
}

// ==================== GESTIONE FILOSOFI ====================
async function loadFilosofi() {
    try {
        if (window.db && window.COLLECTIONS) {
            const snapshot = await window.db.collection(window.COLLECTIONS.FILOSOFI).get();
            filosofiData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } else {
            filosofiData = getSampleFilosofi();
        }
        renderFilosofiList();
    } catch (error) {
        console.error('Errore filosofi:', error);
        filosofiData = getSampleFilosofi();
        renderFilosofiList();
    }
}

function renderFilosofiList() {
    const container = document.getElementById('filosofi-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (filosofiData.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Nessun filosofo trovato</p></div>`;
        return;
    }
    
    // Applica filtro
    const filtered = currentFilter === 'all' 
        ? filosofiData 
        : filosofiData.filter(f => f.periodo === currentFilter);
    
    filtered.forEach(filosofo => {
        container.appendChild(createFilosofoCard(filosofo));
    });
}

// FUNZIONE AGGIUNTA/AGGIORNATA: Genera il pulsante della mappa nella card
function generateMapButton(filosofo) {
    // Controllo rigoroso se le coordinate esistono
    if (filosofo.coordinate && 
        typeof filosofo.coordinate.lat !== 'undefined' && 
        typeof filosofo.coordinate.lng !== 'undefined') {
        
        // Passiamo i dati grezzi alla funzione, non l'oggetto, per evitare errori di stringify
        return `
            <button class="action-btn map-btn" 
                onclick="goToMapLocation(${filosofo.coordinate.lat}, ${filosofo.coordinate.lng}, '${filosofo.nome.replace(/'/g, "\\'")}')">
                <i class="fas fa-map-marker-alt"></i> Vedi Luogo
            </button>
        `;
    }
    return '<button class="action-btn disabled" disabled><i class="fas fa-map-slash"></i> Luogo non disponibile</button>';
}

function createFilosofoCard(filosofo) {
    const card = document.createElement('div');
    card.className = 'grid-item';
    card.classList.add(`border-${filosofo.periodo === 'contemporaneo' ? 'contemporary' : 'classic'}`);
    
    card.innerHTML = `
        <div class="item-image-container">
            ${filosofo.immagine ? 
                `<img src="${filosofo.immagine}" alt="${filosofo.nome}" class="item-image" 
                     onerror="this.src='https://derolu0.github.io/aeterna/images/default-filosofo.jpg'">` :
                `<div class="image-fallback">👤</div>`
            }
        </div>
        <div class="item-content">
            <h3 class="item-name">${filosofo.nome}</h3>
            <div class="item-details">
                <div><strong>Periodo:</strong> ${getPeriodoLabel(filosofo.periodo)}</div>
                <div><strong>Scuola:</strong> ${filosofo.scuola || 'N/D'}</div>
            </div>
            <div class="item-footer">
                <span class="item-periodo periodo-${filosofo.periodo}">
                    ${filosofo.periodo === 'contemporaneo' ? 'CONTEMPORANEO' : 'CLASSICO'}
                </span>
                ${generateMapButton(filosofo)}
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => showFilosofoDetail(filosofo.id));
    return card;
}

function setFilter(filter) {
    currentFilter = filter;
    // Aggiorna UI bottoni
    document.querySelectorAll('#filosofi-screen .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((filter === 'all' && btn.classList.contains('all')) || 
            (filter === 'classico' && btn.classList.contains('funzionante')) ||
            (filter === 'contemporaneo' && btn.classList.contains('non-funzionante'))) {
            btn.classList.add('active');
        }
    });
    renderFilosofiList();
}

function showFilosofoDetail(id) {
    const filosofo = filosofiData.find(f => f.id === id);
    if (!filosofo) return;
    
    const content = document.getElementById('filosofo-detail-content');
    if (!content) return;
    
    content.innerHTML = `
        <div class="detail-header">
            <h1 class="detail-name">${filosofo.nome}</h1>
            <div class="detail-meta-grid">
                <div class="meta-item"><strong>Periodo:</strong> ${getPeriodoLabel(filosofo.periodo)}</div>
                <div class="meta-item"><strong>Anni:</strong> ${filosofo.anni || 'N/D'}</div>
                <div class="meta-item"><strong>Scuola:</strong> ${filosofo.scuola || 'N/D'}</div>
            </div>
        </div>
        <div class="detail-info">
            <h3>Biografia</h3>
            <p class="biography-text">${filosofo.biografia || 'Nessuna biografia disponibile.'}</p>
        </div>
        ${filosofo.concetti_principali ? `
        <div class="detail-info">
            <h3>Concetti Principali</h3>
            <div class="tags-cloud">
                ${filosofo.concetti_principali.map(c => `<span class="tag-chip">${c}</span>`).join('')}
            </div>
        </div>` : ''}
        ${filosofo.coordinate && typeof filosofo.coordinate.lat !== 'undefined' ? `
        <div class="action-buttons-container">
            <button class="btn-analisi" onclick="goToMapLocation(${filosofo.coordinate.lat}, ${filosofo.coordinate.lng}, '${filosofo.nome.replace(/'/g, "\\'")}')">
                <i class="fas fa-map-marker-alt"></i> Vedi sulla Mappa
            </button>
        </div>` : ''}
    `;
    
    showScreen('filosofo-detail-screen');
}

// ==================== FUNZIONE GLOBALE PER NAVIGAZIONE MAPPA ====================
// FUNZIONE AGGIUNTA: Naviga alla mappa con coordinate specifiche
window.goToMapLocation = function(lat, lng, nome) {
    console.log(`🗺️ Navigazione verso: ${nome} [${lat}, ${lng}]`);
    
    // 1. Cambia schermata (attiva il tab mappa o nasconde le altre sezioni)
    // Sostituisci 'mappa-screen' con l'ID reale del tuo div mappa se diverso
    if (typeof showScreen === 'function') {
        showScreen('mappa-screen'); 
    } else {
        // Fallback manuale se showScreen non esiste
        document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
        document.getElementById('mappa-screen').style.display = 'block';
    }

    // 2. Chiudi eventuali modali aperti (dettagli filosofo)
    const detailModal = document.getElementById('detail-modal');
    if (detailModal) detailModal.style.display = 'none';

    // 3. Muovi la mappa
    // Assumiamo che la variabile globale della mappa si chiami 'map' o 'window.map'
    const mapInstance = window.map || window.philosophicalMap;
    
    if (mapInstance) {
        // Leaflet: flyTo crea un'animazione fluida
        mapInstance.flyTo([lat, lng], 10, {
            duration: 1.5 // Durata animazione in secondi
        });

        // 4. Apri il popup del marker corrispondente (opzionale ma professionale)
        // Cerca tra i marker quello con le stesse coordinate
        if (window.markersLayer) { // Se usi un LayerGroup
            window.markersLayer.eachLayer(function(layer) {
                const lLat = layer.getLatLng().lat;
                const lLng = layer.getLatLng().lng;
                // Confronto approssimato per float
                if (Math.abs(lLat - lat) < 0.0001 && Math.abs(lLng - lng) < 0.0001) {
                    layer.openPopup();
                }
            });
        }
    } else {
        console.error("❌ Errore: Istanza mappa non trovata. Controlla inizializzazione Leaflet.");
        alert("Errore: Mappa non inizializzata correttamente.");
    }
};

// ==================== GESTIONE OPERE ====================
async function loadOpere() {
    try {
        if (window.db && window.COLLECTIONS) {
            const snapshot = await window.db.collection(window.COLLECTIONS.OPERE).get();
            opereData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
            opereData = getSampleOpere();
        }
        renderOpereList();
    } catch (error) {
        opereData = getSampleOpere();
        renderOpereList();
    }
}

function renderOpereList() {
    const container = document.getElementById('opere-list');
    if (!container) return;
    container.innerHTML = '';
    
    opereData.forEach(opera => {
        container.appendChild(createOperaCard(opera));
    });
}

function createOperaCard(opera) {
    const card = document.createElement('div');
    card.className = 'compact-item';
    card.classList.add(`border-${opera.periodo === 'contemporaneo' ? 'contemporary' : 'classic'}`);
    
    card.innerHTML = `
        <div class="compact-item-image-container">
            <div class="compact-image-fallback">📖</div>
        </div>
        <div class="compact-item-content">
            <div class="compact-item-header">
                <h3 class="compact-item-name">${opera.titolo}</h3>
            </div>
            <div class="compact-item-autore"><i class="fas fa-user-pen"></i> ${opera.autore || 'Autore sconosciuto'}</div>
            <div class="compact-item-footer">
                <span class="compact-item-anno">${opera.anno || 'N/D'}</span>
                <span class="compact-item-periodo periodo-${opera.periodo}">${opera.periodo === 'contemporaneo' ? 'CONTEMP.' : 'CLASSICO'}</span>
            </div>
        </div>
    `;
    card.addEventListener('click', () => showOperaDetail(opera.id));
    return card;
}

function showOperaDetail(id) {
    const opera = opereData.find(o => o.id === id);
    if (!opera) return;
    
    const content = document.getElementById('opera-detail-content');
    content.innerHTML = `
        <div class="detail-header">
            <h1 class="detail-name">${opera.titolo}</h1>
            <p><strong>Autore:</strong> ${opera.autore}</p>
            <p><strong>Anno:</strong> ${opera.anno}</p>
        </div>
        <div class="detail-info">
            <h3>Sintesi</h3>
            <p class="biography-text">${opera.sintesi || 'Sintesi non disponibile.'}</p>
        </div>
        ${opera.pdf ? `
        <div class="action-buttons-container">
            <button class="btn-analisi" onclick="window.open('${opera.pdf}', '_blank')">Apri PDF</button>
        </div>` : ''}
    `;
    showScreen('opera-detail-screen');
}

// ==================== GESTIONE CONCETTI ====================
async function loadConcetti() {
    try {
        if (window.db && window.COLLECTIONS) {
            const snapshot = await window.db.collection(window.COLLECTIONS.CONCETTI).get();
            concettiData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } else {
            concettiData = getSampleConcetti();
        }
        renderConcettiList();
    } catch (error) {
        concettiData = getSampleConcetti();
        renderConcettiList();
    }
}

function renderConcettiList() {
    const container = document.getElementById('concetti-list');
    if (!container) return;
    container.innerHTML = '';
    
    if (concettiData.length > 0) {
        container.appendChild(createConcettiSection('Tutti i Concetti', concettiData, 'entrambi'));
    }
}

function createConcettiSection(title, concetti, periodo) {
    const section = document.createElement('div');
    section.className = 'concetti-section';
    
    section.innerHTML = `
        <div class="section-header"><h3>${title}</h3><span class="section-count">${concetti.length}</span></div>
        <div class="concetti-grid">
            ${concetti.map(c => createConcettoCardString(c)).join('')}
        </div>
    `;
    return section;
}

function createConcettoCardString(concetto) {
    // Nota: Uso stringa qui per semplicità nell'iniezione
    return `
    <div class="concetto-card border-${concetto.periodo === 'contemporaneo' ? 'contemporary' : 'classic'}" onclick="showConcettoDetail('${concetto.id}')">
        <div class="concetto-header">
            <h3 class="concetto-parola">${concetto.parola}</h3>
        </div>
        <p class="concetto-definizione">${concetto.definizione || ''}</p>
        <div class="concetto-actions">
            <button class="btn-analisi small" onclick="event.stopPropagation(); openComparativeAnalysis('${concetto.parola}')">Analisi</button>
        </div>
    </div>
    `;
}

function showConcettoDetail(id) {
    const concetto = concettiData.find(c => c.id === id);
    if (!concetto) return;
    
    const content = document.getElementById('concetto-detail-content');
    content.innerHTML = `
        <div class="detail-header">
            <h1 class="detail-name">${concetto.parola}</h1>
            <div class="detail-meta-grid">
                <div class="meta-item"><strong>Periodo:</strong> ${getPeriodoLabel(concetto.periodo)}</div>
            </div>
        </div>
        <div class="detail-info">
            <h3>Definizione</h3>
            <p>${concetto.definizione}</p>
        </div>
        ${concetto.evoluzione ? `
        <div class="detail-info">
            <h3>Evoluzione</h3>
            <p>${concetto.evoluzione}</p>
        </div>` : ''}
        <div class="action-buttons-container">
            <button class="btn-analisi" onclick="openComparativeAnalysis('${concetto.parola}')">Analisi Comparativa</button>
        </div>
    `;
    showScreen('concetto-detail-screen');
}

// ==================== MAPPA GEOGRAFICA ====================
function initPhilosophicalMap() {
    if (!document.getElementById('map')) return;
    if (philosophicalMap) return; // Già inizializzata
    
    try {
        philosophicalMap = L.map('map').setView([41.8719, 12.5674], 5);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(philosophicalMap);
        
        updateMapWithPhilosophers();
    } catch (error) {
        console.error('Errore mappa:', error);
    }
}

function updateMapWithPhilosophers() {
    if (!philosophicalMap) return;
    
    // Crea un layer per i marker
    window.markersLayer = L.layerGroup().addTo(philosophicalMap);
    
    filosofiData.forEach(filosofo => {
        if (filosofo.coordinate && filosofo.coordinate.lat && filosofo.coordinate.lng) {
            const { lat, lng } = filosofo.coordinate;
            const marker = L.marker([lat, lng])
                .addTo(window.markersLayer)
                .bindPopup(`<b>${filosofo.nome}</b><br>${filosofo.scuola || ''}<br>${filosofo.anni || ''}`);
            
            // Aggiungi gestore click per aprire dettaglio
            marker.on('click', () => {
                showFilosofoDetail(filosofo.id);
            });
        }
    });
}

// ==================== MAPPA CONCETTUALE (FIXED) ====================
// FUNZIONE SOSTITUITA: Inizializzazione mappa concettuale robusta
async function initConceptMap() {
    const container = document.getElementById('concept-network');
    const loadingEl = document.getElementById('map-loading'); // Assicurati di avere questo ID nell'HTML o rimuovi la riga
    
    if (!container) return; // Se non siamo nella schermata giusta, esci

    if(loadingEl) loadingEl.style.display = 'flex';

    try {
        // 1. RECUPERO DATI (Fondamentale per la traccia: deve essere dinamico)
        // Se hai già concettiData caricato globalmente usalo, altrimenti fetch
        let concetti = window.concettiData || [];
        if (concetti.length === 0 && window.db) {
            console.log("📥 Caricamento concetti da Firebase per la mappa...");
            const snapshot = await window.db.collection('concetti').get();
            concetti = snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}));
        }

        if (concetti.length === 0) {
            if(loadingEl) loadingEl.style.display = 'none';
            container.innerHTML = '<p style="text-align:center; padding:20px;">Nessun concetto nel dataset per generare la mappa.</p>';
            return;
        }

        // 2. CREAZIONE NODI E CONNESSIONI (Logica Filosofica)
        const nodes = new vis.DataSet();
        const edges = new vis.DataSet();
        
        concetti.forEach(c => {
            // Nodo Concetto
            nodes.add({
                id: c.id,
                label: c.parola,
                group: c.periodo || 'undefined', // Colorazione per periodo (richiesta traccia)
                title: `Definizione: ${c.definizione || 'N/D'}`, // Tooltip
                value: 20 // Grandezza base
            });

            // Se il concetto ha un autore di riferimento, crea un collegamento
            if (c.autore_riferimento) {
                // Cerchiamo se esiste già un nodo autore, altrimenti lo creiamo (opzionale, per ora colleghiamo solo concetti)
                // Per la traccia, è utile collegare concetti dello stesso autore o periodo
            }
        });

        // Creiamo collegamenti fittizi basati sul periodo per mostrare "Relazioni" (Critico per la traccia)
        // Collega concetti dello stesso periodo
        for (let i = 0; i < concetti.length; i++) {
            for (let j = i + 1; j < concetti.length; j++) {
                if (concetti[i].periodo === concetti[j].periodo) {
                    edges.add({
                        from: concetti[i].id,
                        to: concetti[j].id,
                        arrows: false,
                        color: { opacity: 0.2 } // Collegamento tenue
                    });
                }
            }
        }

        // 3. CONFIGURAZIONE VIS.JS (Non semplificata)
        const data = { nodes: nodes, edges: edges };
        const options = {
            nodes: {
                shape: 'dot',
                font: { size: 14, color: '#1f2937', face: 'Inter' },
                borderWidth: 2
            },
            groups: {
                classico: { color: { background: '#10b981', border: '#059669' } },
                contemporaneo: { color: { background: '#f59e0b', border: '#d97706' } },
                entrambi: { color: { background: '#8b5cf6', border: '#7c3aed' } }
            },
            physics: {
                stabilization: false, // Disattivato per caricamento veloce, poi si muove
                barnesHut: {
                    gravitationalConstant: -2000,
                    springConstant: 0.04,
                    springLength: 95
                }
            },
            interaction: { hover: true, tooltipDelay: 200 }
        };

        // 4. DISEGNO
        if (networkInstance) networkInstance.destroy(); // Pulisci vecchia istanza
        networkInstance = new vis.Network(container, data, options);
        
        // Evento Click (per aprire dettaglio concetto)
        networkInstance.on("click", function (params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                // Qui dovresti chiamare la funzione che apre il dettaglio concetto
                if(window.openConcettoDetail) window.openConcettoDetail(nodeId);
            }
        });

        console.log("✅ Mappa concettuale generata con nodi:", nodes.length);

    } catch (error) {
        console.error("❌ Errore generazione mappa:", error);
        container.innerHTML = '<p style="color:red; text-align:center;">Errore visualizzazione mappa.</p>';
    } finally {
        if(loadingEl) loadingEl.style.display = 'none';
    }
}

// ==================== ANALISI COMPARATIVA ====================
function openComparativeAnalysis(termine) {
    const modal = document.getElementById('comparative-analysis-modal');
    if (!modal) {
        showToast('Analisi non disponibile', 'info');
        return;
    }
    
    document.getElementById('comparative-term-title').textContent = termine.toUpperCase();
    modal.style.display = 'flex';
}

function closeComparativeModal() {
    document.getElementById('comparative-analysis-modal').style.display = 'none';
}

// ==================== RICERCA ====================
function searchFilosofi(query) {
    const term = query.toLowerCase();
    const items = document.querySelectorAll('#filosofi-list .grid-item');
    items.forEach(item => {
        const name = item.querySelector('.item-name').textContent.toLowerCase();
        item.style.display = name.includes(term) ? 'flex' : 'none';
    });
}

function searchOpere(query) {
    const term = query.toLowerCase();
    const items = document.querySelectorAll('#opere-list .compact-item');
    items.forEach(item => {
        const title = item.querySelector('.compact-item-name').textContent.toLowerCase();
        item.style.display = title.includes(term) ? 'flex' : 'none';
    });
}

// ==================== UTILITY & HELPERS ====================
function getPeriodoLabel(periodo) {
    const labels = {
        'classico': 'Classico/Antico',
        'medioevale': 'Medioevale',
        'rinascimentale': 'Rinascimentale',
        'moderno': 'Moderno',
        'contemporaneo': 'Contemporaneo',
        'entrambi': 'Transperiodale'
    };
    return labels[periodo] || periodo;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

function loadScreenData(screenId) {
    if (screenId === 'mappa-screen') {
        setTimeout(initPhilosophicalMap, 200);
    } else if (screenId === 'mappa-concettuale-screen') {
        setTimeout(initConceptMap, 200);
    }
}

function checkMaintenanceMode() {
    const maintenance = localStorage.getItem('maintenance_mode');
    const element = document.getElementById('maintenance-mode');
    if (element) {
        element.style.display = maintenance === 'true' ? 'flex' : 'none';
    }
}
// ==================== DATI DI ESEMPIO (FALLBACK) ====================
function getSampleFilosofi() {
    return [
        { 
            id: "F1", 
            nome: "Platone", 
            periodo: "classico", 
            scuola: "Accademia", 
            anni: "428-348 a.C.", 
            biografia: "Filosofo greco...", 
            concetti_principali: ["Idea", "Bene"],
            coordinate: { lat: 37.9838, lng: 23.7275 } // Atene
        },
        { 
            id: "F2", 
            nome: "Nietzsche", 
            periodo: "contemporaneo", 
            scuola: "Continental", 
            anni: "1844-1900", 
            biografia: "Filosofo tedesco...", 
            concetti_principali: ["Oltreuomo"],
            coordinate: { lat: 51.2277, lng: 6.7735 } // Röcken
        }
    ];
}

function getSampleOpere() {
    return [
        { id: "O1", title: "Repubblica", autore: "Platone", periodo: "classico" }
    ];
}

function getSampleConcetti() {
    return [
        { id: "C1", parola: "Verità", periodo: "entrambi", definizione: "Corrispondenza..." }
    ];
}

function loadSampleData() {
    filosofiData = getSampleFilosofi();
    opereData = getSampleOpere();
    concettiData = getSampleConcetti();
    renderFilosofiList();
    renderOpereList();
    renderConcettiList();
}

// ==========================================
// LOGICA PANNELLO ADMIN (COPIA-INCOLLA TOTALE)
// ==========================================

// 1. APERTURA E CHIUSURA PANNELLO
function showAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if(panel) {
        panel.style.display = 'flex';
        // Aggiorna statistiche
        updateAdminStats();
        // Aggiorna liste a tendina
        updateAllSelects();
    }
}
// Alias per compatibilità
window.openAdminPanel = showAdminPanel;

function closeAdminPanel() {
    const panel = document.getElementById('admin-panel');
    if(panel) panel.style.display = 'none';
}

// 2. CAMBIO SCHEDE (TABS)
function switchAdminTab(tabId) {
    // Nascondi tutti i contenuti
    document.querySelectorAll('.admin-tab-content').forEach(el => {
        el.style.display = 'none';
        el.classList.remove('active');
    });
    
    // Disattiva tutti i bottoni
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Mostra contenuto target
    const target = document.getElementById(tabId);
    if(target) {
        target.style.display = 'block';
        target.classList.add('active');
    }

    // Attiva bottone (cerchiamo quello che ha l'onclick corrispondente)
    const btns = document.querySelectorAll('.admin-tab-btn');
    btns.forEach(btn => {
        if(btn.getAttribute('onclick').includes(tabId)) {
            btn.classList.add('active');
        }
    });
}

// 3. AGGIORNAMENTO STATISTICHE DASHBOARD
async function updateAdminStats() {
    if(!window.db) return;
    try {
        const fil = await window.db.collection('filosofi').get();
        const op = await window.db.collection('opere').get();
        const conc = await window.db.collection('concetti').get();
        
        document.getElementById('total-filosofi').innerText = fil.size;
        document.getElementById('total-opere').innerText = op.size;
        document.getElementById('total-concetti').innerText = conc.size;
    } catch(e) { console.log("Statistiche non disponibili offline"); }
}

// 4. POPOLAMENTO MENU A TENDINA (AUTORI)
async function updateAllSelects() {
    const selects = ['opera-autore', 'concetto-autore'];
    if(!window.db) return;
    
    try {
        const snapshot = await window.db.collection('filosofi').get();
        const filosofi = [];
        snapshot.forEach(doc => filosofi.push({id: doc.id, ...doc.data()}));
        
        // Ordina A-Z
        filosofi.sort((a,b) => a.nome.localeCompare(b.nome));
        
        selects.forEach(id => {
            const select = document.getElementById(id);
            if(select) {
                select.innerHTML = '<option value="">Seleziona...</option>';
                filosofi.forEach(f => {
                    const opt = document.createElement('option');
                    opt.value = f.id; // Salviamo l'ID del documento
                    opt.textContent = f.nome;
                    select.appendChild(opt);
                });
            }
        });
    } catch(e) { console.error("Errore caricamento select", e); }
}

// 5. SALVATAGGIO FILOSOFO
async function saveFilosofo(e) {
    e.preventDefault();
    const nome = document.getElementById('filosofo-nome').value;
    if(!nome) return alert("Inserisci almeno il nome!");

    const data = {
        nome: nome,
        periodo: document.getElementById('filosofo-periodo').value,
        scuola: document.getElementById('filosofo-scuola').value,
        anni_vita: document.getElementById('filosofo-anni').value,
        luogo_nascita: document.getElementById('filosofo-citta').value, // Semplificato
        biografia: document.getElementById('filosofo-biografia').value,
        concetti_principali: document.getElementById('filosofo-concetti').value.split(','),
        createdAt: new Date().toISOString()
    };
    
    // Gestione coordinate se inserite
    const lat = document.getElementById('filosofo-lat').value;
    const lng = document.getElementById('filosofo-lng').value;
    if(lat && lng) {
        data.coordinate = { lat: parseFloat(lat), lng: parseFloat(lng) };
    }

    try {
        await window.db.collection('filosofi').add(data);
        alert("Filosofo salvato con successo!");
        document.getElementById('filosofo-form').reset();
        updateAdminStats(); // Aggiorna contatori
        updateAllSelects(); // Aggiorna le tendine delle altre schede
    } catch(err) {
        alert("Errore salvataggio: " + err.message);
    }
}

// 6. SALVATAGGIO OPERA
async function saveOpera(e) {
    e.preventDefault();
    const titolo = document.getElementById('opera-titolo').value;
    const autoreId = document.getElementById('opera-autore').value;
    
    if(!titolo || !autoreId) return alert("Titolo e Autore obbligatori!");
    
    // Recupera nome autore dalla select
    const sel = document.getElementById('opera-autore');
    const autoreNome = sel.options[sel.selectedIndex].text;

    const data = {
        titolo: titolo,
        autore_id: autoreId,
        autore_nome: autoreNome,
        anno: document.getElementById('opera-anno').value,
        periodo: document.getElementById('opera-periodo').value,
        sintesi: document.getElementById('opera-sintesi').value,
        createdAt: new Date().toISOString()
    };

    try {
        await window.db.collection('opere').add(data);
        alert("Opera salvata!");
        document.getElementById('opera-form').reset();
        updateAdminStats();
    } catch(err) { alert("Errore: " + err.message); }
}

// 7. SALVATAGGIO CONCETTO
async function saveConcetto(e) {
    e.preventDefault();
    const parola = document.getElementById('concetto-parola').value;
    if(!parola) return alert("Parola chiave obbligatoria!");

    const data = {
        parola: parola,
        periodo: document.getElementById('concetto-periodo').value,
        autore_riferimento: document.getElementById('concetto-autore').value,
        definizione: document.getElementById('concetto-definizione').value,
        evoluzione: document.getElementById('concetto-evoluzione').value,
        createdAt: new Date().toISOString()
    };

    try {
        await window.db.collection('concetti').add(data);
        alert("Concetto salvato!");
        document.getElementById('concetto-form').reset();
        updateAdminStats();
    } catch(err) { alert("Errore: " + err.message); }
}

// ==================== PWA INSTALLATION LOGIC ====================
// La variabile 'deferredPrompt' è già dichiarata all'inizio del file.

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Blocca banner nativo
    deferredPrompt = e; // Salva evento
    
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
        banner.style.display = 'flex';
        console.log("📲 Banner PWA attivato");
    }
});

async function installPWA() {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Esito installazione: ${outcome}`);
    
    deferredPrompt = null;
    
    const banner = document.getElementById('pwa-install-banner');
    if(banner) banner.style.display = 'none';
}
// ==================== GESTIONE IMPORT / EXPORT (DATASET) ====================

// --- EXPORT (Scarica i dati in CSV/Excel) ---
function exportFilosofiToExcel() { exportToCSV('filosofi', filosofiData); }
function exportOpereToExcel() { exportToCSV('opere', opereData); }
function exportConcettiToExcel() { exportToCSV('concetti', concettiData); }

async function exportFullDataset() {
    showToast("Preparazione export completo...", "info");
    exportToCSV('filosofi', filosofiData);
    setTimeout(() => exportToCSV('opere', opereData), 1000);
    setTimeout(() => exportToCSV('concetti', concettiData), 2000);
}

function exportToCSV(filename, data) {
    if (!data || data.length === 0) {
        showToast(`Nessun dato da esportare per ${filename}`, "warning");
        return;
    }

    try {
        // Estrai le intestazioni
        const headers = Object.keys(data[0]);
        const csvRows = [];
        csvRows.push(headers.join(',')); // Intestazione

        for (const row of data) {
            const values = headers.map(header => {
                const val = row[header] !== undefined ? '' + row[header] : '';
                const escaped = val.replace(/"/g, '\\"'); // Gestione virgolette
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `aeterna_${filename}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showToast(`Export ${filename} completato`, "success");
    } catch (error) {
        console.error("Errore export:", error);
        showToast("Errore durante l'esportazione", "error");
    }
}

// --- IMPORT (Carica dati da file) ---
function setupImportListeners() {
    setupSingleImport('import-filosofi-file', 'filosofi');
    setupSingleImport('import-opere-file', 'opere');
    setupSingleImport('import-concetti-file', 'concetti');
}

function setupSingleImport(inputId, collectionName) {
    const input = document.getElementById(inputId);
    if (!input) return;

    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showToast("Lettura file in corso...", "info");
        const reader = new FileReader();
        
        reader.onload = async (event) => {
            try {
                const text = event.target.result;
                const rows = text.split('\n');
                const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
                
                const batch = window.db.batch();
                let count = 0;
                
                for (let i = 1; i < rows.length; i++) {
                    if (!rows[i].trim()) continue;
                    // Regex per gestire CSV con virgolette
                    const values = rows[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
                    const cleanValues = values.map(v => v ? v.replace(/^"|"$/g, '').trim() : '');
                    
                    const docData = {};
                    headers.forEach((header, index) => {
                        if (cleanValues[index]) docData[header] = cleanValues[index];
                    });
                    
                    docData.createdAt = new Date().toISOString();
                    // Crea un riferimento a un nuovo documento
                    const docRef = window.db.collection(collectionName).doc();
                    batch.set(docRef, docData);
                    count++;
                }

                await batch.commit();
                showToast(`Caricati ${count} elementi in ${collectionName}`, "success");
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                console.error("Errore import:", error);
                showToast("Errore nel file CSV", "error");
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    });
}

// ==================== ESPOSIZIONE GLOBALE ====================
// Rende le funzioni accessibili all'HTML (onclick)

window.showScreen = showScreen;
window.goBack = goBack;
window.toggleMenuModal = toggleMenuModal;
window.closeMenuModal = closeMenuModal;
window.openCreditsScreen = openCreditsScreen;
window.openReportScreen = openReportScreen;
window.openQRModal = openQRModal;
window.closeQRModal = closeQRModal;
window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.checkAdminAuth = checkAdminAuth;
window.closeAdminAuth = closeAdminAuth;
window.logoutAdmin = logoutAdmin;
window.installPWA = installPWA; // Ora funziona perché la funzione esiste qui sopra
window.searchFilosofi = searchFilosofi;
window.searchOpere = searchOpere;
window.setFilter = setFilter;
window.showFilosofoDetail = showFilosofoDetail;
window.showOperaDetail = showOperaDetail;
window.showConcettoDetail = showConcettoDetail;
window.openComparativeAnalysis = openComparativeAnalysis;
window.closeComparativeModal = closeComparativeModal;
window.goToMapLocation = goToMapLocation;
window.initConceptMap = initConceptMap;
window.exportFilosofiToExcel = exportFilosofiToExcel;
window.exportOpereToExcel = exportOpereToExcel;
window.exportConcettiToExcel = exportConcettiToExcel;
window.exportFullDataset = exportFullDataset;

// Placeholder per funzioni admin mancanti (per evitare errori se chiamate)
window.loadAdminFilosofi = window.loadAdminFilosofi || function(){ console.log("Funzione Admin Load mancante"); };
window.loadAdminOpere = window.loadAdminOpere || function(){};
window.loadAdminConcetti = window.loadAdminConcetti || function(){};

console.log('📚 Aeterna Lexicon App.js (Fixed UI v3.2.1) - READY');