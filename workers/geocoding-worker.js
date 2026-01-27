// ============================================
// GEOCODING WORKER - Aeterna Lexicon in Motu
// ============================================
// Worker dedicato alla geocodifica e gestione coordinate
// Lavora in background per non bloccare l'interfaccia utente
// ============================================

// Cache locale per coordinate già risolte
const coordinateCache = new Map();

// Provider di geocoding disponibili (in ordine di priorità)
const GEOCODING_PROVIDERS = {
    NOMINATIM: 'nominatim',
    PHOTON: 'photon',
    GOOGLE: 'google',
    MAPQUEST: 'mapquest',
    FALLBACK: 'fallback'
};

// Configurazione provider
const PROVIDER_CONFIG = {
    [GEOCODING_PROVIDERS.NOMINATIM]: {
        url: 'https://nominatim.openstreetmap.org/search',
        params: {
            format: 'json',
            limit: 1,
            addressdetails: 1,
            'accept-language': 'it'
        },
        headers: {
            'User-Agent': 'AeternaLexicon/2.0 (https://derolu0.github.io/aeterna/)'
        },
        rateLimit: 1000 // 1 secondo tra le richieste
    },
    [GEOCODING_PROVIDERS.PHOTON]: {
        url: 'https://photon.komoot.io/api',
        params: {
            limit: 1,
            lang: 'it'
        }
    },
    [GEOCODING_PROVIDERS.MAPQUEST]: {
        url: 'https://www.mapquestapi.com/geocoding/v1/address',
        params: {
            key: '', // Da configurare se necessario
            maxResults: 1
        }
    }
};

// Database locale di coordinate filosofiche (fallback offline)
const COORDINATE_FILOSOFICHE = {
    // Filosofi Classici
    'Platone': { lat: 37.9838, lng: 23.7275, citta: 'Atene', paese: 'Grecia' },
    'Aristotele': { lat: 40.6331, lng: 22.9482, citta: 'Stagira', paese: 'Grecia' },
    'Socrate': { lat: 37.9838, lng: 23.7275, citta: 'Atene', paese: 'Grecia' },
    'Epicuro': { lat: 37.9838, lng: 23.7275, citta: 'Atene', paese: 'Grecia' },
    'Zenone di Cizio': { lat: 34.7672, lng: 32.4167, citta: 'Cizio', paese: 'Cipro' },
    'Plotino': { lat: 26.8206, lng: 30.8025, citta: 'Licopoli', paese: 'Egitto' },
    
    // Filosofi Medievali
    'Tommaso d\'Aquino': { lat: 41.4664, lng: 12.8958, citta: 'Roccasecca', paese: 'Italia' },
    'Sant\'Agostino': { lat: 36.462, lng: 10.333, citta: 'Tagaste', paese: 'Algeria' },
    'Anselmo d\'Aosta': { lat: 45.7376, lng: 7.3172, citta: 'Aosta', paese: 'Italia' },
    
    // Filosofi Moderni
    'René Descartes': { lat: 47.2184, lng: -1.5536, citta: 'La Haye en Touraine', paese: 'Francia' },
    'Immanuel Kant': { lat: 54.7065, lng: 20.511, citta: 'Königsberg', paese: 'Prussia' },
    'John Locke': { lat: 51.7519, lng: -1.2578, citta: 'Wrington', paese: 'Inghilterra' },
    'David Hume': { lat: 55.9533, lng: -3.1883, citta: 'Edimburgo', paese: 'Scozia' },
    
    // Filosofi Contemporanei
    'Friedrich Nietzsche': { lat: 51.2372, lng: 12.0914, citta: 'Röcken', paese: 'Germania' },
    'Martin Heidegger': { lat: 47.8667, lng: 8.8167, citta: 'Meßkirch', paese: 'Germania' },
    'Michel Foucault': { lat: 46.5802, lng: 0.3404, citta: 'Poitiers', paese: 'Francia' },
    'Jean-Paul Sartre': { lat: 48.8566, lng: 2.3522, citta: 'Parigi', paese: 'Francia' },
    'Simone de Beauvoir': { lat: 48.8566, lng: 2.3522, citta: 'Parigi', paese: 'Francia' },
    'Hannah Arendt': { lat: 52.5200, lng: 13.4050, citta: 'Linden', paese: 'Germania' },
    'Jürgen Habermas': { lat: 51.4556, lng: 7.0116, citta: 'Düsseldorf', paese: 'Germania' }
};

