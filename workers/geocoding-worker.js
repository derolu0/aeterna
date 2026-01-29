/**
 * GEOCODING WORKER - workers/geocoding-worker.js
 * Worker per geocoding e gestione coordinate filosofiche
 * Versione 2.0.0 - Ottimizzato per GitHub Pages
 */

// ==================== INIZIALIZZAZIONE WORKER ====================
console.log('🌍 Geocoding Worker inizializzato per Aeterna Lexicon');

// Database interno di coordinate filosofiche
const PHILOSOPHER_COORDINATES = {
    // Filosofi Classici
    'Platone': { lat: 37.9838, lng: 23.7275, citta: 'Atene', paese: 'Grecia' },
    'Aristotele': { lat: 40.6331, lng: 22.9482, citta: 'Stagira', paese: 'Grecia' },
    'Socrate': { lat: 37.9838, lng: 23.7275, citta: 'Atene', paese: 'Grecia' },
    'Epicuro': { lat: 37.9838, lng: 23.7275, citta: 'Atene', paese: 'Grecia' },
    'Zenone di Cizio': { lat: 34.674, lng: 33.044, citta: 'Cizio', paese: 'Cipro' },
    
    // Filosofi Medievali
    'Tommaso d\'Aquino': { lat: 41.4828, lng: 15.5378, citta: 'Roccasecca', paese: 'Italia' },
    'Agostino d\'Ippona': { lat: 36.335, lng: 10.325, citta: 'Tagaste', paese: 'Algeria' },
    'Anselmo d\'Aosta': { lat: 45.7376, lng: 7.3172, citta: 'Aosta', paese: 'Italia' },
    
    // Filosofi Moderni
    'René Descartes': { lat: 47.2184, lng: -1.5536, citta: 'La Haye en Touraine', paese: 'Francia' },
    'Immanuel Kant': { lat: 54.7065, lng: 20.511, citta: 'Königsberg', paese: 'Prussia' },
    'John Locke': { lat: 51.7519, lng: -1.2578, citta: 'Wrington', paese: 'Inghilterra' },
    'David Hume': { lat: 55.9533, lng: -3.1883, citta: 'Edimburgo', paese: 'Scozia' },
    
    // Filosofi Contemporanei
    'Friedrich Nietzsche': { lat: 51.2372, lng: 12.0914, citta: 'Röcken', paese: 'Germania' },
    'Michel Foucault': { lat: 46.5802, lng: 0.3404, citta: 'Poitiers', paese: 'Francia' },
    'Martin Heidegger': { lat: 47.8667, lng: 8.8167, citta: 'Meßkirch', paese: 'Germania' },
    'Ludwig Wittgenstein': { lat: 48.2082, lng: 16.3738, citta: 'Vienna', paese: 'Austria' },
    'Jacques Derrida': { lat: 36.7538, lng: 3.0588, citta: 'El Biar', paese: 'Algeria' },
    'Gilles Deleuze': { lat: 48.8566, lng: 2.3522, citta: 'Parigi', paese: 'Francia' },
    'Félix Guattari': { lat: 48.8566, lng: 2.3522, citta: 'Parigi', paese: 'Francia' },
    'Giorgio Agamben': { lat: 41.9028, lng: 12.4964, citta: 'Roma', paese: 'Italia' },
    'Slavoj Žižek': { lat: 46.0569, lng: 14.5058, citta: 'Lubiana', paese: 'Slovenia' },
    'Judith Butler': { lat: 39.9526, lng: -75.1652, citta: 'Cleveland', paese: 'USA' }
};

// Cache per geocoding
const geocodingCache = new Map();

// Città importanti con coordinate
const IMPORTANT_CITIES = {
    'Atene': { lat: 37.9838, lng: 23.7275, paese: 'Grecia' },
    'Roma': { lat: 41.9028, lng: 12.4964, paese: 'Italia' },
    'Parigi': { lat: 48.8566, lng: 2.3522, paese: 'Francia' },
    'Berlino': { lat: 52.5200, lng: 13.4050, paese: 'Germania' },
    'Londra': { lat: 51.5074, lng: -0.1278, paese: 'Regno Unito' },
    'New York': { lat: 40.7128, lng: -74.0060, paese: 'USA' },
    'Tokyo': { lat: 35.6762, lng: 139.6503, paese: 'Giappone' },
    'Pechino': { lat: 39.9042, lng: 116.4074, paese: 'Cina' },
    'Mosca': { lat: 55.7558, lng: 37.6173, paese: 'Russia' },
    'Il Cairo': { lat: 30.0444, lng: 31.2357, paese: 'Egitto' }
};

