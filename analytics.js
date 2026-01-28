// analytics.js - VERSIONE SICURA
// Gestisce il tracciamento degli eventi nell'app

class AnalyticsManager {
    constructor() {
        console.log('📊 AnalyticsManager inizializzato');
        this.sessionStart = Date.now();
    }

    trackEvent(category, action, label = null, data = null) {
        // Log in console per debug
        console.log(`[Analytics] ${category}: ${action}`, label || '', data || '');
        
        // Se Firebase è disponibile, salva l'evento
        if (window.db && window.COLLECTIONS && window.COLLECTIONS.ANALYTICS) {
            try {
                window.db.collection('analytics').add({
                    category: category,
                    action: action,
                    label: label,
                    data: data,
                    timestamp: new Date().toISOString(),
                    userAgent: navigator.userAgent
                });
            } catch (e) {
                console.warn('Impossibile salvare evento su Firebase:', e);
            }
        }
    }

    trackPageView(pageName) {
        this.trackEvent('navigation', 'view_screen', pageName);
    }
}

// Inizializza globalmente
window.Analytics = new AnalyticsManager();