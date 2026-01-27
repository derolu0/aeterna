// ==========================================
// AETERNA LEXICON IN MOTU - CORE LOGIC v3.0 (HYBRID)
// Struttura pulita + Funzioni Originali (Admin, Menu, QR)
// ==========================================

// --- STATO GLOBALE ---
window.appState = {
    currentScreen: 'home',
    data: { filosofi: [], opere: [], concetti: [] },
    filters: { filosofi: 'all', opere: 'all', concetti: 'all' },
    isAdmin: false,
    mapInitialized: false,
    version: '2.5.0'
};

// --- INIZIALIZZAZIONE ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("🚀 Aeterna Lexicon Avviato (Versione Completa)");
    
    setupNavigation();
    setupGlobalListeners();
    setupMenuSystem(); // Aggiunge il menu laterale/modale
    
    // Rimuovi loader
    setTimeout(() => {
        const loader = document.getElementById('loader-overlay');
        if (loader) loader.style.display = 'none';
    }, 1500);
});

// Ascolta Firebase
window.addEventListener('firebase-ready', async (e) => {
    console.log("📡 DB Connesso. Caricamento dati...");
    await loadAllData();
    checkAdminSession(); // Controlla se l'admin era già loggato
});

// --- GESTIONE DATI ---
async function loadAllData() {
    try {
        if (window.firebaseHelpers) {
            const [filosofi, opere, concetti] = await Promise.all([
                window.firebaseHelpers.loadFilosofi(),
                window.firebaseHelpers.loadOpere(),
                window.firebaseHelpers.loadConcetti()
            ]);
            window.appState.data = { filosofi, opere, concetti };
            window.appData = window.appState.data; // Retro-compatibilità
            refreshCurrentScreen();
        }
    } catch (err) {
        console.error("Errore dati:", err);
        showToast("Modalità offline attivata", "warning");
    }
}

// --- NAVIGAZIONE ---
function setupNavigation() {
    // Menu Tab Inferiore
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => navigateTo(btn.dataset.screen));
    });

    // Gestione Link Interni
    document.addEventListener('click', (e) => {
        const target = e.target.closest('[data-go-to]');
        if (target) navigateTo(target.dataset.goTo);
    });
}

function navigateTo(screenId) {
    window.appState.currentScreen = screenId;
    
    // Aggiorna UI Navigazione
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    
    const activeScreen = document.getElementById(`screen-${screenId}`);
    const activeBtn = document.querySelector(`.nav-item[data-screen="${screenId}"]`);
    
    if (activeScreen) activeScreen.classList.add('active');
    if (activeBtn) activeBtn.classList.add('active');
    
    // Renderizza contenuto
    refreshCurrentScreen();

    // Mappa Lazy Load
    if (screenId === 'mappa' && !window.appState.mapInitialized) setTimeout(initMappa, 100);
}

function refreshCurrentScreen() {
    const screen = window.appState.currentScreen;
    const container = document.getElementById(`screen-${screen}`);
    if (!container || screen === 'home') return;
    
    switch(screen) {
        case 'filosofi': renderFilosofi(container); break;
        case 'opere': renderOpere(container); break;
        case 'concetti': renderConcetti(container); break;
        case 'admin': renderAdminPanel(container); break; // Aggiunto pannello Admin
    }
}

// --- RENDERING UI (Standard) ---
function renderFilosofi(container) {
    const data = window.appState.data.filosofi;
    // Header e Filtri
    let html = `
        <div class="filters-bar">
            <button class="filter-chip ${window.appState.filters.filosofi === 'all' ? 'active' : ''}" onclick="filterData('filosofi', 'all')">Tutti</button>
            <button class="filter-chip ${window.appState.filters.filosofi === 'classico' ? 'active' : ''}" onclick="filterData('filosofi', 'classico')">Classici</button>
            <button class="filter-chip ${window.appState.filters.filosofi === 'contemporaneo' ? 'active' : ''}" onclick="filterData('filosofi', 'contemporaneo')">Contemporanei</button>
        </div>
        <div class="items-grid">
    `;
    
    const filtered = window.appState.filters.filosofi === 'all' ? data : data.filter(f => f.periodo === window.appState.filters.filosofi);
    
    if(filtered.length === 0) html += `<p class="empty-msg">Nessun filosofo trovato.</p>`;

    html += filtered.map(f => `
        <div class="grid-card" onclick="openDetail('filosofo', '${f.id}')">
            <div class="card-img" style="background-image: url('${f.ritratto || 'images/default-filosofo.jpg'}')">
                <span class="period-badge ${f.periodo}">${f.periodo}</span>
            </div>
            <div class="card-body">
                <h3>${f.nome}</h3>
                <p>${f.scuola || '...'}</p>
            </div>
        </div>
    `).join('');
    html += '</div>';
    
    // Tasto Aggiungi Fluttuante (Solo Admin)
    if(window.appState.isAdmin) {
        html += `<button class="fab-add" onclick="openEditModal('filosofi')"><i class="fas fa-plus"></i></button>`;
    }
    
    container.innerHTML = html;
}