// ==================== FUNZIONI PRINCIPALI ====================

/**
 * Geocoding principale - Trova coordinate per luogo/filosofo
 */
async function geocodeLocation(params) {
    const { citta, paese, filosofo } = params;
    
    console.log(`🌍 Geocoding richiesto per:`, { citta, paese, filosofo });
    
    // Genera chiave cache
    const cacheKey = `${citta}|${paese}|${filosofo}`;
    
    // Controlla cache
    if (geocodingCache.has(cacheKey)) {
        console.log('📦 Cache hit per:', cacheKey);
        return {
            ...geocodingCache.get(cacheKey),
            source: 'cache',
            cached: true
        };
    }
    
    try {
        let result;
        
        // 1. Priorità: Filosofo conosciuto
        if (filosofo && PHILOSOPHER_COORDINATES[filosofo]) {
            result = {
                ...PHILOSOPHER_COORDINATES[filosofo],
                source: 'philosopher_database',
                accuracy: 'high',
                filosofo: filosofo
            };
        }
        // 2. Città importante
        else if (citta && IMPORTANT_CITIES[citta]) {
            result = {
                ...IMPORTANT_CITIES[citta],
                citta: citta,
                source: 'important_cities',
                accuracy: 'medium'
            };
        }
        // 3. Geocoding con OpenStreetMap Nominatim (se online)
        else if (typeof fetch !== 'undefined' && (citta || paese)) {
            result = await geocodeWithNominatim(citta, paese, filosofo);
        }
        // 4. Fallback: Coordinate approssimative
        else {
            result = getApproximateCoordinates(citta, paese, filosofo);
        }
        
        // Salva in cache
        if (result && result.lat && result.lng) {
            geocodingCache.set(cacheKey, result);
            console.log('💾 Salvato in cache:', cacheKey);
        }
        
        return result;
        
    } catch (error) {
        console.error('❌ Errore geocoding:', error);
        return getFallbackCoordinates(citta, paese, filosofo);
    }
}

/**
 * Geocoding usando OpenStreetMap Nominatim
 */
async function geocodeWithNominatim(citta, paese, filosofo) {
    if (!citta && !paese) {
        throw new Error('Specificare città o paese per geocoding OSM');
    }
    
    const query = [];
    if (citta) query.push(citta);
    if (paese) query.push(paese);
    
    const searchQuery = query.join(', ');
    
    try {
        // Usa Nominatim con politeness (1 secondo di delay)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
            {
                headers: {
                    'User-Agent': 'AeternaLexiconPhilosophyApp/3.0.0 (https://derolu0.github.io/aeterna)',
                    'Accept': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            const result = data[0];
            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                citta: citta || result.address?.city || result.address?.town || result.address?.village,
                paese: paese || result.address?.country,
                display_name: result.display_name,
                source: 'openstreetmap',
                accuracy: 'high',
                importance: parseFloat(result.importance) || 0.5
            };
        } else {
            throw new Error('Nessun risultato trovato');
        }
        
    } catch (error) {
        console.warn('⚠️ Geocoding OSM fallito:', error.message);
        // Fallback a coordinate approssimative
        return getApproximateCoordinates(citta, paese, filosofo);
    }
}

/**
 * Coordinate approssimate basate su paese/regione
 */
function getApproximateCoordinates(citta, paese, filosofo) {
    const COUNTRY_COORDINATES = {
        'Italia': { lat: 41.8719, lng: 12.5674, citta: 'Roma', paese: 'Italia' },
        'Francia': { lat: 46.6034, lng: 1.8883, citta: 'Parigi', paese: 'Francia' },
        'Germania': { lat: 51.1657, lng: 10.4515, citta: 'Berlino', paese: 'Germania' },
        'Regno Unito': { lat: 55.3781, lng: -3.4360, citta: 'Londra', paese: 'Regno Unito' },
        'Spagna': { lat: 40.4637, lng: -3.7492, citta: 'Madrid', paese: 'Spagna' },
        'Grecia': { lat: 39.0742, lng: 21.8243, citta: 'Atene', paese: 'Grecia' },
        'USA': { lat: 37.0902, lng: -95.7129, citta: 'Washington DC', paese: 'USA' },
        'Cina': { lat: 35.8617, lng: 104.1954, citta: 'Pechino', paese: 'Cina' },
        'Giappone': { lat: 36.2048, lng: 138.2529, citta: 'Tokyo', paese: 'Giappone' }
    };
    
    if (paese && COUNTRY_COORDINATES[paese]) {
        return {
            ...COUNTRY_COORDINATES[paese],
            source: 'country_approximation',
            accuracy: 'low',
            note: `Coordinate approssimate per ${paese}`
        };
    }
    
    // Default: Parigi
    return {
        lat: 48.8566,
        lng: 2.3522,
        citta: 'Parigi',
        paese: 'Francia',
        source: 'default',
        accuracy: 'very_low',
        note: 'Coordinate di default (Parigi)'
    };
}

