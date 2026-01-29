/**
 * LINGUISTIC-ANALYSIS.JS - Versione Semplificata per Project Work
 * Analisi linguistica filosofica - Solo funzionalità essenziali
 * Versione 3.1.0 - Senza analytics e multilingua
 */

// ==================== ANALIZZATORE LINGUISTICO ====================
class LinguisticAnalyzer {
    constructor() {
        console.log('📊 Analizzatore linguistico filosofico inizializzato');
        this.abstractTerms = this.getAbstractTerms();
        this.argumentativeMarkers = this.getArgumentativeMarkers();
    }

    /**
     * Analizza complessità testo filosofico
     */
    analyzeText(text) {
        if (!text || typeof text !== 'string') {
            return { error: 'Testo non valido per analisi' };
        }

        const cleanedText = text.trim();
        const words = cleanedText.split(/\s+/).filter(w => w.length > 0);
        const sentences = cleanedText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const paragraphs = cleanedText.split(/\n+/).filter(p => p.trim().length > 0);

        // Statistiche base
        const stats = {
            word_count: words.length,
            sentence_count: sentences.length,
            paragraph_count: paragraphs.length,
            avg_words_per_sentence: words.length / Math.max(sentences.length, 1),
            avg_word_length: words.reduce((sum, w) => sum + w.length, 0) / Math.max(words.length, 1),
            
            // Indicatori filosofici
            philosophical_indicators: {
                abstract_terms_count: this.countAbstractTerms(cleanedText),
                argumentative_markers_count: this.countArgumentativeMarkers(cleanedText),
                conceptual_density: this.calculateConceptualDensity(cleanedText, words.length),
                quotation_count: this.countQuotations(cleanedText),
                citation_count: this.countCitations(cleanedText)
            },

            // Livello di complessità
            complexity_level: this.determineComplexityLevel(words.length, sentences.length)
        };

        return stats;
    }

    /**
     * Ottiene lista termini astratti filosofici
     */
    getAbstractTerms() {
        return [
            // Ontologia
            'essere', 'essenza', 'esistenza', 'realtà', 'apparenza', 'verità',
            'sostanza', 'accidente', 'essenza', 'esistenza', 'ente', 'ontologia',
            
            // Epistemologia
            'conoscenza', 'scienza', 'sapere', 'verità', 'certezza', 'dubbio',
            'evidenza', 'prova', 'dimostrazione', 'ragione', 'intelletto', 'ragione',
            
            // Etica
            'bene', 'male', 'giusto', 'ingiusto', 'virtù', 'vizio', 'dovere',
            'diritto', 'libertà', 'responsabilità', 'coscienza', 'morale',
            
            // Estetica
            'bello', 'brutto', 'sublime', 'arte', 'creatività', 'genio',
            'gusto', 'giudizio', 'esperienza', 'percezione', 'sensibilità',
            
            // Politica
            'potere', 'autorità', 'legge', 'giustizia', 'stato', 'società',
            'comunità', 'individuo', 'collettivo', 'democrazia', 'tirannide',
            
            // Metafisica
            'anima', 'spirito', 'materia', 'forma', 'causa', 'effetto',
            'finalità', 'mezzo', 'fine', 'possibilità', 'necessità', 'caso',
            
            // Logica
            'concetto', 'giudizio', 'ragionamento', 'proposizione', 'argomento',
            'premessa', 'conclusione', 'deduzione', 'induzione', 'sillogismo',
            
            // Fenomenologia
            'coscienza', 'intenzionalità', 'esperienza', 'fenomeno', 'essenza',
            'riduzione', 'epochè', 'lebenswelt', 'intersoggettività'
        ];
    }

    /**
     * Ottiene marcatori argomentativi
     */
    getArgumentativeMarkers() {
        return {
            causal: ['perché', 'poiché', 'dato che', 'siccome', 'in quanto', 'giacché'],
            consecutive: ['quindi', 'dunque', 'pertanto', 'perciò', 'conseguentemente', 'dipoi'],
            adversative: ['tuttavia', 'però', 'ma', 'sebbene', 'anche se', 'nonostante'],
            additive: ['inoltre', 'altresì', 'parimenti', 'similmente', 'analogamente'],
            contrastive: ['invece', 'al contrario', 'viceversa', 'diversamente'],
            exemplificative: ['ad esempio', 'per esempio', 'cioè', 'ovvero', 'in altri termini'],
            conclusive: ['in conclusione', 'in sintesi', 'per riassumere', 'dunque', 'pertanto'],
            emphatic: ['infatti', 'in effetti', 'effettivamente', 'realmente', 'certamente']
        };
    }

