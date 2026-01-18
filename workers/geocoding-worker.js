// ==========================================
// GEOCODING WORKER PER AETERNA LEXICON IN MOTU
// Versione ottimizzata per dataset filosofico
// ==========================================

self.onmessage = function(e) {
    const { type, data } = e.data;
    
    switch(type) {
        case 'REVERSE_GEOCODE':
            handleReverseGeocode(data);
            break;
        case 'FORWARD_GEOCODE':
            handleForwardGeocode(data);
            break;
        case 'BATCH_GEOCODE':
            handleBatchGeocode(data);
            break;
        case 'VALIDATE_COORDINATES':
            handleValidateCoordinates(data);
            break;
        case 'GET_FILOSOFO_COORDINATES':
            handleGetFilosofoCoordinates(data);
            break;
    }
};

// 1. REVERSE GEOCODING (da coordinate a indirizzo)
async function handleReverseGeocode(data) {
    const { lat, lng, filosofoId } = data;
    
    try {
        const address = await reverseGeocode(lat, lng);
        
        self.postMessage({
            type: 'REVERSE_GEOCODING_RESULT',
            success: true,
            data: {
                filosofoId,
                address,
                coordinates: { lat, lng },
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        self.postMessage({
            type: 'REVERSE_GEOCODING_ERROR',
            success: false,
            error: error.message,
            data: { filosofoId, coordinates: { lat, lng } }
        });
    }
}

// 2. FORWARD GEOCODING (da indirizzo a coordinate)
async function handleForwardGeocode(data) {
    const { address, filosofoId } = data;
    
    try {
        const coordinates = await forwardGeocode(address);
        
        self.postMessage({
            type: 'FORWARD_GEOCODING_RESULT',
            success: true,
            data: {
                filosofoId,
                address,
                coordinates,
                timestamp: new Date().toISOString()
            }
        });
    } catch (error) {
        self.postMessage({
            type: 'FORWARD_GEOCODING_ERROR',
            success: false,
            error: error.message,
            data: { filosofoId, address }
        });
    }
}

// 3. BATCH GEOCODING (elaborazione multipla)
async function handleBatchGeocode(data) {
    const { items, operation } = data; // 'reverse' o 'forward'
    
    const results = [];
    const errors = [];
    
    for (const item of items) {
        try {
            let result;
            
            if (operation === 'reverse') {
                const address = await reverseGeocode(item.lat, item.lng);
                result = {
                    filosofoId: item.id,
                    nome: item.nome,
                    coordinates: { lat: item.lat, lng: item.lng },
                    address,
                    success: true
                };
            } else if (operation === 'forward') {
                const coordinates = await forwardGeocode(item.address);
                result = {
                    filosofoId: item.id,
                    nome: item.nome,
                    address: item.address,
                    coordinates,
                    success: true
                };
            }
            
            results.push(result);
            
            // Invia progresso ogni 5 elementi
            if (results.length % 5 === 0) {
                self.postMessage({
                    type: 'BATCH_PROGRESS',
                    progress: Math.round((results.length / items.length) * 100),
                    processed: results.length,
                    total: items.length
                });
            }
            
        } catch (error) {
            errors.push({
                filosofoId: item.id,
                nome: item.nome,
                error: error.message,
                data: item
            });
        }
        
        // Pausa per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    self.postMessage({
        type: 'BATCH_GEOCODING_COMPLETE',
        success: errors.length === 0,
        data: {
            results,
            errors,
            total: items.length,
            successful: results.length,
            failed: errors.length,
            timestamp: new Date().toISOString()
        }
    });
}

// 4. VALIDAZIONE COORDINATE
function handleValidateCoordinates(data) {
    const { coordinates } = data;
    
    const isValid = validateCoordinates(coordinates);
    
    self.postMessage({
        type: 'COORDINATES_VALIDATION_RESULT',
        success: true,
        data: {
            coordinates,
            isValid,
            validationDetails: getValidationDetails(coordinates),
            suggestions: isValid ? [] : getCoordinateSuggestions(coordinates)
        }
    });
}

// 5. COORDINATE FILOSOFI FAMOSI (database interno)
function handleGetFilosofoCoordinates(data) {
    const { filosofoNome } = data;
    
    const knownCoordinates = getFamosoFilosofoCoordinates(filosofoNome);
    
    if (knownCoordinates) {
        self.postMessage({
            type: 'FILOSOFO_COORDINATES_FOUND',
            success: true,
            data: {
                filosofoNome,
                coordinates: knownCoordinates,
                source: 'internal_database',
                confidence: 'high'
            }
        });
    } else {
        self.postMessage({
            type: 'FILOSOFO_COORDINATES_NOT_FOUND',
            success: false,
            data: { filosofoNome },
            suggestion: 'Usa forward geocoding con il luogo di nascita'
        });
    }
}

// ==========================================
// FUNZIONI DI GEOCODING
// ==========================================

async function reverseGeocode(lat, lng) {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
            headers: {
                'User-Agent': 'AeternaLexicon/1.0 (Filosofia Dataset Geocoding)',
                'Accept-Language': 'it,en',
                'Referer': 'https://fontanebeverininapoli.github.io/'
            }
        }
    );
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.error) {
        throw new Error(data.error);
    }
    
    return formatAddress(data);
}