/**
 * Fallback ultima risorsa
 */
function getFallbackCoordinates(citta, paese, filosofo) {
    return {
        lat: 0,
        lng: 0,
        citta: citta || 'Sconosciuto',
        paese: paese || 'Sconosciuto',
        source: 'fallback',
        accuracy: 'unknown',
        error: 'Geocoding non disponibile',
        note: 'Coordinate non disponibili'
    };
}

/**
 * Ricerca luoghi per autocomplete
 */
async function searchPlaces(query) {
    if (!query || query.length < 2) {
        return [];
    }
    
    console.log(`🔍 Ricerca luoghi: "${query}"`);
    
    const results = [];
    const queryLower = query.toLowerCase();
    
    // 1. Cerca tra i filosofi
    Object.entries(PHILOSOPHER_COORDINATES).forEach(([filosofo, coord]) => {
        if (filosofo.toLowerCase().includes(queryLower)) {
            results.push({
                display_name: `${filosofo} - ${coord.citta}, ${coord.paese}`,
                lat: coord.lat,
                lng: coord.lng,
                type: 'filosofo',
                importance: 0.9,
                source: 'philosopher_database',
                filosofo: filosofo
            });
        }
    });
    
    // 2. Cerca tra città importanti
    Object.entries(IMPORTANT_CITIES).forEach(([citta, coord]) => {
        if (citta.toLowerCase().includes(queryLower)) {
            results.push({
                display_name: citta,
                lat: coord.lat,
                lng: coord.lng,
                type: 'city',
                importance: 0.7,
                source: 'important_cities',
                citta: citta,
                paese: coord.paese
            });
        }
    });
    
    // 3. Ricerca OSM online (solo se query abbastanza lunga)
    if (query.length >= 3 && typeof fetch !== 'undefined') {
        try {
            const osmResults = await searchWithNominatim(query);
            results.push(...osmResults);
        } catch (error) {
            console.warn('Ricerca OSM fallita:', error.message);
        }
    }
    
    // Ordina per importanza
    return results.sort((a, b) => b.importance - a.importance).slice(0, 10);
}

/**
 * Ricerca con Nominatim per autocomplete
 */
async function searchWithNominatim(query) {
    try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Delay per politeness
        
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
            {
                headers: {
                    'User-Agent': 'AeternaLexiconPhilosophyApp/3.0.0',
                    'Accept': 'application/json'
                }
            }
        );
        
        if (!response.ok) return [];
        
        const data = await response.json();
        
        return data.map(item => ({
            display_name: item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
            type: item.type || 'location',
            importance: parseFloat(item.importance) || 0.5,
            source: 'openstreetmap',
            address: item.address
        }));
        
    } catch (error) {
        console.warn('Nominatim search error:', error);
        return [];
    }
}

/**
 * Calcola distanza tra due coordinate (Haversine formula)
 */
