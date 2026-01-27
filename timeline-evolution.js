// timeline-evolution.js - NUOVO FILE
// Gestione timeline evolutiva concetti filosofici

window.TimelineEvolution = {
  // VERSIONE
  version: '1.0.0',
  
  // CONFIGURAZIONE
  config: {
    containerClass: 'timeline-container',
    itemClass: 'timeline-item',
    yearClass: 'timeline-year',
    authorClass: 'timeline-author',
    excerptClass: 'timeline-excerpt',
    
    colors: {
      'pre-socratico': '#6b7280',
      'classico': '#10b981',
      'medioevale': '#8b5cf6',
      'rinascimentale/moderno': '#3b82f6',
      'moderno': '#0ea5e9',
      'contemporaneo (XX sec.)': '#f59e0b',
      'contemporaneo (XXI sec.)': '#ef4444',
      'non determinato': '#9ca3af'
    },
    
    icons: {
      'pre-socratico': 'fas fa-monument',
      'classico': 'fas fa-columns',
      'medioevale': 'fas fa-church',
      'rinascimentale/moderno': 'fas fa-palette',
      'moderno': 'fas fa-lightbulb',
      'contemporaneo (XX sec.)': 'fas fa-bolt',
      'contemporaneo (XXI sec.)': 'fas fa-satellite',
      'non determinato': 'fas fa-question'
    }
  },
  
  // STATO
  currentTimeline: null,
  currentContainer: null,
  
  // 1. INIZIALIZZAZIONE
  init: function(containerId, dati, options = {}) {
    console.log(`[TimelineEvolution] Inizializzazione in: ${containerId}`);
    
    this.currentContainer = document.getElementById(containerId);
    
    if (!this.currentContainer) {
      console.error(`[TimelineEvolution] Container ${containerId} non trovato`);
      return this;
    }
    
    // Merge configurazione
    if (options.colors) {
      this.config.colors = { ...this.config.colors, ...options.colors };
    }
    
    if (options.icons) {
      this.config.icons = { ...this.config.icons, ...options.icons };
    }
    
    // Salva dati
    this.currentTimeline = dati;
    
    // Render
    this.render();
    
    console.log(`[TimelineEvolution] Timeline renderizzata con ${dati.timeline.length} elementi`);
    return this;
  },
  
  // 2. RENDER TIMELINE
  render: function() {
    if (!this.currentTimeline || !this.currentContainer) {
      console.error('[TimelineEvolution] Nessun dato o container disponibile');
      return;
    }
    
    const { termine, timeline, statistiche } = this.currentTimeline;
    
    // Creazione HTML
    const html = `
      <div class="timeline-header">
        <h3 class="timeline-term">${termine}</h3>
        <div class="timeline-stats">
          <span class="stat-item">
            <i class="fas fa-hashtag"></i>
            ${statistiche.totaleOccorrenze} occorrenze
          </span>
          <span class="stat-item">
            <i class="fas fa-user-friends"></i>
            ${statistiche.autoriPrincipali.length} autori principali
          </span>
          <span class="stat-item">
            <i class="fas fa-calendar-alt"></i>
            ${statistiche.periodoPiuAttivo ? statistiche.periodoPiuAttivo.periodo : 'N/D'} (periodo più attivo)
          </span>
        </div>
      </div>
      
      <div class="timeline-track-container">
        <div class="timeline-track">
          ${timeline.map((item, index) => this.renderTimelineItem(item, index)).join('')}
        </div>
      </div>
      
      <div class="timeline-legend">
        ${this.renderLegend()}
      </div>
      
      <div class="timeline-controls">
        <button class="timeline-btn zoom-in" onclick="TimelineEvolution.zoomIn()">
          <i class="fas fa-search-plus"></i> Zoom In
        </button>
        <button class="timeline-btn zoom-out" onclick="TimelineEvolution.zoomOut()">
          <i class="fas fa-search-minus"></i> Zoom Out
        </button>
        <button class="timeline-btn reset-view" onclick="TimelineEvolution.resetView()">
          <i class="fas fa-expand-arrows-alt"></i> Reset Vista
        </button>
      </div>
    `;
    
    this.currentContainer.innerHTML = html;
    this.setupInteractions();
    
    // Inizializza tooltip
    this.initTooltips();
  },
  
  // 3. RENDER SINGOLO ITEM
  renderTimelineItem: function(item, index) {
    const periodo = item.periodo || 'non determinato';
    const color = this.config.colors[periodo] || '#9ca3af';
    const icon = this.config.icons[periodo] || 'fas fa-question';
    
    return `
      <div class="${this.config.itemClass}" 
           data-index="${index}" 
           data-year="${item.anno}" 
           data-periodo="${periodo}"
           style="border-top-color: ${color};">
        
        <div class="timeline-marker" style="background: ${color};">
          <i class="${icon}"></i>
        </div>
        
        <div class="timeline-content">
          <div class="${this.config.yearClass}" style="color: ${color};">
            ${this.formatYear(item.anno)}
            <span class="periodo-badge" style="background: ${color};">${periodo}</span>
          </div>
          
          <div class="${this.config.authorClass}">
            <i class="fas fa-user-circle"></i> ${item.autore}
          </div>
          
          ${item.opera ? `
          <div class="timeline-work">
            <i class="fas fa-book"></i> ${item.opera}
          </div>` : ''}
          
          ${item.contesto ? `
          <div class="timeline-context">
            <i class="fas fa-tags"></i> ${item.contesto}
          </div>` : ''}
          
          <div class="${this.config.excerptClass}">
            ${item.estratto || 'Nessun estratto disponibile'}
          </div>
          
          ${item.coordinate ? `
          <div class="timeline-location">
            <i class="fas fa-map-marker-alt"></i> 
            <button class="location-btn" onclick="TimelineEvolution.showOnMap(${item.coordinate.lat}, ${item.coordinate.lng})">
              Visualizza sulla mappa
            </button>
          </div>` : ''}
          
          <div class="timeline-actions">
            <button class="action-btn analyze-btn" onclick="TimelineEvolution.analyzeItem(${index})">
              <i class="fas fa-chart-bar"></i> Analizza
            </button>
            <button class="action-btn compare-btn" onclick="TimelineEvolution.compareWithOthers(${index})">
              <i class="fas fa-balance-scale"></i> Confronta
            </button>
          </div>
        </div>
      </div>
    `;
  },
  
  // 4. RENDER LEGENDA
  renderLegend: function() {
    const periodiUnici = [...new Set(this.currentTimeline.timeline.map(item => item.periodo))];
    
    return `
      <div class="legend-title">Legenda Periodi</div>
      <div class="legend-items">
        ${periodiUnici.map(periodo => {
          const color = this.config.colors[periodo] || '#9ca3af';
          const icon = this.config.icons[periodo] || 'fas fa-question';
          
          return `
            <div class="legend-item" data-periodo="${periodo}">
              <div class="legend-color" style="background: ${color};"></div>
              <i class="${icon} legend-icon"></i>
              <span class="legend-label">${periodo}</span>
              <span class="legend-count">
                (${this.currentTimeline.timeline.filter(item => item.periodo === periodo).length})
              </span>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },
  
  // 5. FORMATTAZIONE
  formatYear: function(year) {
    if (!year || isNaN(year)) return 'Anno sconosciuto';
    
    if (year < 0) {
      return `${Math.abs(year)} a.C.`;
    } else if (year < 1000) {
      return `${year} d.C.`;
    } else {
      return year.toString();
    }
  },
  
  // 6. INTERAZIONI
  setupInteractions: function() {
    // Click sugli item
    document.querySelectorAll(`.${this.config.itemClass}`).forEach(item => {
      item.addEventListener('click', (e) => {
        // Previeni doppio click sui bottoni
        if (!e.target.closest('.action-btn') && !e.target.closest('.location-btn')) {
          const index = parseInt(item.getAttribute('data-index'));
          this.onItemClick(index);
        }
      });
    });
    
    // Click sulla legenda
    document.querySelectorAll('.legend-item').forEach(item => {
      item.addEventListener('click', () => {
        const periodo = item.getAttribute('data-periodo');
        this.filterByPeriod(periodo);
      });
    });
    
    // Hover sugli item
    document.querySelectorAll(`.${this.config.itemClass}`).forEach(item => {
      item.addEventListener('mouseenter', () => {
        const index = parseInt(item.getAttribute('data-index'));
        this.onItemHover(index);
      });
      
      item.addEventListener('mouseleave', () => {
        this.onItemHoverEnd();
      });
    });
    
    // Scroll orizzontale con mouse wheel
    const track = this.currentContainer.querySelector('.timeline-track-container');
    if (track) {
      track.addEventListener('wheel', (e) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          track.scrollLeft += e.deltaY;
        }
      });
    }
  },
  
  // 7. TOOLTIPS
  initTooltips: function() {
    // Usa il tooltip system esistente o implementa semplice
    document.querySelectorAll(`.${this.config.itemClass}`).forEach(item => {
      const index = parseInt(item.getAttribute('data-index'));
      const timelineItem = this.currentTimeline.timeline[index];
      
      if (timelineItem) {
        item.title = `${timelineItem.autore} (${this.formatYear(timelineItem.anno)}) - ${timelineItem.periodo}`;
      }
    });
  },
  
  // 8. EVENT HANDLERS
  onItemClick: function(index) {
    console.log(`[TimelineEvolution] Item cliccato: ${index}`);
    
    const item = this.currentTimeline.timeline[index];
    if (!item) return;
    
    // Evidenzia l'item selezionato
    this.highlightItem(index);
    
    // Evento personalizzabile
    if (typeof this.onItemSelected === 'function') {
      this.onItemSelected(item, index);
    }
    
    // Mostra dettagli
    this.showItemDetails(item);
  },
  
  onItemHover: function(index) {
    const item = this.currentTimeline.timeline[index];
    if (!item) return;
    
    // Evidenzia hover
    const domItem = this.currentContainer.querySelector(`[data-index="${index}"]`);
    if (domItem) {
      domItem.classList.add('timeline-item-hover');
    }
    
    // Evento personalizzabile
    if (typeof this.onItemHovered === 'function') {
      this.onItemHovered(item, index);
    }
  },
  
  onItemHoverEnd: function() {
    // Rimuovi tutte le evidenziazioni hover
    document.querySelectorAll('.timeline-item-hover').forEach(item => {
      item.classList.remove('timeline-item-hover');
    });
  },
  
  // 9. FUNZIONALITÀ AVANZATE
  highlightItem: function(index) {
    // Rimuovi evidenziazioni precedenti
    document.querySelectorAll('.timeline-item-selected').forEach(item => {
      item.classList.remove('timeline-item-selected');
    });
    
    // Aggiungi evidenziazione nuova
    const domItem = this.currentContainer.querySelector(`[data-index="${index}"]`);
    if (domItem) {
      domItem.classList.add('timeline-item-selected');
      
      // Scroll per centrare l'elemento
      domItem.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest', 
        inline: 'center' 
      });
    }
  },
  
  showItemDetails: function(item) {
    // Implementazione base - può essere sovrascritta
    const detailsHtml = `
      <div class="item-details-modal">
        <h4>${item.autore} - ${this.formatYear(item.anno)}</h4>
        <p><strong>Periodo:</strong> ${item.periodo}</p>
        ${item.opera ? `<p><strong>Opera:</strong> ${item.opera}</p>` : ''}
        ${item.contesto ? `<p><strong>Contesto:</strong> ${item.contesto}</p>` : ''}
        <p><strong>Estratto:</strong> ${item.estratto}</p>
      </div>
    `;
    
    // Usa il sistema di modale esistente o creane uno semplice
    if (window.showToast) {
      window.showToast(`Selezionato: ${item.autore} (${item.anno})`, 'info');
    }
  },
  
  filterByPeriod: function(periodo) {
    console.log(`[TimelineEvolution] Filtra per periodo: ${periodo}`);
    
    const items = this.currentContainer.querySelectorAll(`.${this.config.itemClass}`);
    
    items.forEach(item => {
      const itemPeriodo = item.getAttribute('data-periodo');
      if (periodo === 'tutti' || itemPeriodo === periodo) {
        item.style.display = 'flex';
      } else {
        item.style.display = 'none';
      }
    });
    
    // Aggiorna legenda
    const legendItems = this.currentContainer.querySelectorAll('.legend-item');
    legendItems.forEach(legendItem => {
      if (legendItem.getAttribute('data-periodo') === periodo) {
        legendItem.classList.add('legend-item-active');
      } else {
        legendItem.classList.remove('legend-item-active');
      }
    });
  },
  
  zoomIn: function() {
    const track = this.currentContainer.querySelector('.timeline-track');
    if (track) {
      const currentScale = parseFloat(track.style.transform?.replace('scale(', '')?.replace(')', '')) || 1;
      track.style.transform = `scale(${Math.min(currentScale * 1.2, 3)})`;
    }
  },
  
  zoomOut: function() {
    const track = this.currentContainer.querySelector('.timeline-track');
    if (track) {
      const currentScale = parseFloat(track.style.transform?.replace('scale(', '')?.replace(')', '')) || 1;
      track.style.transform = `scale(${Math.max(currentScale / 1.2, 0.5)})`;
    }
  },
  
  resetView: function() {
    const track = this.currentContainer.querySelector('.timeline-track');
    if (track) {
      track.style.transform = 'scale(1)';
    }
    
    // Reset filtri
    this.filterByPeriod('tutti');
    
    // Rimuovi selezione
    document.querySelectorAll('.timeline-item-selected').forEach(item => {
      item.classList.remove('timeline-item-selected');
    });
  },
  
  showOnMap: function(lat, lng) {
    console.log(`[TimelineEvolution] Mostra su mappa: ${lat}, ${lng}`);
    
    // Integrazione con mappa esistente
    if (window.showMapLocation) {
      window.showMapLocation(lat, lng);
    } else if (window.showToast) {
      window.showToast(`Coordinate: ${lat}, ${lng}`, 'info');
    }
  },
  
  analyzeItem: function(index) {
    const item = this.currentTimeline.timeline[index];
    if (!item) return;
    
    console.log(`[TimelineEvolution] Analizza item:`, item);
    
    // Integrazione con analisi linguistica
    if (window.LinguisticAnalysis) {
      const analisi = window.LinguisticAnalysis.analizzaTermine(this.currentTimeline.termine, [item.estratto]);
      
      if (window.showToast) {
        window.showToast(`Analisi completata per ${item.autore}`, 'success');
      }
      
      // Evento personalizzabile
      if (typeof this.onAnalysisComplete === 'function') {
        this.onAnalysisComplete(analisi, item);
      }
    }
  },
  
  compareWithOthers: function(index) {
    const item = this.currentTimeline.timeline[index];
    if (!item) return;
    
    console.log(`[TimelineEvolution] Confronta item ${index} con altri`);
    
    // Trova item simili per periodo
    const samePeriodItems = this.currentTimeline.timeline.filter(
      (otherItem, otherIndex) => 
        otherIndex !== index && 
        otherItem.periodo === item.periodo
    ).slice(0, 3);
    
    if (samePeriodItems.length > 0) {
      const comparison = {
        item: item,
        similarItems: samePeriodItems,
        differences: this.compareItems(item, samePeriodItems)
      };
      
      // Evento personalizzabile
      if (typeof this.onComparisonReady === 'function') {
        this.onComparisonReady(comparison);
      }
      
      if (window.showToast) {
        window.showToast(`Confronto con ${samePeriodItems.length} item simili`, 'info');
      }
    } else {
      if (window.showToast) {
        window.showToast('Nessun item simile trovato per il confronto', 'warning');
      }
    }
  },
  
  compareItems: function(mainItem, otherItems) {
    const differences = [];
    
    otherItems.forEach(otherItem => {
      const diff = {
        autore: otherItem.autore,
        anno: otherItem.anno,
        differenze: []
      };
      
      // Confronta contesti
      if (mainItem.contesto !== otherItem.contesto) {
        diff.differenze.push(`Contesto diverso: ${mainItem.contesto} vs ${otherItem.contesto}`);
      }
      
      // Confronta estratti (semplificato)
      const mainWords = mainItem.estratto?.split(' ').length || 0;
      const otherWords = otherItem.estratto?.split(' ').length || 0;
      
      if (Math.abs(mainWords - otherWords) > 10) {
        diff.differenze.push(`Lunghezza testo significativamente diversa`);
      }
      
      differences.push(diff);
    });
    
    return differences;
  },
  
  // 10. METODI PUBBLICI
  update: function(nuoviDati) {
    console.log('[TimelineEvolution] Aggiornamento dati timeline');
    
    this.currentTimeline = nuoviDati;
    this.render();
    
    return this;
  },
  
  getSelectedItem: function() {
    const selected = this.currentContainer?.querySelector('.timeline-item-selected');
    if (selected) {
      const index = parseInt(selected.getAttribute('data-index'));
      return this.currentTimeline.timeline[index];
    }
    return null;
  },
  
  exportAsJSON: function() {
    return JSON.stringify(this.currentTimeline, null, 2);
  },
  
  exportAsCSV: function() {
    const { termine, timeline } = this.currentTimeline;
    
    const headers = ['Anno', 'Periodo', 'Autore', 'Opera', 'Contesto'];
    const rows = timeline.map(item => [
      item.anno,
      item.periodo,
      `"${item.autore}"`,
      `"${item.opera || ''}"`,
      `"${item.contesto || ''}"`
    ]);
    
    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  },
  
  // 11. INIZIALIZZAZIONE
  initStyles: function() {
    // Inietta stili se non presenti
    if (!document.getElementById('timeline-styles')) {
      const style = document.createElement('style');
      style.id = 'timeline-styles';
      style.textContent = this.getDefaultStyles();
      document.head.appendChild(style);
    }
  },
  
  getDefaultStyles: function() {
    return `
      .timeline-container {
        width: 100%;
        padding: 20px;
        background: #f8fafc;
        border-radius: 15px;
        border: 1px solid #e5e7eb;
      }
      
      .timeline-header {
        margin-bottom: 20px;
        padding-bottom: 15px;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .timeline-term {
        color: var(--primary-purple);
        font-size: 1.4rem;
        margin-bottom: 10px;
      }
      
      .timeline-stats {
        display: flex;
        gap: 20px;
        flex-wrap: wrap;
      }
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 0.9rem;
        color: var(--light-text);
      }
      
      .timeline-track-container {
        overflow-x: auto;
        padding: 20px 0;
        scrollbar-width: thin;
      }
      
      .timeline-track {
        display: flex;
        gap: 25px;
        min-width: min-content;
        padding: 10px;
        transition: transform 0.3s ease;
      }
      
      .timeline-item {
        position: relative;
        min-width: 280px;
        max-width: 320px;
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.08);
        cursor: pointer;
        transition: all 0.3s ease;
        border-top: 4px solid;
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
      }
      
      .timeline-item:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 20px rgba(0,0,0,0.12);
      }
      
      .timeline-item-selected {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        transform: scale(1.02);
      }
      
      .timeline-item-hover {
        background: #f0f9ff;
      }
      
      .timeline-marker {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        position: absolute;
        top: -16px;
        left: 20px;
      }
      
      .timeline-content {
        margin-top: 10px;
      }
      
      .timeline-year {
        font-weight: bold;
        font-size: 1.1rem;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .periodo-badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        color: white;
        font-weight: 600;
      }
      
      .timeline-author {
        color: var(--primary-blue);
        font-weight: 600;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .timeline-work, .timeline-context, .timeline-location {
        font-size: 0.85rem;
        color: var(--light-text);
        margin-bottom: 6px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .timeline-excerpt {
        color: var(--light-text);
        font-size: 0.9rem;
        line-height: 1.4;
        margin: 10px 0;
        font-style: italic;
      }
      
      .timeline-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
      }
      
      .action-btn {
        flex: 1;
        padding: 6px 12px;
        border: none;
        border-radius: 6px;
        font-size: 0.8rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        transition: all 0.2s ease;
      }
      
      .analyze-btn {
        background: var(--primary-green);
        color: white;
      }
      
      .compare-btn {
        background: var(--primary-purple);
        color: white;
      }
      
      .location-btn {
        background: none;
        border: none;
        color: var(--primary-blue);
        font-size: 0.8rem;
        cursor: pointer;
        padding: 0;
        text-decoration: underline;
      }
      
      .timeline-legend {
        margin-top: 25px;
        padding-top: 15px;
        border-top: 1px solid #e5e7eb;
      }
      
      .legend-title {
        font-weight: 600;
        margin-bottom: 10px;
        color: var(--dark-text);
      }
      
      .legend-items {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
      }
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 5px 10px;
        border-radius: 8px;
        transition: background 0.2s ease;
      }
      
      .legend-item:hover {
        background: #f3f4f6;
      }
      
      .legend-item-active {
        background: #e0f2fe;
      }
      
      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 50%;
      }
      
      .legend-icon {
        font-size: 0.8rem;
        color: var(--light-text);
      }
      
      .legend-label {
        font-size: 0.85rem;
        color: var(--dark-text);
      }
      
      .legend-count {
        font-size: 0.75rem;
        color: var(--light-text);
      }
      
      .timeline-controls {
        display: flex;
        gap: 10px;
        margin-top: 20px;
        justify-content: center;
      }
      
      .timeline-btn {
        padding: 8px 15px;
        border: 1px solid #e5e7eb;
        background: white;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.85rem;
        display: flex;
        align-items: center;
        gap: 8px;
        transition: all 0.2s ease;
      }
      
      .timeline-btn:hover {
        background: #f3f4f6;
      }
      
      @media (max-width: 768px) {
        .timeline-item {
          min-width: 250px;
        }
        
        .timeline-stats {
          flex-direction: column;
          gap: 10px;
        }
      }
    `;
  }
};

// Auto-inizializzazione
document.addEventListener('DOMContentLoaded', function() {
  if (window.TimelineEvolution) {
    window.TimelineEvolution.initStyles();
  }
});