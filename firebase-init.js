/**
 * FIREBASE CONFIGURATION - Versione Semplificata
 * Per Aeterna Lexicon in Motu - Project Work Filosofico
 * Solo funzionalità essenziali: Firestore + Auth
 */

// ==================== INIZIALIZZAZIONE FIREBASE ====================
if (!window.firebaseInitialized) {
    console.log('🔥 Initializing Firebase per Aeterna Lexicon...');
    
    // Configurazione Firebase (usa i tuoi dati reali)
    const firebaseConfig = {
        apiKey: "AIzaSyBo-Fz2fb8KHlvuZmb23psKDT6QvrJowB8",
        authDomain: "aeterna-lexicon-in-motu.firebaseapp.com",
        projectId: "aeterna-lexicon-in-motu",
        storageBucket: "aeterna-lexicon-in-motu.firebasestorage.app",
        messagingSenderId: "928786632423",
        appId: "1:928786632423:web:578d45e7d6961a298d5c42",
        measurementId: "G-E70D7TDDV7"
    };

    // Verifica che Firebase sia disponibile
    if (typeof firebase !== 'undefined') {
        try {
            // Inizializza solo se non già inizializzato
            if (!firebase.apps.length) {
                firebase.initializeApp(firebaseConfig);
                console.log('✅ Firebase App inizializzato');
            }
            
            // Inizializza servizi
            window.db = firebase.firestore();
            window.auth = firebase.auth();
            
            console.log('✅ Firestore e Auth pronti');
            
            // Persistenza offline (opzionale ma utile)
            window.db.enablePersistence({ synchronizeTabs: true })
                .then(() => {
                    console.log('✅ Persistenza offline attivata');
                })
                .catch((err) => {
                    if (err.code === 'failed-precondition') {
                        console.warn('⚠️ Persistenza: Multiple tabs aperti');
                    } else if (err.code === 'unimplemented') {
                        console.warn('⚠️ Persistenza: Browser non supportato');
                    } else {
                        console.warn('⚠️ Persistenza non disponibile:', err.message);
                    }
                });
            
            // Segnala che Firebase è pronto
            window.firebaseInitialized = true;
            
            // Emetti evento personalizzato
            const event = new Event('firebase-ready');
            window.dispatchEvent(event);
            
        } catch (error) {
            console.error('❌ Errore inizializzazione Firebase:', error);
            showFirebaseError(error);
        }
    } else {
        console.error('❌ Firebase SDK non trovato');
        showFirebaseError(new Error('Librerie Firebase non caricate'));
    }
}

// ==================== COLLEZIONI DATABASE ====================
window.COLLECTIONS = {
    FILOSOFI: 'filosofi',
    OPERE: 'opere',
    CONCETTI: 'concetti',
    SEGNALAZIONI: 'segnalazioni'
};

// ==================== FUNZIONI HELPER ====================

/**
 * Mostra errore Firebase in modo user-friendly
 */
function showFirebaseError(error) {
    console.error('Firebase Error:', error);
    
    // Crea elemento errore se non esiste
    let errorDiv = document.getElementById('firebase-error');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'firebase-error';
        errorDiv.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 9999;
            max-width: 90%;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(errorDiv);
    }
    
    let message = 'Errore di connessione al database';
    
    if (error.code === 'permission-denied') {
        message = 'Permessi insufficienti per accedere ai dati';
    } else if (error.code === 'unavailable') {
        message = 'Database non disponibile. Modalità offline attiva.';
    }
    
    errorDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-exclamation-triangle"></i>
            <div>
                <strong>${message}</strong>
                <div style="font-size: 0.8em; margin-top: 4px;">
                    Usando dati locali di esempio
                </div>
            </div>
            <button onclick="this.parentElement.parentElement.style.display='none'" 
                    style="background: none; border: none; color: white; cursor: pointer;">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    // Rimuovi automaticamente dopo 10 secondi
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.style.display = 'none';
        }
    }, 10000);
}

/**
 * Funzioni di utilità per Firestore
 */
