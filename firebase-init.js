[file name]: firebase-init.js
[file content begin]
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
 * - Analisi (collezione: analisi) - NUOVA
 * ---------------------------------------------
 * VERSIONE: 3.0.0 - STRUTTURA AGGIORNATA
 * Data: 2024
 */

// Check if firebase is already initialized
if (!window.firebaseInitialized) {
    console.log('🚀 Initializing Firebase for Aeterna Lexicon in Motu...');
    
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
                console.log('✅ Firestore inizializzato');
                
                // Configura impostazioni Firestore
                const settings = { /* timestampsInSnapshots: true */ };
                window.db.settings(settings);
                
                // Abilita la persistenza offline
                window.db.enablePersistence()
                    .then(() => {
                        console.log('📱 Firestore persistence abilitata');
                    })
                    .catch((err) => {
                        if (err.code === 'failed-precondition') {
                            console.warn('⚠️ Persistence fallita: multiple tabs aperte');
                        } else if (err.code === 'unimplemented') {
                            console.warn('⚠️ Persistence non supportata dal browser');
                        }
                    });
            }
            
            // Inizializza Analytics se disponibile
            if (firebase.analytics) {
                window.firebaseAnalytics = firebase.analytics();
                console.log('📊 Firebase Analytics inizializzato');
                
                // Traccia avvio app
                window.firebaseAnalytics.logEvent('app_launch', {
                    project: 'Aeterna Lexicon in Motu',
                    version: '3.0.0',
                    platform: navigator.platform,
                    timestamp: new Date().toISOString()
                });
            }
            
            // Inizializza Authentication
            if (firebase.auth) {
                window.auth = firebase.auth();
                console.log('🔐 Firebase Auth inizializzato');
            }
            
            // Inizializza Storage se necessario
            if (firebase.storage) {
                window.storage = firebase.storage();
                console.log('💾 Firebase Storage inizializzato');
            }
            
        } catch (error) {
            console.error('❌ Errore inizializzazione Firebase:', error);
        }
    }

    // Set flag to prevent double initialization
    window.firebaseInitialized = true;
    
    console.log('✅ Firebase configuration loaded for Project Work: Dataset Filosofico');
    console.log('📚 Progetto: Aeterna Lexicon in Motu');
    console.log('🗄️ Database: Firestore con collezioni [filosofi, opere, concetti, analytics, analisi]');
    
    // Funzioni helper per il database (TUTTE ESISTENTI + AGGIORNATE)
    window.firebaseHelpers = {
        // ==============================================
        // FUNZIONI ESISTENTI - AGGIORNATE PER STRUTTURA COMPLETA
        // ==============================================
        
        // Carica dati filosofi - STRUTTURA COMPLETA
        loadFilosofi: async function() {
            if (!window.db) {
                console.warn('Firestore non inizializzato');
                return [];
            }
            try {
                const snapshot = await window.db.collection('filosofi')
                    .orderBy('nome')
                    .get();
                return snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(),
                    // Campi opzionali con valori di default
                    coordinate: doc.data().coordinate || { lat: 0, lng: 0 },
                    scuole_correlate: doc.data().scuole_correlate || [],
                    concetti_principali: doc.data().concetti_principali || []
                }));
            } catch (error) {
                console.error('Errore caricamento filosofi:', error);
                return [];
            }
        },
        
        // Carica dati opere - STRUTTURA COMPLETA
        loadOpere: async function() {
            if (!window.db) return [];
            try {
                const snapshot = await window.db.collection('opere')
                    .orderBy('titolo')
                    .get();
                return snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(),
                    // Campi opzionali con valori di default
                    concetti: doc.data().concetti || [],
                    pagine: doc.data().pagine || 0
                }));
            } catch (error) {
                console.error('Errore caricamento opere:', error);
                return [];
            }
        },
        
        // Carica dati concetti - STRUTTURA COMPLETA
        loadConcetti: async function() {
            if (!window.db) return [];
            try {
                const snapshot = await window.db.collection('concetti')
                    .orderBy('parola')
                    .get();
                return snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(),
                    // Campi opzionali con valori di default
                    sinonimi: doc.data().sinonimi || [],
                    ambiti: doc.data().ambiti || []
                }));
            } catch (error) {
                console.error('Errore caricamento concetti:', error);
                return [];
            }
        },
        
        // Salva filosofo - STRUTTURA COMPLETA
        saveFilosofo: async function(filosofoData) {
            if (!window.db) {
                console.error('Firestore non inizializzato');
                return { success: false, error: 'Database non disponibile' };
            }
            
            try {
                // Struttura completa con tutti i campi
                const filosofoCompleto = {
                    nome: filosofoData.nome || 'Nome sconosciuto',
                    scuola: filosofoData.scuola || '',
                    periodo: filosofoData.periodo || 'sconosciuto',
                    luogo_nascita: filosofoData.luogo_nascita || '',
                    coordinate: filosofoData.coordinate || { lat: 0, lng: 0 },
                    ritratto: filosofoData.ritratto || '',
                    biografia: filosofoData.biografia || '',
                    data_nascita: filosofoData.data_nascita || '',
                    data_morte: filosofoData.data_morte || '',
                    // Campi per analisi
                    scuole_correlate: filosofoData.scuole_correlate || [],
                    concetti_principali: filosofoData.concetti_principali || [],
                    // Metadata
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                if (filosofoData.id) {
                    // Update - mantieni createdAt
                    const existingDoc = await window.db.collection('filosofi').doc(filosofoData.id).get();
                    if (existingDoc.exists) {
                        filosofoCompleto.createdAt = existingDoc.data().createdAt;
                    }
                    
                    await window.db.collection('filosofi').doc(filosofoData.id).update(filosofoCompleto);
                    console.log(`✅ Filosofo aggiornato: ${filosofoData.nome}`);
                    return { success: true, id: filosofoData.id, action: 'updated' };
                } else {
                    // Create
                    const docRef = await window.db.collection('filosofi').add(filosofoCompleto);
                    console.log(`✅ Filosofo creato: ${filosofoData.nome} (ID: ${docRef.id})`);
                    return { success: true, id: docRef.id, action: 'created' };
                }
            } catch (error) {
                console.error('Errore salvataggio filosofo:', error);
                return { success: false, error: error.message };
            }
        },
        
        // Salva opera - STRUTTURA COMPLETA
        saveOpera: async function(operaData) {
            if (!window.db) {
                console.error('Firestore non inizializzato');
                return { success: false, error: 'Database non disponibile' };
            }
            
            try {
                const operaCompleta = {
                    titolo: operaData.titolo || 'Titolo sconosciuto',
                    autore_id: operaData.autore_id || '',
                    autore_nome: operaData.autore_nome || '',
                    anno: operaData.anno || '',
                    periodo: operaData.periodo || 'sconosciuto',
                    sintesi: operaData.sintesi || '',
                    lingua: operaData.lingua || 'italiano',
                    pdf_url: operaData.pdf_url || '',
                    // Campi aggiuntivi per analisi
                    concetti: operaData.concetti || [],
                    pagine: operaData.pagine || 0,
                    isbn: operaData.isbn || '',
                    editore: operaData.editore || '',
                    // Metadata
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                if (operaData.id) {
                    // Update - mantieni createdAt
                    const existingDoc = await window.db.collection('opere').doc(operaData.id).get();
                    if (existingDoc.exists) {
                        operaCompleta.createdAt = existingDoc.data().createdAt;
                    }
                    
                    await window.db.collection('opere').doc(operaData.id).update(operaCompleta);
                    console.log(`✅ Opera aggiornata: ${operaData.titolo}`);
                    return { success: true, id: operaData.id, action: 'updated' };
                } else {
                    // Create
                    const docRef = await window.db.collection('opere').add(operaCompleta);
                    console.log(`✅ Opera creata: ${operaData.titolo} (ID: ${docRef.id})`);
                    return { success: true, id: docRef.id, action: 'created' };
                }
            } catch (error) {
                console.error('Errore salvataggio opera:', error);
                return { success: false, error: error.message };
            }
        },
        
        // Salva concetto - STRUTTURA COMPLETA
        saveConcetto: async function(concettoData) {
            if (!window.db) {
                console.error('Firestore non inizializzato');
                return { success: false, error: 'Database non disponibile' };
            }
            
            try {
                const concettoCompleto = {
                    parola: concettoData.parola || 'Concetto sconosciuto',
                    definizione: concettoData.definizione || '',
                    definizione_en: concettoData.definizione_en || '',
                    autore_riferimento: concettoData.autore_riferimento || '',
                    opera_riferimento: concettoData.opera_riferimento || '',
                    periodo_storico: concettoData.periodo_storico || concettoData.periodo || 'sconosciuto',
                    sinonimi: concettoData.sinonimi || [],
                    ambiti: concettoData.ambiti || [],
                    // Metadata
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                };
                
                if (concettoData.id) {
                    // Update - mantieni createdAt
                    const existingDoc = await window.db.collection('concetti').doc(concettoData.id).get();
                    if (existingDoc.exists) {
                        concettoCompleto.createdAt = existingDoc.data().createdAt;
                    }
                    
                    await window.db.collection('concetti').doc(concettoData.id).update(concettoCompleto);
                    console.log(`✅ Concetto aggiornato: ${concettoData.parola}`);
                    return { success: true, id: concettoData.id, action: 'updated' };
                } else {
                    // Create
                    const docRef = await window.db.collection('concetti').add(concettoCompleto);
                    console.log(`✅ Concetto creato: ${concettoData.parola} (ID: ${docRef.id})`);
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
                console.log(`🗑️ Filosofo eliminato: ${filosofoId}`);
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
                console.log(`🗑️ Opera eliminata: ${operaId}`);
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
                console.log(`🗑️ Concetto eliminato: ${concettoId}`);
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
                
                const counts = {
                    filosofi: filosofiSnapshot.size,
                    opere: opereSnapshot.size,
                    concetti: concettiSnapshot.size,
                    timestamp: new Date().toISOString()
                };
                
                console.log('📊 Conteggio documenti:', counts);
                return counts;
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
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    project: 'Aeterna Lexicon in Motu',
                    userAgent: navigator.userAgent,
                    platform: navigator.platform
                });
                console.log('📈 Analytics inviato:', analyticsData.evento || 'evento');
                return true;
            } catch (error) {
                console.error('Errore invio analytics:', error);
                return false;
            }
        },
        
        // Ricerca filosofi per nome
        searchFilosofi: async function(query) {
            if (!window.db) return [];
            try {
                const snapshot = await window.db.collection('filosofi')
                    .where('nome', '>=', query)
                    .where('nome', '<=', query + '\uf8ff')
                    .limit(20)
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
        },
        
        // Trova opere per filosofo
        findOpereByFilosofo: async function(filosofoId) {
            if (!window.db) return [];
            try {
                const snapshot = await window.db.collection('opere')
                    .where('autore_id', '==', filosofoId)
                    .orderBy('anno')
                    .get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error(`Errore ricerca opere per filosofo ${filosofoId}:`, error);
                return [];
            }
        },
        
        // Trova concetti per periodo storico
        findConcettiByPeriodo: async function(periodo) {
            if (!window.db) return [];
            try {
                const snapshot = await window.db.collection('concetti')
                    .where('periodo_storico', '==', periodo)
                    .orderBy('parola')
                    .get();
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error(`Errore ricerca concetti per periodo ${periodo}:`, error);
                return [];
            }
        },
        
        // ==============================================
        // NUOVE FUNZIONI PER ANALISI COMPARATIVA
        // ==============================================
        
        /**
         * ANALISI COMPARATIVA DI UN TERMINE FILOSOFICO
         * Confronta l'uso di un termine tra periodo classico e contemporaneo
         * @param {string} termine - Il termine da analizzare (es: "Verità")
         * @returns {Promise<Object>} Oggetto con analisi completa
         */
        analizzaTermineComparativo: async function(termine) {
            if (!window.db) {
                console.error('Firestore non inizializzato');
                return this.analisiFallback(termine);
            }
            
            try {
                console.log(`🔍 Avvio analisi comparativa per: "${termine}"`);
                
                // 1. CERCA IL CONCETTO NEL DATABASE
                const concetti = await this.loadConcetti();
                const concetto = concetti.find(c => 
                    c.parola && c.parola.toLowerCase() === termine.toLowerCase()
                );
                
                if (!concetto) {
                    console.warn(`Termine "${termine}" non trovato nei concetti`);
                    return this.analisiFallback(termine);
                }
                
                // 2. CARICA OPERE PER PERIODO
                const opereClassiche = await this.filterByPeriodo('opere', 'classico');
                const opereContemporanee = await this.filterByPeriodo('opere', 'contemporaneo');
                
                // 3. ESTRAI OCCORRENZE DEL TERMINE
                const occorrenzeClassiche = await this.estraiOccorrenzeTermine(termine, opereClassiche);
                const occorrenzeContemporanee = await this.estraiOccorrenzeTermine(termine, opereContemporanee);
                
                // 4. ANALISI CONTESTUALE
                const contestiClassici = this.analizzaContesti(occorrenzeClassiche);
                const contestiContemporanei = this.analizzaContesti(occorrenzeContemporanee);
                
                // 5. TIMELINE EVOLUTIVA
                const timeline = this.generaTimelineEvolutiva([
                    ...occorrenzeClassiche,
                    ...occorrenzeContemporanee
                ]);
                
                // 6. IDENTIFICA TRASFORMAZIONI
                const trasformazioni = this.identificaTrasformazioni(
                    contestiClassici,
                    contestiContemporanei
                );
                
                // 7. CALCOLA METRICHE
                const metriche = this.calcolaMetricheAnalisi(
                    occorrenzeClassiche,
                    occorrenzeContemporanee,
                    contestiClassici,
                    contestiContemporanei
                );
                
                // 8. SALVA ANALISI NEL DATABASE (opzionale)
                await this.salvaAnalisiNelDatabase({
                    termine,
                    concettoId: concetto.id,
                    concettoParola: concetto.parola,
                    timestamp: new Date().toISOString(),
                    metriche,
                    trasformazioni: trasformazioni.length,
                    occorrenzeTotali: metriche.occorrenze.totale
                });
                
                // 9. RESTITUISCI RISULTATO COMPLETO
                const risultato = {
                    termine: concetto.parola,
                    definizione: concetto.definizione || '',
                    definizioneInglese: concetto.definizione_en || '',
                    autoreRiferimento: concetto.autore_riferimento || '',
                    operaRiferimento: concetto.opera_riferimento || '',
                    periodo: concetto.periodo_storico || 'entrambi',
                    
                    analisi: {
                        classico: {
                            opereAnalizzate: opereClassiche.length,
                            occorrenze: occorrenzeClassiche.length,
                            contesti: contestiClassici,
                            contestiPercentuali: this.calcolaPercentualiContesti(contestiClassici),
                            esempi: occorrenzeClassiche.slice(0, 3) // Primi 3 esempi
                        },
                        
                        contemporaneo: {
                            opereAnalizzate: opereContemporanee.length,
                            occorrenze: occorrenzeContemporanee.length,
                            contesti: contestiContemporanei,
                            contestiPercentuali: this.calcolaPercentualiContesti(contestiContemporanei),
                            esempi: occorrenzeContemporanee.slice(0, 3)
                        },
                        
                        timeline: timeline,
                        trasformazioni: trasformazioni,
                        metriche: metriche
                    },
                    
                    metadata: {
                        analizzatoIl: new Date().toISOString(),
                        tempoElaborazione: Date.now(),
                        versioneAnalisi: '2.0.0',
                        concettoId: concetto.id
                    }
                };
                
                console.log(`✅ Analisi completata per "${termine}":`, {
                    classico: occorrenzeClassiche.length + ' occorrenze',
                    contemporaneo: occorrenzeContemporanee.length + ' occorrenze',
                    trasformazioni: trasformazioni.length
                });
                
                return risultato;
                
            } catch (error) {
                console.error('Errore nell\'analisi comparativa:', error);
                return this.analisiFallback(termine, error.message);
            }
        },
        
        /**
         * ESTRAI OCCORRENZE DI UN TERMINE IN UN INSIEME DI OPERE
         * @param {string} termine - Termine da cercare
         * @param {Array} opere - Lista di opere
         * @returns {Array} Occorrenze trovate
         */
        estraiOccorrenzeTermine: async function(termine, opere) {
            const occorrenze = [];
            const termineLower = termine.toLowerCase();
            
            opere.forEach(opera => {
                // Cerca nel titolo
                if (opera.titolo && opera.titolo.toLowerCase().includes(termineLower)) {
                    occorrenze.push({
                        tipo: 'titolo',
                        id: opera.id,
                        titolo: opera.titolo,
                        autore: opera.autore_nome || 'Autore sconosciuto',
                        autore_id: opera.autore_id || '',
                        anno: this.estraiAnnoNumerico(opera.anno),
                        periodo: opera.periodo || 'sconosciuto',
                        testo: opera.titolo,
                        contesto: 'titolo',
                        operaId: opera.id
                    });
                }
                
                // Cerca nella sintesi/abstract
                if (opera.sintesi && opera.sintesi.toLowerCase().includes(termineLower)) {
                    const posizione = opera.sintesi.toLowerCase().indexOf(termineLower);
                    const estratto = this.estraiContestoTestuale(opera.sintesi, posizione, 100);
                    
                    occorrenze.push({
                        tipo: 'sintesi',
                        id: opera.id,
                        titolo: opera.titolo,
                        autore: opera.autore_nome || 'Autore sconosciuto',
                        autore_id: opera.autore_id || '',
                        anno: this.estraiAnnoNumerico(opera.anno),
                        periodo: opera.periodo || 'sconosciuto',
                        testo: estratto,
                        contesto: this.inferisciContesto(opera.sintesi),
                        operaId: opera.id
                    });
                }
                
                // Cerca nei concetti trattati
                if (opera.concetti && Array.isArray(opera.concetti)) {
                    const concettiArray = typeof opera.concetti === 'string' 
                        ? opera.concetti.split(',').map(c => c.trim())
                        : opera.concetti;
                    
                    if (concettiArray.some(c => c.toLowerCase().includes(termineLower))) {
                        occorrenze.push({
                            tipo: 'concetto',
                            id: opera.id,
                            titolo: opera.titolo,
                            autore: opera.autore_nome || 'Autore sconosciuto',
                            autore_id: opera.autore_id || '',
                            anno: this.estraiAnnoNumerico(opera.anno),
                            periodo: opera.periodo || 'sconosciuto',
                            testo: `Opera tratta il concetto di "${termine}"`,
                            contesto: 'concettuale',
                            operaId: opera.id
                        });
                    }
                }
            });
            
            return occorrenze;
        },
        
        /**
         * ANALIZZA I CONTESTI D'USO DI UN TERMINE
         * @param {Array} occorrenze - Occorrenze del termine
         * @returns {Object} Analisi dei contesti
         */
        analizzaContesti: function(occorrenze) {
            const contesti = {
                ontologico: 0,
                epistemico: 0,
                etico: 0,
                politico: 0,
                estetico: 0,
                metafisico: 0,
                linguistico: 0,
                altro: 0
            };
            
            const paroleChiave = {
                ontologico: ['essere', 'esistenza', 'realtà', 'sostanza', 'essenza', 'ente', 'essere', 'essente'],
                epistemico: ['conoscenza', 'verità', 'scienza', 'ragione', 'esperienza', 'certezza', 'sapere', 'comprensione'],
                etico: ['bene', 'male', 'morale', 'virtù', 'dovere', 'felicità', 'giustizia', 'etica', 'morale'],
                politico: ['potere', 'stato', 'società', 'libertà', 'autorità', 'democrazia', 'governo', 'politica'],
                estetico: ['bello', 'arte', 'creatività', 'percezione', 'gusto', 'estetica', 'bellezza'],
                metafisico: ['dio', 'spirito', 'anima', 'trascendente', 'assoluto', 'divino', 'sacro', 'metafisica'],
                linguistico: ['linguaggio', 'segno', 'significato', 'discorso', 'comunicazione', 'parola', 'senso']
            };
            
            occorrenze.forEach(occ => {
                const testo = (occ.testo || '').toLowerCase();
                const contestoEsplicito = occ.contesto;
                
                let contestoIdentificato = 'altro';
                
                // Se il contesto è già specificato, usalo
                if (contestoEsplicito && contestoEsplicito !== 'titolo' && contestoEsplicito !== 'concettuale') {
                    contestoIdentificato = contestoEsplicito;
                } else {
                    // Altrimenti, analizza il testo
                    for (const [contesto, parole] of Object.entries(paroleChiave)) {
                        if (parole.some(parola => testo.includes(parola))) {
                            contestoIdentificato = contesto;
                            break;
                        }
                    }
                }
                
                contesti[contestoIdentificato]++;
            });
            
            // Filtra solo contesti con occorrenze > 0
            const contestiFiltrati = {};
            Object.entries(contesti).forEach(([contesto, conteggio]) => {
                if (conteggio > 0) {
                    contestiFiltrati[contesto] = conteggio;
                }
            });
            
            return contestiFiltrati;
        },
        
        /**
         * CALCOLA PERCENTUALI DEI CONTESTI
         */
        calcolaPercentualiContesti: function(contesti) {
            const totale = Object.values(contesti).reduce((a, b) => a + b, 0);
            if (totale === 0) return {};
            
            const percentuali = {};
            Object.entries(contesti).forEach(([contesto, conteggio]) => {
                percentuali[contesto] = ((conteggio / totale) * 100).toFixed(1) + '%';
            });
            
            return percentuali;
        },
        
        /**
         * GENERA TIMELINE EVOLUTIVA DEL TERMINE
         * @param {Array} occorrenze - Tutte le occorrenze
         * @returns {Array} Timeline ordinata
         */
        generaTimelineEvolutiva: function(occorrenze) {
            // Filtra occorrenze con anno valido
            const occorrenzeConAnno = occorrenze.filter(occ => occ.anno && occ.anno > 0);
            
            // Ordina per anno
            occorrenzeConAnno.sort((a, b) => a.anno - b.anno);
            
            // Raggruppa per secolo per semplificare la timeline
            const timelinePerSecolo = {};
            
            occorrenzeConAnno.forEach(occ => {
                const secolo = Math.floor(occ.anno / 100) * 100;
                const chiave = `${secolo}-${secolo + 99}`;
                
                if (!timelinePerSecolo[chiave]) {
                    timelinePerSecolo[chiave] = {
                        secolo: `${secolo}-${secolo + 99}`,
                        periodo: this.determinaPeriodoDaAnno(occ.anno),
                        autori: new Set(),
                        opere: new Set(),
                        occorrenze: 0
                    };
                }
                
                timelinePerSecolo[chiave].autori.add(occ.autore);
                timelinePerSecolo[chiave].opere.add(occ.titolo);
                timelinePerSecolo[chiave].occorrenze++;
            });
            
            // Converti in array e limita a 10 secoli più significativi
            return Object.values(timelinePerSecolo)
                .sort((a, b) => a.secolo.localeCompare(b.secolo))
                .slice(0, 10)
                .map(item => ({
                    secolo: item.secolo,
                    periodo: item.periodo,
                    autori: Array.from(item.autori).slice(0, 3), // Massimo 3 autori
                    opere: Array.from(item.opere).slice(0, 2), // Opere uniche
                    occorrenze: item.occorrenze,
                    rappresentativita: (item.occorrenze / occorrenzeConAnno.length * 100).toFixed(1) + '%'
                }));
        },
        
        /**
         * IDENTIFICA TRASFORMAZIONI TRA PERIODI
         * @param {Object} contestiClassici 
         * @param {Object} contestiContemporanei 
         * @returns {Array} Trasformazioni identificate
         */
        identificaTrasformazioni: function(contestiClassici, contestiContemporanei) {
            const trasformazioni = [];
            
            // Mappa delle possibili trasformazioni
            const mappeTrasformazioni = [
                {
                    da: 'ontologico',
                    a: 'politico',
                    descrizione: 'Da concetto metafisico a strumento politico',
                    esempio: 'Il "potere" da facoltà ontologica a relazione sociale'
                },
                {
                    da: 'metafisico',
                    a: 'linguistico',
                    descrizione: 'Da entità trascendente a costrutto linguistico',
                    esempio: 'La "verità" da corrispondenza a performance discorsiva'
                },
                {
                    da: 'etico',
                    a: 'estetico',
                    descrizione: 'Da norma morale a valore estetico',
                    esempio: 'Il "bene" da principio etico a categoria estetica'
                },
                {
                    da: 'ontologico',
                    a: 'linguistico',
                    descrizione: 'Da struttura della realtà a struttura del linguaggio',
                    esempio: 'L\'"essere" da fondamento ontologico a categoria grammaticale'
                },
                {
                    da: 'epistemico',
                    a: 'politico',
                    descrizione: 'Da criterio di verità a strumento di potere',
                    esempio: 'La "conoscenza" da ricerca della verità a dispositivo di controllo'
                }
            ];
            
            // Calcola variazioni percentuali
            const variazioni = {};
            const tuttiContesti = new Set([
                ...Object.keys(contestiClassici),
                ...Object.keys(contestiContemporanei)
            ]);
            
            tuttiContesti.forEach(contesto => {
                const classico = contestiClassici[contesto] || 0;
                const contemporaneo = contestiContemporanei[contesto] || 0;
                const totaleClassico = Object.values(contestiClassici).reduce((a, b) => a + b, 0);
                const totaleContemporaneo = Object.values(contestiContemporanei).reduce((a, b) => a + b, 0);
                
                if (totaleClassico > 0 && totaleContemporaneo > 0) {
                    const percentualeClassico = (classico / totaleClassico) * 100;
                    const percentualeContemporaneo = (contemporaneo / totaleContemporaneo) * 100;
                    const variazione = percentualeContemporaneo - percentualeClassico;
                    
                    variazioni[contesto] = {
                        classico: percentualeClassico.toFixed(1),
                        contemporaneo: percentualeContemporaneo.toFixed(1),
                        variazione: variazione.toFixed(1)
                    };
                    
                    // Identifica trasformazioni significative (variazione > 15%)
                    if (Math.abs(variazione) > 15) {
                        trasformazioni.push({
                            tipo: variazione > 0 ? 'aumento' : 'diminuzione',
                            contesto: contesto,
                            variazione: Math.abs(variazione).toFixed(1) + '%',
                            significato: variazione > 0 
                                ? `Il termine diventa più ${contesto} nel pensiero contemporaneo`
                                : `Il termine perde centralità ${contesto} nel pensiero contemporaneo`,
                            rilevanza: Math.abs(variazione) > 30 ? 'alta' : 'media'
                        });
                    }
                }
            });
            
            // Aggiungi trasformazioni dalla mappa
            mappeTrasformazioni.forEach(mappa => {
                if (contestiClassici[mappa.da] && contestiContemporanei[mappa.a]) {
                    const classicoPercent = contestiClassici[mappa.da] / Object.values(contestiClassici).reduce((a, b) => a + b, 0) * 100;
                    const contemporaneoPercent = contestiContemporanei[mappa.a] / Object.values(contestiContemporanei).reduce((a, b) => a + b, 0) * 100;
                    
                    if (classicoPercent > 10 && contemporaneoPercent > 10) {
                        trasformazioni.push({
                            tipo: 'trasformazione',
                            da: mappa.da,
                            a: mappa.a,
                            descrizione: mappa.descrizione,
                            esempio: mappa.esempio,
                            rilevanza: 'alta'
                        });
                    }
                }
            });
            
            return trasformazioni;
        },
        
        /**
         * CALCOLA METRICHE QUANTITATIVE DELL'ANALISI
         */
        calcolaMetricheAnalisi: function(classicoOcc, contemporaneoOcc, classicoContesti, contemporaneoContesti) {
            const totaleClassico = classicoOcc.length;
            const totaleContemporaneo = contemporaneoOcc.length;
            const totale = totaleClassico + totaleContemporaneo;
            
            const classicoContestiCount = Object.keys(classicoContesti).length;
            const contemporaneoContestiCount = Object.keys(contemporaneoContesti).length;
            
            return {
                occorrenze: {
                    classico: totaleClassico,
                    contemporaneo: totaleContemporaneo,
                    totale: totale,
                    rapporto: totaleClassico > 0 ? (totaleContemporaneo / totaleClassico).toFixed(2) : '∞',
                    variazione: totaleClassico > 0 ? ((totaleContemporaneo - totaleClassico) / totaleClassico * 100).toFixed(1) + '%' : '100%'
                },
                contesti: {
                    classico: classicoContestiCount,
                    contemporaneo: contemporaneoContestiCount,
                    unici: [...new Set([
                        ...Object.keys(classicoContesti),
                        ...Object.keys(contemporaneoContesti)
                    ])].length,
                    sovrapposizione: this.calcolaSovrapposizioneContesti(classicoContesti, contemporaneoContesti)
                },
                intensita: {
                    classico: totaleClassico > 0 ? (totaleClassico / 100).toFixed(2) : '0.00',
                    contemporaneo: totaleContemporaneo > 0 ? (totaleContemporaneo / 100).toFixed(2) : '0.00',
                    rapporto: totaleClassico > 0 ? (totaleContemporaneo / totaleClassico).toFixed(2) : '0.00'
                }
            };
        },
        
        /**
         * CALCOLA SOVRAPPOSIZIONE DEI CONTESTI
         */
        calcolaSovrapposizioneContesti: function(contestiA, contestiB) {
            const keysA = new Set(Object.keys(contestiA));
            const keysB = new Set(Object.keys(contestiB));
            
            const intersezione = [...keysA].filter(x => keysB.has(x)).length;
            const unione = new Set([...keysA, ...keysB]).size;
            
            return unione > 0 ? ((intersezione / unione) * 100).toFixed(1) + '%' : '0%';
        },
        
        /**
         * SALVA L'ANALISI NEL DATABASE PER FUTURI CONFRONTI
         */
        salvaAnalisiNelDatabase: async function(analisiData) {
            if (!window.db) return false;
            
            try {
                await window.db.collection('analisi').add({
                    ...analisiData,
                    progetto: 'Aeterna Lexicon in Motu',
                    tipo: 'analisi_comparativa',
                    timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                    userAgent: navigator.userAgent
                });
                console.log('💾 Analisi salvata nel database');
                return true;
            } catch (error) {
                console.warn('⚠️ Non è stato possibile salvare l\'analisi:', error.message);
                return false;
            }
        },
        
        // ==============================================
        // FUNZIONI AUSILIARIE
        // ==============================================
        
        /**
         * ESTRAGGI ANNO NUMERICO DA STRINGA
         */
        estraiAnnoNumerico: function(testoAnno) {
            if (!testoAnno) return 0;
            
            // Cerca pattern di date
            const patterns = [
                /(\d{4})/,                    // 1789
                /(\d{3,4})\s*a\.?C\.?/i,      // 380 a.C.
                /(\d{3,4})\s*d\.?C\.?/i       // 1200 d.C.
            ];
            
            for (const pattern of patterns) {
                const match = testoAnno.toString().match(pattern);
                if (match) {
                    let anno = parseInt(match[1]);
                    
                    // Correzione per a.C.
                    if (testoAnno.toLowerCase().includes('a.c') || testoAnno.toLowerCase().includes('a.c.')) {
                        anno = -anno;
                    }
                    
                    return anno;
                }
            }
            
            // Prova a estrarre solo i numeri
            const soloNumeri = testoAnno.toString().match(/\d+/g);
            if (soloNumeri && soloNumeri[0]) {
                const anno = parseInt(soloNumeri[0]);
                if (anno > 1000 && anno < 2100) return anno;
            }
            
            return 0;
        },
        
        /**
         * DETERMINA PERIODO STORICO DA ANNO
         */
        determinaPeriodoDaAnno: function(anno) {
            if (anno < -800) return 'pre-classico';
            if (anno < 476) return 'classico';
            if (anno < 1453) return 'medioevale';
            if (anno < 1789) return 'rinascimentale';
            if (anno < 1900) return 'moderno';
            return 'contemporaneo';
        },
        
        /**
         * INFERISCI CONTESTO DA TESTO
         */
        inferisciContesto: function(testo) {
            if (!testo) return 'altro';
            
            const testoLower = testo.toLowerCase();
            
            if (testoLower.includes('politic') || testoLower.includes('potere') || testoLower.includes('stato')) return 'politico';
            if (testoLower.includes('etic') || testoLower.includes('moral') || testoLower.includes('virtù') || testoLower.includes('giustizia')) return 'etico';
            if (testoLower.includes('essere') || testoLower.includes('realtà') || testoLower.includes('esistenza') || testoLower.includes('essenza')) return 'ontologico';
            if (testoLower.includes('conoscenza') || testoLower.includes('verità') || testoLower.includes('scienza') || testoLower.includes('sapere')) return 'epistemico';
            if (testoLower.includes('bello') || testoLower.includes('arte') || testoLower.includes('estetic')) return 'estetico';
            if (testoLower.includes('dio') || testoLower.includes('spirito') || testoLower.includes('divino') || testoLower.includes('sacro')) return 'metafisico';
            if (testoLower.includes('linguaggio') || testoLower.includes('parola') || testoLower.includes('segno') || testoLower.includes('discorso')) return 'linguistico';
            
            return 'altro';
        },
        
        /**
         * ESTRATTO DI TESTO CON CONTESTO
         */
        estraiContestoTestuale: function(testo, posizione, lunghezza) {
            if (!testo || posizione === -1) return '';
            
            const inizio = Math.max(0, posizione - lunghezza);
            const fine = Math.min(testo.length, posizione + lunghezza);
            
            let estratto = testo.substring(inizio, fine);
            
            // Evidenzia il termine nel testo
            const termineInEstratto = testo.substring(posizione, posizione + lunghezza/2);
            estratto = estratto.replace(
                new RegExp(`(${termineInEstratto})`, 'i'),
                '<strong>$1</strong>'
            );
            
            // Aggiunge ellissi se non è all'inizio/fine
            if (inizio > 0) estratto = '...' + estratto;
            if (fine < testo.length) estratto = estratto + '...';
            
            return estratto;
        },
        
        /**
         * ANALISI FALLBACK QUANDO IL DATABASE NON È DISPONIBILE
         */
        analisiFallback: function(termine, errore = null) {
            console.log('Utilizzo analisi fallback per:', termine);
            
            // Dati di esempio per dimostrazione
            const datiEsempio = {
                verita: {
                    classico: {
                        occorrenze: 12,
                        contesti: { ontologico: 8, epistemico: 4 },
                        esempi: [
                            { 
                                autore: 'Aristotele', 
                                opera: 'Metafisica', 
                                testo: 'Dire di ciò che è che non è, o di ciò che non è che è, è falso...',
                                anno: -350
                            }
                        ]
                    },
                    contemporaneo: {
                        occorrenze: 18,
                        contesti: { politico: 10, linguistico: 8 },
                        esempi: [
                            { 
                                autore: 'Foucault', 
                                opera: 'L\'ordine del discorso', 
                                testo: 'La verità non è al di fuori del potere...',
                                anno: 1970
                            }
                        ]
                    }
                },
                potere: {
                    classico: {
                        occorrenze: 8,
                        contesti: { ontologico: 6, politico: 2 },
                        esempi: [
                            { 
                                autore: 'Platone', 
                                opera: 'La Repubblica', 
                                testo: 'Il potere deve essere esercitato dai filosofi...',
                                anno: -380
                            }
                        ]
                    },
                    contemporaneo: {
                        occorrenze: 24,
                        contesti: { politico: 15, sociale: 9 },
                        esempi: [
                            { 
                                autore: 'Foucault', 
                                opera: 'Sorvegliare e punire', 
                                testo: 'Il potere non è un\'istituzione, non è una struttura...',
                                anno: 1975
                            }
                        ]
                    }
                },
                essere: {
                    classico: {
                        occorrenze: 15,
                        contesti: { ontologico: 12, metafisico: 3 },
                        esempi: [
                            { 
                                autore: 'Parmenide', 
                                opera: 'Sulla natura', 
                                testo: 'L\'essere è, il non-essere non è...',
                                anno: -500
                            }
                        ]
                    },
                    contemporaneo: {
                        occorrenze: 9,
                        contesti: { linguistico: 6, ontologico: 3 },
                        esempi: [
                            { 
                                autore: 'Heidegger', 
                                opera: 'Essere e tempo', 
                                testo: 'La questione dell\'essere...',
                                anno: 1927
                            }
                        ]
                    }
                }
            };
            
            const termineLower = termine.toLowerCase();
            const dati = datiEsempio[termineLower] || {
                classico: { occorrenze: 5, contesti: { ontologico: 3, altro: 2 }, esempi: [] },
                contemporaneo: { occorrenze: 7, contesti: { politico: 4, linguistico: 3 }, esempi: [] }
            };
            
            return {
                termine: termine.charAt(0).toUpperCase() + termine.slice(1),
                definizione: 'Termine filosofico analizzato in modalità dimostrativa',
                periodo: 'entrambi',
                analisi: {
                    classico: dati.classico,
                    contemporaneo: dati.contemporaneo,
                    timeline: [
                        { secolo: 'V-IV a.C.', periodo: 'classico', autori: ['Platone', 'Aristotele'], occorrenze: 3 },
                        { secolo: 'XIII d.C.', periodo: 'medioevale', autori: ['Tommaso d\'Aquino'], occorrenze: 2 },
                        { secolo: 'XX d.C.', periodo: 'contemporaneo', autori: ['Foucault', 'Nietzsche'], occorrenze: 5 }
                    ],
                    trasformazioni: [
                        { 
                            tipo: 'trasformazione', 
                            da: 'ontologico', 
                            a: 'politico', 
                            descrizione: 'Da concetto metafisico a strumento di analisi sociale',
                            rilevanza: 'alta'
                        }
                    ],
                    metriche: {
                        occorrenze: {
                            classico: dati.classico.occorrenze,
                            contemporaneo: dati.contemporaneo.occorrenze,
                            totale: dati.classico.occorrenze + dati.contemporaneo.occorrenze,
                            rapporto: dati.classico.occorrenze > 0 
                                ? (dati.contemporaneo.occorrenze / dati.classico.occorrenze).toFixed(2) 
                                : '0.00'
                        }
                    }
                },
                metadata: {
                    analizzatoIl: new Date().toISOString(),
                    modalita: 'fallback',
                    errore: errore || 'Database non disponibile',
                    avviso: 'Questa è un\'analisi dimostrativa con dati di esempio'
                }
            };
        },
        
        // ==============================================
        // NUOVE FUNZIONI AGGIUNTIVE
        // ==============================================
        
        /**
         * CARICA STORICO ANALISI SALVATE
         */
        caricaStoricoAnalisi: async function(limite = 10) {
            if (!window.db) return [];
            
            try {
                const snapshot = await window.db.collection('analisi')
                    .orderBy('timestamp', 'desc')
                    .limit(limite)
                    .get();
                
                return snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(),
                    timestamp: doc.data().timestamp ? doc.data().timestamp.toDate().toISOString() : new Date().toISOString()
                }));
            } catch (error) {
                console.error('Errore caricamento storico analisi:', error);
                return [];
            }
        },
        
        /**
         * ESPORTA ANALISI IN FORMATO JSON
         */
        esportaAnalisiJSON: function(analisi) {
            try {
                return JSON.stringify(analisi, null, 2);
            } catch (error) {
                console.error('Errore esportazione JSON:', error);
                return JSON.stringify({ errore: 'Impossibile esportare analisi' });
            }
        },
        
        /**
         * ESPORTA ANALISI IN FORMATO CSV
         */
        esportaAnalisiCSV: function(analisi) {
            try {
                const righe = [];
                
                // Intestazione
                righe.push(['Termine', 'Periodo', 'Occorrenze', 'Contesti', 'Trasformazioni']);
                
                // Dati classici
                righe.push([
                    analisi.termine,
                    'Classico',
                    analisi.analisi.classico.occorrenze,
                    Object.keys(analisi.analisi.classico.contesti).join(', '),
                    analisi.analisi.trasformazioni.filter(t => t.da === 'classico' || t.tipo === 'diminuzione').length
                ]);
                
                // Dati contemporanei
                righe.push([
                    analisi.termine,
                    'Contemporaneo',
                    analisi.analisi.contemporaneo.occorrenze,
                    Object.keys(analisi.analisi.contemporaneo.contesti).join(', '),
                    analisi.analisi.trasformazioni.filter(t => t.a === 'contemporaneo' || t.tipo === 'aumento').length
                ]);
                
                return righe.map(riga => riga.join(';')).join('\n');
            } catch (error) {
                console.error('Errore esportazione CSV:', error);
                return 'Errore nell\'esportazione';
            }
        },
        
        /**
         * CERCA TERMINI SIMILI PER ANALISI CORRELATA
         */
        cercaTerminiCorrelati: async function(termine) {
            const concetti = await this.loadConcetti();
            
            return concetti
                .filter(concetto => {
                    const parola = concetto.parola.toLowerCase();
                    const termineLower = termine.toLowerCase();
                    
                    // Escludi il termine stesso
                    if (parola === termineLower) return false;
                    
                    // Cerca similarità semantiche
                    const gruppiSemantici = {
                        verita: ['realtà', 'certezza', 'conoscenza', 'evidenza', 'sapere'],
                        potere: ['autorità', 'dominio', 'controllo', 'influenza', 'forza'],
                        etica: ['morale', 'virtù', 'valore', 'dovere', 'giustizia'],
                        essere: ['esistenza', 'essenza', 'sostanza', 'ente', 'realtà'],
                        conoscenza: ['scienza', 'sapere', 'comprensione', 'verità', 'ragione'],
                        libertà: ['autonomia', 'indipendenza', 'scelta', 'volontà']
                    };
                    
                    // Controlla se appartengono allo stesso gruppo
                    for (const [gruppo, termini] of Object.entries(gruppiSemantici)) {
                        if (termini.includes(termineLower) && termini.includes(parola)) {
                            return true;
                        }
                    }
                    
                    // Cerca similarità parziale nelle definizioni
                    if (concetto.definizione && concetto.definizione.toLowerCase().includes(termineLower)) {
                        return true;
                    }
                    
                    return false;
                })
                .slice(0, 5) // Massimo 5 termini correlati
                .map(c => ({
                    parola: c.parola,
                    definizione: c.definizione,
                    ambiti: c.ambiti
                }));
        },
        
        /**
         * GENERA REPORT SINTETICO DELL'ANALISI
         */
        generaReportSintetico: function(analisi) {
            const trasformazioniPrincipali = analisi.analisi.trasformazioni
                .filter(t => t.rilevanza === 'alta')
                .slice(0, 2);
            
            const contestiClassici = Object.keys(analisi.analisi.classico.contesti);
            const contestiContemporanei = Object.keys(analisi.analisi.contemporaneo.contesti);
            
            return {
                titolo: `Analisi Comparativa: "${analisi.termine}"`,
                sintesi: `Il termine "${analisi.termine}" mostra una trasformazione significativa dal pensiero classico a quello contemporaneo.`,
                puntiChiave: [
                    `Occorrenze: ${analisi.analisi.metriche.occorrenze.classico} (classico) vs ${analisi.analisi.metriche.occorrenze.contemporaneo} (contemporaneo)`,
                    `Contesti principali nel classico: ${contestiClassici.join(', ')}`,
                    `Contesti principali nel contemporaneo: ${contestiContemporanei.join(', ')}`,
                    `Trasformazioni identificate: ${trasformazioniPrincipali.length} di alta rilevanza`
                ],
                conclusioni: trasformazioniPrincipali.map(t => 
                    `Da ${t.da || 'diminuzione'} a ${t.a || 'aumento'}: ${t.descrizione || t.significato}`
                )
            };
        }
    };
    
    // Setup real-time listeners per aggiornamenti in tempo reale
    window.setupFirestoreListeners = function() {
        if (!window.db) {
            console.warn('Impossibile attivare listeners: Firestore non inizializzato');
            return;
        }
        
        console.log('👂 Attivazione Firestore listeners...');
        
        // Listener per filosofi
        window.filosofiListener = window.db.collection('filosofi')
            .onSnapshot((snapshot) => {
                const filosofi = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                window.dispatchEvent(new CustomEvent('filosofi-updated', { 
                    detail: { 
                        filosofi, 
                        count: filosofi.length,
                        timestamp: new Date().toISOString()
                    } 
                }));
                console.log(`📊 Filosofi aggiornati: ${filosofi.length} documenti`);
            }, (error) => {
                console.error('❌ Errore listener filosofi:', error);
            });
        
        // Listener per opere
        window.opereListener = window.db.collection('opere')
            .onSnapshot((snapshot) => {
                const opere = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                window.dispatchEvent(new CustomEvent('opere-updated', { 
                    detail: { 
                        opere, 
                        count: opere.length,
                        timestamp: new Date().toISOString()
                    } 
                }));
                console.log(`📚 Opere aggiornate: ${opere.length} documenti`);
            }, (error) => {
                console.error('❌ Errore listener opere:', error);
            });
        
        // Listener per concetti
        window.concettiListener = window.db.collection('concetti')
            .onSnapshot((snapshot) => {
                const concetti = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                window.dispatchEvent(new CustomEvent('concetti-updated', { 
                    detail: { 
                        concetti, 
                        count: concetti.length,
                        timestamp: new Date().toISOString()
                    } 
                }));
                console.log(`💡 Concetti aggiornati: ${concetti.length} documenti`);
            }, (error) => {
                console.error('❌ Errore listener concetti:', error);
            });
        
        // Listener per analisi (solo ultime 5)
        window.analisiListener = window.db.collection('analisi')
            .orderBy('timestamp', 'desc')
            .limit(5)
            .onSnapshot((snapshot) => {
                const analisi = snapshot.docs.map(doc => ({ 
                    id: doc.id, 
                    ...doc.data(),
                    timestamp: doc.data().timestamp ? doc.data().timestamp.toDate().toISOString() : new Date().toISOString()
                }));
                window.dispatchEvent(new CustomEvent('analisi-updated', { 
                    detail: { 
                        analisi, 
                        count: analisi.length,
                        timestamp: new Date().toISOString()
                    } 
                }));
                console.log(`📈 Analisi aggiornate: ${analisi.length} documenti`);
            }, (error) => {
                console.error('❌ Errore listener analisi:', error);
            });
        
        console.log('✅ Firestore listeners attivati');
    };
    
    // Setup listeners quando il DOM è pronto
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (window.firebaseInitialized && window.db) {
                    window.setupFirestoreListeners();
                }
            }, 1000);
        });
    } else {
        setTimeout(() => {
            if (window.firebaseInitialized && window.db) {
                window.setupFirestoreListeners();
            }
        }, 1000);
    }
    
} else {
    console.log('✅ Firebase già inizializzato per Aeterna Lexicon in Motu');
}

