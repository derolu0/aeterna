// Analytics Manager - Versione Filosofica Avanzata
// Integrazione completa con sistema Aeterna Lexicon in Motu
class AnalyticsManager {
    constructor() {
        this.isInitialized = false;
        this.queue = [];
        this.config = {
            trackingEnabled: true,
            sessionTimeout: 30 * 60 * 1000,
            batchSize: 10,
            flushInterval: 10000,
            comparativeAnalysis: true,
            conceptMapTracking: true
        };
        
        this.session = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 0,
            events: 0,
            lastActivity: Date.now(),
            comparativeAnalyses: 0,
            conceptMapInteractions: 0
        };
        
        this.user = {
            id: this.getUserId(),
            device: this.getDeviceInfo(),
            preferences: {},
            analysisHistory: []
        };
        
        // Performance metrics
        this.metrics = {
            appStart: Date.now(),
            pageLoadTimes: [],
            imageLoadTimes: [],
            dataFetchTimes: [],
            comparativeAnalysisTimes: [],
            conceptMapLoadTimes: []
        };
        
        // Analytics specifici per Aeterna Lexicon
        this.philosophyAnalytics = {
            conceptsViewed: new Set(),
            philosophersViewed: new Set(),
            worksViewed: new Set(),
            comparativeAnalyses: [],
            timelineInteractions: [],
            transformationsIdentified: []
        };
        
