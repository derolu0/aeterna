// ==============================================
// EXCEL-WORKER.JS
// Gestione Import/Export Excel per Dataset Filosofico
// ==============================================

window.ExcelWorker = {
    // ================================
    // 1. ESPORTAZIONE DATI
    // ================================
    
    /**
     * Esporta tutti i dati in un unico file Excel
     */
    exportAllDataToExcel: async function() {
        try {
            showToast('Preparazione export dati completi...', 'info');
            
            const filosofi = await window.firebaseHelpers.loadFilosofi();
            const opere = await window.firebaseHelpers.loadOpere();
            const concetti = await window.firebaseHelpers.loadConcetti();
            
            // Crea workbook con multiple sheets
            const wb = XLSX.utils.book_new();
            
            // Sheet Filosofi
            const filosofiData = this.prepareFilosofiForExport(filosofi);
            const filosofiWS = XLSX.utils.json_to_sheet(filosofiData);
            XLSX.utils.book_append_sheet(wb, filosofiWS, "Filosofi");
            
            // Sheet Opere
            const opereData = this.prepareOpereForExport(opere);
            const opereWS = XLSX.utils.json_to_sheet(opereData);
            XLSX.utils.book_append_sheet(wb, opereWS, "Opere");
            
            // Sheet Concetti
            const concettiData = this.prepareConcettiForExport(concetti);
            const concettiWS = XLSX.utils.json_to_sheet(concettiData);
            XLSX.utils.book_append_sheet(wb, concettiWS, "Concetti");
            
            // Sheet Analisi (nuovo!)
            const analisiData = this.generateAnalisiSheet(filosofi, opere, concetti);
            const analisiWS = XLSX.utils.json_to_sheet(analisiData);
            XLSX.utils.book_append_sheet(wb, analisiWS, "Analisi");
            
            // Genera nome file con data
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `AeternaLexicon_Export_${dateStr}.xlsx`;
            
            // Salva file
            XLSX.writeFile(wb, filename);
            
            showToast(`Dati esportati in ${filename}`, 'success');
            
            // Traccia analytics
            if (window.Analytics) {
                window.Analytics.trackEvent('export', 'all_data', null, null, {
                    filosofi_count: filosofi.length,
                    opere_count: opere.length,
                    concetti_count: concetti.length
                });
            }
            
            return filename;
            
        } catch (error) {
            console.error('Errore export dati:', error);
            showToast('Errore durante l\'export: ' + error.message, 'error');
            return null;
        }
    },
    
    /**
     * Esporta dati specifici per collezione
     */
    exportDataToExcel: async function(collectionName) {
        try {
            let data = [];
            let sheetName = '';
            
            switch(collectionName) {
                case 'filosofi':
                    data = await window.firebaseHelpers.loadFilosofi();
                    sheetName = 'Filosofi';
                    break;
                case 'opere':
                    data = await window.firebaseHelpers.loadOpere();
                    sheetName = 'Opere';
                    break;
                case 'concetti':
                    data = await window.firebaseHelpers.loadConcetti();
                    sheetName = 'Concetti';
                    break;
                default:
                    throw new Error('Collezione non valida');
            }
            
            if (data.length === 0) {
                showToast('Nessun dato da esportare', 'warning');
                return null;
            }
            
            // Prepara dati per export
            const exportData = this[`prepare${sheetName}ForExport`](data);
            
            // Crea workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            
            // Genera nome file
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `AeternaLexicon_${sheetName}_${dateStr}.xlsx`;
            
            // Salva file
            XLSX.writeFile(wb, filename);
            
            showToast(`${sheetName} esportati in ${filename}`, 'success');
            
            // Traccia analytics
            if (window.Analytics) {
                window.Analytics.trackEvent('export', collectionName, null, data.length);
            }
            
            return filename;
            
        } catch (error) {
            console.error(`Errore export ${collectionName}:`, error);
            showToast('Errore durante l\'export: ' + error.message, 'error');
            return null;
        }
    },
    
    // ================================
    // 2. IMPORT DATI
    // ================================
    
    /**
     * Gestisce import da file Excel
     */
    handleFileImport: async function(collectionName, files) {
        if (!files || files.length === 0) return;
        
        const file = files[0];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                showToast('Elaborazione file in corso...', 'info');
                
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Leggi il primo sheet
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Converti in JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    showToast('Il file è vuoto', 'warning');
                    return;
                }
                
                // Processa i dati in base alla collezione
                const processedData = this.processImportData(collectionName, jsonData);
                
                // Salva su Firebase
                const results = await this.saveImportedData(collectionName, processedData);
                
                // Mostra risultati
                this.showImportResults(results, collectionName);
                
                // Traccia analytics
                if (window.Analytics) {
                    window.Analytics.trackEvent('import', collectionName, null, processedData.length, {
                        success_count: results.success,
                        error_count: results.errors.length
                    });
                }
                
            } catch (error) {
                console.error('Errore import:', error);
                showToast('Errore durante l\'import: ' + error.message, 'error');
            }
        };
        
        reader.readAsArrayBuffer(file);
    },
    
    /**
     * Processa i dati importati
     */
    processImportData: function(collectionName, jsonData) {
        const processors = {
            'filosofi': this.processFilosofiImport,
            'opere': this.processOpereImport,
            'concetti': this.processConcettiImport
        };
        
        const processor = processors[collectionName];
        if (!processor) {
            throw new Error(`Processore non trovato per: ${collectionName}`);
        }
        
        return processor.call(this, jsonData);
    },
    
    /**
     * Salva dati importati su Firebase
     */
    saveImportedData: async function(collectionName, data) {
        const results = {
            success: 0,
            errors: [],
            total: data.length
        };
        
        // Batch size per non sovraccaricare Firebase
        const BATCH_SIZE = 5;
        
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
            const batch = data.slice(i, i + BATCH_SIZE);
            
            const batchPromises = batch.map(async (item, index) => {
                try {
                    let result;
                    
                    switch(collectionName) {
                        case 'filosofi':
                            result = await window.firebaseHelpers.saveFilosofo(item);
                            break;
                        case 'opere':
                            result = await window.firebaseHelpers.saveOpera(item);
                            break;
                        case 'concetti':
                            result = await window.firebaseHelpers.saveConcetto(item);
                            break;
                    }
                    
                    if (result && result.success) {
                        results.success++;
                        return { success: true, item: item.nome || item.titolo || item.parola };
                    } else {
                        throw new Error(result?.error || 'Errore sconosciuto');
                    }
                    
                } catch (error) {
                    results.errors.push({
                        item: item.nome || item.titolo || item.parola || `Item ${i + index + 1}`,
                        error: error.message
                    });
                    return { success: false, error: error.message };
                }
            });
            
            // Attendi il batch corrente
            await Promise.all(batchPromises);
            
            // Aggiorna progresso
            const progress = Math.round(((i + batch.length) / data.length) * 100);
            showToast(`Import in corso: ${progress}%`, 'info');
        }
        
        return results;
    },
    
    // ================================
    // 3. TEMPLATE DOWNLOAD
    // ================================
    
    /**
     * Scarica template Excel per collezione
     */
    downloadTemplate: function(collectionName) {
        const templates = {
            'filosofi': this.getFilosofiTemplate(),
            'opere': this.getOpereTemplate(),
            'concetti': this.getConcettiTemplate(),
            'analisi': this.getAnalisiTemplate()
        };
        
        const templateData = templates[collectionName];
        if (!templateData) {
            showToast('Template non disponibile', 'error');
            return;
        }
        
        // Crea workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(templateData.data);
        
        // Aggiungi intestazioni
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_col(C) + "1";
            if (!ws[address]) continue;
            
            // Stile intestazione
            ws[address].s = {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: "3B82F6" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
        }
        
        // Imposta larghezza colonne
        if (templateData.colWidths) {
            ws['!cols'] = templateData.colWidths;
        }
        
        XLSX.utils.book_append_sheet(wb, ws, templateData.sheetName);
        
        // Salva file
        const filename = `Template_${templateData.sheetName}_AeternaLexicon.xlsx`;
        XLSX.writeFile(wb, filename);
        
        showToast(`Template ${templateData.sheetName} scaricato`, 'success');
        
        // Traccia analytics
        if (window.Analytics) {
            window.Analytics.trackEvent('template', 'downloaded', collectionName);
        }
    },
    
    // ================================
    // 4. ESPORTAZIONE ANALISI
    // ================================
    
    /**
     * Esporta analisi comparativa di un termine
     */
    exportAnalisiComparativa: async function(termine, analisiData) {
        try {
            if (!analisiData) {
                showToast('Nessun dato analisi da esportare', 'warning');
                return null;
            }
            
            // Crea workbook con multiple sheets
            const wb = XLSX.utils.book_new();
            
            // Sheet 1: Sintesi Analisi
            const sintesiData = this.prepareSintesiAnalisi(termine, analisiData);
            const sintesiWS = XLSX.utils.json_to_sheet(sintesiData);
            XLSX.utils.book_append_sheet(wb, sintesiWS, "Sintesi");
            
            // Sheet 2: Timeline Evolutiva
            if (analisiData.timeline && analisiData.timeline.length > 0) {
                const timelineData = this.prepareTimelineForExport(analisiData.timeline);
                const timelineWS = XLSX.utils.json_to_sheet(timelineData);
                XLSX.utils.book_append_sheet(wb, timelineWS, "Timeline");
            }
            
            // Sheet 3: Confronto Periodi
            const confrontoData = this.prepareConfrontoForExport(analisiData);
            const confrontoWS = XLSX.utils.json_to_sheet(confrontoData);
            XLSX.utils.book_append_sheet(wb, confrontoWS, "Confronto");
            
            // Sheet 4: Trasformazioni Identificate
            if (analisiData.trasformazioni && analisiData.trasformazioni.length > 0) {
                const trasformazioniData = this.prepareTrasformazioniForExport(analisiData.trasformazioni);
                const trasformazioniWS = XLSX.utils.json_to_sheet(trasformazioniData);
                XLSX.utils.book_append_sheet(wb, trasformazioniWS, "Trasformazioni");
            }
            
            // Sheet 5: Metriche Quantitative
            const metricheData = this.prepareMetricheForExport(analisiData);
            const metricheWS = XLSX.utils.json_to_sheet(metricheData);
            XLSX.utils.book_append_sheet(wb, metricheWS, "Metriche");
            
            // Genera nome file
            const dateStr = new Date().toISOString().split('T')[0];
            const safeTermine = termine.replace(/[^a-z0-9]/gi, '_');
            const filename = `Analisi_${safeTermine}_${dateStr}.xlsx`;
            
            // Salva file
            XLSX.writeFile(wb, filename);
            
            showToast(`Analisi "${termine}" esportata in ${filename}`, 'success');
            
            // Traccia analytics
            if (window.Analytics) {
                window.Analytics.trackEvent('export', 'analisi_comparativa', termine, null, {
                    timeline_count: analisiData.timeline?.length || 0,
                    trasformazioni_count: analisiData.trasformazioni?.length || 0
                });
            }
            
            return filename;
            
        } catch (error) {
            console.error('Errore export analisi:', error);
            showToast('Errore durante l\'export analisi: ' + error.message, 'error');
            return null;
        }
    },
    
    /**
     * Esporta dati analytics
     */
    exportAnalyticsData: function() {
        try {
            if (!window.Analytics || !window.Analytics.exportAnalyticsData) {
                showToast('Analytics non inizializzato', 'error');
                return null;
            }
            
            const filename = window.Analytics.exportAnalyticsData();
            showToast(`Dati analytics esportati in ${filename}`, 'success');
            return filename;
            
        } catch (error) {
            console.error('Errore export analytics:', error);
            showToast('Errore durante l\'export analytics: ' + error.message, 'error');
            return null;
        }
    },
    
    // ================================
    // 5. PREPARAZIONE DATI PER ESPORTAZIONE
    // ================================
    
    prepareFilosofiForExport: function(filosofi) {
        return filosofi.map(f => ({
            'ID': f.id || '',
            'Nome Completo': f.nome || '',
            'Nome (Inglese)': f.nome_en || '',
            'Periodo': f.periodo || '',
            'Scuola/Corrente': f.scuola || '',
            'Anni (Nascita-Morte)': f.anni || '',
            'Biografia': f.biografia || '',
            'Biografia (Inglese)': f.biografia_en || '',
            'Concetti Principali': Array.isArray(f.concetti_principali) ? f.concetti_principali.join(', ') : f.concetti_principali || '',
            'Luogo Nascita - Città': f.luogo_nascita?.citta || f.citta_nascita || '',
            'Luogo Nascita - Paese': f.luogo_nascita?.paese || f.paese_nascita || '',
            'Coordinate - Latitudine': f.luogo_nascita?.coordinate?.lat || f.latitudine || '',
            'Coordinate - Longitudine': f.luogo_nascita?.coordinate?.lng || f.longitudine || '',
            'URL Immagine': f.immagine || '',
            'Data Creazione': f.createdAt || new Date().toISOString(),
            'Data Aggiornamento': f.updatedAt || new Date().toISOString()
        }));
    },
    
    prepareOpereForExport: function(opere) {
        return opere.map(o => ({
            'ID': o.id || '',
            'Titolo': o.titolo || '',
            'Titolo (Inglese)': o.titolo_en || '',
            'Autore': o.autore || '',
            'Anno Pubblicazione': o.anno || '',
            'Periodo Storico': o.periodo || '',
            'Sintesi/Abstract': o.sintesi || '',
            'Sintesi (Inglese)': o.sintesi_en || '',
            'Concetti Trattati': Array.isArray(o.concetti) ? o.concetti.join(', ') : o.concetti || '',
            'Lingua Originale': o.lingua || 'Italiano',
            'URL PDF/Testo': o.pdf || '',
            'Testo Originale (Estratto)': o.testo_originale || '',
            'Contesto Principale': o.contesto || '',
            'Data Creazione': o.createdAt || new Date().toISOString(),
            'Data Aggiornamento': o.updatedAt || new Date().toISOString()
        }));
    },
    
    prepareConcettiForExport: function(concetti) {
        return concetti.map(c => ({
            'ID': c.id || '',
            'Parola Chiave': c.parola || '',
            'Parola (Inglese)': c.parola_en || '',
            'Definizione': c.definizione || '',
            'Definizione (Inglese)': c.definizione_en || '',
            'Citazione/Estratto': c.esempio || '',
            'Autore Riferimento': c.autore || '',
            'Opera di Riferimento': c.opera || '',
            'Periodo Storico': c.periodo || '',
            'Evoluzione Storica': c.evoluzione || '',
            'Definizione Periodo Classico': c.definizione_classico || '',
            'Definizione Periodo Contemporaneo': c.definizione_contemporaneo || '',
            'Contesti d\'Uso': Array.isArray(c.contesti) ? c.contesti.join(', ') : c.contesti || '',
            'Termini Correlati': Array.isArray(c.correlati) ? c.correlati.join(', ') : c.correlati || '',
            'Data Creazione': c.createdAt || new Date().toISOString(),
            'Data Aggiornamento': c.updatedAt || new Date().toISOString()
        }));
    },
    
    generateAnalisiSheet: function(filosofi, opere, concetti) {
        // Genera statistiche per analisi
        const stats = {
            'Metrica': 'Valore',
            'Filosofi Totali': filosofi.length,
            'Opere Totali': opere.length,
            'Concetti Totali': concetti.length,
            'Filosofi Classici': filosofi.filter(f => f.periodo === 'classico').length,
            'Filosofi Contemporanei': filosofi.filter(f => f.periodo === 'contemporaneo').length,
            'Opere Classiche': opere.filter(o => o.periodo === 'classico').length,
            'Opere Contemporanee': opere.filter(o => o.periodo === 'contemporaneo').length,
            'Concetti Analizzati': concetti.filter(c => c.definizione_classico && c.definizione_contemporaneo).length,
            'Data Esportazione': new Date().toISOString(),
            'Versione App': '2.0.0'
        };
        
        return [stats];
    },
    
    prepareSintesiAnalisi: function(termine, analisi) {
        return [{
            'Termine Analizzato': termine,
            'Data Analisi': new Date().toISOString(),
            'Definizione Generale': analisi.definizione || '',
            'Periodo Dominante': analisi.periodo || '',
            'Occorrenze Classiche': analisi.analisi?.classico?.occorrenze || 0,
            'Occorrenze Contemporanee': analisi.analisi?.contemporaneo?.occorrenze || 0,
            'Contesti Classici': analisi.analisi?.classico?.contesti?.join(', ') || '',
            'Contesti Contemporanei': analisi.analisi?.contemporaneo?.contesti?.join(', ') || '',
            'Variazione Percentuale': this.calcolaVariazionePercentuale(analisi),
            'Trasformazioni Identificate': analisi.trasformazioni?.length || 0,
            'Autori Principali Classici': this.estraiAutoriPrincipali(analisi.analisi?.classico),
            'Autori Principali Contemporanei': this.estraiAutoriPrincipali(analisi.analisi?.contemporaneo)
        }];
    },
    
    prepareTimelineForExport: function(timeline) {
        return timeline.map(item => ({
            'Anno': item.anno || '',
            'Periodo': item.periodo || '',
            'Autore': item.autore || '',
            'Opera': item.opera || '',
            'Estratto': item.estratto || '',
            'Contesto': item.contesto || '',
            'Lingua Originale': item.lingua || '',
            'Traduzione': item.traduzione || ''
        }));
    },
    
    prepareConfrontoForExport: function(analisi) {
        return [{
            'Dimensione': 'Comparazione',
            'Periodo Classico': 'Valori',
            'Periodo Contemporaneo': 'Valori',
            'Variazione': 'Risultato'
        }, {
            'Dimensione': 'Frequenza d\'uso',
            'Periodo Classico': analisi.analisi?.classico?.occorrenze || 0,
            'Periodo Contemporaneo': analisi.analisi?.contemporaneo?.occorrenze || 0,
            'Variazione': this.calcolaVariazione(analisi.analisi?.classico?.occorrenze, analisi.analisi?.contemporaneo?.occorrenze)
        }, {
            'Dimensione': 'Contesti d\'uso',
            'Periodo Classico': analisi.analisi?.classico?.contesti?.join(', ') || '',
            'Periodo Contemporaneo': analisi.analisi?.contemporaneo?.contesti?.join(', ') || '',
            'Variazione': this.confrontaContesti(analisi.analisi?.classico?.contesti, analisi.analisi?.contemporaneo?.contesti)
        }];
    },
    
    prepareTrasformazioniForExport: function(trasformazioni) {
        return trasformazioni.map(t => ({
            'Tipo Trasformazione': t.tipo || '',
            'Descrizione': t.descrizione || '',
            'Periodo Transizione': t.periodo || '',
            'Autore Chiave': t.autore || '',
            'Opera Riferimento': t.opera || '',
            'Evidenza Testuale': t.evidenza || '',
            'Impatto': t.impatto || '',
            'Continuità Identificata': t.continuita || '',
            'Rottura Identificata': t.rottura || ''
        }));
    },
    
    prepareMetricheForExport: function(analisi) {
        const classico = analisi.analisi?.classico || {};
        const contemporaneo = analisi.analisi?.contemporaneo || {};
        
        return [{
            'Metrica': 'Valore Classico',
            'Valore Contemporaneo': 'Variazione'
        }, {
            'Metrica': 'Occorrenze',
            'Valore Classico': classico.occorrenze || 0,
            'Valore Contemporaneo': contemporaneo.occorrenze || 0,
            'Variazione': this.calcolaVariazionePercentualeNumerica(classico.occorrenze, contemporaneo.occorrenze)
        }, {
            'Metrica': 'Contesti Unici',
            'Valore Classico': classico.contesti?.length || 0,
            'Valore Contemporaneo': contemporaneo.contesti?.length || 0,
            'Variazione': this.calcolaVariazionePercentualeNumerica(classico.contesti?.length, contemporaneo.contesti?.length)
        }, {
            'Metrica': 'Opere Analizzate',
            'Valore Classico': classico.opereAnalizzate || 0,
            'Valore Contemporaneo': contemporaneo.opereAnalizzate || 0,
            'Variazione': this.calcolaVariazionePercentualeNumerica(classico.opereAnalizzate, contemporaneo.opereAnalizzate)
        }];
    },
    
    // ================================
    // 6. PROCESSAMENTO IMPORT
    // ================================
    
    processFilosofiImport: function(jsonData) {
        return jsonData.map(item => ({
            id: item['ID'] || '',
            nome: item['Nome Completo'] || '',
            nome_en: item['Nome (Inglese)'] || '',
            periodo: item['Periodo']?.toLowerCase() || '',
            scuola: item['Scuola/Corrente'] || '',
            anni: item['Anni (Nascita-Morte)'] || '',
            biografia: item['Biografia'] || '',
            biografia_en: item['Biografia (Inglese)'] || '',
            concetti_principali: item['Concetti Principali'] ? 
                item['Concetti Principali'].split(',').map(c => c.trim()) : [],
            luogo_nascita: {
                citta: item['Luogo Nascita - Città'] || '',
                paese: item['Luogo Nascita - Paese'] || '',
                coordinate: {
                    lat: parseFloat(item['Coordinate - Latitudine']) || 0,
                    lng: parseFloat(item['Coordinate - Longitudine']) || 0
                }
            },
            immagine: item['URL Immagine'] || '',
            createdAt: item['Data Creazione'] || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })).filter(f => f.nome); // Filtra righe vuote
    },
    
    processOpereImport: function(jsonData) {
        return jsonData.map(item => ({
            id: item['ID'] || '',
            titolo: item['Titolo'] || '',
            titolo_en: item['Titolo (Inglese)'] || '',
            autore: item['Autore'] || '',
            anno: item['Anno Pubblicazione'] || '',
            periodo: item['Periodo Storico']?.toLowerCase() || '',
            sintesi: item['Sintesi/Abstract'] || '',
            sintesi_en: item['Sintesi (Inglese)'] || '',
            concetti: item['Concetti Trattati'] ? 
                item['Concetti Trattati'].split(',').map(c => c.trim()) : [],
            lingua: item['Lingua Originale'] || 'Italiano',
            pdf: item['URL PDF/Testo'] || '',
            testo_originale: item['Testo Originale (Estratto)'] || '',
            contesto: item['Contesto Principale'] || '',
            createdAt: item['Data Creazione'] || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })).filter(o => o.titolo); // Filtra righe vuote
    },
    
    processConcettiImport: function(jsonData) {
        return jsonData.map(item => ({
            id: item['ID'] || '',
            parola: item['Parola Chiave'] || '',
            parola_en: item['Parola (Inglese)'] || '',
            definizione: item['Definizione'] || '',
            definizione_en: item['Definizione (Inglese)'] || '',
            esempio: item['Citazione/Estratto'] || '',
            autore: item['Autore Riferimento'] || '',
            opera: item['Opera di Riferimento'] || '',
            periodo: item['Periodo Storico']?.toLowerCase() || '',
            evoluzione: item['Evoluzione Storica'] || '',
            definizione_classico: item['Definizione Periodo Classico'] || '',
            definizione_contemporaneo: item['Definizione Periodo Contemporaneo'] || '',
            contesti: item['Contesti d\'Uso'] ? 
                item['Contesti d\'Uso'].split(',').map(c => c.trim()) : [],
            correlati: item['Termini Correlati'] ? 
                item['Termini Correlati'].split(',').map(c => c.trim()) : [],
            createdAt: item['Data Creazione'] || new Date().toISOString(),
            updatedAt: new Date().toISOString()
        })).filter(c => c.parola); // Filtra righe vuote
    },
    
    // ================================
    // 7. TEMPLATE DEFINITIONS
    // ================================
    
    getFilosofiTemplate: function() {
        return {
            sheetName: 'Filosofi',
            colWidths: [
                { wch: 10 },  // ID
                { wch: 25 },  // Nome Completo
                { wch: 20 },  // Nome (Inglese)
                { wch: 15 },  // Periodo
                { wch: 20 },  // Scuola/Corrente
                { wch: 20 },  // Anni
                { wch: 40 },  // Biografia
                { wch: 40 },  // Biografia (Inglese)
                { wch: 30 },  // Concetti Principali
                { wch: 20 },  // Città Nascita
                { wch: 15 },  // Paese Nascita
                { wch: 15 },  // Latitudine
                { wch: 15 },  // Longitudine
                { wch: 30 },  // URL Immagine
                { wch: 20 },  // Data Creazione
                { wch: 20 }   // Data Aggiornamento
            ],
            data: [{
                'ID': 'F001',
                'Nome Completo': 'Platone',
                'Nome (Inglese)': 'Plato',
                'Periodo': 'classico',
                'Scuola/Corrente': 'Platonismo',
                'Anni (Nascita-Morte)': '428/427 a.C. - 348/347 a.C.',
                'Biografia': 'Fondatore dell\'Accademia di Atene, autore dei Dialoghi.',
                'Biografia (Inglese)': 'Founder of the Academy in Athens, author of the Dialogues.',
                'Concetti Principali': 'Idea, Bene, Anima, Stato',
                'Luogo Nascita - Città': 'Atene',
                'Luogo Nascita - Paese': 'Grecia',
                'Coordinate - Latitudine': '37.9838',
                'Coordinate - Longitudine': '23.7275',
                'URL Immagine': 'https://example.com/platone.jpg',
                'Data Creazione': new Date().toISOString(),
                'Data Aggiornamento': new Date().toISOString()
            }]
        };
    },
    
    getOpereTemplate: function() {
        return {
            sheetName: 'Opere',
            colWidths: [
                { wch: 10 },  // ID
                { wch: 30 },  // Titolo
                { wch: 25 },  // Titolo (Inglese)
                { wch: 20 },  // Autore
                { wch: 15 },  // Anno
                { wch: 15 },  // Periodo
                { wch: 40 },  // Sintesi
                { wch: 40 },  // Sintesi (Inglese)
                { wch: 30 },  // Concetti Trattati
                { wch: 15 },  // Lingua
                { wch: 30 },  // URL PDF
                { wch: 50 },  // Testo Originale
                { wch: 20 },  // Contesto
                { wch: 20 },  // Data Creazione
                { wch: 20 }   // Data Aggiornamento
            ],
            data: [{
                'ID': 'O001',
                'Titolo': 'La Repubblica',
                'Titolo (Inglese)': 'The Republic',
                'Autore': 'Platone',
                'Anno Pubblicazione': '380 a.C.',
                'Periodo Storico': 'classico',
                'Sintesi/Abstract': 'Dialogo sull\'organizzazione dello Stato ideale.',
                'Sintesi (Inglese)': 'Dialogue on the organization of the ideal State.',
                'Concetti Trattati': 'Giustizia, Stato, Filosofia, Educazione',
                'Lingua Originale': 'Greco Antico',
                'URL PDF/Testo': 'https://example.com/repubblica.pdf',
                'Testo Originale (Estratto)': 'τό γὰρ αὐτὸ νοεῖν ἐστίν τε καὶ εἶναι',
                'Contesto Principale': 'Politico-Filosofico',
                'Data Creazione': new Date().toISOString(),
                'Data Aggiornamento': new Date().toISOString()
            }]
        };
    },
    
    getConcettiTemplate: function() {
        return {
            sheetName: 'Concetti',
            colWidths: [
                { wch: 10 },  // ID
                { wch: 20 },  // Parola Chiave
                { wch: 20 },  // Parola (Inglese)
                { wch: 40 },  // Definizione
                { wch: 40 },  // Definizione (Inglese)
                { wch: 40 },  // Citazione
                { wch: 20 },  // Autore
                { wch: 30 },  // Opera
                { wch: 15 },  // Periodo
                { wch: 40 },  // Evoluzione
                { wch: 40 },  // Def. Classico
                { wch: 40 },  // Def. Contemporaneo
                { wch: 30 },  // Contesti
                { wch: 30 },  // Termini Correlati
                { wch: 20 },  // Data Creazione
                { wch: 20 }   // Data Aggiornamento
            ],
            data: [{
                'ID': 'C001',
                'Parola Chiave': 'Verità',
                'Parola (Inglese)': 'Truth',
                'Definizione': 'Corrispondenza dell\'intelletto con la cosa reale.',
                'Definizione (Inglese)': 'Correspondence of the intellect with the real thing.',
                'Citazione/Estratto': 'La verità è adaequatio rei et intellectus.',
                'Autore Riferimento': 'Tommaso d\'Aquino',
                'Opera di Riferimento': 'De Veritate',
                'Periodo Storico': 'medioevale',
                'Evoluzione Storica': 'Da corrispondenza ontologica a costruzione discorsiva.',
                'Definizione Periodo Classico': 'Corrispondenza tra pensiero e realtà (aletheia).',
                'Definizione Periodo Contemporaneo': 'Costruzione discorsiva prodotta da regimi di verità.',
                'Contesti d\'Uso': 'Ontologico, Epistemico, Politico',
                'Termini Correlati': 'Realtà, Conoscenza, Potere, Disciplina',
                'Data Creazione': new Date().toISOString(),
                'Data Aggiornamento': new Date().toISOString()
            }]
        };
    },
    
    getAnalisiTemplate: function() {
        return {
            sheetName: 'Analisi',
            colWidths: [
                { wch: 25 },  // Termine Analizzato
                { wch: 20 },  // Data Analisi
                { wch: 40 },  // Definizione
                { wch: 15 },  // Periodo
                { wch: 15 },  // Occ. Classiche
                { wch: 15 },  // Occ. Contemp.
                { wch: 25 },  // Contesti Classici
                { wch: 25 },  // Contesti Contemp.
                { wch: 15 },  // Variazione %
                { wch: 15 },  // Trasformazioni
                { wch: 25 },  // Autori Classici
                { wch: 25 }   // Autori Contemp.
            ],
            data: [{
                'Termine Analizzato': 'Verità',
                'Data Analisi': new Date().toISOString(),
                'Definizione Generale': 'Concetto centrale della filosofia.',
                'Periodo Dominante': 'entrambi',
                'Occorrenze Classiche': 45,
                'Occorrenze Contemporanee': 32,
                'Contesti Classici': 'Ontologico, Epistemico',
                'Contesti Contemporanei': 'Politico, Discorsivo',
                'Variazione Percentuale': '-29%',
                'Trasformazioni Identificate': 3,
                'Autori Principali Classici': 'Aristotele, Tommaso',
                'Autori Principali Contemporanei': 'Foucault, Nietzsche'
            }]
        };
    },
    
    // ================================
    // 8. UTILITY FUNCTIONS
    // ================================
    
    showImportResults: function(results, collectionName) {
        const successMsg = `${results.success} ${collectionName} importati con successo`;
        let errorMsg = '';
        
        if (results.errors.length > 0) {
            errorMsg = `, ${results.errors.length} errori: `;
            results.errors.forEach((err, index) => {
                if (index < 3) { // Mostra solo primi 3 errori
                    errorMsg += `${err.item} (${err.error}); `;
                }
            });
            if (results.errors.length > 3) {
                errorMsg += `... e altri ${results.errors.length - 3} errori`;
            }
        }
        
        showToast(successMsg + errorMsg, results.errors.length > 0 ? 'warning' : 'success');
        
        // Log dettagliato in console
        console.log(`Import ${collectionName}:`, results);
    },
    
    calcolaVariazionePercentuale: function(analisi) {
        const classico = analisi.analisi?.classico?.occorrenze || 0;
        const contemporaneo = analisi.analisi?.contemporaneo?.occorrenze || 0;
        
        if (classico === 0) return 'N/A';
        
        const variazione = ((contemporaneo - classico) / classico) * 100;
        return `${variazione > 0 ? '+' : ''}${variazione.toFixed(1)}%`;
    },
    
    calcolaVariazionePercentualeNumerica: function(val1, val2) {
        if (!val1 || val1 === 0) return 'N/A';
        const variazione = ((val2 - val1) / val1) * 100;
        return `${variazione > 0 ? '+' : ''}${variazione.toFixed(1)}%`;
    },
    
    calcolaVariazione: function(val1, val2) {
        if (val1 === val2) return 'Stabile';
        return val2 > val1 ? `+${val2 - val1}` : `-${val1 - val2}`;
    },
    
    confrontaContesti: function(contesti1, contesti2) {
        if (!contesti1 || !contesti2) return 'N/A';
        
        const set1 = new Set(contesti1);
        const set2 = new Set(contesti2);
        
        const comuni = [...set1].filter(x => set2.has(x)).length;
        const unici1 = set1.size - comuni;
        const unici2 = set2.size - comuni;
        
        return `${comuni} comuni, ${unici1}→${unici2} unici`;
    },
    
    estraiAutoriPrincipali: function(analisiPeriodo) {
        if (!analisiPeriodo || !analisiPeriodo.autori) return '';
        return Array.isArray(analisiPeriodo.autori) ? 
            analisiPeriodo.autori.slice(0, 3).join(', ') : 
            analisiPeriodo.autori;
    },
    
    // ================================
    // 9. FUNZIONI DI BACKUP
    // ================================
    
    /**
     * Crea backup completo del database locale
     */
    createLocalBackup: function() {
        try {
            const backup = {
                timestamp: new Date().toISOString(),
                version: '2.0.0',
                data: {
                    filosofi: JSON.parse(localStorage.getItem('local_filosofi') || '[]'),
                    opere: JSON.parse(localStorage.getItem('local_opere') || '[]'),
                    concetti: JSON.parse(localStorage.getItem('local_concetti') || '[]'),
                    analytics: JSON.parse(localStorage.getItem('analytics_events') || '[]').slice(-100) // Ultimi 100 eventi
                }
            };
            
            const backupStr = JSON.stringify(backup, null, 2);
            const blob = new Blob([backupStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_aeterna_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showToast('Backup creato con successo', 'success');
            return true;
            
        } catch (error) {
            console.error('Errore backup:', error);
            showToast('Errore durante il backup', 'error');
            return false;
        }
    },
    
    /**
     * Ripristina da backup
     */
    restoreFromBackup: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    // Verifica struttura backup
                    if (!backup.data || !backup.timestamp) {
                        throw new Error('Formato backup non valido');
                    }
                    
                    // Ripristina dati
                    if (backup.data.filosofi) {
                        localStorage.setItem('local_filosofi', JSON.stringify(backup.data.filosofi));
                    }
                    
                    if (backup.data.opere) {
                        localStorage.setItem('local_opere', JSON.stringify(backup.data.opere));
                    }
                    
                    if (backup.data.concetti) {
                        localStorage.setItem('local_concetti', JSON.stringify(backup.data.concetti));
                    }
                    
                    showToast(`Backup ripristinato (${backup.timestamp})`, 'success');
                    resolve(true);
                    
                } catch (error) {
                    console.error('Errore ripristino:', error);
                    showToast('Errore durante il ripristino: ' + error.message, 'error');
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Errore lettura file'));
            };
            
            reader.readAsText(file);
        });
    }
};

// ================================
// 10. INIZIALIZZAZIONE
// ================================

// Assicurati che XLSX sia disponibile
if (typeof XLSX === 'undefined') {
    console.warn('XLSX library non caricata. Caricala tramite CDN.');
    
    // Carica dinamicamente se non presente
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    script.onload = () => {
        console.log('✅ XLSX library caricata dinamicamente');
        // Inizializza funzioni che dipendono da XLSX
        if (typeof window.ExcelWorkerInit === 'function') {
            window.ExcelWorkerInit();
        }
    };
    document.head.appendChild(script);
}

// Esponi funzioni globali
window.exportAllDataToExcel = () => window.ExcelWorker.exportAllDataToExcel();
window.exportDataToExcel = (collection) => window.ExcelWorker.exportDataToExcel(collection);
window.handleFileImport = (collection, files) => window.ExcelWorker.handleFileImport(collection, files);
window.downloadTemplate = (collection) => window.ExcelWorker.downloadTemplate(collection);
window.exportAnalisiComparativa = (termine, analisi) => window.ExcelWorker.exportAnalisiComparativa(termine, analisi);

console.log('✅ ExcelWorker inizializzato');