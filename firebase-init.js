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
    
    // Initialize Firebase
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
    console.log('Database: Firestore con collezioni [filosofi, opere, concetti, analytics, analisi]');
    
    // Funzioni helper per il database
    window.firebaseHelpers = {
        // ==============================================
        // FUNZIONI BASE CRUD
        // ==============================================
        
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
        },
        
        // ==============================================
        // ANALISI COMPARATIVA
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
                const occorrenzeClassiche = this.estraiOccorrenzeTermine(termine, opereClassiche);
                const occorrenzeContemporanee = this.estraiOccorrenzeTermine(termine, opereContemporanee);
                
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
                    timestamp: new Date().toISOString(),
                    metriche,
                    trasformazioni: trasformazioni.length
                });
                
                // 9. RESTITUISCI RISULTATO COMPLETO
                const risultato = {
                    termine: concetto.parola,
                    definizione: concetto.definizione || '',
                    definizioneInglese: concetto.definizione_en || '',
                    periodo: concetto.periodo || 'entrambi',
                    
                    analisi: {
                        classico: {
                            opereAnalizzate: opereClassiche.length,
                            occorrenze: occorrenzeClassiche.length,
                            contesti: contestiClassici,
                            esempi: occorrenzeClassiche.slice(0, 3)
                        },
                        
                        contemporaneo: {
                            opereAnalizzate: opereContemporanee.length,
                            occorrenze: occorrenzeContemporanee.length,
                            contesti: contestiContemporanei,
                            esempi: occorrenzeContemporanee.slice(0, 3)
                        },
                        
                        timeline: timeline,
                        trasformazioni: trasformazioni,
                        metriche: metriche
                    },
                    
                    metadata: {
                        analizzatoIl: new Date().toISOString(),
                        tempoElaborazione: Date.now(),
                        versioneAnalisi: '1.0.0'
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
        estraiOccorrenzeTermine: function(termine, opere) {
            const occorrenze = [];
            const termineLower = termine.toLowerCase();
            
            opere.forEach(opera => {
                // Cerca nel titolo
                if (opera.titolo && opera.titolo.toLowerCase().includes(termineLower)) {
                    occorrenze.push({
                        tipo: 'titolo',
                        id: opera.id,
                        titolo: opera.titolo,
                        autore: opera.autore || 'Autore sconosciuto',
                        anno: this.estraiAnnoNumerico(opera.anno),
                        periodo: opera.periodo || 'sconosciuto',
                        testo: opera.titolo,
                        contesto: 'titolo'
                    });
                }
                
                // Cerca nella sintesi/abstract
                if (opera.sintesi && opera.sintesi.toLowerCase().includes(termineLower)) {
                    const posizione = opera.sintesi.toLowerCase().indexOf(termineLower);
                    const estratto = this.estraiContestoTestuale(opera.sintesi, posizione, termine.length, 100);
                    
                    occorrenze.push({
                        tipo: 'sintesi',
                        id: opera.id,
                        titolo: opera.titolo,
                        autore: opera.autore || 'Autore sconosciuto',
                        anno: this.estraiAnnoNumerico(opera.anno),
                        periodo: opera.periodo || 'sconosciuto',
                        testo: estratto,
                        contesto: this.inferisciContesto(opera.sintesi)
                    });
                }
                
                // Cerca nei concetti trattati
                if (opera.concetti) {
                    const concettiArray = Array.isArray(opera.concetti) 
                        ? opera.concetti
                        : opera.concetti.split(',').map(c => c.trim());
                    
                    if (concettiArray.some(c => c.toLowerCase().includes(termineLower))) {
                        occorrenze.push({
                            tipo: 'concetto',
                            id: opera.id,
                            titolo: opera.titolo,
                            autore: opera.autore || 'Autore sconosciuto',
                            anno: this.estraiAnnoNumerico(opera.anno),
                            periodo: opera.periodo || 'sconosciuto',
                            testo: `Opera tratta il concetto di "${termine}"`,
                            contesto: 'concettuale'
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
                ontologico: ['essere', 'esistenza', 'realtà', 'sostanza', 'essenza', 'ente'],
                epistemico: ['conoscenza', 'verità', 'scienza', 'ragione', 'esperienza', 'certezza'],
                etico: ['bene', 'male', 'morale', 'virtù', 'dovere', 'felicità', 'giustizia'],
                politico: ['potere', 'stato', 'società', 'libertà', 'autorità', 'democrazia'],
                estetico: ['bello', 'arte', 'creatività', 'percezione', 'gusto'],
                metafisico: ['dio', 'spirito', 'anima', 'trascendente', 'assoluto'],
                linguistico: ['linguaggio', 'segno', 'significato', 'discorso', 'comunicazione']
            };
            
            occorrenze.forEach(occ => {
                const testo = (occ.testo || '').toLowerCase();
                let contestoIdentificato = 'altro';
                
                for (const [contesto, parole] of Object.entries(paroleChiave)) {
                    if (parole.some(parola => testo.includes(parola))) {
                        contestoIdentificato = contesto;
                        break;
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
                const chiave = `${secolo}`;
                
                if (!timelinePerSecolo[chiave]) {
                    timelinePerSecolo[chiave] = {
                        secolo: secolo,
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
            
            // Converti in array e ordina
            return Object.values(timelinePerSecolo)
                .sort((a, b) => a.secolo - b.secolo)
                .slice(0, 10)
                .map(item => ({
                    secolo: `${item.secolo}-${item.secolo + 99}`,
                    periodo: item.periodo,
                    autori: Array.from(item.autori).slice(0, 3),
                    opere: Array.from(item.opere).slice(0, 2),
                    occorrenze: item.occorrenze
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
            
            // Calcola variazioni percentuali
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
                    
                    // Identifica trasformazioni significative
                    if (Math.abs(variazione) > 20) {
                        trasformazioni.push({
                            tipo: variazione > 0 ? 'aumento' : 'diminuzione',
                            contesto: contesto,
                            variazione: Math.abs(variazione).toFixed(1) + '%',
                            significato: variazione > 0 
                                ? `Il termine diventa più ${contesto} nel pensiero contemporaneo`
                                : `Il termine perde centralità ${contesto} nel pensiero contemporaneo`
                        });
                    }
                }
            });
            
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
                }
            ];
            
            // Aggiungi trasformazioni dalla mappa
            mappeTrasformazioni.forEach(mappa => {
                if (contestiClassici[mappa.da] && contestiContemporanei[mappa.a]) {
                    trasformazioni.push({
                        tipo: 'trasformazione',
                        da: mappa.da,
                        a: mappa.a,
                        descrizione: mappa.descrizione,
                        esempio: mappa.esempio
                    });
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
            
            return {
                occorrenze: {
                    classico: totaleClassico,
                    contemporaneo: totaleContemporaneo,
                    totale: totale,
                    rapporto: totaleClassico > 0 ? (totaleContemporaneo / totaleClassico).toFixed(2) : '0.00'
                },
                contesti: {
                    classico: Object.keys(classicoContesti).length,
                    contemporaneo: Object.keys(contemporaneoContesti).length,
                    unici: [...new Set([
                        ...Object.keys(classicoContesti),
                        ...Object.keys(contemporaneoContesti)
                    ])].length
                },
                intensita: {
                    classico: totaleClassico > 0 ? (totaleClassico / 100).toFixed(2) : '0.00',
                    contemporaneo: totaleContemporaneo > 0 ? (totaleContemporaneo / 100).toFixed(2) : '0.00'
                }
            };
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
                    timestamp: new Date().toISOString()
                });
                console.log('✅ Analisi salvata nel database');
                return true;
            } catch (error) {
                console.warn('Non è stato possibile salvare l\'analisi:', error.message);
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
                    if (testoAnno.toLowerCase().includes('a.c')) {
                        anno = -anno;
                    }
                    
                    return anno;
                }
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
            
            if (testoLower.includes('politic') || testoLower.includes('potere')) return 'politico';
            if (testoLower.includes('etic') || testoLower.includes('moral')) return 'etico';
            if (testoLower.includes('essere') || testoLower.includes('realtà') || testoLower.includes('esistenza')) return 'ontologico';
            if (testoLower.includes('conoscenza') || testoLower.includes('verità') || testoLower.includes('scienza')) return 'epistemico';
            if (testoLower.includes('bello') || testoLower.includes('arte')) return 'estetico';
            if (testoLower.includes('dio') || testoLower.includes('spirito')) return 'metafisico';
            if (testoLower.includes('linguaggio') || testoLower.includes('parola')) return 'linguistico';
            
            return 'altro';
        },
        
        /**
         * ESTRATTO DI TESTO CON CONTESTO
         */
        estraiContestoTestuale: function(testo, posizione, lunghezzaTermine, lunghezzaContesto) {
            if (!testo || posizione === -1) return '';
            
            const inizio = Math.max(0, posizione - lunghezzaContesto);
            const fine = Math.min(testo.length, posizione + lunghezzaTermine + lunghezzaContesto);
            
            let estratto = testo.substring(inizio, fine);
            
            // Aggiunge ellissi se non è all'inizio/fine
            if (inizio > 0) estratto = '...' + estratto;
            if (fine < testo.length) estratto = estratto + '...';
            
            return estratto;
        },
        
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
                
                return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            } catch (error) {
                console.error('Errore caricamento storico analisi:', error);
                return [];
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
                        verita: ['realtà', 'certezza', 'conoscenza', 'evidenza'],
                        potere: ['autorità', 'dominio', 'controllo', 'influenza'],
                        etica: ['morale', 'virtù', 'valore', 'dovere'],
                        essere: ['esistenza', 'essenza', 'sostanza', 'ente']
                    };
                    
                    // Controlla se appartengono allo stesso gruppo
                    for (const [gruppo, termini] of Object.entries(gruppiSemantici)) {
                        if (termini.includes(termineLower) && termini.includes(parola)) {
                            return true;
                        }
                    }
                    
                    return false;
                })
                .slice(0, 5)
                .map(c => c.parola);
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
                            { autore: 'Aristotele', opera: 'Metafisica', testo: 'Dire di ciò che è che non è, o di ciò che non è che è, è falso...' }
                        ]
                    },
                    contemporaneo: {
                        occorrenze: 18,
                        contesti: { politico: 10, linguistico: 8 },
                        esempi: [
                            { autore: 'Foucault', opera: 'L\'ordine del discorso', testo: 'La verità non è al di fuori del potere...' }
                        ]
                    }
                },
                potere: {
                    classico: {
                        occorrenze: 8,
                        contesti: { ontologico: 6, politico: 2 },
                        esempi: [
                            { autore: 'Platone', opera: 'La Repubblica', testo: 'Il potere deve essere esercitato dai filosofi...' }
                        ]
                    },
                    contemporaneo: {
                        occorrenze: 24,
                        contesti: { politico: 15, sociale: 9 },
                        esempi: [
                            { autore: 'Foucault', opera: 'Sorvegliare e punire', testo: 'Il potere non è un\'istituzione, non è una struttura...' }
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
                        { tipo: 'trasformazione', da: 'ontologico', a: 'politico', descrizione: 'Da concetto metafisico a strumento di analisi sociale' }
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
                    errore: errore || 'Database non disponibile'
                }
            };
        }
    };
    
    // Setup real-time listeners
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
    console.log('Firebase già inizializzato per Aeterna Lexicon in Motu');
}

// Funzioni globali per compatibilità
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
            collections: ['filosofi', 'opere', 'concetti', 'analytics', 'analisi'],
            version: '2.0.0'
        };
    },
    
    // Test connessione Firebase
    testConnection: async function() {
        if (!window.db) return { connected: false, error: 'Firestore non inizializzato' };
        
        try {
            const startTime = Date.now();
            await window.db.collection('analytics').limit(1).get();
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
    },
    
    /**
     * VERIFICA DISPONIBILITÀ DATI PER ANALISI
     */
    checkAnalisiAvailability: async function() {
        if (!window.db) {
            return { available: false, reason: 'Database non connesso' };
        }
        
        try {
            const counts = await window.firebaseHelpers.getCounts();
            const hasData = counts.concetti > 0 && counts.opere > 0;
            
            return {
                available: hasData,
                reason: hasData ? 'Dati disponibili' : 'Dati insufficienti',
                counts: counts
            };
        } catch (error) {
            return {
                available: false,
                reason: error.message,
                counts: { filosofi: 0, opere: 0, concetti: 0 }
            };
        }
    },
    
    /**
     * ANALISI DEMO PER TEST
     */
    runDemoAnalisi: async function() {
        console.log('🚀 Avvio analisi demo...');
        
        const terminiDemo = ['Verità', 'Potere', 'Etica', 'Essere'];
        const termine = terminiDemo[Math.floor(Math.random() * terminiDemo.length)];
        
        try {
            const risultato = await window.firebaseHelpers.analizzaTermineComparativo(termine);
            console.log(`📊 Analisi demo completata per: ${termine}`, risultato.analisi.metriche);
            
            return {
                success: true,
                termine: termine,
                risultato: risultato
            };
        } catch (error) {
            console.error('Errore analisi demo:', error);
            return {
                success: false,
                termine: termine,
                errore: error.message
            };
        }
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
    console.log('📊 Funzioni analisi comparativa pronte');
    
    window.dispatchEvent(new Event('firebase-ready'));
});