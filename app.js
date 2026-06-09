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
    
    // 1. CARICA DATI IMMEDIATAMENTE
    await loadPhilosophicalData();
    
    // 2. SETUP LISTENER
    if (typeof setupConnectionListeners === 'function') setupConnectionListeners();
    if (typeof setupImportListeners === 'function') setupImportListeners();
    
    // 3. CONTROLLA SE C'È STATO DA RIPRISTINARE
    const urlParams = new URLSearchParams(window.location.search);
    const hasSharedState = urlParams.has('aeterna');
    
    console.log('🔍 Presenza stato condiviso:', hasSharedState);
    
    // 4. GESTISCI SPLASH E NAVIGAZIONE
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('hidden');
            setTimeout(() => {
                splash.style.display = 'none';
            }, 500);
        }
        
        checkMaintenanceMode();
        
        // ===== LOGICA CORRETTA =====
        if (hasSharedState && typeof loadStateFromURL === 'function') {
            // Se c'è uno stato condiviso, carica QUELLO (non la home)
            console.log('🔄 Ripristino stato condiviso...');
            loadStateFromURL();
        } else {
            // Solo se non c'è stato condiviso, vai alla home
            showScreen('home-screen');
        }
        // ===========================
        
        handleUrlParameters();
        console.log('✅ Interfaccia Sbloccata');
    }, 2000);
    
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
    
    // ===== AGGIUNGI QUESTA RIGA =====
    if (typeof updateJSONLD === 'function') updateJSONLD();
    // ================================
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
    // Se c'è una visualizzazione sovrapposta attiva sul concetto precedente, ripulisci il container
    if (typeof disableSuperimposedVisualization === 'function') {
        disableSuperimposedVisualization();
    }

    window.currentConcettoId = id;  
    const concetto = concettiData.find(c => c.id === id);
    if (!concetto) return; // ← CORRETTO: Prima c'era '!concept' che bloccava l'esecuzione
    
    const content = document.getElementById('concetto-detail-content');
    if (!content) return;
    
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
        <div class="action-buttons-container" style="display: flex; gap: 10px; margin-top: 20px; flex-wrap: wrap;">
            <button class="btn-analisi" onclick="openComparativeAnalysis('${concetto.parola}')">Analisi Comparativa</button>
            <button class="btn-tei" onclick="exportCurrentToTEI()">
                <i class="fas fa-file-code"></i> Esporta TEI/XML
            </button>

            <button class="btn-cite" onclick="showCitationModal()">
                <i class="fas fa-quote-left"></i> Cita
            </button>

            <button class="btn-superimposed" onclick="enableSuperimposedVisualization('${concetto.id}')">
                <i class="fas fa-layer-group"></i> Visualizzazione Sovrapposta
            </button>
            <button class="btn-superimposed" onclick="disableSuperimposedVisualization()" style="display: none;" id="btn-disable-superimposed">
                <i class="fas fa-times"></i> Chiudi Visualizzazione
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
        // Pulisci container
        container.innerHTML = '';
        container.style.height = '600px';
        container.style.width = '100%';
        
        // Variabili per gestione click
        let clickTimer = null;
        let lastClickTime = 0;
        let lastClickNode = null;
        
        // Prepara nodi e collegamenti
        const nodes = new vis.DataSet();
        const edges = new vis.DataSet();
        
        // ============ 1. RAGGRUPPAMENTO SEMANTICO ============
        // Posizioni centrali per periodi
        const classicoCenter = { x: -300, y: 0 };
        const contemporaneoCenter = { x: 300, y: 0 };
        
        // Domini con posizioni angolari (per distribuzione ordinata)
        const domainAngles = {
            'Ontologia': 0,
            'Epistemologia': 72,
            'Etica': 144,
            'Politica': 216,
            'Estetica': 288,
            'Linguistica': 360,
            'Antropologia': 360,
            'Metafisica': 0,
            'Filosofia': 45
        };
        
        // ============ 2. AGGIUNTA FILOSOFI ============
        filosofiData.forEach((f, index) => {
            const isClassico = f.periodo === 'classico';
            const center = isClassico ? classicoCenter : contemporaneoCenter;
            
            // Calcola posizione angolare basata sul dominio principale
            const mainDomain = f.concetti_principali?.[0] || 'Filosofia';
            const angle = (domainAngles[mainDomain] || index * 15) * Math.PI / 180;
            const radius = 150 + (index * 5);
            
            const x = center.x + Math.cos(angle) * radius;
            const y = center.y + Math.sin(angle) * radius;
            
            const bgColor = isClassico ? '#10b981' : '#f59e0b';
            const borderColor = isClassico ? '#047857' : '#d97706';
            
            nodes.add({
                id: f.id,
                label: f.nome,
                group: f.periodo,
                title: `${f.nome}\n${f.scuola || ''}\n${f.anni || ''}`,
                value: 25,
                shape: 'dot',
                x: x,
                y: y,
                fixed: false,
                physics: true,
                color: {
                    background: bgColor,
                    border: borderColor,
                    highlight: {
                        background: isClassico ? '#34d399' : '#fbbf24',
                        border: isClassico ? '#059669' : '#f59e0b'
                    }
                },
                font: {
                    size: 12,
                    color: '#ffffff',
                    face: 'Inter',
                    strokeWidth: 2,
                    strokeColor: 'rgba(0,0,0,0.5)'
                },
                borderWidth: 2,
                borderWidthSelected: 4
            });
        });
        
        // ============ 3. AGGIUNTA CONCETTI ============
        concettiData.forEach((c, index) => {
            const isBothPeriods = c.periodo === 'entrambi';
            const isClassico = c.periodo === 'classico' || isBothPeriods;
            const center = isClassico ? classicoCenter : contemporaneoCenter;
            
            const angle = (domainAngles[c.dominio] || index * 20) * Math.PI / 180;
            const radius = 280;
            
            const x = center.x + Math.cos(angle) * radius;
            const y = center.y + Math.sin(angle) * radius;
            
            const bgColor = isBothPeriods ? '#8b5cf6' : (isClassico ? '#10b981' : '#f59e0b');
            const borderColor = isBothPeriods ? '#7c3aed' : (isClassico ? '#047857' : '#d97706');
            
            nodes.add({
                id: 'C_' + c.id,
                label: c.parola,
                group: 'concetto',
                title: `${c.parola}\n${c.dominio || 'Filosofia'}\n${c.definizione ? c.definizione.substring(0, 100) + '...' : ''}`,
                value: 20,
                shape: 'diamond',
                x: x,
                y: y,
                fixed: false,
                physics: true,
                color: {
                    background: bgColor,
                    border: borderColor,
                    highlight: {
                        background: isBothPeriods ? '#a78bfa' : (isClassico ? '#34d399' : '#fbbf24'),
                        border: isBothPeriods ? '#8b5cf6' : (isClassico ? '#059669' : '#f59e0b')
                    }
                },
                font: {
                    size: 11,
                    color: '#ffffff',
                    face: 'Inter',
                    strokeWidth: 2,
                    strokeColor: 'rgba(0,0,0,0.5)'
                },
                borderWidth: 2,
                borderWidthSelected: 4
            });
        });
        
        // ============ 4. CREAZIONE COLLEGAMENTI (Rafforzati) ============
        const conceptRelevance = new Map();
        for (const concetto of concettiData) {
            let relevance = 1;
            if (concetto.autore_riferimento) {
                relevance += concetto.autore_riferimento.split(',').length;
            }
            conceptRelevance.set(concetto.id, relevance);
        }

        // Collegamenti filosofi → concetti
        filosofiData.forEach(filosofo => {
            if (filosofo.concetti_principali) {
                filosofo.concetti_principali.forEach(concettoNome => {
                    const concetto = concettiData.find(c => c.parola === concettoNome);
                    if (concetto) {
                        const relevance = conceptRelevance.get(concetto.id) || 1;
                        const width = 1.5 + (relevance / 4);
                        
                        edges.add({
                            from: filosofo.id,
                            to: 'C_' + concetto.id,
                            arrows: { to: { enabled: true, scaleFactor: 0.8 } },
                            color: {
                                color: filosofo.periodo === 'contemporaneo' ? '#f59e0b' : '#10b981',
                                opacity: 0.85,
                                highlight: '#ef4444',
                                hover: '#ef4444'
                            },
                            width: width,
                            length: 150,
                            title: `Connessione: ${filosofo.nome} → ${concetto.parola}`
                        });
                    }
                });
            }
        });

        // Collegamenti concetti → autori di riferimento
        concettiData.forEach(concetto => {
            if (concetto.autore_riferimento) {
                const autoriIds = concetto.autore_riferimento.split(',');
                const relevance = conceptRelevance.get(concetto.id) || 1;
                const width = 1.5 + (relevance / 4);
                
                autoriIds.forEach(autoreId => {
                    const id = autoreId.trim();
                    if (filosofiData.find(f => f.id === id)) {
                        edges.add({
                            from: 'C_' + concetto.id,
                            to: id,
                            arrows: { to: { enabled: true, scaleFactor: 0.8 } },
                            color: { 
                                color: '#8b5cf6', 
                                opacity: 0.85,
                                highlight: '#f59e0b',
                                hover: '#f59e0b' 
                            },
                            width: width,
                            length: 150,
                            title: `Riferimento: ${concetto.parola} → ${autoreId}`
                        });
                    }
                });
            }
        });

        // ============ 5. CONFIGURAZIONE OTTIMIZZATA (Performance) ============
        const options = {
            nodes: {
                shapeProperties: { useBorderWithImage: true, interpolation: false },
                borderWidth: 2,
                borderWidthSelected: 4,
                size: 30,
                scaling: {
                    min: 25,
                    max: 40,
                    label: { enabled: true, min: 10, max: 14 }
                },
                shadow: { enabled: false } 
            },
            edges: {
                smooth: { type: 'dynamic' },
                hoverWidth: 3,
                selectionWidth: 4,
                color: { inherit: false }, 
                arrows: { to: { enabled: true, scaleFactor: 0.8, type: 'arrow' } },
                font: { align: 'middle', size: 10, color: '#343434' }
            },
            physics: {
                enabled: true,
                stabilization: { iterations: 150, updateInterval: 25, fit: true },
                solver: 'barnesHut',
                barnesHut: {
                    gravitationalConstant: -2000,
                    centralGravity: 0.3,
                    springLength: 180,
                    springConstant: 0.04,
                    damping: 0.09,
                    avoidOverlap: 1
                },
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
                hideEdgesOnDrag: true,
                tooltipDelay: 150,
                navigationButtons: true // Risolve l'errore di tipo bloccante in console
            },
            layout: { improvedLayout: true, hierarchical: { enabled: false } },
            configure: { enabled: false }
        };

        // Crea la rete
        if (networkInstance) {
            networkInstance.destroy();
        }

        const data = { nodes: nodes, edges: edges };
        networkInstance = new vis.Network(container, data, options);

        // ============ 6. EVENTI ============
        networkInstance.on("click", function(params) {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - lastClickTime;

            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];

                if (timeDiff < 400 && lastClickNode === nodeId) {
                    clearTimeout(clickTimer);
                    clickTimer = null;
                    lastClickTime = 0;
                    lastClickNode = null;

                    if (nodeId.startsWith('C_')) {
                        showConcettoDetail(nodeId.substring(2));
                    } else {
                        showFilosofoDetail(nodeId);
                    }
                    return;
                }

                lastClickNode = nodeId;
                if (clickTimer) clearTimeout(clickTimer);

                clickTimer = setTimeout(function() {
                    networkInstance.selectNodes([nodeId]);
                    networkInstance.focus(nodeId, {
                        scale: 1.2,
                        animation: { duration: 500, easingFunction: 'easeInOutQuad' }
                    });

                    const node = nodes.get(nodeId);
                    if (node) {
                        showToast(`🔍 ${node.label} - Doppio click per dettagli`, 'info', 2000);
                    }

                    lastClickTime = 0;
                    lastClickNode = null;
                    clickTimer = null;
                }, 300);

                lastClickTime = currentTime;
            } else {
                if (clickTimer) clearTimeout(clickTimer);
                lastClickTime = 0;
                lastClickNode = null;
                networkInstance.unselectAll();
            }
        });

        networkInstance.on("doubleClick", function(params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                if (nodeId.startsWith('C_')) {
                    showConcettoDetail(nodeId.substring(2));
                } else {
                    showFilosofoDetail(nodeId);
                }
            }
        });

        // ============ 7. STABILIZZAZIONE CONGELATA CORRETTA ============
        networkInstance.on("stabilizationIterationsDone", function() {
            networkInstance.setOptions({ physics: { enabled: false } });
            networkInstance.fit({
                animation: { duration: 800, easingFunction: 'easeInOutCubic' }
            });
            console.log('✅ Mappa concettuale stabilizzata e fisica congelata (60fps garantiti)');
        });

        console.log("✅ Mappa concettuale potenziata - Raggruppamento semantico attivo");

    } catch (error) {
        console.error("❌ Errore mappa concettuale:", error);
        container.innerHTML = `<div style="color: #dc2626; text-align: center; padding: 40px;">Errore: ${error.message}</div>`;
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
window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;
window.analyzeUploadedText = analyzeUploadedText;
window.clearUpload = clearUpload;
window.downloadAnalysisReport = downloadAnalysisReport;
window.clearUploadAndAnalyzeAgain = clearUploadAndAnalyzeAgain;
window.searchAndOpenConcept = searchAndOpenConcept;
window.enableSuperimposedVisualization = enableSuperimposedVisualization;
window.disableSuperimposedVisualization = disableSuperimposedVisualization;
window.closeLayerDetailModal = closeLayerDetailModal;
window.resetContextualFilter = resetContextualFilter;
window.showFilterIndicator = showFilterIndicator;
window.logAnalyticalChoice = logAnalyticalChoice;
window.viewFilterOnMap = viewFilterOnMap;
window.handleTemporalSlider = handleTemporalSlider;
window.applyTemporalFilter = applyTemporalFilter;
window.resetTemporalFilter = resetTemporalFilter;
window.updateLayerPriorityByEpoch = updateLayerPriorityByEpoch;
window.enableInterpretiveTraceability = enableInterpretiveTraceability;
window.disableInterpretiveTraceability = disableInterpretiveTraceability;
window.showConnectionExplanation = showConnectionExplanation;
window.closeExplanationModal = closeExplanationModal;
window.copyExplanationToClipboard = copyExplanationToClipboard;
window.enableExploratoryMode = enableExploratoryMode;
window.disableExploratoryMode = disableExploratoryMode;
window.randomExploration = randomExploration;
window.randomExploration = randomExploration;
window.toggleSonification = toggleSonification;
window.enableSonification = enableSonification;
window.disableSonification = disableSonification;
window.startConceptualAssessment = startConceptualAssessment;
window.nextAssessmentQuestion = nextAssessmentQuestion;
window.closeAssessmentModal = closeAssessmentModal;
window.exportAssessmentResults = exportAssessmentResults;
window.openParadigmTranslator = openParadigmTranslator;
window.closeParadigmTranslator = closeParadigmTranslator;
window.performParadigmTranslation = performParadigmTranslation;
window.enableSpatialVisualization = enableSpatialVisualization;
window.disableSpatialVisualization = disableSpatialVisualization;


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
        v: '5.0.0',
        t: Date.now()
    };
    
    // Aggiungi ID dell'entità se siamo in un dettaglio
    if (currentScreen === 'concetto-detail-screen' && window.currentConcettoId) {
        state.c = window.currentConcettoId;
    } else if (currentScreen === 'filosofo-detail-screen' && window.currentFilosofoId) {
        state.p = window.currentFilosofoId;
    } else if (currentScreen === 'opera-detail-screen' && window.currentOperaId) {
        state.w = window.currentOperaId;
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
    
    console.log('💾 [saveCurrentStateToURL] Stato salvato:', state);
    console.log('🔗 [saveCurrentStateToURL] URL generato:', url.toString());
    
    return url.toString();
}

