// ==========================================
// AETERNA LEXICON IN MOTU - CORE APPLICATION
// Versione: 4.0.0 (Ottimizzata per Mobile & Sync)
// ==========================================

// 1. STATO GLOBALE DELL'APPLICAZIONE
window.appData = {
    filosofi: [],
    opere: [],
    concetti: [],
    analisi: []
};

// Configurazione Collezioni (Coerente con firebase-init.js)
const COLLECTIONS = {
    FILOSOFI: 'filosofi',
    OPERE: 'opere',
    CONCETTI: 'concetti',
    ANALISI: 'analisi'
};

// Variabili di sistema
let currentLanguage = localStorage.getItem('app_language') || 'it';
let map = null; // Riferimento alla mappa Leaflet
let mapMarkers = [];

// ==========================================
// 2. INIZIALIZZAZIONE INTELLIGENTE
// ==========================================

document.addEventListener('DOMContentLoaded', async () => {
    console.log("🚀 Avvio Aeterna Lexicon...");

    // Setup UI immediato (Navigazione, Traduzioni, Service Worker)
    setupNavigation();
    setupLanguage();
    if (typeof registerServiceWorker === 'function') registerServiceWorker();

    // Gestione Admin Panel (nascondi/mostra in base al login locale)
    checkAdminAuth();

    // AVVIO CARICAMENTO DATI
    // Se Firebase è già pronto (PC veloce), carica subito.
    // Se no (Mobile lento), aspetta l'evento 'firebase-ready'.
    if (window.firebaseInitialized && window.db) {
        startDataSync();
    } else {
        console.log("⏳ In attesa di Firebase...");
        window.addEventListener('firebase-ready', () => {
            console.log("📶 Firebase connesso: avvio sincronizzazione.");
            startDataSync();
        });
        
        // Fallback di sicurezza: se dopo 5 secondi non succede nulla, prova a caricare la cache
        setTimeout(() => {
            if (appData.filosofi.length === 0) loadLocalData();
        }, 5000);
    }
});

// Funzione centrale di Sincronizzazione
async function startDataSync() {
    try {
        // 1. Caricamento iniziale (One-shot)
        await loadAllDataFromFirebase();
        
        // 2. Attiva Listener per aggiornamenti in tempo reale (Sync tra dispositivi)
        setupRealtimeListeners();

        // 3. Inizializza componenti avanzati
        updateAllSelects(); // Popola menu a tendina
        if (document.getElementById('map')) initMap(); // Avvia mappa
        
        // 4. Rimuovi schermata di caricamento (se presente)
        const loader = document.getElementById('loader');
        if (loader) loader.style.display = 'none';

        console.log("✅ App Sincronizzata e Pronta.");
    } catch (e) {
        console.error("Errore sync:", e);
        loadLocalData(); // Fallback offline
    }
}

// ==========================================
// 3. GESTIONE DATI (FIREBASE & LOCALE)
// ==========================================

async function loadAllDataFromFirebase() {
    // Wrapper sicuro per window.firebaseHelpers
    if (!window.firebaseHelpers) return;

    appData.filosofi = await window.firebaseHelpers.loadFilosofi() || [];
    appData.opere = await window.firebaseHelpers.loadOpere() || [];
    appData.concetti = await window.firebaseHelpers.loadConcetti() || [];
    
    // Aggiorna UI
    refreshAllViews();
    saveLocalData(); // Salva in cache per prossimo avvio offline
}

function setupRealtimeListeners() {
    // Ascolta gli eventi emessi da firebase-init.js
    window.addEventListener('filosofi-updated', (e) => {
        console.log("🔄 Aggiornamento live: Filosofi");
        appData.filosofi = e.detail;
        refreshAllViews();
    });
    
    window.addEventListener('opere-updated', (e) => {
        appData.opere = e.detail;
        refreshAllViews();
    });
    
    window.addEventListener('concetti-updated', (e) => {
        appData.concetti = e.detail;
        refreshAllViews();
    });
}

function refreshAllViews() {
    // Aggiorna solo la vista corrente per risparmiare risorse
    const currentTab = document.querySelector('.nav-btn.active')?.dataset.tab || 'home';
    
    if (currentTab === 'filosofi') loadFilosofi();
    if (currentTab === 'opere') loadOpere();
    if (currentTab === 'concetti') loadConcetti();
    if (currentTab === 'mappa') loadMapMarkers();
    
    // Aggiorna sempre le select dell'admin in background
    updateAllSelects();
}

// Gestione Cache Locale (LocalStorage)
function saveLocalData() {
    try {
        localStorage.setItem('cached_filosofi', JSON.stringify(appData.filosofi));
        localStorage.setItem('cached_opere', JSON.stringify(appData.opere));
        localStorage.setItem('cached_concetti', JSON.stringify(appData.concetti));
    } catch (e) { console.warn("Cache piena"); }
}

