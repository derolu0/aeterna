/**
 * FIREBASE CONFIGURATION - PERSONAL BUILD
 * ---------------------------------------------
 * Author: De Rosa Salvatore
 * Project Work: Realizzazione di un dataset per l'interpretazione dei testi filosofici
 * Project ID: aeterna-lexicon-in-motu
 * ---------------------------------------------
 */

// Firebase Configuration and Initialization

// Check if firebase is already initialized
if (!window.firebaseInitialized) {
    console.log('Initializing Firebase...');
    
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
        firebase.initializeApp(firebaseConfig);
        // Tenta di inizializzare analytics se la libreria è presente
        if (firebase.analytics) {
            firebase.analytics();
        }
    }

    // Set flag to prevent double initialization
    window.firebaseInitialized = true;
    
    console.log('Firebase configuration loaded for Project Work: Dataset Filosofico');
} else {
    console.log('Firebase already initialized');
}