/**
 * FIREBASE CONFIGURATION - Versione semplificata per dati integrati
 * Aeterna Lexicon in Motu
 * Modalità offline con dataset integrato
 */

console.log('🔥 Firebase Init - Modalità dati integrati');

// ==================== COLLEZIONI DATABASE ====================
window.COLLECTIONS = {
    FILOSOFI: 'filosofi',
    OPERE: 'opere',
    CONCETTI: 'concetti',
    SEGNALAZIONI: 'segnalazioni'
};

// ==================== UTILITY OFFLINE ====================

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

// ==================== FUNZIONI HELPER ====================

/**
 * Mostra errore in modo user-friendly
 */
function showFirebaseError(error) {
    console.error('Errore:', error);
    
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
            background: #fef3c7;
            color: #92400e;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 9999;
            max-width: 90%;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            border: 1px solid #fbbf24;
        `;
        document.body.appendChild(errorDiv);
    }
    
    let message = 'Modalità offline: utilizzo dati integrati';
    
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
                    Dataset integrato: 20 filosofi, 40 opere, 23 concetti
                </div>
            </div>
            <button onclick="this.parentElement.parentElement.style.display='none'" 
                    style="background: none; border: none; color: #92400e; cursor: pointer;">
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

// ==================== SIMULAZIONE FIREBASE ====================

// Per compatibilità con il codice esistente
window.db = {
    collection: function(name) {
        console.log(`📁 Accesso a collezione: ${name}`);
        return {
            get: async function() {
                return {
                    docs: [],
                    forEach: function() {}
                };
            },
            add: async function(data) {
                console.log('📝 Tentativo di aggiunta dati (modalità offline)');
                return { id: 'offline_' + Date.now() };
            },
            doc: function(id) {
                return {
                    set: async function(data) {
                        console.log('📝 Tentativo di salvataggio dati (modalità offline)');
                        return { id: id };
                    },
                    update: async function(data) {
                        console.log('📝 Tentativo di aggiornamento dati (modalità offline)');
                        return { id: id };
                    },
                    delete: async function() {
                        console.log('🗑️ Tentativo di eliminazione dati (modalità offline)');
                        return { success: true };
                    }
                };
            }
        };
    },
    batch: function() {
        return {
            set: function() {},
            commit: async function() {
                console.log('📦 Batch commit (modalità offline)');
                return { success: true };
            }
        };
    }
};

window.auth = {
    currentUser: null,
    signInWithEmailAndPassword: async function(email, password) {
        console.log('🔐 Tentativo di login (modalità offline)');
        return Promise.reject(new Error('Modalità offline: login non disponibile'));
    },
    signOut: async function() {
        console.log('🚪 Logout (modalità offline)');
        return Promise.resolve();
    }
};

window.firebaseInitialized = true;

// Emetti evento personalizzato per compatibilità
setTimeout(() => {
    const event = new Event('firebase-ready');
    window.dispatchEvent(event);
    console.log('✅ Sistema dati integrato pronto');
}, 1000);

console.log('🔥 Sistema inizializzato in modalità dati integrati');