    /**
     * Conta termini astratti in un testo
     */
    countAbstractTerms(text) {
        const textLower = text.toLowerCase();
        let count = 0;
        
        this.abstractTerms.forEach(term => {
            const regex = new RegExp(`\\b${term}\\b`, 'gi');
            const matches = textLower.match(regex);
            if (matches) count += matches.length;
        });

        return count;
    }

    /**
     * Conta marcatori argomentativi
     */
    countArgumentativeMarkers(text) {
        const textLower = text.toLowerCase();
        let totalCount = 0;
        const countsByType = {};

        Object.entries(this.argumentativeMarkers).forEach(([type, markers]) => {
            let typeCount = 0;
            
            markers.forEach(marker => {
                const regex = new RegExp(`\\b${marker}\\b`, 'gi');
                const matches = textLower.match(regex);
                if (matches) typeCount += matches.length;
            });

            countsByType[type] = typeCount;
            totalCount += typeCount;
        });

        return {
            total: totalCount,
            by_type: countsByType
        };
    }

    /**
     * Calcola densità concettuale
     */
    calculateConceptualDensity(text, totalWords) {
        const abstractCount = this.countAbstractTerms(text);
        return totalWords > 0 ? (abstractCount / totalWords) * 100 : 0;
    }

    /**
     * Conta citazioni nel testo
     */
    countQuotations(text) {
        const quoteRegex = /"[^"]*"|'[^']*'/g;
        const matches = text.match(quoteRegex);
        return matches ? matches.length : 0;
    }

    /**
     * Conta citazioni di autori
     */
    countCitations(text) {
        const citationRegex = /\([^)]*\)|\[[^\]]*\]/g;
        const matches = text.match(citationRegex);
        return matches ? matches.length : 0;
    }

    /**
     * Determina livello di complessità
     */
    determineComplexityLevel(wordCount, sentenceCount) {
        const wordsPerSentence = wordCount / Math.max(sentenceCount, 1);
        
        if (wordCount < 100) return 'basso';
        if (wordCount < 500) {
            if (wordsPerSentence > 25) return 'medio-alto';
            return 'medio';
        }
        if (wordsPerSentence > 30) return 'alto';
        if (wordsPerSentence > 20) return 'medio-alto';
        return 'medio';
    }

    /**
     * Estrae concetti chiave da un testo
     */
    extractKeyConcepts(text, maxConcepts = 10) {
        const words = text.toLowerCase()
            .split(/[^\w']+/)
            .filter(word => word.length > 3 && !this.isCommonWord(word));
        
        const wordFreq = {};
        words.forEach(word => {
            wordFreq[word] = (wordFreq[word] || 0) + 1;
        });

        // Ordina per frequenza
        const sortedWords = Object.entries(wordFreq)
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxConcepts)
            .map(([word, freq]) => ({
                term: word,
                frequency: freq,
                is_philosophical: this.abstractTerms.includes(word)
            }));

        return sortedWords;
    }

    /**
     * Verifica se una parola è comune
     */
    isCommonWord(word) {
        const commonWords = [
            'questo', 'quello', 'questi', 'quelli', 'questa', 'queste',
            'come', 'quando', 'dove', 'perché', 'quale', 'quali',
            'sua', 'sue', 'suoi', 'nostro', 'vostro', 'loro',
            'essere', 'avere', 'fare', 'dire', 'potere', 'volere',
            'dovere', 'sapere', 'vedere', 'sentire', 'pensare'
        ];
        return commonWords.includes(word);
    }

    /**
     * Confronta due testi filosofici
     */
    compareTexts(text1, text2) {
        const analysis1 = this.analyzeText(text1);
        const analysis2 = this.analyzeText(text2);

        // Calcola differenze percentuali
        const calculateDifference = (val1, val2) => {
            if (val1 === 0 && val2 === 0) return 0;
            if (val1 === 0) return 100;
            return ((val2 - val1) / val1) * 100;
        };

        return {
            text1: analysis1,
            text2: analysis2,
            comparison: {
                word_count_diff: calculateDifference(analysis1.word_count, analysis2.word_count),
                conceptual_density_diff: calculateDifference(
                    analysis1.philosophical_indicators.conceptual_density,
                    analysis2.philosophical_indicators.conceptual_density
                ),
                abstract_terms_diff: calculateDifference(
                    analysis1.philosophical_indicators.abstract_terms_count,
                    analysis2.philosophical_indicators.abstract_terms_count
                ),
                argumentative_markers_diff: calculateDifference(
                    analysis1.philosophical_indicators.argumentative_markers_count.total,
                    analysis2.philosophical_indicators.argumentative_markers_count.total
                ),
                overall_complexity: analysis1.complexity_level === analysis2.complexity_level 
                    ? 'simile' 
                    : analysis2.complexity_level
            },
            insights: this.generateComparisonInsights(analysis1, analysis2)
        };
    }

    /**
     * Genera insight dal confronto
     */
    generateComparisonInsights(analysis1, analysis2) {
        const insights = [];
        
        if (analysis2.philosophical_indicators.conceptual_density > 
            analysis1.philosophical_indicators.conceptual_density) {
            insights.push('Il secondo testo ha una maggiore densità concettuale');
        }
        
        if (analysis2.philosophical_indicators.argumentative_markers_count.total >
            analysis1.philosophical_indicators.argumentative_markers_count.total) {
            insights.push('Il secondo testo è più argomentativo');
        }
        
        if (analysis2.word_count > analysis1.word_count * 1.5) {
            insights.push('Il secondo testo è significativamente più lungo');
        }
        
        if (analysis2.complexity_level !== analysis1.complexity_level) {
            insights.push(`Complessità: ${analysis1.complexity_level} → ${analysis2.complexity_level}`);
        }

        return insights;
    }
}