function renderOpere(container) {
    const data = window.appState.data.opere;
    let html = `
        <div class="search-bar-container"><input type="text" placeholder="Cerca opera..." onkeyup="searchOpere(this.value)"></div>
        <div class="list-view">
    `;
    html += data.map(o => `
        <div class="list-item" onclick="openDetail('opera', '${o.id}')">
            <div class="list-icon icon-opera">📖</div>
            <div class="list-info"><h4>${o.titolo}</h4><p>${o.autore_nome}</p></div>
        </div>
    `).join('');
    html += '</div>';
    if(window.appState.isAdmin) html += `<button class="fab-add" onclick="openEditModal('opere')"><i class="fas fa-plus"></i></button>`;
    container.innerHTML = html;
}

function renderConcetti(container) {
    const data = window.appState.data.concetti;
    let html = `<div class="concetti-container">`;
    html += data.map(c => `
        <div class="concetto-card border-${c.periodo_storico}">
            <div class="concetto-header">
                <h3>${c.parola}</h3>
                <button class="btn-analizza" onclick="startComparativeAnalysis('${c.parola}')"><i class="fas fa-chart-line"></i></button>
            </div>
            <p>${c.definizione}</p>
            ${window.appState.isAdmin ? `<button class="btn-edit-mini" onclick="editItem('concetti', '${c.id}')">✏️</button>` : ''}
        </div>
    `).join('');
    html += '</div>';
    if(window.appState.isAdmin) html += `<button class="fab-add" onclick="openEditModal('concetti')"><i class="fas fa-plus"></i></button>`;
    container.innerHTML = html;
}