window.firebaseUtils = {
    /**
     * Salva un documento
     */
    async saveDocument(collection, data, id = null) {
        try {
            if (!window.db) throw new Error('Firestore non inizializzato');
            
            let docRef;
            if (id) {
                docRef = await window.db.collection(collection).doc(id).set(data);
            } else {
                docRef = await window.db.collection(collection).add(data);
            }
            
            console.log(`✅ Documento salvato in ${collection}:`, id || docRef.id);
            return { success: true, id: id || docRef.id };
            
        } catch (error) {
            console.error(`❌ Errore salvataggio ${collection}:`, error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Ottieni tutti i documenti di una collezione
     */
    async getDocuments(collection, filters = {}) {
        try {
            if (!window.db) {
                console.warn('Firestore non disponibile, usando dati locali');
                return { success: false, data: [], offline: true };
            }
            
            let query = window.db.collection(collection);
            
            // Applica filtri
            Object.entries(filters).forEach(([field, value]) => {
                if (value !== undefined && value !== null) {
                    query = query.where(field, '==', value);
                }
            });
            
            const snapshot = await query.get();
            const documents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            console.log(`✅ ${documents.length} documenti da ${collection}`);
            return { success: true, data: documents };
            
        } catch (error) {
            console.error(`❌ Errore lettura ${collection}:`, error);
            return { success: false, error: error.message, data: [] };
        }
    },
    
    /**
     * Elimina un documento
     */
    async deleteDocument(collection, id) {
        try {
            if (!window.db) throw new Error('Firestore non inizializzato');
            
            await window.db.collection(collection).doc(id).delete();
            console.log(`✅ Documento eliminato: ${collection}/${id}`);
            return { success: true };
            
        } catch (error) {
            console.error(`❌ Errore eliminazione ${collection}/${id}:`, error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Aggiorna un documento
     */
    async updateDocument(collection, id, data) {
        try {
            if (!window.db) throw new Error('Firestore non inizializado');
            
            await window.db.collection(collection).doc(id).update(data);
            console.log(`✅ Documento aggiornato: ${collection}/${id}`);
            return { success: true };
            
        } catch (error) {
            console.error(`❌ Errore aggiornamento ${collection}/${id}:`, error);
            return { success: false, error: error.message };
        }
    }
};

/**
 * Funzioni di autenticazione semplificate
 */
window.authUtils = {
    /**
     * Login amministratore
     */
    async loginAdmin(email, password) {
        try {
            if (!window.auth) throw new Error('Auth non inizializzato');
            
            // Per demo, usa credenziali hardcoded
            // In produzione, usare Firebase Auth
            const adminCredentials = {
                email: 'admin@aeterna.it',
                password: 'philosophia2026'
            };
            
            if (email === adminCredentials.email && password === adminCredentials.password) {
                // Simula login Firebase
                const user = {
                    uid: 'admin-001',
                    email: email,
                    isAdmin: true,
                    displayName: 'Amministratore'
                };
                
                localStorage.setItem('admin_logged_in', 'true');
                localStorage.setItem('admin_user', JSON.stringify(user));
                
                console.log('✅ Admin autenticato:', email);
                return { success: true, user: user };
            } else {
                return { 
                    success: false, 
                    error: 'Credenziali non valide',
                    code: 'auth/wrong-credentials' 
                };
            }
            
        } catch (error) {
            console.error('❌ Errore login:', error);
            return { success: false, error: error.message };
        }
    },
    
    /**
     * Logout amministratore
     */
    logoutAdmin() {
        localStorage.removeItem('admin_logged_in');
        localStorage.removeItem('admin_user');
        console.log('✅ Admin disconnesso');
        return { success: true };
    },
    
    /**
     * Verifica se admin è loggato
     */
    isAdminLoggedIn() {
        const loggedIn = localStorage.getItem('admin_logged_in') === 'true';
        const user = JSON.parse(localStorage.getItem('admin_user') || 'null');
        return { loggedIn, user };
    }
};

/**
 * Inizializzazione ritardata per garantire che tutto sia pronto
 */
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        if (!window.firebaseInitialized && typeof firebase !== 'undefined') {
            console.log('🔄 Re-inizializzazione Firebase...');
            // Forza nuova inizializzazione se necessario
            window.firebaseInitialized = false;
            
            // Rimuovi e ricrea
            delete window.db;
            delete window.auth;
            
            // Riavvia lo script
            const script = document.createElement('script');
            script.textContent = `
                if (!window.firebaseInitialized && typeof firebase !== 'undefined') {
                    try {
                        if (!firebase.apps.length) {
                            firebase.initializeApp(${JSON.stringify(firebaseConfig)});
                        }
                        window.db = firebase.firestore();
                        window.auth = firebase.auth();
                        window.firebaseInitialized = true;
                        window.dispatchEvent(new Event('firebase-ready'));
                        console.log('✅ Firebase re-inizializzato');
                    } catch (error) {
                        console.error('❌ Errore re-inizializzazione:', error);
                    }
                }
            `;
            document.head.appendChild(script);
        }
    }, 2000);
});

// ==================== GESTIONE OFFLINE ====================

/**
 * Salva dati localmente per uso offline
 */
window.offlineStorage = {
    async saveLocalData(key, data) {
        try {
            localStorage.setItem(`aeterna_${key}`, JSON.stringify(data));
            localStorage.setItem(`aeterna_${key}_timestamp`, new Date().toISOString());
            console.log(`💾 Dati salvati localmente: ${key}`);
            return true;
        } catch (error) {
            console.error('❌ Errore salvataggio locale:', error);
            return false;
        }
    },
    
    async getLocalData(key) {
        try {
            const data = localStorage.getItem(`aeterna_${key}`);
            const timestamp = localStorage.getItem(`aeterna_${key}_timestamp`);
            
            if (!data) return null;
            
            return {
                data: JSON.parse(data),
                timestamp: timestamp,
                isStale: this.isDataStale(timestamp)
            };
        } catch (error) {
            console.error('❌ Errore lettura locale:', error);
            return null;
        }
    },
    
    isDataStale(timestamp, maxAgeHours = 24) {
        if (!timestamp) return true;
        
        const dataTime = new Date(timestamp).getTime();
        const currentTime = new Date().getTime();
        const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
        
        return (currentTime - dataTime) > maxAgeMs;
    },
    
    clearLocalData(key = null) {
        try {
            if (key) {
                localStorage.removeItem(`aeterna_${key}`);
                localStorage.removeItem(`aeterna_${key}_timestamp`);
                console.log(`🧹 Dati locali puliti: ${key}`);
            } else {
                // Pulisci tutti i dati dell'app
                Object.keys(localStorage).forEach(k => {
                    if (k.startsWith('aeterna_')) {
                        localStorage.removeItem(k);
                    }
                });
                console.log('🧹 Tutti i dati locali puliti');
            }
            return true;
        } catch (error) {
            console.error('❌ Errore pulizia dati:', error);
            return false;
        }
    }
};

console.log('🔥 Firebase Init - Versione 3.1.0 - Pronto per Aeterna Lexicon');