// Città importanti per il fallback
const CITTA_IMPORTANTI = {
    'Atene': { lat: 37.9838, lng: 23.7275, paese: 'Grecia' },
    'Roma': { lat: 41.9028, lng: 12.4964, paese: 'Italia' },
    'Parigi': { lat: 48.8566, lng: 2.3522, paese: 'Francia' },
    'Berlino': { lat: 52.5200, lng: 13.4050, paese: 'Germania' },
    'Londra': { lat: 51.5074, lng: -0.1278, paese: 'Inghilterra' },
    'New York': { lat: 40.7128, lng: -74.0060, paese: 'USA' },
    'Tokyo': { lat: 35.6762, lng: 139.6503, paese: 'Giappone' },
    'Pechino': { lat: 39.9042, lng: 116.4074, paese: 'Cina' },
    'Mosca': { lat: 55.7558, lng: 37.6173, paese: 'Russia' },
    'Il Cairo': { lat: 30.0444, lng: 31.2357, paese: 'Egitto' }
};

// Ultima richiesta timestamp (per rate limiting)
let lastRequestTime = 0;

// ============================================
// FUNZIONI PRINCIPALI
// ============================================

/**
 * Cerca coordinate per un luogo (città + paese)
 * @param {Object} params - { citta: string, paese: string, filosofo: string }
 * @returns {Promise<Object>} Coordinate trovate
 */
async function cercaCoordinate(params) {
    const { citta, paese, filosofo } = params;
    
    // 1. Crea chiave cache
    const cacheKey = `${citta}_${paese}_${filosofo || ''}`.toLowerCase().trim();
    
    // 2. Controlla cache
    if (coordinateCache.has(cacheKey)) {
        return coordinateCache.get(cacheKey);
    }
    
    // 3. Se offline, usa fallback immediato
    if (!navigator.onLine) {
        return getFallbackCoordinate(citta, paese, filosofo);
    }
    
    // 4. Costruisci query di ricerca
    const query = buildSearchQuery(citta, paese, filosofo);
    
    // 5. Prova i provider in ordine
    let coordinate = null;
    
    for (const provider of [GEOCODING_PROVIDERS.NOMINATIM, GEOCODING_PROVIDERS.PHOTON]) {
        try {
            coordinate = await queryGeocodingProvider(provider, query);
            if (coordinate && isValidCoordinate(coordinate)) {
                break;
            }
        } catch (error) {
            console.warn(`Provider ${provider} fallito:`, error.message);
            continue;
        }
    }
    
    // 6. Se nessun provider ha funzionato, usa fallback
    if (!coordinate || !isValidCoordinate(coordinate)) {
        coordinate = getFallbackCoordinate(citta, paese, filosofo);
    }
    
    // 7. Salva in cache (solo memoria)
    if (coordinate && isValidCoordinate(coordinate)) {
        coordinateCache.set(cacheKey, coordinate);
        saveToLocalStorage(cacheKey, coordinate);
    }
    
    return coordinate;
}

/**
 * Cerca luoghi basati su query testuale
 * @param {string} query - Testo da cercare
 * @returns {Promise<Array>} Lista di risultati
 */
