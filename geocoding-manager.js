// geocoding-manager.js - DA METTERE NELLA CARTELLA PRINCIPALE
// ================================================================
// Gestore di alto livello per il geocoding worker
// Fornisce API semplice all'app principale
// ================================================================

class GeocodingManager {
    constructor() {
        this.worker = null;
        this.callbacks = new Map();
        this.requestId = 0;
        this.workerReady = false;
        this.fallbackMode = false;
        
        // Database di fallback (ridotto, versione completa nel worker)
        this.FALLBACK_COORDINATES = {
            'Platone': { lat: 37.9838, lng: 23.7275, citta: 'Atene', paese: 'Grecia' },
            'Aristotele': { lat: 40.6331, lng: 22.9482, citta: 'Stagira', paese: 'Grecia' },
            'Immanuel Kant': { lat: 54.7065, lng: 20.511, citta: 'Königsberg', paese: 'Prussia' },
            'Friedrich Nietzsche': { lat: 51.2372, lng: 12.0914, citta: 'Röcken', paese: 'Germania' },
            'Michel Foucault': { lat: 46.5802, lng: 0.3404, citta: 'Poitiers', paese: 'Francia' }
        };
        
        this.init();
    }
    
    async init() {
        try {
            if (typeof Worker !== 'undefined') {
                // Usa percorso relativo dalla cartella principale
                this.worker = new Worker('./workers/geocoding-worker.js');
                
                this.worker.onmessage = this.handleWorkerMessage.bind(this);
                this.worker.onerror = this.handleWorkerError.bind(this);
                
                // Attendi che il worker sia pronto
                await this.waitForWorkerReady();
                this.workerReady = true;
                
                console.log('✅ Geocoding Manager inizializzato con worker');
            } else {
                console.warn('⚠️ Web Workers non supportati, usando modalità fallback sincrona');
                this.fallbackMode = true;
            }
        } catch (error) {
            console.error('❌ Errore inizializzazione Geocoding Manager:', error);
            this.fallbackMode = true;
        }
    }
    
    // ==================== API PUBBLICA ====================
    
    /**
     * Geocodifica un luogo (città + paese + eventuale filosofo)
     */
    async geocode(citta, paese, filosofo = null) {
        if (!citta && !paese && !filosofo) {
            throw new Error('Specificare almeno città, paese o filosofo');
        }
        
        // Normalizza input
        const params = {
            citta: citta?.trim() || '',
            paese: paese?.trim() || '',
            filosofo: filosofo?.trim() || null
        };
        
        try {
            if (this.workerReady && this.worker) {
                return await this.sendToWorker('GEOCODE', params);
            } else {
                return await this.geocodeFallback(params);
            }
        } catch (error) {
            console.warn('Geocoding fallito, usando coordinate di default:', error.message);
            return this.getDefaultCoordinates(params);
        }
    }
    
    /**
     * Ricerca luoghi per autocomplete
     */
    async searchPlaces(query) {
        if (!query || query.length < 2) {
            return [];
        }
        
        if (this.workerReady && this.worker) {
            return await this.sendToWorker('SEARCH_PLACES', query.trim());
        } else {
            return this.searchPlacesFallback(query.trim());
        }
    }
    
    /**
     * Calcola distanza tra due coordinate
     */
    async calculateDistance(coord1, coord2) {
        if (!this.isValidCoordinate(coord1) || !this.isValidCoordinate(coord2)) {
            throw new Error('Coordinate non valide');
        }
        
        if (this.workerReady && this.worker) {
            return await this.sendToWorker('CALCULATE_DISTANCE', { coord1, coord2 });
        } else {
            return this.calculateDistanceFallback(coord1, coord2);
        }
    }
    
    /**
     * Trova filosofi vicini a una coordinata
     */
    async findNearbyPhilosophers(centerCoord, radiusKm, filosofi) {
        if (!this.isValidCoordinate(centerCoord)) {
            throw new Error('Coordinate centro non valide');
        }
        
        if (!Array.isArray(filosofi)) {
            throw new Error('Lista filosofi non valida');
        }
        
        if (this.workerReady && this.worker) {
            return await this.sendToWorker('FIND_NEARBY_PHILOSOPHERS', {
                coord: centerCoord,
                radiusKm,
                filosofi
            });
        } else {
            return this.findNearbyPhilosophersFallback(centerCoord, radiusKm, filosofi);
        }
    }
    