// --- MENU & SISTEMA MODALE ---
function setupMenuSystem() {
    // 1. Inietta il modale del menu se non esiste
    if (!document.getElementById('main-menu-modal')) {
        const menuHtml = `
        <div id="main-menu-modal" class="modal-overlay menu-overlay">
            <div class="menu-content slide-in-left">
                <div class="menu-header">
                    <h3>Aeterna Lexicon</h3>
                    <button class="close-menu"><i class="fas fa-times"></i></button>
                </div>
                <ul class="menu-list">
                    <li onclick="handleMenuAction('login')"><i class="fas fa-user-lock"></i> Area Riservata / Admin</li>
                    <li onclick="handleMenuAction('qr')"><i class="fas fa-qrcode"></i> Scansiona QR</li>
                    <li onclick="handleMenuAction('report')"><i class="fas fa-bug"></i> Segnala Errore</li>
                    <li onclick="handleMenuAction('info')"><i class="fas fa-info-circle"></i> Info & Crediti</li>
                    <li onclick="handleMenuAction('lang')"><i class="fas fa-language"></i> Lingua (IT/EN)</li>
                </ul>
                <div class="menu-footer">v${window.appState.version}</div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', menuHtml);
    }

    // Listener per apertura menu (hamburger nell'header)
    const trigger = document.getElementById('menu-trigger');
    if (trigger) {
        trigger.addEventListener('click', () => {
            document.getElementById('main-menu-modal').style.display = 'flex';
        });
    }

    // Chiusura menu
    document.querySelector('.close-menu').addEventListener('click', closeMenu);
    document.getElementById('main-menu-modal').addEventListener('click', (e) => {
        if(e.target.id === 'main-menu-modal') closeMenu();
    });
}

function closeMenu() {
    document.getElementById('main-menu-modal').style.display = 'none';
}

window.handleMenuAction = function(action) {
    closeMenu();
    switch(action) {
        case 'login':
            if (window.appState.isAdmin) {
                navigateTo('admin'); // Vai alla dashboard se già loggato
            } else {
                openLoginModal();
            }
            break;
        case 'qr':
            showToast("Scanner QR in caricamento...", "info");
            // Qui potresti richiamare la logica QR originale se presente
            break;
        case 'report':
            showReportModal();
            break;
        case 'info':
            showInfoModal();
            break;
        case 'lang':
            window.toggleLanguage ? window.toggleLanguage() : showToast("Cambio lingua...", "info");
            break;
    }
}

// --- AREA RISERVATA (ADMIN) ---

function checkAdminSession() {
    const session = sessionStorage.getItem('aeterna_admin');
    if (session === 'true') {
        window.appState.isAdmin = true;
        refreshCurrentScreen(); // Ricarica per mostrare i pulsanti edit
    }
}

function openLoginModal() {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('modal-body-content');
    
    content.innerHTML = `
        <div class="login-box">
            <h2>🔐 Area Riservata</h2>
            <p>Inserisci la password amministratore</p>
            <input type="password" id="admin-pass" placeholder="Password" class="login-input">
            <button onclick="attemptLogin()" class="btn-primary">Accedi</button>
        </div>
    `;
    modal.style.display = 'flex';
}

window.attemptLogin = function() {
    const pass = document.getElementById('admin-pass').value;
    // Logica login semplificata (da sostituire con Auth Firebase reale se necessario)
    if (pass === 'admin123' || pass === 'filosofia2024') { // Password di esempio o tua vecchia logica
        window.appState.isAdmin = true;
        sessionStorage.setItem('aeterna_admin', 'true');
        document.getElementById('global-modal').style.display = 'none';
        showToast("Accesso Admin Effettuato", "success");
        navigateTo('admin');
    } else {
        showToast("Password errata", "error");
    }
}

function renderAdminPanel(container) {
    if (!window.appState.isAdmin) {
        openLoginModal();
        return;
    }
    
    container.innerHTML = `
        <div class="admin-dashboard">
            <h2>🛠 Pannello di Controllo</h2>
            <div class="stats-cards">
                <div class="stat-card">
                    <span>${window.appState.data.filosofi.length}</span>
                    <label>Filosofi</label>
                </div>
                <div class="stat-card">
                    <span>${window.appState.data.opere.length}</span>
                    <label>Opere</label>
                </div>
                <div class="stat-card">
                    <span>${window.appState.data.concetti.length}</span>
                    <label>Concetti</label>
                </div>
            </div>
            
            <div class="admin-actions">
                <h3>Gestione Rapida</h3>
                <button class="btn-action" onclick="openEditModal('filosofi')">➕ Aggiungi Filosofo</button>
                <button class="btn-action" onclick="openEditModal('opere')">➕ Aggiungi Opera</button>
                <button class="btn-action" onclick="openEditModal('concetti')">➕ Aggiungi Concetto</button>
                <button class="btn-action btn-danger" onclick="logoutAdmin()">🚪 Esci</button>
            </div>
            
            <div class="admin-tools">
                <h3>Strumenti</h3>
                <button class="btn-tool" onclick="window.ExcelWorker.exportAllDataToExcel()">📤 Export Excel</button>
            </div>
        </div>
    `;
}

window.logoutAdmin = function() {
    window.appState.isAdmin = false;
    sessionStorage.removeItem('aeterna_admin');
    navigateTo('home');
    showToast("Logout effettuato", "info");
}

// --- MODALI EXTRA (Info, Errori) ---

function showInfoModal() {
    const modal = document.getElementById('global-modal');
    document.getElementById('modal-body-content').innerHTML = `
        <div class="info-content">
            <img src="images/logo-app.png" style="width:80px; margin:0 auto; display:block;">
            <h2 style="text-align:center">Aeterna Lexicon</h2>
            <p>Un dataset dinamico per l'analisi delle trasformazioni del linguaggio filosofico.</p>
            <hr>
            <h4>Crediti</h4>
            <p>Sviluppato da: <strong>De Rosa Salvatore</strong></p>
            <p>Versione: ${window.appState.version}</p>
        </div>
    `;
    modal.style.display = 'flex';
}

function showReportModal() {
    const modal = document.getElementById('global-modal');
    document.getElementById('modal-body-content').innerHTML = `
        <div class="report-form">
            <h3>⚠️ Segnala un problema</h3>
            <textarea id="report-text" placeholder="Descrivi l'errore o il dato mancante..." rows="4" style="width:100%"></textarea>
            <button class="btn-primary" onclick="submitReport()">Invia Segnalazione</button>
        </div>
    `;
    modal.style.display = 'flex';
}

window.submitReport = function() {
    const text = document.getElementById('report-text').value;
    if(text.trim().length > 5) {
        showToast("Grazie! Segnalazione inviata.", "success");
        document.getElementById('global-modal').style.display = 'none';
        // Qui puoi aggiungere la chiamata a Firebase per salvare la segnalazione
    } else {
        showToast("Inserisci un testo valido.", "warning");
    }
}

// --- DETTAGLI E ANALISI ---

window.openDetail = function(type, id) {
    const item = window.appState.data[type === 'filosofo' ? 'filosofi' : 'opere'].find(i => i.id === id);
    if (!item) return;

    const modal = document.getElementById('global-modal');
    document.getElementById('modal-body-content').innerHTML = `
        <div class="detail-view">
            <img src="${item.ritratto || item.immagine || 'images/default-placeholder.jpg'}" class="detail-hero">
            <div class="detail-content">
                <h2>${item.nome || item.titolo}</h2>
                <div class="chips">
                    <span class="chip">${item.periodo || ''}</span>
                    ${item.scuola ? `<span class="chip">${item.scuola}</span>` : ''}
                </div>
                <p class="detail-bio">${item.biografia || item.sintesi || 'Descrizione non disponibile.'}</p>
                ${window.appState.isAdmin ? `<button class="btn-edit" onclick="alert('Funzione edit in arrivo')">Modifica Dati</button>` : ''}
            </div>
        </div>
    `;
    modal.style.display = 'flex';
}

window.startComparativeAnalysis = async function(termine) {
    const modal = document.getElementById('global-modal');
    const content = document.getElementById('modal-body-content');
    
    content.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>Analisi: ${termine}...</p></div>`;
    modal.style.display = 'flex';

    if (window.firebaseHelpers && window.LinguisticAnalysis) {
        try {
            const result = await window.firebaseHelpers.analizzaTermineComparativo(termine);
            
            // Renderizza Risultato (Semplificato per brevità)
            content.innerHTML = `
                <div class="analysis-view">
                    <h2>${data.termine.toUpperCase()}</h2>
                    <div id="analysis-timeline-container" style="height: 150px;"></div>
                    <p>Analisi completata. Vedi console per dettagli.</p>
                </div>
            `;
            
            if (window.TimelineEvolution && result.analisi.timeline) {
                setTimeout(() => window.TimelineEvolution.init('analysis-timeline-container', result.analisi.timeline), 100);
            }
        } catch (e) {
            content.innerHTML = `<p class="error-msg">Dati insufficienti per analisi.</p>`;
        }
    }
}

// --- UTILITY E MAPPA ---
function initMappa() {
    if (window.appState.mapInitialized) return;
    const container = document.getElementById('screen-mappa');
    if (!container.querySelector('#map')) {
        container.innerHTML = '<div id="map" style="height: 100%; width: 100%;"></div>';
    }
    if (typeof L !== 'undefined') {
        const map = L.map('map').setView([41.9028, 12.4964], 5);
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
        window.appState.data.filosofi.forEach(f => {
            if (f.coordinate?.lat) L.marker([f.coordinate.lat, f.coordinate.lng]).addTo(map).bindPopup(`<b>${f.nome}</b>`);
        });
        window.appState.mapInitialized = true;
    }
}

function filterData(type, value) {
    window.appState.filters[type] = value;
    refreshCurrentScreen();
}

function setupGlobalListeners() {
    document.querySelector('.close-modal').addEventListener('click', () => {
        document.getElementById('global-modal').style.display = 'none';
    });
}

function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerText = msg;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 3000);
    }, 10);
}