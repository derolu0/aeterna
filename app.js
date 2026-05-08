/**
 * AETERNA - Lexicon in Motu
 * @module DataLayer (o AppCore, o LinguisticAnalyzer)
 * @author Dott. Salvatore De Rosa
 * @license MIT
 * @description Sistema di analisi ermeneutica digitale - Framework scalabile (Architettura JSON Modulare)
 */

// ==================== VARIABILI DI STATO ====================
let currentScreen = 'home-screen';
let previousScreen = null;

// Dati Filosofici (Variabili globali vuote che verranno popolate dai file JSON)
let filosofiData = [];
let opereData = [];
let concettiData = [];
let currentFilter = 'all';
let currentFilterOpere = 'all';

// Mappa Filosofica
let philosophicalMap = null;
let markersLayer = null;

// Mappa Concettuale
let networkInstance = null;

// PWA Installation
let deferredPrompt = null;

// ==================== INIZIALIZZAZIONE APP ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📚 Aeterna Lexicon - Avvio con dataset modulare...');
    
    // 1. SPLASH SCREEN
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('hidden');
            setTimeout(() => {
                splash.style.display = 'none';
            }, 500);
        }
        
        checkMaintenanceMode();
        showScreen('home-screen');
        handleUrlParameters();
        
        console.log('✅ Interfaccia Sbloccata');
    }, 2000);
    
    // 2. CARICA DATI DAL DATASET MODULARE (File JSON Esterni)
    await loadPhilosophicalData();
    
    // ===== PUNTO 4: CARICA STATO DA URL =====
    loadStateFromURL();
    // ========================================
    
    // 3. SETUP LISTENER DI BASE
    if (typeof setupConnectionListeners === 'function') setupConnectionListeners();
    if (typeof setupImportListeners === 'function') setupImportListeners();
    
    console.log('✅ Inizializzazione completata.');
});

// ==================== CARICAMENTO DATI MODULARE DA JSON ====================
async function loadPhilosophicalData() {
    try {
        console.log('📖 Caricamento dataset filosofico modulare (JSON)...');
        
        // 1. Effettua la richiesta Fetch simultanea per i 4 file JSON
        const [resPhilo, resWorks, resConcepts, resComp] = await Promise.all([
            fetch('data/philosophers.json'),
            fetch('data/works.json'),
            fetch('data/concepts.json'),
            fetch('data/comparative.json')
        ]);

        if (!resPhilo.ok || !resWorks.ok || !resConcepts.ok || !resComp.ok) {
            throw new Error("Impossibile caricare uno o più file JSON.");
        }

        const dataPhilo = await resPhilo.json();
        const dataWorks = await resWorks.json();
        const dataConcepts = await resConcepts.json();
        const dataComp = await resComp.json();
        
        // 2. Assegna i dati estratti alle variabili globali
        filosofiData = dataPhilo.philosophers;
        opereData = dataWorks.works;
        concettiData = dataConcepts.concepts; // Carica correttamente l'array dei concetti[cite: 9]

        // 3. Assegna i testi per l'analisi comparativa[cite: 9]
        if (window.comparativeData) {
            window.comparativeData.testiComparativi = dataComp.testiComparativi;
            window.comparativeData.trasformazioni = dataComp.trasformazioni;
        }
        
        // 4. RENDERIZZA LE LISTE (Rimuove gli spinner di caricamento e mostra i dati)
        renderFilosofiList();
        renderOpereList();
        renderConcettiList(); // Cruciale per visualizzare la sezione Concetti[cite: 9]
        
        console.log('✅ Dataset modulare caricato con successo:', {
            filosofi: filosofiData.length,
            opere: opereData.length,
            concetti: concettiData.length
        });
        
    } catch (error) {
        console.error('❌ Errore caricamento dati JSON:', error);
        showToast('Errore nel caricamento dei dati filosofici', 'error');
    }
}

// ==================== GESTIONE NAVIGAZIONE ====================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    const target = document.getElementById(screenId);
    if (target) {
        if (screenId !== currentScreen) {
            previousScreen = currentScreen;
        }
        currentScreen = screenId;

        target.classList.add('active');
        target.style.display = 'flex';
        
        updateTabBar(screenId);
        loadScreenData(screenId);
        
        if(document.querySelector('.content-area')) {
            document.querySelector('.content-area').scrollTop = 0;
        }
        window.scrollTo(0,0);
    }
    
    // ===== PUNTO 3: AGGIORNA JSON-LD =====
    if (typeof updateJSONLD === 'function') {
        updateJSONLD();
    }
    // =====================================
}


function goBack() {
    if (currentScreen === 'home-screen') return;

    if (currentScreen === 'filosofo-detail-screen') {
        showScreen('filosofi-screen');
    } else if (currentScreen === 'opera-detail-screen') {
        showScreen('opere-screen');
    } else if (currentScreen === 'concetto-detail-screen') {
        showScreen('concetti-screen');
    } else if (previousScreen && previousScreen !== currentScreen) {
        showScreen(previousScreen);
    } else {
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
            'analisi': 'comparative-analysis-modal'
        };
        if (map[screen] && map[screen] !== 'comparative-analysis-modal') {
            showScreen(map[screen]);
        }
    }
}

// ==================== RENDER LISTE ====================
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

function renderOpereList() {
    const container = document.getElementById('opere-list');
    if (!container) return;
    container.innerHTML = '';
    
    // Filtro a prova di errore: ignora maiuscole/minuscole e controlla se il periodo esiste
    const filtered = currentFilterOpere === 'all' 
        ? opereData 
        : opereData.filter(o => o.periodo && o.periodo.toLowerCase() === currentFilterOpere.toLowerCase());
        
    if (filtered.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Nessuna opera trovata</p></div>`;
        return;
    }
    
    filtered.forEach(opera => {
        container.appendChild(createOperaCard(opera));
    });
}
function renderConcettiList() {
    const container = document.getElementById('concetti-list');
    if (!container) return;
    
    container.innerHTML = ''; // Questo rimuove lo spinner "Caricamento concetti..."
    
    if (!concettiData || concettiData.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Nessun concetto caricato</p></div>`;
        return;
    }

    // Creiamo la griglia per le card
    const grid = document.createElement('div');
    grid.className = 'concetti-grid';
    
    concettiData.forEach(concetto => {
        const wrapper = document.createElement('div');
        // Usa la funzione createConcettoCardString che hai già nel file
        wrapper.innerHTML = createConcettoCardString(concetto).trim();
        grid.appendChild(wrapper.firstChild);
    });
    
    container.appendChild(grid);
    console.log("✅ Lista concetti renderizzata");
}

// ==================== CREAZIONE CARD ====================
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
                <div><strong>Anni:</strong> ${filosofo.anni || 'N/D'}</div>
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