// ==================== TIMELINE EVOLUTIVA ====================
class PhilosophicalTimeline {
    constructor() {
        console.log('📈 Timeline filosofica inizializzata');
    }

    /**
     * Crea timeline visiva
     */
    createTimeline(containerId, timelineData) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Container timeline non trovato:', containerId);
            return;
        }

        // Ordina dati per anno
        const sortedData = [...timelineData].sort((a, b) => a.year - b.year);
        
        // Crea HTML timeline
        container.innerHTML = this.generateTimelineHTML(sortedData);
        
        // Aggiungi event listener
        this.addTimelineEventListeners();
    }

    /**
     * Genera HTML timeline
     */
    generateTimelineHTML(data) {
        if (!data || data.length === 0) {
            return '<div class="empty-timeline">Nessun dato per la timeline</div>';
        }

        // Calcola range anni per scaling
        const years = data.map(item => item.year);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        const yearRange = maxYear - minYear;

        return `
            <div class="timeline-container">
                <div class="timeline-track">
                    ${data.map((item, index) => this.createTimelineItem(item, index, minYear, yearRange)).join('')}
                </div>
                <div class="timeline-scale">
                    <span>${minYear < 0 ? Math.abs(minYear) + ' a.C.' : minYear + ' d.C.'}</span>
                    <span>${maxYear < 0 ? Math.abs(maxYear) + ' a.C.' : maxYear + ' d.C.'}</span>
                </div>
            </div>
        `;
    }

    /**
     * Crea singolo elemento timeline
     */
    createTimelineItem(item, index, minYear, yearRange) {
        const year = item.year;
        const position = yearRange > 0 ? ((year - minYear) / yearRange) * 90 + 5 : 50;
        const yearLabel = year < 0 ? `${Math.abs(year)} a.C.` : `${year} d.C.`;
        const periodClass = this.getPeriodClass(item.period);

        return `
            <div class="timeline-item ${periodClass}" 
                 style="left: ${position}%;"
                 data-index="${index}"
                 data-year="${year}">
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                    <div class="timeline-year">${yearLabel}</div>
                    ${item.philosopher ? `<div class="timeline-philosopher">${item.philosopher}</div>` : ''}
                    ${item.work ? `<div class="timeline-work">${item.work}</div>` : ''}
                    ${item.concept ? `<div class="timeline-concept">${item.concept}</div>` : ''}
                    ${item.excerpt ? `<div class="timeline-excerpt">"${item.excerpt}"</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Ottiene classe CSS per periodo
     */
    getPeriodClass(period) {
        const periodMap = {
            'antico': 'period-antico',
            'classico': 'period-classico',
            'medioevale': 'period-medioevale',
            'rinascimentale': 'period-rinascimentale',
            'moderno': 'period-moderno',
            'contemporaneo': 'period-contemporaneo',
            'classico/contemporaneo': 'period-mixed'
        };
        return periodMap[period] || 'period-default';
    }

    /**
     * Aggiunge interattività alla timeline
     */
    addTimelineEventListeners() {
        document.querySelectorAll('.timeline-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showTimelineItemDetails(item);
            });
            
            item.addEventListener('mouseenter', () => {
                item.classList.add('timeline-item-hover');
            });
            
            item.addEventListener('mouseleave', () => {
                item.classList.remove('timeline-item-hover');
            });
        });
    }

    /**
     * Mostra dettagli elemento timeline
     */
    showTimelineItemDetails(itemElement) {
        const index = itemElement.getAttribute('data-index');
        const year = itemElement.getAttribute('data-year');
        
        // Qui potresti mostrare un modal con più dettagli
        console.log(`Selezionato elemento timeline: indice ${index}, anno ${year}`);
        
        // Per ora mostriamo un semplice alert
        const content = itemElement.querySelector('.timeline-content').innerHTML;
        alert(`Anno: ${year}\n\n${content}`);
    }

    /**
     * Genera timeline da dati filosofici
     */
    generateFromPhilosophicalData(filosofiData, opereData, concettiData) {
        const timelineItems = [];

        // Aggiungi filosofi
        filosofiData.forEach(filosofo => {
            const birthYear = this.extractYearFromString(filosofo.anni, 'birth');
            if (birthYear) {
                timelineItems.push({
                    year: birthYear,
                    period: filosofo.periodo,
                    philosopher: filosofo.nome,
                    type: 'filosofo_birth',
                    description: `Nascita di ${filosofo.nome}`
                });
            }
        });

        // Aggiugi opere
        opereData.forEach(opera => {
            const publicationYear = this.extractYearFromString(opera.anno);
            if (publicationYear) {
                timelineItems.push({
                    year: publicationYear,
                    period: opera.periodo,
                    work: opera.titolo,
                    philosopher: opera.autore,
                    type: 'opera_publication',
                    description: `Pubblicazione di "${opera.titolo}"`
                });
            }
        });

        // Aggiungi concetti importanti
        concettiData.forEach(concetto => {
            if (concetto.periodo === 'entrambi') {
                timelineItems.push({
                    year: 0, // Punto medio
                    period: 'classico/contemporaneo',
                    concept: concetto.parola,
                    type: 'concept_evolution',
                    description: `Evoluzione del concetto "${concetto.parola}"`
                });
            }
        });

        // Ordina per anno
        return timelineItems.sort((a, b) => a.year - b.year);
    }

    /**
     * Estrae anno da stringa
     */
    extractYearFromString(yearString, type = 'publication') {
        if (!yearString) return null;
        
        const match = yearString.match(/(-?\d+)/);
        if (match) {
            let year = parseInt(match[1]);
            
            // Gestisce anni a.C.
            if (yearString.toLowerCase().includes('a.c.')) {
                year = -year;
            }
            
            // Per nascita filosofi, aggiusta se necessario
            if (type === 'birth' && year > 0 && year < 100) {
                year = -year; // Assume filosofi antichi nati a.C.
            }
            
            return year;
        }
        
        return null;
    }
}

