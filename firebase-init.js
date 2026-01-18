/**
 * FIREBASE CONFIGURATION - PERSONAL BUILD
 * ---------------------------------------------
 * Author: De Rosa Salvatore
 * Project Work: Realizzazione di un dataset per l'interpretazione dei testi filosofici
 * Project ID: aeterna-lexicon-in-motu
 * ---------------------------------------------
 * DATASET FILOSOFICO: Analisi comparativa Classico vs Contemporaneo
 * Struttura:
 * - Filosofi (collezione: filosofi)
 * - Opere (collezione: opere) 
 * - Concetti (collezione: concetti)
 * - Analytics (collezione: analytics)
 * ---------------------------------------------
 */

// Check if firebase is already initialized
if (!window.firebaseInitialized) {
    console.log('Initializing Firebase for Aeterna Lexicon in Motu...');
    
    // Configurazione per il progetto "Aeterna Lexicon in Motu"
    const firebaseConfig = {
        apiKey: "AIzaSyBo-Fz2fb8KHlvuZmb23psKDT6QvrJowB8",
        authDomain: "aeterna-lexicon-in-motu.firebaseapp.com",
        projectId: "aeterna-lexicon-in-motu",
        storageBucket: "aeterna-lexicon-in-motu.firebasestorage.app",
        messagingSenderId: "928786632423",
        appId: "1:928786632423:web:578d45e7d6961a298d5c42",
        measurementId: "G-E70D7TDDV7"
    };
    
    // Initialize Firebase (Standard method if library is loaded via script tag)
    if (typeof firebase !== 'undefined') {
        try {
            // Inizializza l'app Firebase
            firebase.initializeApp(firebaseConfig);
            
            // Inizializza Firestore
            if (firebase.firestore) {
                window.db = firebase.firestore();
                console.log('Firestore inizializzato');
                
                // Abilita la persistenza offline
                window.db.enablePersistence()
                    .then(() => {
                        console.log('Firestore persistence abilitata');
                    })
                    .catch((err) => {
                        if (err.code === 'failed-precondition') {
                            console.warn('Persistence fallita: multiple tabs aperte');
                        } else if (err.code === 'unimplemented') {
                            console.warn('Persistence non supportata dal browser');
                        }
                    });
            }
            
            // Inizializza Analytics se disponibile
            if (firebase.analytics) {
                window.firebaseAnalytics = firebase.analytics();
                console.log('Firebase Analytics inizializzato');
                
                // Traccia avvio app
                window.firebaseAnalytics.logEvent('app_launch', {
                    project: 'Aeterna Lexicon in Motu',
                    version: '2.0.0',
                    platform: navigator.platform,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Inizializza Authentication
            if (firebase.auth) {
                window.auth = firebase.auth();
                console.log('Firebase Auth inizializzato');
            }
            
            // Inizializza Storage se necessario
            if (firebase.storage) {
                window.storage = firebase.storage();
                console.log('Firebase Storage inizializzato');
            }
            
        } catch (error) {
            console.error('Errore inizializzazione Firebase:', error);
        }
    }

    // Set flag to prevent double initialization
    window.firebaseInitialized = true;
    
    console.log('Firebase configuration loaded for Project Work: Dataset Filosofico');
    console.log('Progetto: Aeterna Lexicon in Motu');
    console.log('Database: Firestore con collezioni [filosofi, opere, concetti, analytics]');
    
    // Funzioni helper per il database
    window.firebaseHelpers = {
        // Carica dati filosofi
        loadFilosofi: async function() {
            if (!window.db) return [];
            try {
                const snapshot = await window.db.collection('filosofi').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Errore caricamento filosofi:', error);
                return [];
            }
        },
        
        // Carica dati opere
        loadOpere: async function() {
            if (!window.db) return [];
            try {
                const snapshot = await window.db.collection('opere').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Errore caricamento opere:', error);
                return [];
            }
        },
        
        // Carica dati concetti
        loadConcetti: async function() {
            if (!window.db) return [];
            try {
                const snapshot = await window.db.collection('concetti').get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Errore caricamento concetti:', error);
                return [];
            }
        },
        
        // Salva filosofo
        saveFilosofo: async function(filosofoData) {
            if (!window.db) return null;
            try {
                if (filosofoData.id) {
                    // Update
                    await window.db.collection('filosofi').doc(filosofoData.id).update(filosofoData);
                    return { success: true, id: filosofoData.id, action: 'updated' };
                } else {
                    // Create
                    const docRef = await window.db.collection('filosofi').add(filosofoData);
                    return { success: true, id: docRef.id, action: 'created' };
                }
            } catch (error) {
                console.error('Errore salvataggio filosofo:', error);
                return { success: false, error: error.message };
            }
        },
        
        // Salva opera
        saveOpera: async function(operaData) {
            if (!window.db) return null;
            try {
                if (operaData.id) {
                    // Update
                    await window.db.collection('opere').doc(operaData.id).update(operaData);
                    return { success: true, id: operaData.id, action: 'updated' };
                } else {
                    // Create
                    const docRef = await window.db.collection('opere').add(operaData);
                    return { success: true, id: docRef.id, action: 'created' };
                }
            } catch (error) {
                console.error('Errore salvataggio opera:', error);
                return { success: false, error: error.message };
            }
        },
        
        // Salva concetto
        saveConcetto: async function(concettoData) {
            if (!window.db) return null;
            try {
                if (concettoData.id) {
                    // Update
                    await window.db.collection('concetti').doc(concettoData.id).update(concettoData);
                    return { success: true, id: concettoData.id, action: 'updated' };
                } else {
                    // Create
                    const docRef = await window.db.collection('concetti').add(concettoData);
                    return { success: true, id: docRef.id, action: 'created' };
                }
            } catch (error) {
                console.error('Errore salvataggio concetto:', error);
                return { success: false, error: error.message };
            }
        },
        
        // Elimina filosofo
        deleteFilosofo: async function(filosofoId) {
            if (!window.db) return false;
            try {
                await window.db.collection('filosofi').doc(filosofoId).delete();
                return true;
            } catch (error) {
                console.error('Errore eliminazione filosofo:', error);
                return false;
            }
        },
        
        // Elimina opera
        deleteOpera: async function(operaId) {
            if (!window.db) return false;
            try {
                await window.db.collection('opere').doc(operaId).delete();
                return true;
            } catch (error) {
                console.error('Errore eliminazione opera:', error);
                return false;
            }
        },
        
        // Elimina concetto
        deleteConcetto: async function(concettoId) {
            if (!window.db) return false;
            try {
                await window.db.collection('concetti').doc(concettoId).delete();
                return true;
            } catch (error) {
                console.error('Errore eliminazione concetto:', error);
                return false;
            }
        },
        
        // Conta documenti
        getCounts: async function() {
            if (!window.db) return { filosofi: 0, opere: 0, concetti: 0 };
            try {
                const filosofiSnapshot = await window.db.collection('filosofi').get();
                const opereSnapshot = await window.db.collection('opere').get();
                const concettiSnapshot = await window.db.collection('concetti').get();
                
                return {
                    filosofi: filosofiSnapshot.size,
                    opere: opereSnapshot.size,
                    concetti: concettiSnapshot.size
                };
            } catch (error) {
                console.error('Errore conteggio documenti:', error);
                return { filosofi: 0, opere: 0, concetti: 0 };
            }
        },
        
        // Invia analytics a Firestore
        sendAnalytics: async function(analyticsData) {
            if (!window.db) return false;
            try {
                await window.db.collection('analytics').add({
                    ...analyticsData,
                    timestamp: new Date().toISOString(),
                    project: 'Aeterna Lexicon in Motu'
                });
                return true;
            } catch (error) {
                console.error('Errore invio analytics:', error);
                return false;
            }
        },
        
        // Ricerca filosofi
        searchFilosofi: async function(query) {
            if (!window.db) return [];
            try {
                const snapshot = await window.db.collection('filosofi')
                    .where('nome', '>=', query)
                    .where('nome', '<=', query + '\uf8ff')
                    .get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Errore ricerca filosofi:', error);
                return [];
            }
        },
        
        // Filtra per periodo
        filterByPeriodo: async function(collectionName, periodo) {
            if (!window.db) return [];
            try {
                const snapshot = await window.db.collection(collectionName)
                    .where('periodo', '==', periodo)
                    .get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error(`Errore filtraggio ${collectionName} per periodo ${periodo}:`, error);
                return [];
            }
        }
    };
    
    // Setup real-time listeners per aggiornamenti in tempo reale
    window.setupFirestoreListeners = function() {
        if (!window.db) return;
        
        // Listener per filosofi
        window.db.collection('filosofi').onSnapshot((snapshot) => {
            const filosofi = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            window.dispatchEvent(new CustomEvent('filosofi-updated', { 
                detail: { filosofi, count: filosofi.length } 
            }));
        }, (error) => {
            console.error('Errore listener filosofi:', error);
        });
        
        // Listener per opere
        window.db.collection('opere').onSnapshot((snapshot) => {
            const opere = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            window.dispatchEvent(new CustomEvent('opere-updated', { 
                detail: { opere, count: opere.length } 
            }));
        }, (error) => {
            console.error('Errore listener opere:', error);
        });
        
        // Listener per concetti
        window.db.collection('concetti').onSnapshot((snapshot) => {
            const concetti = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            window.dispatchEvent(new CustomEvent('concetti-updated', { 
                detail: { concetti, count: concetti.length } 
            }));
        }, (error) => {
            console.error('Errore listener concetti:', error);
        });
        
        console.log('Firestore listeners attivati');
    };
    
    // Setup listeners quando il DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (window.firebaseInitialized && window.db) {
                    window.setupFirestoreListeners();
                }
            }, 2000);
        });
    } else {
        setTimeout(() => {
            if (window.firebaseInitialized && window.db) {
                window.setupFirestoreListeners();
            }
        }, 2000);
    }
    
} else {
    console.log('Firebase già inizializzato per Aeterna Lexicon in Motu');
}

