/**
 * GEOCODING-MANAGER.JS - Versione Semplificata
 * Gestore coordinate filosofiche per Aeterna Lexicon
 * Versione 3.1.0 - Allineato con nuova app
 */

class GeocodingManager {
    constructor() {
        console.log('🌍 Geocoding Manager filosofico inizializzato');
        this.cache = new Map();
        this.useWorker = typeof Worker !== 'undefined';
        this.worker = null;
        
        // Database filosofico integrato
        this.philosopherCoordinates = this.createPhilosopherDatabase();
        
        // Inizializza se necessario
        this.init();
    }
    
    /**
     * Database coordinate filosofi (aggiornato)
     */
    createPhilosopherDatabase() {
        return {
            // FILOSOFI CLASSICI
            'Platone': { lat: 37.9838, lng: 23.7275, citta: 'Atene', paese: 'Grecia', periodo: 'classico' },
            'Aristotele': { lat: 40.6331, lng: 22.9482, citta: 'Stagira', paese: 'Grecia', periodo: 'classico' },
            'Socrate': { lat: 37.9838, lng: 23.7275, citta: 'Atene', paese: 'Grecia', periodo: 'classico' },
            'Epicuro': { lat: 37.9838, lng: 23.7275, citta: 'Atene', paese: 'Grecia', periodo: 'classico' },
            
            // FILOSOFI MODERNI
            'René Descartes': { lat: 47.2184, lng: -1.5536, citta: 'La Haye', paese: 'Francia', periodo: 'moderno' },
            'Immanuel Kant': { lat: 54.7065, lng: 20.511, citta: 'Königsberg', paese: 'Prussia', periodo: 'moderno' },
            'John Locke': { lat: 51.7519, lng: -1.2578, citta: 'Wrington', paese: 'Inghilterra', periodo: 'moderno' },
            
            // FILOSOFI CONTEMPORANEI
            'Friedrich Nietzsche': { lat: 51.2372, lng: 12.0914, citta: 'Röcken', paese: 'Germania', periodo: 'contemporaneo' },
            'Michel Foucault': { lat: 46.5802, lng: 0.3404, citta: 'Poitiers', paese: 'Francia', periodo: 'contemporaneo' },
            'Martin Heidegger': { lat: 47.8667, lng: 8.8167, citta: 'Meßkirch', paese: 'Germania', periodo: 'contemporaneo' },
            'Ludwig Wittgenstein': { lat: 48.2082, lng: 16.3738, citta: 'Vienna', paese: 'Austria', periodo: 'contemporaneo' },
            'Jacques Derrida': { lat: 36.7538, lng: 3.0588, citta: 'El Biar', paese: 'Algeria', periodo: 'contemporaneo' },
            'Gilles Deleuze': { lat: 48.8566, lng: 2.3522, citta: 'Parigi', paese: 'Francia', periodo: 'contemporaneo' },
            'Giorgio Agamben': { lat: 41.9028, lng: 12.4964, citta: 'Roma', paese: 'Italia', periodo: 'contemporaneo' },
            'Slavoj Žižek': { lat: 46.0569, lng: 14.5058, citta: 'Lubiana', paese: 'Slovenia', periodo: 'contemporaneo' },
            'Judith Butler': { lat: 39.9526, lng: -75.1652, citta: 'Cleveland', paese: 'USA', periodo: 'contemporaneo' }
        };
    }
    
    /**
     * Inizializzazione
     */
    async init() {
        try {
            if (this.useWorker) {
                await this.initWorker();
            }
            console.log('✅ Geocoding Manager pronto');
        } catch (error) {
            console.warn('⚠️ Geocoding Worker non disponibile, usando modalità sincrona:', error.message);
        }
    }
    
    /**
     * Inizializza worker se disponibile
     */
    async initWorker() {
        return new Promise((resolve, reject) => {
            try {
                this.worker = new Worker('./workers/geocoding-worker.js');
                
                this.worker.onmessage = (event) => {
                    if (event.data.type === 'WORKER_READY') {
                        console.log('✅ Geocoding Worker pronto');
                        resolve();
                    }
                };
                
                this.worker.onerror = (error) => {
                    console.error('❌ Errore worker geocoding:', error);
                    this.useWorker = false;
                    reject(error);
                };
                
                // Timeout sicurezza
                setTimeout(() => {
                    if (this.useWorker) {
                        console.warn('⚠️ Timeout inizializzazione worker');
                        this.useWorker = false;
                        resolve();
                    }
                }, 5000);
                
            } catch (error) {
                this.useWorker = false;
                reject(error);
            }
        });
    }
    