        // Inizializza supporto Service Worker
        this.initializeServiceWorkerSupport();
    }
    
    // ============ INIZIALIZZAZIONE ============
    
    async initializeServiceWorkerSupport() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                console.log('[Analytics] Service Worker pronto');
                
                // Invia configurazione analytics a Service Worker
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'ANALYTICS_CONFIG',
                        config: {
                            enabled: this.config.trackingEnabled,
                            sessionId: this.session.id,
                            userId: this.user.id,
                            project: 'Aeterna Lexicon in Motu'
                        }
                    });
                }
                
            } catch (error) {
                console.warn('[Analytics] Service Worker non disponibile:', error);
            }
        }
    }
    
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            await this.initializeFirebaseAnalytics();
            await this.loadSavedData();
            this.startAutoFlush();
            this.trackSessionStart();
            this.setupEventListeners();
            this.setupPhilosophicalTracking();
            
            this.isInitialized = true;
            console.log('[Analytics] Inizializzato con successo - Sistema Filosofico Attivo');
            
            // Traccia avvio sistema analitico filosofico
            this.trackEvent('analytics', 'system_initialized', 'philosophical_system', null, {
                features: ['comparative_analysis', 'concept_map', 'timeline_tracking'],
                project: 'Aeterna Lexicon in Motu',
                version: '2.0.0'
            });
            
        } catch (error) {
            console.error('[Analytics] Errore inizializzazione:', error);
            this.trackError(error, 'analytics_initialization', 'high');
        }
    }
    
    async initializeFirebaseAnalytics() {
        // Primo controllo: già inizializzato
        if (window.firebaseAnalytics) {
            console.log('[Analytics] Firebase Analytics già disponibile');
            return window.firebaseAnalytics;
        }
        
        // Secondo controllo: app Firebase disponibile
        if (window.app && typeof getAnalytics !== 'undefined') {
            try {
                window.firebaseAnalytics = getAnalytics(window.app);
                console.log('[Analytics] Firebase Analytics inizializzato (ES Module)');
            } catch (error) {
                console.warn('[Analytics] Errore inizializzazione ES Module:', error);
            }
        }
        
        // Terzo controllo: Firebase globale
        if (!window.firebaseAnalytics && window.firebase && window.firebase.analytics) {
            try {
                window.firebaseAnalytics = window.firebase.analytics();
                console.log('[Analytics] Firebase Analytics inizializzato (Global)');
            } catch (error) {
                console.warn('[Analytics] Errore inizializzazione globale:', error);
            }
        }
        
        // Quarto controllo: carica dinamicamente
        if (!window.firebaseAnalytics && typeof import !== 'undefined') {
            try {
                const { getAnalytics } = await import(
                    "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js"
                );
                
                if (window.app) {
                    window.firebaseAnalytics = getAnalytics(window.app);
                    console.log('[Analytics] Firebase Analytics inizializzato (Dynamic Import)');
                }
            } catch (error) {
                console.warn('[Analytics] Dynamic import non riuscito:', error);
            }
        }
        
        if (window.firebaseAnalytics) {
            // Traccia avvio app filosofica
            this.sendToFirebaseAnalytics({
                type: 'APP_START',
                timestamp: Date.now(),
                session_id: this.session.id,
                user_id: this.user.id,
                device: this.user.device,
                project: 'Aeterna Lexicon in Motu',
                philosophical_system: true
            });
            
            return window.firebaseAnalytics;
        }
        
        console.warn('[Analytics] Firebase Analytics non disponibile');
        return null;
    }
    
    // ============ EVENTI FILOSOFICI AVANZATI ============
    
    trackEvent(category, action, label = null, value = null, customParams = {}) {
        if (!this.config.trackingEnabled) return null;
        
        const event = {
            type: 'EVENT',
            timestamp: Date.now(),
            category,
            action,
            label,
            value,
            session_id: this.session.id,
            user_id: this.user.id,
            project: 'Aeterna Lexicon in Motu',
            philosophical_context: true,
            ...customParams
        };
        
        this.queue.push(event);
        this.session.events++;
        
        // Gestione coda locale
        if (this.queue.length >= this.config.batchSize) {
            this.flushQueue();
        }
        
        // Log attività locale
        this.logActivity(`Evento: ${category}.${action}`, event);
        
        return event;
    }
    
    trackPageView(pageName, customParams = {}) {
        if (!this.config.trackingEnabled) return null;
        
        const pageView = {
            type: 'PAGE_VIEW',
            timestamp: Date.now(),
            page: pageName,
            session_id: this.session.id,
            user_id: this.user.id,
            page_views: ++this.session.pageViews,
            project: 'Aeterna Lexicon in Motu',
            philosophical_section: this.getPhilosophicalSection(pageName),
            ...customParams
        };
        
        this.queue.push(pageView);
        
        this.session.lastActivity = Date.now();
        this.logActivity(`Pagina vista: ${pageName}`, pageView);
        
        return pageView;
    }
    
    // ============ TRACKING FILOSOFICO SPECIFICO ============
    
    trackFilosofoView(filosofoName, periodo, customParams = {}) {
        const event = {
            type: 'FILOSOFO_VIEW',
            timestamp: Date.now(),
            filosofo_name: filosofoName,
            periodo: periodo,
            session_id: this.session.id,
            user_id: this.user.id,
            philosophical_tracking: true,
            ...customParams
        };
        
        this.queue.push(event);
        
        // Aggiungi alla cronologia
        this.philosophyAnalytics.philosophersViewed.add(filosofoName);
        
        this.logActivity(`Filosofo visto: ${filosofoName} (${periodo})`, event);
        
        return event;
    }
    
    trackOperaView(operaName, autore, anno, customParams = {}) {
        const event = {
            type: 'OPERA_VIEW',
            timestamp: Date.now(),
            opera_name: operaName,
            autore: autore,
            anno: anno,
            session_id: this.session.id,
            user_id: this.user.id,
            philosophical_tracking: true,
            ...customParams
        };
        
        this.queue.push(event);
        
        // Aggiungi alla cronologia
        this.philosophyAnalytics.worksViewed.add(operaName);
        
        this.logActivity(`Opera vista: ${operaName} (${autore})`, event);
        
        return event;
    }
    
    trackConcettoView(concettoName, periodo, customParams = {}) {
        const event = {
            type: 'CONCETTO_VIEW',
            timestamp: Date.now(),
            concetto_name: concettoName,
            periodo: periodo,
            session_id: this.session.id,
            user_id: this.user.id,
            philosophical_tracking: true,
            ...customParams
        };
        
        this.queue.push(event);
        
        // Aggiungi alla cronologia
        this.philosophyAnalytics.conceptsViewed.add(concettoName);
        
        this.logActivity(`Concetto visto: ${concettoName} (${periodo})`, event);
        
        return event;
    }
    
    // ============ ANALISI COMPARATIVA ============
    
    async trackComparativeAnalysis(termine, trigger = 'manual') {
        if (!this.config.trackingEnabled || !this.config.comparativeAnalysis) {
            return { success: false, error: 'Tracking disabilitato' };
        }
        
        const startTime = Date.now();
        
        try {
            // Usa le funzioni di analisi comparativa da firebase-init.js
            let analisi;
            if (window.firebaseHelpers && window.firebaseHelpers.analizzaTermineComparativo) {
                analisi = await window.firebaseHelpers.analizzaTermineComparativo(termine);
            } else {
                // Fallback a dati demo
                analisi = await this.performDemoComparativeAnalysis(termine);
            }
            
            const duration = Date.now() - startTime;
            this.metrics.comparativeAnalysisTimes.push(duration);
            
            const event = {
                type: 'COMPARATIVE_ANALYSIS',
                timestamp: Date.now(),
                termine: termine,
                trigger: trigger,
                duration: duration,
                risultati: {
                    classico_occorrenze: analisi.analisi?.classico?.occorrenze || 0,
                    contemporaneo_occorrenze: analisi.analisi?.contemporaneo?.occorrenze || 0,
                    trasformazioni: analisi.analisi?.trasformazioni?.length || 0,
                    timeline_entries: analisi.analisi?.timeline?.length || 0
                },
                session_id: this.session.id,
                user_id: this.user.id,
                project: 'Aeterna Lexicon in Motu',
                analysis_id: this.generateAnalysisId()
            };
            
            this.queue.push(event);
            
            // Aggiorna statistiche sessione
            this.session.comparativeAnalyses++;
            this.philosophyAnalytics.comparativeAnalyses.push({
                termine,
                timestamp: new Date().toISOString(),
                results: event.risultati
            });
            
            // Salva nella cronologia utente
            const historyEntry = {
                termine,
                timestamp: new Date().toISOString(),
                duration,
                results: event.risultati
            };
            
            this.user.analysisHistory.push(historyEntry);
            
            // Limita cronologia a 50 analisi
            if (this.user.analysisHistory.length > 50) {
                this.user.analysisHistory = this.user.analysisHistory.slice(-50);
            }
            
            // Salva cronologia localmente
            localStorage.setItem('user_analysis_history', JSON.stringify(this.user.analysisHistory));
            
            this.logActivity(`Analisi comparativa: ${termine} (${duration}ms)`, event);
            
            return { success: true, event, analisi };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            const errorEvent = {
                type: 'COMPARATIVE_ANALYSIS_ERROR',
                timestamp: Date.now(),
                termine: termine,
                trigger: trigger,
                duration: duration,
                error: error.message,
                session_id: this.session.id,
                user_id: this.user.id,
                project: 'Aeterna Lexicon in Motu'
            };
            
            this.queue.push(errorEvent);
            this.trackError(error, 'comparative_analysis', 'medium');
            
            return { success: false, error: error.message, event: errorEvent };
        }
    }
    
    trackTimelineInteraction(action, periodo, secolo, elementType) {
        const event = {
            type: 'TIMELINE_INTERACTION',
            timestamp: Date.now(),
            action: action,
            periodo: periodo,
            secolo: secolo,
            element_type: elementType,
            session_id: this.session.id,
            user_id: this.user.id,
            project: 'Aeterna Lexicon in Motu'
        };
        
        this.queue.push(event);
        
        // Salva interazione timeline
        this.philosophyAnalytics.timelineInteractions.push({
            action,
            periodo,
            secolo,
            timestamp: new Date().toISOString()
        });
        
        this.logActivity(`Timeline: ${action} - ${periodo} (${secolo})`, event);
        
        return event;
    }
    
    trackTransformationView(trasformazione, termine) {
        const event = {
            type: 'TRANSFORMATION_VIEW',
            timestamp: Date.now(),
            trasformazione: trasformazione,
            termine: termine,
            session_id: this.session.id,
            user_id: this.user.id,
            project: 'Aeterna Lexicon in Motu'
        };
        
        this.queue.push(event);
        
        // Salva trasformazione vista
        this.philosophyAnalytics.transformationsIdentified.push({
            trasformazione,
            termine,
            timestamp: new Date().toISOString()
        });
        
        this.logActivity(`Trasformazione: ${trasformazione} per ${termine}`, event);
        
        return event;
    }
    
    // ============ MAPPA CONCETTUALE ============
    
    trackConceptMapInteraction(nodeType, nodeName, action, customParams = {}) {
        if (!this.config.conceptMapTracking) return null;
        
        const event = {
            type: 'CONCEPT_MAP_INTERACTION',
            timestamp: Date.now(),
            node_type: nodeType,
            node_name: nodeName,
            action: action,
            session_id: this.session.id,
            user_id: this.user.id,
            project: 'Aeterna Lexicon in Motu',
            ...customParams
        };
        
        this.queue.push(event);
        
        // Aggiorna statistiche
        this.session.conceptMapInteractions++;
        
        // Se è un concetto, aggiungi a quelli visti
        if (nodeType === 'concetto') {
            this.philosophyAnalytics.conceptsViewed.add(nodeName);
        }
        
        this.logActivity(`Mappa concettuale: ${action} ${nodeType} - ${nodeName}`, event);
        
        return event;
    }
    
    trackConceptMapLoad(duration, nodeCount, edgeCount) {
        const event = {
            type: 'CONCEPT_MAP_LOAD',
            timestamp: Date.now(),
            duration: duration,
            node_count: nodeCount,
            edge_count: edgeCount,
            session_id: this.session.id,
            user_id: this.user.id,
            project: 'Aeterna Lexicon in Motu'
        };
        
        this.queue.push(event);
        
        this.metrics.conceptMapLoadTimes.push(duration);
        
        this.logActivity(`Mappa concettuale caricata: ${nodeCount} nodi, ${edgeCount} relazioni (${duration}ms)`, event);
        
        return event;
    }
    
    // ============ MAPPA GEOGRAFICA ============
    
    trackMapInteraction(action, target, coordinates = null, customParams = {}) {
        const event = {
            type: 'MAP_INTERACTION',
            timestamp: Date.now(),
            action: action,
            target: target,
            coordinates: coordinates,
            session_id: this.session.id,
            user_id: this.user.id,
            project: 'Aeterna Lexicon in Motu',
            ...customParams
        };
        
        this.queue.push(event);
        
        this.logActivity(`Mappa: ${action} - ${target}`, event);
        
        return event;
    }
    
    // ============ RICERCHE ============
    
    trackSearch(query, category, resultsCount = 0, customParams = {}) {
        const event = {
            type: 'SEARCH',
            timestamp: Date.now(),
            query: query,
            category: category,
            results_count: resultsCount,
            session_id: this.session.id,
            user_id: this.user.id,
            project: 'Aeterna Lexicon in Motu',
            philosophical_search: category === 'concetti' || category === 'filosofi',
            ...customParams
        };
        
        this.queue.push(event);
        
        this.logActivity(`Ricerca: ${query} (${category}) - ${resultsCount} risultati`, event);
        
        return event;
    }
    
    // ============ ERRORI E PERFORMANCE ============
    
    trackError(error, context, severity = 'medium', customParams = {}) {
        const errorEvent = {
            type: 'ERROR',
            timestamp: Date.now(),
            error: {
                name: error.name || 'Error',
                message: error.message || 'Unknown error',
                stack: error.stack?.substring(0, 500) || '',
                code: error.code
            },
            context,
            severity,
            session_id: this.session.id,
            user_id: this.user.id,
            project: 'Aeterna Lexicon in Motu',
            ...customParams
        };
        
        this.queue.push(errorEvent);
        
        // Salva errori localmente
        this.saveErrorLocally(errorEvent);
        
        this.logActivity(`Errore: ${context} - ${error.message}`, errorEvent);
        
        return errorEvent;
    }
    
    trackPerformance(name, duration, customParams = {}) {
        const perfEvent = {
            type: 'PERFORMANCE',
            timestamp: Date.now(),
            metric_name: name,
            duration: duration,
            session_id: this.session.id,
            user_id: this.user.id,
            project: 'Aeterna Lexicon in Motu',
            ...customParams
        };
        
        this.queue.push(perfEvent);
        
        // Salva in metrics
        if (name.includes('page_load')) {
            this.metrics.pageLoadTimes.push(duration);
        } else if (name.includes('image')) {
            this.metrics.imageLoadTimes.push(duration);
        } else if (name.includes('data')) {
            this.metrics.dataFetchTimes.push(duration);
        } else if (name.includes('comparative')) {
            this.metrics.comparativeAnalysisTimes.push(duration);
        } else if (name.includes('concept_map')) {
            this.metrics.conceptMapLoadTimes.push(duration);
        }
        
        this.logActivity(`Performance: ${name} - ${duration}ms`, perfEvent);
        
        return perfEvent;
    }
    
    // ============ SESSIONI ============
    
    trackSessionStart() {
        const sessionEvent = {
            type: 'SESSION_START',
            timestamp: Date.now(),
            session_id: this.session.id,
            user_id: this.user.id,
            device: this.user.device,
            app_version: '2.0.0',
            project: 'Aeterna Lexicon in Motu',
            philosophical_dataset: true
        };
        
        this.queue.push(sessionEvent);
        
        this.logActivity('Sessione iniziata', sessionEvent);
    }
    
    trackSessionEnd() {
        const sessionDuration = Date.now() - this.session.startTime;
        const sessionEvent = {
            type: 'SESSION_END',
            timestamp: Date.now(),
            session_id: this.session.id,
            user_id: this.user.id,
            duration: sessionDuration,
            page_views: this.session.pageViews,
            events: this.session.events,
            comparative_analyses: this.session.comparativeAnalyses,
            concept_map_interactions: this.session.conceptMapInteractions,
            project: 'Aeterna Lexicon in Motu'
        };
        
        this.queue.push(sessionEvent);
        
        // Genera nuova sessione
        this.session = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 0,
            events: 0,
            lastActivity: Date.now(),
            comparativeAnalyses: 0,
            conceptMapInteractions: 0
        };
        
        this.logActivity('Sessione terminata', sessionEvent);
    }
    
    // ============ FIREBASE ANALYTICS INTEGRATION ============
    
    async sendToFirebaseAnalytics(eventData) {
        if (!window.firebaseAnalytics) return;
        
        try {
            let logEvent;
            
            // Trova la funzione logEvent
            if (window.firebaseAnalytics.logEvent) {
                logEvent = window.firebaseAnalytics.logEvent;
            } else if (window.firebase && window.firebase.analytics && window.firebase.analytics.logEvent) {
                logEvent = window.firebase.analytics.logEvent;
            } else {
                return; // Nessuna funzione logEvent disponibile
            }
            
            // Mappa eventi personalizzati su eventi Firebase
            switch(eventData.type) {
                case 'PAGE_VIEW':
                    logEvent(window.firebaseAnalytics, 'page_view', {
                        page_title: eventData.page,
                        page_location: window.location.href,
                        page_path: window.location.pathname,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id,
                        project: eventData.project,
                        philosophical_section: eventData.philosophical_section
                    });
                    break;
                    
                case 'EVENT':
                    logEvent(window.firebaseAnalytics, eventData.action, {
                        event_category: eventData.category,
                        event_label: eventData.label,
                        value: eventData.value,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id,
                        ...eventData
                    });
                    break;
                    
                case 'FILOSOFO_VIEW':
                    logEvent(window.firebaseAnalytics, 'filosofo_viewed', {
                        filosofo_name: eventData.filosofo_name,
                        filosofo_periodo: eventData.periodo,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'OPERA_VIEW':
                    logEvent(window.firebaseAnalytics, 'opera_viewed', {
                        opera_name: eventData.opera_name,
                        opera_autore: eventData.autore,
                        opera_anno: eventData.anno,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'CONCETTO_VIEW':
                    logEvent(window.firebaseAnalytics, 'concetto_viewed', {
                        concetto_name: eventData.concetto_name,
                        concetto_periodo: eventData.periodo,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'COMPARATIVE_ANALYSIS':
                    logEvent(window.firebaseAnalytics, 'comparative_analysis', {
                        termine: eventData.termine,
                        analysis_trigger: eventData.trigger,
                        analysis_duration: eventData.duration,
                        classico_occorrenze: eventData.risultati?.classico_occorrenze,
                        contemporaneo_occorrenze: eventData.risultati?.contemporaneo_occorrenze,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'CONCEPT_MAP_INTERACTION':
                    logEvent(window.firebaseAnalytics, 'concept_map_interaction', {
                        node_type: eventData.node_type,
                        node_name: eventData.node_name,
                        interaction_action: eventData.action,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'TIMELINE_INTERACTION':
                    logEvent(window.firebaseAnalytics, 'timeline_interaction', {
                        timeline_action: eventData.action,
                        timeline_periodo: eventData.periodo,
                        timeline_secolo: eventData.secolo,
                        element_type: eventData.element_type,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'TRANSFORMATION_VIEW':
                    logEvent(window.firebaseAnalytics, 'transformation_viewed', {
                        trasformazione: eventData.trasformazione,
                        termine: eventData.termine,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'MAP_INTERACTION':
                    logEvent(window.firebaseAnalytics, 'map_interaction', {
                        map_action: eventData.action,
                        map_target: eventData.target,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'SEARCH':
                    logEvent(window.firebaseAnalytics, 'search_performed', {
                        search_query: (eventData.query || '').substring(0, 100),
                        search_category: eventData.category,
                        search_results: eventData.results_count,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'ERROR':
                    logEvent(window.firebaseAnalytics, 'error_occurred', {
                        error_name: eventData.error?.name || 'Unknown',
                        error_message: (eventData.error?.message || 'Unknown error').substring(0, 100),
                        error_context: eventData.context,
                        error_severity: eventData.severity,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'PERFORMANCE':
                    logEvent(window.firebaseAnalytics, 'performance_metric', {
                        metric_name: eventData.metric_name,
                        metric_duration: eventData.duration,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'SESSION_START':
                    logEvent(window.firebaseAnalytics, 'session_start', {
                        session_id: eventData.session_id,
                        user_id: eventData.user_id,
                        app_version: '2.0.0'
                    });
                    break;
            }
        } catch (error) {
            console.warn('[Analytics] Errore invio a Firebase:', error);
        }
    }
    
    // ============ GESTIONE DATI LOCALI ============
    
    async flushQueue(force = false) {
        if (this.queue.length === 0) return;
        
        if (!force && this.queue.length < this.config.batchSize) {
            return;
        }
        
        const eventsToSend = [...this.queue];
        this.queue = [];
        
        try {
            // Salva localmente
            this.saveEventsLocally(eventsToSend);
            
            // Invia a Firebase Analytics
            for (const event of eventsToSend) {
                await this.sendToFirebaseAnalytics(event);
            }
            
            // Invia a Firestore (se online e db disponibile)
            if (navigator.onLine && window.db) {
                await this.sendToFirestore(eventsToSend);
                this.cleanupOldLocalEvents();
            } else {
                this.saveForLater(eventsToSend);
            }
            
            // Aggiorna last sync time
            localStorage.setItem('analytics_last_sync', new Date().toISOString());
            
        } catch (error) {
            console.error('[Analytics] Errore flush queue:', error);
            // Ripristina eventi nella coda
            this.queue.unshift(...eventsToSend);
            this.saveForLater(eventsToSend);
        }
    }
    
    async sendToFirestore(events) {
        try {
            // Usa le funzioni Firebase disponibili
            if (window.firebaseHelpers && window.firebaseHelpers.sendAnalytics) {
                await window.firebaseHelpers.sendAnalytics({
                    events: events,
                    sent_at: new Date().toISOString(),
                    session_id: this.session.id,
                    user_id: this.user.id,
                    device: this.user.device,
                    source: 'analytics_js_v2',
                    project: 'Aeterna Lexicon in Motu',
                    philosophical_analytics: true
                });
                return;
            }
            
            // Fallback a Firestore diretto
            if (window.db && window.db.collection) {
                const batchData = {
                    events: events,
                    sent_at: new Date().toISOString(),
                    session_id: this.session.id,
                    user_id: this.user.id,
                    device: this.user.device,
                    source: 'analytics_js',
                    project: 'Aeterna Lexicon in Motu',
                    philosophical_analytics: true
                };
                
                const analyticsRef = window.db.collection('analytics');
                await analyticsRef.add(batchData);
                console.log(`[Analytics] ${events.length} eventi inviati a Firestore`);
            }
        } catch (error) {
            console.error('[Analytics] Errore invio a Firestore:', error);
            throw error;
        }
    }
    
    saveEventsLocally(events) {
        try {
            const localEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            localEvents.push(...events);
            
            if (localEvents.length > 5000) {
                localEvents.splice(0, localEvents.length - 5000);
            }
            
            localStorage.setItem('analytics_events', JSON.stringify(localEvents));
        } catch (error) {
            console.error('[Analytics] Errore salvataggio locale:', error);
        }
    }
    
    saveErrorLocally(errorEvent) {
        try {
            const errors = JSON.parse(localStorage.getItem('analytics_errors') || '[]');
            errors.push(errorEvent);
            
            if (errors.length > 1000) {
                errors.splice(0, errors.length - 1000);
            }
            
            localStorage.setItem('analytics_errors', JSON.stringify(errors));
        } catch (error) {
            console.warn('[Analytics] Errore salvataggio errori:', error);
        }
    }
    
    saveForLater(events) {
        try {
            const pendingEvents = JSON.parse(localStorage.getItem('analytics_pending') || '[]');
            pendingEvents.push(...events);
            localStorage.setItem('analytics_pending', JSON.stringify(pendingEvents));
            
            console.log(`[Analytics] ${events.length} eventi salvati per dopo (offline)`);
        } catch (error) {
            console.error('[Analytics] Errore salvataggio pending:', error);
        }
    }
    
    async sendPendingEvents() {
        try {
            const pendingEvents = JSON.parse(localStorage.getItem('analytics_pending') || '[]');
            
            if (pendingEvents.length === 0 || !navigator.onLine) return;
            
            // Invia a Firebase Analytics
            for (const event of pendingEvents) {
                await this.sendToFirebaseAnalytics(event);
            }
            
            // Invia a Firestore se disponibile
            if (window.db) {
                await this.sendToFirestore(pendingEvents);
                localStorage.removeItem('analytics_pending');
                console.log(`[Analytics] ${pendingEvents.length} eventi pendenti inviati`);
            }
        } catch (error) {
            console.error('[Analytics] Errore invio eventi pendenti:', error);
        }
    }
    
    // ============ UTILITY ============
    
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateAnalysisId() {
        return 'analisi_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    
    getUserId() {
        let userId = localStorage.getItem('analytics_user_id');
        if (!userId) {
            userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('analytics_user_id', userId);
        }
        return userId;
    }
    
    getDeviceInfo() {
        const deviceInfo = {
            userAgent: navigator.userAgent || 'unknown',
            platform: navigator.platform || 'unknown',
            language: navigator.language || 'unknown',
            screen: {
                width: window.screen.width || 0,
                height: window.screen.height || 0,
                colorDepth: window.screen.colorDepth || 0
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            online: navigator.onLine,
            pwa: window.matchMedia('(display-mode: standalone)').matches,
            timezone: Intl.DateTimeFormat?.().resolvedOptions?.().timeZone || 'unknown'
        };
        
        // Aggiungi proprietà condizionali
        if (navigator.deviceMemory) deviceInfo.deviceMemory = navigator.deviceMemory;
        if (navigator.hardwareConcurrency) deviceInfo.hardwareConcurrency = navigator.hardwareConcurrency;
        
        return deviceInfo;
    }
    
    getPhilosophicalSection(pageName) {
        if (pageName.includes('filosofi')) return 'filosofi';
        if (pageName.includes('opere')) return 'opere';
        if (pageName.includes('concetti')) return 'concetti';
        if (pageName.includes('mappa')) return 'mappa';
        if (pageName.includes('analisi')) return 'analisi';
        if (pageName.includes('home')) return 'home';
        return 'altro';
    }
    
    // ============ SETUP EVENT LISTENERS ============
    
    startAutoFlush() {
        setInterval(() => {
            this.flushQueue();
        }, this.config.flushInterval);
        
        setTimeout(() => {
            this.sendPendingEvents();
        }, 5000);
    }
    
    setupEventListeners() {
        // Monitora inattività sessione
        setInterval(() => {
            const inactiveTime = Date.now() - this.session.lastActivity;
            if (inactiveTime > this.config.sessionTimeout) {
                this.trackSessionEnd();
            }
        }, 60000);
        
        // Session end su visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                setTimeout(() => this.trackSessionEnd(), 1000);
            }
        });
        
        // Rileva connessione
        window.addEventListener('online', () => {
            this.trackEvent('network', 'online', null, null, { timestamp: Date.now() });
            this.sendPendingEvents();
        });
        
        window.addEventListener('offline', () => {
            this.trackEvent('network', 'offline', null, null, { timestamp: Date.now() });
        });
        
        // Performance observer
        if ('PerformanceObserver' in window) {
            try {
                const observer = new PerformanceObserver((list) => {
                    list.getEntries().forEach(entry => {
                        if (entry.entryType === 'navigation') {
                            this.trackPerformance('page_load', entry.duration);
                        } else if (entry.entryType === 'resource' && entry.initiatorType === 'img') {
                            this.trackPerformance('image_load', entry.duration, { 
                                url: entry.name 
                            });
                        }
                    });
                });
                
                observer.observe({ entryTypes: ['navigation', 'resource'] });
            } catch (e) {
                console.warn('[Analytics] PerformanceObserver non disponibile');
            }
        }
    }
    
    setupPhilosophicalTracking() {
        // Ascolta eventi di analisi comparativa dall'app
        window.addEventListener('comparative-analysis-request', async (event) => {
            const { termine, trigger } = event.detail;
            const result = await this.trackComparativeAnalysis(termine, trigger);
            
            // Invia risultato
            window.dispatchEvent(new CustomEvent('comparative-analysis-result', {
                detail: result
            }));
        });
        
        // Unico listener per tutti gli elementi filosofici
        document.addEventListener('click', (e) => {
            // Rileva click su concetti
            const concettoElement = e.target.closest('.concetto-card, .concetto-badge, [data-concetto]');
            if (concettoElement) {
                const concettoName = concettoElement.dataset.concetto || 
                                   concettoElement.textContent.trim();
                
                if (concettoName) {
                    this.trackConcettoView(concettoName, 'click_detected', {
                        element_type: concettoElement.tagName,
                        source: 'click_tracking'
                    });
                    
                    // Se doppio click, avvia analisi
                    if (e.detail === 2) {
                        this.trackComparativeAnalysis(concettoName, 'double_click');
                    }
                }
                return;
            }
            
            // Rileva click su filosofi
            const filosofoElement = e.target.closest('.grid-item, [data-filosofo]');
            if (filosofoElement) {
                const filosofoName = filosofoElement.dataset.filosofo || 
                                    filosofoElement.querySelector('.item-name')?.textContent;
                if (filosofoName) {
                    this.trackFilosofoView(filosofoName, 'click_detected', {
                        element_type: filosofoElement.tagName
                    });
                }
                return;
            }
            
            // Rileva click su opere
            const operaElement = e.target.closest('.compact-item, [data-opera]');
            if (operaElement) {
                const operaName = operaElement.dataset.opera || 
                                 operaElement.querySelector('.compact-item-name')?.textContent;
                if (operaName) {
                    this.trackOperaView(operaName, 'click_detected', {
                        element_type: operaElement.tagName
                    });
                }
            }
        });
    }
    
    // ============ LOGGING E ATTIVITÀ ============
    
    logActivity(description, data) {
        try {
            const activity = {
                timestamp: new Date().toISOString(),
                description: description,
                data: data,
                session_id: this.session.id,
                user_id: this.user.id,
                project: 'Aeterna Lexicon in Motu'
            };
            
            const activities = JSON.parse(localStorage.getItem('analytics_activities') || '[]');
            activities.unshift(activity);
            
            if (activities.length > 100) {
                activities.splice(100);
            }
            
            localStorage.setItem('analytics_activities', JSON.stringify(activities));
        } catch (error) {
            console.warn('[Analytics] Errore log attività:', error);
        }
    }
    
    // ============ ANALISI E REPORTING ============
    
    getAnalyticsSummary() {
        const today = new Date().toDateString();
        const allEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
        const allErrors = JSON.parse(localStorage.getItem('analytics_errors') || '[]');
        
        // Eventi di oggi
        const todayEvents = allEvents.filter(event => 
            new Date(event.timestamp).toDateString() === today
        );
        
        // Sessioni oggi
        const todaySessions = todayEvents.filter(event => event.type === 'SESSION_START');
        
        // Errori oggi
        const todayErrors = allErrors.filter(error => 
            new Date(error.timestamp).toDateString() === today
        );
        
        // Analisi filosofiche
        const filosofiViews = todayEvents.filter(event => event.type === 'FILOSOFO_VIEW').length;
        const opereViews = todayEvents.filter(event => event.type === 'OPERA_VIEW').length;
        const concettiViews = todayEvents.filter(event => event.type === 'CONCETTO_VIEW').length;
        const comparativeAnalyses = todayEvents.filter(event => event.type === 'COMPARATIVE_ANALYSIS').length;
        const conceptMapInteractions = todayEvents.filter(event => event.type === 'CONCEPT_MAP_INTERACTION').length;
        
        // Performance
        const avgPageLoad = this.metrics.pageLoadTimes.length > 0 ? 
            this.metrics.pageLoadTimes.reduce((a, b) => a + b, 0) / this.metrics.pageLoadTimes.length : 0;
        
        const avgComparativeAnalysis = this.metrics.comparativeAnalysisTimes.length > 0 ? 
            this.metrics.comparativeAnalysisTimes.reduce((a, b) => a + b, 0) / this.metrics.comparativeAnalysisTimes.length : 0;
        
        // Dati filosofici unici
        const uniqueConcepts = Array.from(this.philosophyAnalytics.conceptsViewed);
        const uniquePhilosophers = Array.from(this.philosophyAnalytics.philosophersViewed);
        const uniqueWorks = Array.from(this.philosophyAnalytics.worksViewed);
        
        return {
            sessions: {
                current: this.session,
                today: todaySessions.length,
                total: allEvents.filter(e => e.type === 'SESSION_START').length
            },
            events: {
                today: todayEvents.length,
                total: allEvents.length,
                queued: this.queue.length,
                pending: JSON.parse(localStorage.getItem('analytics_pending') || '[]').length
            },
            philosophical: {
                filosofiViews: {
                    today: filosofiViews,
                    total: allEvents.filter(e => e.type === 'FILOSOFO_VIEW').length,
                    unique: uniquePhilosophers.length
                },
                opereViews: {
                    today: opereViews,
                    total: allEvents.filter(e => e.type === 'OPERA_VIEW').length,
                    unique: uniqueWorks.length
                },
                concettiViews: {
                    today: concettiViews,
                    total: allEvents.filter(e => e.type === 'CONCETTO_VIEW').length,
                    unique: uniqueConcepts.length
                },
                comparativeAnalyses: {
                    today: comparativeAnalyses,
                    total: this.philosophyAnalytics.comparativeAnalyses.length,
                    lastAnalyses: this.philosophyAnalytics.comparativeAnalyses.slice(0, 5)
                },
                conceptMap: {
                    interactions: conceptMapInteractions,
                    today: this.session.conceptMapInteractions,
                    loadTimes: this.metrics.conceptMapLoadTimes
                }
            },
            errors: {
                today: todayErrors.length,
                total: allErrors.length,
                bySeverity: {
                    high: todayErrors.filter(e => e.severity === 'high').length,
                    medium: todayErrors.filter(e => e.severity === 'medium').length,
                    low: todayErrors.filter(e => e.severity === 'low').length
                }
            },
            metrics: {
                performance: {
                    pageLoad: avgPageLoad,
                    imageLoad: this.metrics.imageLoadTimes.length > 0 ? 
                        this.metrics.imageLoadTimes.reduce((a, b) => a + b, 0) / this.metrics.imageLoadTimes.length : 0,
                    dataFetch: this.metrics.dataFetchTimes.length > 0 ? 
                        this.metrics.dataFetchTimes.reduce((a, b) => a + b, 0) / this.metrics.dataFetchTimes.length : 0,
                    comparativeAnalysis: avgComparativeAnalysis
                },
                storage: {
                    eventsSize: new Blob([JSON.stringify(allEvents)]).size,
                    errorsSize: new Blob([JSON.stringify(allErrors)]).size,
                    activitiesSize: new Blob([JSON.stringify(JSON.parse(localStorage.getItem('analytics_activities') || '[]'))]).size
                }
            },
            user: {
                id: this.user.id,
                device: this.user.device,
                analysisHistory: this.user.analysisHistory.slice(0, 10)
            },
            config: this.config,
            project: 'Aeterna Lexicon in Motu',
            timestamp: new Date().toISOString()
        };
    }
    
    getComparativeAnalytics() {
        return {
            totalAnalyses: this.philosophyAnalytics.comparativeAnalyses.length,
            analysesByTerm: this.groupAnalysesByTerm(),
            averageDuration: this.metrics.comparativeAnalysisTimes.length > 0 ? 
                this.metrics.comparativeAnalysisTimes.reduce((a, b) => a + b, 0) / this.metrics.comparativeAnalysisTimes.length : 0,
            timelineInteractions: this.philosophyAnalytics.timelineInteractions.length,
            transformationsViewed: this.philosophyAnalytics.transformationsIdentified.length,
            mostAnalyzedTerms: this.getMostAnalyzedTerms(5)
        };
    }
    
    groupAnalysesByTerm() {
        const grouped = {};
        this.philosophyAnalytics.comparativeAnalyses.forEach(analysis => {
            const term = analysis.termine;
            if (!grouped[term]) grouped[term] = 0;
            grouped[term]++;
        });
        return grouped;
    }
    
    getMostAnalyzedTerms(limit = 5) {
        const grouped = this.groupAnalysesByTerm();
        return Object.entries(grouped)
            .sort(([,a], [,b]) => b - a)
            .slice(0, limit)
            .map(([term, count]) => ({ term, count }));
    }
    
    // ============ ESPORTAZIONE DATI ============
    
    exportAnalyticsData() {
        const allData = {
            events: JSON.parse(localStorage.getItem('analytics_events') || '[]'),
            errors: JSON.parse(localStorage.getItem('analytics_errors') || '[]'),
            activities: JSON.parse(localStorage.getItem('analytics_activities') || '[]'),
            performance: this.metrics,
            philosophicalAnalytics: this.philosophyAnalytics,
            summary: this.getAnalyticsSummary(),
            comparativeAnalytics: this.getComparativeAnalytics(),
            config: this.config,
            timestamp: new Date().toISOString(),
            user_id: this.user.id,
            session_id: this.session.id,
            project: 'Aeterna Lexicon in Motu',
            export_version: '2.0.0'
        };
        
        const dataStr = JSON.stringify(allData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `analytics_aeterna_lexicon_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        // Traccia esportazione
        this.trackEvent('analytics', 'data_exported', 'json_export', null, {
            file_size: new Blob([dataStr]).size,
            export_type: 'json'
        });
        
        return exportFileDefaultName;
    }
    
    async exportAnalyticsToExcel() {
        if (window.ExcelWorker && window.ExcelWorker.exportAnalyticsData) {
            try {
                const summary = this.getAnalyticsSummary();
                const fileName = await window.ExcelWorker.exportAnalyticsData(summary);
                
                // Traccia esportazione Excel
                this.trackEvent('analytics', 'data_exported', 'excel_export', null, {
                    file_name: fileName,
                    export_type: 'excel'
                });
                
                return fileName;
            } catch (error) {
                console.error('[Analytics] Errore esportazione Excel:', error);
                this.trackError(error, 'excel_export', 'medium');
                return null;
            }
        } else {
            console.warn('[Analytics] ExcelWorker non disponibile');
            return null;
        }
    }
    
    // ============ RESET E GESTIONE ============
    
    resetUserData() {
        const userId = this.user.id;
        
        // Reset dati locali ma mantieni user ID
        localStorage.removeItem('analytics_events');
        localStorage.removeItem('analytics_errors');
        localStorage.removeItem('analytics_activities');
        localStorage.removeItem('analytics_pending');
        localStorage.removeItem('analytics_last_sync');
        localStorage.removeItem('user_analysis_history');
        
        // Mantieni user ID
        localStorage.setItem('analytics_user_id', userId);
        
        // Reset session
        this.session = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 0,
            events: 0,
            lastActivity: Date.now(),
            comparativeAnalyses: 0,
            conceptMapInteractions: 0
        };
        
        // Reset queue e metrics
        this.queue = [];
        this.metrics = {
            appStart: Date.now(),
            pageLoadTimes: [],
            imageLoadTimes: [],
            dataFetchTimes: [],
            comparativeAnalysisTimes: [],
            conceptMapLoadTimes: []
        };
        
        // Reset analytics filosofici
        this.philosophyAnalytics = {
            conceptsViewed: new Set(),
            philosophersViewed: new Set(),
            worksViewed: new Set(),
            comparativeAnalyses: [],
            timelineInteractions: [],
            transformationsIdentified: []
        };
        
        // Reset cronologia utente
        this.user.analysisHistory = [];
        
        // Traccia reset
        this.trackEvent('analytics', 'data_reset', 'manual_reset', null, { 
            user_id_preserved: userId,
            manual: true 
        });
        
        return { userId, newSessionId: this.session.id };
    }
    
    setTrackingEnabled(enabled) {
        this.config.trackingEnabled = enabled;
        this.config.comparativeAnalysis = enabled;
        this.config.conceptMapTracking = enabled;
        
        localStorage.setItem('analytics_tracking_enabled', enabled.toString());
        
        // Traccia cambiamento
        this.trackEvent('analytics', 'tracking_toggled', null, null, { 
            enabled: enabled,
            features_affected: ['basic_tracking', 'comparative_analysis', 'concept_map']
        });
        
        return enabled;
    }
    
    loadSavedData() {
        const savedTracking = localStorage.getItem('analytics_tracking_enabled');
        if (savedTracking !== null) {
            this.config.trackingEnabled = savedTracking === 'true';
        }
        
        const savedConfig = localStorage.getItem('analytics_config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                Object.assign(this.config, config);
            } catch (e) {
                console.warn('[Analytics] Configurazione salvata non valida');
            }
        }
        
        // Carica cronologia analisi utente se esiste
        const savedAnalysisHistory = localStorage.getItem('user_analysis_history');
        if (savedAnalysisHistory) {
            try {
                this.user.analysisHistory = JSON.parse(savedAnalysisHistory);
            } catch (e) {
                console.warn('[Analytics] Cronologia analisi non valida');
            }
        }
    }
    
    cleanupOldLocalEvents() {
        try {
            const localEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            
            const recentEvents = localEvents.filter(event => {
                return event.timestamp > oneWeekAgo;
            });
            
            if (recentEvents.length < localEvents.length) {
                localStorage.setItem('analytics_events', JSON.stringify(recentEvents));
                console.log(`[Analytics] Puliti ${localEvents.length - recentEvents.length} eventi vecchi`);
            }
        } catch (error) {
            console.error('[Analytics] Errore cleanup eventi:', error);
        }
    }
    
    // ============ FUNZIONI DEMO PER ANALISI ============
    
    async performDemoComparativeAnalysis(termine) {
        console.log('[Analytics] Esecuzione analisi demo per:', termine);
        
        // Dati demo per test
        const datiDemo = {
            verita: {
                classico: { occorrenze: 12, contesti: { ontologico: 8, epistemico: 4 } },
                contemporaneo: { occorrenze: 18, contesti: { politico: 10, linguistico: 8 } },
                timeline: [
                    { secolo: 'V-IV a.C.', periodo: 'classico', autori: ['Platone', 'Aristotele'], occorrenze: 3 },
                    { secolo: 'XIII d.C.', periodo: 'medioevale', autori: ['Tommaso d\'Aquino'], occorrenze: 2 },
                    { secolo: 'XX d.C.', periodo: 'contemporaneo', autori: ['Foucault', 'Nietzsche'], occorrenze: 5 }
                ],
                trasformazioni: [
                    { tipo: 'trasformazione', da: 'ontologico', a: 'politico', descrizione: 'Da concetto metafisico a strumento di analisi sociale' }
                ]
            },
            potere: {
                classico: { occorrenze: 8, contesti: { ontologico: 6, politico: 2 } },
                contemporaneo: { occorrenze: 24, contesti: { politico: 15, sociale: 9 } },
                timeline: [
                    { secolo: 'V-IV a.C.', periodo: 'classico', autori: ['Platone'], occorrenze: 2 },
                    { secolo: 'XVI d.C.', periodo: 'rinascimentale', autori: ['Machiavelli'], occorrenze: 3 },
                    { secolo: 'XX d.C.', periodo: 'contemporaneo', autori: ['Foucault', 'Weber'], occorrenze: 8 }
                ],
                trasformazioni: [
                    { tipo: 'trasformazione', da: 'ontologico', a: 'politico', descrizione: 'Da facoltà metafisica a relazione sociale' }
                ]
            }
        };
        
        const termineLower = termine.toLowerCase();
        const dati = datiDemo[termineLower] || {
            classico: { occorrenze: 5, contesti: { ontologico: 3, altro: 2 } },
            contemporaneo: { occorrenze: 7, contesti: { politico: 4, linguistico: 3 } },
            timeline: [],
            trasformazioni: []
        };
        
        return {
            termine: termine.charAt(0).toUpperCase() + termine.slice(1),
            definizione: 'Termine filosofico analizzato in modalità dimostrativa',
            periodo: 'entrambi',
            analisi: {
                classico: dati.classico,
                contemporaneo: dati.contemporaneo,
                timeline: dati.timeline,
                trasformazioni: dati.trasformazioni,
                metriche: {
                    occorrenze: {
                        classico: dati.classico.occorrenze,
                        contemporaneo: dati.contemporaneo.occorrenze,
                        totale: dati.classico.occorrenze + dati.contemporaneo.occorrenze,
                        rapporto: dati.contemporaneo.occorrenze / dati.classico.occorrenze
                    }
                }
            },
            metadata: {
                analizzatoIl: new Date().toISOString(),
                modalita: 'demo',
                source: 'analytics_demo'
            }
        };
    }
}

// ============ INIZIALIZZAZIONE GLOBALE ============

// Crea istanza globale di AnalyticsManager
window.Analytics = new AnalyticsManager();

// Inizializzazione automatica
document.addEventListener('DOMContentLoaded', async () => {
    console.log('[Analytics] Avvio inizializzazione Aeterna Lexicon...');
    
    // Funzione helper per attendere Firebase
    const waitForFirebase = (retries = 0) => {
        return new Promise((resolve) => {
            if (window.firebaseAnalytics || (window.firebase && window.firebase.analytics)) {
                console.log('[Analytics] Firebase disponibile');
                resolve();
            } else if (retries > 40) { // Timeout dopo ~20 secondi
                console.warn('[Analytics] Firebase non disponibile dopo timeout. Avvio limitato.');
                resolve();
            } else {
                setTimeout(() => {
                    waitForFirebase(retries + 1).then(resolve);
                }, 500);
            }
        });
    };

    try {
        // Wait for Service Worker to be ready
        if ('serviceWorker' in navigator) {
            try {
                await navigator.serviceWorker.ready;
                console.log('[Analytics] Service Worker pronto');
            } catch (error) {
                console.warn('[Analytics] Service Worker non disponibile:', error);
            }
        }
        
        // ATTESA ESPLICITA DI FIREBASE
        await waitForFirebase();
        
        // Initialize analytics
        await window.Analytics.initialize();
        
        // Traccia avvio app
        window.Analytics.trackEvent('app', 'loaded', 'Aeterna Lexicon', null, {
            online: navigator.onLine,
            pwa: window.matchMedia('(display-mode: standalone)').matches,
            platform: navigator.platform,
            screen_size: `${window.screen.width}x${window.screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            service_worker: 'serviceWorker' in navigator,
            project: 'Aeterna Lexicon in Motu',
            version: '2.0.0'
        });
        
        // Traccia prima pagina
        window.Analytics.trackPageView('app_start', {
            load_time: window.performance?.timing ? 
                window.performance.timing.loadEventEnd - window.performance.timing.navigationStart : 0,
            project: 'Aeterna Lexicon in Motu'
        });
        
        console.log('[Analytics] Inizializzazione completata - Sistema filosofico attivo');
        
    } catch (error) {
        console.error('[Analytics] Errore inizializzazione:', error);
        // Traccia errore anche se analytics non è pienamente inizializzato
        if (window.Analytics) {
            window.Analytics.trackError(error, 'initialization_failed', 'high');
        }
    }
});

// Hook per tracciare cambio schermate
const originalShowScreen = window.showScreen;
if (originalShowScreen) {
    window.showScreen = function(screenId) {
        const currentScreen = window.screenHistory ? window.screenHistory[window.screenHistory.length - 1] : 'home-screen';
        
        // Traccia evento navigazione (non anche page view per evitare duplicazioni)
        if (window.Analytics) {
            window.Analytics.trackEvent('navigation', 'screen_change', `${currentScreen}_to_${screenId}`, null, {
                from_screen: currentScreen,
                to_screen: screenId,
                history_length: window.screenHistory?.length || 0,
                project: 'Aeterna Lexicon in Motu'
            });
        }
        
        return originalShowScreen.call(this, screenId);
    };
}

// Setup tracking per elementi UI dopo il caricamento
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Traccia click su elementi home
        const homeButtons = document.querySelectorAll('.home-btn');
        if (homeButtons.length > 0 && window.Analytics) {
            homeButtons.forEach(btn => {
                // Rimuovi listener esistenti per evitare duplicazioni
                btn.removeEventListener('click', window.analyticsHomeButtonHandler);
                
                // Crea nuovo handler
                const handler = function() {
                    const btnType = this.className.includes('filosofi') ? 'filosofi' :
                                  this.className.includes('opere') ? 'opere' :
                                  this.className.includes('mappa') ? 'mappa' :
                                  this.className.includes('concetti') ? 'concetti' :
                                  this.className.includes('network') ? 'concept_map' : 'other';
                    
                    window.Analytics.trackEvent('home', 'button_click', btnType, null, {
                        button_text: this.querySelector('.btn-text')?.textContent || 'N/A',
                        project: 'Aeterna Lexicon in Motu'
                    });
                };
                
                // Salva riferimento all'handler e aggiungi listener
                window.analyticsHomeButtonHandler = handler;
                btn.addEventListener('click', handler);
            });
        }
        
        // Traccia ricerche
        const searchInputs = document.querySelectorAll('.search-input, #map-search-input, #search-concetto');
        searchInputs.forEach(input => {
            let searchTimeout;
            input.addEventListener('input', function() {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    if (this.value.length > 2 && window.Analytics) {
                        const category = this.id.includes('map') ? 'map' : 
                                       this.id.includes('concetto') ? 'concept' : 'general';
                        window.Analytics.trackSearch(this.value, category, 0, {
                            project: 'Aeterna Lexicon in Motu'
                        });
                    }
                }, 1000);
            });
        });
    }, 2000);
});

// Esporta funzioni globali per il pannello admin
window.analyticsFunctions = {
    refreshAnalytics: () => {
        if (window.Analytics) {
            return window.Analytics.getAnalyticsSummary();
        }
        return null;
    },
    
    exportAnalyticsData: () => {
        if (window.Analytics) {
            return window.Analytics.exportAnalyticsData();
        }
        return null;
    },
    
    exportAnalyticsToExcel: async () => {
        if (window.Analytics) {
            return await window.Analytics.exportAnalyticsToExcel();
        }
        return null;
    },
    
    resetAnalyticsData: () => {
        if (window.Analytics) {
            return window.Analytics.resetUserData();
        }
        return null;
    },
    
    toggleTracking: (enabled) => {
        if (window.Analytics) {
            return window.Analytics.setTrackingEnabled(enabled);
        }
        return false;
    },
    
    getConfig: () => {
        if (window.Analytics) {
            return { ...window.Analytics.config };
        }
        return null;
    },
    
    getComparativeAnalytics: () => {
        if (window.Analytics) {
            return window.Analytics.getComparativeAnalytics();
        }
        return null;
    },
    
    performComparativeAnalysis: async (termine) => {
        if (window.Analytics) {
            return await window.Analytics.trackComparativeAnalysis(termine, 'manual');
        }
        return null;
    },
    
    getPhilosophicalStats: () => {
        if (window.Analytics) {
            return {
                conceptsViewed: Array.from(window.Analytics.philosophyAnalytics.conceptsViewed),
                philosophersViewed: Array.from(window.Analytics.philosophyAnalytics.philosophersViewed),
                worksViewed: Array.from(window.Analytics.philosophyAnalytics.worksViewed),
                analysisHistory: window.Analytics.user.analysisHistory
            };
        }
        return null;
    },
    
    forceSync: () => {
        if (window.Analytics) {
            window.Analytics.flushQueue(true);
            return { success: true, timestamp: new Date().toISOString() };
        }
        return null;
    }
};

// Global function per avviare analisi comparativa
window.openComparativeAnalysis = async function(termine) {
    console.log(`[Global] Avvio analisi comparativa per: ${termine}`);
    
    if (window.Analytics) {
        const result = await window.Analytics.trackComparativeAnalysis(termine, 'global_function');
        
        if (result.success && result.analisi) {
            // Mostra modale con i risultati se disponibile
            if (typeof showComparativeAnalysisModal === 'function') {
                showComparativeAnalysisModal(termine, result.analisi);
            }
            return result.analisi;
        } else {
            console.error('Analisi fallita:', result.error);
            if (typeof showToast === 'function') {
                showToast(`Analisi fallita per "${termine}": ${result.error}`, 'error');
            }
            return null;
        }
    } else {
        console.warn('Analytics non disponibile');
        if (typeof showToast === 'function') {
            showToast('Sistema analytics non disponibile', 'warning');
        }
        return null;
    }
};

// Funzione helper per mostrare modale analisi (solo se non esiste già)
if (!window.showComparativeAnalysisModal) {
    window.showComparativeAnalysisModal = function(termine, analisi) {
        const modal = document.getElementById('comparative-analysis-modal');
        if (!modal) {
            console.warn('Modale analisi comparativa non trovata');
            return;
        }
        
        // Aggiorna titolo
        const titleElement = document.getElementById('comparative-term-title');
        if (titleElement) {
            titleElement.textContent = termine.toUpperCase();
        }
        
        // Popola dati classici
        const classicoOriginal = document.getElementById('classical-original-text');
        const classicoMetrics = document.getElementById('classical-metrics');
        const classicoDefinition = document.getElementById('classical-definition');
        
        if (classicoOriginal && analisi.analisi?.classico?.esempi?.[0]?.testo) {
            classicoOriginal.textContent = `"${analisi.analisi.classico.esempi[0].testo}"`;
        }
        
        if (classicoMetrics && analisi.analisi?.classico) {
            const metrics = analisi.analisi.classico;
            classicoMetrics.innerHTML = `
                <div class="metric">
                    <span class="metric-label">Occorrenze:</span>
                    <span class="metric-value">${metrics.occorrenze || 0}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Contesti:</span>
                    <span class="metric-value">${Object.keys(metrics.contesti || {}).join(', ') || 'N/D'}</span>
                </div>
            `;
        }
        
        if (classicoDefinition) {
            classicoDefinition.textContent = analisi.definizione || 'Definizione non disponibile';
        }
        
        // Popola dati contemporanei
        const contemporaneoOriginal = document.getElementById('contemporary-original-text');
        const contemporaneoMetrics = document.getElementById('contemporary-metrics');
        const contemporaneoDefinition = document.getElementById('contemporary-definition');
        
        if (contemporaneoOriginal && analisi.analisi?.contemporaneo?.esempi?.[0]?.testo) {
            contemporaneoOriginal.textContent = `"${analisi.analisi.contemporaneo.esempi[0].testo}"`;
        }
        
        if (contemporaneoMetrics && analisi.analisi?.contemporaneo) {
            const metrics = analisi.analisi.contemporaneo;
            contemporaneoMetrics.innerHTML = `
                <div class="metric">
                    <span class="metric-label">Occorrenze:</span>
                    <span class="metric-value">${metrics.occorrenze || 0}</span>
                </div>
                <div class="metric">
                    <span class="metric-label">Contesti:</span>
                    <span class="metric-value">${Object.keys(metrics.contesti || {}).join(', ') || 'N/D'}</span>
                </div>
            `;
        }
        
        if (contemporaneoDefinition) {
            contemporaneoDefinition.textContent = analisi.definizione || 'Definizione non disponibile';
        }
        
        // Popola trasformazioni
        const transformationsBody = document.getElementById('transformations-body');
        if (transformationsBody && analisi.analisi?.trasformazioni) {
            transformationsBody.innerHTML = analisi.analisi.trasformazioni.map((t, i) => `
                <tr>
                    <td>${t.da ? t.da.toUpperCase() : 'N/D'}</td>
                    <td>${t.descrizione || `${t.da} → ${t.a}`}</td>
                    <td>${t.tipo || 'sconosciuto'}</td>
                </tr>
            `).join('');
        }
        
        // Mostra modale
        modal.style.display = 'flex';
        
        // Inizializza timeline se disponibile
        if (window.TimelineEvolution && analisi.analisi?.timeline) {
            setTimeout(() => {
                const timelineElement = document.getElementById('evolution-timeline');
                if (timelineElement) {
                    window.TimelineEvolution.init('evolution-timeline', analisi.analisi.timeline);
                }
            }, 500);
        }
        
        // Traccia apertura modale
        if (window.Analytics) {
            window.Analytics.trackEvent('ui', 'modal_opened', 'comparative_analysis', null, {
                termine: termine,
                analisi_id: analisi.metadata?.analizzatoIl
            });
        }
    };
}

// Helper function per showToast (se non esiste già)
if (!window.showToast) {
    window.showToast = function(message, type = 'info') {
        console.log(`[Toast ${type}]: ${message}`);
        // Implementazione base - può essere sovrascritta da app.js
        alert(`${type.toUpperCase()}: ${message}`);
    };
}

console.log('[Analytics] Sistema Aeterna Lexicon Analytics v2.0.0 caricato');