function createOperaCard(opera) {
    const card = document.createElement('div');
    card.className = 'compact-item';
    card.classList.add(`border-${opera.periodo === 'contemporaneo' ? 'contemporaneo' : 'classico'}`);
    
    // Percorso immagine di default
    const defaultImage = "images/default-opera.jpg";
    
    // Colori per fallback
    const fallbackColor = opera.periodo === 'contemporaneo' 
        ? 'linear-gradient(135deg, #f59e0b, #d97706)' 
        : 'linear-gradient(135deg, #3b82f6, #1d4ed8)';
    
    card.innerHTML = `
        <div class="compact-item-image-container" style="position: relative;">
            <!-- IMMAGINE DI DEFAULT -->
            <img src="${defaultImage}" 
                 alt="${opera.titolo}"
                 class="opera-default-image"
                 style="
                    width: 100%;
                    height: 120px;
                    object-fit: cover;
                    border-radius: 8px;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                 "
                 onerror="
                    // Se l'immagine non carica, mostra fallback colorato
                    console.log('Usando fallback per: ${opera.titolo}');
                    this.style.display = 'none';
                    
                    // Crea elemento fallback
                    var fallback = document.createElement('div');
                    fallback.style.cssText = 'width:100%;height:120px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:2rem;background:${fallbackColor};color:white;';
                    fallback.innerHTML = '📚';
                    
                    // Sostituisci
                    this.parentNode.appendChild(fallback);
                 "
                 onload="console.log('Immagine caricata per: ${opera.titolo}')">
            
            <!-- NOTA: RIMOSSO IL BADGE PERIODO DALLA FOTO -->
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
    return `
    <div class="concetto-card border-${concetto.periodo === 'contemporaneo' ? 'contemporary' : 'classic'}" 
         onclick="showConcettoDetail('${concetto.id}')">
        <div class="concetto-header">
            <h3 class="concetto-parola">${concetto.parola}</h3>
        </div>
        <p class="concetto-definizione">${concetto.definizione ? (concetto.definizione.length > 150 ? concetto.definizione.substring(0, 150) + '...' : concetto.definizione) : ''}</p>
        <div class="concetto-actions">
            <button class="btn-analisi small" 
                    onclick="event.stopPropagation(); openComparativeAnalysis('${concetto.parola}')">
                Analisi
            </button>
        </div>
    </div>
    `;
}

// ==================== DETTAGLI ====================
function showFilosofoDetail(id) {
    window.currentFilosofoId = id;
    const filosofo = filosofiData.find(f => f.id === id);
    if (!filosofo) return;
    
    const content = document.getElementById('filosofo-detail-content');
    if (!content) return;
    
    // Trova le opere di questo filosofo
    const opereFilosofo = opereData.filter(o => o.autore_id === id);
    
    content.innerHTML = `
        <div class="detail-header">
            <h1 class="detail-name">${filosofo.nome}</h1>
            <div class="detail-meta-grid">
                <div class="meta-item"><strong>Periodo:</strong> ${getPeriodoLabel(filosofo.periodo)}</div>
                <div class="meta-item"><strong>Anni:</strong> ${filosofo.anni || 'N/D'}</div>
                <div class="meta-item"><strong>Scuola:</strong> ${filosofo.scuola || 'N/D'}</div>
                <div class="meta-item"><strong>Luogo:</strong> ${filosofo.citta_nascita || ''}, ${filosofo.paese_nascita || ''}</div>
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
        
        ${opereFilosofo.length > 0 ? `
        <div class="detail-info">
            <h3>Opere Principali</h3>
            <div class="opere-list">
                ${opereFilosofo.map(opera => `
                    <div class="opera-item" onclick="showOperaDetail('${opera.id}')">
                        <strong>${opera.titolo}</strong> (${opera.anno})
                        <p class="opera-sintesi">${opera.sintesi ? (opera.sintesi.length > 100 ? opera.sintesi.substring(0, 100) + '...' : opera.sintesi) : ''}</p>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}
        
        <div class="action-buttons-container">
            ${filosofo.coordinate && typeof filosofo.coordinate.lat !== 'undefined' ? `
            <button class="btn-analisi" onclick="goToMapLocation(${filosofo.coordinate.lat}, ${filosofo.coordinate.lng}, '${filosofo.nome.replace(/'/g, "\\'")}')">
                <i class="fas fa-map-marker-alt"></i> Vedi sulla Mappa
            </button>
            ` : ''}
            <button class="btn-tei" onclick="exportCurrentToTEI()">
                <i class="fas fa-file-code"></i> Esporta TEI/XML
            </button>
            <button class="btn-cite" onclick="showCitationModal()">
                <i class="fas fa-quote-right"></i> Cita
            </button>
        </div>
    `;
    
    showScreen('filosofo-detail-screen');
}

function showOperaDetail(id) {
    window.currentOperaId = id;  // ← NUOVA RIGA
    const opera = opereData.find(o => o.id === id);
    if (!opera) return;
    
    const content = document.getElementById('opera-detail-content');
    
    content.innerHTML = `
        <div class="detail-header">
            <h1 class="detail-name">${opera.titolo}</h1>
            <div class="detail-meta-grid">
                <div class="meta-item"><strong>Autore:</strong> ${opera.autore}</div>
                <div class="meta-item"><strong>Anno:</strong> ${opera.anno}</div>
                <div class="meta-item"><strong>Periodo:</strong> ${getPeriodoLabel(opera.periodo)}</div>
            </div>
        </div>
        <div class="detail-info">
            <h3>Sintesi</h3>
            <p class="biography-text">${opera.sintesi || 'Sintesi non disponibile.'}</p>
        </div>
        ${opera.concetti ? `
        <div class="detail-info">
            <h3>Concetti Chiave</h3>
            <div class="tags-cloud">
                ${opera.concetti.map(c => `<span class="tag-chip">${c}</span>`).join('')}
            </div>
        </div>` : ''}
        <div class="action-buttons-container">
            <button class="btn-tei" onclick="exportCurrentToTEI()">
                <i class="fas fa-file-code"></i> Esporta TEI/XML
            </button>

            <button class="btn-cite" onclick="showCitationModal()">
                <i class="fas fa-quote-left"></i> Cita
            </button>
        </div>
    `;
    showScreen('opera-detail-screen');
}

function showConcettoDetail(id) {
    window.currentConcettoId = id;  // ← NUOVA RIGA (aggiunta)
    const concetto = concettiData.find(c => c.id === id);
    if (!concetto) return;
    
    const content = document.getElementById('concetto-detail-content');
    
    // Trova autori di riferimento
    let autoriRiferimento = '';
    if (concetto.autore_riferimento) {
        const autoriIds = concetto.autore_riferimento.split(',');
        const autori = autoriIds.map(id => {
            const filosofo = filosofiData.find(f => f.id === id.trim());
            return filosofo ? filosofo.nome : '';
        }).filter(nome => nome !== '');
        
        if (autori.length > 0) {
            autoriRiferimento = `<p><strong>Autori di riferimento:</strong> ${autori.join(', ')}</p>`;
        }
    }
    
    content.innerHTML = `
        <div class="detail-header">
            <h1 class="detail-name">${concetto.parola}</h1>
            <div class="detail-meta-grid">
                <div class="meta-item"><strong>Periodo:</strong> ${getPeriodoLabel(concetto.periodo)}</div>
                ${autoriRiferimento ? `<div class="meta-item">${autoriRiferimento}</div>` : ''}
            </div>
        </div>
        <div class="detail-info">
            <h3>Definizione</h3>
            <p>${concetto.definizione}</p>
        </div>
        ${concetto.esempio ? `
        <div class="detail-info">
            <h3>Esempio</h3>
            <p><em>${concetto.esempio}</em></p>
        </div>` : ''}
        ${concetto.evoluzione ? `
        <div class="detail-info">
            <h3>Evoluzione Storica</h3>
            <p>${concetto.evoluzione}</p>
        </div>` : ''}
        <div class="action-buttons-container">
            <button class="btn-analisi" onclick="openComparativeAnalysis('${concetto.parola}')">Analisi Comparativa</button>
            <button class="btn-tei" onclick="exportCurrentToTEI()">
                <i class="fas fa-file-code"></i> Esporta TEI/XML
            </button>

            <button class="btn-cite" onclick="showCitationModal()">
                <i class="fas fa-quote-left"></i> Cita
            </button>
        </div>
    `;
    showScreen('concetto-detail-screen');
}

// ==================== FUNZIONI MENU (NUOVE) ====================
function toggleMenuModal() {
    const modal = document.getElementById('top-menu-modal');
    if (!modal) return;
    
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function closeMenuModal(event = null) {
    const modal = document.getElementById('top-menu-modal');
    if (!modal) return;
    
    // Se c'è un evento, controlla che non sia stato cliccato sul contenuto del modal
    if (event && event.target.classList.contains('menu-modal-content')) {
        return;
    }
    
    modal.style.display = 'none';
}

function openCreditsScreen() {
    closeMenuModal();
    showScreen('credits-screen');
}

function openReportScreen() {
    closeMenuModal();
    showScreen('segnalazioni-screen');
}

function openProjectWorkPDF() {
    closeMenuModal();
    
    // Il tuo link pubblico esatto su GitHub Pages
    const urlDelMioPDF = 'https://derolu0.github.io/aeterna/Project-work.pdf';
    
    // Google Viewer forza la visualizzazione su tutti i telefoni (senza scaricare)
    window.open('https://drive.google.com/viewerng/viewer?embedded=true&url=' + encodeURIComponent(urlDelMioPDF), '_blank'); 
}

function openQRModal() {
    closeMenuModal();
    
    const modal = document.getElementById('qr-modal');
    const container = document.getElementById('qrcode-container');
    
    if (modal && container) {
        container.innerHTML = '';
        new QRCode(container, {
            text: 'https://derolu0.github.io/aeterna/',
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        modal.style.display = 'flex';
    }
}

function closeQRModal() {
    const modal = document.getElementById('qr-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openAdminPanel() {
    closeMenuModal();
    document.getElementById('admin-panel').style.display = 'flex';
    switchAdminTab('admin-filosofi');
}

function closeAdminPanel() {
    document.getElementById('admin-panel').style.display = 'none';
}

function checkAdminAuth() {
    const email = document.getElementById('admin-email')?.value;
    const password = document.getElementById('admin-password')?.value;
    
    if (email && password) {
        closeAdminAuth();
        openAdminPanel();
    } else {
        const errorElement = document.getElementById('auth-error');
        if (errorElement) {
            errorElement.style.display = 'block';
        }
    }
}

function closeAdminAuth() {
    const authElement = document.getElementById('admin-auth');
    if (authElement) {
        authElement.style.display = 'none';
    }
}

function logoutAdmin() {
    closeAdminPanel();
}

// ==================== GESTIONE MAPPA ====================
window.goToMapLocation = function(lat, lng, nome) {
    console.log(`🗺️ Navigazione verso: ${nome} [${lat}, ${lng}]`);
    
    if (typeof showScreen === 'function') {
        showScreen('mappa-screen');
    } else {
        document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
        document.getElementById('mappa-screen').style.display = 'block';
    }

    setTimeout(() => {
        if (philosophicalMap) {
            philosophicalMap.flyTo([lat, lng], 8, {
                duration: 1.5
            });
        } else {
            initPhilosophicalMap();
            setTimeout(() => {
                if (philosophicalMap) {
                    philosophicalMap.flyTo([lat, lng], 8, {
                        duration: 1.5
                    });
                }
            }, 500);
        }
    }, 300);
};

// ==================== MAPPA GEOGRAFICA ====================
function initPhilosophicalMap() {
    if (!document.getElementById('map')) return;
    if (philosophicalMap) return;
    
    try {
        philosophicalMap = L.map('map').setView([41.8719, 12.5674], 3);
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
    
    // Rimuovi layer precedente se esiste
    if (markersLayer) {
        markersLayer.remove();
    }
    
    // Crea un nuovo layer
    markersLayer = L.layerGroup().addTo(philosophicalMap);
    
    filosofiData.forEach(filosofo => {
        if (filosofo.coordinate && filosofo.coordinate.lat && filosofo.coordinate.lng) {
            const { lat, lng } = filosofo.coordinate;
            
            // Scegli icona in base al periodo
            const iconColor = filosofo.periodo === 'contemporaneo' ? 'orange' : 'blue';
            const icon = L.divIcon({
                html: `<div style="background-color: ${iconColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                className: 'custom-marker',
                iconSize: [20, 20]
            });
            
            const marker = L.marker([lat, lng], { icon: icon })
                .addTo(markersLayer)
                .bindPopup(`
                    <b>${filosofo.nome}</b><br>
                    <small>${filosofo.scuola || ''}</small><br>
                    <small>${filosofo.anni || ''}</small><br>
                    <button onclick="showFilosofoDetail('${filosofo.id}')" style="margin-top: 5px; padding: 3px 8px; background: #3b82f6; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        Vedi dettagli
                    </button>
                `);
            
            marker.on('click', () => {
                // Il popup si apre automaticamente
            });
        }
    });
}