    /**
     * Ottiene statistiche cache
     */
    async getCacheStats() {
        if (this.workerReady && this.worker) {
            return await this.sendToWorker('GET_CACHE_STATS');
        } else {
            return {
                size: 0,
                keys: [],
                mode: 'fallback'
            };
        }
    }
    
    /**
     * Pulisce la cache
     */
    async clearCache() {
        if (this.workerReady && this.worker) {
            return await this.sendToWorker('CLEAR_CACHE');
        } else {
            // Pulisci cache locale se esiste
            localStorage.removeItem('geocoding_cache');
            return { success: true, mode: 'fallback' };
        }
    }
    
    /**
     * Controlla se il manager è pronto
     */
    isReady() {
        return this.workerReady || this.fallbackMode;
    }
    
    /**
     * Ottieni stato del manager
     */
    getStatus() {
        return {
            ready: this.isReady(),
            workerAvailable: !!this.worker,
            workerReady: this.workerReady,
            fallbackMode: this.fallbackMode,
            requestCount: this.requestId
        };
    }
    
    // ==================== METODI PRIVATI ====================
    
    async sendToWorker(type, data) {
        return new Promise((resolve, reject) => {
            const id = ++this.requestId;
            
            this.callbacks.set(id, { resolve, reject });
            
            this.worker.postMessage({
                id,
                type,
                data
            });
            
            // Timeout di sicurezza
            setTimeout(() => {
                if (this.callbacks.has(id)) {
                    this.callbacks.delete(id);
                    reject(new Error(`Timeout richiesta ${type} (30s)`));
                }
            }, 30000);
        });
    }
    
    handleWorkerMessage(event) {
        const { id, type, success, data, error } = event.data;
        
        if (this.callbacks.has(id)) {
            const { resolve, reject } = this.callbacks.get(id);
            
            if (success) {
                resolve(data);
            } else {
                reject(new Error(error || `Errore worker: ${type}`));
            }
            
            this.callbacks.delete(id);
        }
    }
    
    handleWorkerError(error) {
        console.error('❌ Errore worker geocoding:', error);
        // Non blocchiamo l'app, continuiamo in modalità fallback
        this.fallbackMode = true;
    }
    
    async waitForWorkerReady() {
        return new Promise((resolve, reject) => {
            let readyHandler;
            let timeout;
            
            const cleanup = () => {
                clearTimeout(timeout);
                if (this.worker && readyHandler) {
                    this.worker.removeEventListener('message', readyHandler);
                }
            };
            
            readyHandler = (event) => {
                if (event.data.type === 'WORKER_READY') {
                    cleanup();
                    resolve();
                }
            };
            
            this.worker.addEventListener('message', readyHandler);
            
            timeout = setTimeout(() => {
                cleanup();
                reject(new Error('Timeout attesa worker (10s)'));
            }, 10000);
        });
    }
    
    // ==================== FALLBACK IMPLEMENTATIONS ====================
    
    async geocodeFallback(params) {
        const { citta, paese, filosofo } = params;
        
        // Prima cerca per filosofo
        if (filosofo && this.FALLBACK_COORDINATES[filosofo]) {
            return {
                ...this.FALLBACK_COORDINATES[filosofo],
                source: 'fallback_filosofo',
                accuracy: 'medium'
            };
        }
        
        // Poi cerca città importanti
        const cittaImportanti = {
            'Atene': { lat: 37.9838, lng: 23.7275, paese: 'Grecia' },
            'Roma': { lat: 41.9028, lng: 12.4964, paese: 'Italia' },
            'Parigi': { lat: 48.8566, lng: 2.3522, paese: 'Francia' },
            'Berlino': { lat: 52.5200, lng: 13.4050, paese: 'Germania' },
            'Londra': { lat: 51.5074, lng: -0.1278, paese: 'Regno Unito' }
        };
        
        if (citta && cittaImportanti[citta]) {
            return {
                ...cittaImportanti[citta],
                citta: citta,
                source: 'fallback_citta',
                accuracy: 'low'
            };
        }
        
        // Infine coordinate di default (Parigi)
        return this.getDefaultCoordinates(params);
    }
    
