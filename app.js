/**
 * AETERNA LEXICON IN MOTU - APP.JS VERSIONE PULITA
 * Project Work Filosofico - Dataset per analisi trasformazioni linguistiche
 * Versione 3.1.0 - Solo funzionalità filosofiche essenziali
 */

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
        
        // Gestisci parametri URL
        handleUrlParameters();
        
        console.log('✅ App filosofica pronta');
    }, 1500);
    
    // Inizializza Firebase
    initializeFirebase();
    
    // Carica dati filosofici
    await loadPhilosophicalData();
    
    // Setup connessione
    setupConnectionListeners();
    
    // Setup PWA
    setupPWA();
});

// ==================== DATI FILOSOFICI ====================
let filosofiData = [];
let opereData = [];
let concettiData = [];
let currentFilter = 'all';

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
            initPhilosophicalMap();
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
        if (window.db) {
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
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">👤</div>
                <p class="empty-state-text">Nessun filosofo trovato</p>
                <p class="empty-state-subtext">Aggiungi filosofi dal pannello admin</p>
            </div>
        `;
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
                ${filosofo.concetti_principali?.length > 0 ? 
                    `<span class="item-concetti-count">${filosofo.concetti_principali.length} concetti</span>` : ''}
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
            <div class="detail-image-container">
                ${filosofo.immagine ? 
                    `<img src="${filosofo.immagine}" alt="${filosofo.nome}" class="detail-image" 
                         onerror="this.src='https://derolu0.github.io/aeterna/images/default-filosofo.jpg'">` :
                    `<div class="image-fallback detail-fallback">👤</div>`
                }
            </div>
            <h1 class="detail-name">${filosofo.nome}</h1>
            <div class="detail-meta-grid">
                <div class="meta-item">
                    <strong>Periodo Storico</strong>
                    <span>${getPeriodoLabel(filosofo.periodo)}</span>
                </div>
                <div class="meta-item">
                    <strong>Scuola/Corrente</strong>
                    <span>${filosofo.scuola || 'N/D'}</span>
                </div>
                <div class="meta-item">
                    <strong>Anni di Vita</strong>
                    <span>${filosofo.anni || 'N/D'}</span>
                </div>
                <div class="meta-item">
                    <strong>Luogo di Nascita</strong>
                    <span>${filosofo.luogo_nascita?.citta || 'N/D'}, ${filosofo.luogo_nascita?.paese || ''}</span>
                </div>
            </div>
        </div>
        
        <div class="detail-info">
            <h3><i class="fas fa-book-open"></i> Biografia</h3>
            <p class="biography-text">${filosofo.biografia || 'Biografia non disponibile.'}</p>
        </div>
        
        ${filosofo.concetti_principali?.length > 0 ? `
            <div class="detail-info">
                <h3><i class="fas fa-brain"></i> Concetti Principali</h3>
                <div class="tags-cloud">
                    ${filosofo.concetti_principali.map(c => `<span class="tag-chip">${c}</span>`).join('')}
                </div>
            </div>
        ` : ''}
        
        <div class="action-buttons-container">
            ${filosofo.luogo_nascita?.coordinate ? `
                <button class="btn-analisi" onclick="openNavigationToFilosofo('${filosofo.id}')">
                    <i class="fas fa-map-marker-alt"></i> Vai al Luogo
                </button>
            ` : ''}
            <button class="btn-secondary" onclick="openComparativeAnalysis('${filosofo.nome.split(' ')[0]}')">
                <i class="fas fa-chart-line"></i> Analisi Comparativa
            </button>
        </div>
    `;
    
    showScreen('filosofo-detail-screen');
}

// ==================== GESTIONE OPERE ====================
async function loadOpere() {
    try {
        if (window.db) {
            const snapshot = await window.db.collection(window.COLLECTIONS.OPERE).get();
            opereData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } else {
            opereData = getSampleOpere();
        }
        
        renderOpereList();
        
    } catch (error) {
        console.error('Errore opere:', error);
        opereData = getSampleOpere();
        renderOpereList();
    }
}