// Funzioni globali per compatibilità con app.js esistente
window.firebaseUtils = {
    // Verifica se Firebase è inizializzato
    isInitialized: function() {
        return !!window.firebaseInitialized;
    },
    
    // Ottieni configurazione
    getConfig: function() {
        return {
            projectId: 'aeterna-lexicon-in-motu',
            projectName: 'Aeterna Lexicon in Motu',
            collections: ['filosofi', 'opere', 'concetti', 'analytics'],
            version: '2.0.0'
        };
    },
    
    // Test connessione Firebase
    testConnection: async function() {
        if (!window.db) return { connected: false, error: 'Firestore non inizializzato' };
        
        try {
            const startTime = Date.now();
            await window.db.collection('analytics').doc('test').get();
            const latency = Date.now() - startTime;
            
            return {
                connected: true,
                latency: latency,
                timestamp: new Date().toISOString(),
                project: 'Aeterna Lexicon in Motu'
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    },
    
    // Backup dati locali a Firebase (se online)
    syncLocalData: async function() {
        if (!window.db || !navigator.onLine) {
            return { synced: false, reason: 'Offline o DB non disponibile' };
        }
        
        try {
            // Sincronizza dati locali se presenti
            const localFilosofi = JSON.parse(localStorage.getItem('local_filosofi') || '[]');
            const localOpere = JSON.parse(localStorage.getItem('local_opere') || '[]');
            const localConcetti = JSON.parse(localStorage.getItem('local_concetti') || '[]');
            
            let syncedCount = 0;
            
            // Sincronizza filosofi
            for (const filosofo of localFilosofi) {
                if (filosofo.id && filosofo.id.startsWith('local_')) {
                    await window.firebaseHelpers.saveFilosofo(filosofo);
                    syncedCount++;
                }
            }
            
            // Sincronizza opere
            for (const opera of localOpere) {
                if (opera.id && opera.id.startsWith('local_')) {
                    await window.firebaseHelpers.saveOpera(opera);
                    syncedCount++;
                }
            }
            
            // Sincronizza concetti
            for (const concetto of localConcetti) {
                if (concetto.id && concetto.id.startsWith('local_')) {
                    await window.firebaseHelpers.saveConcetto(concetto);
                    syncedCount++;
                }
            }
            
            return {
                synced: true,
                count: syncedCount,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                synced: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    },
    
    // Pulisci dati locali dopo sync
    cleanupLocalData: function() {
        localStorage.removeItem('local_filosofi');
        localStorage.removeItem('local_opere');
        localStorage.removeItem('local_concetti');
        console.log('Dati locali puliti dopo sync');
    }
};

// Evento globale per notificare quando Firebase è pronto
window.firebaseReady = new Promise((resolve) => {
    const checkFirebase = () => {
        if (window.firebaseInitialized && window.db) {
            resolve({
                db: window.db,
                auth: window.auth,
                analytics: window.firebaseAnalytics,
                helpers: window.firebaseHelpers,
                utils: window.firebaseUtils
            });
        } else {
            setTimeout(checkFirebase, 100);
        }
    };
    checkFirebase();
});

// Notifica quando Firebase è pronto
window.firebaseReady.then(() => {
    console.log('✅ Firebase completamente inizializzato per Aeterna Lexicon in Motu');
    window.dispatchEvent(new Event('firebase-ready'));
    
    // Traccia evento analytics
    if (window.Analytics) {
        window.Analytics.trackEvent('firebase', 'initialized', 'Aeterna Lexicon', null, {
            project: 'Aeterna Lexicon in Motu',
            timestamp: new Date().toISOString()
        });
    }
});