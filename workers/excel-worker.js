// ==============================================
// EXCEL-WORKER.JS (VERSIONE PULITA)
// Gestione Import/Export Excel
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
            this._showToast('Preparazione export dati completi...', 'info');
            
            // PRENDE I DATI DALLA VARIABILE GLOBALE DI APP.JS
            const filosofi = window.appData?.filosofi || [];
            const opere = window.appData?.opere || [];
            const concetti = window.appData?.concetti || [];
            
            if (filosofi.length === 0 && opere.length === 0 && concetti.length === 0) {
                this._showToast('Nessun dato trovato in memoria da esportare', 'warning');
                return;
            }

            // Crea workbook con multiple sheets
            const wb = XLSX.utils.book_new();
            
            // Sheet Filosofi
            if (filosofi.length > 0) {
                const filosofiData = this._prepareFilosofiForExport(filosofi);
                const filosofiWS = XLSX.utils.json_to_sheet(filosofiData);
                XLSX.utils.book_append_sheet(wb, filosofiWS, "Filosofi");
            }
            
            // Sheet Opere
            if (opere.length > 0) {
                const opereData = this._prepareOpereForExport(opere);
                const opereWS = XLSX.utils.json_to_sheet(opereData);
                XLSX.utils.book_append_sheet(wb, opereWS, "Opere");
            }
            
            // Sheet Concetti
            if (concetti.length > 0) {
                const concettiData = this._prepareConcettiForExport(concetti);
                const concettiWS = XLSX.utils.json_to_sheet(concettiData);
                XLSX.utils.book_append_sheet(wb, concettiWS, "Concetti");
            }
            
            // Genera nome file con data
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `AeternaLexicon_Export_${dateStr}.xlsx`;
            
            // Salva file
            XLSX.writeFile(wb, filename);
            this._showToast(`Dati esportati in ${filename}`, 'success');
            
        } catch (error) {
            console.error('Errore export dati:', error);
            this._showToast('Errore durante l\'export: ' + error.message, 'error');
        }
    },
    
    /**
     * Esporta dati specifici per collezione
     */
    exportCollectionToExcel: function(collectionName, customData = null) {
        try {
            // Determina i dati da esportare
            const data = customData || window.appData?.[collectionName] || [];
            
            if (!data || data.length === 0) {
                this._showToast('Nessun dato da esportare', 'warning');
                return;
            }
            
            // Mappa nomi collezione a nomi sheet
            const sheetMap = {
                'filosofi': 'Filosofi',
                'opere': 'Opere', 
                'concetti': 'Concetti'
            };
            
            const sheetName = sheetMap[collectionName] || 'Dati';
            
            // Prepara dati per export
            const exportData = this[`_prepare${sheetName}ForExport`](data);
            
            // Crea workbook
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            
            // Genera nome file
            const dateStr = new Date().toISOString().split('T')[0];
            const filename = `AeternaLexicon_${sheetName}_${dateStr}.xlsx`;
            
            // Salva file
            XLSX.writeFile(wb, filename);
            this._showToast(`${sheetName} esportati con successo`, 'success');
            
        } catch (error) {
            console.error(`Errore export ${collectionName}:`, error);
            this._showToast('Errore export: ' + error.message, 'error');
        }
    },
    
    // ================================
    // 2. IMPORT DATI
    // ================================
    
    handleFileImport: async function(collectionName, files) {
        if (!files || files.length === 0) return { success: false, error: 'Nessun file selezionato' };
        
        const file = files[0];
        const reader = new FileReader();
        
        return new Promise((resolve) => {
            reader.onload = async (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet);
                    
                    if (jsonData.length === 0) {
                        this._showToast('Il file è vuoto', 'warning');
                        resolve({ success: false, error: 'File vuoto' });
                        return;
                    }
                    
                    // Processa i dati
                    const processedData = this._processImportData(collectionName, jsonData);
                    
                    if (processedData.length === 0) {
                        resolve({ success: false, error: 'Nessun dato valido trovato nel file' });
                        return;
                    }
                    
                    // Salva su Firebase
                    const results = await this._saveImportedData(collectionName, processedData);
                    
                    resolve({ 
                        success: true, 
                        importedCount: results.success,
                        errorCount: results.errors.length,
                        data: processedData
                    });
                    
                } catch (error) {
                    console.error('Errore import:', error);
                    resolve({ success: false, error: error.message });
                }
            };
            
            reader.onerror = () => {
                resolve({ success: false, error: 'Errore nella lettura del file' });
            };
            
            reader.readAsArrayBuffer(file);
        });
    },
    
    // ================================
    // 3. FUNZIONI PRIVATE (Helper)
    // ================================
    
    /**
     * Helper per mostrare toast (compatibilità)
     */
    _showToast: function(message, type = 'info') {
        if (typeof showToast === 'function') {
            showToast(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
            alert(message);
        }
    },
    
    /**
     * Prepara dati filosofi per export
     */
    _prepareFilosofiForExport: function(filosofi) {
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
    
    /**
     * Prepara dati opere per export
     */
    _prepareOpereForExport: function(opere) {
        return opere.map(o => ({
            'ID': o.id || '',
            'Titolo': o.titolo || '',
            'Autore': o.autore_nome || '',
            'Anno': o.anno || '',
            'Sintesi': o.sintesi || ''
        }));
    },
    
    /**
     * Prepara dati concetti per export
     */
    _prepareConcettiForExport: function(concetti) {
        return concetti.map(c => ({
            'ID': c.id || '',
            'Parola': c.parola || '',
            'Definizione': c.definizione || '',
            'Autore': c.autore_riferimento || ''
        }));
    },
    
    /**
     * Processa dati importati in base alla collezione
     */
    _processImportData: function(collectionName, jsonData) {
        const processors = {
            'filosofi': this._processFilosofiImport.bind(this),
            'opere': this._processOpereImport.bind(this),
            'concetti': this._processConcettiImport.bind(this)
        };
        
        const processor = processors[collectionName];
        return processor ? processor(jsonData) : [];
    },
    
    /**
     * Processa import filosofi
     */
    _processFilosofiImport: function(data) {
        return data
            .map(item => ({
                nome: item['Nome'] || item['Nome Completo'] || '',
                scuola: item['Scuola'] || '',
                periodo: (item['Periodo'] || 'classico').toLowerCase(),
                anni_vita: item['Anni'] || '',
                luogo_nascita: item['Luogo'] || '',
                biografia: item['Biografia'] || '',
                last_modified: new Date().toISOString()
            }))
            .filter(f => f.nome && f.nome.trim() !== '');
    },
    
    /**
     * Processa import opere
     */
    _processOpereImport: function(data) {
        return data
            .map(item => ({
                titolo: item['Titolo'] || '',
                autore_nome: item['Autore'] || '',
                anno: item['Anno'] || '',
                sintesi: item['Sintesi'] || '',
                last_modified: new Date().toISOString()
            }))
            .filter(o => o.titolo && o.titolo.trim() !== '');
    },
    
    /**
     * Processa import concetti
     */
    _processConcettiImport: function(data) {
        return data
            .map(item => ({
                parola: item['Parola'] || '',
                definizione: item['Definizione'] || '',
                autore_riferimento: item['Autore'] || '',
                last_modified: new Date().toISOString()
            }))
            .filter(c => c.parola && c.parola.trim() !== '');
    },
    
    /**
     * Salva dati importati su Firebase
     */
    _saveImportedData: async function(collectionName, data) {
        const results = {
            success: 0,
            errors: []
        };
        
        // Usa le funzioni globali definite in app.js
        if (!window.saveFirebaseData) {
            throw new Error('Funzione saveFirebaseData non disponibile');
        }
        
        for (let i = 0; i < data.length; i++) {
            try {
                await window.saveFirebaseData(collectionName, data[i]);
                results.success++;
            } catch (error) {
                console.error(`Errore salvataggio item ${i}:`, error);
                results.errors.push({
                    index: i,
                    data: data[i],
                    error: error.message
                });
            }
        }
        
        return results;
    },
    
    // ================================
    // 4. FUNZIONI UTILITY PUBBLICHE
    // ================================
    
    /**
     * Scarica template per import
     */
    downloadTemplate: function(type) {
        // Implementazione futura
        this._showToast("Template download non ancora implementato in questa versione light.", 'info');
    },
    
    /**
     * Esporta analisi comparativa
     */
    exportAnalisiComparativa: function(termine, analisi) {
        // Implementazione futura
        this._showToast("Export analisi non ancora disponibile offline.", 'info');
    },
    
    /**
     * Verifica se la libreria XLSX è disponibile
     */
    isAvailable: function() {
        return typeof XLSX !== 'undefined';
    }
};

// Verifica dipendenze all'avvio
if (typeof XLSX === 'undefined') {
    console.warn('⚠️ Libreria XLSX non trovata. Le funzioni di export Excel non saranno disponibili.');
} else {
    console.log('✅ ExcelWorker caricato e pronto');
}