function renderOpereList() {
    const container = document.getElementById('opere-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (opereData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📚</div>
                <p class="empty-state-text">Nessuna opera trovata</p>
            </div>
        `;
        return;
    }
    
    const filtered = currentFilter === 'all' 
        ? opereData 
        : opereData.filter(o => o.periodo === currentFilter);
    
    filtered.forEach(opera => {
        container.appendChild(createOperaCard(opera));
    });
}

function createOperaCard(opera) {
    const card = document.createElement('div');
    card.className = 'compact-item';
    card.classList.add(`border-${opera.periodo === 'contemporaneo' ? 'contemporary' : 'classic'}`);
    
    const autore = filosofiData.find(f => f.id === opera.autore_id)?.nome || opera.autore || 'Autore sconosciuto';
    
    card.innerHTML = `
        <div class="compact-item-image-container">
            <div class="compact-image-fallback">📖</div>
        </div>
        <div class="compact-item-content">
            <div class="compact-item-header">
                <h3 class="compact-item-name">${opera.titolo}</h3>
                <span class="compact-item-periodo periodo-${opera.periodo}">
                    ${opera.periodo === 'contemporaneo' ? 'CONTEMP.' : 'CLASSICO'}
                </span>
            </div>
            <div class="compact-item-autore">
                <i class="fas fa-user-pen"></i> ${autore}
            </div>
            <div class="compact-item-footer">
                <span class="compact-item-anno">
                    <i class="fas fa-calendar"></i> ${opera.anno || 'N/D'}
                </span>
                ${opera.concetti?.length > 0 ? 
                    `<span class="compact-item-concetti">${opera.concetti.length} concetti</span>` : ''}
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
    if (!content) return;
    
    const autore = filosofiData.find(f => f.id === opera.autore_id);
    
    content.innerHTML = `
        <div class="detail-header">
            <div class="detail-image-container">
                <div class="image-fallback detail-fallback" style="font-size: 4rem;">📖</div>
            </div>
            <h1 class="detail-name">${opera.titolo}</h1>
            <div class="detail-meta-grid">
                <div class="meta-item">
                    <strong>Autore</strong>
                    <span>${autore ? autore.nome : opera.autore || 'N/D'}</span>
                </div>
                <div class="meta-item">
                    <strong>Anno</strong>
                    <span>${opera.anno || 'N/D'}</span>
                </div>
                <div class="meta-item">
                    <strong>Periodo</strong>
                    <span>${getPeriodoLabel(opera.periodo)}</span>
                </div>
                <div class="meta-item">
                    <strong>Lingua</strong>
                    <span>${opera.lingua || 'N/D'}</span>
                </div>
            </div>
        </div>
        
        <div class="detail-info">
            <h3><i class="fas fa-file-alt"></i> Sintesi</h3>
            <p class="biography-text">${opera.sintesi || 'Sintesi non disponibile.'}</p>
        </div>
        
        ${opera.concetti?.length > 0 ? `
            <div class="detail-info">
                <h3><i class="fas fa-tags"></i> Concetti Trattati</h3>
                <div class="tags-cloud">
                    ${opera.concetti.map(c => `<span class="tag-chip">${c}</span>`).join('')}
                </div>
            </div>
        ` : ''}
        
        ${opera.pdf ? `
            <div class="action-buttons-container">
                <button class="btn-analisi" onclick="window.open('${opera.pdf}', '_blank')">
                    <i class="fas fa-external-link-alt"></i> Apri Testo
                </button>
                <button class="btn-secondary" onclick="analyzeOperaLinguistics('${opera.id}')">
                    <i class="fas fa-chart-bar"></i> Analisi Testuale
                </button>
            </div>
        ` : ''}
    `;
    
    showScreen('opera-detail-screen');
}

// ==================== GESTIONE CONCETTI ====================
async function loadConcetti() {
    try {
        if (window.db) {
            const snapshot = await window.db.collection(window.COLLECTIONS.CONCETTI).get();
            concettiData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } else {
            concettiData = getSampleConcetti();
        }
        
        renderConcettiList();
        
    } catch (error) {
        console.error('Errore concetti:', error);
        concettiData = getSampleConcetti();
        renderConcettiList();
    }
}

function renderConcettiList() {
    const container = document.getElementById('concetti-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (concettiData.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">💡</div>
                <p class="empty-state-text">Nessun concetto trovato</p>
            </div>
        `;
        return;
    }
    
    // Raggruppa per periodo
    const classici = concettiData.filter(c => c.periodo === 'classico');
    const contemporanei = concettiData.filter(c => c.periodo === 'contemporaneo');
    const transperiodali = concettiData.filter(c => c.periodo === 'entrambi');
    
    if (classici.length > 0) {
        container.appendChild(createConcettiSection('Periodo Classico', classici, 'classico'));
    }
    
    if (contemporanei.length > 0) {
        container.appendChild(createConcettiSection('Periodo Contemporaneo', contemporanei, 'contemporaneo'));
    }
    
    if (transperiodali.length > 0) {
        container.appendChild(createConcettiSection('Transperiodali', transperiodali, 'entrambi'));
    }
}

function createConcettiSection(title, concetti, periodo) {
    const section = document.createElement('div');
    section.className = 'concetti-section';
    
    section.innerHTML = `
        <div class="section-header">
            <h3><i class="fas fa-${periodo === 'classico' ? 'columns' : periodo === 'contemporaneo' ? 'bolt' : 'exchange-alt'}"></i> ${title}</h3>
            <span class="section-count">${concetti.length} concetti</span>
        </div>
        <div class="concetti-grid">
            ${concetti.map(concetto => createConcettoCard(concetto)).join('')}
        </div>
    `;
    
    return section;
}

function createConcettoCard(concetto) {
    const card = document.createElement('div');
    card.className = 'concetto-card';
    card.classList.add(`border-${concetto.periodo === 'contemporaneo' ? 'contemporary' : 'classic'}`);
    
    const autore = filosofiData.find(f => f.id === concetto.autore_id)?.nome || concetto.autore || '';
    const opera = opereData.find(o => o.id === concetto.opera_id)?.titolo || concetto.opera || '';
    
    card.innerHTML = `
        <div class="concetto-header">
            <h3 class="concetto-parola">${concetto.parola}</h3>
            <span class="concetto-periodo periodo-${concetto.periodo}">
                ${concetto.periodo === 'contemporaneo' ? 'CONTEMP.' : concetto.periodo === 'classico' ? 'CLASSICO' : 'TRANS.'}
            </span>
        </div>
        <p class="concetto-definizione">${concetto.definizione || 'Definizione non disponibile.'}</p>
        
        ${concetto.esempio ? `
            <div class="concetto-esempio">
                <i class="fas fa-quote-left"></i> ${concetto.esempio}
            </div>
        ` : ''}
        
        <div class="concetto-footer">
            ${autore ? `<span class="concetto-autore"><i class="fas fa-user"></i> ${autore}</span>` : ''}
            ${opera ? `<span class="concetto-opera"><i class="fas fa-book"></i> ${opera}</span>` : ''}
        </div>
        
        <div class="concetto-actions">
            <button class="btn-analisi small" onclick="openComparativeAnalysis('${concetto.parola}')">
                <i class="fas fa-chart-line"></i> Analisi Evolutiva
            </button>
            <button class="btn-secondary small" onclick="showConcettoDetail('${concetto.id}')">
                <i class="fas fa-info-circle"></i> Dettagli
            </button>
        </div>
    `;
    
    return card;
}

function showConcettoDetail(id) {
    const concetto = concettiData.find(c => c.id === id);
    if (!concetto) return;
    
    const content = document.getElementById('concetto-detail-content');
    if (!content) return;
    
    const autore = filosofiData.find(f => f.id === concetto.autore_id);
    const opera = opereData.find(o => o.id === concetto.opera_id);
    
    content.innerHTML = `
        <div class="detail-header">
            <h1 class="detail-name">${concetto.parola}</h1>
            <div class="detail-meta-grid">
                <div class="meta-item">
                    <strong>Periodo</strong>
                    <span>${getPeriodoLabel(concetto.periodo)}</span>
                </div>
                ${autore ? `
                    <div class="meta-item">
                        <strong>Autore</strong>
                        <span>${autore.nome}</span>
                    </div>
                ` : ''}
                ${opera ? `
                    <div class="meta-item">
                        <strong>Opera</strong>
                        <span>${opera.titolo}</span>
                    </div>
                ` : ''}
            </div>
        </div>
        
        <div class="detail-info">
            <h3><i class="fas fa-book"></i> Definizione</h3>
            <p class="biography-text">${concetto.definizione || 'Definizione non disponibile.'}</p>
        </div>
        
        ${concetto.esempio ? `
            <div class="detail-info">
                <h3><i class="fas fa-quote-right"></i> Esempio</h3>
                <blockquote class="concetto-citazione">${concetto.esempio}</blockquote>
            </div>
        ` : ''}
        
        ${concetto.evoluzione ? `
            <div class="detail-info">
                <h3><i class="fas fa-history"></i> Evoluzione</h3>
                <p class="biography-text">${concetto.evoluzione}</p>
            </div>
        ` : ''}
        
        <div class="action-buttons-container">
            <button class="btn-analisi" onclick="openComparativeAnalysis('${concetto.parola}')">
                <i class="fas fa-chart-line"></i> Analisi Comparativa
            </button>
            <button class="btn-secondary" onclick="showConceptConnections('${concetto.parola}')">
                <i class="fas fa-project-diagram"></i> Connessioni
            </button>
        </div>
    `;
    
    showScreen('concetto-detail-screen');
}

// ==================== MAPPA FILOSOFICA ====================
let philosophicalMap = null;

function initPhilosophicalMap() {
    if (!document.getElementById('map')) return;
    
    try {
        philosophicalMap = L.map('map').setView([41.8719, 12.5674], 5);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap',
            maxZoom: 18
        }).addTo(philosophicalMap);
        
        updateMapWithPhilosophers();
        
        // Posizione utente
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const { latitude, longitude } = position.coords;
                L.marker([latitude, longitude], {
                    icon: L.icon({
                        iconUrl: 'https://derolu0.github.io/aeterna/images/marker-red.png',
                        iconSize: [25, 41]
                    })
                }).addTo(philosophicalMap)
                  .bindPopup('La tua posizione');
            });
        }
        
    } catch (error) {
        console.error('Errore mappa:', error);
    }
}

function updateMapWithPhilosophers() {
    if (!philosophicalMap) return;
    
    filosofiData.forEach(filosofo => {
        if (filosofo.luogo_nascita?.coordinate) {
            const { lat, lng } = filosofo.luogo_nascita.coordinate;
            const color = filosofo.periodo === 'contemporaneo' ? 'orange' : 'green';
            
            const marker = L.marker([lat, lng], {
                icon: L.icon({
                    iconUrl: `https://derolu0.github.io/aeterna/images/marker-${color}.png`,
                    iconSize: [25, 41]
                })
            }).addTo(philosophicalMap);
            
            marker.bindPopup(`
                <div class="map-popup">
                    <h3>${filosofo.nome}</h3>
                    <p>${getPeriodoLabel(filosofo.periodo)}</p>
                    <p>${filosofo.luogo_nascita.citta}, ${filosofo.luogo_nascita.paese}</p>
                    <button onclick="showFilosofoDetail('${filosofo.id}')" class="btn-map-detail">
                        Dettagli
                    </button>
                </div>
            `);
        }
    });
}