function loadLocalData() {
    console.log("📂 Caricamento da cache locale...");
    appData.filosofi = JSON.parse(localStorage.getItem('cached_filosofi') || '[]');
    appData.opere = JSON.parse(localStorage.getItem('cached_opere') || '[]');
    appData.concetti = JSON.parse(localStorage.getItem('cached_concetti') || '[]');
    refreshAllViews();
}
// ==========================================
// 4. RENDERING INTERFACCIA UTENTE (Liste & Analisi)
// ==========================================

// --- VISUALIZZAZIONE FILOSOFI ---
function loadFilosofi() {
    const grid = document.getElementById('filosofi-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const term = document.getElementById('search-filosofi')?.value.toLowerCase() || '';

    appData.filosofi.forEach(f => {
        // Filtro di ricerca
        if (f.nome.toLowerCase().includes(term) || f.periodo.toLowerCase().includes(term)) {
            const card = document.createElement('div');
            card.className = 'card animate-fade-in';
            
            // Gestione immagine (fallback se manca)
            const imgUrl = f.immagine || 'images/default-filosofo.jpg';
            
            // Determina colore badge in base al periodo
            const isContemporary = f.periodo.toLowerCase().includes('contemporaneo') || 
                                   f.periodo.toLowerCase().includes('moderno');
            
            card.innerHTML = `
                <div class="card-header" style="background-image: url('${imgUrl}')">
                    <span class="period-badge ${isContemporary ? 'contemporaneo' : 'classico'}">
                        ${f.periodo}
                    </span>
                </div>
                <div class="card-body">
                    <h3>${f.nome}</h3>
                    <p class="card-subtitle">${f.scuola || 'Pensiero filosofico'}</p>
                    <div class="card-meta">
                        <span><i class="fas fa-calendar"></i> ${f.dataNascita || '?'} - ${f.dataMorte || '?'}</span>
                        ${f.citta ? `<span><i class="fas fa-map-marker-alt"></i> ${f.citta}</span>` : ''}
                    </div>
                </div>
            `;
            
            // Click sulla card apre i dettagli (funzione nel Blocco 4)
            card.onclick = () => {
                if(window.showFilosofoDetails) window.showFilosofoDetails(f.id);
            };
            
            grid.appendChild(card);
        }
    });
}

// --- VISUALIZZAZIONE OPERE ---
function loadOpere() {
    const list = document.getElementById('opere-list');
    if (!list) return;
    
    list.innerHTML = '';
    const term = document.getElementById('search-opere')?.value.toLowerCase() || '';

    appData.opere.forEach(o => {
        // Trova il nome dell'autore collegato
        const autore = appData.filosofi.find(f => f.id === o.autore_id)?.nome || 'Autore Sconosciuto';
        
        if (o.titolo.toLowerCase().includes(term) || autore.toLowerCase().includes(term)) {
            const item = document.createElement('div');
            item.className = 'list-item animate-slide-in';
            item.innerHTML = `
                <div class="item-icon"><i class="fas fa-book"></i></div>
                <div class="item-content">
                    <h3>${o.titolo}</h3>
                    <p>di <strong>${autore}</strong> (${o.anno || 'n.d.'})</p>
                    ${o.descrizione ? `<small>${o.descrizione.substring(0, 80)}...</small>` : ''}
                </div>
                <div class="item-actions">
                    <button class="btn-small" onclick="showToast('Opera: ' + '${o.titolo.replace(/'/g, "\\'")}', 'info')">
                        <i class="fas fa-eye"></i>
                    </button>
                </div>
            `;
            list.appendChild(item);
        }
    });
}

// --- VISUALIZZAZIONE CONCETTI (con Analisi Reale PW) ---
function loadConcetti() {
    const grid = document.getElementById('concetti-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    const term = document.getElementById('search-concetti')?.value.toLowerCase() || '';

    appData.concetti.forEach(c => {
        if (c.termine.toLowerCase().includes(term) || c.definizione.toLowerCase().includes(term)) {
            const card = document.createElement('div');
            card.className = 'card concept-card animate-fade-in';
            
            // Trova autore collegato
            const filosofo = appData.filosofi.find(f => f.id === c.filosofo_id);
            const nomeAutore = filosofo?.nome || 'Generale';
            const periodoAutore = filosofo?.periodo || '';

            card.innerHTML = `
                <div class="card-body">
                    <div class="concept-header">
                        <h3>${c.termine}</h3>
                        <span class="tag">${c.categoria || 'Concetto'}</span>
                    </div>
                    <p class="concept-definition">"${c.definizione}"</p>
                    <div class="concept-footer">
                        <small><i class="fas fa-user"></i> ${nomeAutore} (${periodoAutore})</small>
                        
                        <button class="btn-text" onclick="window.startComparativeAnalysis('${c.termine}')">
                            <i class="fas fa-chart-line"></i> Analisi Evolutiva
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        }
    });
}

// --- FUNZIONE CENTRALE ANALISI COMPARATIVA (PROJECT WORK) ---
window.startComparativeAnalysis = async (termine) => {
    // Verifica che il modulo di analisi sia caricato
    if (!window.LinguisticAnalysis) {
        alert("Errore: Modulo LinguisticAnalysis non caricato.");
        return;
    }
    
    showToast(`Analisi evolutiva in corso per: "${termine}"...`, 'info');
    
    // 1. Cerca nel database TUTTE le definizioni di questo termine
    // (Pulisce spazi e maiuscole per trovare corrispondenze esatte)
    const occorrenze = appData.concetti.filter(c => 
        c.termine.toLowerCase().trim() === termine.toLowerCase().trim()
    );

    // 2. Controllo Dati Minimi
    if (occorrenze.length < 2) {
        alert(`Per analizzare l'evoluzione di "${termine}", devi inserire nel database almeno due definizioni diverse (es. una di Platone e una di Nietzsche). Al momento ne hai solo ${occorrenze.length}.`);
        return;
    }

    // 3. Preparazione Corpus (Classico vs Contemporaneo)
    let testoClassico = "";
    let testoContemporaneo = "";
    let autoriCoinvolti = [];

    occorrenze.forEach(concetto => {
        const filosofo = appData.filosofi.find(f => f.id === concetto.filosofo_id);
        if (filosofo) {
            autoriCoinvolti.push(filosofo.nome);
            const def = concetto.definizione || "";
            const periodo = filosofo.periodo.toLowerCase();
            
            // Logica di suddivisione temporale
            if (periodo.includes('contemporaneo') || periodo.includes('moderno') || periodo.includes('900') || periodo.includes('xx')) {
                testoContemporaneo += def + " ";
            } else {
                testoClassico += def + " ";
            }
        }
    });

    try {
        // 4. Esegui l'analisi linguistica REALE
        const corpus = {
            classico: testoClassico,
            contemporaneo: testoContemporaneo
        };
        
        const risultato = window.LinguisticAnalysis.analizzaTermine(termine, corpus);
        
        // Aggiungiamo i metadati sugli autori per mostrarli nel report
        risultato.metadata = {
            autori: autoriCoinvolti,
            analizzatoIl: new Date().toISOString()
        };

        // 5. Visualizzazione Risultati
        // Se analytics.js è presente, usa la sua modale avanzata
        if (window.AnalyticsManager || document.getElementById('analysis-modal')) {
             const modal = document.getElementById('analysis-modal');
             if(modal) {
                 // Popola la modale (Logica semplificata di analytics.js)
                 document.getElementById('analysis-term-title').textContent = termine;
                 
                 // Se hai la funzione di rendering specifica in analytics.js, usala
                 // Altrimenti popoliamo i campi base qui:
                 const sintesiDiv = document.getElementById('analysis-synthesis');
                 if(sintesiDiv) {
                     sintesiDiv.innerHTML = `
                        <p><strong>Autori confrontati:</strong> ${autoriCoinvolti.join(', ')}</p>
                        <hr>
                        <p><strong>Classico:</strong> ${risultato.sintesi.classico || 'Dati insufficienti'}</p>
                        <p><strong>Contemporaneo:</strong> ${risultato.sintesi.contemporaneo || 'Dati insufficienti'}</p>
                        <div style="background:#eef2ff; padding:10px; border-radius:8px; margin-top:10px;">
                            <strong>Trend Evolutivo:</strong> ${risultato.sintesi.trend}
                        </div>
                     `;
                 }
                 modal.style.display = 'flex';
             }
        } else {
            // Fallback semplice (Alert)
            alert(`Evoluzione del concetto "${termine}":\n\nTREND: ${risultato.sintesi.trend}\n\nConfronto tra: ${autoriCoinvolti.join(', ')}`);
        }
        
    } catch (e) {
        console.error(e);
        showToast("Errore durante l'analisi dati.", 'error');
    }
};

// --- FILTRO RICERCA OTTIMIZZATO (Debounce) ---
let timeoutSearch;
window.debouncedFilter = (type) => {
    clearTimeout(timeoutSearch);
    timeoutSearch = setTimeout(() => {
        if (type === 'filosofi') loadFilosofi();
        if (type === 'opere') loadOpere();
        if (type === 'concetti') loadConcetti();
    }, 300); 
};
// ==========================================
// 5. PANNELLO ADMIN & SALVATAGGIO
// ==========================================

// Aggiorna i menu a tendina nei form (Autori -> Opere)
function updateAllSelects() {
    const selects = {
        filosofo: document.querySelectorAll('#opera-autore, #concetto-autore'),
        opera: document.querySelectorAll('#concetto-opera')
    };

    // Popola select Filosofi
    selects.filosofo.forEach(sel => {
        if (!sel) return;
        const currentVal = sel.value;
        sel.innerHTML = '<option value="">Seleziona Filosofo...</option>';
        appData.filosofi.forEach(f => {
            sel.innerHTML += `<option value="${f.id}">${f.nome}</option>`;
        });
        sel.value = currentVal;
        
        // Listener per aggiornare le opere quando cambia l'autore
        sel.addEventListener('change', (e) => filterOpereByAuthor(e.target.value));
    });
}

function filterOpereByAuthor(authorId) {
    const operaSelect = document.getElementById('concetto-opera');
    if (!operaSelect) return;
    
    operaSelect.innerHTML = '<option value="">Seleziona Opera...</option>';
    const opereFiltrate = appData.opere.filter(o => o.autore_id === authorId);
    
    opereFiltrate.forEach(o => {
        operaSelect.innerHTML += `<option value="${o.id}">${o.titolo}</option>`;
    });
    operaSelect.disabled = opereFiltrate.length === 0;
}

// --- FUNZIONI DI SALVATAGGIO (Collegate a Firebase Helpers) ---

window.saveFilosofo = async () => {
    const form = document.getElementById('form-filosofo');
    if (!form.checkValidity()) return alert("Compila i campi obbligatori");

    const data = {
        nome: document.getElementById('filosofo-nome').value,
        periodo: document.getElementById('filosofo-periodo').value,
        scuola: document.getElementById('filosofo-scuola').value,
        dataNascita: document.getElementById('filosofo-nascita').value,
        dataMorte: document.getElementById('filosofo-morte').value,
        citta: document.getElementById('filosofo-citta').value,
        immagine: document.getElementById('filosofo-img').value
    };

    try {
        showToast("Salvataggio in corso...", "info");
        
        // Geocoding automatico se disponibile
        if (window.GeocodingManager && data.citta) {
             const coords = await window.GeocodingManager.geocode(data.citta, '', data.nome);
             if (coords) { data.lat = coords.lat; data.lng = coords.lng; }
        }

        await window.firebaseHelpers.saveFilosofo(data);
        showToast("Filosofo salvato! Sincronizzazione in corso...", "success");
        form.reset();
        // Nota: non serve aggiornare manuale appData, ci pensa il listener in Blocco 1
    } catch (e) {
        showToast("Errore salvataggio: " + e.message, "error");
    }
};

window.saveOpera = async () => {
    const autoreId = document.getElementById('opera-autore').value;
    if (!autoreId) return alert("Seleziona un autore");

    const data = {
        titolo: document.getElementById('opera-titolo').value,
        anno: document.getElementById('opera-anno').value,
        autore_id: autoreId,
        descrizione: document.getElementById('opera-desc').value
    };

    try {
        await window.firebaseHelpers.saveOpera(data);
        showToast("Opera salvata!", "success");
        document.getElementById('form-opera').reset();
    } catch (e) {
        showToast("Errore: " + e.message, "error");
    }
};

window.saveConcetto = async () => {
    const data = {
        termine: document.getElementById('concetto-termine').value,
        definizione: document.getElementById('concetto-def').value,
        filosofo_id: document.getElementById('concetto-autore').value,
        opera_id: document.getElementById('concetto-opera').value,
        categoria: document.getElementById('concetto-cat').value
    };

    try {
        await window.firebaseHelpers.saveConcetto(data);
        showToast("Concetto salvato!", "success");
        document.getElementById('form-concetto').reset();
    } catch (e) { showToast("Errore: " + e.message, "error"); }
};

// ==========================================
// 6. MAPPA & UTILITIES
// ==========================================

function initMap() {
    if (typeof L === 'undefined') return; // Leaflet non caricato
    if (map) return; // Già inizializzata

    map = L.map('map').setView([41.9028, 12.4964], 4); // Focus Italia/Europa
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
    }).addTo(map);

    loadMapMarkers();
}

function loadMapMarkers() {
    if (!map) return;
    
    // Rimuovi vecchi marker
    mapMarkers.forEach(m => map.removeLayer(m));
    mapMarkers = [];

    appData.filosofi.forEach(f => {
        if (f.lat && f.lng) {
            const marker = L.marker([f.lat, f.lng])
                .addTo(map)
                .bindPopup(`<b>${f.nome}</b><br>${f.citta || ''}<br><i>${f.periodo}</i>`);
            mapMarkers.push(marker);
        }
    });
}

// Navigazione Tab
function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            // UI Update
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
            const targetId = btn.dataset.tab;
            
            const targetScreen = document.getElementById(`screen-${targetId}`);
            if(targetScreen) targetScreen.style.display = 'block';
            
            // Logica specifica per tab
            if (targetId === 'mappa') {
                setTimeout(() => { if(map) map.invalidateSize(); else initMap(); }, 200);
            }
            
            refreshAllViews(); // Ricarica i dati per la vista attuale
        });
    });
}