// ==================== ANALISI COMPARATIVA ====================
class ComparativeAnalysis {
    constructor() {
        console.log('🔍 Analisi comparativa filosofica inizializzata');
        this.linguisticAnalyzer = new LinguisticAnalyzer();
    }

    /**
     * Esegue analisi comparativa completa
     */
    performAnalysis(concept, classiciData, contemporaneiData) {
        return {
            concept: concept,
            metadata: {
                analysis_date: new Date().toISOString(),
                classici_count: classiciData.length,
                contemporanei_count: contemporaneiData.length
            },
            linguistic_comparison: this.compareLinguisticFeatures(classiciData, contemporaneiData),
            conceptual_evolution: this.analyzeConceptualEvolution(classiciData, contemporaneiData),
            historical_transformations: this.identifyTransformations(classiciData, contemporaneiData),
            key_insights: this.generateInsights(classiciData, contemporaneiData)
        };
    }

    /**
     * Confronta caratteristiche linguistiche
     */
    compareLinguisticFeatures(classiciData, contemporaneiData) {
        // Estrai testi
        const classiciText = this.extractTextForAnalysis(classiciData);
        const contemporaneiText = this.extractTextForAnalysis(contemporaneiData);
        
        // Analisi linguistica
        const classiciAnalysis = this.linguisticAnalyzer.analyzeText(classiciText);
        const contemporaneiAnalysis = this.linguisticAnalyzer.analyzeText(contemporaneiText);
        
        return {
            classici: classiciAnalysis,
            contemporanei: contemporaneiAnalysis,
            differences: {
                word_count: contemporaneiAnalysis.word_count - classiciAnalysis.word_count,
                conceptual_density: (contemporaneiAnalysis.philosophical_indicators.conceptual_density - 
                                   classiciAnalysis.philosophical_indicators.conceptual_density).toFixed(2),
                abstract_terms: contemporaneiAnalysis.philosophical_indicators.abstract_terms_count - 
                              classiciAnalysis.philosophical_indicators.abstract_terms_count,
                argumentative_markers: contemporaneiAnalysis.philosophical_indicators.argumentative_markers_count.total - 
                                     classiciAnalysis.philosophical_indicators.argumentative_markers_count.total
            }
        };
    }