function calculateDistance(coord1, coord2) {
    if (!isValidCoordinate(coord1) || !isValidCoordinate(coord2)) {
        throw new Error('Coordinate non valide per calcolo distanza');
    }
    
    const R = 6371; // Raggio terrestre in km
    const dLat = toRad(coord2.lat - coord1.lat);
    const dLon = toRad(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRad(coord1.lat)) * Math.cos(toRad(coord2.lat)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return {
        distance_km: parseFloat(distance.toFixed(2)),
        distance_m: Math.round(distance * 1000),
        formula: 'haversine',
        units: 'kilometers'
    };
}

/**
 * Trova filosofi vicini a una coordinata
 */
function findNearbyPhilosophers(centerCoord, radiusKm, filosofiList) {
    if (!isValidCoordinate(centerCoord)) {
        throw new Error('Coordinate centro non valide');
    }
    
    if (!Array.isArray(filosofiList)) {
        throw new Error('Lista filosofi non valida');
    }
    
    const nearby = [];
    
    filosofiList.forEach(filosofo => {
        if (!filosofo.luogo_nascita || !filosofo.luogo_nascita.coordinate) {
            return; // Salta filosofi senza coordinate
        }
        
        const filosofoCoord = filosofo.luogo_nascita.coordinate;
        
        if (!isValidCoordinate(filosofoCoord)) {
            return; // Salta coordinate non valide
        }
        
        try {
            const distance = calculateDistance(centerCoord, filosofoCoord);
            
            if (distance.distance_km <= radiusKm) {
                nearby.push({
                    filosofo: filosofo,
                    distance: distance,
                    coordinates: filosofoCoord
                });
            }
        } catch (error) {
            console.warn(`Errore calcolo distanza per ${filosofo.nome}:`, error.message);
        }
    });
    
    // Ordina per distanza
    nearby.sort((a, b) => a.distance.distance_km - b.distance.distance_km);
    
    return {
        center: centerCoord,
        radius_km: radiusKm,
        count: nearby.length,
        philosophers: nearby,
        timestamp: new Date().toISOString()
    };
}

/**
 * Ottiene statistiche della cache
 */
function getCacheStats() {
    return {
        size: geocodingCache.size,
        keys: Array.from(geocodingCache.keys()),
        hits: cacheHits,
        misses: cacheMisses,
        hit_rate: cacheHits / (cacheHits + cacheMisses) || 0,
        memory_estimate: geocodingCache.size * 100, // Approssimazione in bytes
        mode: 'memory_cache'
    };
}

/**
 * Pulisce la cache
 */
function clearCache() {
    const previousSize = geocodingCache.size;
    geocodingCache.clear();
    
    return {
        success: true,
        cleared_entries: previousSize,
        new_size: 0,
        timestamp: new Date().toISOString()
    };
}

// ==================== FUNZIONI UTILITY ====================

function isValidCoordinate(coord) {
    return coord &&
           typeof coord.lat === 'number' &&
           typeof coord.lng === 'number' &&
           !isNaN(coord.lat) && !isNaN(coord.lng) &&
           coord.lat >= -90 && coord.lat <= 90 &&
           coord.lng >= -180 && coord.lng <= 180;
}

function toRad(degrees) {
    return degrees * Math.PI / 180;
}

function toDeg(radians) {
    return radians * 180 / Math.PI;
}

// Statistiche cache
let cacheHits = 0;
let cacheMisses = 0;

// ==================== GESTIONE MESSAGGI WORKER ====================

self.addEventListener('message', async function(event) {
    const { id, type, data } = event.data;
    
    console.log(`📨 Worker ricevuto messaggio: ${type}`, data ? '(con dati)' : '');
    
    try {
        let response;
        
        switch(type) {
            case 'GEOCODE':
                cacheMisses++;
                response = await geocodeLocation(data);
                break;
                
            case 'SEARCH_PLACES':
                response = await searchPlaces(data);
                break;
                
            case 'CALCULATE_DISTANCE':
                response = calculateDistance(data.coord1, data.coord2);
                break;
                
            case 'FIND_NEARBY_PHILOSOPHERS':
                response = findNearbyPhilosophers(data.coord, data.radiusKm, data.filosofi);
                break;
                
            case 'GET_CACHE_STATS':
                response = getCacheStats();
                break;
                
            case 'CLEAR_CACHE':
                response = clearCache();
                break;
                
            case 'PING':
                response = { 
                    status: 'alive', 
                    timestamp: new Date().toISOString(),
                    version: '2.0.0',
                    service: 'philosophy_geocoding' 
                };
                break;
                
            default:
                throw new Error(`Tipo messaggio non supportato: ${type}`);
        }
        
        // Invia risposta
        self.postMessage({
            id,
            type,
            success: true,
            data: response
        });
        
    } catch (error) {
        console.error(`❌ Errore elaborazione ${type}:`, error);
        
        // Invia errore
        self.postMessage({
            id,
            type,
            success: false,
            error: error.message,
            stack: error.stack
        });
    }
});

// Notifica che il worker è pronto
self.postMessage({
    type: 'WORKER_READY',
    data: {
        service: 'geocoding',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        features: [
            'geocoding',
            'place_search',
            'distance_calculation',
            'philosopher_proximity',
            'caching'
        ]
    }
});

console.log('✅ Geocoding Worker pronto - Database filosofico caricato');