// Analytics Manager - Versione Filosofica
class AnalyticsManager {
    constructor() {
        this.isInitialized = false;
        this.queue = [];
        this.config = {
            trackingEnabled: true,
            sessionTimeout: 30 * 60 * 1000,
            batchSize: 10,
            flushInterval: 10000
        };
        
        this.session = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 0,
            events: 0,
            lastActivity: Date.now()
        };
        
        this.user = {
            id: this.getUserId(),
            device: this.getDeviceInfo(),
            preferences: {}
        };
        
        // Performance metrics
        this.metrics = {
            appStart: Date.now(),
            pageLoadTimes: [],
            imageLoadTimes: [],
            dataFetchTimes: []
        };
        
        // Initialize Service Worker for analytics
        this.initializeServiceWorkerSupport();
    }
    
    async initializeServiceWorkerSupport() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.ready;
                console.log('[Analytics] Service Worker pronto');
                
                // Send analytics config to Service Worker
                if (registration.active) {
                    registration.active.postMessage({
                        type: 'ANALYTICS_CONFIG',
                        config: {
                            enabled: this.config.trackingEnabled,
                            sessionId: this.session.id,
                            userId: this.user.id
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
            
            this.isInitialized = true;
            console.log('[Analytics] Inizializzato con successo');
        } catch (error) {
            console.error('[Analytics] Errore inizializzazione:', error);
        }
    }
    
    async initializeFirebaseAnalytics() {
        if (typeof firebase !== 'undefined' && window.firebaseAnalytics) {
            console.log('[Analytics] Firebase Analytics già disponibile');
            return window.firebaseAnalytics;
        }
        
        try {
            const { getAnalytics, logEvent } = await import(
                "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js"
            );
            
            if (window.app) {
                window.firebaseAnalytics = getAnalytics(window.app);
                console.log('[Analytics] Firebase Analytics inizializzato');
                
                // Traccia prima pagina
                this.sendToFirebaseAnalytics({
                    type: 'APP_START',
                    timestamp: Date.now(),
                    session_id: this.session.id,
                    user_id: this.user.id,
                    device: this.user.device,
                    project: 'Aeterna Lexicon in Motu'
                });
                
                return window.firebaseAnalytics;
            }
        } catch (error) {
            console.warn('[Analytics] Firebase Analytics non disponibile:', error);
        }
        
        return null;
    }
    
    // ============ EVENTI FILOSOFICI ============
    
    trackEvent(category, action, label = null, value = null, customParams = {}) {
        if (!this.config.trackingEnabled) return;
        
        const event = {
            type: 'EVENT',
            timestamp: Date.now(),
            category,
            action,
            label,
            value,
            session_id: this.session.id,
            user_id: this.user.id,
            project: 'Aeterna Lexicon',
            ...customParams
        };
        
        this.queue.push(event);
        this.session.events++;
        
        // Invia a Firebase Analytics
        this.sendToFirebaseAnalytics(event);
        
        // Gestione coda locale
        if (this.queue.length >= this.config.batchSize) {
            this.flushQueue();
        }
        
        // Log attività locale
        this.logActivity(`Evento: ${category}.${action}`, event);
        
        return event;
    }
    
    trackPageView(pageName, customParams = {}) {
        if (!this.config.trackingEnabled) return;
        
        const pageView = {
            type: 'PAGE_VIEW',
            timestamp: Date.now(),
            page: pageName,
            session_id: this.session.id,
            user_id: this.user.id,
            page_views: ++this.session.pageViews,
            project: 'Aeterna Lexicon',
            ...customParams
        };
        
        this.queue.push(pageView);
        
        // Invia a Firebase Analytics
        this.sendToFirebaseAnalytics(pageView);
        
        this.session.lastActivity = Date.now();
        this.logActivity(`Pagina vista: ${pageName}`, pageView);
        
        return pageView;
    }
    
    trackFilosofoView(filosofoName, periodo, customParams = {}) {
        const event = {
            type: 'FILOSOFO_VIEW',
            timestamp: Date.now(),
            filosofo_name: filosofoName,
            periodo: periodo,
            session_id: this.session.id,
            user_id: this.user.id,
            ...customParams
        };
        
        this.queue.push(event);
        this.sendToFirebaseAnalytics(event);
        
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
            ...customParams
        };
        
        this.queue.push(event);
        this.sendToFirebaseAnalytics(event);
        
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
            ...customParams
        };
        
        this.queue.push(event);
        this.sendToFirebaseAnalytics(event);
        
        this.logActivity(`Concetto visto: ${concettoName} (${periodo})`, event);
        
        return event;
    }
    
    trackMapInteraction(action, target, coordinates = null, customParams = {}) {
        const event = {
            type: 'MAP_INTERACTION',
            timestamp: Date.now(),
            action: action,
            target: target,
            coordinates: coordinates,
            session_id: this.session.id,
            user_id: this.user.id,
            ...customParams
        };
        
        this.queue.push(event);
        this.sendToFirebaseAnalytics(event);
        
        this.logActivity(`Mappa: ${action} - ${target}`, event);
        
        return event;
    }
    
    trackConceptMapInteraction(nodeType, nodeName, customParams = {}) {
        const event = {
            type: 'CONCEPT_MAP_INTERACTION',
            timestamp: Date.now(),
            node_type: nodeType,
            node_name: nodeName,
            session_id: this.session.id,
            user_id: this.user.id,
            ...customParams
        };
        
        this.queue.push(event);
        this.sendToFirebaseAnalytics(event);
        
        this.logActivity(`Mappa concettuale: ${nodeType} - ${nodeName}`, event);
        
        return event;
    }
    
    trackSearch(query, category, resultsCount = 0, customParams = {}) {
        const event = {
            type: 'SEARCH',
            timestamp: Date.now(),
            query: query,
            category: category,
            results_count: resultsCount,
            session_id: this.session.id,
            user_id: this.user.id,
            ...customParams
        };
        
        this.queue.push(event);
        this.sendToFirebaseAnalytics(event);
        
        this.logActivity(`Ricerca: ${query} (${category}) - ${resultsCount} risultati`, event);
        
        return event;
    }
    
    trackError(error, context, severity = 'medium', customParams = {}) {
        const errorEvent = {
            type: 'ERROR',
            timestamp: Date.now(),
            error: {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code
            },
            context,
            severity,
            session_id: this.session.id,
            user_id: this.user.id,
            project: 'Aeterna Lexicon',
            ...customParams
        };
        
        this.queue.push(errorEvent);
        
        // Invia a Firebase Analytics
        this.sendToFirebaseAnalytics(errorEvent);
        
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
        }
        
        this.logActivity(`Performance: ${name} - ${duration}ms`, perfEvent);
        
        return perfEvent;
    }
    
    async sendToFirebaseAnalytics(eventData) {
        if (!window.firebaseAnalytics) return;
        
        try {
            const { logEvent } = await import(
                "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js"
            );
            
            switch(eventData.type) {
                case 'PAGE_VIEW':
                    logEvent(window.firebaseAnalytics, 'page_view', {
                        page_title: eventData.page,
                        page_location: window.location.href,
                        page_path: window.location.pathname,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id,
                        project: eventData.project || 'Aeterna Lexicon'
                    });
                    break;
                    
                case 'EVENT':
                    logEvent(window.firebaseAnalytics, eventData.action, {
                        event_category: eventData.category,
                        event_label: eventData.label,
                        value: eventData.value,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id,
                        ...eventData.customParams
                    });
                    break;
                    
                case 'FILOSOFO_VIEW':
                    logEvent(window.firebaseAnalytics, 'filosofo_viewed', {
                        filosofo_name: eventData.filosofo_name,
                        filosofo_periodo: eventData.periodo,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id,
                        project: 'Aeterna Lexicon'
                    });
                    break;
                    
                case 'OPERA_VIEW':
                    logEvent(window.firebaseAnalytics, 'opera_viewed', {
                        opera_name: eventData.opera_name,
                        opera_autore: eventData.autore,
                        opera_anno: eventData.anno,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id,
                        project: 'Aeterna Lexicon'
                    });
                    break;
                    
                case 'CONCETTO_VIEW':
                    logEvent(window.firebaseAnalytics, 'concetto_viewed', {
                        concetto_name: eventData.concetto_name,
                        concetto_periodo: eventData.periodo,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id,
                        project: 'Aeterna Lexicon'
                    });
                    break;
                    
                case 'MAP_INTERACTION':
                    logEvent(window.firebaseAnalytics, 'map_interaction', {
                        map_action: eventData.action,
                        map_target: eventData.target,
                        map_lat: eventData.coordinates?.lat,
                        map_lng: eventData.coordinates?.lng,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'CONCEPT_MAP_INTERACTION':
                    logEvent(window.firebaseAnalytics, 'concept_map_interaction', {
                        node_type: eventData.node_type,
                        node_name: eventData.node_name,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'SEARCH':
                    logEvent(window.firebaseAnalytics, 'search_performed', {
                        search_query: eventData.query?.substring(0, 100) || '',
                        search_category: eventData.category,
                        search_results: eventData.results_count,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id
                    });
                    break;
                    
                case 'ERROR':
                    logEvent(window.firebaseAnalytics, 'error_occurred', {
                        error_name: eventData.error?.name || 'Unknown',
                        error_message: eventData.error?.message?.substring(0, 100) || 'Unknown error',
                        error_context: eventData.context,
                        error_severity: eventData.severity,
                        session_id: eventData.session_id,
                        user_id: eventData.user_id,
                        project: 'Aeterna Lexicon'
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
                        device_platform: eventData.device?.platform,
                        device_online: eventData.device?.online,
                        app_version: '2.0.0',
                        project: 'Aeterna Lexicon'
                    });
                    break;
                    
                case 'APP_START':
                    logEvent(window.firebaseAnalytics, 'app_start', {
                        session_id: eventData.session_id,
                        user_id: eventData.user_id,
                        device_type: eventData.device?.userAgent?.includes('Mobile') ? 'mobile' : 'desktop',
                        pwa_mode: window.matchMedia('(display-mode: standalone)').matches,
                        project: eventData.project || 'Aeterna Lexicon'
                    });
                    break;
            }
        } catch (error) {
            console.warn('[Analytics] Errore invio a Firebase:', error);
        }
    }
    
    trackSessionStart() {
        const sessionEvent = {
            type: 'SESSION_START',
            timestamp: Date.now(),
            session_id: this.session.id,
            user_id: this.user.id,
            device: this.user.device,
            app_version: '2.0.0',
            project: 'Aeterna Lexicon'
        };
        
        this.queue.push(sessionEvent);
        this.sendToFirebaseAnalytics(sessionEvent);
        
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
            project: 'Aeterna Lexicon'
        };
        
        this.queue.push(sessionEvent);
        this.sendToFirebaseAnalytics(sessionEvent);
        
        // Genera nuova sessione
        this.session = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 0,
            events: 0,
            lastActivity: Date.now()
        };
        
        this.logActivity('Sessione terminata', sessionEvent);
    }
    
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
            
            // Invia a Firestore (se online)
            if (navigator.onLine && window.db) {
                await this.sendToFirestore(eventsToSend);
                this.cleanupOldLocalEvents();
            } else {
                this.saveForLater(eventsToSend);
            }
        } catch (error) {
            console.error('[Analytics] Errore flush queue:', error);
            this.queue.unshift(...eventsToSend);
            this.saveForLater(eventsToSend);
        }
    }
    
    async sendToFirestore(events) {
        try {
            const { collection, addDoc } = await import(
                "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js"
            );
            
            const batchData = {
                events: events,
                sent_at: new Date().toISOString(),
                session_id: this.session.id,
                user_id: this.user.id,
                device: this.user.device,
                source: 'analytics_js',
                project: 'Aeterna Lexicon'
            };
            
            const analyticsRef = collection(window.db, 'analytics');
            await addDoc(analyticsRef, batchData);
            
            localStorage.setItem('analytics_last_sync', new Date().toISOString());
            console.log(`[Analytics] ${events.length} eventi inviati a Firestore`);
        } catch (error) {
            console.error('[Analytics] Errore invio a Firestore:', error);
            throw error;
        }
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
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
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                colorDepth: window.screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            online: navigator.onLine,
            pwa: window.matchMedia('(display-mode: standalone)').matches,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        };
    }
    
    startAutoFlush() {
        setInterval(() => {
            this.flushQueue();
        }, this.config.flushInterval);
        
        setTimeout(() => {
            this.sendPendingEvents();
        }, 5000);
    }
    
    saveEventsLocally(events) {
        try {
            const localEvents = JSON.parse(localStorage.getItem('analytics_events') || '[]');
            localEvents.push(...events);
            
            if (localEvents.length > 1000) {
                localEvents.splice(0, localEvents.length - 1000);
            }
            
            localStorage.setItem('analytics_events', JSON.stringify(localEvents));
        } catch (error) {
            console.error('[Analytics] Errore salvataggio locale:', error);
        }
    }
    
    saveForLater(events) {
        try {
            const pendingEvents = JSON.parse(localStorage.getItem('analytics_pending') || '[]');
            pendingEvents.push(...events);
            localStorage.setItem('analytics_pending', JSON.stringify(pendingEvents));
        } catch (error) {
            console.error('[Analytics] Errore salvataggio pending:', error);
        }
    }
    
    async sendPendingEvents() {
        try {
            const pendingEvents = JSON.parse(localStorage.getItem('analytics_pending') || '[]');
            
            if (pendingEvents.length === 0) return;
            
            if (navigator.onLine && window.db) {
                await this.sendToFirestore(pendingEvents);
                localStorage.removeItem('analytics_pending');
                console.log(`[Analytics] ${pendingEvents.length} eventi pendenti inviati`);
            }
        } catch (error) {
            console.error('[Analytics] Errore invio eventi pendenti:', error);
        }
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
    
    logActivity(description, data) {
        try {
            const activity = {
                timestamp: new Date().toISOString(),
                description: description,
                data: data,
                session_id: this.session.id,
                project: 'Aeterna Lexicon'
            };
            
            const activities = JSON.parse(localStorage.getItem('analytics_activities') || '[]');
            activities.unshift(activity);
            
            if (activities.length > 50) {
                activities.splice(50);
            }
            
            localStorage.setItem('analytics_activities', JSON.stringify(activities));
        } catch (error) {
            console.warn('[Analytics] Errore log attività:', error);
        }
    }
    
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
        
        // Page views oggi
        const pageViews = todayEvents.filter(event => event.type === 'PAGE_VIEW').length;
        
        // Filosofi visti oggi
        const filosofiViews = todayEvents.filter(event => event.type === 'FILOSOFO_VIEW').length;
        
        // Opere viste oggi
        const opereViews = todayEvents.filter(event => event.type === 'OPERA_VIEW').length;
        
        // Concetti visti oggi
        const concettiViews = todayEvents.filter(event => event.type === 'CONCETTO_VIEW').length;
        
        // Performance media
        const avgPageLoad = this.metrics.pageLoadTimes.length > 0 ? 
            this.metrics.pageLoadTimes.reduce((a, b) => a + b, 0) / this.metrics.pageLoadTimes.length : 0;
        
        const avgImageLoad = this.metrics.imageLoadTimes.length > 0 ? 
            this.metrics.imageLoadTimes.reduce((a, b) => a + b, 0) / this.metrics.imageLoadTimes.length : 0;
        
        return {
            sessions: {
                current: this.session,
                today: todaySessions.length,
                total: allEvents.filter(e => e.type === 'SESSION_START').length
            },
            events: {
                today: todayEvents.length,
                total: allEvents.length,
                queued: this.queue.length
            },
            pageViews: {
                today: pageViews,
                total: allEvents.filter(e => e.type === 'PAGE_VIEW').length,
                session: this.session.pageViews
            },
            filosofiViews: {
                today: filosofiViews,
                total: allEvents.filter(e => e.type === 'FILOSOFO_VIEW').length
            },
            opereViews: {
                today: opereViews,
                total: allEvents.filter(e => e.type === 'OPERA_VIEW').length
            },
            concettiViews: {
                today: concettiViews,
                total: allEvents.filter(e => e.type === 'CONCETTO_VIEW').length
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
                    average: avgPageLoad,
                    imageLoad: avgImageLoad
                },
                storage: {
                    eventsSize: new Blob([JSON.stringify(allEvents)]).size,
                    errorsSize: new Blob([JSON.stringify(allErrors)]).size
                }
            },
            user: {
                id: this.user.id,
                device: this.user.device
            },
            project: 'Aeterna Lexicon in Motu'
        };
    }
    
    exportAnalyticsData() {
        const allData = {
            events: JSON.parse(localStorage.getItem('analytics_events') || '[]'),
            errors: JSON.parse(localStorage.getItem('analytics_errors') || '[]'),
            activities: JSON.parse(localStorage.getItem('analytics_activities') || '[]'),
            performance: this.metrics,
            summary: this.getAnalyticsSummary(),
            config: this.config,
            timestamp: new Date().toISOString(),
            user_id: this.user.id,
            session_id: this.session.id,
            project: 'Aeterna Lexicon in Motu'
        };
        
        const dataStr = JSON.stringify(allData, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `analytics_aeterna_lexicon_${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        return exportFileDefaultName;
    }
    
    resetUserData() {
        const userId = this.user.id;
        
        // Reset locale ma mantieni user ID
        localStorage.removeItem('analytics_events');
        localStorage.removeItem('analytics_errors');
        localStorage.removeItem('analytics_activities');
        localStorage.removeItem('analytics_pending');
        localStorage.removeItem('analytics_last_sync');
        
        // Mantieni user ID
        localStorage.setItem('analytics_user_id', userId);
        
        // Reset session
        this.session = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 0,
            events: 0,
            lastActivity: Date.now()
        };
        
        this.queue = [];
        this.metrics = {
            appStart: Date.now(),
            pageLoadTimes: [],
            imageLoadTimes: [],
            dataFetchTimes: []
        };
        
        this.trackEvent('analytics', 'data_reset', null, null, { manual: true });
        
        return { userId, newSessionId: this.session.id };
    }
    
    setTrackingEnabled(enabled) {
        this.config.trackingEnabled = enabled;
        localStorage.setItem('analytics_tracking_enabled', enabled.toString());
        this.trackEvent('analytics', 'tracking_toggled', null, null, { enabled: enabled });
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
        
        // Carica errori vecchi
        const oldErrors = localStorage.getItem('analytics_errors');
        if (!oldErrors) {
            // Migra errori vecchi se esistono
            const analyticsErrors = localStorage.getItem('analytics_errors') || '[]';
            localStorage.setItem('analytics_errors', analyticsErrors);
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
}

// Inizializza Analytics Manager
window.Analytics = new AnalyticsManager();

// Inizializzazione automatica MODIFICATA per attendere Firebase
document.addEventListener('DOMContentLoaded', async () => {
    // Funzione helper per attendere Firebase
    const waitForFirebase = (retries = 0) => {
        return new Promise((resolve) => {
            if (window.app && window.firebaseAnalytics) {
                resolve();
            } else if (retries > 20) { // Timeout dopo ~10 secondi
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
        window.Analytics.trackEvent('app', 'loaded', null, null, {
            online: navigator.onLine,
            pwa: window.matchMedia('(display-mode: standalone)').matches,
            platform: navigator.platform,
            screen_size: `${window.screen.width}x${window.screen.height}`,
            viewport_size: `${window.innerWidth}x${window.innerHeight}`,
            service_worker: 'serviceWorker' in navigator,
            project: 'Aeterna Lexicon in Motu'
        });
        
        // Traccia prima pagina
        window.Analytics.trackPageView('app_start', {
            load_time: window.performance?.timing ? 
                window.performance.timing.loadEventEnd - window.performance.timing.navigationStart : 0,
            project: 'Aeterna Lexicon'
        });
        
        console.log('[Analytics] Inizializzazione completata');
    } catch (error) {
        console.error('[Analytics] Errore inizializzazione:', error);
    }
});

// Hook per tracciare cambio schermate
const originalShowScreen = window.showScreen;
if (originalShowScreen) {
    window.showScreen = function(screenId) {
        const currentScreen = window.screenHistory ? window.screenHistory[window.screenHistory.length - 1] : 'home-screen';
        
        // Traccia cambio schermata
        if (window.Analytics) {
            window.Analytics.trackEvent('navigation', 'screen_change', `${currentScreen}_to_${screenId}`, null, {
                from_screen: currentScreen,
                to_screen: screenId,
                history_length: window.screenHistory?.length || 0,
                project: 'Aeterna Lexicon'
            });
            
            window.Analytics.trackPageView(`screen_${screenId}`, {
                screen_name: screenId,
                screen_type: screenId.includes('filosofo') ? 'filosofo_detail' : 
                          screenId.includes('opera') ? 'opera_detail' : 
                          screenId.includes('concetto') ? 'concetto_detail' : 
                          screenId === 'home-screen' ? 'home' : 
                          screenId === 'mappa-concettuale-screen' ? 'concept_map' : 'list',
                project: 'Aeterna Lexicon'
            });
        }
        
        return originalShowScreen.call(this, screenId);
    };
}

// Hook per tracciare click importanti
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        // Traccia click su pulsanti home
        document.querySelectorAll('.home-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const btnType = this.className.includes('filosofi') ? 'filosofi' :
                              this.className.includes('opere') ? 'opere' :
                              this.className.includes('mappa') ? 'mappa' :
                              this.className.includes('concetti') ? 'concetti' :
                              this.className.includes('network') ? 'concept_map' : 'other';
                
                if (window.Analytics) {
                    window.Analytics.trackEvent('home', 'button_click', btnType, null, {
                        button_text: this.querySelector('.btn-text')?.textContent || 'N/A',
                        project: 'Aeterna Lexicon'
                    });
                }
            });
        });
        
        // Traccia click su elementi lista filosofi
        document.addEventListener('click', function(e) {
            const gridItem = e.target.closest('.grid-item');
            const compactItem = e.target.closest('.compact-item');
            const concettoCard = e.target.closest('.concetto-card');
            
            if (gridItem && window.Analytics) {
                const name = gridItem.querySelector('.item-name')?.textContent;
                const periodo = gridItem.querySelector('.item-status')?.textContent;
                window.Analytics.trackEvent('list', 'item_click', 'filosofo_item', null, {
                    item_name: name || 'N/A',
                    item_type: 'filosofo',
                    periodo: periodo || 'N/A',
                    project: 'Aeterna Lexicon'
                });
            }
            
            if (compactItem && window.Analytics) {
                const name = compactItem.querySelector('.compact-item-name')?.textContent;
                const autore = compactItem.querySelector('.compact-item-author')?.textContent;
                window.Analytics.trackEvent('list', 'item_click', 'opera_item', null, {
                    item_name: name || 'N/A',
                    item_type: 'opera',
                    autore: autore || 'N/A',
                    project: 'Aeterna Lexicon'
                });
            }
            
            if (concettoCard && window.Analytics) {
                const title = concettoCard.querySelector('.concetto-title')?.textContent;
                window.Analytics.trackEvent('list', 'item_click', 'concetto_item', null, {
                    item_name: title || 'N/A',
                    item_type: 'concetto',
                    project: 'Aeterna Lexicon'
                });
            }
        });
        
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
                            project: 'Aeterna Lexicon'
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
    }
};