    searchPlacesFallback(query) {
        const results = [];
        const queryLower = query.toLowerCase();
        
        // Cerca tra i filosofi noti
        Object.keys(this.FALLBACK_COORDINATES).forEach(filosofo => {
            if (filosofo.toLowerCase().includes(queryLower)) {
                const coord = this.FALLBACK_COORDINATES[filosofo];
                results.push({
                    display_name: `${filosofo} - ${coord.citta}, ${coord.paese}`,
                    lat: coord.lat,
                    lng: coord.lng,
                    type: 'filosofo',
                    importance: 0.9,
                    source: 'fallback'
                });
            }
        });
        
        // Cerca tra città importanti
        const cittaImportanti = ['Atene', 'Roma', 'Parigi', 'Berlino', 'Londra'];
        cittaImportanti.forEach(citta => {
            if (citta.toLowerCase().includes(queryLower)) {
                results.push({
                    display_name: `${citta}`,
                    lat: this.geocodeFallback({ citta }).lat,
                    lng: this.geocodeFallback({ citta }).lng,
                    type: 'city',
                    importance: 0.7,
                    source: 'fallback'
                });
            }
        });
        
        return results;
    }
    
    calculateDistanceFallback(coord1, coord2) {
        // Formula di Haversine semplificata
        const R = 6371; // Raggio terrestre in km
        const dLat = this.toRad(coord2.lat - coord1.lat);
        const dLon = this.toRad(coord2.lng - coord1.lng);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(coord1.lat)) * Math.cos(this.toRad(coord2.lat)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    findNearbyPhilosophersFallback(centerCoord, radiusKm, filosofi) {
        return filosofi.filter(filosofo => {
            if (!filosofo.luogo_nascita || !filosofo.luogo_nascita.coordinate) {
                return false;
            }
            
            const distanza = this.calculateDistanceFallback(
                centerCoord, 
                filosofo.luogo_nascita.coordinate
            );
            
            return distanza <= radiusKm;
        }).sort((a, b) => {
            const distA = this.calculateDistanceFallback(centerCoord, a.luogo_nascita.coordinate);
            const distB = this.calculateDistanceFallback(centerCoord, b.luogo_nascita.coordinate);
            return distA - distB;
        });
    }
    
    getDefaultCoordinates(params) {
        return {
            lat: 48.8566, // Parigi
            lng: 2.3522,
            citta: 'Parigi',
            paese: 'Francia',
            source: 'default',
            accuracy: 'very_low',
            note: params.filosofo ? `Coordinate approssimative per ${params.filosofo}` : 'Coordinate di default'
        };
    }
    
    // ==================== UTILITY FUNCTIONS ====================
    
    isValidCoordinate(coord) {
        return coord &&
               typeof coord.lat === 'number' &&
               typeof coord.lng === 'number' &&
               !isNaN(coord.lat) && !isNaN(coord.lng) &&
               coord.lat >= -90 && coord.lat <= 90 &&
               coord.lng >= -180 && coord.lng <= 180;
    }
    
    toRad(degrees) {
        return degrees * Math.PI / 180;
    }
}

// ==================== GESTIONE GLOBALE ====================

// Verifica se esiste già un'istanza globale
if (!window.geocodingManagerInstance) {
    window.geocodingManagerInstance = new GeocodingManager();
}

// Alias per compatibilità con codice esistente
window.GeocodingManager = window.geocodingManagerInstance;

// Funzioni helper globali per compatibilità
if (!window.geocodeLocation) {
    window.geocodeLocation = async function(citta, paese, filosofo) {
        return await window.geocodingManagerInstance.geocode(citta, paese, filosofo);
    };
}

if (!window.searchGeographicPlaces) {
    window.searchGeographicPlaces = async function(query) {
        return await window.geocodingManagerInstance.searchPlaces(query);
    };
}

// Inizializzazione ritardata per non bloccare il caricamento
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (window.geocodingManagerInstance) {
            console.log('🌍 Geocoding Manager caricato:', window.geocodingManagerInstance.getStatus());
            
            // Test di connessione
            window.geocodingManagerInstance.getCacheStats()
                .then(stats => {
                    console.log('📊 Cache geocoding:', stats);
                })
                .catch(() => {
                    // Silenzioso in caso di errore
                });
        }
    }, 2000);
});

// Esporta per moduli (se necessario)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GeocodingManager, geocodingManagerInstance: window.geocodingManagerInstance };
}