// Toast Notification System
window.showToast = (msg, type = 'info') => {
    const container = document.getElementById('toast-container') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
};

function createToastContainer() {
    const div = document.createElement('div');
    div.id = 'toast-container';
    div.style.cssText = "position: fixed; bottom: 20px; right: 20px; z-index: 9999;";
    document.body.appendChild(div);
    return div;
}

// Admin Auth Helper
function checkAdminAuth() {
    const isAdmin = localStorage.getItem('abc_admin_logged') === 'true';
    const panel = document.getElementById('admin-panel');
    if (panel) panel.style.display = isAdmin ? 'block' : 'none';
}

function setupLanguage() {
    if(window.translations && window.translatePage) {
        window.translatePage(currentLanguage);
    }
}
// ==========================================
// 7. GESTIONE DETTAGLI (MODALI & SCHEDE)
// ==========================================

// Funzione generica per aprire modali
window.openModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        // Se è la modale admin, aggiorna le select
        if (modalId === 'admin-modal') updateAllSelects(); 
    }
};

window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) modal.style.display = 'none';
};

// Chiudi modali cliccando fuori
window.onclick = (event) => {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
    }
};

// --- DETTAGLIO FILOSOFO ---
window.showFilosofoDetails = (id) => {
    const f = appData.filosofi.find(item => item.id === id);
    if (!f) return;

    const modalBody = document.getElementById('modal-body-content'); // Assicurati che questo ID esista nel tuo HTML
    if (!modalBody) return alert(f.nome + ": " + (f.scuola || ''));

    // Costruisci la scheda dettaglio
    const html = `
        <div class="detail-header" style="background-image: url('${f.immagine || 'images/default-filosofo.jpg'}')">
            <h2>${f.nome}</h2>
        </div>
        <div class="detail-content">
            <p><strong>Periodo:</strong> ${f.periodo}</p>
            <p><strong>Date:</strong> ${f.dataNascita} - ${f.dataMorte}</p>
            <p><strong>Luogo:</strong> ${f.citta} (Lat: ${f.lat || 'N/D'}, Lng: ${f.lng || 'N/D'})</p>
            <hr>
            <h3>Il Pensiero</h3>
            <p>${f.descrizione || 'Nessuna descrizione disponibile.'}</p>
            <hr>
            <h3>Opere Principali</h3>
            <ul id="detail-opere-list"></ul>
        </div>
    `;
    
    modalBody.innerHTML = html;
    
    // Aggiungi opere correlate
    const opereList = modalBody.querySelector('#detail-opere-list');
    const opereAutore = appData.opere.filter(o => o.autore_id === id);
    
    if (opereAutore.length === 0) {
        opereList.innerHTML = '<li>Nessuna opera registrata.</li>';
    } else {
        opereAutore.forEach(o => {
            opereList.innerHTML += `<li><strong>${o.titolo}</strong> (${o.anno})</li>`;
        });
    }

    openModal('detail-modal'); // Assicurati di avere una modale con id 'detail-modal' nell'HTML
};