// ==================== MAPPA CONCETTUALE ====================
function initConceptMap() {
    const container = document.getElementById('concept-network');
    if (!container) return;

    try {
        // Variabili per gestione click
        let clickTimer = null;
        let lastClickTime = 0;
        let lastClickNode = null;
        
        // Prepara nodi e collegamenti
        const nodes = new vis.DataSet();
        const edges = new vis.DataSet();
        
        // Aggiungi filosofi come nodi con colori distinti
        filosofiData.forEach(f => {
            const isClassico = f.periodo === 'classico';
            const textColor = isClassico ? '#ffffff' : '#ffffff'; // Testo bianco per entrambi (sarà su sfondo colorato)
            const borderColor = isClassico ? '#047857' : '#d97706';
            const bgColor = isClassico ? '#10b981' : '#f59e0b';
            
            nodes.add({
                id: f.id,
                label: f.nome,
                group: f.periodo,
                title: `${f.nome}\n${f.scuola || ''}\n${f.anni || ''}`,
                value: 25,
                shape: 'dot',
                color: {
                    background: bgColor,
                    border: borderColor,
                    highlight: {
                        background: isClassico ? '#34d399' : '#fbbf24',
                        border: isClassico ? '#059669' : '#f59e0b'
                    },
                    hover: {
                        background: isClassico ? '#34d399' : '#fbbf24',
                        border: isClassico ? '#059669' : '#f59e0b'
                    }
                },
                font: {
                    size: 12,
                    color: textColor,
                    face: 'Inter',
                    strokeWidth: 2,
                    strokeColor: 'rgba(0,0,0,0.5)',
                    align: 'center',
                    bold: {
                        color: textColor,
                        size: 12,
                        vadjust: 0,
                        mod: 'bold'
                    }
                },
                borderWidth: 2,
                borderWidthSelected: 4
            });
        });
        
        // Aggiungi concetti come nodi
        concettiData.forEach(c => {
            const isBothPeriods = c.periodo === 'entrambi';
            const bgColor = isBothPeriods ? '#8b5cf6' : 
                          (c.periodo === 'classico' ? '#10b981' : '#f59e0b');
            const borderColor = isBothPeriods ? '#7c3aed' : 
                              (c.periodo === 'classico' ? '#047857' : '#d97706');
            
            nodes.add({
                id: 'C_' + c.id,
                label: c.parola,
                group: 'concetto',
                title: `${c.parola}\n${c.definizione ? (c.definizione.substring(0, 120) + '...') : ''}`,
                value: 20,
                shape: 'diamond',
                color: {
                    background: bgColor,
                    border: borderColor,
                    highlight: {
                        background: '#a78bfa',
                        border: '#8b5cf6'
                    },
                    hover: {
                        background: '#a78bfa',
                        border: '#8b5cf6'
                    }
                },
                font: {
                    size: 11,
                    color: '#ffffff',
                    face: 'Inter',
                    strokeWidth: 2,
                    strokeColor: 'rgba(0,0,0,0.5)',
                    align: 'center',
                    bold: {
                        color: '#ffffff',
                        size: 11,
                        vadjust: 0,
                        mod: 'bold'
                    }
                },
                borderWidth: 2,
                borderWidthSelected: 4
            });
        });
        
        // Crea collegamenti: filosofi -> loro concetti principali
        filosofiData.forEach(filosofo => {
            if (filosofo.concetti_principali) {
                filosofo.concetti_principali.forEach(concettoNome => {
                    const concetto = concettiData.find(c => c.parola === concettoNome);
                    if (concetto) {
                        edges.add({
                            from: filosofo.id,
                            to: 'C_' + concetto.id,
                            arrows: {
                                to: {
                                    enabled: true,
                                    scaleFactor: 0.8
                                }
                            },
                            color: {
                                color: filosofo.periodo === 'contemporaneo' ? '#f59e0b' : '#10b981',
                                opacity: 0.7,
                                highlight: '#ef4444'
                            },
                            width: 1.5
                        });
                    }
                });
            }
        });
        
        // Crea collegamenti: concetti -> autori di riferimento
        concettiData.forEach(concetto => {
            if (concetto.autore_riferimento) {
                const autoriIds = concetto.autore_riferimento.split(',');
                autoriIds.forEach(autoreId => {
                    const id = autoreId.trim();
                    if (filosofiData.find(f => f.id === id)) {
                        edges.add({
                            from: 'C_' + concetto.id,
                            to: id,
                            arrows: {
                                to: {
                                    enabled: true,
                                    scaleFactor: 0.8
                                }
                            },
                            color: {
                                color: '#8b5cf6',
                                opacity: 0.7,
                                highlight: '#ef4444'
                            },
                            width: 1.5
                        });
                    }
                });
            }
        });
        
        // Configurazione ottimizzata per leggibilità
        const data = { nodes: nodes, edges: edges };
        const options = {
            nodes: {
                shapeProperties: {
                    useBorderWithImage: true,
                    interpolation: false
                },
                borderWidth: 2,
                borderWidthSelected: 4,
                size: 30,
                scaling: {
                    min: 25,
                    max: 40,
                    label: {
                        enabled: true,
                        min: 10,
                        max: 14,
                        maxVisible: 1000,
                        drawThreshold: 0
                    }
                },
                shadow: {
                    enabled: true,
                    color: 'rgba(0,0,0,0.3)',
                    size: 8,
                    x: 3,
                    y: 3
                },
                chosen: {
                    node: function(values, id, selected, hovering) {
                        if (hovering) {
                            values.size = 35;
                            values.font.size = 13;
                            values.borderWidth = 3;
                        }
                    }
                }
            },
            edges: {
                width: 1.5,
                smooth: {
                    type: 'continuous',
                    roundness: 0.5
                },
                color: {
                    inherit: 'from',
                    opacity: 0.6
                },
                arrows: {
                    to: {
                        enabled: true,
                        scaleFactor: 0.7,
                        type: 'arrow'
                    }
                },
                hoverWidth: 2.5,
                selectionWidth: 2.5
            },
            groups: {
                classico: { 
                    color: { 
                        background: '#10b981', 
                        border: '#047857',
                        highlight: { background: '#34d399', border: '#059669' },
                        hover: { background: '#34d399', border: '#059669' }
                    },
                    font: { 
                        color: '#ffffff',
                        size: 12,
                        face: 'Inter',
                        strokeWidth: 2,
                        strokeColor: 'rgba(0,0,0,0.4)',
                        bold: {
                            color: '#ffffff',
                            size: 12,
                            vadjust: 0,
                            mod: 'bold'
                        }
                    },
                    shape: 'dot',
                    size: 30
                },
                contemporaneo: { 
                    color: { 
                        background: '#f59e0b', 
                        border: '#d97706',
                        highlight: { background: '#fbbf24', border: '#f59e0b' },
                        hover: { background: '#fbbf24', border: '#f59e0b' }
                    },
                    font: { 
                        color: '#ffffff',
                        size: 12,
                        face: 'Inter',
                        strokeWidth: 2,
                        strokeColor: 'rgba(0,0,0,0.4)',
                        bold: {
                            color: '#ffffff',
                            size: 12,
                            vadjust: 0,
                            mod: 'bold'
                        }
                    },
                    shape: 'dot',
                    size: 30
                },
                concetto: { 
                    color: { 
                        background: '#8b5cf6', 
                        border: '#7c3aed',
                        highlight: { background: '#a78bfa', border: '#8b5cf6' },
                        hover: { background: '#a78bfa', border: '#8b5cf6' }
                    },
                    font: { 
                        color: '#ffffff',
                        size: 11,
                        face: 'Inter',
                        strokeWidth: 2,
                        strokeColor: 'rgba(0,0,0,0.4)',
                        bold: {
                            color: '#ffffff',
                            size: 11,
                            vadjust: 0,
                            mod: 'bold'
                        }
                    },
                    shape: 'diamond',
                    size: 35
                }
            },
            physics: {
                enabled: true,
                stabilization: {
                    iterations: 200,
                    updateInterval: 25,
                    onlyDynamicEdges: false,
                    fit: true
                },
                barnesHut: {
                    gravitationalConstant: -1800,
                    centralGravity: 0.3,
                    springLength: 200,
                    springConstant: 0.05,
                    damping: 0.12,
                    avoidOverlap: 0.9
                },
                solver: 'barnesHut',
                timestep: 0.5,
                adaptiveTimestep: true
            },
            interaction: {
                hover: true,
                hoverConnectedEdges: true,
                selectable: true,
                selectConnectedEdges: true,
                zoomView: true,
                dragView: true,
                navigationButtons: {
                    enabled: true,
                    zoomIn: {
                        cssClass: 'custom-zoom-in',
                        title: 'Zoom In'
                    },
                    zoomOut: {
                        cssClass: 'custom-zoom-out',
                        title: 'Zoom Out'
                    },
                    reset: {
                        cssClass: 'custom-reset',
                        title: 'Reset View'
                    }
                },
                keyboard: {
                    enabled: true,
                    speed: { x: 10, y: 10, zoom: 0.02 },
                    bindToWindow: true
                },
                tooltipDelay: 150,
                multiselect: false,
                zoomSpeed: 0.5,
                dragSpeed: 0.5
            },
            layout: {
                randomSeed: 42,
                improvedLayout: true,
                hierarchical: {
                    enabled: false,
                    direction: 'UD',
                    sortMethod: 'hubsize'
                }
            },
            configure: {
                enabled: false,
                filter: 'nodes,edges',
                showButton: false
            }
        };

        // Crea la rete
        if (networkInstance) {
            networkInstance.destroy();
        }
        networkInstance = new vis.Network(container, data, options);
        
        // Aggiungi stili CSS per le animazioni
        const animationStyle = document.createElement('style');
        animationStyle.textContent = `
            @keyframes slideUp {
                from { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(20px); 
                }
                to { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(0); 
                }
            }
            
            @keyframes slideDown {
                from { 
                    opacity: 1; 
                    transform: translateX(-50%) translateY(0); 
                }
                to { 
                    opacity: 0; 
                    transform: translateX(-50%) translateY(20px); 
                }
            }
            
            .network-info-box {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(59, 130, 246, 0.95);
                color: white;
                padding: 12px 20px;
                border-radius: 10px;
                z-index: 10000;
                font-size: 14px;
                text-align: center;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                max-width: 90%;
                animation: slideUp 0.3s ease-out;
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255,255,255,0.2);
            }
            
            .network-info-box strong {
                font-weight: 700;
                color: #ffffff;
            }
            
            .network-info-box small {
                opacity: 0.9;
                font-size: 12px;
            }
            
            .custom-zoom-in, .custom-zoom-out, .custom-reset {
                background-color: #3b82f6 !important;
                color: white !important;
                border-radius: 6px !important;
                margin: 5px !important;
                padding: 8px !important;
                font-size: 16px !important;
                cursor: pointer !important;
                border: none !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
                font-weight: bold !important;
            }
            .custom-zoom-in:hover, .custom-zoom-out:hover, .custom-reset:hover {
                background-color: #2563eb !important;
                transform: translateY(-1px) !important;
            }
        `;
        document.head.appendChild(animationStyle);
        
        // Evento click migliorato
        networkInstance.on("click", function (params) {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - lastClickTime;
            
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                
                // Doppio click (entro 400ms)
                if (timeDiff < 400 && lastClickNode === nodeId) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                    lastClickTime = 0;
                    lastClickNode = null;
                    
                    // Rimuovi eventuali info box
                    const existingInfoBox = document.querySelector('.network-info-box');
                    if (existingInfoBox) {
                        existingInfoBox.remove();
                    }
                    
                    if (nodeId.startsWith('C_')) {
                        const concettoId = nodeId.substring(2);
                        console.log(`🎯 Doppio click su concetto: ${concettoId}`);
                        showConcettoDetail(concettoId);
                    } else {
                        console.log(`🎯 Doppio click su filosofo: ${nodeId}`);
                        showFilosofoDetail(nodeId);
                    }
                    return;
                }
                
                // Single click
                lastClickNode = nodeId;
                
                if (clickTimer) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                }
                
                clickTimer = setTimeout(function() {
                    const node = nodes.get(nodeId);
                    if (node) {
                        // Evidenzia il nodo
                        networkInstance.selectNodes([nodeId]);
                        networkInstance.focus(nodeId, {
                            scale: 1.3,
                            animation: {
                                duration: 600,
                                easingFunction: 'easeInOutQuad'
                            }
                        });
                        
                        // Determina colore in base al tipo di nodo
                        let bgColor = '#3b82f6'; // Default blu
                        if (nodeId.startsWith('C_')) {
                            bgColor = '#8b5cf6'; // Viola per concetti
                        } else {
                            // Per filosofi, usa il colore del periodo
                            const filosofo = filosofiData.find(f => f.id === nodeId);
                            bgColor = filosofo && filosofo.periodo === 'classico' ? '#10b981' : '#f59e0b';
                        }
                        
                        // Mostra messaggio chiaro sul doppio click
                        const message = `Click su: <strong>${node.label}</strong><br>
                                        <small>Doppio click per aprire i dettagli completi</small>`;
                        
                        // Rimuovi eventuali info box precedenti
                        const existingInfoBox = document.querySelector('.network-info-box');
                        if (existingInfoBox) {
                            existingInfoBox.remove();
                        }
                        
                        // Crea un messaggio temporaneo
                        const infoBox = document.createElement('div');
                        infoBox.className = 'network-info-box';
                        infoBox.innerHTML = message;
                        infoBox.style.background = `rgba(${hexToRgb(bgColor)}, 0.95)`;
                        infoBox.style.border = `2px solid ${bgColor}`;
                        
                        document.body.appendChild(infoBox);
                        
                        // Rimuovi dopo 2.5 secondi
                        setTimeout(() => {
                            if (infoBox.parentNode) {
                                infoBox.style.animation = 'slideDown 0.3s ease-out';
                                setTimeout(() => {
                                    if (infoBox.parentNode) {
                                        infoBox.parentNode.removeChild(infoBox);
                                    }
                                }, 300);
                            }
                        }, 2500);
                    }
                    
                    lastClickTime = 0;
                    lastClickNode = null;
                    clickTimer = null;
                    
                }, 300); // Ritardo per distinguere da doppio click
                
                lastClickTime = currentTime;
                
            } else if (params.edges.length > 0) {
                // Click su un collegamento
                const edgeId = params.edges[0];
                networkInstance.selectEdges([edgeId]);
                
                // Mostra informazioni sul collegamento
                const edge = edges.get(edgeId);
                if (edge) {
                    const fromNode = nodes.get(edge.from);
                    const toNode = nodes.get(edge.to);
                    
                    if (fromNode && toNode) {
                        const fromLabel = fromNode.label;
                        const toLabel = toNode.label;
                        const isFilosofoToConcetto = !edge.from.startsWith('C_') && edge.to.startsWith('C_');
                        const relation = isFilosofoToConcetto 
                            ? `${fromLabel} → sviluppa il concetto → ${toLabel}`
                            : `Il concetto ${fromLabel} → è riferito a → ${toLabel}`;
                        
                        showToast(relation, 'info', 2500);
                    }
                }
                
                // Reset click tracking
                if (clickTimer) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                }
                lastClickTime = 0;
                lastClickNode = null;
                
            } else {
                // Click su area vuota
                if (clickTimer) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                }
                lastClickTime = 0;
                lastClickNode = null;
                networkInstance.unselectAll();
                
                // Rimuovi eventuali info box
                const existingInfoBox = document.querySelector('.network-info-box');
                if (existingInfoBox) {
                    existingInfoBox.remove();
                }
            }
        });
        
        // Evento doppio click diretto (fallback)
        networkInstance.on("doubleClick", function (params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                
                if (nodeId.startsWith('C_')) {
                    const concettoId = nodeId.substring(2);
                    showConcettoDetail(concettoId);
                } else {
                    showFilosofoDetail(nodeId);
                }
            }
        });
        
        // Zoom automatico dopo stabilizzazione
        networkInstance.on("stabilizationIterationsDone", function() {
            networkInstance.fit({
                animation: {
                    duration: 1200,
                    easingFunction: 'easeInOutCubic'
                }
            });
            
            // Aggiungi istruzioni iniziali
            setTimeout(() => {
                const welcomeBox = document.createElement('div');
                welcomeBox.className = 'network-info-box';
                welcomeBox.innerHTML = `
                    <strong>Mappa Concettuale Filosofica</strong><br>
                    <small>• Click singolo: seleziona e zoomma<br>
                    • Doppio click: apri dettagli completi<br>
                    • Drag: sposta la mappa<br>
                    • Scroll: zoom avanti/indietro</small>
                `;
                welcomeBox.style.background = 'rgba(59, 130, 246, 0.95)';
                welcomeBox.style.zIndex = '10001';
                
                document.body.appendChild(welcomeBox);
                
                // Rimuovi dopo 5 secondi
                setTimeout(() => {
                    if (welcomeBox.parentNode) {
                        welcomeBox.style.animation = 'slideDown 0.3s ease-out';
                        setTimeout(() => {
                            if (welcomeBox.parentNode) {
                                welcomeBox.parentNode.removeChild(welcomeBox);
                            }
                        }, 300);
                    }
                }, 5000);
            }, 1500);
        });
        
        console.log("✅ Mappa concettuale generata con", nodes.length, "nodi e", edges.length, "collegamenti");
        
        // Funzione helper per convertire hex a rgb
        function hexToRgb(hex) {
            hex = hex.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `${r}, ${g}, ${b}`;
        }
        
    } catch (error) {
        console.error("❌ Errore generazione mappa concettuale:", error);
        container.innerHTML = `
            <div style="
                color: #dc2626;
                text-align: center;
                padding: 40px 20px;
                background: #fef2f2;
                border-radius: 12px;
                border: 2px dashed #fca5a5;
            ">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 15px;"></i>
                <h3 style="margin-bottom: 10px;">Errore nella visualizzazione della mappa concettuale</h3>
                <p style="color: #7f1d1d; font-size: 0.9rem;">${error.message || 'Errore sconosciuto'}</p>
                <button onclick="initConceptMap()" style="
                    margin-top: 20px;
                    padding: 10px 20px;
                    background: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                ">
                    <i class="fas fa-redo"></i> Riprova
                </button>
            </div>
        `;
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
    
    // Trova il concetto
    const concetto = concettiData.find(c => c.parola === termine);
    if (!concetto) {
        document.getElementById('evolution-timeline').innerHTML = '<p>Concetto non trovato per l\'analisi</p>';
        return;
    }
    
    // Salva l'ID del concetto per le funzioni TEI e Citation
    window.currentComparativeConcettoId = concetto.id;
    
    // Aggiorna la timeline
    updateEvolutionTimeline(concetto);
    
    // Aggiorna testi comparativi
    updateComparativeTexts(concetto);
    
    // Aggiorna trasformazioni
    updateTransformationsTable(concetto);
    
    modal.style.display = 'flex';
}