// ==================== ANALISI COMPARATIVA ====================
function openComparativeAnalysis(termine) {
    console.log(`Analisi comparativa: ${termine}`);
    
    const modal = document.getElementById('comparative-analysis-modal');
    if (!modal) {
        showToast('Funzionalità in sviluppo', 'info');
        return;
    }
    
    modal.style.display = 'flex';
    
    // Popola con dati reali
    setTimeout(() => {
        populateComparativeAnalysis(termine);
    }, 500);
}

function populateComparativeAnalysis(termine) {
    // Implementazione base
    const title = document.getElementById('comparative-term-title');
    if (title) title.textContent = termine.toUpperCase();
    
    showToast(`Analisi per "${termine}" completata`, 'success');
}

// ==================== UTILITY FUNCTIONS ====================
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
    toast.className = 'toast ' + type;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        target.style.display = 'flex';
        
        // Aggiorna tab bar
        updateTabBar(screenId);
        
        // Carica dati se necessario
        loadScreenData(screenId);
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

function goBack() {
    // Implementazione semplice
    if (currentScreen.includes('detail')) {
        showScreen(currentScreen.replace('-detail-screen', '-screen'));
    } else {
        showScreen('home-screen');
    }
}

// ==================== DATI DI ESEMPIO ====================
function getSampleFilosofi() {
    return [
        {
            id: "F001",
            nome: "Platone",
            periodo: "classico",
            scuola: "Accademia di Atene",
            anni: "428/427 a.C. - 348/347 a.C.",
            luogo_nascita: {
                citta: "Atene",
                paese: "Grecia",
                coordinate: { lat: 37.9838, lng: 23.7275 }
            },
            biografia: "Fondatore dell'Accademia e autore dei Dialoghi. La sua filosofia esplora la teoria delle idee, l'immortalità dell'anima e la ricerca della verità.",
            concetti_principali: ["Idea", "Bene", "Anima", "Stato Ideale"]
        },
        {
            id: "F002",
            nome: "Friedrich Nietzsche",
            periodo: "contemporaneo",
            scuola: "Filosofia continentale",
            anni: "1844-1900",
            luogo_nascita: {
                citta: "Röcken",
                paese: "Germania",
                coordinate: { lat: 51.2372, lng: 12.0914 }
            },
            biografia: "Filosofo tedesco noto per la critica radicale alla cultura occidentale. Sviluppò concetti come l'Oltreuomo e la volontà di potenza.",
            concetti_principali: ["Oltreuomo", "Volontà di potenza", "Morte di Dio"]
        }
    ];
}