    /**
     * Estrae testo per analisi
     */
    extractTextForAnalysis(data) {
        const texts = [];
        
        data.forEach(item => {
            if (item.biografia) texts.push(item.biografia);
            if (item.sintesi) texts.push(item.sintesi);
            if (item.definizione) texts.push(item.definizione);
            if (item.esempio) texts.push(item.esempio);
        });
        
        return texts.join(' ');
    }

    /**
     * Analizza evoluzione concettuale
     */
    analyzeConceptualEvolution(classiciData, contemporaneiData) {
        const classiciConcepts = this.extractConcepts(classiciData);
        const contemporaneiConcepts = this.extractConcepts(contemporaneiData);
        
        return {
            classici_concepts: classiciConcepts,
            contemporanei_concepts: contemporaneiConcepts,
            common_concepts: this.findCommonConcepts(classiciConcepts, contemporaneiConcepts),
            new_concepts: this.findNewConcepts(classiciConcepts, contemporaneiConcepts),
            lost_concepts: this.findLostConcepts(classiciConcepts, contemporaneiConcepts)
        };
    }

    /**
     * Estrae concetti da dati
     */
    extractConcepts(data) {
        const concepts = new Set();
        
        data.forEach(item => {
            if (item.concetti_principali) {
                item.concetti_principali.forEach(concetto => concepts.add(concetto));
            }
            if (item.concetti) {
                item.concetti.forEach(concetto => concepts.add(concetto));
            }
        });
        
        return Array.from(concepts);
    }

    /**
     * Trova concetti comuni
     */
    findCommonConcepts(classici, contemporanei) {
        return classici.filter(concetto => contemporanei.includes(concetto));
    }

    /**
     * Trova nuovi concetti
     */
    findNewConcepts(classici, contemporanei) {
        return contemporanei.filter(concetto => !classici.includes(concetto));
    }

    /**
     * Trova concetti persi
     */
    findLostConcepts(classici, contemporanei) {
        return classici.filter(concetto => !contemporanei.includes(concetto));
    }

    /**
     * Identifica trasformazioni storiche
     */
    identifyTransformations(classiciData, contemporaneiData) {
        const transformations = [];
        
        // Analizza differenze semantiche
        const semanticShifts = this.analyzeSemanticShifts(classiciData, contemporaneiData);
        
        // Aggiungi trasformazioni note
        transformations.push({
            dimension: 'ONTOLOGICA',
            classico: 'Sostanza/Essenza',
            contemporaneo: 'Relazione/Processo',
            description: 'Da ontologia sostanzialista a ontologia relazionale',
            key_philosophers: ['Aristotele', 'Heidegger', 'Whitehead']
        });
        
        transformations.push({
            dimension: 'EPISTEMOLOGICA',
            classico: 'Verità come corrispondenza',
            contemporaneo: 'Verità come costruzione',
            description: 'Da epistemologia corrispondentista a costruttivista',
            key_philosophers: ['Platone', 'Nietzsche', 'Foucault']
        });
        
        transformations.push({
            dimension: 'ETICA',
            classico: 'Universalità/Dovere',
            contemporaneo: 'Singolarità/Responsabilità',
            description: 'Da etica deontologica a etica della responsabilità',
            key_philosophers: ['Kant', 'Levinas', 'Derrida']
        });
        
        transformations.push({
            dimension: 'POLITICA',
            classico: 'Sovranità/Legge',
            contemporaneo: 'Biopotere/Governamentalità',
            description: 'Da teoria della sovranità a analitica del potere',
            key_philosophers: ['Hobbes', 'Foucault', 'Agamben']
        });
        
        return {
            transformations: transformations,
            semantic_shifts: semanticShifts,
            summary: 'Trasformazione da paradigma metafisico-sostanzialista a paradigma storico-relazionale'
        };
    }