async function searchPlaces(query) {
    if (!query || query.length < 2) {
        return [];
    }
    
    // 1. Controlla cache
    const cacheKey = `search_${query}`.toLowerCase();
    if (coordinateCache.has(cacheKey)) {
        return coordinateCache.get(cacheKey);
    }
    
    // 2. Se offline, cerca nel database locale
    if (!navigator.onLine) {
        return searchLocalDatabase(query);
    }
    
    // 3. Rate limiting
    await enforceRateLimit();
    
    try {
        const config = PROVIDER_CONFIG[GEOCODING_PROVIDERS.NOMINATIM];
        const searchParams = new URLSearchParams({
            ...config.params,
            q: query,
            limit: 5 // Più risultati per l'autocomplete
        });
        
        const response = await fetch(`${config.url}?${searchParams}`, {
            headers: config.headers
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        // 4. Normalizza risultati
        const results = data.map(item => ({
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: item.type,
            importance: item.importance,
            address: item.address
        })).sort((a, b) => b.importance - a.importance);
        
        // 5. Salva in cache
        coordinateCache.set(cacheKey, results);
        
        return results;
        
    } catch (error) {
        console.error('Errore ricerca luoghi:', error);
        return searchLocalDatabase(query);
    }
}

/**
 * Calcola distanza tra due coordinate (formula di Haversine)
 * @param {Object} coord1 - { lat: number, lng: number }
 * @param {Object} coord2 - { lat: number, lng: number }
 * @returns {number} Distanza in chilometri
 */
function calcolaDistanza(coord1, coord2) {
    if (!coord1 || !coord2 || !isValidCoordinate(coord1) || !isValidCoordinate(coord2)) {
        return null;
    }
    
    const R = 6371; // Raggio terrestre in km
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Trova filosofi vicini a una coordinata
 * @param {Object} coord - Coordinate centrale
 * @param {number} radiusKm - Raggio in km
 * @param {Array} filosofi - Lista filosofi
 * @returns {Array} Filosofi nel raggio
 */
function trovaFilosofiVicini(coord, radiusKm, filosofi) {
    if (!coord || !filosofi || !Array.isArray(filosofi)) {
        return [];
    }
    
    return filosofi.filter(filosofo => {
        if (!filosofo.luogo_nascita || !filosofo.luogo_nascita.coordinate) {
            return false;
        }
        
        const distanza = calcolaDistanza(coord, filosofo.luogo_nascita.coordinate);
        return distanza !== null && distanza <= radiusKm;
    }).sort((a, b) => {
        const distA = calcolaDistanza(coord, a.luogo_nascita.coordinate);
        const distB = calcolaDistanza(coord, b.luogo_nascita.coordinate);
        return distA - distB;
    });
}

// ============================================
// FUNZIONI AUSILIARIE
// ============================================

/**
 * Interroga un provider di geocoding
 */
async function queryGeocodingProvider(provider, query) {
    const config = PROVIDER_CONFIG[provider];
    if (!config) {
        throw new Error(`Provider ${provider} non configurato`);
    }
    
    // Rate limiting
    await enforceRateLimit();
    
    const searchParams = new URLSearchParams({
        ...config.params,
        q: query
    });
    
    const response = await fetch(`${config.url}?${searchParams}`, {
        headers: config.headers || {}
    });
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Normalizza risposta in base al provider
    switch (provider) {
        case GEOCODING_PROVIDERS.NOMINATIM:
            if (data && data.length > 0) {
                return {
                    lat: parseFloat(data[0].lat),
                    lng: parseFloat(data[0].lon),
                    display_name: data[0].display_name,
                    type: data[0].type,
                    address: data[0].address
                };
            }
            break;
            
        case GEOCODING_PROVIDERS.PHOTON:
            if (data && data.features && data.features.length > 0) {
                const feature = data.features[0];
                return {
                    lat: feature.geometry.coordinates[1],
                    lng: feature.geometry.coordinates[0],
                    display_name: feature.properties.name,
                    type: feature.properties.osm_type,
                    address: feature.properties
                };
            }
            break;
            
        case GEOCODING_PROVIDERS.MAPQUEST:
            if (data && data.results && data.results.length > 0) {
                const location = data.results[0].locations[0];
                return {
                    lat: location.latLng.lat,
                    lng: location.latLng.lng,
                    display_name: location.street || location.adminArea5 || location.adminArea1,
                    type: 'address'
                };
            }
            break;
    }
    
    return null;
}

/**
 * Costruisce query di ricerca ottimizzata
 */
function buildSearchQuery(citta, paese, filosofo) {
    let query = '';
    
    // Se abbiamo il filosofo, cerca luogo di nascita specifico
    if (filosofo && COORDINATE_FILOSOFICHE[filosofo]) {
        const luogo = COORDINATE_FILOSOFICHE[filosofo];
        query = `${luogo.citta}, ${luogo.paese}`;
    }
    // Altrimenti usa città e paese
    else if (citta && paese) {
        query = `${citta}, ${paese}`;
    }
    else if (citta) {
        query = citta;
    }
    else if (paese) {
        query = paese;
    }
    
    // Aggiunge contesto per migliorare accuratezza
    if (filosofo && !COORDINATE_FILOSOFICHE[filosofo]) {
        query += ` luogo di nascita ${filosofo}`;
    }
    
    return query.trim();
}

/**
 * Coordinate di fallback quando tutto il resto fallisce
 */
function getFallbackCoordinate(citta, paese, filosofo) {
    // 1. Cerca nel database filosofi
    if (filosofo && COORDINATE_FILOSOFICHE[filosofo]) {
        return {
            ...COORDINATE_FILOSOFICHE[filosofo],
            source: 'database_filosofi',
            accuracy: 'high'
        };
    }
    
    // 2. Cerca nella città importanti
    if (citta && CITTA_IMPORTANTI[citta]) {
        return {
            ...CITTA_IMPORTANTI[citta],
            source: 'database_citta',
            accuracy: 'medium'
        };
    }
    
    // 3. Cerca per paese (coordinate capitali)
    const capitali = {
        'Italia': { lat: 41.9028, lng: 12.4964, citta: 'Roma' },
        'Francia': { lat: 48.8566, lng: 2.3522, citta: 'Parigi' },
        'Germania': { lat: 52.5200, lng: 13.4050, citta: 'Berlino' },
        'Regno Unito': { lat: 51.5074, lng: -0.1278, citta: 'Londra' },
        'Spagna': { lat: 40.4168, lng: -3.7038, citta: 'Madrid' },
        'Grecia': { lat: 37.9838, lng: 23.7275, citta: 'Atene' },
        'USA': { lat: 38.9072, lng: -77.0369, citta: 'Washington' },
        'Cina': { lat: 39.9042, lng: 116.4074, citta: 'Pechino' },
        'Giappone': { lat: 35.6762, lng: 139.6503, citta: 'Tokyo' },
        'Russia': { lat: 55.7558, lng: 37.6173, citta: 'Mosca' }
    };
    
    if (paese && capitali[paese]) {
        return {
            ...capitali[paese],
            source: 'database_capitali',
            accuracy: 'low'
        };
    }
    
    // 4. Fallback generico (centro Europa)
    return {
        lat: 48.8566,
        lng: 2.3522,
        citta: 'Parigi',
        paese: 'Francia',
        source: 'fallback_generico',
        accuracy: 'very_low'
    };
}

/**
 * Cerca nel database locale (offline)
 */
function searchLocalDatabase(query) {
    const risultati = [];
    const queryLower = query.toLowerCase();
    
    // Cerca tra i filosofi
    Object.entries(COORDINATE_FILOSOFICHE).forEach(([nome, coord]) => {
        if (nome.toLowerCase().includes(queryLower)) {
            risultati.push({
                display_name: `${nome} - ${coord.citta}, ${coord.paese}`,
                lat: coord.lat,
                lng: coord.lng,
                type: 'filosofo',
                importance: 0.9,
                source: 'local_database'
            });
        }
    });
    
    // Cerca tra le città importanti
    Object.entries(CITTA_IMPORTANTI).forEach(([citta, coord]) => {
        if (citta.toLowerCase().includes(queryLower)) {
            risultati.push({
                display_name: `${citta}, ${coord.paese}`,
                lat: coord.lat,
                lng: coord.lng,
                type: 'city',
                importance: 0.7,
                source: 'local_database'
            });
        }
    });
    
    return risultati.sort((a, b) => b.importance - a.importance);
}

/**
 * Rate limiting per non sovraccaricare i server
 */
function enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const minDelay = PROVIDER_CONFIG[GEOCODING_PROVIDERS.NOMINATIM]?.rateLimit || 1000;
    
    if (timeSinceLastRequest < minDelay) {
        return new Promise(resolve => {
            setTimeout(resolve, minDelay - timeSinceLastRequest);
        });
    }
    
    lastRequestTime = now;
    return Promise.resolve();
}

/**
 * Valida coordinate
 */
function isValidCoordinate(coord) {
    return coord &&
           typeof coord.lat === 'number' &&
           typeof coord.lng === 'number' &&
           !isNaN(coord.lat) &&
           !isNaN(coord.lng) &&
           coord.lat >= -90 && coord.lat <= 90 &&
           coord.lng >= -180 && coord.lng <= 180;
}

/**
 * Converti gradi in radianti
 */
function toRad(degrees) {
    return degrees * Math.PI / 180;
}

/**
 * Salva in localStorage (DISABILITATO PER WORKER)
 */
function saveToLocalStorage(key, data) {
    // I Web Worker non possono accedere a localStorage.
    // La cache rimarrà solo in memoria (coordinateCache) per questa sessione.
    return; 
}

/**
 * Carica cache da localStorage (DISABILITATO PER WORKER)
 */
function loadCacheFromStorage() {
    // I Web Worker non possono accedere a localStorage.
    return;
}

// ============================================
// GESTIONE MESSAGGI DEL WORKER
// ============================================

self.addEventListener('message', async function(event) {
    const { id, type, data } = event.data;
    
    try {
        let result;
        
        switch (type) {
            case 'GEOCODE':
                result = await cercaCoordinate(data);
                break;
                
            case 'SEARCH_PLACES':
                result = await searchPlaces(data);
                break;
                
            case 'CALCULATE_DISTANCE':
                result = calcolaDistanza(data.coord1, data.coord2);
                break;
                
            case 'FIND_NEARBY_PHILOSOPHERS':
                result = trovaFilosofiVicini(data.coord, data.radiusKm, data.filosofi);
                break;
                
            case 'GET_CACHED_COORDINATES':
                const cacheKey = `${data.citta}_${data.paese}_${data.filosofo || ''}`.toLowerCase().trim();
                result = coordinateCache.get(cacheKey) || null;
                break;
                
            case 'CLEAR_CACHE':
                coordinateCache.clear();
                // LocalStorage rimosso per compatibilità worker
                // localStorage.removeItem('geocoding_cache'); 
                result = { success: true };
                break;
                
            case 'GET_CACHE_STATS':
                result = {
                    size: coordinateCache.size,
                    keys: Array.from(coordinateCache.keys())
                };
                break;
                
            case 'PING':
                result = { status: 'alive', timestamp: Date.now() };
                break;
                
            default:
                throw new Error(`Tipo di messaggio non supportato: ${type}`);
        }
        
        self.postMessage({
            id,
            type: `${type}_RESPONSE`,
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error(`Errore worker geocoding (${type}):`, error);
        
        self.postMessage({
            id,
            type: `${type}_ERROR`,
            success: false,
            error: error.message
        });
    }
});

// ============================================
// INIZIALIZZAZIONE
// ============================================

// Carica cache all'avvio (DISABILITATO)
// loadCacheFromStorage(); 

// Notifica che il worker è pronto
self.postMessage({
    type: 'WORKER_READY',
    timestamp: Date.now(),
    version: '2.0.0'
});

console.log('✅ Worker geocoding inizializzato per Aeterna Lexicon');