// Funzioni globali per compatibilità con app.js esistente
window.firebaseUtils = {
    // Verifica se Firebase è inizializzato
    isInitialized: function() {
        return !!window.firebaseInitialized && !!window.db;
    },
    
    // Ottieni configurazione
    getConfig: function() {
        return {
            projectId: 'aeterna-lexicon-in-motu',
            projectName: 'Aeterna Lexicon in Motu',
            collections: ['filosofi', 'opere', 'concetti', 'analytics', 'analisi'],
            version: '3.0.0',
            struttura: {
                filosofi: ['nome', 'scuola', 'periodo', 'luogo_nascita', 'coordinate', 'ritratto', 'biografia'],
                opere: ['titolo', 'autore_id', 'autore_nome', 'anno', 'periodo', 'sintesi', 'lingua', 'pdf_url'],
                concetti: ['parola', 'definizione', 'autore_riferimento', 'opera_riferimento', 'periodo_storico']
            }
        };
    },
    
    // Test connessione Firebase
    testConnection: async function() {
        if (!window.db) return { 
            connected: false, 
            error: 'Firestore non inizializzato',
            timestamp: new Date().toISOString()
        };
        
        try {
            const startTime = Date.now();
            const testDoc = await window.db.collection('analytics').doc('connection_test').get();
            const latency = Date.now() - startTime;
            
            // Crea documento test se non esiste
            if (!testDoc.exists) {
                await window.db.collection('analytics').doc('connection_test').set({
                    test: true,
                    firstTest: new Date().toISOString(),
                    project: 'Aeterna Lexicon in Motu'
                });
            }
            
            return {
                connected: true,
                latency: latency + 'ms',
                timestamp: new Date().toISOString(),
                project: 'Aeterna Lexicon in Motu',
                collections: await this.getAvailableCollections()
            };
        } catch (error) {
            return {
                connected: false,
                error: error.message,
                timestamp: new Date().toISOString(),
                suggestion: 'Verifica la connessione internet e le regole di sicurezza Firestore'
            };
        }
    },
    
    // Ottieni collezioni disponibili
    getAvailableCollections: async function() {
        if (!window.db) return [];
        
        try {
            // Questa è una semplificazione - in realtà bisognerebbe avere una lista
            // o usare una funzione Cloud per ottenere le collezioni
            return ['filosofi', 'opere', 'concetti', 'analytics', 'analisi'];
        } catch (error) {
            console.error('Errore ottenimento collezioni:', error);
            return [];
        }
    },
    
    // Backup dati locali a Firebase (se online)
    syncLocalData: async function() {
        if (!window.db || !navigator.onLine) {
            return { 
                synced: false, 
                reason: 'Offline o DB non disponibile',
                timestamp: new Date().toISOString()
            };
        }
        
        try {
            // Sincronizza dati locali se presenti
            const localFilosofi = JSON.parse(localStorage.getItem('local_filosofi') || '[]');
            const localOpere = JSON.parse(localStorage.getItem('local_opere') || '[]');
            const localConcetti = JSON.parse(localStorage.getItem('local_concetti') || '[]');
            
            let syncedCount = 0;
            let errors = [];
            
            // Sincronizza filosofi
            for (const filosofo of localFilosofi) {
                if (filosofo.id && filosofo.id.startsWith('local_')) {
                    try {
                        await window.firebaseHelpers.saveFilosofo(filosofo);
                        syncedCount++;
                    } catch (error) {
                        errors.push(`Filosofo ${filosofo.nome}: ${error.message}`);
                    }
                }
            }
            
            // Sincronizza opere
            for (const opera of localOpere) {
                if (opera.id && opera.id.startsWith('local_')) {
                    try {
                        await window.firebaseHelpers.saveOpera(opera);
                        syncedCount++;
                    } catch (error) {
                        errors.push(`Opera ${opera.titolo}: ${error.message}`);
                    }
                }
            }
            
            // Sincronizza concetti
            for (const concetto of localConcetti) {
                if (concetto.id && concetto.id.startsWith('local_')) {
                    try {
                        await window.firebaseHelpers.saveConcetto(concetto);
                        syncedCount++;
                    } catch (error) {
                        errors.push(`Concetto ${concetto.parola}: ${error.message}`);
                    }
                }
            }
            
            return {
                synced: errors.length === 0,
                count: syncedCount,
                errors: errors,
                timestamp: new Date().toISOString(),
                action: syncedCount > 0 ? 'cleanup' : 'none'
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
        try {
            const keys = ['local_filosofi', 'local_opere', 'local_concetti'];
            keys.forEach(key => localStorage.removeItem(key));
            console.log('🧹 Dati locali puliti dopo sync');
            return { cleaned: true, keys: keys };
        } catch (error) {
            console.error('Errore pulizia dati locali:', error);
            return { cleaned: false, error: error.message };
        }
    },
    
    // ==============================================
    // NUOVE FUNZIONI UTILITY PER ANALISI
    // ==============================================
    
    /**
     * INIZIALIZZA LE LIBRERIE DI ANALISI
     */
    initAnalisiLibraries: function() {
        console.log('📚 Inizializzazione librerie analisi...');
        
        // Carica linguistic-analysis.js se non è già caricato
        if (!window.LinguisticAnalysis && !document.querySelector('script[src*="linguistic-analysis"]')) {
            const script = document.createElement('script');
            script.src = 'linguistic-analysis.js';
            script.onload = () => console.log('✅ LinguisticAnalysis caricato');
            script.onerror = () => console.warn('⚠️ Impossibile caricare linguistic-analysis.js');
            document.head.appendChild(script);
        }
        
        // Carica timeline-evolution.js se non è già caricato
        if (!window.TimelineEvolution && !document.querySelector('script[src*="timeline-evolution"]')) {
            const script = document.createElement('script');
            script.src = 'timeline-evolution.js';
            script.onload = () => console.log('✅ TimelineEvolution caricato');
            script.onerror = () => console.warn('⚠️ Impossibile caricare timeline-evolution.js');
            document.head.appendChild(script);
        }
        
        // Carica chart.js per visualizzazioni
        if (!window.Chart && !document.querySelector('script[src*="chart.js"]')) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => console.log('📊 Chart.js caricato');
            document.head.appendChild(script);
        }
        
        console.log('✅ Librerie analisi inizializzate');
    },
    
    /**
     * VERIFICA DISPONIBILITÀ DATI PER ANALISI
     */
    checkAnalisiAvailability: async function() {
        if (!window.db) {
            return { 
                available: false, 
                reason: 'Database non connesso',
                timestamp: new Date().toISOString()
            };
        }
        
        try {
            const counts = await window.firebaseHelpers.getCounts();
            const hasData = counts.concetti > 0 && counts.opere > 0;
            
            return {
                available: hasData,
                reason: hasData ? 'Dati disponibili per analisi' : 'Dati insufficienti per analisi',
                counts: counts,
                raccomandazioni: !hasData ? [
                    'Aggiungi almeno 5 concetti nel database',
                    'Aggiungi almeno 10 opere con sintesi',
                    'Assicurati che le opere abbiano periodo "classico" o "contemporaneo"'
                ] : [],
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                available: false,
                reason: error.message,
                counts: { filosofi: 0, opere: 0, concetti: 0 },
                timestamp: new Date().toISOString()
            };
        }
    },
    
    /**
     * ANALISI DEMO PER TEST
     */
    runDemoAnalisi: async function() {
        console.log('🚀 Avvio analisi demo...');
        
        const terminiDemo = ['Verità', 'Potere', 'Essere', 'Etica', 'Conoscenza'];
        const termine = terminiDemo[Math.floor(Math.random() * terminiDemo.length)];
        
        try {
            const disponibilita = await this.checkAnalisiAvailability();
            
            if (!disponibilita.available && disponibilita.counts.concetti === 0) {
                console.log('📝 Database vuoto, uso dati dimostrativi');
                return {
                    success: true,
                    termine: termine,
                    modalita: 'dimostrativa',
                    risultato: window.firebaseHelpers.analisiFallback(termine),
                    note: 'Analisi basata su dati dimostrativi. Aggiungi dati reali al database per analisi accurate.'
                };
            }
            
            const risultato = await window.firebaseHelpers.analizzaTermineComparativo(termine);
            console.log(`📊 Analisi demo completata per: ${termine}`, risultato.analisi.metriche);
            
            return {
                success: true,
                termine: termine,
                modalita: 'reale',
                risultato: risultato,
                note: 'Analisi basata sui dati del database'
            };
        } catch (error) {
            console.error('Errore analisi demo:', error);
            return {
                success: false,
                termine: termine,
                modalita: 'fallback',
                errore: error.message,
                risultato: window.firebaseHelpers.analisiFallback(termine, error.message)
            };
        }
    },
    
    /**
     * VALIDA STRUTTURA DATABASE
     */
    validateDatabaseStructure: async function() {
        if (!window.db) {
            return { valid: false, error: 'Firestore non inizializzato' };
        }
        
        const risultati = {
            filosofi: { valid: false, campi: [], mancanti: [] },
            opere: { valid: false, campi: [], mancanti: [] },
            concetti: { valid: false, campi: [], mancanti: [] },
            timestamp: new Date().toISOString()
        };
        
        try {
            // Controlla collezioni esistenti
            const collections = ['filosofi', 'opere', 'concetti'];
            
            for (const collection of collections) {
                const snapshot = await window.db.collection(collection).limit(1).get();
                
                if (!snapshot.empty) {
                    const doc = snapshot.docs[0];
                    const data = doc.data();
                    const campiPresenti = Object.keys(data);
                    
                    risultati[collection].campi = campiPresenti;
                    risultati[collection].valid = true;
                    
                    // Verifica campi obbligatori
                    const campiObbligatori = {
                        filosofi: ['nome', 'periodo'],
                        opere: ['titolo', 'autore_nome', 'periodo'],
                        concetti: ['parola', 'periodo_storico']
                    };
                    
                    risultati[collection].mancanti = campiObbligatori[collection]
                        .filter(campo => !campiPresenti.includes(campo));
                    
                    if (risultati[collection].mancanti.length > 0) {
                        risultati[collection].valid = false;
                    }
                }
            }
            
            risultati.overall = Object.values(risultati)
                .filter(r => typeof r === 'object')
                .every(r => r.valid === true);
            
            return risultati;
            
        } catch (error) {
            console.error('Errore validazione struttura:', error);
            return { 
                valid: false, 
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    },
    
    /**
     * CREA DATI DI ESEMPIO
     */
    createSampleData: async function() {
        if (!window.db) {
            return { created: false, error: 'Database non disponibile' };
        }
        
        try {
            const sampleData = {
                filosofi: [
                    {
                        nome: "Platone",
                        scuola: "Accademia",
                        periodo: "classico",
                        luogo_nascita: "Atene",
                        coordinate: { lat: 37.9838, lng: 23.7275 },
                        ritratto: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/Plato_Silanion_Musei_Capitolini_MC1377.jpg/220px-Plato_Silanion_Musei_Capitolini_MC1377.jpg",
                        biografia: "Filosofo greco antico, allievo di Socrate e maestro di Aristotele.",
                        data_nascita: "428/427 a.C.",
                        data_morte: "348/347 a.C.",
                        scuole_correlate: ["Socratici", "Platonismo"],
                        concetti_principali: ["Idee", "Bene", "Anima"]
                    },
                    {
                        nome: "Michel Foucault",
                        scuola: "Post-strutturalismo",
                        periodo: "contemporaneo",
                        luogo_nascita: "Poitiers, Francia",
                        coordinate: { lat: 46.5802, lng: 0.3404 },
                        ritratto: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Michel_Foucault.jpg/220px-Michel_Foucault.jpg",
                        biografia: "Filosofo, storico, sociologo e psicologo francese.",
                        data_nascita: "15 ottobre 1926",
                        data_morte: "25 giugno 1984",
                        scuole_correlate: ["Strutturalismo", "Post-strutturalismo"],
                        concetti_principali: ["Potere", "Sapere", "Disciplina"]
                    }
                ],
                opere: [
                    {
                        titolo: "La Repubblica",
                        autore_id: "", // Sarà popolato dopo
                        autore_nome: "Platone",
                        anno: "380 a.C.",
                        periodo: "classico",
                        sintesi: "Dialogo sulla giustizia e sull'organizzazione dello Stato ideale.",
                        lingua: "greco antico",
                        pdf_url: "",
                        concetti: ["Giustizia", "Bene", "Stato", "Filosofo"],
                        pagine: 416,
                        editore: ""
                    },
                    {
                        titolo: "Sorvegliare e punire",
                        autore_id: "", // Sarà popolato dopo
                        autore_nome: "Michel Foucault",
                        anno: "1975",
                        periodo: "contemporaneo",
                        sintesi: "Analisi delle istituzioni disciplinari e del potere nella società moderna.",
                        lingua: "francese",
                        pdf_url: "",
                        concetti: ["Potere", "Disciplina", "Sorveglianza", "Punizione"],
                        pagine: 328,
                        isbn: "978-8806145784",
                        editore: "Einaudi"
                    }
                ],
                concetti: [
                    {
                        parola: "Verità",
                        definizione: "Corrispondenza tra pensiero e realtà, o proprietà di un enunciato che dice come stanno le cose.",
                        definizione_en: "Correspondence between thought and reality, or property of a statement that says how things are.",
                        autore_riferimento: "Aristotele",
                        opera_riferimento: "Metafisica",
                        periodo_storico: "classico",
                        sinonimi: ["Realtà", "Corrispondenza", "Fatto"],
                        ambiti: ["Epistemologia", "Ontologia", "Logica"]
                    },
                    {
                        parola: "Potere",
                        definizione: "Capacità di influenzare il comportamento degli altri o di determinare il corso degli eventi.",
                        definizione_en: "Ability to influence the behavior of others or determine the course of events.",
                        autore_riferimento: "Michel Foucault",
                        opera_riferimento: "Sorvegliare e punire",
                        periodo_storico: "contemporaneo",
                        sinonimi: ["Autorità", "Controllo", "Influenza"],
                        ambiti: ["Politica", "Sociologia", "Filosofia"]
                    }
                ]
            };
            
            let createdCount = 0;
            const errors = [];
            
            // Prima crea i filosofi per avere gli ID
            const filosofiIds = {};
            for (const filosofo of sampleData.filosofi) {
                try {
                    const result = await window.firebaseHelpers.saveFilosofo(filosofo);
                    if (result.success) {
                        filosofiIds[filosofo.nome] = result.id;
                        createdCount++;
                    }
                } catch (error) {
                    errors.push(`Filosofo ${filosofo.nome}: ${error.message}`);
                }
            }
            
            // Poi le opere con i corretti autore_id
            for (const opera of sampleData.opere) {
                try {
                    const operaConId = {
                        ...opera,
                        autore_id: filosofiIds[opera.autore_nome] || ""
                    };
                    const result = await window.firebaseHelpers.saveOpera(operaConId);
                    if (result.success) createdCount++;
                } catch (error) {
                    errors.push(`Opera ${opera.titolo}: ${error.message}`);
                }
            }
            
            // Infine i concetti
            for (const concetto of sampleData.concetti) {
                try {
                    const result = await window.firebaseHelpers.saveConcetto(concetto);
                    if (result.success) createdCount++;
                } catch (error) {
                    errors.push(`Concetto ${concetto.parola}: ${error.message}`);
                }
            }
            
            return {
                created: errors.length === 0,
                count: createdCount,
                errors: errors,
                timestamp: new Date().toISOString(),
                note: errors.length > 0 ? 'Alcuni dati potrebbero non essere stati creati' : 'Dati di esempio creati con successo'
            };
            
        } catch (error) {
            console.error('Errore creazione dati esempio:', error);
            return {
                created: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
};

// Evento globale per notificare quando Firebase è pronto
window.firebaseReady = new Promise((resolve) => {
    const checkFirebase = () => {
        if (window.firebaseInitialized && window.db) {
            // Inizializza le librerie di analisi
            setTimeout(() => {
                window.firebaseUtils.initAnalisiLibraries();
            }, 500);
            
            resolve({
                db: window.db,
                auth: window.auth,
                analytics: window.firebaseAnalytics,
                helpers: window.firebaseHelpers,
                utils: window.firebaseUtils,
                config: window.firebaseUtils.getConfig()
            });
        } else {
            setTimeout(checkFirebase, 100);
        }
    };
    checkFirebase();
});

// Notifica quando Firebase è pronto
window.firebaseReady.then((firebase) => {
    console.log('✅ Firebase completamente inizializzato per Aeterna Lexicon in Motu');
    console.log('📊 Funzioni analisi comparativa pronte');
    console.log('🎯 Versione: 3.0.0 - Struttura aggiornata');
    
    // Dispatches custom event
    window.dispatchEvent(new CustomEvent('firebase-ready', { 
        detail: firebase 
    }));
    
    // Track analytics event
    if (window.firebaseAnalytics) {
        window.firebaseAnalytics.logEvent('firebase_initialized', {
            project_id: 'aeterna-lexicon-in-motu',
            version: '3.0.0',
            timestamp: new Date().toISOString(),
            collections: ['filosofi', 'opere', 'concetti', 'analytics', 'analisi']
        });
    }
    
    // Verifica disponibilità analisi
    setTimeout(async () => {
        const disponibilita = await window.firebaseUtils.checkAnalisiAvailability();
        console.log('📈 Disponibilità analisi:', disponibilita);
        
        if (!disponibilita.available && disponibilita.counts.concetti === 0) {
            console.log('💡 Suggerimento: Usa firebaseUtils.createSampleData() per creare dati di esempio');
        }
    }, 3000);
    
    // Auto-test connessione
    setTimeout(async () => {
        const testResult = await window.firebaseUtils.testConnection();
        console.log('🔗 Test connessione Firebase:', testResult.connected ? '✅ Connesso' : '❌ Errore', 
                    testResult.latency ? `(${testResult.latency})` : '');
    }, 4000);
});

// Funzioni di compatibilità per vecchio codice
window.initFirebase = function() {
    console.log('⚠️ initFirebase() è deprecata, usa window.firebaseReady invece');
    return window.firebaseReady;
};

window.getFirebaseDB = function() {
    return window.db;
};

// Error handling globale per Firebase
window.addEventListener('error', function(event) {
    if (event.error && event.error.message && event.error.message.includes('firebase')) {
        console.error('🔥 Errore Firebase catturato:', event.error);
        
        // Invia errore a analytics se disponibile
        if (window.firebaseHelpers && window.firebaseHelpers.sendAnalytics) {
            window.firebaseHelpers.sendAnalytics({
                evento: 'firebase_error',
                errore: event.error.message,
                url: window.location.href,
                stack: event.error.stack
            });
        }
    }
});

// Export per moduli (se supportato)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        firebaseConfig: firebaseConfig,
        firebaseHelpers: window.firebaseHelpers,
        firebaseUtils: window.firebaseUtils
    };
}

console.log('🎉 Firebase Init v3.0.0 caricato con successo!');
[file content end]