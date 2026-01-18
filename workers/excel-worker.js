// ==========================================
// EXCEL WORKER PER AETERNA LEXICON IN MOTU
// Versione ottimizzata per dataset filosofico
// ==========================================

self.onmessage = function(e) {
    const { type, data, options = {} } = e.data;
    
    switch(type) {
        case 'PROCESS_EXCEL':
            handleProcessExcel(data, options);
            break;
        case 'VALIDATE_DATA':
            handleValidateData(data, options);
            break;
        case 'CONVERT_TO_EXCEL':
            handleConvertToExcel(data, options);
            break;
        case 'MERGE_DATASETS':
            handleMergeDatasets(data, options);
            break;
        case 'GENERATE_REPORT':
            handleGenerateReport(data, options);
            break;
        case 'CLEAN_DATA':
            handleCleanData(data, options);
            break;
        case 'EXPORT_TEMPLATE':
            handleExportTemplate(data, options);
            break;
        case 'ANALYZE_STATISTICS':
            handleAnalyzeStatistics(data, options);
            break;
    }
};

// ==========================================
// 1. ELABORAZIONE EXCEL PRINCIPALE
// ==========================================

async function handleProcessExcel(data, options) {
    const { fileType, dataType, rawData } = data;
    
    try {
        // Mostra progresso iniziale
        self.postMessage({
            type: 'PROCESSING_STARTED',
            progress: 0,
            message: 'Inizio elaborazione file...'
        });
        
        let processedData;
        
        if (fileType === 'excel' || fileType === 'csv') {
            // Processa dati Excel/CSV
            processedData = await processExcelData(rawData, dataType, options);
        } else if (fileType === 'json') {
            // Processa dati JSON
            processedData = processJsonData(rawData, dataType, options);
        }
        
        // Valida i dati processati
        const validationResult = validateProcessedData(processedData, dataType);
        
        // Genera statistiche
        const statistics = generateDataStatistics(processedData, dataType);
        
        self.postMessage({
            type: 'EXCEL_PROCESSED',
            success: true,
            data: {
                processedData,
                validation: validationResult,
                statistics,
                originalCount: rawData.length,
                processedCount: processedData.length,
                dataType,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Excel processing error:', error);
        
        self.postMessage({
            type: 'EXCEL_ERROR',
            success: false,
            error: {
                message: error.message,
                stack: error.stack,
                phase: 'processing'
            },
            data: {
                dataType,
                timestamp: new Date().toISOString()
            }
        });
    }
}

// ==========================================
// 2. PROCESSING DATI FILOSOFICI
// ==========================================

async function processExcelData(rawData, dataType, options) {
    return new Promise((resolve, reject) => {
        try {
            // Progresso: 10%
            self.postMessage({
                type: 'PROCESSING_PROGRESS',
                progress: 10,
                message: `Analizzando struttura dati per ${dataType}...`
            });
            
            // Mappatura colonne in base al tipo di dati
            const columnMapping = getColumnMapping(dataType);
            
            // Progresso: 30%
            self.postMessage({
                type: 'PROCESSING_PROGRESS',
                progress: 30,
                message: 'Mappatura colonne completata'
            });
            
            const processedData = rawData.map((item, index) => {
                // Progresso per ogni 10 elementi
                if (index % 10 === 0 && index > 0) {
                    const progress = 30 + Math.floor((index / rawData.length) * 50);
                    self.postMessage({
                        type: 'PROCESSING_PROGRESS',
                        progress,
                        message: `Processati ${index} di ${rawData.length} elementi`
                    });
                }
                
                return processDataItem(item, dataType, columnMapping, options);
            });
            
            // Progresso: 90%
            self.postMessage({
                type: 'PROCESSING_PROGRESS',
                progress: 90,
                message: 'Pulizia dati finali...'
            });
            
            // Applica pulizia finale
            const cleanedData = applyFinalCleaning(processedData, dataType);
            
            resolve(cleanedData);
            
        } catch (error) {
            reject(error);
        }
    });
}

function processJsonData(rawData, dataType, options) {
    // Progresso iniziale
    self.postMessage({
        type: 'PROCESSING_PROGRESS',
        progress: 10,
        message: 'Processamento dati JSON...'
    });
    
    // Per JSON, i dati potrebbero già essere nel formato corretto
    // ma applichiamo comunque validazione e pulizia
    const processedData = rawData.map((item, index) => {
        if (index % 20 === 0 && index > 0) {
            const progress = 10 + Math.floor((index / rawData.length) * 80);
            self.postMessage({
                type: 'PROCESSING_PROGRESS',
                progress,
                message: `Processati ${index} elementi JSON`
            });
        }
        
        return processJsonItem(item, dataType, options);
    });
    
    return processedData;
}

function processDataItem(item, dataType, columnMapping, options) {
    const processedItem = {
        id: generateId(dataType),
        last_modified: new Date().toISOString(),
        import_timestamp: new Date().toISOString(),
        source: 'excel_import'
    };
    
    // Processa in base al tipo di dati
    switch(dataType) {
        case 'filosofi':
            processFilosofoItem(item, processedItem, columnMapping, options);
            break;
        case 'opere':
            processOperaItem(item, processedItem, columnMapping, options);
            break;
        case 'concetti':
            processConcettoItem(item, processedItem, columnMapping, options);
            break;
        default:
            processGenericItem(item, processedItem, columnMapping);
    }
    
    // Applica trasformazioni comuni
    applyCommonTransformations(processedItem, options);
    
    return processedItem;
}

function processFilosofoItem(rawItem, processedItem, columnMapping, options) {
    // Mappatura diretta delle colonne
    processedItem.nome = mapColumn(rawItem, 'Nome', 'nome');
    processedItem.nome_en = mapColumn(rawItem, 'Nome_EN', 'nome_en');
    processedItem.scuola = mapColumn(rawItem, 'Scuola', 'scuola');
    processedItem.periodo = mapColumn(rawItem, 'Periodo', 'periodo');
    processedItem.anni_vita = mapColumn(rawItem, 'Anni_Vita', 'anni_vita');
    processedItem.luogo_nascita = mapColumn(rawItem, 'Luogo_Nascita', 'luogo_nascita');
    processedItem.biografia = mapColumn(rawItem, 'Biografia', 'biografia');
    processedItem.biografia_en = mapColumn(rawItem, 'Biografia_EN', 'biografia_en');
    processedItem.ritratto = mapColumn(rawItem, 'Ritratto_URL', 'ritratto');
    
    // Processa coordinate se presenti
    const lat = mapColumn(rawItem, 'Coordinate_Lat', 'coordinate_lat');
    const lng = mapColumn(rawItem, 'Coordinate_Lng', 'coordinate_lng');
    
    if (lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng))) {
        processedItem.coordinate = {
            lat: parseFloat(lat),
            lng: parseFloat(lng)
        };
    }
    
    // Genera ID se non presente
    if (!processedItem.id || processedItem.id.startsWith('gen_')) {
        processedItem.id = `filosofo_${generateSlug(processedItem.nome)}_${Date.now()}`;
    }
    
    // Normalizza periodo
    if (processedItem.periodo) {
        processedItem.periodo = normalizePeriodo(processedItem.periodo);
    }
    
    return processedItem;
}

function processOperaItem(rawItem, processedItem, columnMapping, options) {
    processedItem.titolo = mapColumn(rawItem, 'Titolo', 'titolo');
    processedItem.titolo_en = mapColumn(rawItem, 'Titolo_EN', 'titolo_en');
    processedItem.autore_id = mapColumn(rawItem, 'Autore_ID', 'autore_id');
    processedItem.autore_nome = mapColumn(rawItem, 'Autore_Nome', 'autore_nome');
    processedItem.anno = mapColumn(rawItem, 'Anno', 'anno');
    processedItem.periodo = mapColumn(rawItem, 'Periodo', 'periodo');
    processedItem.lingua = mapColumn(rawItem, 'Lingua', 'lingua');
    processedItem.sintesi = mapColumn(rawItem, 'Sintesi', 'sintesi');
    processedItem.sintesi_en = mapColumn(rawItem, 'Sintesi_EN', 'sintesi_en');
    processedItem.pdf_url = mapColumn(rawItem, 'PDF_URL', 'pdf_url');
    processedItem.immagine = mapColumn(rawItem, 'Immagine_URL', 'immagine');
    
    // Processa lista di concetti
    const concettiRaw = mapColumn(rawItem, 'Concetti', 'concetti');
    if (concettiRaw) {
        processedItem.concetti = parseConcettiList(concettiRaw);
    }
    
    // Normalizza anno
    if (processedItem.anno) {
        processedItem.anno = normalizeAnno(processedItem.anno);
    }
    
    // Genera ID per opera
    processedItem.id = `opera_${generateSlug(processedItem.titolo)}_${processedItem.anno || 'nd'}`;
    
    return processedItem;
}

function processConcettoItem(rawItem, processedItem, columnMapping, options) {
    processedItem.parola = mapColumn(rawItem, 'Parola', 'parola');
    processedItem.parola_en = mapColumn(rawItem, 'Parola_EN', 'parola_en');
    processedItem.definizione = mapColumn(rawItem, 'Definizione', 'definizione');
    processedItem.definizione_en = mapColumn(rawItem, 'Definizione_EN', 'definizione_en');
    processedItem.esempio_citazione = mapColumn(rawItem, 'Esempio_Citazione', 'esempio_citazione');
    processedItem.autore_riferimento = mapColumn(rawItem, 'Autore_Riferimento', 'autore_riferimento');
    processedItem.opera_riferimento = mapColumn(rawItem, 'Opera_Riferimento', 'opera_riferimento');
    processedItem.periodo_storico = mapColumn(rawItem, 'Periodo_Storico', 'periodo_storico');
    processedItem.evoluzione = mapColumn(rawItem, 'Evoluzione', 'evoluzione');
    
    // Categoria automatica in base alla parola
    if (processedItem.parola) {
        processedItem.categoria = inferCategoriaFromParola(processedItem.parola);
    }
    
    // Genera ID per concetto
    processedItem.id = `concetto_${generateSlug(processedItem.parola)}`;
    
    return processedItem;
}

// ==========================================
// 3. VALIDAZIONE DATI
// ==========================================

function handleValidateData(data, options) {
    const { dataType, items } = data;
    
    try {
        const validationResults = validateDataItems(items, dataType, options);
        const summary = generateValidationSummary(validationResults);
        
        self.postMessage({
            type: 'VALIDATION_COMPLETE',
            success: true,
            data: {
                validationResults,
                summary,
                dataType,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        self.postMessage({
            type: 'VALIDATION_ERROR',
            success: false,
            error: error.message
        });
    }
}

function validateDataItems(items, dataType, options) {
    return items.map((item, index) => {
        const errors = [];
        const warnings = [];
        
        // Validazioni comuni
        validateRequiredFields(item, dataType, errors);
        validateFieldLengths(item, dataType, warnings);
        validateDataTypes(item, dataType, errors);
        
        // Validazioni specifiche per tipo
        switch(dataType) {
            case 'filosofi':
                validateFilosofoItem(item, errors, warnings);
                break;
            case 'opere':
                validateOperaItem(item, errors, warnings);
                break;
            case 'concetti':
                validateConcettoItem(item, errors, warnings);
                break;
        }
        
        // Validazioni coordinate
        if (item.coordinate) {
            validateCoordinates(item.coordinate, errors, warnings);
        }
        
        return {
            index,
            id: item.id,
            isValid: errors.length === 0,
            hasWarnings: warnings.length > 0,
            errors,
            warnings,
            itemPreview: generateItemPreview(item, dataType)
        };
    });
}

function validateFilosofoItem(item, errors, warnings) {
    // Nome obbligatorio
    if (!item.nome || item.nome.trim().length < 2) {
        errors.push('Nome troppo breve (min 2 caratteri)');
    }
    
    // Scuola obbligatoria
    if (!item.scuola || item.scuola.trim().length < 3) {
        errors.push('Scuola di pensiero richiesta');
    }
    
    // Periodo valido
    const validPeriodi = ['classico', 'contemporaneo', 'medioevale', 'moderno'];
    if (item.periodo && !validPeriodi.includes(item.periodo.toLowerCase())) {
        warnings.push(`Periodo "${item.periodo}" non standard. Usare: ${validPeriodi.join(', ')}`);
    }
    
    // Biografia lunghezza minima
    if (item.biografia && item.biografia.length < 50) {
        warnings.push('Biografia molto breve (consigliati almeno 50 caratteri)');
    }
}

function validateOperaItem(item, errors, warnings) {
    // Titolo obbligatorio
    if (!item.titolo || item.titolo.trim().length < 2) {
        errors.push('Titolo opera troppo breve');
    }
    
    // Autore obbligatorio
    if (!item.autore_nome && !item.autore_id) {
        errors.push('Autore non specificato');
    }
    
    // Anno valido
    if (item.anno) {
        const year = parseInt(item.anno);
        if (isNaN(year) || year < -1000 || year > new Date().getFullYear() + 10) {
            warnings.push(`Anno "${item.anno}" potrebbe non essere valido`);
        }
    }
    
    // Periodo valido
    if (item.periodo && !['classico', 'contemporaneo', 'medioevale', 'moderno'].includes(item.periodo.toLowerCase())) {
        warnings.push(`Periodo opera non standard: ${item.periodo}`);
    }
}

function validateConcettoItem(item, errors, warnings) {
    // Parola obbligatoria
    if (!item.parola || item.parola.trim().length < 2) {
        errors.push('Parola chiave troppo breve');
    }
    
    // Definizione obbligatoria
    if (!item.definizione || item.definizione.trim().length < 10) {
        errors.push('Definizione troppo breve (min 10 caratteri)');
    }
    
    // Autore riferimento se presente citazione
    if (item.esempio_citazione && !item.autore_riferimento) {
        warnings.push('Citazione presente ma autore riferimento mancante');
    }
    
    // Categoria automatica se non specificata
    if (!item.categoria) {
        item.categoria = inferCategoriaFromParola(item.parola);
        if (item.categoria) {
            warnings.push(`Categoria inferita automaticamente: ${item.categoria}`);
        }
    }
}

function validateCoordinates(coords, errors, warnings) {
    if (!coords.lat || !coords.lng) {
        errors.push('Coordinate incomplete');
        return;
    }
    
    const lat = parseFloat(coords.lat);
    const lng = parseFloat(coords.lng);
    
    if (isNaN(lat) || isNaN(lng)) {
        errors.push('Coordinate non numeriche');
        return;
    }
    
    if (lat < -90 || lat > 90) {
        errors.push(`Latitudine ${lat} fuori range (-90 a 90)`);
    }
    
    if (lng < -180 || lng > 180) {
        errors.push(`Longitudine ${lng} fuori range (-180 a 180)`);
    }
    
    // Coordinate 0,0 sospette
    if (lat === 0 && lng === 0) {
        warnings.push('Coordinate impostate su 0,0 (oceano Atlantico)');
    }
}

function generateValidationSummary(results) {
    const total = results.length;
    const valid = results.filter(r => r.isValid).length;
    const invalid = total - valid;
    const withWarnings = results.filter(r => r.hasWarnings).length;
    
    const errorCount = results.reduce((sum, r) => sum + r.errors.length, 0);
    const warningCount = results.reduce((sum, r) => sum + r.warnings.length, 0);
    
    const mostCommonErrors = getMostCommonErrors(results);
    const mostCommonWarnings = getMostCommonWarnings(results);
    
    return {
        total,
        valid,
        invalid,
        withWarnings,
        errorCount,
        warningCount,
        validityRate: total > 0 ? Math.round((valid / total) * 100) : 0,
        mostCommonErrors,
        mostCommonWarnings,
        timestamp: new Date().toISOString()
    };
}

// ==========================================
// 4. CONVERSIONE PER ESPORTAZIONE
// ==========================================

function handleConvertToExcel(data, options) {
    const { dataType, items, exportFormat = 'excel' } = data;
    
    try {
        self.postMessage({
            type: 'CONVERSION_STARTED',
            progress: 0,
            message: 'Preparazione dati per esportazione...'
        });
        
        // Converti dati nel formato Excel
        const excelData = convertToExcelFormat(items, dataType, options);
        
        self.postMessage({
            type: 'CONVERSION_PROGRESS',
            progress: 50,
            message: 'Dati convertiti, generando file...'
        });
        
        // Genera il file Excel/CSV
        const fileData = generateExcelFile(excelData, dataType, exportFormat);
        
        self.postMessage({
            type: 'CONVERSION_COMPLETE',
            success: true,
            data: {
                fileData,
                dataType,
                itemCount: items.length,
                exportFormat,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        self.postMessage({
            type: 'CONVERSION_ERROR',
            success: false,
            error: error.message
        });
    }
}

function convertToExcelFormat(items, dataType, options) {
    const columnHeaders = getExportColumnHeaders(dataType);
    
    const excelRows = items.map((item, index) => {
        // Progresso ogni 50 elementi
        if (index % 50 === 0 && index > 0) {
            const progress = Math.min(90, Math.floor((index / items.length) * 100));
            self.postMessage({
                type: 'CONVERSION_PROGRESS',
                progress,
                message: `Convertiti ${index} di ${items.length} elementi`
            });
        }
        
        return convertItemToExcelRow(item, dataType, columnHeaders);
    });
    
    return {
        headers: columnHeaders,
        rows: excelRows,
        metadata: {
            exportedAt: new Date().toISOString(),
            dataType,
            itemCount: items.length,
            appVersion: 'Aeterna Lexicon 1.0'
        }
    };
}

function getExportColumnHeaders(dataType) {
    switch(dataType) {
        case 'filosofi':
            return [
                'ID', 'Nome', 'Nome_EN', 'Scuola', 'Periodo', 'Anni_Vita',
                'Luogo_Nascita', 'Biografia', 'Biografia_EN',
                'Coordinate_Lat', 'Coordinate_Lng', 'Ritratto_URL',
                'Import_Timestamp'
            ];
            
        case 'opere':
            return [
                'ID', 'Titolo', 'Titolo_EN', 'Autore_ID', 'Autore_Nome',
                'Anno', 'Periodo', 'Lingua', 'Sintesi', 'Sintesi_EN',
                'PDF_URL', 'Immagine_URL', 'Concetti', 'Import_Timestamp'
            ];
            
        case 'concetti':
            return [
                'ID', 'Parola', 'Parola_EN', 'Definizione', 'Definizione_EN',
                'Esempio_Citazione', 'Autore_Riferimento', 'Opera_Riferimento',
                'Periodo_Storico', 'Evoluzione', 'Categoria', 'Import_Timestamp'
            ];
            
        default:
            return ['ID', 'Dati', 'Import_Timestamp'];
    }
}

function convertItemToExcelRow(item, dataType, headers) {
    const row = {};
    
    headers.forEach(header => {
        switch(header) {
            case 'ID':
                row[header] = item.id || '';
                break;
            case 'Import_Timestamp':
                row[header] = item.import_timestamp || new Date().toISOString();
                break;
            case 'Coordinate_Lat':
                row[header] = item.coordinate ? item.coordinate.lat : '';
                break;
            case 'Coordinate_Lng':
                row[header] = item.coordinate ? item.coordinate.lng : '';
                break;
            case 'Concetti':
                row[header] = item.concetti ? item.concetti.join('; ') : '';
                break;
            default:
                // Mappa header camelCase a proprietà
                const propName = header.toLowerCase().replace(/_/g, '');
                row[header] = item[propName] || item[header] || '';
        }
    });
    
    return row;
}

// ==========================================
// 5. FUSIONE DATASET
// ==========================================

function handleMergeDatasets(data, options) {
    const { datasets, mergeType = 'union' } = data;
    
    try {
        self.postMessage({
            type: 'MERGE_STARTED',
            progress: 0,
            message: 'Analizzando dataset da fondere...'
        });
        
        const mergedData = mergeDatasets(datasets, mergeType, options);
        
        // Valida il risultato della fusione
        const validation = validateMergedData(mergedData, datasets, mergeType);
        
        self.postMessage({
            type: 'MERGE_COMPLETE',
            success: true,
            data: {
                mergedData,
                validation,
                inputCount: datasets.length,
                outputCount: mergedData.length,
                mergeType,
                duplicatesRemoved: calculateDuplicatesRemoved(datasets, mergedData),
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        self.postMessage({
            type: 'MERGE_ERROR',
            success: false,
            error: error.message
        });
    }
}

function mergeDatasets(datasets, mergeType, options) {
    let merged = [];
    
    switch(mergeType) {
        case 'union':
            // Unione di tutti i dataset, rimuove duplicati
            datasets.forEach((dataset, index) => {
                self.postMessage({
                    type: 'MERGE_PROGRESS',
                    progress: Math.floor((index / datasets.length) * 80),
                    message: `Unendo dataset ${index + 1} di ${datasets.length}`
                });
                
                dataset.forEach(item => {
                    if (!itemExistsInArray(merged, item)) {
                        merged.push(item);
                    }
                });
            });
            break;
            
        case 'intersection':
            // Solo elementi presenti in tutti i dataset
            if (datasets.length > 0) {
                merged = [...datasets[0]];
                
                for (let i = 1; i < datasets.length; i++) {
                    merged = merged.filter(item => 
                        itemExistsInArray(datasets[i], item)
                    );
                    
                    self.postMessage({
                        type: 'MERGE_PROGRESS',
                        progress: Math.floor((i / datasets.length) * 80),
                        message: `Intersecando con dataset ${i + 1}`
                    });
                }
            }
            break;
            
        case 'complement':
            // Elementi presenti nel primo ma non negli altri
            if (datasets.length > 1) {
                merged = datasets[0].filter(item => {
                    for (let i = 1; i < datasets.length; i++) {
                        if (itemExistsInArray(datasets[i], item)) {
                            return false;
                        }
                    }
                    return true;
                });
            }
            break;
    }
    
    return merged;
}

// ==========================================
// 6. GENERAZIONE REPORT
// ==========================================

function handleGenerateReport(data, options) {
    const { dataType, items, reportType = 'summary' } = data;
    
    try {
        const report = generateReport(items, dataType, reportType);
        
        self.postMessage({
            type: 'REPORT_GENERATED',
            success: true,
            data: {
                report,
                dataType,
                reportType,
                itemCount: items.length,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        self.postMessage({
            type: 'REPORT_ERROR',
            success: false,
            error: error.message
        });
    }
}

function generateReport(items, dataType, reportType) {
    switch(reportType) {
        case 'summary':
            return generateSummaryReport(items, dataType);
        case 'statistics':
            return generateStatisticsReport(items, dataType);
        case 'validation':
            return generateValidationReport(items, dataType);
        case 'timeline':
            return generateTimelineReport(items, dataType);
        case 'connections':
            return generateConnectionsReport(items, dataType);
        default:
            return generateSummaryReport(items, dataType);
    }
}

function generateSummaryReport(items, dataType) {
    const total = items.length;
    
    // Statistiche di base
    const stats = {
        total,
        byPeriod: {},
        byCategory: {},
        completeness: calculateCompleteness(items)
    };
    
    items.forEach(item => {
        // Conta per periodo
        if (item.periodo) {
            stats.byPeriod[item.periodo] = (stats.byPeriod[item.periodo] || 0) + 1;
        }
        
        // Conta per categoria (se concetti)
        if (item.categoria) {
            stats.byCategory[item.categoria] = (stats.byCategory[item.categoria] || 0) + 1;
        }
    });
    
    // Top elementi
    const topItems = getTopItems(items, dataType);
    
    return {
        metadata: {
            reportType: 'summary',
            dataType,
            generatedAt: new Date().toISOString(),
            itemCount: total
        },
        statistics: stats,
        topItems,
        recommendations: generateRecommendations(items, dataType)
    };
}

// ==========================================
// 7. PULIZIA DATI
// ==========================================

function handleCleanData(data, options) {
    const { dataType, items, cleaningRules = {} } = data;
    
    try {
        self.postMessage({
            type: 'CLEANING_STARTED',
            progress: 0,
            message: 'Inizio pulizia dati...'
        });
        
        const cleanedData = cleanDataItems(items, dataType, cleaningRules);
        
        // Confronta con originali
        const changes = analyzeChanges(items, cleanedData);
        
        self.postMessage({
            type: 'CLEANING_COMPLETE',
            success: true,
            data: {
                cleanedData,
                changes,
                originalCount: items.length,
                cleanedCount: cleanedData.length,
                dataType,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        self.postMessage({
            type: 'CLEANING_ERROR',
            success: false,
            error: error.message
        });
    }
}

function cleanDataItems(items, dataType, rules) {
    return items.map((item, index) => {
        if (index % 20 === 0) {
            self.postMessage({
                type: 'CLEANING_PROGRESS',
                progress: Math.floor((index / items.length) * 90),
                message: `Puliti ${index} di ${items.length} elementi`
            });
        }
        
        const cleanedItem = { ...item };
        
        // Applica regole di pulizia
        Object.keys(rules).forEach(field => {
            if (cleanedItem[field] !== undefined) {
                cleanedItem[field] = applyCleaningRule(
                    cleanedItem[field], 
                    rules[field], 
                    dataType
                );
            }
        });
        
        // Pulizia automatica in base al tipo
        applyAutomaticCleaning(cleanedItem, dataType);
        
        return cleanedItem;
    });
}

// ==========================================
// 8. ESPORTAZIONE TEMPLATE
// ==========================================

function handleExportTemplate(data, options) {
    const { dataType, templateType = 'empty' } = data;
    
    try {
        const template = generateTemplate(dataType, templateType);
        
        self.postMessage({
            type: 'TEMPLATE_GENERATED',
            success: true,
            data: {
                template,
                dataType,
                templateType,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        self.postMessage({
            type: 'TEMPLATE_ERROR',
            success: false,
            error: error.message
        });
    }
}

function generateTemplate(dataType, templateType) {
    const headers = getExportColumnHeaders(dataType);
    
    let rows = [];
    
    if (templateType === 'example') {
        // Aggiungi righe di esempio
        rows = getExampleRows(dataType);
    }
    
    return {
        metadata: {
            templateType,
            dataType,
            generatedAt: new Date().toISOString(),
            app: 'Aeterna Lexicon in Motu'
        },
        headers,
        rows,
        instructions: getTemplateInstructions(dataType)
    };
}

// ==========================================
// 9. ANALISI STATISTICHE
// ==========================================

function handleAnalyzeStatistics(data, options) {
    const { dataType, items, analysisType = 'comprehensive' } = data;
    
    try {
        const statistics = analyzeDataStatistics(items, dataType, analysisType);
        
        self.postMessage({
            type: 'STATISTICS_GENERATED',
            success: true,
            data: {
                statistics,
                dataType,
                analysisType,
                itemCount: items.length,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        self.postMessage({
            type: 'STATISTICS_ERROR',
            success: false,
            error: error.message
        });
    }
}

// ==========================================
// FUNZIONI DI SUPPORTO
// ==========================================

function mapColumn(item, columnName, alternativeName) {
    return item[columnName] || item[alternativeName] || 
           item[columnName.toLowerCase()] || item[alternativeName.toLowerCase()] || '';
}

function getColumnMapping(dataType) {
    // Mappatura flessibile per colonne Excel
    const mappings = {
        filosofi: {
            'nome': ['Nome', 'nome', 'Filosofo', 'filosofo'],
            'scuola': ['Scuola', 'scuola', 'Corrente', 'corrente'],
            'periodo': ['Periodo', 'periodo', 'Epoca', 'epoca'],
            'luogo_nascita': ['Luogo_Nascita', 'luogo_nascita', 'Nato_a', 'nato_a']
        },
        opere: {
            'titolo': ['Titolo', 'titolo', 'Opera', 'opera'],
            'autore_nome': ['Autore_Nome', 'autore_nome', 'Autore', 'autore']
        },
        concetti: {
            'parola': ['Parola', 'parola', 'Concetto', 'concetto'],
            'definizione': ['Definizione', 'definizione', 'Significato', 'significato']
        }
    };
    
    return mappings[dataType] || {};
}

function generateId(dataType) {
    const prefix = {
        'filosofi': 'fil',
        'opere': 'op',
        'concetti': 'conc'
    }[dataType] || 'item';
    
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateSlug(text) {
    if (!text) return 'unknown';
    
    return text
        .toString()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
}

function normalizePeriodo(periodo) {
    const periodoLower = periodo.toLowerCase().trim();
    
    const mappings = {
        'classic': 'classico',
        'classical': 'classico',
        'antico': 'classico',
        'ancient': 'classico',
        
        'contemporary': 'contemporaneo',
        'moderno': 'contemporaneo',
        'modern': 'contemporaneo',
        
        'medieval': 'medioevale',
        'middle ages': 'medioevale',
        'medioevo': 'medioevale'
    };
    
    return mappings[periodoLower] || periodoLower;
}

function normalizeAnno(anno) {
    if (typeof anno === 'number') {
        return anno.toString();
    }
    
    // Rimuovi caratteri non numerici
    const cleanAnno = anno.toString().replace(/[^0-9\-]/g, '');
    
    // Se è un range (es: 1844-1900)
    if (cleanAnno.includes('-')) {
        return cleanAnno;
    }
    
    // Se è un numero solo
    const yearNum = parseInt(cleanAnno);
    if (!isNaN(yearNum)) {
        // Controlla se è avanti Cristo
        if (anno.toString().toLowerCase().includes('a.c') || 
            anno.toString().toLowerCase().includes('bc')) {
            return `-${Math.abs(yearNum)}`;
        }
        return yearNum.toString();
    }
    
    return anno;
}

function parseConcettiList(concettiString) {
    if (!concettiString) return [];
    
    // Supporta separatori: ; , | /
    return concettiString
        .split(/[;,|/\n]/)
        .map(c => c.trim())
        .filter(c => c.length > 0);
}

function inferCategoriaFromParola(parola) {
    const parolaLower = parola.toLowerCase();
    
    const categorizzazioni = {
        'ontologia': ['essere', 'essenza', 'esistenza', 'realtà', 'sostanza', 'divenire'],
        'etica': ['bene', 'male', 'virtù', 'morale', 'dovere', 'felicità', 'giustizia'],
        'epistemologia': ['verità', 'conoscenza', 'scienza', 'certezza', 'dubbio', 'ragione'],
        'estetica': ['bello', 'arte', 'gusto', 'creazione', 'immaginazione', 'genio'],
        'politica': ['potere', 'stato', 'società', 'libertà', 'uguaglianza', 'giustizia sociale'],
        'metafisica': ['dio', 'anima', 'spirito', 'assoluto', 'infinito', 'trascendente']
    };
    
    for (const [categoria, parole] of Object.entries(categorizzazioni)) {
        if (parole.some(p => parolaLower.includes(p))) {
            return categoria;
        }
    }
    
    return 'generale';
}

function applyCommonTransformations(item, options) {
    // Trim tutti i campi stringa
    Object.keys(item).forEach(key => {
        if (typeof item[key] === 'string') {
            item[key] = item[key].trim();
        }
    });
    
    // Rimuovi campi vuoti se richiesto
    if (options.removeEmptyFields) {
        Object.keys(item).forEach(key => {
            if (item[key] === '' || item[key] === null || item[key] === undefined) {
                delete item[key];
            }
        });
    }
}

function itemExistsInArray(array, item) {
    // Cerca per ID se presente
    if (item.id) {
        return array.some(existing => existing.id === item.id);
    }
    
    // Altrimenti cerca per nome/titolo
    const identifier = item.nome || item.titolo || item.parola;
    if (identifier) {
        return array.some(existing => 
            (existing.nome || existing.titolo || existing.parola) === identifier
        );
    }
    
    return false;
}

// ==========================================
// FUNZIONI DI UTILITY
// ==========================================

function calculateCompleteness(items) {
    const totalFields = Object.keys(items[0] || {}).length;
    let filledFields = 0;
    let totalPossible = 0;
    
    items.forEach(item => {
        Object.keys(item).forEach(key => {
            totalPossible++;
            if (item[key] && item[key].toString().trim().length > 0) {
                filledFields++;
            }
        });
    });
    
    return totalPossible > 0 ? Math.round((filledFields / totalPossible) * 100) : 0;
}

function getTopItems(items, dataType, limit = 5) {
    // Per ora restituisce i primi elementi
    return items.slice(0, limit).map(item => {
        const preview = generateItemPreview(item, dataType);
        return { ...preview, id: item.id };
    });
}

function generateItemPreview(item, dataType) {
    switch(dataType) {
        case 'filosofi':
            return {
                nome: item.nome,
                scuola: item.scuola,
                periodo: item.periodo
            };
        case 'opere':
            return {
                titolo: item.titolo,
                autore: item.autore_nome,
                anno: item.anno
            };
        case 'concetti':
            return {
                parola: item.parola,
                categoria: item.categoria,
                autore: item.autore_riferimento
            };
        default:
            return { id: item.id };
    }
}

function getMostCommonErrors(validationResults) {
    const errorCounts = {};
    
    validationResults.forEach(result => {
        result.errors.forEach(error => {
            errorCounts[error] = (errorCounts[error] || 0) + 1;
        });
    });
    
    return Object.entries(errorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([error, count]) => ({ error, count }));
}

function getMostCommonWarnings(validationResults) {
    const warningCounts = {};
    
    validationResults.forEach(result => {
        result.warnings.forEach(warning => {
            warningCounts[warning] = (warningCounts[warning] || 0) + 1;
        });
    });
    
    return Object.entries(warningCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([warning, count]) => ({ warning, count }));
}

function getExampleRows(dataType) {
    const examples = {
        filosofi: [
            {
                Nome: 'Platone',
                Nome_EN: 'Plato',
                Scuola: 'Platonismo',
                Periodo: 'classico',
                Anni_Vita: '428/427 a.C. - 348/347 a.C.',
                Luogo_Nascita: 'Atene, Grecia',
                Biografia: 'Filosofo greco antico, allievo di Socrate e maestro di Aristotele...',
                Coordinate_Lat: '37.9842',
                Coordinate_Lng: '23.7275'
            },
            {
                Nome: 'Friedrich Nietzsche',
                Nome_EN: 'Friedrich Nietzsche',
                Scuola: 'Filosofia continentale',
                Periodo: 'contemporaneo',
                Anni_Vita: '1844-1900',
                Luogo_Nascita: 'Röcken, Germania',
                Biografia: 'Filosofo, poeta e filologo tedesco...',
                Coordinate_Lat: '51.2372',
                Coordinate_Lng: '12.0914'
            }
        ],
        opere: [
            {
                Titolo: 'La Repubblica',
                Titolo_EN: 'The Republic',
                Autore_Nome: 'Platone',
                Anno: '380 a.C.',
                Periodo: 'classico',
                Lingua: 'greco antico',
                Sintesi: 'Dialogo sulla giustizia e l\'organizzazione dello stato ideale...',
                Concetti: 'Giustizia; Stato ideale; Bene; Conoscenza'
            }
        ],
        concetti: [
            {
                Parola: 'Verità',
                Parola_EN: 'Truth',
                Definizione: 'Corrispondenza tra pensiero e realtà, o svelamento dell\'essere...',
                Autore_Riferimento: 'Platone, Aristotele, Heidegger',
                Periodo_Storico: 'dall\'antichità a oggi',
                Categoria: 'epistemologia'
            }
        ]
    };
    
    return examples[dataType] || [];
}

function getTemplateInstructions(dataType) {
    const instructions = {
        filosofi: [
            'Compila tutti i campi obbligatori (Nome, Scuola, Periodo)',
            'Per le coordinate, usa formato decimale (es: 40.8518, 14.2681)',
            'Il periodo deve essere: classico, contemporaneo, medioevale o moderno',
            'Le date di vita possono essere in formato "1844-1900" o "428 a.C. - 348 a.C."'
        ],
        opere: [
            'Il titolo è obbligatorio',
            'Specifica almeno Autore_Nome o Autore_ID',
            'I concetti vanno separati da punto e virgola (;)',
            'Per opere antiche, usa il formato anno con "a.C." se necessario'
        ],
        concetti: [
            'La parola chiave e la definizione sono obbligatorie',
            'La categoria verrà inferita automaticamente se non specificata',
            'Inserisci almeno un autore riferimento per contestualizzare',
            'L\'evoluzione storica aiuta a tracciare il cambiamento del concetto'
        ]
    };
    
    return instructions[dataType] || ['Compila tutte le colonne obbligatorie'];
}

// ==========================================
// MESSAGGIO DI INIZIALIZZAZIONE
// ==========================================

self.postMessage({
    type: 'WORKER_READY',
    message: 'Excel Worker per Aeterna Lexicon inizializzato',
    version: '1.0',
    features: [
        'Excel/CSV Processing',
        'Data Validation',
        'Excel Export',
        'Dataset Merging',
        'Report Generation',
        'Data Cleaning',
        'Template Generation',
        'Statistical Analysis'
    ],
    supportedDataTypes: ['filosofi', 'opere', 'concetti']
});

console.log('✅ Excel Worker per Aeterna Lexicon caricato correttamente');