// Aggiorna il rendering dei filosofi nel BLOCCO 2 per usare questa funzione
// (Non serve modificare il blocco 2, basta che la card chiami showFilosofoDetails(f.id))
// ==========================================
// 8. ADMIN: MODIFICA ED ELIMINA (CRUD)
// ==========================================

// Variabile per tracciare se stiamo modificando (non creando)
let isEditing = false;
let editingId = null;

// --- GESTIONE LISTE ADMIN ---
// Queste funzioni riempiono le tabelle nel pannello di controllo
window.loadAdminFilosofi = () => {
    const tbody = document.getElementById('admin-filosofi-list');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    appData.filosofi.forEach(f => {
        tbody.innerHTML += `
            <tr>
                <td>${f.nome}</td>
                <td>
                    <button class="btn-icon edit" onclick="prepareEdit('filosofi', '${f.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteItem('filosofi', '${f.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    });
};

window.loadAdminOpere = () => {
    const tbody = document.getElementById('admin-opere-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    appData.opere.forEach(o => {
        tbody.innerHTML += `
            <tr>
                <td>${o.titolo}</td>
                <td>
                    <button class="btn-icon edit" onclick="prepareEdit('opere', '${o.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon delete" onclick="deleteItem('opere', '${o.id}')"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
    });
};