/**
 * Carica lo stato dall'URL (all'avvio o quando si apre un link condiviso)
 */
function loadStateFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const encodedState = urlParams.get('aeterna');
    
    console.log('🔍 [loadStateFromURL] Stato trovato?', encodedState ? 'SI' : 'NO');
    console.log('🔍 [loadStateFromURL] URL corrente:', window.location.href);
    
    if (!encodedState) return false;
    
    try {
        const state = JSON.parse(atob(encodedState));
        console.log('📦 [loadStateFromURL] Stato decodificato:', state);
        
        // Verifica compatibilità versione
        if (state.v !== '5.0.0') {
            console.warn('Versione stato non compatibile:', state.v);
            return false;
        }
        
        // FUNZIONE DI RIPRISTINO FORZATO (ignora la home)
        const forceRestore = () => {
            console.log('🔄 [loadStateFromURL] Inizio ripristino FORZATO...');
            
            // 1. FORZA la schermata corretta (senza passare per showScreen che potrebbe avere logiche)
            if (state.screen) {
                // Nascondi TUTTE le schermate
                document.querySelectorAll('.screen').forEach(s => {
                    s.classList.remove('active');
                    s.style.display = 'none';
                });
                
                // Mostra SOLO la schermata desiderata
                const target = document.getElementById(state.screen);
                if (target) {
                    target.classList.add('active');
                    target.style.display = 'flex';
                    currentScreen = state.screen;
                    updateTabBar(state.screen);
                    if (typeof loadScreenData === 'function') loadScreenData(state.screen);
                    console.log('  ✓ Schermata FORZATA: ' + state.screen);
                } else {
                    console.error('  ✗ Schermata non trovata:', state.screen);
                }
            }
            
            // 2. APRI il dettaglio dell'entità
            setTimeout(() => {
                if (state.w && typeof showOperaDetail === 'function') {
                    const opera = opereData?.find(o => o.id === state.w);
                    if (opera) {
                        console.log('  ✓ Ripristino opera: ' + opera.titolo);
                        window.currentOperaId = state.w;
                        showOperaDetail(state.w);
                    } else {
                        console.warn('  ✗ Opera non trovata:', state.w);
                    }
                } else if (state.c && typeof showConcettoDetail === 'function') {
                    const concetto = concettiData?.find(c => c.id === state.c);
                    if (concetto) {
                        console.log('  ✓ Ripristino concetto: ' + concetto.parola);
                        window.currentConcettoId = state.c;
                        showConcettoDetail(state.c);
                    } else {
                        console.warn('  ✗ Concetto non trovato:', state.c);
                    }
                } else if (state.p && typeof showFilosofoDetail === 'function') {
                    const filosofo = filosofiData?.find(f => f.id === state.p);
                    if (filosofo) {
                        console.log('  ✓ Ripristino filosofo: ' + filosofo.nome);
                        window.currentFilosofoId = state.p;
                        showFilosofoDetail(state.p);
                    } else {
                        console.warn('  ✗ Filosofo non trovato:', state.p);
                    }
                }
                
                // 3. Ripristina filtri
                if (state.f && typeof setFilter === 'function') {
                    setFilter(state.f);
                    console.log('  ✓ Filtro: ' + state.f);
                }
                
                if (state.fo && typeof setFilterOpere === 'function') {
                    setFilterOpere(state.fo);
                    console.log('  ✓ Filtro opere: ' + state.fo);
                }
            }, 200);
        };
        
        // Se i dati non sono ancora pronti, attendi
        if (typeof concettiData !== 'undefined' && concettiData.length > 0 && 
            typeof filosofiData !== 'undefined' && filosofiData.length > 0 &&
            typeof opereData !== 'undefined' && opereData.length > 0) {
            forceRestore();
        } else {
            console.log('⏳ [loadStateFromURL] Attesa caricamento dati...');
            const waitInterval = setInterval(() => {
                if (typeof concettiData !== 'undefined' && concettiData.length > 0 && 
                    typeof filosofiData !== 'undefined' && filosofiData.length > 0 &&
                    typeof opereData !== 'undefined' && opereData.length > 0) {
                    clearInterval(waitInterval);
                    forceRestore();
                }
            }, 100);
            // Timeout di sicurezza dopo 5 secondi
            setTimeout(() => {
                clearInterval(waitInterval);
                console.warn('⚠️ Timeout attesa dati, tentativo comunque...');
                forceRestore();
            }, 5000);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ [loadStateFromURL] Errore:', error);
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
// ==================== PUNTO 5: UPLOAD & COMPARE ====================

/**
 * Apre il modale di upload per l'analisi testuale
 */
function openUploadModal() {
    // Crea o riutilizza il modale
    let modal = document.getElementById('upload-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'upload-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <h3 class="modal-title" style="margin-bottom: 15px;">
                    <i class="fas fa-file-upload"></i> Upload & Compare
                </h3>
                <p style="font-size: 0.9rem; color: #6b7280; margin-bottom: 20px; text-align: center;">
                    Carica un file PDF o TXT per analizzarlo con il motore semantico Aeterna
                </p>
                
                <div id="upload-zone" style="border: 2px dashed #cbd5e1; border-radius: 12px; padding: 40px; text-align: center; cursor: pointer; transition: all 0.3s ease;">
                    <i class="fas fa-cloud-upload-alt" style="font-size: 48px; color: #3b82f6; margin-bottom: 15px;"></i>
                    <p style="margin-bottom: 5px; font-weight: 500;">Trascina qui un file</p>
                    <p style="font-size: 0.8rem; color: #6b7280;">oppure <strong style="color: #3b82f6;">clicca per selezionare</strong></p>
                    <input type="file" id="upload-file-input" accept=".txt,.pdf,.csv" style="display: none;">
                </div>
                
                <div id="upload-preview" style="display: none; margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <i class="fas fa-file-alt" style="color: #3b82f6;"></i>
                            <strong id="upload-filename"></strong>
                            <span id="upload-filesize" style="font-size: 0.75rem; color: #6b7280; margin-left: 10px;"></span>
                        </div>
                        <button onclick="clearUpload()" style="background: none; border: none; color: #ef4444; cursor: pointer;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="upload-progress" style="display: none; margin-top: 10px;">
                        <div style="height: 4px; background: #e2e8f0; border-radius: 2px; overflow: hidden;">
                            <div id="upload-progress-bar" style="width: 0%; height: 100%; background: #3b82f6; transition: width 0.3s;"></div>
                        </div>
                    </div>
                </div>
                
                <div id="upload-analysis-options" style="display: none; margin-top: 20px;">
                    <h4 style="margin-bottom: 10px;">Opzioni di analisi:</h4>
                    <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <input type="checkbox" id="option-semantic-scan" checked> Scansione semantica (trova concetti Aeterna)
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                        <input type="checkbox" id="option-period-comparison" checked> Confronto classico/contemporaneo
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px;">
                        <input type="checkbox" id="option-originality-score"> Calcola originalità (beta)
                    </label>
                </div>
                
                <div id="upload-results" style="display: none; margin-top: 20px; max-height: 400px; overflow-y: auto;">
                    <!-- Risultati dell'analisi -->
                </div>
                
                <div class="modal-buttons" style="margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="btn-secondary" onclick="closeUploadModal()">Annulla</button>
                    <button id="upload-analyze-btn" class="btn-analisi" onclick="analyzeUploadedText()" style="display: none;">
                        <i class="fas fa-microscope"></i> Analizza Testo
                    </button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Setup event listener per drag & drop
        const dropZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('upload-file-input');
        
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#3b82f6';
            dropZone.style.background = '#eff6ff';
        });
        dropZone.addEventListener('dragleave', () => {
            dropZone.style.borderColor = '#cbd5e1';
            dropZone.style.background = 'transparent';
        });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.style.borderColor = '#cbd5e1';
            dropZone.style.background = 'transparent';
            const files = e.dataTransfer.files;
            if (files.length > 0) handleFileSelect(files[0]);
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFileSelect(e.target.files[0]);
        });
    }
    
    modal.style.display = 'flex';
}

function closeUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) modal.style.display = 'none';
    clearUpload();
}

function clearUpload() {
    const preview = document.getElementById('upload-preview');
    const options = document.getElementById('upload-analysis-options');
    const results = document.getElementById('upload-results');
    const analyzeBtn = document.getElementById('upload-analyze-btn');
    const fileInput = document.getElementById('upload-file-input');
    const dropZone = document.getElementById('upload-zone');
    
    if (preview) preview.style.display = 'none';
    if (options) options.style.display = 'none';
    if (results) {
        results.style.display = 'none';
        results.innerHTML = '';
    }
    if (analyzeBtn) analyzeBtn.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (dropZone) {
        dropZone.style.display = 'block';
    }
    
    window.uploadedText = null;
    window.uploadedFileName = null;
}

let uploadedText = null;
let uploadedFileName = null;