async function forwardGeocode(address) {
    // Pulisci l'indirizzo per filosofi (rimuove note non geocodificabili)
    const cleanedAddress = cleanFilosofoAddress(address);
    
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanedAddress)}&limit=1&addressdetails=1`,
        {
            headers: {
                'User-Agent': 'AeternaLexicon/1.0 (Filosofia Dataset Geocoding)',
                'Accept-Language': 'it,en',
                'Referer': 'https://fontanebeverininapoli.github.io/'
            }
        }
    );
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
        throw new Error('Indirizzo non trovato');
    }
    
    const result = data[0];
    
    return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        display_name: result.display_name,
        importance: result.importance,
        boundingbox: result.boundingbox
    };
}

// ==========================================
// FUNZIONI DI SUPPORTO
// ==========================================

function formatAddress(data) {
    const address = data.address;
    
    if (!address) {
        return data.display_name || 'Indirizzo non disponibile';
    }
    
    // Costruisci indirizzo in formato leggibile
    const parts = [];
    
    // Casa/Numero civico
    if (address.house_number) {
        parts.push(address.house_number);
    }
    
    // Via
    if (address.road) {
        parts.push(address.road);
    }
    
    // Quartiere
    if (address.neighbourhood) {
        parts.push(address.neighbourhood);
    }
    
    // Città
    const city = address.city || address.town || address.village || address.municipality;
    if (city) {
        parts.push(city);
    }
    
    // Provincia/Regione
    if (address.state) {
        parts.push(address.state);
    }
    
    // Paese
    if (address.country) {
        parts.push(address.country);
    }
    
    // Formatta con virgole
    let formattedAddress = parts.join(', ');
    
    // Se troppo lungo, semplifica
    if (formattedAddress.length > 100) {
        if (city && address.country) {
            formattedAddress = `${city}, ${address.country}`;
        }
    }
    
    return formattedAddress || data.display_name;
}

function cleanFilosofoAddress(address) {
    if (!address) return '';
    
    // Rimuovi note tra parentesi
    let cleaned = address.replace(/\(.*?\)/g, '');
    
    // Rimuovi "circa", "probabilmente", etc.
    cleaned = cleaned.replace(/\b(circa|probabilmente|forse|presumibilmente)\b/gi, '');
    
    // Rimuovi date
    cleaned = cleaned.replace(/\d{1,2}\s+\w+\s+\d{4}/g, '');
    cleaned = cleaned.replace(/\d{4}\s*[-–]\s*\d{4}/g, '');
    
    // Rimuovi spazi multipli
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    
    // Aggiungi "Italia" se non specificato
    if (!cleaned.toLowerCase().includes('italia') && 
        !cleaned.toLowerCase().includes('italy') &&
        !cleaned.toLowerCase().includes('francia') &&
        !cleaned.toLowerCase().includes('francia') &&
        !cleaned.toLowerCase().includes('germania') &&
        !cleaned.toLowerCase().includes('germany') &&
        !cleaned.toLowerCase().includes('spagna') &&
        !cleaned.toLowerCase().includes('spain')) {
        cleaned += ', Italia';
    }
    
    return cleaned;
}

function validateCoordinates(coordinates) {
    const { lat, lng } = coordinates;
    
    // Controlla che siano numeri
    if (typeof lat !== 'number' || typeof lng !== 'number') {
        return false;
    }
    
    // Controlla range latitudine (-90 a 90)
    if (lat < -90 || lat > 90) {
        return false;
    }
    
    // Controlla range longitudine (-180 a 180)
    if (lng < -180 || lng > 180) {
        return false;
    }
    
    // Controlla coordinate plausibili (non 0,0 nel mezzo dell'oceano)
    if (lat === 0 && lng === 0) {
        return false;
    }
    
    return true;
}

function getValidationDetails(coordinates) {
    const { lat, lng } = coordinates;
    const isValid = validateCoordinates(coordinates);
    
    const details = {
        isValid,
        latRange: lat >= -90 && lat <= 90,
        lngRange: lng >= -180 && lng <= 180,
        notOceanZero: !(lat === 0 && lng === 0),
        isEuropean: lat >= 34 && lat <= 71 && lng >= -25 && lng <= 40,
        precision: {
            lat: lat.toFixed(6),
            lng: lng.toFixed(6),
            decimalPlaces: 6
        }
    };
    
    return details;
}

function getCoordinateSuggestions(coordinates) {
    const suggestions = [];
    const { lat, lng } = coordinates;
    
    if (lat === 0 && lng === 0) {
        suggestions.push({
            type: 'warning',
            message: 'Coordinate impostate su 0,0 (oceano). Verifica il luogo.',
            action: 'usare forward geocoding con indirizzo'
        });
    }
    
    if (lat < -90 || lat > 90) {
        suggestions.push({
            type: 'error',
            message: `Latitudine ${lat} fuori range (-90 a 90)`,
            correction: Math.max(-90, Math.min(90, lat))
        });
    }
    
    if (lng < -180 || lng > 180) {
        suggestions.push({
            type: 'error',
            message: `Longitudine ${lng} fuori range (-180 a 180)`,
            correction: ((lng + 180) % 360 - 180)
        });
    }
    
    return suggestions;
}

function getFamosoFilosofoCoordinates(filosofoNome) {
    // Database interno di coordinate di filosofi famosi
    const filosofiFamosi = {
        // Filosofi Italiani
        'Platone': { lat: 37.9842, lng: 23.7275, luogo: 'Atene, Grecia' },
        'Aristotele': { lat: 40.6401, lng: 22.9444, luogo: 'Stagira, Grecia' },
        'Tommaso d\'Aquino': { lat: 41.4815, lng: 13.3076, luogo: 'Roccasecca, Italia' },
        'Giordano Bruno': { lat: 40.8518, lng: 14.2681, luogo: 'Nola, Italia' },
        'Galileo Galilei': { lat: 43.7228, lng: 10.4017, luogo: 'Pisa, Italia' },
        
        // Filosofi Tedeschi
        'Immanuel Kant': { lat: 54.7065, lng: 20.5110, luogo: 'Königsberg, Prussia (Kaliningrad)' },
        'Friedrich Nietzsche': { lat: 51.2372, lng: 12.0914, luogo: 'Röcken, Germania' },
        'Karl Marx': { lat: 49.7557, lng: 6.6394, luogo: 'Treviri, Germania' },
        'Georg Wilhelm Friedrich Hegel': { lat: 48.7758, lng: 9.1829, luogo: 'Stoccarda, Germania' },
        'Martin Heidegger': { lat: 47.8667, lng: 8.6833, luogo: 'Meßkirch, Germania' },
        
        // Filosofi Francesi
        'René Descartes': { lat: 47.2184, lng: -1.5536, luogo: 'La Haye en Touraine, Francia' },
        'Jean-Jacques Rousseau': { lat: 46.2044, lng: 6.1432, luogo: 'Ginevra, Svizzera' },
        'Michel Foucault': { lat: 47.2184, lng: -1.5536, luogo: 'Poitiers, Francia' },
        'Jean-Paul Sartre': { lat: 48.8566, lng: 2.3522, luogo: 'Parigi, Francia' },
        'Simone de Beauvoir': { lat: 48.8566, lng: 2.3522, luogo: 'Parigi, Francia' },
        
        // Filosofi Greci Antichi
        'Socrate': { lat: 37.9838, lng: 23.7275, luogo: 'Atene, Grecia' },
        'Epicuro': { lat: 37.9667, lng: 23.7167, luogo: 'Atene, Grecia' },
        'Pitagora': { lat: 38.2466, lng: 15.6520, luogo: 'Samo, Grecia' },
        
        // Filosofi Moderni
        'Ludwig Wittgenstein': { lat: 48.2082, lng: 16.3738, luogo: 'Vienna, Austria' },
        'Bertrand Russell': { lat: 51.5074, lng: -0.1278, luogo: 'Trellech, Galles' },
        'John Locke': { lat: 51.1789, lng: -1.8262, luogo: 'Wrington, Inghilterra' },
        'David Hume': { lat: 55.9533, lng: -3.1883, luogo: 'Edimburgo, Scozia' },
        
        // Filosofi Contemporanei Italiani
        'Benedetto Croce': { lat: 40.8518, lng: 14.2681, luogo: 'Napoli, Italia' },
        'Antonio Gramsci': { lat: 39.2239, lng: 9.1217, luogo: 'Ales, Sardegna, Italia' },
        'Gianni Vattimo': { lat: 45.0703, lng: 7.6869, luogo: 'Torino, Italia' }
    };
    
    // Cerca corrispondenza esatta
    if (filosofiFamosi[filosofoNome]) {
        return filosofiFamosi[filosofoNome];
    }
    
    // Cerca corrispondenza parziale
    for (const [nome, coordinates] of Object.entries(filosofiFamosi)) {
        if (nome.toLowerCase().includes(filosofoNome.toLowerCase()) || 
            filosofoNome.toLowerCase().includes(nome.toLowerCase())) {
            return coordinates;
        }
    }
    
    return null;
}

// ==========================================
// CACHE PER GEOCODING
// ==========================================

const geocodingCache = new Map();
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 giorni

async function cachedGeocode(type, key, geocodeFunction, ...args) {
    const cacheKey = `${type}:${key}`;
    const now = Date.now();
    
    // Controlla cache
    if (geocodingCache.has(cacheKey)) {
        const cached = geocodingCache.get(cacheKey);
        
        if (now - cached.timestamp < CACHE_DURATION) {
            return cached.result;
        } else {
            // Cache scaduta
            geocodingCache.delete(cacheKey);
        }
    }
    
    // Esegue geocoding
    const result = await geocodeFunction(...args);
    
    // Salva in cache
    geocodingCache.set(cacheKey, {
        result,
        timestamp: now
    });
    
    // Limita dimensione cache
    if (geocodingCache.size > 1000) {
        const firstKey = geocodingCache.keys().next().value;
        geocodingCache.delete(firstKey);
    }
    
    return result;
}

// ==========================================
// ERROR HANDLING
// ==========================================

function logGeocodingError(operation, error, data) {
    const errorLog = {
        timestamp: new Date().toISOString(),
        operation,
        error: {
            message: error.message,
            stack: error.stack
        },
        data,
        userAgent: navigator.userAgent
    };
    
    console.error(`[Geocoding Worker] ${operation} error:`, errorLog);
    
    // Invia errore al main thread per logging
    self.postMessage({
        type: 'GEOCODING_ERROR_LOG',
        error: errorLog
    });
}

// ==========================================
// UTILITIES
// ==========================================

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raggio della Terra in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function toRad(degrees) {
    return degrees * Math.PI / 180;
}

function toDeg(radians) {
    return radians * 180 / Math.PI;
}

// ==========================================
// MESSAGGIO DI INIZIALIZZAZIONE
// ==========================================

self.postMessage({
    type: 'WORKER_READY',
    message: 'Geocoding Worker per Aeterna Lexicon inizializzato',
    version: '1.0',
    features: [
        'Reverse Geocoding',
        'Forward Geocoding',
        'Batch Processing',
        'Coordinate Validation',
        'Filosofi Coordinates Database',
        'Caching System'
    ]
});

console.log('✅ Geocoding Worker per Aeterna Lexicon caricato correttamente');