// --- PREPARAZIONE MODIFICA ---
window.prepareEdit = (collection, id) => {
    isEditing = true;
    editingId = id;
    
    // Trova il dato
    const item = appData[collection].find(i => i.id === id);
    if (!item) return;

    // Popola il form (esempio per filosofi)
    if (collection === 'filosofi') {
        document.getElementById('filosofo-nome').value = item.nome;
        document.getElementById('filosofo-periodo').value = item.periodo;
        document.getElementById('filosofo-scuola').value = item.scuola;
        document.getElementById('filosofo-nascita').value = item.dataNascita;
        document.getElementById('filosofo-morte').value = item.dataMorte;
        document.getElementById('filosofo-citta').value = item.citta;
        document.getElementById('filosofo-img').value = item.immagine;
        
        // Cambia il bottone "Salva" in "Aggiorna"
        const btn = document.querySelector('#form-filosofo button[type="submit"]');
        if(btn) btn.textContent = "Aggiorna Filosofo";
    }
    // Logica simile per Opere e Concetti...
    
    showToast(`Modifica ${collection}: ${item.nome || item.titolo}`, 'warning');
};

// --- ELIMINAZIONE ---
window.deleteItem = async (collection, id) => {
    if (!confirm("Sei sicuro di voler eliminare questo elemento? L'azione è irreversibile.")) return;

    try {
        await window.firebaseHelpers.deleteDocument(collection, id);
        showToast("Elemento eliminato.", "success");
        // L'aggiornamento UI avverrà grazie ai listener del Blocco 1
    } catch (e) {
        showToast("Errore eliminazione: " + e.message, "error");
    }
};
// ==========================================
// 9. ANALYTICS & LOG DI SISTEMA
// ==========================================