function handleFileSelect(file) {
    const validTypes = ['text/plain', 'application/pdf', 'text/csv'];
    const fileExt = file.name.split('.').pop().toLowerCase();
    
    if (!validTypes.includes(file.type) && !['txt', 'pdf', 'csv'].includes(fileExt)) {
        showToast('Formato non supportato. Usa TXT, PDF o CSV', 'error');
        return;
    }
    
    uploadedFileName = file.name;
    
    // Aggiorna anteprima
    const preview = document.getElementById('upload-preview');
    const filenameSpan = document.getElementById('upload-filename');
    const filesizeSpan = document.getElementById('upload-filesize');
    const dropZone = document.getElementById('upload-zone');
    const options = document.getElementById('upload-analysis-options');
    const analyzeBtn = document.getElementById('upload-analyze-btn');
    
    if (filenameSpan) filenameSpan.textContent = file.name;
    if (filesizeSpan) filesizeSpan.textContent = formatFileSize(file.size);
    if (preview) preview.style.display = 'block';
    if (dropZone) dropZone.style.display = 'none';
    if (options) options.style.display = 'block';
    if (analyzeBtn) analyzeBtn.style.display = 'inline-flex';
    
    // Leggi il file
    const reader = new FileReader();
    reader.onload = function(e) {
        if (file.type === 'application/pdf') {
            // Per PDF, mostriamo un messaggio che l'estrazione testo richiede librerie aggiuntive
            uploadedText = "[Testo estratto da PDF - per analisi completa si consiglia formato TXT]";
            showToast('PDF rilevato. Per migliore analisi, usa file TXT.', 'info');
        } else {
            uploadedText = e.target.result;
        }
        console.log('📄 File caricato:', file.name, 'Lunghezza:', uploadedText?.length);
    };
    reader.readAsText(file, 'UTF-8');
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function analyzeUploadedText() {
    if (!uploadedText) {
        showToast('Nessun testo da analizzare', 'error');
        return;
    }
    
    const options = {
        semanticScan: document.getElementById('option-semantic-scan')?.checked || false,
        periodComparison: document.getElementById('option-period-comparison')?.checked || false,
        originalityScore: document.getElementById('option-originality-score')?.checked || false
    };
    
    showToast('🔍 Analisi in corso...', 'info');
    
    // Esegui analisi
    const results = performTextAnalysis(uploadedText, options);
    displayUploadResults(results);
}

function performTextAnalysis(text, options) {
    const results = {
        fileName: uploadedFileName,
        textLength: text.length,
        wordCount: text.split(/\s+/).length,
        timestamp: new Date().toISOString(),
        semanticScan: null,
        periodComparison: null,
        originalityScore: null
    };
    
    if (options.semanticScan) {
        results.semanticScan = semanticScan(text);
    }
    
    if (options.periodComparison) {
        results.periodComparison = comparePeriods(text);
    }
    
    if (options.originalityScore) {
        results.originalityScore = calculateOriginalityScore(text);
    }
    
    return results;
}

function semanticScan(text) {
    const foundConcepts = [];
    const textLower = text.toLowerCase();
    
    // Lista di sinonimi e variazioni per migliorare il matching
    const conceptVariations = {
        'Essere': ['essere', 'ente', 'esistenza', 'esserci', 'dasein'],
        'Sostanza': ['sostanza', 'ousia', 'substrato', 'essenza'],
        'Verità': ['verità', 'veritas', 'alethes', 'adeguazione'],
        'Conoscenza': ['conoscenza', 'episteme', 'sapere', 'scienza'],
        'Ragione': ['ragione', 'ratio', 'logos', 'razionalità'],
        'Bene': ['bene', 'agathon', 'bonum', 'valore'],
        'Libertà': ['libertà', 'libertas', 'freiheit', 'autonomia'],
        'Potere': ['potere', 'potestas', 'macht', 'potenza', 'dominio', 'forza'],
        'Soggetto': ['soggetto', 'subjectum', 'cogito', 'io', 'coscienza'],
        'Desiderio': ['desiderio', 'eros', 'conatus', 'pulsion', 'bramare','volontà']
    };
    
    for (const concept of concettiData) {
        let totalCount = 0;
        
        // Cerca il termine esatto
        const exactRegex = new RegExp(`\\b${concept.parola.toLowerCase()}\\b`, 'gi');
        const exactMatches = textLower.match(exactRegex);
        if (exactMatches) totalCount += exactMatches.length;
        
        // Cerca variazioni/sinonimi
        const variations = conceptVariations[concept.parola] || [];
        for (const variant of variations) {
            const variantRegex = new RegExp(`\\b${variant}\\b`, 'gi');
            const variantMatches = textLower.match(variantRegex);
            if (variantMatches) totalCount += variantMatches.length;
        }
        
        // Cerca il concetto come parte di frase (es. "potere" può essere anche verbo)
        // Per parole comuni come "potere", controlliamo il contesto
        if (concept.parola === 'Potere') {
            const contextRegex = /\b(potere|potenza|dominio|forza)\b/gi;
            const contextMatches = textLower.match(contextRegex);
            if (contextMatches && contextMatches.length > totalCount) {
                totalCount = contextMatches.length;
            }
        }
        
        if (totalCount > 0) {
            foundConcepts.push({
                concept: concept.parola,
                count: totalCount,
                definition: concept.definizione?.substring(0, 150) + '...',
                period: concept.periodo,
                domain: concept.dominio || 'Filosofia'
            });
        }
    }
    
    return foundConcepts.sort((a, b) => b.count - a.count);
}

function comparePeriods(text) {
    const textLower = text.toLowerCase();
    
    // Mappa periodo per ogni insieme di parole chiave
    const classicalKeywords = [
        'platone', 'aristotele', 'socrate', 'agostino', 'tommaso', 'cartesio', 'kant', 'hegel',
        'idea', 'sostanza', 'ousia', 'essenza', 'anima', 'logos', 'eidos', 'telos',
        'bene', 'virtù', 'giustizia', 'felicità', 'eudaimonia', 'dio', 'creazione'
    ];
    
    const contemporaryKeywords = [
        'nietzsche', 'heidegger', 'foucault', 'derrida', 'deleuze', 'sartre', 'wittgenstein',
        'potere', 'soggetto', 'decostruzione', 'essere', 'evento', 'différance', 'traccia',
        'volontà', 'nichilismo', 'oltreuomo', 'genealogia', 'biopotere', 'dispositivo'
    ];
    
    let classicalScore = 0;
    let contemporaryScore = 0;
    
    for (const keyword of classicalKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = textLower.match(regex);
        if (matches) classicalScore += matches.length;
    }
    
    for (const keyword of contemporaryKeywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = textLower.match(regex);
        if (matches) contemporaryScore += matches.length;
    }
    
    const total = classicalScore + contemporaryScore;
    
    return {
        classicalScore: classicalScore,
        contemporaryScore: contemporaryScore,
        classicalPercent: total > 0 ? (classicalScore / total * 100).toFixed(1) : 0,
        contemporaryPercent: total > 0 ? (contemporaryScore / total * 100).toFixed(1) : 0,
        dominantParadigm: classicalScore > contemporaryScore ? 'classico' : (contemporaryScore > classicalScore ? 'contemporaneo' : 'equilibrato'),
        totalMatches: total
    };
}

function calculateOriginalityScore(text) {
    // Baseline semplificata: frequenza media dei concetti nel dataset
    const textLower = text.toLowerCase();
    let foundConceptCount = 0;
    let totalPossible = 0;
    
    for (const concept of concettiData) {
        totalPossible++;
        const regex = new RegExp(`\\b${concept.parola.toLowerCase()}\\b`, 'gi');
        const matches = textLower.match(regex);
        if (matches && matches.length > 0) foundConceptCount++;
    }
    
    const coverage = foundConceptCount / totalPossible;
    // Più è bassa la copertura, più il testo è "originale" (non usa concetti standard)
    const originality = Math.min(100, Math.max(0, (1 - coverage) * 100));
    
    return {
        score: originality.toFixed(1),
        interpretation: originality > 70 ? 'Testo molto originale, lontano dal lessico filosofico standard' :
                        originality > 40 ? 'Testo moderatamente originale' :
                        'Testo convenzionale, aderente al lessico filosofico standard',
        conceptsFound: foundConceptCount,
        totalConcepts: totalPossible
    };
}

function displayUploadResults(results) {
    const resultsDiv = document.getElementById('upload-results');
    if (!resultsDiv) return;
    
    let html = `
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin-bottom: 15px;">
            <h4 style="margin-bottom: 8px; color: #166534;">📊 Report Analisi</h4>
            <p style="font-size: 0.85rem; color: #4b5563;"><strong>File:</strong> ${escapeHtml(results.fileName)}</p>
            <p style="font-size: 0.85rem; color: #4b5563;"><strong>Parole:</strong> ${results.wordCount}</p>
            <p style="font-size: 0.85rem; color: #4b5563;"><strong>Data:</strong> ${new Date(results.timestamp).toLocaleString()}</p>
        </div>
    `;
    
    if (results.semanticScan && results.semanticScan.length > 0) {
        html += `
            <div style="margin-bottom: 15px;">
                <h4 style="margin-bottom: 10px; color: #3b82f6;">🔬 Concetti Aeterna trovati</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${results.semanticScan.map(c => `
                        <span style="background: #dbeafe; padding: 4px 12px; border-radius: 20px; font-size: 0.8rem; cursor: pointer;" onclick="searchAndOpenConcept('${c.concept}')">
                            ${escapeHtml(c.concept)} (${c.count})
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    if (results.periodComparison) {
        const pc = results.periodComparison;
        html += `
            <div style="margin-bottom: 15px;">
                <h4 style="margin-bottom: 10px; color: #3b82f6;">📖 Confronto Classico/Contemporaneo</h4>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                    <div style="margin-bottom: 8px;">
                        <span style="display: inline-block; width: 100px; font-size: 0.85rem;">Classico:</span>
                        <div style="display: inline-block; width: 60%; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                            <div style="width: ${pc.classicalPercent}%; height: 20px; background: #10b981;"></div>
                        </div>
                        <span style="margin-left: 8px; font-size: 0.85rem;">${pc.classicalPercent}%</span>
                    </div>
                    <div>
                        <span style="display: inline-block; width: 100px; font-size: 0.85rem;">Contemporaneo:</span>
                        <div style="display: inline-block; width: 60%; background: #e2e8f0; border-radius: 4px; overflow: hidden;">
                            <div style="width: ${pc.contemporaryPercent}%; height: 20px; background: #f59e0b;"></div>
                        </div>
                        <span style="margin-left: 8px; font-size: 0.85rem;">${pc.contemporaryPercent}%</span>
                    </div>
                    <p style="margin-top: 10px; font-size: 0.85rem;"><strong>Paradigma dominante:</strong> ${pc.dominantParadigm === 'classico' ? 'Classico/Antico' : (pc.dominantParadigm === 'contemporaneo' ? 'Contemporaneo' : 'Equilibrato')}</p>
                </div>
            </div>
        `;
    }
    
    if (results.originalityScore) {
        const os = results.originalityScore;
        html += `
            <div style="margin-bottom: 15px;">
                <h4 style="margin-bottom: 10px; color: #3b82f6;">💡 Originalità Filosofica</h4>
                <div style="background: #f8fafc; padding: 12px; border-radius: 8px;">
                    <p style="font-size: 1.2rem; font-weight: bold;">${os.score}/100</p>
                    <p style="font-size: 0.85rem;">${os.interpretation}</p>
                    <p style="font-size: 0.75rem; color: #6b7280;">${os.conceptsFound}/${os.totalConcepts} concetti Aeterna rilevati</p>
                </div>
            </div>
        `;
    }
    
    html += `
        <div style="display: flex; gap: 10px; margin-top: 15px;">
            <button class="btn-secondary" onclick="downloadAnalysisReport()" style="flex: 1;">
                <i class="fas fa-download"></i> Scarica Report (JSON)
            </button>
            <button class="btn-secondary" onclick="clearUploadAndAnalyzeAgain()" style="flex: 1;">
                <i class="fas fa-upload"></i> Nuovo file
            </button>
        </div>
    `;
    
    resultsDiv.innerHTML = html;
    resultsDiv.style.display = 'block';
    
    // Salva i risultati per eventuale export
    window.lastAnalysisResults = results;
}

function searchAndOpenConcept(conceptName) {
    const concept = concettiData.find(c => c.parola === conceptName);
    if (concept) {
        closeUploadModal();
        showConcettoDetail(concept.id);
    }
}

function downloadAnalysisReport() {
    if (!window.lastAnalysisResults) {
        showToast('Nessun report disponibile', 'error');
        return;
    }
    
    const jsonStr = JSON.stringify(window.lastAnalysisResults, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aeterna_analysis_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Report scaricato!', 'success');
}

function clearUploadAndAnalyzeAgain() {
    clearUpload();
    const dropZone = document.getElementById('upload-zone');
    if (dropZone) dropZone.style.display = 'block';
    const fileInput = document.getElementById('upload-file-input');
    if (fileInput) fileInput.value = '';
    uploadedText = null;
    uploadedFileName = null;
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
// ==================== PUNTO 9: SUPERIMPOSED VISUALIZATION ====================
// Riferimento: Drucker, J. (2011). "Humanities Approaches to Graphical Display"
// Metodologia: Visualizzazione della polisemia semantica attraverso layer sovrapposti

let superimposedActive = false;
let currentSemanticLayers = [];

/**
 * Attiva la visualizzazione sovrapposta per un concetto
 */
function enableSuperimposedVisualization(conceptId) {
    const concept = concettiData.find(c => c.id === conceptId);
    if (!concept) {
        showToast('Concetto non trovato', 'error');
        return;
    }
    
    if (superimposedActive) disableSuperimposedVisualization();
    
    const layers = extractSemanticLayers(concept);
    currentSemanticLayers = layers;
    
    if (layers.length === 0) {
        showToast('Nessun layer semantico disponibile per questo concetto', 'info');
        return;
    }
    
    superimposedActive = true;
    
    const detailContainer = document.getElementById('concetto-detail-content');
    if (!detailContainer) return;
    
    let layersContainer = document.getElementById('semantic-layers-container');
    if (!layersContainer) {
        layersContainer = document.createElement('div');
        layersContainer.id = 'semantic-layers-container';
        layersContainer.style.cssText = `
            position: relative;
            min-height: 300px;
            margin-top: 20px;
            padding: 20px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.05));
            border-radius: 16px;
            border: 1px dashed #8b5cf6;
        `;
        detailContainer.appendChild(layersContainer);
    }
    
    layersContainer.innerHTML = `<h4 style="margin-bottom: 15px; color: #8b5cf6;">
        <i class="fas fa-layer-group"></i> Strati Semantici (polisemia documentata)
        <small style="font-size: 0.7rem; margin-left: 10px;">Basato su: Drucker (2011)</small>
    </h4>`;
    
    const bubblesContainer = document.createElement('div');
    bubblesContainer.id = 'semantic-bubbles';
    bubblesContainer.style.cssText = `
        position: relative;
        min-height: 220px;
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 15px;
    `;
    layersContainer.appendChild(bubblesContainer);
    
    layers.forEach((layer, index) => {
        const bubble = createSemanticBubble(layer, index, concept);
        bubblesContainer.appendChild(bubble);
    });
    
    const disableBtn = document.getElementById('btn-disable-superimposed');
    if (disableBtn) disableBtn.style.display = 'inline-flex';
    
    showToast(`✨ Visualizzazione sovrapposta attivata per "${concept.parola}"`, 'success');
    console.log(`📚 [SuperimposedVis] Attivata per ${concept.parola} - ${layers.length} layer`);
}

/**
 * Disattiva la visualizzazione sovrapposta
 */
function disableSuperimposedVisualization() {
    const container = document.getElementById('semantic-layers-container');
    if (container) container.remove();
    
    superimposedActive = false;
    currentSemanticLayers = [];
    
    if (networkInstance) {
        resetContextualFilter();
    }
    
    const disableBtn = document.getElementById('btn-disable-superimposed');
    if (disableBtn) disableBtn.style.display = 'none';
    
    console.log('📚 [SuperimposedVis] Disattivata');
}

/**
 * Estrae i layer semantici dai dati del concetto e traduce gli ID in nomi reali
 */
function extractSemanticLayers(concept) {
    const layers = [];
    
    if (concept.definizione) {
        layers.push({
            id: 'classical',
            title: `Accezione Classica (${concept.periodo === 'classico' ? 'Canone' : 'Origine'})`,
            summary: concept.definizione.length > 150 ? concept.definizione.substring(0, 150) + '...' : concept.definizione,
            source: 'Definizione canonica',
            fullText: concept.definizione,
            type: 'definition'
        });
    }
    
    if (concept.evoluzione) {
        layers.push({
            id: 'evolution',
            title: 'Trasformazione storica',
            summary: concept.evoluzione.length > 150 ? concept.evoluzione.substring(0, 150) + '...' : concept.evoluzione,
            source: 'Analisi diacronica',
            fullText: concept.evoluzione,
            type: 'evolution'
        });
    }
    
    if (concept.esempio) {
        layers.push({
            id: 'example',
            title: 'Esempio contestuale',
            summary: concept.esempio.length > 150 ? concept.esempio.substring(0, 150) + '...' : concept.esempio,
            source: 'Testo d\'autore',
            fullText: concept.esempio,
            type: 'example'
        });
    }
    
    if (concept.autore_riferimento) {
        const authorIds = concept.autore_riferimento.split(',');
        // Converte gli ID (F2, F11) nei nomi propri dei filosofi per l'interfaccia
        const authorNames = authorIds.map(id => {
            const philosopher = filosofiData.find(f => f.id === id.trim() || f.nome === id.trim());
            return philosopher ? philosopher.nome : id.trim();
        });
        
        if (authorNames.length > 0) {
            layers.push({
                id: 'authors',
                title: `Autori di riferimento (${authorNames.length})`,
                summary: authorNames.join(', '),
                source: 'Dataset Aeterna',
                fullText: authorNames.join(', '),
                type: 'authors',
                authors: authorIds // Mantiene gli ID originari intatti per far funzionare i filtri della mappa
            });
        }
    }
    
    return layers;
}

/**
 * Crea un bubble semantico fluttuante
 */
function createSemanticBubble(layer, index, concept) {
    const bubble = document.createElement('div');
    bubble.className = 'semantic-bubble';
    bubble.setAttribute('data-layer-id', layer.id);
    bubble.setAttribute('data-layer-type', layer.type);
    
    const colors = {
        definition: { border: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
        evolution: { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
        example: { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)' },
        authors: { border: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' }
    };
    
    const color = colors[layer.type] || colors.definition;
    
    bubble.style.cssText = `
        width: 220px;
        padding: 15px;
        background: ${color.bg};
        border-left: 4px solid ${color.border};
        border-radius: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        animation: floatBubble ${2 + index * 0.5}s ease-in-out infinite;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    `;
    
    bubble.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: ${color.border};">${layer.title}</strong>
            <small style="color: #6b7280; font-size: 0.65rem;">${layer.source}</small>
        </div>
        <p style="font-size: 0.8rem; color: #374151; line-height: 1.4; margin: 0;">${escapeHtml(layer.summary)}</p>
        <div style="margin-top: 10px; font-size: 0.7rem; color: ${color.border}; text-align: right;">
            <i class="fas fa-arrow-right"></i> Seleziona
        </div>
    `;
    
    bubble.onclick = (e) => {
        e.stopPropagation();
        selectSemanticLayer(layer, concept, e); 
    };
    
    return bubble;
}

/**
 * Seleziona un layer semantico (Contextual Filtering)
 */
function selectSemanticLayer(layer, concept, event) {
    console.log(`🔍 [ContextualFilter] Selezione: "${layer.title}" per ${concept.parola}`);
    
    // Salvataggio globale completo
    window.activeFilter = {
        conceptId: concept.id,
        conceptName: concept.parola,
        layerId: layer.id,
        layerTitle: layer.title,
        concept: concept, // FONDAMENTALE: Oggetto intero
        layer: layer,     // FONDAMENTALE: Oggetto intero
        timestamp: Date.now()
    };
    
    showLayerDetail(layer, concept);
    
    // Gestione grafica dei bottoni
    document.querySelectorAll('.semantic-bubble').forEach(bubble => {
        bubble.style.opacity = '0.5';
        bubble.style.transform = 'scale(0.95)';
    });
    
    if (event && event.target) {
        const targetBubble = event.target.closest('.semantic-bubble');
        if (targetBubble) {
            targetBubble.style.opacity = '1';
            targetBubble.style.transform = 'scale(1.05)';
        }
    }
    
    // LA SOLUZIONE AL BUG: Esegue l'aggiornamento diretto SOLO se stiamo già guardando la mappa.
    // Altrimenti si limita a mostrare il badge e aspetta il "teletrasporto".
    if (networkInstance && currentScreen === 'mappa-concettuale-screen') {
        highlightRelatedNodes(concept, layer);
    } else {
        showFilterIndicator(concept.parola, layer.title);
    }
    
    logAnalyticalChoice(concept.id, layer.id, layer.title);
    showToast(`📌 Filtro contestuale: "${layer.title}" selezionato`, 'success');
}

/**
 * Mostra il dettaglio del layer selezionato con pulsante di navigazione alla mappa
 */
function showLayerDetail(layer, concept) {
    let modal = document.getElementById('layer-detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'layer-detail-modal';
        modal.className = 'modal-overlay';
        document.body.appendChild(modal);
    }
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 500px;">
            <h3 class="modal-title" id="layer-modal-title"><i class="fas fa-layer-group"></i> ${concept.parola} - ${layer.title}</h3>
            <div id="layer-modal-content" style="margin: 20px 0; line-height: 1.6;">
                <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
                    <p style="margin-bottom: 10px;"><strong>Fonte:</strong> ${layer.source}</p>
                    <p style="margin-bottom: 10px;"><strong>Contenuto:</strong></p>
                    <p style="font-style: italic; color: #4b5563;">${escapeHtml(layer.fullText || layer.summary)}</p>
                </div>
            </div>
            <div class="modal-buttons" style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="modal-btn secondary" onclick="closeLayerDetailModal()">Chiudi</button>
                <button class="modal-btn primary" onclick="viewFilterOnMap()" style="background: #8b5cf6; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 8px;">
                    <i class="fas fa-project-diagram"></i> Vedi sulla Mappa
                </button>
            </div>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeLayerDetailModal() {
    const modal = document.getElementById('layer-detail-modal');
    if (modal) modal.style.display = 'none';
}

/**
 * Chiude il dettaglio layer e trasporta l'utente sulla mappa concettuale per vedere il filtro applicato
 */
function viewFilterOnMap() {
    closeLayerDetailModal();
    
    // Naviga automaticamente verso la mappa
    showScreen('mappa-concettuale-screen');
    
    // Attendi l'inizializzazione del motore grafico e poi innesca il filtro visivo
    setTimeout(() => {
        if (!networkInstance) {
            initConceptMap();
        }
        
        // Attendi che la gravità della mappa si stabilizzi prima di isolare i nodi
        setTimeout(() => {
            if (window.activeFilter && networkInstance) {
                highlightRelatedNodes(window.activeFilter.concept, window.activeFilter.layer);
            }
        }, 800);
        
    }, 300);
}

/**
 * Evidenzia i nodi correlati al layer selezionato e applica un filtro topologico reale
 */
function highlightRelatedNodes(concept, layer) {
    if (!networkInstance) return;
    
    const nodes = networkInstance.body.data.nodes;
    const edges = networkInstance.body.data.edges;
    const allNodes = nodes.get();
    const allEdges = edges.get();
    
    // LA SOLUZIONE AL BUG 2: Conserviamo i dati intatti durante il refresh visivo
    window.activeFilter = {
        conceptId: concept.id,
        conceptName: concept.parola,
        layerId: layer.id,
        layerTitle: layer.title,
        concept: concept,
        layer: layer,
        timestamp: Date.now()
    };
    
    showFilterIndicator(concept.parola, layer.title);
    
    const conceptNodeId = 'C_' + concept.id;
    const relatedNodeIds = new Set();
    relatedNodeIds.add(conceptNodeId);
    
    const keyword = String(concept.parola).toLowerCase().trim();
    
    // Motore di ricerca elastico
    const matchesConcept = (filosofo) => {
        if (!filosofo.concetti_principali) return false;
        if (Array.isArray(filosofo.concetti_principali)) {
            return filosofo.concetti_principali.some(c => {
                const cNorm = String(c).toLowerCase().trim();
                return cNorm === keyword || cNorm.includes(keyword) || keyword.includes(cNorm);
            });
        } else if (typeof filosofo.concetti_principali === 'string') {
            return String(filosofo.concetti_principali).toLowerCase().includes(keyword);
        }
        return false;
    };

    // Identificazione Nodi
    if (layer.type === 'authors' || layer.type === 'example') {
        if (concept.autore_riferimento) {
            concept.autore_riferimento.split(',').forEach(authorRef => {
                const refStr = authorRef.trim().toLowerCase();
                const authorNode = filosofiData.find(f => 
                    String(f.id).toLowerCase() === refStr || 
                    String(f.nome).toLowerCase() === refStr
                );
                if (authorNode) relatedNodeIds.add(authorNode.id);
            });
        }
    } else if (layer.type === 'definition') {
        filosofiData.forEach(f => {
            if (f.periodo === 'classico' && matchesConcept(f)) relatedNodeIds.add(f.id);
        });
    } else if (layer.type === 'evolution') {
        filosofiData.forEach(f => {
            if (f.periodo === 'contemporaneo' && matchesConcept(f)) relatedNodeIds.add(f.id);
        });
    }
    
    // Fallback di emergenza
    if (relatedNodeIds.size === 1 && concept.autore_riferimento) {
        concept.autore_riferimento.split(',').forEach(authorRef => {
            const refStr = authorRef.trim().toLowerCase();
            const authorNode = filosofiData.find(f => 
                String(f.id).toLowerCase() === refStr || 
                String(f.nome).toLowerCase() === refStr
            );
            if (authorNode) relatedNodeIds.add(authorNode.id);
        });
    }
    
    // Aggiornamento Visivo NODI (Opacità Forzata)
    const nodesToUpdate = [];
    allNodes.forEach(node => {
        const isTarget = relatedNodeIds.has(node.id);
        const isCurrentConcept = (node.id === conceptNodeId);
        
        if (isTarget) {
            let bgColor, borderColor;
            if (String(node.id).startsWith('C_')) {
                const isBoth = concept.periodo === 'entrambi';
                bgColor = isBoth ? '#8b5cf6' : (concept.periodo === 'classico' ? '#10b981' : '#f59e0b');
                borderColor = isBoth ? '#7c3aed' : (concept.periodo === 'classico' ? '#047857' : '#d97706');
            } else {
                const f = filosofiData.find(fil => String(fil.id) === String(node.id));
                const isClassico = f && f.periodo === 'classico';
                bgColor = isClassico ? '#10b981' : '#f59e0b';
                borderColor = isClassico ? '#047857' : '#d97706';
            }
            
            nodesToUpdate.push({
                id: node.id,
                color: { background: bgColor, border: isCurrentConcept ? '#ef4444' : borderColor },
                font: { color: '#ffffff', size: isCurrentConcept ? 14 : 12 }
            });
        } else {
            nodesToUpdate.push({
                id: node.id,
                color: { background: 'rgba(200,200,200,0.2)', border: 'rgba(150,150,150,0.2)' },
                font: { color: 'rgba(150,150,150,0.5)', size: 10 }
            });
        }
    });
    nodes.update(nodesToUpdate);
    
    // Aggiornamento Visivo ARCHI
    const edgesToUpdate = [];
    allEdges.forEach(edge => {
        const hasFrom = relatedNodeIds.has(edge.from);
        const hasTo = relatedNodeIds.has(edge.to);
        
        if (hasFrom && hasTo) {
            edgesToUpdate.push({ id: edge.id, hidden: false, color: { color: '#ef4444', opacity: 1 }, width: 3 });
        } else if (hasFrom || hasTo) {
            edgesToUpdate.push({ id: edge.id, hidden: false, color: { color: '#cccccc', opacity: 0.3 }, width: 1 });
        } else {
            edgesToUpdate.push({ id: edge.id, hidden: true });
        }
    });
    edges.update(edgesToUpdate);
    
    networkInstance.focus(conceptNodeId, {
        scale: 1.4,
        animation: { duration: 600, easingFunction: 'easeInOutQuad' }
    });
}

/**
 * Mostra l'indicatore visivo del filtro nell'angolo dello schermo
 */
function showFilterIndicator(conceptName, layerTitle) {
    const existingIndicator = document.getElementById('filter-indicator');
    if (existingIndicator) existingIndicator.remove();
    
    const indicator = document.createElement('div');
    indicator.id = 'filter-indicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: rgba(31, 41, 55, 0.95);
        color: white;
        padding: 12px 20px;
        border-radius: 30px;
        font-size: 0.85rem;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        gap: 12px;
        backdrop-filter: blur(10px);
        border-left: 4px solid #ef4444;
        animation: slideInRight 0.3s ease-out;
    `;
    
    indicator.innerHTML = `
        <span>
            <i class="fas fa-filter" style="color: #ef4444;"></i>
            <strong>DH Filtro:</strong> ${conceptName} &rarr; <span style="color: #a78bfa;">${layerTitle}</span>
        </span>
        <button onclick="resetContextualFilter()" style="
            background: #ef4444;
            border: none;
            color: white;
            border-radius: 20px;
            padding: 4px 12px;
            cursor: pointer;
            font-size: 0.75rem;
            font-weight: bold;
            transition: background 0.2s;
            margin-left: 10px;
        ">Reset</button>
    `;
    
    document.body.appendChild(indicator);
    
    if (!document.querySelector('#filter-indicator-style')) {
        const style = document.createElement('style');
        style.id = 'filter-indicator-style';
        style.textContent = `@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`;
        document.head.appendChild(style);
    }
}

/**
 * Resetta il filtro contestuale e ripristina la visualizzazione normale della mappa
 */
function resetContextualFilter() {
    if (!networkInstance) return;
    
    const nodes = networkInstance.body.data.nodes;
    const edges = networkInstance.body.data.edges;
    
    // Ripristino Colori Nodi (Conversione ID in Stringa)
    const nodesToUpdate = [];
    nodes.get().forEach(node => {
        let bgColor, borderColor;
        
        if (String(node.id).startsWith('C_')) {
            const conceptIdStr = String(node.id).substring(2);
            const c = concettiData.find(x => String(x.id) === conceptIdStr);
            if (c) {
                const isBoth = c.periodo === 'entrambi';
                bgColor = isBoth ? '#8b5cf6' : (c.periodo === 'classico' ? '#10b981' : '#f59e0b');
                borderColor = isBoth ? '#7c3aed' : (c.periodo === 'classico' ? '#047857' : '#d97706');
            }
        } else {
            const f = filosofiData.find(x => String(x.id) === String(node.id));
            if (f) {
                const isClassico = f.periodo === 'classico';
                bgColor = isClassico ? '#10b981' : '#f59e0b';
                borderColor = isClassico ? '#047857' : '#d97706';
            }
        }

        nodesToUpdate.push({
            id: node.id,
            color: { background: bgColor || '#8b5cf6', border: borderColor || '#7c3aed' },
            font: { color: '#ffffff', size: String(node.id).startsWith('C_') ? 11 : 12 }
        });
    });
    nodes.update(nodesToUpdate);
    
    // Ripristino Archi
    const edgesToUpdate = [];
    edges.get().forEach(edge => {
        let edgeColor = '#8b5cf6'; // Default viola
        if (!String(edge.from).startsWith('C_')) {
             const f = filosofiData.find(x => String(x.id) === String(edge.from));
             edgeColor = (f && f.periodo === 'contemporaneo') ? '#f59e0b' : '#10b981';
        }

        edgesToUpdate.push({
            id: edge.id,
            hidden: false,
            color: { color: edgeColor, opacity: 0.85 },
            width: 1.5
        });
    });
    edges.update(edgesToUpdate);
    
    const indicator = document.getElementById('filter-indicator');
    if (indicator) indicator.remove();
    
    window.activeFilter = null;
    
    networkInstance.fit({
        animation: { duration: 600, easingFunction: 'easeInOutQuad' }
    });
    
    document.querySelectorAll('.semantic-bubble').forEach(bubble => {
        bubble.style.opacity = '1';
        bubble.style.transform = 'scale(1)';
    });
    
    showToast('✅ Filtro resettato', 'success');
}

/**
 * Traccia la scelta analitica dell'utente per riproducibilità scientifica
 */
function logAnalyticalChoice(conceptId, layerId, layerTitle) {
    const choice = {
        timestamp: new Date().toISOString(),
        conceptId: conceptId,
        layerId: layerId,
        layerTitle: layerTitle,
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    let history = JSON.parse(localStorage.getItem('aeterna_analytical_history') || '[]');
    history.push(choice);
    if (history.length > 50) history.shift();
    localStorage.setItem('aeterna_analytical_history', JSON.stringify(history));
    
    console.log('📝 [AnalyticalChoice] Tracciata:', choice);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
// ==================== PUNTO 11: TEMPORAL NAVIGATION SLIDER ====================
// Riferimento: Jockers, M. (2013). "Macroanalysis: Digital Methods and Literary History"

function handleTemporalSlider(value) {
    if (!networkInstance) return;
    
    const val = parseInt(value);
    const labelEl = document.getElementById('temporal-current-label');
    
    const epochs = {
        0: { name: "Tutto il Lessico", filter: "all", color: "#6b7280" },
        1: { name: "Canone Classico", filter: "classico", color: "#10b981" },
        2: { name: "Transizione", filter: "entrambi", color: "#8b5cf6" },
        3: { name: "Contemporaneo", filter: "contemporaneo", color: "#f59e0b" }
    };
    
    const currentEpoch = epochs[val] || epochs[0];
    if (labelEl) {
        labelEl.textContent = currentEpoch.name;
        labelEl.style.background = currentEpoch.color;
    }
    
    applyTemporalFilter(currentEpoch.filter, val);
    console.log(`📅 [TemporalSlider] Epoca selezionata: ${currentEpoch.name}`);
}

/**
 * Applica il filtro temporale diacronico sui nodi e sugli archi (Versione Filologica Corretta)
 */
function applyTemporalFilter(epochFilter, sliderValue) {
    if (!networkInstance) return;

    const nodes = networkInstance.body.data.nodes;
    const edges = networkInstance.body.data.edges;
    const allNodes = nodes.get();
    const allEdges = edges.get();
    
    const visibleNodeIds = new Set();
    const nodesToUpdate = [];

    // 1. NUOVA LOGICA DI FILTRAGGIO (Rispetta i concetti transperiodali)
    allNodes.forEach(node => {
        let isVisible = false;
        let isConcetto = String(node.id).startsWith('C_');
        let itemPeriodo = "all";

        // Estrazione accurata del periodo
        if (isConcetto) {
            const cId = String(node.id).substring(2);
            const concetto = concettiData.find(c => String(c.id) === cId);
            if (concetto) itemPeriodo = concetto.periodo;
        } else {
            const filosofo = filosofiData.find(f => String(f.id) === String(node.id));
            if (filosofo) itemPeriodo = filosofo.periodo;
        }

        // REGOLE DI MACROANALISI TEMPORALE:
        if (epochFilter === 'all' || epochFilter === 'entrambi') {
            // "Tutti" e "Transizione" mostrano l'intero ecosistema
            isVisible = true;
        } else if (epochFilter === 'classico') {
            // Nel mondo antico i concetti 'entrambi' (es. Essere) DEVONO rimanere accesi
            isVisible = (itemPeriodo === 'classico' || itemPeriodo === 'entrambi');
        } else if (epochFilter === 'contemporaneo') {
            // Nel mondo moderno i concetti 'entrambi' DEVONO rimanere accesi
            isVisible = (itemPeriodo === 'contemporaneo' || itemPeriodo === 'entrambi');
        }

        if (isVisible) {
            visibleNodeIds.add(node.id);
            // Colori accesi nativi
            let bg, border;
            if (isConcetto) {
                bg = itemPeriodo === 'entrambi' ? '#8b5cf6' : (itemPeriodo === 'classico' ? '#10b981' : '#f59e0b');
                border = itemPeriodo === 'entrambi' ? '#7c3aed' : (itemPeriodo === 'classico' ? '#047857' : '#d97706');
            } else {
                bg = itemPeriodo === 'classico' ? '#10b981' : '#f59e0b';
                border = itemPeriodo === 'classico' ? '#047857' : '#d97706';
            }

            nodesToUpdate.push({
                id: node.id,
                color: { background: bg, border: border, opacity: 1 },
                font: { color: '#ffffff', size: isConcetto ? 11 : 12 }
            });
        } else {
            // Spegnimento severo per i nodi fuori dal tempo
            nodesToUpdate.push({
                id: node.id,
                color: { background: 'rgba(230,230,230,0.1)', border: 'rgba(200,200,200,0.1)' },
                font: { color: 'rgba(150,150,150,0.1)', size: 8 }
            });
        }
    });
    nodes.update(nodesToUpdate);

    // 2. GESTIONE DEGLI ARCHI (Il ponte del tempo)
    const edgesToUpdate = [];
    const isTransition = (epochFilter === 'entrambi');

    allEdges.forEach(edge => {
        const fromVisible = visibleNodeIds.has(edge.from);
        const toVisible = visibleNodeIds.has(edge.to);

        if (fromVisible && toVisible) {
            // Se lo slider è su "Transizione", gli archi diventano rosso vivo per mostrare il passaggio storico
            edgesToUpdate.push({
                id: edge.id,
                hidden: false,
                color: { 
                    color: isTransition ? '#ef4444' : '#8b5cf6', 
                    opacity: isTransition ? 1.0 : 0.85 
                },
                width: isTransition ? 3 : 1.5
            });
        } else if (fromVisible || toVisible) {
            edgesToUpdate.push({
                id: edge.id,
                hidden: false,
                color: { color: '#cccccc', opacity: 0.1 },
                width: 0.5
            });
        } else {
            edgesToUpdate.push({ id: edge.id, hidden: true });
        }
    });
    edges.update(edgesToUpdate);

    // Integrazione priorità layer Punti 9 e 10
    if (typeof superimposedActive !== 'undefined' && superimposedActive && currentSemanticLayers && currentSemanticLayers.length > 0) {
        let epochForLayers = 'contemporary';
        if (epochFilter === 'classico') epochForLayers = 'classical';
        else if (epochFilter === 'entrambi') epochForLayers = 'transition';
        
        updateLayerPriorityByEpoch(epochForLayers);
    }
}

function updateLayerPriorityByEpoch(epoch) {
    const bubbles = document.querySelectorAll('.semantic-bubble');
    if (!bubbles.length) return;
    
    bubbles.forEach(bubble => {
        const layerType = bubble.getAttribute('data-layer-type');
        if (epoch === 'classical' && (layerType === 'definition' || layerType === 'authors')) {
            bubble.style.opacity = '1';
            bubble.style.transform = 'scale(1)';
            bubble.style.borderLeftWidth = '4px';
        } else if (epoch === 'contemporary' && layerType === 'evolution') {
            bubble.style.opacity = '1';
            bubble.style.transform = 'scale(1)';
            bubble.style.borderLeftWidth = '4px';
        } else if (epoch === 'transition') {
            bubble.style.opacity = '1';
            bubble.style.borderLeftWidth = '4px';
        } else {
            bubble.style.opacity = '0.5';
            bubble.style.transform = 'scale(0.95)';
            bubble.style.borderLeftWidth = '2px';
        }
    });
}

function resetTemporalFilter() {
    const slider = document.getElementById('temporal-navigation-range');
    if (slider) {
        slider.value = 0;
        handleTemporalSlider(0);
    }
    showToast('Filtro temporale resettato', 'success');
}
// ==================== PUNTO 13: INTERPRETIVE TRACEABILITY (VERSIONE CORRETTA) ====================
// Riferimento: Piper, A. (2018). "Enumerations: Data and Literary Study"
// Metodologia: Trasparenza delle connessioni - mostra il termine comune che genera il link

/**
 * Attiva la modalità Traceability sulla mappa
 * Usa l'evento 'selectEdge' specifico di Vis.js per non interferire con i click sui nodi
 */
function enableInterpretiveTraceability() {
    if (!networkInstance) {
        showToast('Attiva prima la mappa concettuale', 'warning');
        return;
    }
    
    if (window.interpretiveListenerActive) {
        disableInterpretiveTraceability();
        return;
    }
    
    // Attiviamo una flag globale
    window.interpretiveListenerActive = true;
    
    // Aggiungiamo il listener per gli archi
    networkInstance.on("selectEdge", handleEdgeClickForTraceability);
    
    // Cambia stile del bottone per mostrare che è attivo
    const btn = document.getElementById('traceability-btn');
    if (btn) {
        btn.classList.add('active');
        btn.innerHTML = '<i class="fas fa-brain"></i> Traceability ON';
    }
    
    showToast('🔍 Traceability attiva - clicca su un collegamento per la spiegazione', 'success');
    console.log('📖 [InterpretiveTraceability] Attivata');
}

/**
 * Disattiva la traceability
 */
function disableInterpretiveTraceability() {
    if (networkInstance && window.interpretiveListenerActive) {
        // Rimuoviamo SOLO il nostro listener specifico per gli archi
        networkInstance.off("selectEdge", handleEdgeClickForTraceability);
        window.interpretiveListenerActive = false;
        
        // Ripristina stile del bottone
        const btn = document.getElementById('traceability-btn');
        if (btn) {
            btn.classList.remove('active');
            btn.innerHTML = '<i class="fas fa-brain"></i> Traceability';
        }
        
        showToast('Traceability disattivata', 'info');
        console.log('📖 [InterpretiveTraceability] Disattivata');
    }
}

/**
 * Callback dedicata per il click sulle connessioni (edge)
 * Verifica che sia un edge e non un nodo
 */
function handleEdgeClickForTraceability(params) {
    // Se la Traceability non è attiva, non fare nulla
    if (!window.interpretiveListenerActive) return;
    
    // Se ho cliccato su un arco e NON su un nodo
    if (params.edges && params.edges.length > 0 && (!params.nodes || params.nodes.length === 0)) {
        const edgeId = params.edges[0];
        const edge = networkInstance.body.data.edges.get(edgeId);
        
        if (edge) {
            showConnectionExplanation(edge.from, edge.to);
        }
    }
}

/**
 * Mostra la spiegazione di una connessione tra due entità
 * @param {string} sourceId - ID dell'entità sorgente (filosofo o concetto)
 * @param {string} targetId - ID dell'entità target (filosofo o concetto)
 */
function showConnectionExplanation(sourceId, targetId) {
    const sourceIsConcept = sourceId.startsWith('C_');
    const targetIsConcept = targetId.startsWith('C_');
    
    let explanation = null;
    
    // Caso 1: Filosofo → Concetto
    if (!sourceIsConcept && targetIsConcept) {
        const philosopher = filosofiData.find(f => f.id === sourceId);
        const conceptId = targetId.substring(2);
        const concept = concettiData.find(c => c.id === conceptId);
        
        if (philosopher && concept) {
            explanation = {
                type: 'philosopher_to_concept',
                title: `${philosopher.nome} → ${concept.parola}`,
                reason: `${philosopher.nome} ha sviluppato il concetto di "${concept.parola}" come parte della sua filosofia.`,
                evidence: philosopher.concetti_principali?.includes(concept.parola) 
                    ? `Il concetto "${concept.parola}" è elencato tra i concetti principali di ${philosopher.nome}.`
                    : `Il concetto "${concept.parola}" è associato a ${philosopher.nome} nel dataset filosofico.`,
                source: 'Dataset Aeterna - concetti_principali'
            };
        }
    }
    
    // Caso 2: Concetto → Filosofo
    else if (sourceIsConcept && !targetIsConcept) {
        const conceptId = sourceId.substring(2);
        const concept = concettiData.find(c => c.id === conceptId);
        const philosopher = filosofiData.find(f => f.id === targetId);
        
        if (concept && philosopher) {
            explanation = {
                type: 'concept_to_philosopher',
                title: `${concept.parola} → ${philosopher.nome}`,
                reason: `Il concetto "${concept.parola}" è centrale nella filosofia di ${philosopher.nome}.`,
                evidence: concept.autore_riferimento?.includes(philosopher.id)
                    ? `${philosopher.nome} è indicato come autore di riferimento per il concetto "${concept.parola}".`
                    : `${philosopher.nome} tratta il concetto "${concept.parola}" nelle sue opere.`,
                source: 'Dataset Aeterna - autore_riferimento'
            };
        }
    }
    
    // Caso 3: Filosofo → Filosofo
    else if (!sourceIsConcept && !targetIsConcept) {
        const philosopher1 = filosofiData.find(f => f.id === sourceId);
        const philosopher2 = filosofiData.find(f => f.id === targetId);
        
        if (philosopher1 && philosopher2) {
            const commonConcepts = philosopher1.concetti_principali?.filter(c => 
                philosopher2.concetti_principali?.includes(c)
            ) || [];
            
            if (commonConcepts.length > 0) {
                explanation = {
                    type: 'philosopher_to_philosopher',
                    title: `${philosopher1.nome} ⇄ ${philosopher2.nome}`,
                    reason: `Condivisione di concetti fondamentali.`,
                    evidence: `Concetti comuni: ${commonConcepts.join(', ')}`,
                    source: `Analisi di co-occorrenza (Moretti, 2005)`
                };
            } else {
                explanation = {
                    type: 'philosopher_to_philosopher',
                    title: `${philosopher1.nome} ⇄ ${philosopher2.nome}`,
                    reason: `Influenza filosofica indiretta o appartenenza a tradizioni simili.`,
                    evidence: `${philosopher1.nome} (${philosopher1.periodo}) e ${philosopher2.nome} (${philosopher2.periodo}) condividono tematiche affini.`,
                    source: `Analisi contestuale`
                };
            }
        }
    }
    
    // Caso 4: Concetto → Concetto
    else if (sourceIsConcept && targetIsConcept) {
        const conceptId1 = sourceId.substring(2);
        const conceptId2 = targetId.substring(2);
        const concept1 = concettiData.find(c => c.id === conceptId1);
        const concept2 = concettiData.find(c => c.id === conceptId2);
        
        if (concept1 && concept2) {
            const authors1 = concept1.autore_riferimento?.split(',').map(a => a.trim()) || [];
            const authors2 = concept2.autore_riferimento?.split(',').map(a => a.trim()) || [];
            const commonAuthors = authors1.filter(a => authors2.includes(a));
            
            if (commonAuthors.length > 0) {
                const authorNames = commonAuthors.map(a => {
                    const f = filosofiData.find(f => f.id === a);
                    return f ? f.nome : a;
                }).join(', ');
                
                explanation = {
                    type: 'concept_to_concept',
                    title: `${concept1.parola} ⇄ ${concept2.parola}`,
                    reason: `Condivisione di autori di riferimento.`,
                    evidence: `Entrambi i concetti sono associati a: ${authorNames}`,
                    source: `Dataset Aeterna - autore_riferimento`
                };
            } else {
                explanation = {
                    type: 'concept_to_concept',
                    title: `${concept1.parola} ⇄ ${concept2.parola}`,
                    reason: `Affinità tematica nel dominio ${concept1.dominio || 'filosofico'}.`,
                    evidence: `${concept1.parola} e ${concept2.parola} appartengono a sfere concettuali vicine.`,
                    source: `Analisi semantica`
                };
            }
        }
    }
    
    if (explanation) {
        showExplanationModal(explanation);
    } else {
        showToast('Spiegazione non disponibile per questa connessione', 'info');
    }
}

/**
 * Mostra il modale con la spiegazione della connessione
 */
function showExplanationModal(explanation) {
    let modal = document.getElementById('explanation-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'explanation-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 450px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 class="modal-title" style="margin-bottom: 0;" id="explanation-title"></h3>
                    <button onclick="closeExplanationModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #6b7280;">&times;</button>
                </div>
                <div style="margin-bottom: 15px;">
                    <div style="background: #f8fafc; border-radius: 12px; padding: 15px;">
                        <p style="margin-bottom: 10px;"><strong>📌 Ragione della connessione:</strong></p>
                        <p id="explanation-reason" style="margin-bottom: 15px; line-height: 1.5;"></p>
                        
                        <p style="margin-bottom: 8px;"><strong>📖 Evidenza:</strong></p>
                        <p id="explanation-evidence" style="margin-bottom: 15px; font-style: italic; color: #4b5563;"></p>
                        
                        <p style="margin-bottom: 8px;"><strong>🔗 Fonte:</strong></p>
                        <p id="explanation-source" style="font-size: 0.8rem; color: #8b5cf6;"></p>
                    </div>
                </div>
                <div class="modal-buttons" style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button class="modal-btn secondary" onclick="closeExplanationModal()">Chiudi</button>
                    <button class="modal-btn primary" onclick="copyExplanationToClipboard()">📋 Copia</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    document.getElementById('explanation-title').innerHTML = `<i class="fas fa-link"></i> ${explanation.title}`;
    document.getElementById('explanation-reason').innerHTML = explanation.reason;
    document.getElementById('explanation-evidence').innerHTML = explanation.evidence;
    document.getElementById('explanation-source').innerHTML = `<i class="fas fa-database"></i> ${explanation.source}`;
    
    window.currentExplanation = explanation;
    
    modal.style.display = 'flex';
}

function closeExplanationModal() {
    const modal = document.getElementById('explanation-modal');
    if (modal) modal.style.display = 'none';
}

function copyExplanationToClipboard() {
    if (!window.currentExplanation) return;
    
    const text = `Connessione: ${window.currentExplanation.title}\n\nRagione: ${window.currentExplanation.reason}\n\nEvidenza: ${window.currentExplanation.evidence}\n\nFonte: ${window.currentExplanation.source}`;
    
    navigator.clipboard.writeText(text).then(() => {
        showToast('Spiegazione copiata negli appunti!', 'success');
    }).catch(() => {
        showToast('Errore durante la copia', 'error');
    });
}

// ==================== FINE PUNTO 13 ====================
// ==================== PUNTO 14: EXPLORATORY MODE (VERSIONE GLOBALE CORRETTA) ====================
// Metodologia: Navigazione associativa - esplorazione libera su tutta l'app

let exploratoryModeActive = false;

/**
 * Attiva la modalità esplorativa su TUTTA l'app
 */
function enableExploratoryMode() {
    // Controllo se esiste già
    if (typeof exploratoryModeActive === 'undefined') {
        window.exploratoryModeActive = false;
    }
    
    if (exploratoryModeActive) {
        disableExploratoryMode();
        return;
    }
    
    // Aggiungi classe CSS al body
    document.body.classList.add('exploratory-mode');
    
    // 1. ANIMAZIONE SU TUTTE LE CARD (concetti, filosofi, opere)
    const allCards = document.querySelectorAll('.grid-item, .compact-item, .concetto-card');
    allCards.forEach((card, index) => {
        card.style.transition = 'all 0.3s ease';
        card.style.animation = `floatExplore ${2 + (index % 5) * 0.2}s ease-in-out infinite`;
        card.style.cursor = 'grab';
        
        // Rimuovi eventuali listener precedenti per evitare duplicati
        card.removeEventListener('mousemove', card._exploratoryHandler);
        
        // Crea e salva il handler
        const handler = (e) => {
            if (!exploratoryModeActive) return;
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `rotateX(${y * 3}deg) rotateY(${x * 3}deg)`;
        };
        
        card._exploratoryHandler = handler;
        card.addEventListener('mousemove', handler);
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
    
    // 2. ANIMAZIONE SULLA MAPPA CONCETTUALE
    const networkContainer = document.getElementById('concept-network');
    if (networkContainer) {
        networkContainer.style.transition = 'all 0.5s ease';
        networkContainer.style.boxShadow = '0 0 30px rgba(139, 92, 246, 0.3)';
    }
    
    // 3. ANIMAZIONE SULLA MAPPA GEOGRAFICA
    const mapContainer = document.getElementById('map');
    if (mapContainer) {
        mapContainer.style.transition = 'all 0.5s ease';
        mapContainer.style.filter = 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.3))';
    }
    
    // 4. EFFETTO FLUTTUANTE SUI PULSANTI
    const buttons = document.querySelectorAll('.home-btn, .filter-btn, .tab-btn');
    buttons.forEach((btn, index) => {
        btn.style.transition = 'all 0.3s ease';
        btn.style.animation = `floatExplore ${2 + (index % 3) * 0.3}s ease-in-out infinite`;
    });
    
    exploratoryModeActive = true;
    showExploratoryIndicator();
    
    if (typeof showToast === 'function') {
        showToast('🌊 Modalità Esplorativa attivata su tutta l\'app', 'success');
    }
    console.log('🌊 [ExploratoryMode] Attivata globalmente');
}

/**
 * Disattiva la modalità esplorativa
 */
function disableExploratoryMode() {
    document.body.classList.remove('exploratory-mode');
    
    // Reset card
    const allCards = document.querySelectorAll('.grid-item, .compact-item, .concetto-card');
    allCards.forEach((card) => {
        card.style.animation = '';
        card.style.transform = '';
        card.style.cursor = '';
        card.style.transition = '';
        if (card._exploratoryHandler) {
            card.removeEventListener('mousemove', card._exploratoryHandler);
            card._exploratoryHandler = null;
        }
    });
    
    // Reset pulsanti
    const buttons = document.querySelectorAll('.home-btn, .filter-btn, .tab-btn');
    buttons.forEach((btn) => {
        btn.style.animation = '';
        btn.style.transition = '';
    });
    
    // Reset mappe
    const networkContainer = document.getElementById('concept-network');
    if (networkContainer) networkContainer.style.boxShadow = '';
    
    const mapContainer = document.getElementById('map');
    if (mapContainer) mapContainer.style.filter = '';
    
    const indicator = document.getElementById('exploratory-indicator');
    if (indicator) indicator.remove();
    
    exploratoryModeActive = false;
    
    if (typeof showToast === 'function') {
        showToast('Modalità Esplorativa disattivata', 'info');
    }
    console.log('🌊 [ExploratoryMode] Disattivata');
}

/**
 * Mostra indicatore modalità esplorativa
 */
function showExploratoryIndicator() {
    const existingIndicator = document.getElementById('exploratory-indicator');
    if (existingIndicator) existingIndicator.remove();
    
    const indicator = document.createElement('div');
    indicator.id = 'exploratory-indicator';
    indicator.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(139, 92, 246, 0.95);
        backdrop-filter: blur(10px);
        color: white;
        padding: 8px 20px;
        border-radius: 30px;
        font-size: 0.8rem;
        z-index: 1000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideDown 0.3s ease-out;
    `;
    
    indicator.innerHTML = `
        <i class="fas fa-globe-americas"></i>
        <span>Modalità Esplorativa attiva</span>
        <button onclick="disableExploratoryMode()" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1rem;
        ">✕</button>
    `;
    
    document.body.appendChild(indicator);
}

/**
 * Attiva una visualizzazione casuale dei concetti (suggerimento esplorativo)
 */
function randomExploration() {
    if (typeof concettiData === 'undefined' || !concettiData || concettiData.length === 0) {
        if (typeof showToast === 'function') {
            showToast('Nessun concetto disponibile', 'warning');
        }
        return;
    }
    
    const randomIndex = Math.floor(Math.random() * concettiData.length);
    const randomConcept = concettiData[randomIndex];
    
    if (typeof showToast === 'function') {
        showToast(`🔍 Suggerimento: esplora "${randomConcept.parola}"`, 'info', 3000);
    }
    
    // Effetto visivo sulla card corrispondente
    const cards = document.querySelectorAll('.concetto-card');
    cards.forEach(card => {
        const title = card.querySelector('.concetto-parola')?.textContent;
        if (title === randomConcept.parola) {
            card.style.animation = 'pulseExplore 0.5s ease-in-out 3';
            setTimeout(() => {
                card.style.animation = '';
            }, 1500);
        }
    });
}

// ==================== FINE PUNTO 14 ====================
// ==================== ESPLORAZIONE CASUALE PER CONCETTI/FILOSOFI/OPERE ====================

/**
 * Esplorazione casuale in base alla pagina corrente
 * Scrolla automaticamente all'elemento selezionato e lo anima
 */
function randomExploration() {
    const screen = currentScreen;
    let randomItem = null;
    
    // Concetti
    if (screen === 'concetti-screen') {
        if (!concettiData || concettiData.length === 0) {
            showToast('Nessun concetto disponibile', 'warning');
            return;
        }
        randomItem = concettiData[Math.floor(Math.random() * concettiData.length)];
        showToast(`🎲 Concetto casuale: "${randomItem.parola}"`, 'info', 2000);
        
        setTimeout(() => {
            const cards = document.querySelectorAll('#concetti-list .concetto-card');
            for (let card of cards) {
                const titleElem = card.querySelector('.concetto-parola');
                if (titleElem && titleElem.textContent === randomItem.parola) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.style.animation = 'pulseExplore 0.5s ease-in-out 3';
                    setTimeout(() => {
                        card.style.animation = '';
                    }, 1500);
                    break;
                }
            }
        }, 100);
    }
    
    // Filosofi
    else if (screen === 'filosofi-screen') {
        if (!filosofiData || filosofiData.length === 0) {
            showToast('Nessun filosofo disponibile', 'warning');
            return;
        }
        randomItem = filosofiData[Math.floor(Math.random() * filosofiData.length)];
        showToast(`🎲 Filosofo casuale: "${randomItem.nome}"`, 'info', 2000);
        
        setTimeout(() => {
            const items = document.querySelectorAll('#filosofi-list .grid-item');
            for (let item of items) {
                const titleElem = item.querySelector('.item-name');
                if (titleElem && titleElem.textContent === randomItem.nome) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    item.style.animation = 'pulseExplore 0.5s ease-in-out 3';
                    setTimeout(() => {
                        item.style.animation = '';
                    }, 1500);
                    break;
                }
            }
        }, 100);
    }
    
    // Opere
    else if (screen === 'opere-screen') {
        if (!opereData || opereData.length === 0) {
            showToast('Nessuna opera disponibile', 'warning');
            return;
        }
        randomItem = opereData[Math.floor(Math.random() * opereData.length)];
        showToast(`🎲 Opera casuale: "${randomItem.titolo}"`, 'info', 2000);
        
        setTimeout(() => {
            const items = document.querySelectorAll('#opere-list .compact-item');
            for (let item of items) {
                const titleElem = item.querySelector('.compact-item-name');
                if (titleElem && titleElem.textContent === randomItem.titolo) {
                    item.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    item.style.animation = 'pulseExplore 0.5s ease-in-out 3';
                    setTimeout(() => {
                        item.style.animation = '';
                    }, 1500);
                    break;
                }
            }
        }, 100);
    }
    
    // Altre schermate (opzionale: naviga alla lista corrispondente)
    else {
        showToast('Vai prima alla pagina Concetti, Filosofi o Opere', 'info');
    }
}

// ==================== FINE ESPLORAZIONE CASUALE ====================
// ==================== PUNTO 15: CONCEPT SONIFICATION ====================
// Riferimento: Hermann, T. (2008). "Taxonomy and Definitions for Sonification"
// Metodologia: Mappatura di proprietà concettuali in parametri sonori

let sonificationActive = false;
let audioContext = null;
let currentOscillator = null;

/**
 * Inizializza l'AudioContext (deve essere avviato da un gesto utente)
 */
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    return audioContext;
}

/**
 * Attiva/disattiva la sonificazione dei concetti
 */
function toggleSonification() {
    const btn = document.querySelector('.btn-sonification');
    
    if (sonificationActive) {
        disableSonification();
        if (btn) btn.classList.remove('active');
    } else {
        enableSonification();
        if (btn) btn.classList.add('active');
    }
}

/**
 * Attiva la sonificazione: aggiunge listener ai concetti
 */
function enableSonification() {
    if (sonificationActive) return;
    
    // Inizializza audio context al primo click
    initAudioContext();
    
    // Aggiunge listener per i concetti
    const conceptCards = document.querySelectorAll('.concetto-card');
    conceptCards.forEach(card => {
        card.addEventListener('mouseenter', playConceptSound);
        card.style.cursor = 'pointer';
    });
    
    sonificationActive = true;
    showSonificationIndicator(true);
    
    if (typeof showToast === 'function') {
        showToast('🎵 Sonificazione attivata - passa il mouse su un concetto', 'success');
    }
    console.log('🎵 [Sonification] Attivata');
}

/**
 * Disattiva la sonificazione
 */
function disableSonification() {
    if (!sonificationActive) return;
    
    const conceptCards = document.querySelectorAll('.concetto-card');
    conceptCards.forEach(card => {
        card.removeEventListener('mouseenter', playConceptSound);
        card.style.cursor = '';
    });
    
    if (currentOscillator) {
        try {
            currentOscillator.stop();
        } catch(e) {}
        currentOscillator = null;
    }
    
    sonificationActive = false;
    showSonificationIndicator(false);
    
    if (typeof showToast === 'function') {
        showToast('Sonificazione disattivata', 'info');
    }
    console.log('🎵 [Sonification] Disattivata');
}

/**
 * Riproduce un suono in base al concetto
 */
function playConceptSound(event) {
    if (!sonificationActive) return;
    
    const card = event.currentTarget;
    const conceptName = card.querySelector('.concetto-parola')?.textContent || '';
    const period = getConceptPeriod(conceptName);
    
    // Calcola frequenza in base al nome del concetto
    let frequency = conceptName.length * 50 + 200;
    frequency = Math.min(frequency, 800);
    frequency = Math.max(frequency, 220);
    
    // Aggiunge variazione in base al periodo
    if (period === 'classico') frequency *= 0.8;
    if (period === 'contemporaneo') frequency *= 1.2;
    
    // Durata del suono
    const duration = 0.6;
    
    try {
        const ctx = initAudioContext();
        
        // Crea oscillatore
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.type = period === 'classico' ? 'sine' : 'sawtooth';
        oscillator.frequency.value = frequency;
        
        gainNode.gain.value = 0.15;
        gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.start();
        oscillator.stop(ctx.currentTime + duration);
        
        // Ferma il precedente se ancora in esecuzione
        if (currentOscillator) {
            try {
                currentOscillator.stop();
            } catch(e) {}
        }
        currentOscillator = oscillator;
        
    } catch(e) {
        console.warn('Audio non supportato:', e);
    }
}

/**
 * Ottiene il periodo di un concetto
 */
function getConceptPeriod(conceptName) {
    if (typeof concettiData === 'undefined') return 'classico';
    const concept = concettiData.find(c => c.parola === conceptName);
    return concept ? concept.periodo : 'classico';
}

/**
 * Mostra indicatore sonificazione
 */
function showSonificationIndicator(isActive) {
    let indicator = document.getElementById('sonification-indicator');
    
    if (!isActive) {
        if (indicator) indicator.remove();
        return;
    }
    
    if (indicator) indicator.remove();
    
    indicator = document.createElement('div');
    indicator.id = 'sonification-indicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: rgba(236, 72, 153, 0.95);
        backdrop-filter: blur(10px);
        color: white;
        padding: 8px 16px;
        border-radius: 30px;
        font-size: 0.8rem;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    indicator.innerHTML = `
        <i class="fas fa-music"></i>
        <span>Sonificazione attiva</span>
        <button onclick="disableSonification()" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1rem;
        ">✕</button>
    `;
    
    document.body.appendChild(indicator);
}

// ==================== FINE PUNTO 15 ====================
// ==================== PUNTO 16: CONCEPTUAL DEPTH ASSESSMENT ====================
// Strumento di autovalutazione accademica per studenti e ricercatori

let assessmentQuestions = [];
let currentQuestionIndex = 0;
let assessmentAnswers = [];
let assessmentActive = false;

/**
 * Avvia il Conceptual Assessment
 */
function startConceptualAssessment() {
    // Genera 5 domande casuali dai concetti
    assessmentQuestions = generateAssessmentQuestions(5);
    currentQuestionIndex = 0;
    assessmentAnswers = [];
    assessmentActive = true;
    
    // Mostra il modale
    const modal = document.getElementById('assessment-modal');
    if (modal) modal.style.display = 'flex';
    
    // Mostra la prima domanda
    renderAssessmentQuestion();
    
    // Gestisci bottoni
    const nextBtn = document.getElementById('assessment-next-btn');
    const restartBtn = document.getElementById('assessment-restart-btn');
    if (nextBtn) nextBtn.style.display = 'none';
    if (restartBtn) restartBtn.style.display = 'none';
    
    console.log('📚 [Assessment] Avviato con', assessmentQuestions.length, 'domande');
}

/**
 * Genera domande casuali dal dataset
 */
function generateAssessmentQuestions(count) {
    if (!concettiData || concettiData.length === 0) return [];
    
    // Seleziona concetti casuali
    const shuffled = [...concettiData].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    
    return selected.map(concept => {
        // Trova definizioni di altri concetti come distrattori
        const otherConcepts = concettiData.filter(c => c.id !== concept.id);
        const distractors = otherConcepts
            .sort(() => 0.5 - Math.random())
            .slice(0, 2)
            .map(c => c.definizione.substring(0, 200));
        
        // Opzioni: 1 corretta + 2 distrattori
        const options = [
            { text: concept.definizione.substring(0, 200), correct: true },
            { text: distractors[0] || 'Definizione non disponibile', correct: false },
            { text: distractors[1] || 'Definizione non disponibile', correct: false }
        ];
        
        // Mescola le opzioni
        const shuffledOptions = [...options].sort(() => 0.5 - Math.random());
        
        return {
            conceptId: concept.id,
            conceptName: concept.parola,
            options: shuffledOptions,
            domain: concept.dominio || 'Filosofia'
        };
    });
}

/**
 * Mostra la domanda corrente
 */
function renderAssessmentQuestion() {
    const container = document.getElementById('assessment-content');
    const resultDiv = document.getElementById('assessment-result');
    const nextBtn = document.getElementById('assessment-next-btn');
    const restartBtn = document.getElementById('assessment-restart-btn');
    
    if (!container) return;
    
    if (resultDiv) resultDiv.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (restartBtn) restartBtn.style.display = 'none';
    
    if (currentQuestionIndex >= assessmentQuestions.length) {
        showAssessmentResults();
        return;
    }
    
    const question = assessmentQuestions[currentQuestionIndex];
    const progress = ((currentQuestionIndex) / assessmentQuestions.length) * 100;
    
    container.innerHTML = `
        <div class="assessment-progress">
            <div class="assessment-progress-bar" style="width: ${progress}%;"></div>
        </div>
        <div class="assessment-question">
            <p style="font-size: 0.8rem; color: #8b5cf6; margin-bottom: 8px;">
                <i class="fas fa-tag"></i> ${question.domain}
            </p>
            <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 15px;">
                Quale delle seguenti definizioni corrisponde al concetto <span style="color: #8b5cf6;">"${question.conceptName}"</span>?
            </p>
            <div id="assessment-options">
                ${question.options.map((opt, idx) => `
                    <div class="assessment-option" data-opt-index="${idx}" data-correct="${opt.correct}">
                        <span style="font-weight: 600; margin-right: 10px;">${String.fromCharCode(65 + idx)}.</span>
                        ${escapeHtml(opt.text)}
                    </div>
                `).join('')}
            </div>
            <div id="assessment-feedback" style="display: none;"></div>
        </div>
        <p style="font-size: 0.75rem; color: #9ca3af; text-align: center; margin-top: 10px;">
            Domanda ${currentQuestionIndex + 1} di ${assessmentQuestions.length}
        </p>
    `;
    
    // Aggiungi listener alle opzioni
    document.querySelectorAll('.assessment-option').forEach(opt => {
        opt.addEventListener('click', () => handleAssessmentAnswer(opt));
    });
}

/**
 * Gestisce la risposta dell'utente
 */
function handleAssessmentAnswer(selectedOption) {
    if (!assessmentActive) return;
    if (selectedOption.classList.contains('correct') || selectedOption.classList.contains('incorrect')) return;
    
    const isCorrect = selectedOption.dataset.correct === 'true';
    const question = assessmentQuestions[currentQuestionIndex];
    const feedbackDiv = document.getElementById('assessment-feedback');
    
    // Registra la risposta
    assessmentAnswers.push({
        conceptName: question.conceptName,
        isCorrect: isCorrect,
        timestamp: new Date().toISOString()
    });
    
    // Evidenzia la risposta corretta
    document.querySelectorAll('.assessment-option').forEach(opt => {
        if (opt.dataset.correct === 'true') {
            opt.classList.add('correct');
        }
        if (opt === selectedOption && !isCorrect) {
            opt.classList.add('incorrect');
        }
    });
    
    // Mostra feedback
    if (feedbackDiv) {
        feedbackDiv.style.display = 'block';
        if (isCorrect) {
            feedbackDiv.className = 'assessment-feedback correct';
            feedbackDiv.innerHTML = `
                <i class="fas fa-check-circle"></i> Corretto! 
                "${question.conceptName}" è definito correttamente.
            `;
        } else {
            const correctOption = question.options.find(opt => opt.correct);
            feedbackDiv.className = 'assessment-feedback incorrect';
            feedbackDiv.innerHTML = `
                <i class="fas fa-times-circle"></i> Non corretto.<br>
                <strong>Definizione corretta di "${question.conceptName}":</strong><br>
                ${escapeHtml(correctOption.text)}
            `;
        }
    }
    
    // Mostra pulsante Avanti
    const nextBtn = document.getElementById('assessment-next-btn');
    if (nextBtn) nextBtn.style.display = 'inline-flex';
}

/**
 * Passa alla domanda successiva
 */
function nextAssessmentQuestion() {
    currentQuestionIndex++;
    renderAssessmentQuestion();
}

/**
 * Mostra i risultati finali
 */
function showAssessmentResults() {
    const container = document.getElementById('assessment-content');
    const resultDiv = document.getElementById('assessment-result');
    const nextBtn = document.getElementById('assessment-next-btn');
    const restartBtn = document.getElementById('assessment-restart-btn');
    
    const correctCount = assessmentAnswers.filter(a => a.isCorrect).length;
    const percentage = (correctCount / assessmentAnswers.length) * 100;
    
    if (container) container.style.display = 'none';
    if (nextBtn) nextBtn.style.display = 'none';
    if (restartBtn) restartBtn.style.display = 'inline-flex';
    
    if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <h4 style="margin-bottom: 10px; color: #1f2937;">Risultati Assessment</h4>
            <p style="font-size: 1.5rem; font-weight: 700; color: #3b82f6;">${correctCount}/${assessmentAnswers.length} corrette</p>
            <p style="font-size: 0.9rem; color: #6b7280;">Accuratezza: ${percentage.toFixed(0)}%</p>
            <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 0.8rem; color: #8b5cf6; margin-bottom: 10px;">
                    <i class="fas fa-info-circle"></i> Metodologia
                </p>
                <p style="font-size: 0.75rem; color: #6b7280;">
                    Assessment basato sul dataset Aeterna v5.0.
                    Le definizioni sono estratte direttamente dai dati certificati.
                </p>
                <button onclick="exportAssessmentResults()" style="
                    margin-top: 10px;
                    background: #f3f4f6;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 0.7rem;
                ">
                    <i class="fas fa-download"></i> Esporta risultati (JSON)
                </button>
            </div>
        `;
    }
    
    assessmentActive = false;
}

/**
 * Esporta i risultati dell'assessment
 */
function exportAssessmentResults() {
    const report = {
        timestamp: new Date().toISOString(),
        totalQuestions: assessmentAnswers.length,
        correctCount: assessmentAnswers.filter(a => a.isCorrect).length,
        percentage: (assessmentAnswers.filter(a => a.isCorrect).length / assessmentAnswers.length) * 100,
        answers: assessmentAnswers,
        tool: "Aeterna Lexicon - Conceptual Depth Assessment v5.0"
    };
    
    const jsonStr = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aeterna_assessment_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    if (typeof showToast === 'function') {
        showToast('Risultati esportati!', 'success');
    }
}

/**
 * Chiude il modale dell'assessment
 */
function closeAssessmentModal() {
    const modal = document.getElementById('assessment-modal');
    if (modal) modal.style.display = 'none';
    assessmentActive = false;
}

// ==================== FINE PUNTO 16 ====================
// ==================== PUNTO 17: PARADIGM TRANSLATOR ====================
// Metodologia: Traduzione ermeneutica di concetti tra paradigmi storici

let translatorActive = false;

/**
 * Apre il modale del traduttore paradigmatico
 */
function openParadigmTranslator() {
    const conceptName = getCurrentConceptName();
    
    let modal = document.getElementById('paradigm-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'paradigm-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 550px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h3 class="modal-title" style="margin-bottom: 0;">
                        <i class="fas fa-exchange-alt"></i> Paradigm Translator
                    </h3>
                    <button onclick="closeParadigmTranslator()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
                </div>
                
                <div style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 600;">Concetto da tradurre:</label>
                    <input type="text" id="paradigm-concept-input" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;" 
                           placeholder="Es. Essere, Verità, Potere..." value="${conceptName || ''}">
                </div>
                
                <div style="display: flex; gap: 15px; margin-bottom: 20px;">
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">Da paradigma:</label>
                        <select id="paradigm-from" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">
                            <option value="classico">Classico (Aristotele, Platone)</option>
                            <option value="moderno">Moderno (Cartesio, Kant)</option>
                        </select>
                    </div>
                    <div style="flex: 1;">
                        <label style="display: block; margin-bottom: 5px; font-weight: 600;">A paradigma:</label>
                        <select id="paradigm-to" style="width: 100%; padding: 10px; border: 2px solid #e5e7eb; border-radius: 8px;">
                            <option value="contemporaneo">Contemporaneo (Heidegger, Foucault)</option>
                            <option value="moderno">Moderno (Cartesio, Kant)</option>
                        </select>
                    </div>
                </div>
                
                <button onclick="performParadigmTranslation()" style="width: 100%; padding: 12px; background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
                    <i class="fas fa-language"></i> Traduci
                </button>
                
                <div id="translation-result" style="display: none; margin-top: 20px; padding: 15px; background: #f8fafc; border-radius: 8px;">
                    <!-- Risultato traduzione -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    modal.style.display = 'flex';
}

/**
 * Ottiene il nome del concetto corrente
 */
function getCurrentConceptName() {
    if (currentScreen === 'concetto-detail-screen' && window.currentConcettoId) {
        const concetto = concettiData.find(c => c.id === window.currentConcettoId);
        return concetto ? concetto.parola : '';
    }
    return '';
}

/**
 * Esegue la traduzione paradigmatica
 */
function performParadigmTranslation() {
    const conceptName = document.getElementById('paradigm-concept-input')?.value.trim();
    const fromParadigm = document.getElementById('paradigm-from')?.value;
    const toParadigm = document.getElementById('paradigm-to')?.value;
    
    if (!conceptName) {
        showToast('Inserisci un concetto da tradurre', 'warning');
        return;
    }
    
    // Trova il concetto nel dataset
    const concept = concettiData.find(c => c.parola === conceptName);
    
    // Genera traduzione
    let translation = generateParadigmTranslation(conceptName, concept, fromParadigm, toParadigm);
    
    const resultDiv = document.getElementById('translation-result');
    if (resultDiv) {
        resultDiv.style.display = 'block';
        resultDiv.innerHTML = `
            <h4 style="margin-bottom: 10px; color: #8b5cf6;">
                <i class="fas fa-exchange-alt"></i> Traduzione Paradigmatica
            </h4>
            <div style="background: white; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
                <p style="font-size: 0.8rem; color: #6b7280;">Da <strong>${fromParadigm === 'classico' ? 'Paradigma Classico' : 'Paradigma Moderno'}</strong></p>
                <p style="font-size: 1rem;"><strong>${conceptName}</strong> → <span style="color: #8b5cf6;">${translation.targetTerm}</span></p>
                <p style="font-size: 0.85rem; margin-top: 10px;">${translation.explanation}</p>
            </div>
            ${concept ? `
            <div style="background: #f0fdf4; border-radius: 8px; padding: 12px;">
                <p style="font-size: 0.75rem; color: #065f46;">
                    <i class="fas fa-database"></i> Dalla definizione originale: "${concept.definizione?.substring(0, 150)}..."
                </p>
            </div>
            ` : ''}
        `;
    }
    
    console.log(`🔄 [ParadigmTranslator] ${conceptName}: ${fromParadigm} → ${toParadigm}`);
}

/**
 * Genera la traduzione paradigmatica (dinamica - funziona per tutti i concetti)
 */
function generateParadigmTranslation(conceptName, concept, fromParadigm, toParadigm) {
    // 1. TRAduzioni predefinite per concetti noti (esempi curati)
    const curatedTranslations = {
        'Essere': {
            classico_to_contemporaneo: {
                targetTerm: 'Evento / Esserci (Dasein)',
                explanation: 'Nella metafisica classica l\'essere è inteso come sostanza statica ed eterna. Nel pensiero contemporaneo, Heidegger lo trasforma in "Evento" (Ereignis) e "Esserci" (Dasein), sottolineando la dimensione temporale e processuale.'
            }
        },
        'Verità': {
            classico_to_contemporaneo: {
                targetTerm: 'Aletheia / Disvelamento',
                explanation: 'La verità come corrispondenza (adaequatio) nella tradizione classica diventa, con Heidegger, "disvelamento" (aletheia), un evento che si sottrae a ogni rappresentazione definitiva.'
            }
        },
        'Potere': {
            classico_to_contemporaneo: {
                targetTerm: 'Biopotere / Dispositivo',
                explanation: 'Il potere sovrano e verticale della tradizione classica (Hobbes) si trasforma, con Foucault, in potere diffuso, capillare, produttivo di saperi e soggettività.'
            }
        },
        'Soggetto': {
            moderno_to_contemporaneo: {
                targetTerm: 'Effetto discorsivo / Soggettivazione',
                explanation: 'Il soggetto cartesiano come fondamento certo (cogito) viene decentrato: diventa effetto del linguaggio, del potere, delle pratiche discorsive.'
            }
        }
    };
    
    const key = `${fromParadigm}_to_${toParadigm}`;
    
    // Se esiste una traduzione curata, usala
    if (curatedTranslations[conceptName] && curatedTranslations[conceptName][key]) {
        return curatedTranslations[conceptName][key];
    }
    
    // 2. TRADUZIONE DINAMICA GENERICA (basata sui dati del concetto)
    const period = concept?.periodo || 'classico';
    const domain = concept?.dominio || 'Filosofia';
    
    // Mappa dei termini target per dominio
    const domainMapping = {
        'Ontologia': {
            classico_to_contemporaneo: { target: 'Processo / Evento', explanation: 'Il concetto ontologico si trasforma da sostanza statica a processo dinamico e relazionale.' },
            moderno_to_contemporaneo: { target: 'Costruzione / Interpretazione', explanation: 'L\'oggettività moderna diventa costruzione storico-ermeneutica.' }
        },
        'Epistemologia': {
            classico_to_contemporaneo: { target: 'Interpretazione / Costruzione', explanation: 'La conoscenza come corrispondenza diventa interpretazione situata e contestuale.' },
            moderno_to_contemporaneo: { target: 'Pratica situata / Potere', explanation: 'La conoscenza universale si trasforma in sapere localizzato e legato al potere.' }
        },
        'Etica': {
            classico_to_contemporaneo: { target: 'Relazione / Responsabilità', explanation: 'Il bene oggettivo diventa etica della cura e della responsabilità verso l\'Altro.' },
            moderno_to_contemporaneo: { target: 'Scelta / Progetto', explanation: 'Il dovere universale diventa scelta esistenziale situata.' }
        },
        'Politica': {
            classico_to_contemporaneo: { target: 'Biopotere / Dispositivo', explanation: 'Il potere sovrano si trasforma in potere diffuso e produttivo di soggettività.' },
            moderno_to_contemporaneo: { target: 'Governamentalità / Sicurezza', explanation: 'Lo stato moderno diventa dispositivo di governo delle popolazioni.' }
        }
    };
    
    // Traduzione generica basata sul dominio
    if (domainMapping[domain] && domainMapping[domain][key]) {
        const mapping = domainMapping[domain][key];
        return {
            targetTerm: mapping.target,
            explanation: `${mapping.explanation} Il concetto "${conceptName}" appartiene al dominio ${domain}.`
        };
    }
    
    // 3. TRADUZIONE GENERICA DI DEFAULT
    const defaultTranslations = {
        classico_to_contemporaneo: {
            targetTerm: `${conceptName} (ricontestualizzato)`,
            explanation: `Nel passaggio dal paradigma classico a quello contemporaneo, il concetto "${conceptName}" perde la sua dimensione sostanzialistica e acquista una valenza processuale, storica e relazionale. La verità non è più corrispondenza, ma evento; l'essere non è sostanza, ma divenire.`
        },
        moderno_to_contemporaneo: {
            targetTerm: `${conceptName} (decentrato)`,
            explanation: `Nel passaggio dal paradigma moderno a quello contemporaneo, il concetto "${conceptName}" viene decostruito nelle sue pretese di universalità e fondazione. Il soggetto non è più centro, ma effetto; la ragione non è più assoluta, ma situata.`
        }
    };
    
    return defaultTranslations[key] || {
        targetTerm: `${conceptName} (trasformato)`,
        explanation: `Il concetto "${conceptName}" subisce una trasformazione significativa nel passaggio dal paradigma ${fromParadigm} al paradigma ${toParadigm}. La sua interpretazione si arricchisce di nuove sfumature contestuali.`
    };
}

function closeParadigmTranslator() {
    const modal = document.getElementById('paradigm-modal');
    if (modal) modal.style.display = 'none';
}

// ==================== FINE PUNTO 17 ====================
// ==================== PUNTO 18: SPATIAL VISUALIZATION (3D EFFECT) ====================
// Metodologia: Effetto prospettico 3D per la mappa concettuale

let spatial3DActive = false;
let originalContainerStyle = null;

/**
 * Attiva la visualizzazione spaziale 3D sulla mappa concettuale
 */
function enableSpatialVisualization() {
    const container = document.getElementById('concept-network');
    if (!container) {
        showToast('Vai prima alla Mappa Concettuale', 'warning');
        return;
    }
    
    if (spatial3DActive) {
        disableSpatialVisualization();
        return;
    }
    
    // Salva stile originale
    originalContainerStyle = {
        transform: container.style.transform,
        transition: container.style.transition,
        perspective: container.style.perspective
    };
    
    // Applica effetto 3D
    container.style.transition = 'all 0.5s ease';
    container.style.transform = 'perspective(1000px) rotateX(5deg) rotateY(-5deg)';
    container.style.perspective = '1000px';
    
    // Aggiunge effetto hover per interazione
    container.addEventListener('mousemove', handle3DMouseMove);
    container.addEventListener('mouseleave', handle3DMouseLeave);
    
    spatial3DActive = true;
    
    // Mostra indicatore
    showSpatialIndicator(true);
    
    showToast('🔮 Visualizzazione spaziale 3D attivata', 'success');
    console.log('🔮 [SpatialViz] Attivata');
}

/**
 * Disattiva la visualizzazione spaziale 3D
 */
function disableSpatialVisualization() {
    const container = document.getElementById('concept-network');
    if (!container) return;
    
    // Ripristina stile
    container.style.transform = originalContainerStyle?.transform || '';
    container.style.transition = originalContainerStyle?.transition || '';
    container.style.perspective = originalContainerStyle?.perspective || '';
    
    // Rimuovi listener
    container.removeEventListener('mousemove', handle3DMouseMove);
    container.removeEventListener('mouseleave', handle3DMouseLeave);
    
    spatial3DActive = false;
    
    // Rimuovi indicatore
    showSpatialIndicator(false);
    
    showToast('Visualizzazione 3D disattivata', 'info');
    console.log('🔮 [SpatialViz] Disattivata');
}

/**
 * Gestisce il movimento del mouse per effetto parallasse 3D
 */
function handle3DMouseMove(event) {
    if (!spatial3DActive) return;
    
    const container = event.currentTarget;
    const rect = container.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    
    const rotateX = y * 8;
    const rotateY = x * 8;
    
    container.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
}

/**
 * Gestisce l'uscita del mouse
 */
function handle3DMouseLeave(event) {
    if (!spatial3DActive) return;
    const container = event.currentTarget;
    container.style.transform = 'perspective(1000px) rotateX(3deg) rotateY(-3deg)';
}

/**
 * Mostra indicatore visualizzazione spaziale
 */
function showSpatialIndicator(isActive) {
    let indicator = document.getElementById('spatial-indicator');
    
    if (!isActive) {
        if (indicator) indicator.remove();
        return;
    }
    
    if (indicator) indicator.remove();
    
    indicator = document.createElement('div');
    indicator.id = 'spatial-indicator';
    indicator.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: rgba(59, 130, 246, 0.95);
        backdrop-filter: blur(10px);
        color: white;
        padding: 8px 16px;
        border-radius: 30px;
        font-size: 0.8rem;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideInRight 0.3s ease-out;
    `;
    
    indicator.innerHTML = `
        <i class="fas fa-cube"></i>
        <span>Visualizzazione 3D attiva</span>
        <button onclick="disableSpatialVisualization()" style="
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            font-size: 1rem;
        ">✕</button>
    `;
    
    document.body.appendChild(indicator);
}

// ==================== FINE PUNTO 18 ====================