    /**
     * Analizza cambiamenti semantici
     */
    analyzeSemanticShifts(classiciData, contemporaneiData) {
        // Implementazione semplificata
        return [
            'Da universale a particolare',
            'Da necessario a contingente',
            'Da eterno a storico',
            'Da assoluto a relativo',
            'Da sostanziale a processuale'
        ];
    }

    /**
     * Genera insight dall'analisi
     */
    generateInsights(classiciData, contemporaneiData) {
        const insights = [];
        
        insights.push('Il pensiero contemporaneo privilegia la relazione sulla sostanza');
        insights.push('Importanza crescente del contesto storico-culturale');
        insights.push('Passaggio dalla metafisica alla critica');
        insights.push('Centralità del linguaggio e del discorso');
        insights.push('Attenzione alle dinamiche di potere');
        
        return insights;
    }

    /**
     * Esporta risultati analisi
     */
    exportAnalysis(analysis, format = 'json') {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `analisi-comparativa-${analysis.concept}-${timestamp}`;
        
        switch(format) {
            case 'json':
                return {
                    filename: `${filename}.json`,
                    content: JSON.stringify(analysis, null, 2),
                    type: 'application/json'
                };
                
            case 'txt':
                const textContent = this.formatAsText(analysis);
                return {
                    filename: `${filename}.txt`,
                    content: textContent,
                    type: 'text/plain'
                };
                
            default:
                throw new Error(`Formato non supportato: ${format}`);
        }
    }

    /**
     * Formatta analisi come testo
     */
    formatAsText(analysis) {
        return `
ANALISI COMPARATIVA FILOSOFICA
==============================

Concetto Analizzato: ${analysis.concept}
Data Analisi: ${new Date().toLocaleDateString('it-IT')}

METADATI:
---------
Classici analizzati: ${analysis.metadata.classici_count}
Contemporanei analizzati: ${analysis.metadata.contemporanei_count}

TRASFORMAZIONI IDENTIFICATE:
---------------------------
${analysis.historical_transformations.transformations.map(t => 
    `• ${t.dimension}: ${t.classico} → ${t.contemporaneo}\n  ${t.description}`
).join('\n\n')}

INSIGHT PRINCIPALI:
------------------
${analysis.key_insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

NOTE METODOLOGICHE:
------------------
Analisi basata su dataset filosofico strutturato.
Confronto sincronico e diacronico.
Attenzione al contesto d'uso dei termini.
        `.trim();
    }
}

// ==================== INIZIALIZZAZIONE GLOBALE ====================

// Crea istanze globali
window.LinguisticAnalyzer = new LinguisticAnalyzer();
window.PhilosophicalTimeline = new PhilosophicalTimeline();
window.ComparativeAnalysis = new ComparativeAnalysis();

// Funzioni helper globali
window.analyzePhilosophicalText = function(text) {
    return window.LinguisticAnalyzer.analyzeText(text);
};

window.createPhilosophicalTimeline = function(containerId, data) {
    return window.PhilosophicalTimeline.createTimeline(containerId, data);
};

window.performComparativeStudy = function(concept, classiciData, contemporaneiData) {
    return window.ComparativeAnalysis.performAnalysis(concept, classiciData, contemporaneiData);
};

window.exportComparativeAnalysis = function(analysis, format) {
    const result = window.ComparativeAnalysis.exportAnalysis(analysis, format);
    
    // Crea e scarica file
    const blob = new Blob([result.content], { type: result.type });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return result.filename;
};

console.log('✅ Moduli analisi linguistica filosofica caricati');