function getSampleOpere() {
    return [
        {
            id: "O001",
            titolo: "La Repubblica",
            autore: "Platone",
            autore_id: "F001",
            anno: "380 a.C.",
            periodo: "classico",
            sintesi: "Dialogo platonico che affronta il tema della giustizia e descrive lo Stato ideale governato dai filosofi.",
            concetti: ["Giustizia", "Stato Ideale", "Idea del Bene"]
        },
        {
            id: "O002",
            titolo: "Così parlò Zarathustra",
            autore: "Friedrich Nietzsche",
            autore_id: "F002",
            anno: "1883",
            periodo: "contemporaneo",
            sintesi: "Opera poetica e filosofica che presenta la figura dell'Oltreuomo e critica i valori tradizionali.",
            concetti: ["Oltreuomo", "Volontà di potenza"]
        }
    ];
}

function getSampleConcetti() {
    return [
        {
            id: "C001",
            parola: "Verità",
            definizione: "Concetto centrale della filosofia che indica la corrispondenza tra pensiero e realtà.",
            periodo: "entrambi",
            esempio: "La verità è la luce che permette di uscire dalla caverna delle apparenze.",
            evoluzione: "Da concezione ontologica classica a costruzione discorsiva contemporanea."
        },
        {
            id: "C002",
            parola: "Potere",
            definizione: "Capacità di influenzare, determinare o controllare il comportamento altrui.",
            periodo: "contemporaneo",
            esempio: "La volontà di potenza come principio fondamentale della vita.",
            evoluzione: "Da potere sovrano a potere diffuso nelle società disciplinari."
        }
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

// ==================== GESTIONE SCHERMATE ====================
function loadScreenData(screenId) {
    switch(screenId) {
        case 'mappa-screen':
            setTimeout(initPhilosophicalMap, 100);
            break;
        case 'filosofi-screen':
            renderFilosofiList();
            break;
        case 'opere-screen':
            renderOpereList();
            break;
        case 'concetti-screen':
            renderConcettiList();
            break;
    }
}

// ==================== GESTIONE MENU ====================
function toggleMenuModal() {
    const modal = document.getElementById('top-menu-modal');
    if (modal) {
        modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
    }
}

function openCreditsScreen() {
    showScreen('credits-screen');
    const modal = document.getElementById('top-menu-modal');
    if (modal) modal.style.display = 'none';
}

function openReportScreen() {
    showScreen('segnalazioni-screen');
    const modal = document.getElementById('top-menu-modal');
    if (modal) modal.style.display = 'none';
}

// ==================== GESTIONE OFFLINE ====================
function setupConnectionListeners() {
    const indicator = document.getElementById('offline-indicator');
    
    function updateStatus() {
        if (indicator) {
            indicator.style.display = navigator.onLine ? 'none' : 'block';
        }
    }
    
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    updateStatus();
}

// ==================== GESTIONE PWA ====================
function setupPWA() {
    if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('📱 App installata come PWA');
    }
    
    window.addEventListener('beforeinstallprompt', (e) => {
        window.deferredPrompt = e;
        showInstallBanner();
    });
}

function showInstallBanner() {
    const banner = document.getElementById('smart-install-banner');
    if (banner && window.deferredPrompt) {
        banner.style.display = 'flex';
    }
}

function installPWA() {
    if (window.deferredPrompt) {
        window.deferredPrompt.prompt();
        window.deferredPrompt.userChoice.then(choice => {
            if (choice.outcome === 'accepted') {
                showToast('App installata con successo!', 'success');
            }
            window.deferredPrompt = null;
        });
    }
    
    const banner = document.getElementById('smart-install-banner');
    if (banner) banner.style.display = 'none';
}

// ==================== GESTIONE MANUTENZIONE ====================
function checkMaintenanceMode() {
    const maintenance = localStorage.getItem('maintenance_mode');
    const element = document.getElementById('maintenance-mode');
    
    if (element) {
        element.style.display = maintenance === 'true' ? 'flex' : 'none';
    }
}

// ==================== ESPORTAZIONE DATI ====================
function exportPhilosophicalData() {
    try {
        const data = {
            filosofi: filosofiData,
            opere: opereData,
            concetti: concettiData,
            export_date: new Date().toISOString(),
            version: 'Aeterna Lexicon 3.1.0'
        };
        
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `dataset-filosofico-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('Dataset esportato con successo', 'success');
        
    } catch (error) {
        console.error('Errore esportazione:', error);
        showToast('Errore nell\'esportazione', 'error');
    }
}

// ==================== FUNZIONI GLOBALI ====================
window.showScreen = showScreen;
window.goBack = goBack;
window.toggleMenuModal = toggleMenuModal;
window.openCreditsScreen = openCreditsScreen;
window.openReportScreen = openReportScreen;
window.installPWA = installPWA;
window.exportPhilosophicalData = exportPhilosophicalData;

console.log('📚 Aeterna Lexicon App.js - Versione 3.1.0 - READY');