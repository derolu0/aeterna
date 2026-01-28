/**
 * FIREBASE CONFIGURATION - CLEAN & STABLE BUILD
 * Progetto: Aeterna Lexicon in Motu
 */

// 1. Inizializzazione Unica
if (!window.firebaseInitialized) {
    console.log('🚀 Initializing Firebase for Aeterna Lexicon...');

    const firebaseConfig = {
        apiKey: "AIzaSyBo-Fz2fb8KHlvuZmb23psKDT6QvrJowB8",
        authDomain: "aeterna-lexicon-in-motu.firebaseapp.com",
        projectId: "aeterna-lexicon-in-motu",
        storageBucket: "aeterna-lexicon-in-motu.firebasestorage.app",
        messagingSenderId: "928786632423",
        appId: "1:928786632423:web:578d45e7d6961a298d5c42",
        measurementId: "G-E70D7TDDV7"
    };

    if (typeof firebase !== 'undefined') {
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        
        // Persistenza offline
        window.db.enablePersistence({ synchronizeTabs: true })
            .catch((err) => console.warn("Persistenza offline non disponibile:", err.code));
        
        window.firebaseInitialized = true;
        console.log('✅ Firebase e Firestore pronti.');
    } else {
        console.error('❌ Errore: Librerie Firebase non trovate.');
    }
}

// 2. DEFINIZIONE GLOBALE COLLEZIONI
window.COLLECTIONS = {
    FILOSOFI: 'filosofi',
    OPERE: 'opere',
    CONCETTI: 'concetti'
};

// 3. Notifica pronto
window.dispatchEvent(new Event('firebase-ready'));