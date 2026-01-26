// ==============================================
// EXCEL-WORKER.JS - MODIFICATO PER STRUTTURA AETERNA
// Gestione Import/Export Excel Allineata con la Mappa e Relazioni
// ==============================================

window.ExcelWorker = {
    // ================================
    // 1. ESPORTAZIONE DATI (Da DB a Excel)
    // ================================
    
    exportAllDataToExcel: async function() {
        try {
            showToast('Preparazione export dati completi...', 'info');
            
            const filosofi = await window.firebaseHelpers.loadFilosofi();
            const opere = await window.firebaseHelpers.loadOpere();
            const concetti = await window.firebaseHelpers.loadConcetti();
            
            // Crea workbook
            const wb = XLSX.utils.book_new();
            
            // 1. Sheet Filosofi (Appiattisce coordinate)
            const filosofiData = filosofi.map(f => ({
                ID: f.id,
                Nome: f.nome,
                LuogoNascita: f.luogo_nascita,
                Latitudine: f.coordinate ? f.coordinate.lat : '',
                Longitudine: f.coordinate ? f.coordinate.lng : '',
                Scuola: f.scuola,
                Periodo: f.periodo,
                Bibliografia: f.bibliografia,
                ImmagineURL: f.immagine_url
            }));
            const filosofiWS = XLSX.utils.json_to_sheet(filosofiData);
            XLSX.utils.book_append_sheet(wb, filosofiWS, "Filosofi");
            
            // 2. Sheet Opere (Risolve nome autore)
            const opereData = opere.map(o => ({
                ID: o.id,
                Titolo: o.titolo,
                TitoloInglese: o.titolo_en || '',
                NomeAutore: o.autore_nome || 'Sconosciuto', // Più leggibile dell'ID
                IDAutore: o.autore_id, // Utile per riferimento tecnico
                Anno: o.anno,
                PeriodoStorico: o.periodo,
                Abstract: o.abstract,
                LinguaOriginale: o.lingua_originale,
                URL_PDF: o.url_pdf || ''
            }));
            const opereWS = XLSX.utils.json_to_sheet(opereData);
            XLSX.utils.book_append_sheet(wb, opereWS, "Opere");
            
            // 3. Sheet Concetti
            const concettiData = concetti.map(c => ({
                ID: c.id,
                ParolaChiave: c.parola,
                ParolaInglese: c.parola_en || '',
                Definizione: c.definizione,
                DefinizioneInglese: c.definizione_en || '', // Nuovo campo
                Citazione: c.citazione,
                AutoreRiferimento: c.autore_riferimento_nome || '', // Se disponibile
                OperaRiferimento: c.opera_riferimento_titolo || '',   // Se disponibile
                PeriodoStorico: c.periodo_storico,
                EvoluzioneStorica: c.evoluzione_storica || ''
            }));
            const concettiWS = XLSX.utils.json_to_sheet(concettiData);
            XLSX.utils.book_append_sheet(wb, concettiWS, "Concetti");
            
            // Salva file
            XLSX.writeFile(wb, `Aeterna_Dataset_Completo_${new Date().toISOString().slice(0,10)}.xlsx`);
            showToast('Export completato con successo!', 'success');
            
        } catch (error) {
            console.error("Errore export:", error);
            showToast('Errore durante l\'export: ' + error.message, 'error');
        }
    },

    // ================================
    // 2. IMPORTAZIONE DATI (Da Excel a DB)
    // ================================

    handleFileImport: async function(collectionName, fileInput) {
        if (!fileInput.files || fileInput.files.length === 0) return;
        
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                showToast(`Analisi di ${jsonData.length} record in corso...`, 'info');
                
                let successCount = 0;
                let errorCount = 0;

                // Carichiamo dati ausiliari per le relazioni (solo se servono)
                let filosofiMap = {}; // Nome -> ID
                let opereMap = {};    // Titolo -> ID

                if (collectionName === 'opere' || collectionName === 'concetti') {
                    // Mappa Filosofi per trovare ID dal nome
                    const fSnap = await window.db.collection('filosofi').get();
                    fSnap.forEach(doc => filosofiMap[doc.data().nome.trim().toLowerCase()] = doc.id);
                }
                if (collectionName === 'concetti') {
                    // Mappa Opere
                    const oSnap = await window.db.collection('opere').get();
                    oSnap.forEach(doc => opereMap[doc.data().titolo.trim().toLowerCase()] = doc.id);
                }

                // Processa riga per riga
                for (let row of jsonData) {
                    try {
                        let docData = {};
                        
                        if (collectionName === 'filosofi') {
                            // MAPPING FILOSOFI
                            if (!row.Nome) throw new Error("Nome mancante");
                            
                            docData = {
                                nome: row.Nome,
                                luogo_nascita: row.LuogoNascita || '',
                                coordinate: {
                                    lat: parseFloat(row.Latitudine || 0),
                                    lng: parseFloat(row.Longitudine || 0)
                                },
                                scuola: row.Scuola || '',
                                periodo: row.Periodo || '',
                                bibliografia: row.Bibliografia || '',
                                immagine_url: row.ImmagineURL || '',
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            };

                        } else if (collectionName === 'opere') {
                            // MAPPING OPERE
                            if (!row.Titolo) throw new Error("Titolo mancante");
                            
                            // Cerca Autore ID dal Nome
                            let autoreId = row.IDAutore;
                            let autoreNome = row.NomeAutore;

                            if (!autoreId && row.NomeAutore) {
                                // Prova a trovarlo nella mappa
                                const foundId = filosofiMap[row.NomeAutore.trim().toLowerCase()];
                                if (foundId) autoreId = foundId;
                                else console.warn(`Autore non trovato: ${row.NomeAutore}`);
                            }

                            docData = {
                                titolo: row.Titolo,
                                titolo_en: row.TitoloInglese || '',
                                autore_id: autoreId || '',
                                autore_nome: autoreNome || '',
                                anno: row.Anno || '',
                                periodo: row.PeriodoStorico || '',
                                abstract: row.Abstract || '',
                                lingua_originale: row.LinguaOriginale || '',
                                url_pdf: row.URL_PDF || '',
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            };

                        } else if (collectionName === 'concetti') {
                            // MAPPING CONCETTI
                            if (!row.ParolaChiave) throw new Error("Parola Chiave mancante");

                            // Risoluzione Relazioni
                            let autoreId = '';
                            if (row.AutoreRiferimento) {
                                autoreId = filosofiMap[row.AutoreRiferimento.trim().toLowerCase()] || '';
                            }
                            
                            let operaId = '';
                            if (row.OperaRiferimento) {
                                operaId = opereMap[row.OperaRiferimento.trim().toLowerCase()] || '';
                            }

                            docData = {
                                parola: row.ParolaChiave,
                                parola_en: row.ParolaInglese || '',
                                definizione: row.Definizione || '',
                                definizione_en: row.DefinizioneInglese || '',
                                citazione: row.Citazione || '',
                                autore_riferimento_id: autoreId,
                                autore_riferimento_nome: row.AutoreRiferimento || '', // Backup display
                                opera_riferimento_id: operaId,
                                opera_riferimento_titolo: row.OperaRiferimento || '', // Backup display
                                periodo_storico: row.PeriodoStorico || '',
                                evoluzione_storica: row.EvoluzioneStorica || '',
                                timestamp: firebase.firestore.FieldValue.serverTimestamp()
                            };
                        }

                        // Salva su Firebase
                        await window.db.collection(collectionName).add(docData);
                        successCount++;

                    } catch (err) {
                        console.error("Errore riga import:", err, row);
                        errorCount++;
                    }
                }
                
                showToast(`Importazione completata: ${successCount} salvati, ${errorCount} errori.`, successCount > 0 ? 'success' : 'error');
                
                // Aggiorna UI
                setTimeout(() => location.reload(), 1500);

            } catch (error) {
                console.error(error);
                showToast("Errore lettura file Excel", "error");
            }
        };
        
        reader.readAsArrayBuffer(file);
    },

    // ================================
    // 3. SCARICA TEMPLATE (Vuoti)
    // ================================
    downloadTemplate: function(collectionName) {
        let headers = [];
        let filename = "";

        if (collectionName === 'filosofi') {
            headers = [{"Nome": "Esempio: Platone", "LuogoNascita": "Atene", "Latitudine": 37.98, "Longitudine": 23.72, "Scuola": "Accademia", "Periodo": "Classico", "Bibliografia": "", "ImmagineURL": ""}];
            filename = "Template_Filosofi.xlsx";
        } else if (collectionName === 'opere') {
            headers = [{"Titolo": "La Repubblica", "TitoloInglese": "The Republic", "NomeAutore": "Platone", "Anno": "-375", "PeriodoStorico": "Classico", "Abstract": "Descrizione...", "LinguaOriginale": "Greco Antico", "URL_PDF": ""} ];
            filename = "Template_Opere.xlsx";
        } else if (collectionName === 'concetti') {
            headers = [{"ParolaChiave": "Idea", "ParolaInglese": "Form/Idea", "Definizione": "Concetto eterno...", "DefinizioneInglese": "Eternal concept...", "Citazione": "...", "AutoreRiferimento": "Platone", "OperaRiferimento": "La Repubblica", "PeriodoStorico": "Classico", "EvoluzioneStorica": "Nel medioevo diventa..."}];
            filename = "Template_Concetti.xlsx";
        }

        const ws = XLSX.utils.json_to_sheet(headers);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, filename);
    }
};

// Inizializzazione Globale
console.log('✅ Excel Worker Aeterna Caricato');