function closeComparativeModal() {
    const modal = document.getElementById('comparative-analysis-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateEvolutionTimeline(concetto) {
    const timelineContainer = document.getElementById('evolution-timeline');
    
    // Crea timeline semplice
    timelineContainer.innerHTML = `
        <div class="timeline-container">
            <div class="timeline-track">
                <div class="timeline-item period-classico" style="left: 20%;">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-year">Periodo Classico</div>
                        <div class="timeline-concept">${concetto.parola}</div>
                        <div class="timeline-excerpt">"${getClassicalDefinition(concetto.parola)}"</div>
                    </div>
                </div>
                <div class="timeline-item period-contemporaneo" style="left: 80%;">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-year">Periodo Contemporaneo</div>
                        <div class="timeline-concept">${concetto.parola}</div>
                        <div class="timeline-excerpt">"${getContemporaryDefinition(concetto.parola)}"</div>
                    </div>
                </div>
            </div>
            <div class="timeline-scale">
                <span>Antichità</span>
                <span>Medioevo</span>
                <span>Modernità</span>
                <span>Contemporaneità</span>
            </div>
        </div>
    `;
}

function updateComparativeTexts(concetto) {
    console.log(`📖 Caricamento testi per: ${concetto.parola}`);
    
    // Usa i dati da comparative-data.js
    if (window.comparativeData && window.comparativeData.testiComparativi) {
        const concettoNome = concetto.parola;
        const dati = window.comparativeData.testiComparativi[concettoNome];
        
        if (dati) {
            // Testo classico
            document.getElementById('classical-original-text').textContent = 
                dati.classico.testo || "Testo classico non disponibile";
            document.getElementById('classical-definition').textContent = 
                dati.classico.definizione || "Definizione classica non disponibile";
            
            // Testo contemporaneo
            document.getElementById('contemporary-original-text').textContent = 
                dati.contemporaneo.testo || "Testo contemporaneo non disponibile";
            document.getElementById('contemporary-definition').textContent = 
                dati.contemporaneo.definizione || "Definizione contemporanea non disponibile";
            
            console.log(`✅ Testi caricati da comparative-data.js per: ${concettoNome}`);
            
            // Aggiorna anche le metriche
            updateMetrics(dati.classico.testo, dati.contemporaneo.testo);
            return;
        }
    }
    
    // FALLBACK: Se non trova i dati
    const testiFallback = {
        'Essere': {
            classico: {
                testo: "L'essere si dice in molti modi. Tra questi, il primo e principale è la sostanza, che è ciò che esiste di per sé.",
                definizione: "Sostanza statica ed eterna, fondamento della realtà."
            },
            contemporaneo: {
                testo: "L'essere non è un ente, ma ciò che si dà nell'evento. La questione dell'essere è stata dimenticata dalla metafisica.",
                definizione: "Evento storico e processuale che si dà nella temporalità."
            }
        },
        'Verità': {
            classico: {
                testo: "Veritas est adaequatio rei et intellectus. La verità è la corrispondenza della cosa con l'intelletto.",
                definizione: "Corrispondenza oggettiva tra pensiero e realtà."
            },
            contemporaneo: {
                testo: "Non ci sono fatti, solo interpretazioni. La verità è quella specie di errore senza la quale una determinata specie di esseri viventi non potrebbe vivere.",
                definizione: "Costruzione storica e interpretativa, non corrispondenza oggettiva."
            }
        }
    };
    
    const concettoNome = concetto.parola;
    const datiFallback = testiFallback[concettoNome] || {
        classico: {
            testo: `Testo originale classico per "${concettoNome}"`,
            definizione: `Definizione canonica classica per "${concettoNome}"`
        },
        contemporaneo: {
            testo: `Testo originale contemporaneo per "${concettoNome}"`,
            definizione: `Definizione canonica contemporanea per "${concettoNome}"`
        }
    };
    
    document.getElementById('classical-original-text').textContent = datiFallback.classico.testo;
    document.getElementById('classical-definition').textContent = datiFallback.classico.definizione;
    document.getElementById('contemporary-original-text').textContent = datiFallback.contemporaneo.testo;
    document.getElementById('contemporary-definition').textContent = datiFallback.contemporaneo.definizione;
    
    console.log(`⚠️ Usati dati di fallback per: ${concettoNome}`);
    updateMetrics(datiFallback.classico.testo, datiFallback.contemporaneo.testo);
}

function updateTransformationsTable(concetto) {
    const tableBody = document.getElementById('transformations-body');
    if (!tableBody) return;
    
    // Ottieni trasformazioni da comparativeData
    const trasformazioni = window.comparativeData?.trasformazioni?.[concetto.parola] || [
        "Trasformazione ontologica: da sostanza statica a evento dinamico",
        "Trasformazione epistemologica: da oggetto di conoscenza a interpretazione",
        "Trasformazione etica: da fondamento assoluto a costruzione storica"
    ];
    
    const aspetti = ['Ontologica', 'Epistemologica', 'Etica', 'Politica'];
    
    tableBody.innerHTML = trasformazioni.map((trasformazione, index) => {
        const aspetto = aspetti[index] || 'Generale';
        
        return `
            <tr>
                <td><strong>${aspetto}</strong></td>
                <td>${trasformazione}</td>
                <td>
                    <span class="badge ${
                        index % 3 === 0 ? 'badge-classico' : 
                        index % 3 === 1 ? 'badge-transizione' : 'badge-contemporaneo'
                    }">
                        ${index % 3 === 0 ? 'IV sec. a.C.' : 
                          index % 3 === 1 ? 'XIX sec.' : 'XX sec.'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function updateMetrics(testoClassico, testoContemporaneo) {
    // Analisi semplice
    const paroleClassico = testoClassico.split(' ').length;
    const paroleContemporaneo = testoContemporaneo.split(' ').length;
    
    // Aggiorna metriche classiche
    document.getElementById('classical-metrics').innerHTML = `
        <div class="metric-item">
            <span class="metric-label">Parole:</span>
            <span class="metric-value">${paroleClassico}</span>
        </div>
        <div class="metric-item">
            <span class="metric-label">Complessità:</span>
            <span class="metric-value">${paroleClassico > 50 ? 'alta' : 'media'}</span>
        </div>
        <div class="metric-item">
            <span class="metric-label">Struttura:</span>
            <span class="metric-value">sistematica</span>
        </div>
    `;
    
    // Aggiorna metriche contemporanee
    document.getElementById('contemporary-metrics').innerHTML = `
        <div class="metric-item">
            <span class="metric-label">Parole:</span>
            <span class="metric-value">${paroleContemporaneo}</span>
        </div>
        <div class="metric-item">
            <span class="metric-label">Complessità:</span>
            <span class="metric-value">${paroleContemporaneo > 60 ? 'molto alta' : 'alta'}</span>
        </div>
        <div class="metric-item">
            <span class="metric-label">Struttura:</span>
            <span class="metric-value">ermeneutica</span>
        </div>
    `;
}

// Funzioni per definizioni brevi
function getClassicalDefinition(concetto) {
    const defs = {
        'Essere': 'Sostanza statica ed eterna',
        'Verità': 'Corrispondenza tra pensiero e realtà',
        'Soggetto': 'Sostanza pensante autonoma',
        'Bene': 'Idea trascendente e oggettiva',
        'Potere': 'Diritto sovrano di vita e di morte',
        'Libertà': 'Autonomia della volontà razionale'
    };
    return defs[concetto] || 'Definizione classica';
}

function getContemporaryDefinition(concetto) {
    const defs = {
        'Essere': 'Evento storico e processuale',
        'Verità': 'Costruzione discorsiva e interpretativa',
        'Soggetto': 'Effetto di pratiche discorsive',
        'Bene': 'Relazione etica con l\'altro',
        'Potere': 'Rete diffusa e produttiva',
        'Libertà': 'Condizione esistenziale e progetto'
    };
    return defs[concetto] || 'Definizione contemporanea';
}

// ==================== UTILITY ====================
function generateMapButton(filosofo) {
    if (filosofo.coordinate && 
        typeof filosofo.coordinate.lat !== 'undefined' && 
        typeof filosofo.coordinate.lng !== 'undefined') {
        
        return `
            <button class="action-btn map-btn" 
                onclick="goToMapLocation(${filosofo.coordinate.lat}, ${filosofo.coordinate.lng}, '${filosofo.nome.replace(/'/g, "\\'")}')">
                <i class="fas fa-map-marker-alt"></i> Vedi Luogo
            </button>
        `;
    }
    return '<button class="action-btn disabled" disabled><i class="fas fa-map-slash"></i> Luogo non disponibile</button>';
}

function setFilter(filter) {
    currentFilter = filter;
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
function setFilterOpere(filter) {
    currentFilterOpere = filter;
    document.querySelectorAll('#opere-screen .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((filter === 'all' && btn.classList.contains('all')) || 
            (filter === 'classico' && btn.classList.contains('funzionante')) ||
            (filter === 'contemporaneo' && btn.classList.contains('non-funzionante'))) {
            btn.classList.add('active');
        }
    });
    renderOpereList();
}

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
function searchConcetti(query) {
    const term = query.toLowerCase();
    // Puntiamo alle card create dentro la griglia[cite: 9]
    const items = document.querySelectorAll('#concetti-list .concetto-card');
    
    items.forEach(item => {
        const title = item.querySelector('.concetto-parola').textContent.toLowerCase();
        const definizione = item.querySelector('.concetto-definizione').textContent.toLowerCase();
        
        // Se il termine è nel titolo o nella definizione, mostra la card[cite: 9]
        if (title.includes(term) || definizione.includes(term)) {
            item.style.display = ''; // Ripristina lo stile CSS (flex/block)
        } else {
            item.style.display = 'none'; // Nasconde la card
        }
    });
}
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

// ==================== PWA ====================
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
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

// ==================== ESPORTAZIONE DATI ====================
function exportFilosofiToExcel() {
    exportToCSV('filosofi', filosofiData);
}

function exportOpereToExcel() {
    exportToCSV('opere', opereData);
}

function exportConcettiToExcel() {
    exportToCSV('concetti', concettiData);
}

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
        const headers = Object.keys(data[0]);
        const csvRows = [];
        csvRows.push(headers.join(','));

        for (const row of data) {
            const values = headers.map(header => {
                const val = row[header] !== undefined ? '' + row[header] : '';
                const escaped = val.replace(/"/g, '\\"');
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
        a.setAttribute('download', `aeterna_${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showToast(`Export ${filename} completato`, "success");
    } catch (error) {
        console.error("Errore export:", error);
        showToast("Errore durante l'esportazione", "error");
    }
}

// ==================== FUNZIONI GLOBALI ====================
window.showScreen = showScreen;
window.goBack = goBack;
window.toggleMenuModal = toggleMenuModal;
window.closeMenuModal = closeMenuModal;
window.openCreditsScreen = openCreditsScreen;
window.openReportScreen = openReportScreen;
window.openProjectWorkPDF = openProjectWorkPDF;
window.openQRModal = openQRModal;
window.closeQRModal = closeQRModal;
window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.checkAdminAuth = checkAdminAuth;
window.closeAdminAuth = closeAdminAuth;
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
window.goToMapLocation = goToMapLocation;
window.initConceptMap = initConceptMap;
window.exportFilosofiToExcel = exportFilosofiToExcel;
window.exportOpereToExcel = exportOpereToExcel;
window.exportConcettiToExcel = exportConcettiToExcel;
window.exportFullDataset = exportFullDataset;
window.setFilterOpere = setFilterOpere;
window.searchConcetti = searchConcetti;
window.shareAppLink = shareAppLink;
window.exportToTEI = exportToTEI;
window.exportCurrentToTEI = exportCurrentToTEI;
window.exportComparativeToTEI = exportComparativeToTEI;
window.citeComparativeAnalysis = citeComparativeAnalysis;
window.updateJSONLD = updateJSONLD;
window.saveCurrentStateToURL = saveCurrentStateToURL;
window.loadStateFromURL = loadStateFromURL;
window.shareResearchLink = shareResearchLink;
window.generateResearchQRCode = generateResearchQRCode;

// Funzioni admin placeholder (per compatibilità)
window.loadAdminFilosofi = window.loadAdminFilosofi || function(){ 
    console.log("Caricamento admin filosofi - dati già integrati");
};
window.loadAdminOpere = window.loadAdminOpere || function(){
    console.log("Caricamento admin opere - dati già integrati");
};
window.loadAdminConcetti = window.loadAdminConcetti || function(){
    console.log("Caricamento admin concetti - dati già integrati");
};

// ==================== FIX AUTOMATICO PER TAB BAR ====================
function fixTabBarSpacing() {
    // Per tutte le schermate tranne la home
    document.querySelectorAll('.screen:not(#home-screen)').forEach(screen => {
        const contentArea = screen.querySelector('.content-area, .detail-content');
        if (contentArea) {
            contentArea.style.paddingBottom = '80px';
        }
    });
    console.log('✅ Spazio per tab bar aggiunto');
}

// Esegui il fix dopo il caricamento
document.addEventListener('DOMContentLoaded', fixTabBarSpacing);

// Intercetta la funzione showScreen per applicare il fix dopo ogni cambio schermata
const originalShowScreen = window.showScreen;
window.showScreen = function(screenId) {
    originalShowScreen(screenId);
    // Dopo aver cambiato schermata, applica il fix
    setTimeout(fixTabBarSpacing, 100);
};

// ==================== DEBUG E VERIFICA ====================

// Debug: verifica caricamento dati analisi comparativa
console.log("🔍 ANALISI CARICAMENTO DATI:");
console.log("comparativeData caricato?", !!window.comparativeData);
if (window.comparativeData) {
    console.log("Concetti disponibili:", Object.keys(window.comparativeData.testiComparativi || {}));
    
    // Test di funzionamento per un concetto specifico
    if (window.comparativeData.testiComparativi && window.comparativeData.testiComparativi['Essere']) {
        console.log("✅ Dati per 'Essere' presenti:", {
            autoreClassico: window.comparativeData.testiComparativi['Essere'].classico.autore,
            autoreContemporaneo: window.comparativeData.testiComparativi['Essere'].contemporaneo.autore
        });
    }
}

// ==================== FINE APP.JS ====================

console.log('📚 Aeterna Lexicon App.js v4.0.0 - Analisi del Lessico Filosofico - READY');
// ==================== FUNZIONE CONDIVISIONE NATIVA ====================
function shareAppLink() {
    const shareData = {
        title: 'Aeterna - Lexicon in Motu',
        text: 'Analisi computazionale del lessico Filosofico tra Classico e Contemporaneo.',
        url: 'https://derolu0.github.io/aeterna/'
    };

    // Verifica se il browser supporta la condivisione nativa
    if (navigator.share) {
        navigator.share(shareData)
            .then(() => console.log('✅ Condivisione riuscita'))
            .catch((error) => console.log('❌ Errore condivisione:', error));
    } else {
        // Fallback: se il browser non lo supporta (es. PC vecchi), copia il link
        navigator.clipboard.writeText(shareData.url);
        alert("Link copiato negli appunti! (Il tuo browser non supporta la condivisione diretta)");
    }
}

// ============================================================
// MODULI SCIENTIFICI AETERNA v5.0 (PUNTO 1 & 2)
// ============================================================

/**
 * PUNTO 1: TEI/XML EXPORT ENGINE
 * Esporta un'entità in formato TEI/XML (Text Encoding Initiative)
 */
function exportToTEI(data, type = 'concept') {
    const timestamp = new Date().toISOString();
    const dateForXML = timestamp.split('T')[0];
    
    let teiTemplate = '';
    
    switch(type) {
        case 'concept':
            teiTemplate = generateConceptTEI(data, timestamp, dateForXML);
            break;
        case 'philosopher':
            teiTemplate = generatePhilosopherTEI(data, timestamp, dateForXML);
            break;
        case 'work':
            teiTemplate = generateWorkTEI(data, timestamp, dateForXML);
            break;
        default:
            console.error('Tipo non supportato per TEI export:', type);
            return;
    }
    
    const blob = new Blob([teiTemplate], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aeterna_${type}_${(data.parola || data.nome || data.titolo || 'export').replace(/[^a-z0-9]/gi, '_')}_TEI.xml`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    if (typeof showToast === 'function') showToast(`✅ Esportazione TEI completata`, 'success');
}

/**
 * PUNTO 2: CITATION ENGINE
 * Mostra il modale con le citazioni in APA, MLA, Chicago
 */
function showCitationModal() {
    let data;
    let type;
    
    if (currentScreen === 'concetto-detail-screen') {
        data = concettiData.find(c => c.id === window.currentConcettoId);
        type = 'concept';
    } else if (currentScreen === 'filosofo-detail-screen') {
        data = filosofiData.find(f => f.id === window.currentFilosofoId);
        type = 'philosopher';
    } else if (currentScreen === 'opera-detail-screen') {
        data = opereData.find(o => o.id === window.currentOperaId);
        type = 'work';
    }

    if (!data) {
        if (typeof showToast === 'function') showToast("Dati non trovati", "error");
        return;
    }

    const formats = ['apa', 'mla', 'chicago'];
    const formatNames = { apa: 'APA (7th ed.)', mla: 'MLA (9th ed.)', chicago: 'Chicago (17th ed.)' };
    
    let html = `<div style="text-align:left; font-family: sans-serif;">
                    <p style="margin-bottom:15px; font-size:0.9rem; color:#555;">📖 Seleziona il formato e copia la citazione:</p>`;

    for (const f of formats) {
        const text = generateCitation(data, f);
        const uniqueId = `cit-${f}-${Date.now()}`;
        html += `<div style="background:#f4f4f4; padding:12px; border-radius:8px; margin-bottom:12px; border-left:4px solid #2c3e50;">
                    <small style="font-weight:bold; color:#2c3e50; display:block; text-transform:uppercase; margin-bottom:5px;">${formatNames[f]}</small>
                    <div id="${uniqueId}" style="font-size:0.85rem; word-break:break-all; font-family:monospace; background:white; padding:8px; border-radius:4px;">${escapeHtml(text)}</div>
                    <button onclick="copyCitationById('${uniqueId}')" style="margin-top:8px; background:#2c3e50; color:white; border:none; padding:6px 12px; border-radius:5px; cursor:pointer; font-size:0.75rem;">
                        📋 Copia
                    </button>
                 </div>`;
    }
    
    html += `<button onclick="closeCitationModal()" style="margin-top:10px; background:#ef4444; color:white; border:none; padding:8px 16px; border-radius:5px; cursor:pointer; width:100%;">
                ✖ Chiudi
             </button></div>`;
    
    // Crea o riutilizza il modale
    let modal = document.getElementById('citation-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'citation-modal';
        modal.className = 'modal-overlay';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 550px; max-height: 80vh; overflow-y: auto;">
                <h3 class="modal-title" style="margin-bottom: 15px;">📚 Citazione Scientifica</h3>
                <div id="citation-content"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Chiudi cliccando fuori
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeCitationModal();
        });
    }
    
    const contentDiv = document.getElementById('citation-content');
    if (contentDiv) contentDiv.innerHTML = html;
    modal.style.display = 'flex';
}

function closeCitationModal() {
    const modal = document.getElementById('citation-modal');
    if (modal) modal.style.display = 'none';
}

function copyCitationById(elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const text = element.innerText;
    navigator.clipboard.writeText(text).then(() => {
        if (typeof showToast === 'function') {
            showToast("✅ Citazione copiata negli appunti!", "success");
        } else {
            alert("Citazione copiata!");
        }
    }).catch(() => {
        alert("Errore durante la copia");
    });
}

/**
 * Genera la stringa di citazione in diversi formati
 */
function generateCitation(data, format) {
    const now = new Date();
    const year = now.getFullYear();
    const accessDate = now.toLocaleDateString('it-IT');
    const title = data.parola || data.nome || data.titolo;
    const author = "De Rosa, S.";
    const siteName = "Aeterna Lexicon in Motu";
    const url = window.location.href;
    
    // Per opere, usa l'autore reale
    let authorForCite = author;
    if (data.autore && data.autore !== 'Sconosciuto') {
        authorForCite = data.autore;
    }

    switch (format) {
        case 'apa':
            return `${authorForCite} (${year}). ${title}. ${siteName}. Recuperato da ${url}`;
        case 'mla':
            return `"${title}." ${siteName}, ${year}, ${url}.`;
        case 'chicago':
            return `${authorForCite}. "${title}." ${siteName}. ${year}. ${url}.`;
        default:
            return "";
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// ==================== GENERATORI TEI SPECIFICI ====================

function generateConceptTEI(concept, timestamp, dateForXML) {
    let authorsXML = '';
    let authorNames = [];
    
    if (concept.autore_riferimento) {
        const authorIds = concept.autore_riferimento.split(',');
        authorNames = authorIds.map(id => {
            const philosopher = typeof filosofiData !== 'undefined' ? filosofiData.find(f => f.id === id.trim()) : null;
            return philosopher ? philosopher.nome : id.trim();
        }).filter(n => n);
        
        if (authorNames.length > 0) {
            authorsXML = `<respStmt><resp>Autore di riferimento</resp><name>${escapeXml(authorNames.join(', '))}</name></respStmt>`;
        }
    }
    
    const authorsString = authorNames.length > 0 ? authorNames.join(', ') : 'vari autori';
    
    return `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0" xml:lang="it">
  <teiHeader>
    <fileDesc>
      <titleStmt>
        <title>Aeterna - Concetto: ${escapeXml(concept.parola)}</title>
        <author>Aeterna Lexicon v5.0</author>
        ${authorsXML}
      </titleStmt>
      <publicationStmt>
        <publisher>Progetto Aeterna</publisher>
        <date when="${dateForXML}">${dateForXML}</date>
      </publicationStmt>
      <sourceDesc><p>Dataset di ${escapeXml(authorsString)}.</p></sourceDesc>
    </fileDesc>
  </teiHeader>
  <text>
    <body>
      <entry xml:id="${concept.id || 'c1'}">
        <form><orth>${escapeXml(concept.parola)}</orth></form>
        <sense>
          <def>${escapeXml(concept.definizione || '')}</def>
          <note type="periodo">${concept.periodo}</note>
        </sense>
      </entry>
    </body>
  </text>
</TEI>`;
}

function generatePhilosopherTEI(philosopher, timestamp, dateForXML) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0" xml:lang="it">
  <teiHeader>
    <fileDesc>
      <titleStmt><title>Aeterna - Filosofo: ${escapeXml(philosopher.nome)}</title></titleStmt>
      <publicationStmt><publisher>Progetto Aeterna</publisher></publicationStmt>
      <sourceDesc><p>Autore: ${escapeXml(philosopher.nome)}</p></sourceDesc>
    </fileDesc>
  </teiHeader>
  <text><body><p>${escapeXml(philosopher.biografia || '')}</p></body></text>
</TEI>`;
}

function generateWorkTEI(work, timestamp, dateForXML) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<TEI xmlns="http://www.tei-c.org/ns/1.0" xml:lang="it">
  <teiHeader>
    <fileDesc>
      <titleStmt><title>Aeterna - Opera: ${escapeXml(work.titolo)}</title></titleStmt>
      <publicationStmt><publisher>Progetto Aeterna</publisher></publicationStmt>
      <sourceDesc><p>Opera di ${escapeXml(work.autore || '')}</p></sourceDesc>
    </fileDesc>
  </teiHeader>
  <text><body><p>${escapeXml(work.sintesi || '')}</p></body></text>
</TEI>`;
}

function escapeXml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function exportCurrentToTEI() {
    let data, type;
    if (currentScreen === 'concetto-detail-screen') { 
        data = typeof concettiData !== 'undefined' ? concettiData.find(c => c.id === window.currentConcettoId) : null; 
        type = 'concept'; 
    } else if (currentScreen === 'filosofo-detail-screen') { 
        data = typeof filosofiData !== 'undefined' ? filosofiData.find(f => f.id === window.currentFilosofoId) : null; 
        type = 'philosopher'; 
    } else if (currentScreen === 'opera-detail-screen') { 
        data = typeof opereData !== 'undefined' ? opereData.find(o => o.id === window.currentOperaId) : null; 
        type = 'work'; 
    }
    
    if (data) exportToTEI(data, type);
    else if (typeof showToast === 'function') showToast('Nessun elemento trovato', 'error');
}

// ==================== ESTENSIONE ANALISI COMPARATIVA (PUNTO 1 & 2) ====================

/**
 * Esporta l'analisi comparativa in TEI/XML
 */
function exportComparativeToTEI() {
    const termine = document.getElementById('comparative-term-title').textContent;
    const concetto = concettiData.find(c => c.parola.toUpperCase() === termine || c.parola === termine);
    
    if (concetto) {
        exportToTEI(concetto, 'concept');
    } else {
        if (typeof showToast === 'function') {
            showToast('Errore: concetto non trovato per TEI export', 'error');
        } else {
            console.error('Concetto non trovato:', termine);
        }
    }
}

/**
 * Cita l'analisi comparativa
 */
function citeComparativeAnalysis() {
    const termine = document.getElementById('comparative-term-title').textContent;
    const concetto = concettiData.find(c => c.parola.toUpperCase() === termine || c.parola === termine);
    
    if (concetto) {
        window.currentConcettoId = concetto.id;
        showCitationModal();
    } else {
        if (typeof showToast === 'function') {
            showToast('Errore: concetto non trovato per la citazione', 'error');
        } else {
            console.error('Concetto non trovato:', termine);
        }
    }
}

// ==================== PUNTO 3: JSON-LD METADATA ====================

/**
 * Genera e inietta i metadati JSON-LD nel head della pagina
 */
function generateJSONLD() {
    const baseUrl = window.location.origin + window.location.pathname;
    const currentYear = new Date().getFullYear();
    
    const datasetSchema = {
        "@context": "https://schema.org",
        "@type": "Dataset",
        "name": "Aeterna Lexicon in Motu",
        "description": "Dataset per l'analisi delle trasformazioni del linguaggio filosofico tra Classico e Contemporaneo.",
        "version": "5.0.0",
        "url": baseUrl,
        "creator": {
            "@type": "Person",
            "name": "Salvatore De Rosa",
            "affiliation": {
                "@type": "Organization",
                "name": "Università Telematica Pegaso"
            }
        },
        "license": "https://opensource.org/licenses/MIT",
        "dateModified": new Date().toISOString().split('T')[0],
        "keywords": ["Filosofia", "Digital Humanities", "Ontologia", "Epistemologia", "Etica"],
        "inLanguage": ["it", "en"]
    };
    
    let currentEntitySchema = null;
    
    if (currentScreen === 'concetto-detail-screen' && window.currentConcettoId) {
        const concetto = concettiData.find(c => c.id === window.currentConcettoId);
        if (concetto) {
            currentEntitySchema = {
                "@context": "https://schema.org",
                "@type": "DefinedTerm",
                "name": concetto.parola,
                "description": concetto.definizione,
                "termCode": concetto.id
            };
        }
    } else if (currentScreen === 'filosofo-detail-screen' && window.currentFilosofoId) {
        const filosofo = filosofiData.find(f => f.id === window.currentFilosofoId);
        if (filosofo) {
            currentEntitySchema = {
                "@context": "https://schema.org",
                "@type": "Person",
                "name": filosofo.nome,
                "description": filosofo.biografia,
                "affiliation": {
                    "@type": "Organization",
                    "name": filosofo.scuola || 'Filosofo indipendente'
                }
            };
        }
    } else if (currentScreen === 'opera-detail-screen' && window.currentOperaId) {
        const opera = opereData.find(o => o.id === window.currentOperaId);
        if (opera) {
            currentEntitySchema = {
                "@context": "https://schema.org",
                "@type": "Book",
                "name": opera.titolo,
                "description": opera.sintesi,
                "author": {
                    "@type": "Person",
                    "name": opera.autore
                },
                "datePublished": opera.anno
            };
        }
    }
    
    const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
    existingScripts.forEach(script => script.remove());
    
    const script1 = document.createElement('script');
    script1.type = 'application/ld+json';
    script1.textContent = JSON.stringify(datasetSchema, null, 2);
    document.head.appendChild(script1);
    
    if (currentEntitySchema) {
        const script2 = document.createElement('script');
        script2.type = 'application/ld+json';
        script2.textContent = JSON.stringify(currentEntitySchema, null, 2);
        document.head.appendChild(script2);
    }
    
    console.log('✅ JSON-LD Metadata generati');
}

function updateJSONLD() {
    setTimeout(() => {
        generateJSONLD();
    }, 100);
}
// ==================== PUNTO 4: COLLABORATIVE LINK SHARING ====================

/**
 * Salva lo stato attuale dell'app nell'URL
 * Permette di condividere la ricerca con i colleghi
 */
function saveCurrentStateToURL() {
    const state = {
        screen: currentScreen,
        v: '5.0.0', // versione per compatibilità futura
        t: Date.now() // timestamp per evitare cache
    };
    
    // Aggiungi ID dell'entità se siamo in un dettaglio
    if (currentScreen === 'concetto-detail-screen' && window.currentConcettoId) {
        state.c = window.currentConcettoId; // c = concept
    } else if (currentScreen === 'filosofo-detail-screen' && window.currentFilosofoId) {
        state.p = window.currentFilosofoId; // p = philosopher
    } else if (currentScreen === 'opera-detail-screen' && window.currentOperaId) {
        state.w = window.currentOperaId; // w = work
    }
    
    // Salva i filtri attivi
    if (currentFilter && currentFilter !== 'all') {
        state.f = currentFilter;
    }
    
    if (currentFilterOpere && currentFilterOpere !== 'all') {
        state.fo = currentFilterOpere;
    }
    
    // Salva le modalità visive
    if (document.body.classList.contains('quantum-mode')) {
        state.q = true;
    }
    
    if (document.body.classList.contains('dream-mode')) {
        state.d = true;
    }
    
    // Comprimi e codifica lo stato
    const compressed = btoa(JSON.stringify(state));
    
    // Crea nuovo URL senza ricaricare la pagina
    const url = new URL(window.location.href);
    url.searchParams.set('aeterna', compressed);
    
    // Aggiorna l'URL nella barra (senza ricaricare)
    window.history.pushState(state, '', url);
    
    return url.toString();
}

/**
 * Carica lo stato dall'URL (all'avvio o quando si apre un link condiviso)
 */
function loadStateFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedState = urlParams.get('aeterna');
    
    if (!encodedState) return false;
    
    try {
        const state = JSON.parse(atob(encodedState));
        
        // Verifica compatibilità versione
        if (state.v !== '5.0.0') {
            console.warn('Versione stato non compatibile:', state.v);
            return false;
        }
        
        // Reindirizza alla schermata corretta
        if (state.screen) {
            showScreen(state.screen);
        }
        
        // Attendi che la schermata sia caricata poi apri il dettaglio
        setTimeout(() => {
            if (state.c) {
                const concetto = concettiData.find(c => c.id === state.c);
                if (concetto) showConcettoDetail(state.c);
            } else if (state.p) {
                const filosofo = filosofiData.find(f => f.id === state.p);
                if (filosofo) showFilosofoDetail(state.p);
            } else if (state.w) {
                const opera = opereData.find(o => o.id === state.w);
                if (opera) showOperaDetail(state.w);
            }
            
            // Ripristina filtri
            if (state.f && typeof setFilter === 'function') {
                setFilter(state.f);
            }
            
            if (state.fo && typeof setFilterOpere === 'function') {
                setFilterOpere(state.fo);
            }
            
            // Ripristina modalità visive
            if (state.q && typeof window.enableQuantumMode === 'function') {
                setTimeout(() => window.enableQuantumMode(), 500);
            }
            
            if (state.d && typeof window.enterDreamMode === 'function') {
                setTimeout(() => window.enterDreamMode(), 500);
            }
        }, 300);
        
        console.log('✅ Stato caricato da URL:', state);
        return true;
        
    } catch (error) {
        console.error('Errore nel caricamento dello stato:', error);
        return false;
    }
}

/**
 * Condividi il link della ricerca corrente
 */
async function shareResearchLink() {
    const url = saveCurrentStateToURL();
    
    const shareData = {
        title: 'Aeterna Lexicon - Ricerca Filosofica',
        text: 'Esplora questa analisi su Aeterna Lexicon in Motu',
        url: url
    };
    
    // Usa Web Share API se disponibile (mobile/tablet)
    if (navigator.share) {
        try {
            await navigator.share(shareData);
            if (typeof showToast === 'function') {
                showToast('✅ Link condiviso!', 'success');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Errore condivisione:', error);
                fallbackCopyLink(url);
            }
        }
    } else {
        fallbackCopyLink(url);
    }
}

/**
 * Fallback: copia il link negli appunti
 */
function fallbackCopyLink(url) {
    navigator.clipboard.writeText(url).then(() => {
        if (typeof showToast === 'function') {
            showToast('🔗 Link copiato! Condividilo con i colleghi.', 'success');
        } else {
            alert('Link copiato: ' + url);
        }
    }).catch(() => {
        prompt('Copia manualmente questo link:', url);
    });
}

/**
 * Genera un QR code per il link della ricerca corrente
 */
function generateResearchQRCode() {
    const url = saveCurrentStateToURL();
    
    // Crea o riutilizza il modale QR esistente
    let modal = document.getElementById('qr-modal');
    const container = document.getElementById('qrcode-container');
    
    if (modal && container) {
        container.innerHTML = '';
        new QRCode(container, {
            text: url,
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        modal.style.display = 'flex';
    }
}