    /**
     * PRINCIPALE: Trova coordinate per filosofo/luogo
     */
    async getCoordinates(filosofo = null, citta = null, paese = null) {
        // Genera chiave cache
        const cacheKey = `${filosofo || ''}|${citta || ''}|${paese || ''}`;
        
        // Controlla cache
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }
        
        try {
            let result;
            
            // 1. PRIORITÀ: Filosofo conosciuto
            if (filosofo && this.philosopherCoordinates[filosofo]) {
                result = {
                    ...this.philosopherCoordinates[filosofo],
                    source: 'philosopher_database',
                    accuracy: 'high'
                };
            }
            // 2. Usa worker se disponibile
            else if (this.useWorker && this.worker) {
                result = await this.requestWorker('GEOCODE', { filosofo, citta, paese });
            }
            // 3. Modalità sincrona
            else {
                result = await this.geocodeSync(citta, paese, filosofo);
            }
            
            // Salva in cache
            if (result && this.isValidCoordinate(result)) {
                this.cache.set(cacheKey, result);
                
                // Limita cache a 100 elementi
                if (this.cache.size > 100) {
                    const firstKey = this.cache.keys().next().value;
                    this.cache.delete(firstKey);
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Errore geocoding:', error);
            return this.getFallbackCoordinates(citta, paese, filosofo);
        }
    }
    
    /**
     * Richiesta al worker
     */
    requestWorker(type, data) {
        return new Promise((resolve, reject) => {
            if (!this.worker) {
                reject(new Error('Worker non disponibile'));
                return;
            }
            
            const id = Date.now();
            
            const handler = (event) => {
                if (event.data.id === id) {
                    this.worker.removeEventListener('message', handler);
                    
                    if (event.data.success) {
                        resolve(event.data.data);
                    } else {
                        reject(new Error(event.data.error));
                    }
                }
            };
            
            this.worker.addEventListener('message', handler);
            this.worker.postMessage({ id, type, data });
            
            // Timeout
            setTimeout(() => {
                this.worker.removeEventListener('message', handler);
                reject(new Error('Timeout worker'));
            }, 10000);
        });
    }
    
    /**
     * Geocoding sincrono (fallback)
     */
    async geocodeSync(citta, paese, filosofo) {
        // Città importanti per filosofia
        const importantCities = {
            'Atene': { lat: 37.9838, lng: 23.7275, paese: 'Grecia' },
            'Roma': { lat: 41.9028, lng: 12.4964, paese: 'Italia' },
            'Parigi': { lat: 48.8566, lng: 2.3522, paese: 'Francia' },
            'Berlino': { lat: 52.5200, lng: 13.4050, paese: 'Germania' },
            'Londra': { lat: 51.5074, lng: -0.1278, paese: 'Regno Unito' },
            'Firenze': { lat: 43.7696, lng: 11.2558, paese: 'Italia' },
            'Vienna': { lat: 48.2082, lng: 16.3738, paese: 'Austria' }
        };
        
        // Prova città importante
        if (citta && importantCities[citta]) {
            return {
                ...importantCities[citta],
                citta: citta,
                source: 'important_city',
                accuracy: 'medium'
            };
        }
        
        // Prova OpenStreetMap (solo se online)
        if (typeof fetch !== 'undefined' && navigator.onLine && (citta || paese)) {
            try {
                return await this.geocodeWithOSM(citta, paese);
            } catch (error) {
                console.warn('OSM fallito:', error.message);
            }
        }
        
        // Fallback a coordinate approssimate
        return this.getApproximateCoordinates(citta, paese);
    }
    
    /**
     * Geocoding con OpenStreetMap
     */
    async geocodeWithOSM(citta, paese) {
        const query = [];
        if (citta) query.push(citta);
        if (paese) query.push(paese);
        
        if (query.length === 0) {
            throw new Error('Nessun luogo specificato');
        }
        
        // Delay per politeness OSM
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.join(', '))}&limit=1`,
            {
                headers: {
                    'User-Agent': 'AeternaLexicon/3.1.0 (Project Work Filosofico)',
                    'Accept': 'application/json'
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon),
                citta: citta || data[0].address?.city || data[0].address?.town,
                paese: paese || data[0].address?.country,
                display_name: data[0].display_name,
                source: 'openstreetmap',
                accuracy: 'high'
            };
        }
        
        throw new Error('Luogo non trovato');
    }
    
    /**
     * Coordinate approssimate
     */
    getApproximateCoordinates(citta, paese) {
        // Coordinate per paese
        const countryCoords = {
            'Italia': { lat: 41.8719, lng: 12.5674, citta: 'Roma', paese: 'Italia' },
            'Francia': { lat: 46.6034, lng: 1.8883, citta: 'Parigi', paese: 'Francia' },
            'Germania': { lat: 51.1657, lng: 10.4515, citta: 'Berlino', paese: 'Germania' },
            'Grecia': { lat: 39.0742, lng: 21.8243, citta: 'Atene', paese: 'Grecia' },
            'Regno Unito': { lat: 55.3781, lng: -3.4360, citta: 'Londra', paese: 'Regno Unito' },
            'Spagna': { lat: 40.4637, lng: -3.7492, citta: 'Madrid', paese: 'Spagna' },
            'USA': { lat: 37.0902, lng: -95.7129, citta: 'Washington', paese: 'USA' }
        };
        
        if (paese && countryCoords[paese]) {
            return {
                ...countryCoords[paese],
                source: 'country_approximation',
                accuracy: 'low',
                note: `Coordinate approssimate per ${paese}`
            };
        }
        
        // Default: Centro Europa
        return {
            lat: 46.6034,
            lng: 1.8883,
            citta: citta || 'Europa Centrale',
            paese: paese || 'Europa',
            source: 'default',
            accuracy: 'very_low',
            note: 'Coordinate di default'
        };
    }
    
    /**
     * Fallback ultima risorsa
     */
    getFallbackCoordinates(citta, paese, filosofo) {
        return {
            lat: 0,
            lng: 0,
            citta: citta || 'Sconosciuto',
            paese: paese || 'Sconosciuto',
            source: 'fallback',
            accuracy: 'unknown',
            error: true,
            message: 'Coordinate non disponibili'
        };
    }
    
    /**
     * Cerca luoghi per autocomplete
     */
    async searchPlaces(query) {
        if (!query || query.length < 2) {
            return [];
        }
        
        const results = [];
        const queryLower = query.toLowerCase();
        
        // 1. Cerca filosofi
        Object.entries(this.philosopherCoordinates).forEach(([nome, coord]) => {
            if (nome.toLowerCase().includes(queryLower)) {
                results.push({
                    type: 'filosofo',
                    name: nome,
                    display: `${nome} - ${coord.citta}, ${coord.paese}`,
                    coordinates: { lat: coord.lat, lng: coord.lng },
                    periodo: coord.periodo,
                    importance: 0.9
                });
            }
        });
        
        // 2. Cerca città importanti
        const importantCities = ['Atene', 'Roma', 'Parigi', 'Berlino', 'Londra', 'Firenze', 'Vienna'];
        importantCities.forEach(citta => {
            if (citta.toLowerCase().includes(queryLower)) {
                results.push({
                    type: 'citta',
                    name: citta,
                    display: citta,
                    coordinates: this.getApproximateCoordinates(citta).coordinates,
                    importance: 0.7
                });
            }
        });
        
        // 3. Ricerca OSM (solo se query lunga e online)
        if (query.length >= 3 && typeof fetch !== 'undefined' && navigator.onLine) {
            try {
                const osmResults = await this.searchOSM(query);
                results.push(...osmResults);
            } catch (error) {
                console.warn('Ricerca OSM fallita:', error.message);
            }
        }
        
        // Ordina per importanza e limita
        return results
            .sort((a, b) => b.importance - a.importance)
            .slice(0, 10);
    }
    
    /**
     * Ricerca OSM
     */
    async searchOSM(query) {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
                {
                    headers: {
                        'User-Agent': 'AeternaLexicon/3.1.0',
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (!response.ok) return [];
            
            const data = await response.json();
            
            return data.map(item => ({
                type: 'location',
                name: item.display_name,
                display: item.display_name,
                coordinates: { lat: parseFloat(item.lat), lng: parseFloat(item.lon) },
                importance: parseFloat(item.importance) || 0.5,
                source: 'openstreetmap'
            }));
            
        } catch (error) {
            return [];
        }
    }
    
    /**
     * Calcola distanza tra due punti
     */
    calculateDistance(coord1, coord2) {
        if (!this.isValidCoordinate(coord1) || !this.isValidCoordinate(coord2)) {
            throw new Error('Coordinate non valide');
        }
        
        const R = 6371; // Raggio terrestre km
        const dLat = this.toRad(coord2.lat - coord1.lat);
        const dLon = this.toRad(coord2.lng - coord1.lng);
        
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;
        
        return {
            kilometers: parseFloat(distance.toFixed(2)),
            meters: Math.round(distance * 1000),
            formula: 'haversine'
        };
    }
    
    /**
     * Trova filosofi vicini
     */
    findNearbyPhilosophers(center, radiusKm, filosofiList) {
        if (!this.isValidCoordinate(center)) {
            throw new Error('Coordinate centro non valide');
        }
        
        if (!Array.isArray(filosofiList)) {
            throw new Error('Lista filosofi non valida');
        }
        
        const nearby = [];
        
        filosofiList.forEach(filosofo => {
            if (!filosofo.luogo_nascita?.coordinate) return;
            
            const coord = filosofo.luogo_nascita.coordinate;
            if (!this.isValidCoordinate(coord)) return;
            
            try {
                const distance = this.calculateDistance(center, coord);
                
                if (distance.kilometers <= radiusKm) {
                    nearby.push({
                        filosofo: filosofo,
                        distance: distance,
                        coordinates: coord
                    });
                }
            } catch (error) {
                // Ignora errori calcolo distanza
            }
        });
        
        // Ordina per distanza
        nearby.sort((a, b) => a.distance.kilometers - b.distance.kilometers);
        
        return {
            center: center,
            radius_km: radiusKm,
            count: nearby.length,
            philosophers: nearby
        };
    }
    
    /**
     * Popola coordinate mancanti nei filosofi
     */
    async populateMissingCoordinates(filosofiList) {
        const updated = [];
        
        for (const filosofo of filosofiList) {
            // Se già ha coordinate, salta
            if (filosofo.luogo_nascita?.coordinate?.lat && filosofo.luogo_nascita?.coordinate?.lng) {
                updated.push(filosofo);
                continue;
            }
            
            try {
                const citta = filosofo.luogo_nascita?.citta;
                const paese = filosofo.luogo_nascita?.paese;
                
                if (!citta && !paese) {
                    updated.push(filosofo);
                    continue;
                }
                
                const coordinates = await this.getCoordinates(filosofo.nome, citta, paese);
                
                if (coordinates && coordinates.lat && coordinates.lng) {
                    const updatedFilosofo = {
                        ...filosofo,
                        luogo_nascita: {
                            ...filosofo.luogo_nascita,
                            citta: coordinates.citta || citta,
                            paese: coordinates.paese || paese,
                            coordinate: {
                                lat: coordinates.lat,
                                lng: coordinates.lng
                            }
                        },
                        coordinate_source: coordinates.source,
                        coordinate_accuracy: coordinates.accuracy
                    };
                    
                    updated.push(updatedFilosofo);
                } else {
                    updated.push(filosofo);
                }
                
            } catch (error) {
                console.warn(`Errore coordinate per ${filosofo.nome}:`, error.message);
                updated.push(filosofo);
            }
        }
        
        return updated;
    }
    
    /**
     * Statistiche cache
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            hits: this.cacheHits || 0,
            misses: this.cacheMisses || 0,
            hit_rate: this.cacheHits / (this.cacheHits + this.cacheMisses) || 0,
            philosopher_database_size: Object.keys(this.philosopherCoordinates).length
        };
    }
    
    /**
     * Pulisci cache
     */
    clearCache() {
        const size = this.cache.size;
        this.cache.clear();
        return {
            cleared: size,
            current_size: 0
        };
    }
    
    /**
     * Utility: Valida coordinate
     */
    isValidCoordinate(coord) {
        return coord &&
               typeof coord.lat === 'number' &&
               typeof coord.lng === 'number' &&
               !isNaN(coord.lat) && !isNaN(coord.lng) &&
               coord.lat >= -90 && coord.lat <= 90 &&
               coord.lng >= -180 && coord.lng <= 180;
    }
    
    /**
     * Utility: Gradi a radianti
     */
    toRad(degrees) {
        return degrees * Math.PI / 180;
    }
    
    // Statistiche cache
    cacheHits = 0;
    cacheMisses = 0;
}

// ==================== INIZIALIZZAZIONE GLOBALE ====================

// Crea istanza globale
window.GeocodingManager = new GeocodingManager();

// Funzioni helper globali
window.getPhilosopherCoordinates = async function(filosofo, citta, paese) {
    return await window.GeocodingManager.getCoordinates(filosofo, citta, paese);
};

window.searchPhilosophicalPlaces = async function(query) {
    return await window.GeocodingManager.searchPlaces(query);
};

window.calculatePhilosophicalDistance = function(coord1, coord2) {
    return window.GeocodingManager.calculateDistance(coord1, coord2);
};

// Inizializzazione ritardata
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        console.log('🌍 Geocoding Manager status:', {
            ready: window.GeocodingManager !== undefined,
            worker: window.GeocodingManager.useWorker,
            cache_size: window.GeocodingManager.cache.size
        });
    }, 2000);
});

console.log('✅ Geocoding Manager filosofico caricato');