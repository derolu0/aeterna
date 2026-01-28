// ==============================================
// EXCEL-WORKER.JS (VERSIONE CORRETTA COMPAT)
// Gestione Import/Export Excel
// ==============================================

window.ExcelWorker = {
    // ================================
    // 1. ESPORTAZIONE DATI
    // ================================
    
    /**
     * Esporta tutti i dati in un unico file Excel
     * Ora accetta i dati direttamente come parametro opzionale o li legge da appData
     */
    exportAllDataToExcel: async function() {
        try {
            showToast('Preparazione export dati completi...', 'info');
            
            // PRENDE I DATI DALLA VARIABILE GLOBALE DI APP.JS
            const filosofi = window.appData?.filosofi || [];
            const opere = window.appData?.opere || [];
            const concetti = window.appData?.concetti || [];
            
            if (filosofi.length === 0 && opere.length === 0) {
                showToast('Nessun dato trovato in memoria da esportare', 'warning');
                return;
            }

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
            
            // Genera nome file con data
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `AeternaLexicon_Export_${dateStr}.xlsx`;
            
            // Salva file
            XLSX.writeFile(wb, filename);
            showToast(`Dati esportati in ${filename}`, 'success');
            
        } catch (error) {
            console.error('Errore export dati:', error);
            showToast('Errore durante l\'export: ' + error.message, 'error');
        }
    },
    
    /**
     * Esporta dati specifici per collezione
     * CORREZIONE: Ora accetta 'data' come secondo argomento
     */
    exportDataToExcel: function(collectionName, data) {
        try {
            let sheetName = '';
            // Se i dati non vengono passati, prova a prenderli da appData
            if (!data && window.appData) {
                data = window.appData[collectionName] || [];
            }

            if (!data || data.length === 0) {
                showToast('Nessun dato da esportare', 'warning');
                return null;
            }
            
            switch(collectionName) {
                case 'filosofi': sheetName = 'Filosofi'; break;
                case 'opere': sheetName = 'Opere'; break;
                case 'concetti': sheetName = 'Concetti'; break;
                default: sheetName = 'Dati';
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
            showToast(`${sheetName} esportati con successo`, 'success');
            
        } catch (error) {
            console.error(`Errore export ${collectionName}:`, error);
            showToast('Errore export: ' + error.message, 'error');
        }
    },
    
    // ================================
    // 2. IMPORT DATI
    // ================================
    
    handleFileImport: async function(collectionName, files, currentAppData) {
        if (!files || files.length === 0) return;
        
        const file = files[0];
        const reader = new FileReader();
        
        return new Promise((resolve, reject) => {
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    if (jsonData.length === 0) {
                        showToast('Il file è vuoto', 'warning');
                        resolve({ success: false, error: 'File vuoto' });
                        return;
                    }
                    
                    // Processa i dati in base alla collezione
                    const processedData = this.processImportData(collectionName, jsonData);
                    
                    // Salva su Firebase usando la funzione globale di app.js
                    const results = await this.saveImportedData(collectionName, processedData);
                    
                    resolve({ 
                        success: true, 
                        importedCount: results.success, 
                        data: { [collectionName]: processedData } // Ritorna i dati per aggiornare la UI
                    });
                    
                } catch (error) {
                    console.error('Errore import:', error);
                    resolve({ success: false, error: error.message });
                }
            };
            reader.readAsArrayBuffer(file);
        });
    },
    
    processImportData: function(collectionName, jsonData) {
        if (collectionName === 'filosofi') return this.processFilosofiImport(jsonData);
        if (collectionName === 'opere') return this.processOpereImport(jsonData);
        if (collectionName === 'concetti') return this.processConcettiImport(jsonData);
        return [];
    },
    
    saveImportedData: async function(collectionName, data) {
        let success = 0;
        // Usa le funzioni globali definite in app.js
        for (const item of data) {
            try {
                if (window.saveFirebaseData) {
                    await window.saveFirebaseData(collectionName, item);
                    success++;
                }
            } catch (e) { console.error("Errore salvataggio item import", e); }
        }
        return { success, errors: [] };
    },

    // ================================
    // 3. PREPARAZIONE DATI (Helper)
    // ================================
    
    prepareFilosofiForExport: function(filosofi) {
        return filosofi.map(f => ({
            'ID': f.id || '',
            'Nome': f.nome || '',
            'Scuola': f.scuola || '',
            'Periodo': f.periodo || '',
            'Anni': f.anni_vita || '',
            'Luogo': f.luogo_nascita || '',
            'Biografia': f.biografia || ''
        }));
    },
    
    prepareOpereForExport: function(opere) {
        return opere.map(o => ({
            'ID': o.id || '',
            'Titolo': o.titolo || '',
            'Autore': o.autore_nome || '',
            'Anno': o.anno || '',
            'Sintesi': o.sintesi || ''
        }));
    },
    
    prepareConcettiForExport: function(concetti) {
        return concetti.map(c => ({
            'ID': c.id || '',
            'Parola': c.parola || '',
            'Definizione': c.definizione || '',
            'Autore': c.autore_riferimento || ''
        }));
    },

    // Funzioni di import specifiche
    processFilosofiImport: function(data) {
        return data.map(item => ({
            nome: item['Nome'] || item['Nome Completo'] || '',
            scuola: item['Scuola'] || '',
            periodo: (item['Periodo'] || 'classico').toLowerCase(),
            anni_vita: item['Anni'] || '',
            luogo_nascita: item['Luogo'] || '',
            biografia: item['Biografia'] || '',
            last_modified: new Date().toISOString()
        })).filter(f => f.nome);
    },

    processOpereImport: function(data) {
        return data.map(item => ({
            titolo: item['Titolo'] || '',
            autore_nome: item['Autore'] || '',
            anno: item['Anno'] || '',
            sintesi: item['Sintesi'] || '',
            last_modified: new Date().toISOString()
        })).filter(o => o.titolo);
    },

    processConcettiImport: function(data) {
        return data.map(item => ({
            parola: item['Parola'] || '',
            definizione: item['Definizione'] || '',
            autore_riferimento: item['Autore'] || '',
            last_modified: new Date().toISOString()
        })).filter(c => c.parola);
    },

    // ================================
    // ALTRE FUNZIONI UTILI
    // ================================
    downloadTemplate: function(type) {
        alert("Template download non ancora implementato in questa versione light.");
    },
    exportAnalisiComparativa: function(termine, analisi) {
        alert("Export analisi non ancora disponibile offline.");
    }
};

// Inizializzazione
console.log('✅ ExcelWorker caricato e pronto (Versione Compat)');