// Log delle attività (Salva nel LocalStorage le ultime 50 azioni)
window.logActivity = (action) => {
    let logs = JSON.parse(localStorage.getItem('activityLog') || '[]');
    const newLog = {
        action: action,
        timestamp: new Date().toLocaleString()
    };
    
    logs.unshift(newLog); // Aggiungi in cima
    if (logs.length > 50) logs.pop(); // Mantieni solo ultimi 50
    
    localStorage.setItem('activityLog', JSON.stringify(logs));
    renderActivityLog();
};

function renderActivityLog() {
    const container = document.getElementById('activity-log-container');
    if (!container) return;
    
    const logs = JSON.parse(localStorage.getItem('activityLog') || '[]');
    container.innerHTML = logs.map(log => `
        <div class="log-entry">
            <small>${log.timestamp}</small>
            <span>${log.action}</span>
        </div>
    `).join('');
}

// Inizializzazione Dashboard Admin
window.initAdminDashboard = () => {
    // Aggiorna contatori
    document.getElementById('count-filosofi').textContent = appData.filosofi.length;
    document.getElementById('count-opere').textContent = appData.opere.length;
    document.getElementById('count-concetti').textContent = appData.concetti.length;
    
    renderActivityLog();
    
    // Se usi Chart.js per i grafici (codice presente nel vecchio file)
    if (window.Chart && document.getElementById('statsChart')) {
        renderStatsChart();
    }
};

function renderStatsChart() {
    const ctx = document.getElementById('statsChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Filosofi', 'Opere', 'Concetti'],
            datasets: [{
                data: [appData.filosofi.length, appData.opere.length, appData.concetti.length],
                backgroundColor: ['#3b82f6', '#10b981', '#8b5cf6']
            }]
        }
    });
}

// Chiamata periodica per aggiornare la dashboard se aperta
setInterval(() => {
    if (document.getElementById('admin-panel')?.style.display !== 'none') {
        initAdminDashboard();
    }
}, 5000);
// ==========================================
// 10. MAPPA CONCETTUALE INTERATTIVA (GRAFO)
// ==========================================

function initConceptualMap() {
    const container = document.getElementById('conceptual-map');
    if (!container) return;

    // Verifica se la libreria vis.js è caricata (necessaria per il grafo)
    if (typeof vis === 'undefined') {
        container.innerHTML = '<p class="error-msg">Libreria vis.js non caricata. Impossibile mostrare il grafo.</p>';
        return;
    }

    // 1. Creazione Nodi (Pallini)
    const nodes = new vis.DataSet();
    const edges = new vis.DataSet();

    // Aggiungi Filosofi (Colore Blu)
    appData.filosofi.forEach(f => {
        nodes.add({
            id: 'f_' + f.id,
            label: f.nome,
            group: 'filosofi',
            shape: 'image',
            image: f.immagine || 'images/default-filosofo.jpg',
            size: 30
        });
    });

    // Aggiungi Concetti (Colore Viola) e Collegamenti
    appData.concetti.forEach(c => {
        // Nodo Concetto
        nodes.add({
            id: 'c_' + c.id,
            label: c.termine,
            group: 'concetti',
            shape: 'dot',
            color: '#8b5cf6', // Viola
            size: 15
        });

        // Collegamento (Linea): Concetto -> Filosofo
        if (c.filosofo_id) {
            edges.add({
                from: 'c_' + c.id,
                to: 'f_' + c.filosofo_id,
                arrows: 'to',
                color: { color: '#cbd5e1' }
            });
        }
        
        // Collegamento (Linea): Concetto -> Opera (se presente)
        /* Se vuoi collegare anche le opere, scommenta qui:
        if (c.opera_id) {
             // Logica opzionale per nodi opere
        } */
    });

    // 2. Configurazione Grafica
    const data = { nodes: nodes, edges: edges };
    const options = {
        nodes: {
            borderWidth: 2,
            shadow: true,
            font: { color: '#374151', face: 'Inter' }
        },
        groups: {
            filosofi: { 
                borderWidth: 3, 
                color: { border: '#3b82f6', background: '#ffffff' } 
            }
        },
        physics: {
            enabled: true,
            stabilization: { iterations: 100 } // Stabilizza prima di mostrare
        },
        interaction: { hover: true, tooltipDelay: 200 }
    };

    // 3. Disegna il Grafo
    const network = new vis.Network(container, data, options);

    // 4. Gestione Click sui Nodi
    network.on("click", function (params) {
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            
            // Se clicco un filosofo (id inizia con f_)
            if (nodeId.startsWith('f_')) {
                const idReale = nodeId.replace('f_', '');
                showFilosofoDetails(idReale);
            }
            // Se clicco un concetto (id inizia con c_)
            else if (nodeId.startsWith('c_')) {
                const idReale = nodeId.replace('c_', '');
                // Trova il concetto e mostra un toast o modale
                const concetto = appData.concetti.find(x => x.id === idReale);
                if(concetto) showToast(`Concetto: ${concetto.termine}\nDefinizione: ${concetto.definizione}`, 'info');
            }
        }
    });
}

