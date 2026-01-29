/**
 * AETERNA LEXICON IN MOTU - APP.JS (FIXED UI)
 * Project Work Filosofico - Dataset per analisi trasformazioni linguistiche
 * Versione 3.1.1 - Fix Menu, Admin, Back Button e QR Code
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

// ==================== INIZIALIZZAZIONE APP ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📚 Aeterna Lexicon - Caricamento app filosofica...');
    
    // Nascondi splash screen
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('hidden');
            setTimeout(() => splash.style.display = 'none', 500);
        }
        
        // Controlla manutenzione
        checkMaintenanceMode();
        
        // Mostra home
        showScreen('home-screen');
        
        // Gestisci parametri URL (es. ?screen=filosofi)
        handleUrlParameters();
        
        console.log('✅ App filosofica pronta');
    }, 1500);
    
    // Inizializza Firebase (se presente)
    if (window.initializeFirebase) window.initializeFirebase();
    
    // Carica dati filosofici
    await loadPhilosophicalData();
    
    // Setup connessione
    setupConnectionListeners();
    
    // Setup PWA
    setupPWA();
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

// ==================== GESTIONE ADMIN & AUTH (FIXED) ====================

// Apre il form di login (dal menu o dal maintenance mode)
function openAdminPanel() {
    // Se sono già loggato, vai diretto al pannello
    const auth = window.authUtils ? window.authUtils.isAdminLoggedIn() : { loggedIn: false };
    
    if (auth.loggedIn) {
        document.getElementById('top-menu-modal').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'flex';
        updateAdminStats(); // Aggiorna statistiche
    } else {
        // Altrimenti mostra login
        document.getElementById('top-menu-modal').style.display = 'none';
        document.getElementById('admin-auth').style.display = 'flex';
        document.getElementById('auth-error').style.display = 'none';
        document.getElementById('admin-password').value = '';
    }
}

// Chiude il pannello admin principale
function closeAdminPanel() {
    document.getElementById('admin-panel').style.display = 'none';
}

// Chiude il form di login
function closeAdminAuth() {
    document.getElementById('admin-auth').style.display = 'none';
}

// ==========================================
// GESTIONE ADMIN (SISTEMA REALE FIREBASE)
// ==========================================

// Funzione di Login
async function checkAdminAuth() {
    const emailInput = document.getElementById('admin-email');
    const passInput = document.getElementById('admin-password');
    const errorElement = document.getElementById('auth-error');

    // Nascondi errori precedenti
    if (errorElement) errorElement.style.display = 'none';

    const email = emailInput.value.trim();
    const password = passInput.value;

    if (!email || !password) {
        if (errorElement) {
            errorElement.textContent = "Inserisci email e password";
            errorElement.style.display = 'block';
        }
        return;
    }

    try {
        // Usa il VERO login di Firebase
        await window.auth.signInWithEmailAndPassword(email, password);
        
        // Se non va in errore, il login è riuscito:
        console.log("✅ Login Admin Firebase riuscito");
        
        // 1. Imposta le variabili globali
        isAdminAuthenticated = true;
        currentUserRole = 'admin';
        
        // 2. Salva la sessione nel browser
        localStorage.setItem('abc_admin_logged', 'true');
        localStorage.setItem('user_role', 'admin');

        // 3. Gestione Interfaccia (UI)
        document.getElementById('admin-auth').style.display = 'none'; // Chiudi login
        
        // Se c'è la schermata manutenzione, toglila
        const maintScreen = document.getElementById('maintenance-mode');
        if (maintScreen) maintScreen.style.display = 'none';
        document.body.style.overflow = 'auto';

        // Mostra il pannello admin
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) {
            adminPanel.style.display = 'flex';
            // Se esiste la funzione per caricare i dati admin, usala
            if (typeof showAdminPanel === 'function') showAdminPanel();
        }

        showToast('Benvenuto Amministratore', 'success');

        // Pulisci i campi
        emailInput.value = '';
        passInput.value = '';

    } catch (error) {
        console.error("❌ Errore Login:", error);
        if (errorElement) {
            errorElement.style.display = 'block';
            if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
                errorElement.textContent = "Email o password errati";
            } else {
                errorElement.textContent = "Errore: " + error.message;
            }
        }
    }
}

// Funzione di Logout
async function logoutAdmin() {
    try {
        // Logout reale da Firebase
        await window.auth.signOut();
        
        // Pulisci variabili locali
        isAdminAuthenticated = false;
        currentUserRole = null;
        localStorage.removeItem('abc_admin_logged');
        localStorage.removeItem('user_role');
        
        // Chiudi pannello
        const adminPanel = document.getElementById('admin-panel');
        if (adminPanel) adminPanel.style.display = 'none';
        
        showToast('Logout effettuato', 'info');
        
        // Ricarica la pagina per sicurezza (pulisce la memoria)
        setTimeout(() => window.location.reload(), 1000);
        
    } catch (error) {
        console.error("Errore Logout:", error);
        // Fallback locale in caso di errore di rete
        localStorage.removeItem('abc_admin_logged');
        window.location.reload();
    }
}
// Aggiorna i contatori nel pannello admin
function updateAdminStats() {
    document.getElementById('total-filosofi').textContent = filosofiData.length;
    document.getElementById('filosofi-classici').textContent = filosofiData.filter(f => f.periodo === 'classico').length;
    document.getElementById('filosofi-contemporanei').textContent = filosofiData.filter(f => f.periodo === 'contemporaneo').length;
    
    document.getElementById('total-opere').textContent = opereData.length;
    document.getElementById('opere-classiche').textContent = opereData.filter(o => o.periodo === 'classico').length;
    document.getElementById('opere-contemporanee').textContent = opereData.filter(o => o.periodo === 'contemporaneo').length;
    
    document.getElementById('total-concetti').textContent = concettiData.length;
}

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
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => showFilosofoDetail(filosofo.id));
    return card;
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
    `;
    
    showScreen('filosofo-detail-screen');
}

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
    
    filosofiData.forEach(filosofo => {
        if (filosofo.luogo_nascita?.coordinate) {
            const { lat, lng } = filosofo.luogo_nascita.coordinate;
            L.marker([lat, lng])
             .addTo(philosophicalMap)
             .bindPopup(`<b>${filosofo.nome}</b><br>${filosofo.luogo_nascita.citta}`);
        }
    });
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
        // initNetworkMap(); // Se implementata
    }
}

function checkMaintenanceMode() {
    const maintenance = localStorage.getItem('maintenance_mode');
    const element = document.getElementById('maintenance-mode');
    if (element) {
        element.style.display = maintenance === 'true' ? 'flex' : 'none';
    }
}

// ==================== PWA ====================
function setupPWA() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
        const banner = document.getElementById('smart-install-banner');
        if (banner) banner.style.display = 'flex';
    });
}

function installPWA() {
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt = null;
        document.getElementById('smart-install-banner').style.display = 'none';
    }
}

function setupConnectionListeners() {
    window.addEventListener('online', () => document.getElementById('offline-indicator').style.display = 'none');
    window.addEventListener('offline', () => document.getElementById('offline-indicator').style.display = 'block');
}

// ==================== DATI DI ESEMPIO (FALLBACK) ====================
function getSampleFilosofi() {
    return [
        { id: "F1", nome: "Platone", periodo: "classico", scuola: "Accademia", anni: "428-348 a.C.", biografia: "Filosofo greco...", concetti_principali: ["Idea", "Bene"] },
        { id: "F2", nome: "Nietzsche", periodo: "contemporaneo", scuola: "Continental", anni: "1844-1900", biografia: "Filosofo tedesco...", concetti_principali: ["Oltreuomo"] }
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

// ==================== ESPOSIZIONE GLOBALE ====================
// Rende le funzioni accessibili all'HTML (onclick)
window.showScreen = showScreen;
window.goBack = goBack;
window.toggleMenuModal = toggleMenuModal;
window.closeMenuModal = closeMenuModal; // Era mancante!
window.openCreditsScreen = openCreditsScreen;
window.openReportScreen = openReportScreen;
window.openQRModal = openQRModal; // Era mancante!
window.closeQRModal = closeQRModal; // Era mancante!
window.openAdminPanel = openAdminPanel; // Era mancante!
window.closeAdminPanel = closeAdminPanel; // Era mancante!
window.checkAdminAuth = checkAdminAuth; // Era mancante!
window.closeAdminAuth = closeAdminAuth; // Era mancante!
window.logoutAdmin = logoutAdmin;
window.installPWA = installPWA;
window.searchFilosofi = searchFilosofi;
window.searchOpere = searchOpere;
window.setFilter = setFilter;
window.showFilosofoDetail = showFilosofoDetail;
window.showOperaDetail = showOperaDetail;
window.showConcettoDetail = showConcettoDetail;
window.openComparativeAnalysis = openComparativeAnalysis;
window.closeComparativeModal = closeComparativeModal;

console.log('📚 Aeterna Lexicon App.js (Fixed UI) - READY');