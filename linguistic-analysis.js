// linguistic-analysis.js - NUOVO FILE
// Analisi linguistica per confronto concetti filosofici

window.LinguisticAnalysis = {
  // VERSIONE
  version: '1.0.0',
  
  // CONFIGURAZIONE
  config: {
    minTermLength: 3,
    caseSensitive: false,
    stopWords: ['il', 'la', 'lo', 'i', 'gli', 'le', 'un', 'una', 'uno', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'è', 'sono', 'e', 'o', 'ma', 'se', 'che', 'come', 'quando', 'dove', 'perché'],
    contextKeywords: {
      ontologico: ['essere', 'esistenza', 'realtà', 'sostanza', 'essenza', 'ente', 'divenire'],
      epistemico: ['conoscenza', 'verità', 'scienza', 'ragione', 'esperienza', 'certezza', 'dubbio'],
      etico: ['morale', 'virtù', 'bene', 'male', 'dovere', 'responsabilità', 'libertà'],
      politico: ['potere', 'stato', 'società', 'giustizia', 'legge', 'autorità', 'rivoluzione'],
      estetico: ['bello', 'arte', 'creatività', 'immaginazione', 'sensibilità', 'gusto']
    }
  },
  
  // 1. ANALISI DI BASE DI UN TERMINE
  analizzaTermine: function(termine, corpus) {
    console.log(`[LinguisticAnalysis] Analisi termine: "${termine}"`);
    
    if (!termine || termine.length < this.config.minTermLength) {
      return { errore: 'Termine troppo corto', termine };
    }
    
    const termineNormalizzato = this.config.caseSensitive ? termine : termine.toLowerCase();
    const corpusNormalizzato = this.config.caseSensitive ? corpus : corpus.map(t => t.toLowerCase());
    
    return {
      termine: termine,
      frequenza: this.calcolaFrequenza(termineNormalizzato, corpusNormalizzato),
      contesti: this.identificaContesti(termineNormalizzato, corpusNormalizzato),
      correlazioni: this.trovaCorrelazioni(termineNormalizzato, corpusNormalizzato),
      metriche: this.calcolaMetriche(termineNormalizzato, corpusNormalizzato)
    };
  },
  
  // 2. CONFRONTO TRA DUE PERIODI STORICI
  confrontaPeriodi: function(termine, corpusClassico, corpusContemporaneo) {
    console.log(`[LinguisticAnalysis] Confronto periodi per: "${termine}"`);
    
    const analisiClassica = this.analizzaTermine(termine, corpusClassico);
    const analisiContemporanea = this.analizzaTermine(termine, corpusContemporaneo);
    
    const differenze = this.calcolaDifferenze(analisiClassica, analisiContemporanea);
    
    return {
      termine: termine,
      classico: analisiClassica,
      contemporaneo: analisiContemporanea,
      differenze: differenze,
      trasformazioni: this.identificaTrasformazioni(analisiClassica, analisiContemporanea),
      riepilogo: this.generaRiepilogoConfronto(analisiClassica, analisiContemporanea, differenze)
    };
  },
  
  // 3. TIMELINE EVOLUTIVA
  generaTimeline: function(termine, occorrenze) {
    if (!occorrenze || occorrenze.length === 0) {
      return { termine, timeline: [], messaggio: 'Nessuna occorrenza trovata' };
    }
    
    const occorrenzeOrdinate = occorrenze
      .filter(occ => occ.anno && occ.autore)
      .sort((a, b) => a.anno - b.anno)
      .slice(0, 15); // Limita a 15 voci per performance
    
    return {
      termine: termine,
      timeline: occorrenzeOrdinate.map(occ => ({
        anno: occ.anno,
        periodo: this.determinaPeriodoStorico(occ.anno),
        autore: occ.autore,
        opera: occ.opera || 'Opera non specificata',
        estratto: occ.testo ? occ.testo.substring(0, 120) + '...' : '',
        contesto: occ.contesto || this.inferisciContesto(occ.testo || ''),
        coordinate: occ.coordinate || null
      })),
      statistiche: {
        totaleOccorrenze: occorrenze.length,
        periodoPiuAttivo: this.calcolaPeriodoPiuAttivo(occorrenzeOrdinate),
        autoriPrincipali: this.calcolaAutoriPrincipali(occorrenzeOrdinate)
      }
    };
  },
  
  // 4. FUNZIONI AUSILIARIE
  calcolaFrequenza: function(termine, corpus) {
    let count = 0;
    let posizioni = [];
    
    corpus.forEach((testo, index) => {
      if (!testo) return;
      
      const regex = new RegExp(`\\b${this.escapeRegExp(termine)}\\b`, 'gi');
      const matches = testo.match(regex);
      
      if (matches) {
        count += matches.length;
        posizioni.push({ indiceTesto: index, occorrenze: matches.length });
      }
    });
    
    return {
      assoluta: count,
      relativa: corpus.length > 0 ? (count / corpus.length).toFixed(3) : 0,
      densita: corpus.reduce((tot, testo) => tot + (testo ? testo.length : 0), 0) > 0 
        ? (count / corpus.reduce((tot, testo) => tot + (testo ? testo.length : 0), 0) * 1000).toFixed(3)
        : 0,
      distribuzione: posizioni
    };
  },
  
  identificaContesti: function(termine, corpus) {
    const contesti = new Set();
    const contestiPonderati = {};
    
    Object.keys(this.config.contextKeywords).forEach(tipo => {
      contestiPonderati[tipo] = 0;
    });
    
    corpus.forEach(testo => {
      if (!testo) return;
      
      Object.keys(this.config.contextKeywords).forEach(tipo => {
        const keywords = this.config.contextKeywords[tipo];
        keywords.forEach(keyword => {
          if (testo.includes(keyword)) {
            contesti.add(tipo);
            contestiPonderati[tipo] += 1;
          }
        });
      });
    });
    
    // Ordina contesti per peso
    const contestiOrdinati = Object.keys(contestiPonderati)
      .filter(tipo => contestiPonderati[tipo] > 0)
      .sort((a, b) => contestiPonderati[b] - contestiPonderati[a])
      .map(tipo => ({ tipo, peso: contestiPonderati[tipo] }));
    
    return {
      tipi: Array.from(contesti),
      dettagli: contestiOrdinati,
      principale: contestiOrdinati.length > 0 ? contestiOrdinati[0].tipo : 'non determinato'
    };
  },
  
  trovaCorrelazioni: function(termine, corpus, maxCorrelazioni = 10) {
    const terminiFrequenti = {};
    const stopWordsSet = new Set(this.config.stopWords.map(w => w.toLowerCase()));
    
    corpus.forEach(testo => {
      if (!testo) return;
      
      // Tokenizzazione semplice
      const parole = testo.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(parola => 
          parola.length >= 3 && 
          !stopWordsSet.has(parola) && 
          parola !== termine.toLowerCase()
        );
      
      parole.forEach(parola => {
        if (!terminiFrequenti[parola]) {
          terminiFrequenti[parola] = 0;
        }
        terminiFrequenti[parola] += 1;
      });
    });
    
    // Converti in array e ordina
    const correlazioni = Object.keys(terminiFrequenti)
      .map(termine => ({ termine, frequenza: terminiFrequenti[termine] }))
      .sort((a, b) => b.frequenza - a.frequenza)
      .slice(0, maxCorrelazioni);
    
    return correlazioni;
  },
  
  determinaPeriodoStorico: function(anno) {
    if (!anno || isNaN(anno)) return 'non determinato';
    
    if (anno < -800) return 'pre-socratico';
    if (anno < 476) return 'classico';
    if (anno < 1453) return 'medioevale';
    if (anno < 1789) return 'rinascimentale/moderno';
    if (anno < 1900) return 'moderno';
    if (anno < 2000) return 'contemporaneo (XX sec.)';
    return 'contemporaneo (XXI sec.)';
  },
  
  inferisciContesto: function(testo) {
    if (!testo) return 'non determinato';
    
    const testoLower = testo.toLowerCase();
    const contesti = [];
    
    Object.keys(this.config.contextKeywords).forEach(tipo => {
      const keywords = this.config.contextKeywords[tipo];
      if (keywords.some(keyword => testoLower.includes(keyword))) {
        contesti.push(tipo);
      }
    });
    
    return contesti.length > 0 ? contesti.join(', ') : 'generico';
  },
  
  calcolaDifferenze: function(analisiClassica, analisiContemporanea) {
    const differenze = {
      frequenza: {
        classica: analisiClassica.frequenza.assoluta,
        contemporanea: analisiContemporanea.frequenza.assoluta,
        variazione: analisiContemporanea.frequenza.assoluta - analisiClassica.frequenza.assoluta,
        percentuale: analisiClassica.frequenza.assoluta > 0 
          ? ((analisiContemporanea.frequenza.assoluta - analisiClassica.frequenza.assoluta) / analisiClassica.frequenza.assoluta * 100).toFixed(1)
          : 0
      },
      contesti: {
        classici: analisiClassica.contesti.tipi,
        contemporanei: analisiContemporanea.contesti.tipi,
        nuoviContesti: analisiContemporanea.contesti.tipi.filter(c => !analisiClassica.contesti.tipi.includes(c)),
        contestiPersi: analisiClassica.contesti.tipi.filter(c => !analisiContemporanea.contesti.tipi.includes(c))
      },
      correlazioni: {
        variazioni: this.calcolaVariazioniCorrelazioni(
          analisiClassica.correlazioni, 
          analisiContemporanea.correlazioni
        )
      }
    };
    
    return differenze;
  },
  
  calcolaVariazioniCorrelazioni: function(correlazioniClassiche, correlazioniContemporanee) {
    const classicheMap = new Map(correlazioniClassiche.map(c => [c.termine, c.frequenza]));
    const contemporaneeMap = new Map(correlazioniContemporanee.map(c => [c.termine, c.frequenza]));
    
    const tutteChiavi = new Set([
      ...classicheMap.keys(),
      ...contemporaneeMap.keys()
    ]);
    
    const variazioni = [];
    
    tutteChiavi.forEach(termine => {
      const freqClassica = classicheMap.get(termine) || 0;
      const freqContemporanea = contemporaneeMap.get(termine) || 0;
      const variazione = freqContemporanea - freqClassica;
      
      variazioni.push({
        termine,
        classica: freqClassica,
        contemporanea: freqContemporanea,
        variazione,
        tendenza: variazione > 0 ? 'aumento' : variazione < 0 ? 'diminuzione' : 'stabile'
      });
    });
    
    return variazioni
      .sort((a, b) => Math.abs(b.variazione) - Math.abs(a.variazione))
      .slice(0, 10);
  },
  
  identificaTrasformazioni: function(analisiClassica, analisiContemporanea) {
    const trasformazioni = [];
    
    // 1. Trasformazione contestuale
    const contestiClassici = new Set(analisiClassica.contesti.tipi);
    const contestiContemporanei = new Set(analisiContemporanea.contesti.tipi);
    
    if (!this.setsAreEqual(contestiClassici, contestiContemporanei)) {
      trasformazioni.push({
        tipo: 'contestuale',
        descrizione: 'Cambiamento nei contesti d\'uso',
        dettagli: {
          da: Array.from(contestiClassici),
          a: Array.from(contestiContemporanei)
        }
      });
    }
    
    // 2. Trasformazione semantica (basata su correlazioni)
    const correlazioniPrincipaliClassiche = analisiClassica.correlazioni.slice(0, 5).map(c => c.termine);
    const correlazioniPrincipaliContemporanee = analisiContemporanea.correlazioni.slice(0, 5).map(c => c.termine);
    
    const similarita = this.calcolaSimilarita(
      correlazioniPrincipaliClassiche, 
      correlazioniPrincipaliContemporanee
    );
    
    if (similarita < 0.5) {
      trasformazioni.push({
        tipo: 'semantica',
        descrizione: 'Ridefinizione semantica del concetto',
        similarita: similarita.toFixed(2),
        dettagli: {
          associazioniClassiche: correlazioniPrincipaliClassiche,
          associazioniContemporanee: correlazioniPrincipaliContemporanee
        }
      });
    }
    
    // 3. Trasformazione di frequenza
    const variazioneFreq = analisiContemporanea.frequenza.assoluta - analisiClassica.frequenza.assoluta;
    const variazionePercentuale = analisiClassica.frequenza.assoluta > 0 
      ? (variazioneFreq / analisiClassica.frequenza.assoluta * 100)
      : 0;
    
    if (Math.abs(variazionePercentuale) > 50) {
      trasformazioni.push({
        tipo: 'frequenza',
        descrizione: variazionePercentuale > 0 
          ? 'Aumento significativo dell\'uso del termine'
          : 'Diminuzione significativa dell\'uso del termine',
        percentuale: Math.abs(variazionePercentuale).toFixed(1) + '%',
        tendenza: variazionePercentuale > 0 ? 'aumento' : 'diminuzione'
      });
    }
    
    return trasformazioni;
  },
  
  // 5. UTILITIES
  escapeRegExp: function(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },
  
  setsAreEqual: function(setA, setB) {
    if (setA.size !== setB.size) return false;
    for (const item of setA) {
      if (!setB.has(item)) return false;
    }
    return true;
  },
  
  calcolaSimilarita: function(arrayA, arrayB) {
    const setA = new Set(arrayA);
    const setB = new Set(arrayB);
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  },
  
  calcolaMetriche: function(termine, corpus) {
    const frequenza = this.calcolaFrequenza(termine, corpus);
    const contesti = this.identificaContesti(termine, corpus);
    
    return {
      complessita: {
        score: (frequenza.relativa * 10 + contesti.dettagli.length * 5).toFixed(1),
        descrizione: frequenza.relativa > 0.1 ? 'termine centrale' : 'termine marginale'
      },
      versatilita: {
        score: contesti.dettagli.length,
        descrizione: contesti.dettagli.length > 2 ? 'termine versatile' : 'termine specializzato'
      },
      stabilità: {
        score: 'N/A', // Da calcolare su timeline
        descrizione: 'da analizzare su timeline'
      }
    };
  },
  
  calcolaPeriodoPiuAttivo: function(timeline) {
    if (timeline.length === 0) return null;
    
    const periodiCount = {};
    timeline.forEach(item => {
      if (!periodiCount[item.periodo]) {
        periodiCount[item.periodo] = 0;
      }
      periodiCount[item.periodo] += 1;
    });
    
    return Object.keys(periodiCount)
      .map(periodo => ({ periodo, count: periodiCount[periodo] }))
      .sort((a, b) => b.count - a.count)[0];
  },
  
  calcolaAutoriPrincipali: function(timeline) {
    if (timeline.length === 0) return [];
    
    const autoriCount = {};
    timeline.forEach(item => {
      if (!autoriCount[item.autore]) {
        autoriCount[item.autore] = 0;
      }
      autoriCount[item.autore] += 1;
    });
    
    return Object.keys(autoriCount)
      .map(autore => ({ autore, count: autoriCount[autore] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  },
  
  generaRiepilogoConfronto: function(classico, contemporaneo, differenze) {
    const riepilogo = {
      titolo: `Confronto: ${classico.termine}`,
      puntiChiave: []
    };
    
    // Frequenza
    if (differenze.frequenza.percentuale > 20) {
      riepilogo.puntiChiave.push(
        `L'uso del termine è aumentato del ${differenze.frequenza.percentuale}% nel periodo contemporaneo`
      );
    } else if (differenze.frequenza.percentuale < -20) {
      riepilogo.puntiChiave.push(
        `L'uso del termine è diminuito del ${Math.abs(differenze.frequenza.percentuale)}% nel periodo contemporaneo`
      );
    } else {
      riepilogo.puntiChiave.push('La frequenza d\'uso è rimasta sostanzialmente stabile');
    }
    
    // Contesti
    if (differenze.contesti.nuoviContesti.length > 0) {
      riepilogo.puntiChiave.push(
        `Nuovi contesti d'uso: ${differenze.contesti.nuoviContesti.join(', ')}`
      );
    }
    
    if (differenze.contesti.contestiPersi.length > 0) {
      riepilogo.puntiChiave.push(
        `Contesti abbandonati: ${differenze.contesti.contestiPersi.join(', ')}`
      );
    }
    
    // Complessità
    const complessitaClassica = classico.metriche.complessita.score;
    const complessitaContemporanea = contemporaneo.metriche.complessita.score;
    
    if (Math.abs(complessitaContemporanea - complessitaClassica) > 2) {
      riepilogo.puntiChiave.push(
        complessitaContemporanea > complessitaClassica 
          ? 'Aumento della complessità concettuale'
          : 'Riduzione della complessità concettuale'
      );
    }
    
    return riepilogo;
  },
  
  // 6. ESPORTAZIONE
  esportaAnalisiJSON: function(analisi) {
    return JSON.stringify(analisi, null, 2);
  },
  
  esportaAnalisiCSV: function(analisi) {
    const rows = [];
    
    // Header
    rows.push(['Termine', 'Periodo', 'Frequenza', 'Contesti Principali', 'Correlazioni Top 3']);
    
    // Dati classici
    if (analisi.classico) {
      rows.push([
        analisi.termine,
        'Classico',
        analisi.classico.frequenza.assoluta,
        analisi.classico.contesti.dettagli.slice(0, 2).map(c => c.tipo).join(', '),
        analisi.classico.correlazioni.slice(0, 3).map(c => c.termine).join(', ')
      ]);
    }
    
    // Dati contemporanei
    if (analisi.contemporaneo) {
      rows.push([
        analisi.termine,
        'Contemporaneo',
        analisi.contemporaneo.frequenza.assoluta,
        analisi.contemporaneo.contesti.dettagli.slice(0, 2).map(c => c.tipo).join(', '),
        analisi.contemporaneo.correlazioni.slice(0, 3).map(c => c.termine).join(', ')
      ]);
    }
    
    return rows.map(row => row.join(';')).join('\n');
  },
  
  // 7. INIZIALIZZAZIONE
  init: function() {
    console.log(`[LinguisticAnalysis] Inizializzato v${this.version}`);
    return this;
  }
};

// Auto-inizializzazione
document.addEventListener('DOMContentLoaded', function() {
  if (window.LinguisticAnalysis) {
    window.LinguisticAnalysis.init();
  }
});