// Aggiungi l'inizializzazione al cambio tab (Modifica alla funzione setupNavigation del Blocco 3)
// NON serve modificare il Blocco 3, basta aggiungere questo hook qui sotto:
document.querySelectorAll('.nav-btn[data-tab="mappa_concettuale"]').forEach(btn => {
    btn.addEventListener('click', () => {
        setTimeout(initConceptualMap, 100);
    });
});
// ==========================================
// 11. GESTIONE DATASET (EXCEL IMPORT/EXPORT)
// ==========================================

function initExcelControls() {
    const adminPanel = document.getElementById('admin-actions-container'); 
    // Se non hai un div con questo ID, cerchiamo un punto generico nel pannello admin
    const adminContainer = document.querySelector('#admin-panel .admin-content') || document.getElementById('admin-panel');
    
    if (!adminContainer) return;

    // Evita di duplicare i bottoni se esistono già
    if (document.getElementById('excel-controls-wrapper')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'excel-controls-wrapper';
    wrapper.className = 'admin-section';
    wrapper.style.cssText = "margin-top: 30px; padding: 20px; background: #f0f9ff; border-radius: 12px; border: 1px dashed #0ea5e9;";

    wrapper.innerHTML = `
        <h3 style="color:#0369a1; margin-bottom:15px;"><i class="fas fa-file-excel"></i> Gestione Dataset (Project Work)</h3>
        
        <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 15px;">
            <button class="btn-secondary" onclick="window.downloadTemplate('filosofi')">
                <i class="fas fa-download"></i> Template Filosofi
            </button>
            <button class="btn-secondary" onclick="window.downloadTemplate('opere')">
                <i class="fas fa-download"></i> Template Opere
            </button>
            <button class="btn-secondary" onclick="window.downloadTemplate('concetti')">
                <i class="fas fa-download"></i> Template Concetti
            </button>
        </div>

        <div style="display: flex; gap: 15px; align-items: center; border-top: 1px solid #bae6fd; padding-top: 15px;">
            <div style="flex: 1;">
                <label style="display:block; font-size:0.9rem; margin-bottom:5px;">Importa Dati (Excel):</label>
                <input type="file" id="import-file" accept=".xlsx, .xls" style="font-size: 0.9rem;">
            </div>
            <button class="btn-primary" onclick="triggerImport()">
                <i class="fas fa-file-import"></i> Carica Dataset
            </button>
        </div>

        <div style="margin-top: 20px; text-align: center;">
            <button class="btn-success" style="width: 100%; padding: 12px;" onclick="window.exportAllDataToExcel()">
                <i class="fas fa-save"></i> ESPORTA DATASET COMPLETO (Consegna PW)
            </button>
        </div>
    `;

    // Inserisci il pannello Excel prima delle tabelle dati
    const referenceNode = document.getElementById('admin-tabs') || adminContainer.firstChild;
    adminContainer.insertBefore(wrapper, referenceNode.nextSibling);
}

// Funzione ponte per l'importazione
window.triggerImport = async () => {
    const fileInput = document.getElementById('import-file');
    if (!fileInput.files.length) return alert("Seleziona prima un file Excel.");
    
    // Chiede all'utente cosa sta importando
    const type = prompt("Cosa stai importando? Scrivi: filosofi, opere o concetti").toLowerCase().trim();
    if (!['filosofi', 'opere', 'concetti'].includes(type)) return alert("Tipo non valido.");

    try {
        showToast("Lettura file in corso...", "info");
        // Chiama il worker excel
        if(window.handleFileImport) {
            const data = await window.handleFileImport(type, fileInput.files[0]);
            showToast(`Importati ${data.length} elementi!`, "success");
            setTimeout(() => location.reload(), 1000); // Ricarica per vedere i dati
        }
    } catch (e) {
        showToast("Errore import: " + e.message, "error");
    }
};

// Aggancia questa funzione all'inizializzazione dell'Admin (Blocco 6)
// Basta aggiungere questa riga:
// window.addEventListener('DOMContentLoaded', () => setTimeout(initExcelControls, 2000));
// Ma per sicurezza, la chiamiamo direttamente qui sotto:
setTimeout(initExcelControls, 2000); 
// (Il ritardo serve per essere sicuri che l'HTML del pannello admin sia stato creato)
// ==========================================
// 12. GESTIONE LOGIN (SICUREZZA BASE)
// ==========================================

// Funzione chiamata dal pulsante "Accedi" nella modale Admin
window.verifyAdminPassword = () => {
    const passwordInput = document.getElementById('admin-password');
    const errorMsg = document.getElementById('login-error');
    
    // Sostituisci 'admin123' con la tua password preferita
    // Nota: Per un Project Work scolastico questa sicurezza "lato client" è accettata.
    // Per un'app reale servirebbe Firebase Auth.
    const PASSWORD_SEGRETA = 'admin123'; 

    if (passwordInput && passwordInput.value === PASSWORD_SEGRETA) {
        // Login corretto
        localStorage.setItem('abc_admin_logged', 'true');
        
        // Nascondi modale login e mostra pannello
        closeModal('admin-modal'); // Chiude la finestrella login
        document.getElementById('admin-panel').style.display = 'block';
        
        showToast("Accesso Admin effettuato!", "success");
        
        // Inizializza dashboard
        if(window.initAdminDashboard) window.initAdminDashboard();
        if(window.initExcelControls) window.initExcelControls(); // Carica i tasti Excel
        
        // Pulisce il campo password
        passwordInput.value = '';
        if(errorMsg) errorMsg.style.display = 'none';
    } else {
        // Password errata
        if(errorMsg) {
            errorMsg.style.display = 'block';
            errorMsg.textContent = 'Password errata. Riprova.';
        } else {
            alert("Password errata!");
        }
        showToast("Password errata", "error");
    }
};

// Funzione Logout
window.adminLogout = () => {
    localStorage.setItem('abc_admin_logged', 'false');
    document.getElementById('admin-panel').style.display = 'none';
    showToast("Disconnesso dall'amministrazione", "info");
};

// Collega il tasto INVIO nel campo password per fare login veloce
document.addEventListener('DOMContentLoaded', () => {
    const passInput = document.getElementById('admin-password');
    if (passInput) {
        passInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') window.verifyAdminPassword();
        });
    }
});
// ==========================================
// 13. UI ACCESSORI (MENU, QR, PWA, INFO)
// ==========================================

