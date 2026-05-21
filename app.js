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
        // Calcola rilevanza dei concetti
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
                        const width = 1.5 + (relevance / 4); // Aumentato spessore base
                        
                        edges.add({
                            from: filosofo.id,
                            to: 'C_' + concetto.id,
                            arrows: { to: { enabled: true, scaleFactor: 0.8 } },
                            color: {
                                color: filosofo.periodo === 'contemporaneo' ? '#f59e0b' : '#10b981',
                                opacity: 0.85, // CHECKLIST: Opacità alzata per massima visibilità
                                highlight: '#ef4444', // Rosso acceso al click
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
                                opacity: 0.85, // CHECKLIST: Visibilità netta
                                highlight: '#f59e0b', // Arancione acceso al click
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
                // CHECKLIST: Ombre spente di base. Uccidono i 60fps su mobile durante il drag
                shadow: { enabled: false } 
            },
            edges: {
                smooth: { type: 'dynamic' }, // CHECKLIST: 'dynamic' è computazionalmente più leggero di 'continuous'
                hoverWidth: 3, // CHECKLIST: Rafforzamento visivo al passaggio
                selectionWidth: 4, // CHECKLIST: Rafforzamento visivo al click
                color: { inherit: false }, 
                arrows: { to: { enabled: true, scaleFactor: 0.8, type: 'arrow' } },
                font: { align: 'middle', size: 10, color: '#343434' }
            },
            physics: {
                enabled: true, // Acceso SOLO all'inizio
                stabilization: { iterations: 150, updateInterval: 25, fit: true },
                solver: 'barnesHut',
                barnesHut: {
                    gravitationalConstant: -2000,
                    centralGravity: 0.3,
                    springLength: 180,
                    springConstant: 0.04,
                    damping: 0.09,
                    avoidOverlap: 1 // CHECKLIST: Alzato a 1. Impedisce categoricamente la sovrapposizione fisica dei nodi
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
                hideEdgesOnDrag: true, // CHECKLIST: Trucco fondamentale per i 60fps su mobile. Nasconde temporaneamente le linee mentre sposti la mappa.
                tooltipDelay: 150,
                navigationButtons: true // <-- CORRETTO QUI: Accetta solo un booleano semplice per evitare errori bloccanti
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

        // ============ 6. EVENTI MIGLIORATI ============
        networkInstance.on("click", function(params) {
            const currentTime = new Date().getTime();
            const timeDiff = currentTime - lastClickTime;

            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];

                // Doppio click
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

                // Click singolo
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

        // ============ 7. STABILIZZAZIONE (IL FREEZE) ============
        networkInstance.on("stabilizationIterationsDone", function() {
            // CHECKLIST: IL SEGRETO DELLA STABILITÀ. 
            // Appena i nodi si sono posizionati, spegniamo il motore fisico. 
            // Nessuna vibrazione, nessun ricalcolo in background.
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
    
    // Gestione bottoni UI
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
    
    // Ripristina la mappa
    if (networkInstance) {
        const nodes = networkInstance.body.data.nodes;
        const allNodes = nodes.get();
        allNodes.forEach(node => {
            nodes.update({ id: node.id, color: { opacity: 1 }, borderWidth: 2 });
        });
        networkInstance.fit({ animation: { duration: 800 } });
    }
    
    // Gestione bottoni UI
    const disableBtn = document.getElementById('btn-disable-superimposed');
    if (disableBtn) disableBtn.style.display = 'none';
    
    console.log('📚 [SuperimposedVis] Disattivata');
}

/**
 * Estrae i layer semantici dai dati del concetto
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
        const authors = concept.autore_riferimento.split(',').map(a => a.trim());
        if (authors.length > 0) {
            layers.push({
                id: 'authors',
                title: `Autori di riferimento (${authors.length})`,
                summary: authors.join(', '),
                source: 'Dataset Aeterna',
                fullText: authors.join(', '),
                type: 'authors',
                authors: authors
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
    
    // BUG FIXATO QUI: Passaggio esplicito dell'evento 'e'
    bubble.onclick = (e) => {
        e.stopPropagation();
        selectSemanticLayer(layer, concept, e); 
    };
    
    return bubble;
}

/**
 * Seleziona un layer semantico (Contextual Filtering)
 */
function selectSemanticLayer(layer, concept, event) { // BUG FIXATO QUI: Ricezione parametro 'event'
    console.log(`🔍 [ContextualFilter] Selezione: "${layer.title}" per ${concept.parola}`);
    
    showLayerDetail(layer, concept);
    
    document.querySelectorAll('.semantic-bubble').forEach(bubble => {
        bubble.style.opacity = '0.5';
        bubble.style.transform = 'scale(0.95)';
    });
    
    // Utilizzo corretto dell'event
    event.target.closest('.semantic-bubble').style.opacity = '1';
    event.target.closest('.semantic-bubble').style.transform = 'scale(1.05)';
    
    if (networkInstance) {
        highlightRelatedNodes(concept, layer);
    }
    
    logAnalyticalChoice(concept.id, layer.id, layer.title);
    showToast(`📌 Filtro contestuale: "${layer.title}" selezionato`, 'success');
}

/**
 * Mostra il dettaglio del layer selezionato
 */
function showLayerDetail(layer, concept) {
    let modal = document.getElementById('layer-detail-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'layer-detail-modal';
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <h3 class="modal-title" id="layer-modal-title"></h3>
                <div id="layer-modal-content" style="margin: 20px 0; line-height: 1.6;"></div>
                <div class="modal-buttons">
                    <button class="modal-btn secondary" onclick="closeLayerDetailModal()">Chiudi</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    const titleEl = document.getElementById('layer-modal-title');
    const contentEl = document.getElementById('layer-modal-content');
    
    titleEl.innerHTML = `<i class="fas fa-layer-group"></i> ${concept.parola} - ${layer.title}`;
    contentEl.innerHTML = `
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px;">
            <p style="margin-bottom: 10px;"><strong>Fonte:</strong> ${layer.source}</p>
            <p style="margin-bottom: 10px;"><strong>Contenuto:</strong></p>
            <p style="font-style: italic; color: #4b5563;">${escapeHtml(layer.fullText || layer.summary)}</p>
        </div>
    `;
    
    modal.style.display = 'flex';
}

function closeLayerDetailModal() {
    const modal = document.getElementById('layer-detail-modal');
    if (modal) modal.style.display = 'none';
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
    
    // Salva lo stato del filtro attivo
    window.activeFilter = {
        conceptId: concept.id,
        conceptName: concept.parola,
        layerId: layer.id,
        layerTitle: layer.title,
        timestamp: Date.now()
    };
    
    // Mostra indicatore di filtro attivo
    showFilterIndicator(concept.parola, layer.title);
    
    // 1. Identificazione dinamica dei nodi correlati (Filtro Filologico)
    const conceptNodeId = 'C_' + concept.id;
    const relatedNodeIds = new Set();
    relatedNodeIds.add(conceptNodeId);
    
    if (layer.type === 'authors' && layer.authors) {
        layer.authors.forEach(authorRef => {
            const authorNode = filosofiData.find(f => f.id === authorRef.trim() || f.nome === authorRef.trim());
            if (authorNode) relatedNodeIds.add(authorNode.id);
        });
    } else if (layer.type === 'definition') {
        filosofiData.forEach(f => {
            if (f.periodo === 'classico' && f.concetti_principali && f.concetti_principali.includes(concept.parola)) {
                relatedNodeIds.add(f.id);
            }
        });
    } else if (layer.type === 'evolution') {
        filosofiData.forEach(f => {
            if (f.periodo === 'contemporaneo' && f.concetti_principali && f.concetti_principali.includes(concept.parola)) {
                relatedNodeIds.add(f.id);
            }
        });
    } else if (layer.type === 'example') {
        if (concept.autore_riferimento) {
            concept.autore_riferimento.split(',').forEach(id => relatedNodeIds.add(id.trim()));
        }
    }
    
    // 2. Aggiornamento Visivo di Nodi ed Edges combinato (Chiamata atomica per performance)
    allNodes.forEach(node => {
        const isTarget = relatedNodeIds.has(node.id);
        const isCurrentConcept = (node.id === conceptNodeId);
        
        nodes.update({
            id: node.id,
            color: {
                opacity: isTarget ? 1.0 : 0.15,
                border: isCurrentConcept ? '#ef4444' : undefined
            },
            font: {
                color: isTarget ? '#ffffff' : 'rgba(255,255,255,0.2)',
                size: isCurrentConcept ? 14 : 11
            }
        });
    });
    
    allEdges.forEach(edge => {
        const hasFrom = relatedNodeIds.has(edge.from);
        const hasTo = relatedNodeIds.has(edge.to);
        
        if (hasFrom && hasTo) {
            edges.update({
                id: edge.id,
                hidden: false,
                color: { color: '#ef4444', opacity: 1 },
                width: 3
            });
        } else if (hasFrom || hasTo) {
            edges.update({
                id: edge.id,
                hidden: false,
                color: { opacity: 0.4 },
                width: 1.5
            });
        } else {
            edges.update({
                id: edge.id,
                hidden: true
            });
        }
    });
    
    // 3. Focus sul concetto
    networkInstance.focus(conceptNodeId, {
        scale: 1.4,
        animation: { duration: 600, easingFunction: 'easeInOutQuad' }
    });
    
    console.log(`🎯 [ContextualFilter] Cluster isolato visivamente per: ${concept.parola}`);
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
    
    nodes.get().forEach(node => {
        nodes.update({
            id: node.id,
            color: { opacity: 1 },
            font: { color: '#ffffff', size: node.id.startsWith('C_') ? 11 : 12 }
        });
    });
    
    edges.get().forEach(edge => {
        edges.update({
            id: edge.id,
            hidden: false,
            color: { opacity: 0.6 },
            width: 1.5
        });
    });
    
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

/**
 * Traccia la scelta analitica dell'utente
 */
function logAnalyticalChoice(conceptId, layerId, layerTitle) {
    const choice = {
        timestamp: new Date().toISOString(),
        conceptId: conceptId,
        layerId: layerId,
        layerTitle: layerTitle,
        userAgent: navigator.userAgent
    };
    
    const choices = JSON.parse(localStorage.getItem('aeterna_analytical_choices') || '[]');
    choices.push(choice);
    if (choices.length > 100) choices.shift();
    localStorage.setItem('aeterna_analytical_choices', JSON.stringify(choices));
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}