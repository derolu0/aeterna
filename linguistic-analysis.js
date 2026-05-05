/**
 * AETERNA - Lexicon in Motu
 * @module DataLayer (o AppCore, o LinguisticAnalyzer)
 * @author Dott. Salvatore De Rosa
 * @license MIT
 * @description Sistema di analisi ermeneutica digitale - Framework scalabile
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

        // Statistiche base
        const stats = {
            word_count: words.length,
            sentence_count: sentences.length,
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
            'sostanza', 'accidente', 'ente', 'ontologia',
            
            // Epistemologia
            'conoscenza', 'scienza', 'sapere', 'certezza', 'dubbio',
            'evidenza', 'prova', 'dimostrazione', 'ragione', 'intelletto',
            
            // Etica
            'bene', 'male', 'giusto', 'ingiusto', 'virtù', 'vizio', 'dovere',
            'diritto', 'libertà', 'responsabilità', 'coscienza', 'morale',
            
            // Estetica
            'bello', 'brutto', 'sublime', 'arte', 'creatività', 'genio',
            'gusto', 'giudizio', 'esperienza', 'percezione',
            
            // Politica
            'potere', 'autorità', 'legge', 'giustizia', 'stato', 'società',
            'comunità', 'individuo', 'collettivo', 'democrazia',
            
            // Metafisica
            'anima', 'spirito', 'materia', 'forma', 'causa', 'effetto',
            'finalità', 'mezzo', 'fine', 'possibilità', 'necessità',
            
            // Logica
            'concetto', 'giudizio', 'ragionamento', 'proposizione', 'argomento',
            'premessa', 'conclusione', 'deduzione', 'induzione',
        ];
    }

    /**
     * Ottiene marcatori argomentativi
     */
    getArgumentativeMarkers() {
        return {
            causal: ['perché', 'poiché', 'dato che', 'siccome', 'in quanto'],
            consecutive: ['quindi', 'dunque', 'pertanto', 'perciò', 'conseguentemente'],
            adversative: ['tuttavia', 'però', 'ma', 'sebbene', 'anche se', 'nonostante'],
            additive: ['inoltre', 'altresì', 'parimenti', 'similmente', 'analogamente'],
            contrastive: ['invece', 'al contrario', 'viceversa', 'diversamente'],
            exemplificative: ['ad esempio', 'per esempio', 'cioè', 'ovvero'],
            conclusive: ['in conclusione', 'in sintesi', 'per riassumere', 'dunque'],
            emphatic: ['infatti', 'in effetti', 'effettivamente', 'realmente']
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

// ==================== DATI PER ANALISI COMPARATIVA ====================
window.comparativeData = {
    testiComparativi: {},
    trasformazioni: {},
    
    // Funzioni helper per l'analisi
    getClassicalText: function(concetto) {
        return this.testiComparativi[concetto]?.classico || {
            testo: "Testo classico non disponibile per questo concetto.",
            definizione: "Definizione classica non disponibile.",
            autore: "Autore classico"
        };
    },
    
    getContemporaryText: function(concetto) {
        return this.testiComparativi[concetto]?.contemporaneo || {
            testo: "Testo contemporaneo non disponibile per questo concetto.",
            definizione: "Definizione contemporanea non disponibile.",
            autore: "Autore contemporaneo"
        };
    },
    
    getTransformations: function(concetto) {
        return this.trasformazioni[concetto] || ["Trasformazione non disponibile"];
    }
};

// ==================== INIZIALIZZAZIONE GLOBALE ====================

// Crea istanza globale
window.LinguisticAnalyzer = new LinguisticAnalyzer();

// Funzioni helper globali
window.analyzePhilosophicalText = function(text) {
    return window.LinguisticAnalyzer.analyzeText(text);
};

window.performComparativeStudy = function(concetto) {
    const data = window.comparativeData;
    const classico = data.getClassicalText(concetto);
    const contemporaneo = data.getContemporaryText(concetto);
    const trasformazioni = data.getTransformations(concetto);
    
    return {
        concetto: concetto,
        classico: classico,
        contemporaneo: contemporaneo,
        trasformazioni: trasformazioni,
        analisi_linguistica: window.LinguisticAnalyzer.compareTexts(classico.testo, contemporaneo.testo)
    };
};

window.exportComparativeAnalysis = function(concetto) {
    const analysis = window.performComparativeStudy(concetto);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `analisi-${concetto}-${timestamp}.txt`;
    
    const content = `
ANALISI COMPARATIVA FILOSOFICA
==============================

Concetto: ${analysis.concetto}
Data Analisi: ${new Date().toLocaleDateString('it-IT')}

TESTI ANALIZZATI:
-----------------

PERIODO CLASSICO:
Autore: ${analysis.classico.autore}
Opera: ${analysis.classico.opera}
Testo: ${analysis.classico.testo}
Definizione: ${analysis.classico.definizione}

PERIODO CONTEMPORANEO:
Autore: ${analysis.contemporaneo.autore}
Opera: ${analysis.contemporaneo.opera}
Testo: ${analysis.contemporaneo.testo}
Definizione: ${analysis.contemporaneo.definizione}

TRASFORMAZIONI IDENTIFICATE:
---------------------------
${analysis.trasformazioni.map((t, i) => `${i + 1}. ${t}`).join('\n')}

ANALISI LINGUISTICA:
-------------------
- Differenza lunghezza testi: ${analysis.analisi_linguistica.comparison.word_count_diff.toFixed(2)}%
- Differenza densità concettuale: ${analysis.analisi_linguistica.comparison.conceptual_density_diff.toFixed(2)}%
- Complessità complessiva: ${analysis.analisi_linguistica.comparison.overall_complexity}

INSIGHT:
--------
${analysis.analisi_linguistica.insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}
    `.trim();
    
    // Crea e scarica file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return filename;
};

console.log('✅ Moduli analisi linguistica filosofica caricati');