// --- GESTIONE MENU PRINCIPALE (Hamburger) ---
window.toggleMenu = () => {
    const menu = document.getElementById('top-menu-modal');
    if (menu) {
        // Se è aperto lo chiude, se è chiuso lo apre
        menu.style.display = (menu.style.display === 'flex') ? 'none' : 'flex';
    }
};

// Chiude il menu se clicco su una voce
document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', () => {
        const menu = document.getElementById('top-menu-modal');
        if(menu) menu.style.display = 'none';
    });
});


// --- GESTIONE QR CODE (Condivisione) ---
window.showQRCode = () => {
    const container = document.getElementById('qrcode-container');
    if (!container) return; // Se manca il div nel HTML, esci
    
    container.innerHTML = ''; // Pulisci vecchi QR
    
    // Verifica se la libreria QRCode è caricata (dovrebbe essere in index.html)
    if (typeof QRCode === 'undefined') {
        container.innerHTML = '<p>Libreria QR non caricata.</p>';
        return;
    }

    // Genera QR che punta all'indirizzo attuale dell'app
    new QRCode(container, {
        text: window.location.href,
        width: 128,
        height: 128,
        colorDark : "#000000",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
    
    openModal('qr-modal'); // Apre la finestrella
};


// --- GESTIONE INSTALLAZIONE APP (PWA) ---
let deferredPrompt; // Variabile per salvare l'evento di installazione

// 1. Ascolta se il browser dice "Ehi, questa app si può installare!"
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // Non mostrare il banner brutto di default
    deferredPrompt = e; // Salviamo l'evento per dopo
    
    // Mostra il NOSTRO banner personalizzato (se esiste nel HTML)
    const installBanner = document.getElementById('install-banner');
    if (installBanner) {
        installBanner.style.display = 'flex';
    }
});

// 2. Funzione chiamata dal pulsante "Installa"
window.installApp = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt(); // Mostra il prompt nativo del telefono
    
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Esito installazione: ${outcome}`);
    
    deferredPrompt = null; // Reset
    
    // Nascondi il banner
    const installBanner = document.getElementById('install-banner');
    if(installBanner) installBanner.style.display = 'none';
};


// --- INFO, CREDITS & SEGNALAZIONI ---

// Apre i Credits
window.showCredits = () => {
    // Se hai una modale specifica
    if(document.getElementById('credits-modal')) {
        openModal('credits-modal');
    } else {
        // Fallback semplice
        alert("Aeterna Lexicon in Motu\nSviluppato per il Project Work di Filosofia ed Etica.\nVersione 4.0.0");
    }
};

// Segnala Errore (Apre client mail)
window.reportError = () => {
    const subject = encodeURIComponent("Segnalazione Errore - Aeterna Lexicon");
    const body = encodeURIComponent(`Descrivi qui il problema:\n\n\n---\nDati tecnici:\nUserAgent: ${navigator.userAgent}\nData: ${new Date().toLocaleString()}`);
    window.location.href = `mailto:tuo.email@esempio.com?subject=${subject}&body=${body}`;
};

// --- GESTIONE LOADING INIZIALE ---
// Assicura che il loader sparisca sempre
window.addEventListener('load', () => {
    setTimeout(() => {
        const loader = document.getElementById('loader');
        if(loader) loader.style.display = 'none';
    }, 1000); // 1 secondo di sicurezza
});