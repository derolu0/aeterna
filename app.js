/**
 * AETERNA LEXICON IN MOTU - APP.JS COMPLETA CON DATASET INTEGRATO
 * Project Work Filosofico - Dataset per analisi trasformazioni linguistiche
 * Versione 4.0.0 - DATASET COMPLETO INTEGRATO (20 filosofi, 40 opere, 23 concetti)
 */

// ==================== VARIABILI DI STATO ====================
let currentScreen = 'home-screen';
let previousScreen = null;

// Dati Filosofici COMPLETI (già definiti nel codice)
let filosofiData = [];
let opereData = [];
let concettiData = [];
let currentFilter = 'all';

// Mappa Filosofica
let philosophicalMap = null;
let markersLayer = null;

// Mappa Concettuale
let networkInstance = null;

// PWA Installation
let deferredPrompt = null;

// ==================== DATASET COMPLETO ====================

// 20 FILOSOFI COMPLETI
const FILOSOFI_DATASET = [
    // ============ FILOSOFI CLASSICI ============
    {
        id: "F1",
        nome: "Platone",
        periodo: "classico",
        scuola: "Accademia",
        anni: "428-348 a.C.",
        biografia: "Fondatore dell'Accademia di Atene. Allievo di Socrate e maestro di Aristotele. La sua filosofia si concentra sulle Idee eterne e immutabili, distinguendo tra mondo sensibile e mondo intelligibile. Autore di dialoghi fondamentali come 'La Repubblica', 'Fedone' e 'Simposio'.",
        concetti_principali: ["Idea", "Bene", "Anima", "Stato ideale", "Mito della caverna"],
        coordinate: { lat: 37.9838, lng: 23.7275 },
        citta_nascita: "Atene",
        paese_nascita: "Grecia",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Plato_-_Platon.jpg/220px-Plato_-_Platon.jpg"
    },
    {
        id: "F2",
        nome: "Aristotele",
        periodo: "classico",
        scuola: "Liceo",
        anni: "384-322 a.C.",
        biografia: "Allievo di Platone e maestro di Alessandro Magno. Fondatore del Liceo e padre della logica formale. Sviluppa una filosofia empirica basata sull'osservazione della natura. Autore di 'Metafisica', 'Etica Nicomachea' e 'Politica'.",
        concetti_principali: ["Sostanza", "Atto/Potenza", "Causa", "Virtù", "Logica"],
        coordinate: { lat: 40.6401, lng: 22.9444 },
        citta_nascita: "Stagira",
        paese_nascita: "Grecia",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Aristotle_Altemps_Inv8575.jpg/220px-Aristotle_Altemps_Inv8575.jpg"
    },
    {
        id: "F3",
        nome: "Agostino d'Ippona",
        periodo: "classico",
        scuola: "Patristica",
        anni: "354-430 d.C.",
        biografia: "Teologo e filosofo cristiano. Sintetizza platonismo e cristianesimo. Le sue 'Confessioni' sono un capolavoro di introspezione psicologica. Sviluppa la dottrina della grazia e analizza il tempo e l'interiorità.",
        concetti_principali: ["Grazia", "Peccato originale", "Città di Dio", "Tempo", "Interiorità"],
        coordinate: { lat: 36.8625, lng: 10.1956 },
        citta_nascita: "Tagaste",
        paese_nascita: "Algeria",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Saint_Augustine_by_Philippe_de_Champaigne.jpg/220px-Saint_Augustine_by_Philippe_de_Champaigne.jpg"
    },
    {
        id: "F4",
        nome: "Tommaso d'Aquino",
        periodo: "classico",
        scuola: "Scolastica",
        anni: "1225-1274",
        biografia: "Teologo domenicano. Sintetizza aristotelismo e teologia cristiana nella 'Summa Theologiae'. Sviluppa le cinque vie per dimostrare l'esistenza di Dio e la teoria della legge naturale.",
        concetti_principali: ["Atto/Potenza", "Essenza/Esistenza", "Legge naturale", "Bene comune", "Analogia"],
        coordinate: { lat: 41.4664, lng: 12.6871 },
        citta_nascita: "Roccasecca",
        paese_nascita: "Italia",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/Carlos_III_de_Espa%C3%B1a_por_Mengs.jpg/220px-Carlos_III_de_Espa%C3%B1a_por_Mengs.jpg"
    },
    {
        id: "F5",
        nome: "René Descartes",
        periodo: "classico",
        scuola: "Razionalismo",
        anni: "1596-1650",
        biografia: "Padre della filosofia moderna. Noto per 'Cogito ergo sum'. Sviluppa un metodo basato sul dubbio metodico e la ragione matematica. Autore di 'Discorso sul metodo' e 'Meditazioni metafisiche'.",
        concetti_principali: ["Cogito", "Dubbio metodico", "Sostanza", "Res cogitans", "Res extensa"],
        coordinate: { lat: 47.2184, lng: -1.5536 },
        citta_nascita: "La Haye en Touraine",
        paese_nascita: "Francia",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/Frans_Hals_-_Portret_van_Ren%C3%A9_Descartes.jpg/220px-Frans_Hals_-_Portret_van_Ren%C3%A9_Descartes.jpg"
    },
    {
        id: "F6",
        nome: "Immanuel Kant",
        periodo: "classico",
        scuola: "Idealismo tedesco",
        anni: "1724-1804",
        biografia: "Fondatore del criticismo. Opera la 'rivoluzione copernicana' in filosofia, ponendo l'accento sulle condizioni di possibilità della conoscenza. Autore delle tre Critiche: ragion pura, ragion pratica, giudizio.",
        concetti_principali: ["Imperativo categorico", "Critica", "Trascendentale", "Noumeno", "Fenomeno"],
        coordinate: { lat: 54.7065, lng: 20.5110 },
        citta_nascita: "Königsberg",
        paese_nascita: "Prussia",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Immanuel_Kant_%28painted_portrait%29.jpg/220px-Immanuel_Kant_%28painted_portrait%29.jpg"
    },
    {
        id: "F7",
        nome: "Georg Wilhelm Friedrich Hegel",
        periodo: "classico",
        scuola: "Idealismo tedesco",
        anni: "1770-1831",
        biografia: "Sviluppa la dialettica come motore della storia e del pensiero. La sua filosofia si articola in Fenomenologia, Logica e Filosofia dello Spirito. Autore di 'Fenomenologia dello Spirito' e 'Lineamenti di filosofia del diritto'.",
        concetti_principali: ["Dialettica", "Spirito assoluto", "Aufhebung", "Storia", "Ragione"],
        coordinate: { lat: 48.7758, lng: 9.1829 },
        citta_nascita: "Stoccarda",
        paese_nascita: "Germania",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Georg_Wilhelm_Friedrich_Hegel.jpg/220px-Georg_Wilhelm_Friedrich_Hegel.jpg"
    },
    {
        id: "F8",
        nome: "Friedrich Nietzsche",
        periodo: "contemporaneo",
        scuola: "Filosofia della vita",
        anni: "1844-1900",
        biografia: "Critico radicale della metafisica, della morale e della religione. Annuncia la 'morte di Dio' e propone la trasvalutazione di tutti i valori. Autore di 'Così parlò Zarathustra' e 'Genealogia della morale'.",
        concetti_principali: ["Oltreuomo", "Volontà di potenza", "Eterno ritorno", "Apollineo/Dionisiaco", "Ressentiment"],
        coordinate: { lat: 51.2277, lng: 6.7735 },
        citta_nascita: "Röcken",
        paese_nascita: "Germania",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Nietzsche187a.jpg/220px-Nietzsche187a.jpg"
    },
    {
        id: "F9",
        nome: "Karl Marx",
        periodo: "contemporaneo",
        scuola: "Marxismo",
        anni: "1818-1883",
        biografia: "Fondatore del materialismo storico. Analizza le strutture economiche e sociali, proponendo una critica radicale del capitalismo. Autore de 'Il Capitale' e 'Manifesto del Partito Comunista'.",
        concetti_principali: ["Alienazione", "Plusvalore", "Lotta di classe", "Ideologia", "Materialismo storico"],
        coordinate: { lat: 49.4432, lng: 7.7689 },
        citta_nascita: "Treviri",
        paese_nascita: "Germania",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Karl_Marx_001.jpg/220px-Karl_Marx_001.jpg"
    },
    {
        id: "F10",
        nome: "Søren Kierkegaard",
        periodo: "contemporaneo",
        scuola: "Esistenzialismo",
        anni: "1813-1855",
        biografia: "Padre dell'esistenzialismo. Oppone la singolarità esistenziale all'astrazione hegeliana. Sottolinea l'importanza della scelta e dell'angoscia. Autore di 'Aut-Aut' e 'Il concetto dell'angoscia'.",
        concetti_principali: ["Angoscia", "Singolo", "Salto", "Stadi esistenziali", "Paradosso"],
        coordinate: { lat: 55.6761, lng: 12.5683 },
        citta_nascita: "Copenaghen",
        paese_nascita: "Danimarca",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/S%C3%B8ren_Kierkegaard_%281813-1855%29.png/220px-S%C3%B8ren_Kierkegaard_%281813-1855%29.png"
    },
    // ============ FILOSOFI CONTEMPORANEI ============
    {
        id: "F11",
        nome: "Martin Heidegger",
        periodo: "contemporaneo",
        scuola: "Fenomenologia, Ermeneutica",
        anni: "1889-1976",
        biografia: "Autore di 'Essere e tempo'. Sviluppa l'analitica esistenziale e la questione del senso dell'essere, criticando la metafisica tradizionale. Studia la temporalità e l'evento.",
        concetti_principali: ["Esserci", "Essere-nel-mondo", "Cura", "Temporalità", "Evento"],
        coordinate: { lat: 47.8667, lng: 8.2167 },
        citta_nascita: "Meßkirch",
        paese_nascita: "Germania",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Martin_Heidegger_2.jpg/220px-Martin_Heidegger_2.jpg"
    },
    {
        id: "F12",
        nome: "Ludwig Wittgenstein",
        periodo: "contemporaneo",
        scuola: "Filosofia analitica",
        anni: "1889-1951",
        biografia: "Autore del 'Tractatus logico-philosophicus' e delle 'Ricerche filosofiche'. Indaga i limiti del linguaggio e i giochi linguistici. Passa da una visione raffigurativa a una visione pragmatica del linguaggio.",
        concetti_principali: ["Gioco linguistico", "Limite del linguaggio", "Forme di vita", "Mostrare vs Dire", "Uso"],
        coordinate: { lat: 48.2082, lng: 16.3738 },
        citta_nascita: "Vienna",
        paese_nascita: "Austria",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/Ludwig_Wittgenstein_%281930s%29.jpg/220px-Ludwig_Wittgenstein_%281930s%29.jpg"
    },
    {
        id: "F13",
        nome: "Jean-Paul Sartre",
        periodo: "contemporaneo",
        scuola: "Esistenzialismo",
        anni: "1905-1980",
        biografia: "Filosofo, scrittore e drammaturgo. Sviluppa l'esistenzialismo ateo con concetti come libertà radicale e impegno. Autore de 'L'essere e il nulla' e 'L'esistenzialismo è un umanesimo'.",
        concetti_principali: ["Esistenza precede essenza", "Libertà", "Cattiva fede", "Impegno", "Nausea"],
        coordinate: { lat: 48.8566, lng: 2.3522 },
        citta_nascita: "Parigi",
        paese_nascita: "Francia",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Sartre_1967_crop.jpg/220px-Sartre_1967_crop.jpg"
    },
    {
        id: "F14",
        nome: "Michel Foucault",
        periodo: "contemporaneo",
        scuola: "Post-strutturalismo",
        anni: "1926-1984",
        biografia: "Analizza i rapporti tra potere, sapere e soggettività. Studia istituzioni come la prigione, il manicomio, la sessualità. Autore di 'Sorvegliare e punire' e 'Storia della sessualità'.",
        concetti_principali: ["Potere", "Sapere", "Soggettivazione", "Dispositivo", "Archeologia"],
        coordinate: { lat: 49.1829, lng: -0.3707 },
        citta_nascita: "Poitiers",
        paese_nascita: "Francia",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/06/Michel_Foucault.jpg/220px-Michel_Foucault.jpg"
    },
    {
        id: "F15",
        nome: "Jacques Derrida",
        periodo: "contemporaneo",
        scuola: "Decostruzionismo",
        anni: "1930-2004",
        biografia: "Fondatore della decostruzione. Critica il logocentrismo della metafisica occidentale e analizza le strutture testuali. Autore di 'Della grammatologia' e 'Margini della filosofia'.",
        concetti_principali: ["Decostruzione", "Différance", "Traccia", "Logocentrismo", "Scrittura"],
        coordinate: { lat: 33.9716, lng: -6.8498 },
        citta_nascita: "El Biar",
        paese_nascita: "Algeria",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Jacques_Derrida.jpg/220px-Jacques_Derrida.jpg"
    },
    {
        id: "F16",
        nome: "Judith Butler",
        periodo: "contemporaneo",
        scuola: "Teoria queer, Femminismo",
        anni: "1956",
        biografia: "Teorica del genere e della performatività. Sviluppa la critica alle categorie binarie di sesso e genere. Autrice di 'Questione di genere' e 'Vite precarie'.",
        concetti_principali: ["Performatività", "Genere", "Agency", "Precarietà", "Corpi"],
        coordinate: { lat: 39.9526, lng: -75.1652 },
        citta_nascita: "Cleveland",
        paese_nascita: "USA",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Judith_Butler_%28cropped%29.png/220px-Judith_Butler_%28cropped%29.png"
    },
    {
        id: "F17",
        nome: "Giorgio Agamben",
        periodo: "contemporaneo",
        scuola: "Filosofia politica",
        anni: "1942",
        biografia: "Studia le forme di potere e di esclusione nella modernità, come lo stato di eccezione e la vita nuda. Autore di 'Homo sacer' e 'Quel che resta di Auschwitz'.",
        concetti_principali: ["Homo sacer", "Stato di eccezione", "Vita nuda", "Dispositivo", "Forma-di-vita"],
        coordinate: { lat: 45.4408, lng: 12.3155 },
        citta_nascita: "Roma",
        paese_nascita: "Italia",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Giorgio_Agamben_in_2009.jpg/220px-Giorgio_Agamben_in_2009.jpg"
    },
    {
        id: "F18",
        nome: "Martha Nussbaum",
        periodo: "contemporaneo",
        scuola: "Filosofia morale, Neo-aristotelismo",
        anni: "1947",
        biografia: "Sviluppa l'approccio delle capacità e un'etica delle virtù rivisitata in chiave contemporanea. Autrice di 'Giustizia sociale e dignità umana' e 'L'intelligenza delle emozioni'.",
        concetti_principali: ["Capacità", "Fioritura umana", "Vulnerabilità", "Emozioni", "Giustizia"],
        coordinate: { lat: 40.7128, lng: -74.0060 },
        citta_nascita: "New York",
        paese_nascita: "USA",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Martha_Nussbaum.jpg/220px-Martha_Nussbaum.jpg"
    },
    {
        id: "F19",
        nome: "Slavoj Žižek",
        periodo: "contemporaneo",
        scuola: "Psicoanalisi lacaniana, Marxismo",
        anni: "1949",
        biografia: "Unisce psicoanalisi lacaniana, marxismo e cultura pop. Critica l'ideologia e il capitalismo globale. Autore de 'Il soggetto scabroso' e 'Vivere alla fine dei tempi'.",
        concetti_principali: ["Ideologia", "Reale", "Soggettività", "Fantasma", "Sinthome"],
        coordinate: { lat: 46.0569, lng: 14.5058 },
        citta_nascita: "Lubiana",
        paese_nascita: "Slovenia",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Slavoj_%C5%BDi%C5%BEek.jpg/220px-Slavoj_%C5%BDi%C5%BEek.jpg"
    },
    {
        id: "F20",
        nome: "Byung-Chul Han",
        periodo: "contemporaneo",
        scuola: "Filosofia sociale",
        anni: "1959",
        biografia: "Critica della società della prestazione e della trasparenza. Analizza le patologie del capitalismo digitale. Autore di 'La società della stanchezza' e 'La società della trasparenza'.",
        concetti_principali: ["Società della stanchezza", "Trasparenza", "Violenza psichica", "Burnout", "Digitale"],
        coordinate: { lat: 37.5665, lng: 126.9780 },
        citta_nascita: "Seoul",
        paese_nascita: "Corea del Sud",
        immagine: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Byung-Chul_Han_%282022%29.jpg/220px-Byung-Chul_Han_%282022%29.jpg"
    }
];

// 40 OPERE COMPLETE (2 per filosofo)
const OPERE_DATASET = [
    // PLATONE
    { id: "O1", titolo: "La Repubblica", autore: "Platone", autore_id: "F1", anno: "380 a.C.", periodo: "classico", sintesi: "Dialogo sulla giustizia e sull'organizzazione dello Stato ideale. Introduce il mito della caverna e la teoria delle Idee. Esplora la natura della giustizia, l'educazione dei guardiani e la struttura dello Stato perfetto.", concetti: ["Giustizia", "Idea del Bene", "Stato ideale", "Mito della caverna", "Educazione"] },
    { id: "O2", titolo: "Fedone", autore: "Platone", autore_id: "F1", anno: "360 a.C.", periodo: "classico", sintesi: "Dialogo sull'immortalità dell'anima ambientato nelle ultime ore di vita di Socrate. Presenta le prove dell'immortalità dell'anima e la teoria della reminiscenza.", concetti: ["Anima", "Immortalità", "Reminiscenza", "Corpo", "Morte"] },
    
    // ARISTOTELE
    { id: "O3", titolo: "Etica Nicomachea", autore: "Aristotele", autore_id: "F2", anno: "340 a.C.", periodo: "classico", sintesi: "Trattato sull'etica delle virtù. Definisce la felicità (eudaimonia) come attività dell'anima secondo virtù. Analizza le virtù etiche e dianoetiche.", concetti: ["Virtù", "Giusto mezzo", "Eudaimonia", "Prudenza", "Azione"] },
    { id: "O4", titolo: "Metafisica", autore: "Aristotele", autore_id: "F2", anno: "335 a.C.", periodo: "classico", sintesi: "Studio dell'essere in quanto essere. Analizza le cause (materiale, formale, efficiente, finale), la sostanza e il motore immobile.", concetti: ["Sostanza", "Atto/Potenza", "Causa", "Motore immobile", "Essere"] },
    
    // AGOSTINO
    { id: "O5", titolo: "Confessioni", autore: "Agostino d'Ippona", autore_id: "F3", anno: "397-400", periodo: "classico", sintesi: "Autobiografia espirituale in 13 libri. Analizza il percorso dalla conversione alla grazia divina. Riflette su tempo, memoria e interiorità.", concetti: ["Grazia", "Peccato", "Interiorità", "Tempo", "Conversione"] },
    { id: "O6", titolo: "La città di Dio", autore: "Agostino d'Ippona", autore_id: "F3", anno: "413-426", periodo: "classico", sintesi: "Apologia del cristianesimo in 22 libri dopo il sacco di Roma del 410. Distingue città terrena (amor sui) e città celeste (amor Dei).", concetti: ["Città di Dio", "Città terrena", "Provvidenza", "Storia", "Grazia"] },
    
    // TOMMASO
    { id: "O7", titolo: "Summa Theologiae", autore: "Tommaso d'Aquino", autore_id: "F4", anno: "1265-1274", periodo: "classico", sintesi: "Sintesi sistematica della teologia cristiana in tre parti. Espone le cinque vie per dimostrare l'esistenza di Dio e la legge naturale.", concetti: ["Legge naturale", "Cinque vie", "Essenza/Esistenza", "Bene", "Dio"] },
    { id: "O8", titolo: "Summa contra Gentiles", autore: "Tommaso d'Aquino", autore_id: "F4", anno: "1259-1265", periodo: "classico", sintesi: "Apologia della fede cristiana contro i non credenti. Argomenti razionali per l'esistenza di Dio accessibili anche ai non cristiani.", concetti: ["Ragione/Fede", "Dio", "Creazione", "Provvidenza", "Argomento"] },
    
    // DESCARTES
    { id: "O9", titolo: "Discorso sul metodo", autore: "René Descartes", autore_id: "F5", anno: "1637", periodo: "classico", sintesi: "Esposizione del metodo razionale per la ricerca della verità. Contiene 'Cogito ergo sum' e le quattro regole del metodo.", concetti: ["Cogito", "Dubbio metodico", "Ragione", "Metodo", "Certezza"] },
    { id: "O10", titolo: "Meditazioni metafisiche", autore: "René Descartes", autore_id: "F5", anno: "1641", periodo: "classico", sintesi: "Indagine sulle basi della conoscenza in sei meditazioni. Dimostrazione dell'esistenza di Dio e della realtà del mondo esterno.", concetti: ["Dio garante", "Res cogitans", "Res extensa", "Idea innata", "Certezza"] },
    
    // KANT
    { id: "O11", titolo: "Critica della ragion pura", autore: "Immanuel Kant", autore_id: "F6", anno: "1781", periodo: "classico", sintesi: "Analisi dei limiti e delle condizioni di possibilità della conoscenza. Distinzione fenomeno/noumeno e rivoluzione copernicana.", concetti: ["Trascendentale", "Fenomeno/Noumeno", "Categorie", "Rivoluzione copernicana", "Ragione"] },
    { id: "O12", titolo: "Critica della ragion pratica", autore: "Immanuel Kant", autore_id: "F6", anno: "1788", periodo: "classico", sintesi: "Fondazione dell'etica sull'imperativo categorico e sull'autonomia della volontà. Analizza libertà, dovere e legge morale.", concetti: ["Imperativo categorico", "Autonomia", "Regno dei fini", "Libertà", "Dovere"] },
    
    // HEGEL
    { id: "O13", titolo: "Fenomenologia dello Spirito", autore: "Georg Wilhelm Friedrich Hegel", autore_id: "F7", anno: "1807", periodo: "classico", sintesi: "Descrizione del percorso dello Spirito verso l'autocoscienza assoluta attraverso la dialettica. Include dialettica signoria/servitù.", concetti: ["Dialettica", "Autocoscienza", "Signoria/servitù", "Spirito assoluto", "Storia"] },
    { id: "O14", titolo: "Lineamenti di filosofia del diritto", autore: "Georg Wilhelm Friedrich Hegel", autore_id: "F7", anno: "1820", periodo: "classico", sintesi: "Esposizione dell'eticità nelle sue forme: famiglia, società civile, Stato. Analizza diritto astratto, moralità, eticità.", concetti: ["Eticità", "Stato", "Diritto", "Libertà concreta", "Società civile"] },
    
    // NIETZSCHE
    { id: "O15", titolo: "Così parlò Zarathustra", autore: "Friedrich Nietzsche", autore_id: "F8", anno: "1883-1885", periodo: "contemporaneo", sintesi: "Opera poetica in quattro parti che annuncia l'Oltreuomo e la morte di Dio. Critica della morale tradizionale e celebrazione della vita.", concetti: ["Oltreuomo", "Morte di Dio", "Volontà di potenza", "Eterno ritorno", "Trasvalutazione"] },
    { id: "O16", titolo: "Genealogia della morale", autore: "Friedrich Nietzsche", autore_id: "F8", anno: "1887", periodo: "contemporaneo", sintesi: "Analisi genealogica della morale in tre trattati. Distinzione tra morale dei signori e morale degli schiavi. Concetto di ressentiment.", concetti: ["Genealogia", "Ressentiment", "Morale", "Trasvalutazione", "Volontà"] },
    
    // MARX
    { id: "O17", titolo: "Il Capitale", autore: "Karl Marx", autore_id: "F9", anno: "1867", periodo: "contemporaneo", sintesi: "Analisi critica del modo di produzione capitalistico. Teoria del valore, del plusvalore e dell'accumulazione del capitale.", concetti: ["Plusvalore", "Alienazione", "Capitale", "Lotta di classe", "Valore"] },
    { id: "O18", titolo: "Manifesto del Partito Comunista", autore: "Karl Marx", autore_id: "F9", anno: "1848", periodo: "contemporaneo", sintesi: "Programma politico del comunismo scritto con Engels. Analisi della storia come lotta di classe e critica del capitalismo.", concetti: ["Lotta di classe", "Borghesia/Proletariato", "Rivoluzione", "Comunismo", "Storia"] },
    
    // KIERKEGAARD
    { id: "O19", titolo: "Aut-Aut", autore: "Søren Kierkegaard", autore_id: "F10", anno: "1843", periodo: "contemporaneo", sintesi: "Analisi degli stadi esistenziali: estetico (immediato), etico (universale), religioso (paradossale). Importanza della scelta.", concetti: ["Stadi esistenziali", "Scelta", "Angoscia", "Singolo", "Paradosso"] },
    { id: "O20", titolo: "Il concetto dell'angoscia", autore: "Søren Kierkegaard", autore_id: "F10", anno: "1844", periodo: "contemporaneo", sintesi: "Studio psicologico dell'angoscia come presupposto del peccato e della libertà. Analisi del rapporto tra possibilità e realtà.", concetti: ["Angoscia", "Libertà", "Peccato", "Possibilità", "Salto"] },
    
    // HEIDEGGER
    { id: "O21", titolo: "Essere e tempo", autore: "Martin Heidegger", autore_id: "F11", anno: "1927", periodo: "contemporaneo", sintesi: "Analitica esistenziale dell'Esserci (Dasein). Studio della temporalità come orizzonte dell'essere. Concetti di cura, essere-nel-mondo.", concetti: ["Esserci", "Cura", "Temporalità", "Essere-nel-mondo", "Autenticità"] },
    { id: "O22", titolo: "Sentieri interrotti", autore: "Martin Heidegger", autore_id: "F11", anno: "1950", periodo: "contemporaneo", sintesi: "Raccolta di saggi sulla questione dell'essere, della tecnica e dell'arte. Include 'L'origine dell'opera d'arte'.", concetti: ["Evento", "Tecnica", "Arte", "Verità", "Essere"] },
    
    // WITTGENSTEIN
    { id: "O23", titolo: "Tractatus logico-philosophicus", autore: "Ludwig Wittgenstein", autore_id: "F12", anno: "1921", periodo: "contemporaneo", sintesi: "Teoria raffigurativa del linguaggio. Distinzione tra ciò che può essere detto e ciò che può solo essere mostrato. Limiti del linguaggio.", concetti: ["Limite del linguaggio", "Mostrare/Dire", "Fatto", "Forma logica", "Mistico"] },
    { id: "O24", titolo: "Ricerche filosofiche", autore: "Ludwig Wittgenstein", autore_id: "F12", anno: "1953", periodo: "contemporaneo", sintesi: "Critica della concezione del Tractatus. Teoria dei giochi linguistici e delle forme di vita. Analisi dell'uso del linguaggio.", concetti: ["Gioco linguistico", "Uso", "Forma di vita", "Regola", "Significato"] },
    
    // SARTRE
    { id: "O25", titolo: "L'essere e il nulla", autore: "Jean-Paul Sartre", autore_id: "F13", anno: "1943", periodo: "contemporaneo", sintesi: "Esposizione dell'esistenzialismo ateo. Analizza la coscienza (per sé), della libertà radicale e della cattiva fede.", concetti: ["Esistenza/essenza", "Cattiva fede", "Libertà", "Néant", "Sguardo"] },
    { id: "O26", titolo: "L'esistenzialismo è un umanesimo", autore: "Jean-Paul Sartre", autore_id: "F13", anno: "1946", periodo: "contemporaneo", sintesi: "Difesa popolare dell'esistenzialismo come filosofia dell'impegno e della responsabilità. Conferenza del 1945.", concetti: ["Impegno", "Responsabilità", "Umanesimo", "Progetto", "Angoscia"] },
    
    // FOUCAULT
    { id: "O27", titolo: "Sorvegliare e punire", autore: "Michel Foucault", autore_id: "F14", anno: "1975", periodo: "contemporaneo", sintesi: "Genealogia del sistema carcerario moderno. Analisi del potere disciplinare e del panopticon. Nascita della prigione.", concetti: ["Potere disciplinare", "Panopticon", "Corpo", "Normalizzazione", "Sorveglianza"] },
    { id: "O28", titolo: "Storia della sessualità", autore: "Michel Foucault", autore_id: "F14", anno: "1976-1984", periodo: "contemporaneo", sintesi: "Analisi del potere sui corpi e sulla sessualità. Concetti di biopotere, governo delle condotte, tecnologie del sé.", concetti: ["Biopotere", "Sessualità", "Soggettivazione", "Governamentalità", "Dispositivo"] },
    
    // DERRIDA
    { id: "O29", titolo: "Della grammatologia", autore: "Jacques Derrida", autore_id: "F15", anno: "1967", periodo: "contemporaneo", sintesi: "Critica del logocentrismo della metafisica occidentale. Teoria della scrittura e della traccia. Decostruzione.", concetti: ["Decostruzione", "Logocentrismo", "Scrittura", "Traccia", "Différance"] },
    { id: "O30", titolo: "Margini della filosofia", autore: "Jacques Derrida", autore_id: "F15", anno: "1972", periodo: "contemporaneo", sintesi: "Decostruzione dei concetti metafisici fondamentali. Analisi della différance e dei margini del testo filosofico.", concetti: ["Différance", "Margine", "Metafisica", "Testo", "Supplemento"] },
    
    // BUTLER
    { id: "O31", titolo: "Questione di genere", autore: "Judith Butler", autore_id: "F16", anno: "1990", periodo: "contemporaneo", sintesi: "Teoria della performatività del genere. Critica del binarismo sessuale. Il genere come atto ripetuto e stilizzato.", concetti: ["Performatività", "Genere", "Agency", "Norma", "Corpo"] },
    { id: "O32", titolo: "Vite precarie", autore: "Judith Butler", autore_id: "F16", anno: "2004", periodo: "contemporaneo", sintesi: "Analisi della vulnerabilità e del lutto come dimensioni politiche. Critica della guerra e della violenza dopo l'11 settembre.", concetti: ["Precarietà", "Lutto", "Vulnerabilità", "Riconoscimento", "Violenza"] },
    
    // AGAMBEN
    { id: "O33", titolo: "Homo sacer", autore: "Giorgio Agamben", autore_id: "F17", anno: "1995", periodo: "contemporaneo", sintesi: "Studio della vita nuda (zoé) e dello stato di eccezione nella politica occidentale. Concetto di homo sacer.", concetti: ["Homo sacer", "Vita nuda", "Stato di eccezione", "Biopolitica", "Sovranità"] },
    { id: "O34", titolo: "Quel che resta di Auschwitz", autore: "Giorgio Agamben", autore_id: "F17", anno: "1998", periodo: "contemporaneo", sintesi: "Analisi etica e politica del testimone e dell'indicibile dopo la Shoah. Concetto del 'musulmano' come testimone integrale.", concetti: ["Testimone", "Musulmano", "Sopravvissuto", "Etica", "Memoria"] },
    
    // NUSSBAUM
    { id: "O35", titolo: "Giustizia sociale e dignità umana", autore: "Martha Nussbaum", autore_id: "F18", anno: "2006", periodo: "contemporaneo", sintesi: "Sviluppo dell'approccio delle capacità per valutare lo sviluppo umano e la giustizia sociale. Elenco delle capacità centrali.", concetti: ["Capacità", "Fioritura umana", "Giustizia", "Dignità", "Sviluppo"] },
    { id: "O36", titolo: "L'intelligenza delle emozioni", autore: "Martha Nussbaum", autore_id: "F18", anno: "2001", periodo: "contemporaneo", sintesi: "Rivalutazione filosofica delle emozioni come elementi cruciali del ragionamento pratico. Analisi di rabbia, compassione, amore.", concetti: ["Emozioni", "Ragione pratica", "Vulnerabilità", "Compassione", "Giudizio"] },
    
    // ŽIŽEK
    { id: "O37", titolo: "Il soggetto scabroso", autore: "Slavoj Žižek", autore_id: "F19", anno: "1999", periodo: "contemporaneo", sintesi: "Unione di psicoanalisi lacaniana e teoria politica. Analisi dell'ideologia contemporanea attraverso il cinema e la cultura pop.", concetti: ["Soggetto", "Ideologia", "Reale", "Fantasma", "Desiderio"] },
    { id: "O38", titolo: "Vivere alla fine dei tempi", autore: "Slavoj Žižek", autore_id: "F19", anno: "2010", periodo: "contemporaneo", sintesi: "Critica ecologica e politica del capitalismo globale. Analisi delle apocalissi contemporanee: ecologica, sociale, simbolica.", concetti: ["Capitalismo", "Ecologia", "Apocalisse", "Psicoanalisi", "Crisi"] },
    
    // BYUNG-CHUL HAN
    { id: "O39", titolo: "La società della stanchezza", autore: "Byung-Chul Han", autore_id: "F20", anno: "2010", periodo: "contemporaneo", sintesi: "Critica della società della prestazione e del burnout. Analisi delle patologie della positività: depressione, ADHD, burnout.", concetti: ["Società della stanchezza", "Burnout", "Prestazione", "Positività", "Depressione"] },
    { id: "O40", titolo: "La società della trasparenza", autore: "Byung-Chul Han", autore_id: "F20", anno: "2012", periodo: "contemporaneo", sintesi: "Critica della trasparenza come ideologia del controllo. Analisi della società digitale e della perdita di intimità.", concetti: ["Trasparenza", "Controllo", "Digitale", "Intimità", "Informazione"] }
];

// 23 CONCETTI COMPLETI
const CONCETTI_DATASET = [
    // ============ CONCETTI ONTOLOGICI ============
    {
        id: "C1",
        parola: "Essere",
        periodo: "entrambi",
        definizione: "Fondamento della realtà, ciò che esiste. In Aristotele: essere come sostanza. In Heidegger: essere come evento che si dà nella temporalità.",
        evoluzione: "CLASSICO: Sostanza statica ed eterna (Aristotele). CONTEMPORANEO: Evento storico e processuale (Heidegger). Trasformazione da ontologia sostanzialista a ontologia dell'evento.",
        esempio: "Aristotele: 'L'essere si dice in molti modi'. Heidegger: 'L'essere si dà nell'evento appropriante'.",
        autore_riferimento: "F2, F11"
    },
    {
        id: "C2",
        parola: "Sostanza",
        periodo: "classico",
        definizione: "Ciò che esiste di per sé, soggetto di attributi. In Aristotele: sinolo di materia e forma. Ciò che permane nei cambiamenti.",
        evoluzione: "Concetto centrale nella metafisica classica, criticato e abbandonato nella filosofia contemporanea. Sostituito da relazione, processo, struttura.",
        esempio: "Aristotele: 'La sostanza è l'essere primo'. Deleuze: critica della sostanza a favore del divenire e della molteplicità.",
        autore_riferimento: "F2"
    },
    {
        id: "C3",
        parola: "Relazione",
        periodo: "contemporaneo",
        definizione: "Modo di essere che implica connessione tra enti. Prioritaria rispetto alla sostanza nella filosofia contemporanea. Struttura ontologica fondamentale.",
        evoluzione: "Da categoria accidentale in Aristotele (relazione come uno dei nove accidenti) a struttura ontologica fondamentale nella filosofia contemporanea (Whitehead, Deleuze).",
        esempio: "Whitehead: 'L'attuale entità è un processo di relazioni'. Tutto ciò che è, è in relazione.",
        autore_riferimento: "F15"
    },
    
    // ============ CONCETTI EPISTEMOLOGICI ============
    {
        id: "C4",
        parola: "Verità",
        periodo: "entrambi",
        definizione: "Corrispondenza tra pensiero e realtà (adaequatio intellectus et rei) nella tradizione classica. Nella contemporaneità: costruzione discorsiva, evento, effetto di potere.",
        evoluzione: "CLASSICO: Verità come corrispondenza oggettiva (Tommaso). CONTEMPORANEO: Verità come costruzione storica (Nietzsche), evento di disvelamento (Heidegger), effetto di regimi discorsivi (Foucault).",
        esempio: "Tommaso: 'Veritas est adaequatio rei et intellectus'. Nietzsche: 'Non ci sono fatti, solo interpretazioni'.",
        autore_riferimento: "F4, F8"
    },
    {
        id: "C5",
        parola: "Conoscenza",
        periodo: "entrambi",
        definizione: "Possesso di informazioni vere e giustificate (episteme) nella tradizione classica. Nella contemporaneità: pratica situata, potere, costruzione storica.",
        evoluzione: "Da episteme come conoscenza certa e fondata a sapere come costruzione storica e strumento di potere. Passaggio da epistemologia a genealogia del sapere.",
        esempio: "Platone: conoscenza delle Idee (episteme) vs opinione (doxa). Foucault: 'Il sapere è potere', analisi delle formazioni discorsive.",
        autore_riferimento: "F1, F14"
    },
    {
        id: "C6",
        parola: "Ragione",
        periodo: "entrambi",
        definizione: "Facoltà di pensare, argomentare e conoscere. Da logos universale (classico) a ragione situata, incarnata, critica (contemporaneo).",
        evoluzione: "CLASSICO: Ragione come facoltà universale e autonoma (Kant). CONTEMPORANEO: Ragione come storicamente situata (Gadamer), strumentale (Horkheimer), incarnata (Merleau-Ponty).",
        esempio: "Kant: 'Sapere aude! Abbi il coraggio di servirti della tua propria intelligenza'. Horkheimer: critica della ragione strumentale.",
        autore_riferimento: "F6"
    },
    
    // ============ CONCETTI ETICI ============
    {
        id: "C7",
        parola: "Bene",
        periodo: "entrambi",
        definizione: "Ciò che è desiderabile o perfettivo. Nella tradizione classica: Idea del Bene (Platone), bene oggettivo. Nella contemporaneità: bene situato, relazionale, contestuale.",
        evoluzione: "Da Bene trascendente e oggettivo a bene immanente e relazionale. Da etica delle virtù a etica della cura, della responsabilità, del riconoscimento.",
        esempio: "Platone: 'Il Bene è al di sopra dell'essere'. Levinas: l'Altro come orizzonte etico, responsabilità per l'altro.",
        autore_riferimento: "F1"
    },
    {
        id: "C8",
        parola: "Libertà",
        periodo: "entrambi",
        definizione: "Capacità di agire senza costrizioni. Nella tradizione classica: libertà come autodeterminazione della volontà. Nella contemporaneità: libertà come responsabilità, situazione, progetto.",
        evoluzione: "Da libertà come proprietà della volontà (Kant) a libertà come condizione esistenziale (Sartre), situata e condizionata (Foucault).",
        esempio: "Kant: autonomia della volontà come obbedienza alla legge morale che la ragione si dà. Sartre: 'Siamo condannati a essere liberi'.",
        autore_riferimento: "F6, F13"
    },
    {
        id: "C9",
        parola: "Responsabilità",
        periodo: "contemporaneo",
        definizione: "Rispondere dell'altro prima di ogni scelta. Concetto centrale nell'etica contemporanea, specialmente dopo Levinas e Jonas.",
        evoluzione: "Da responsabilità giuridica e limitata a responsabilità etica illimitata verso l'altro. Da responsabilità per le proprie azioni a responsabilità per l'altro, per le generazioni future, per il pianeta.",
        esempio: "Levinas: 'La responsabilità per l'altro mi costituisce come soggetto'. Jonas: principio responsabilità verso le generazioni future.",
        autore_riferimento: "F13"
    },
    
    // ============ CONCETTI POLITICI ============
    {
        id: "C10",
        parola: "Potere",
        periodo: "entrambi",
        definizione: "Capacità di influenzare il comportamento. Nella tradizione classica: potere sovrano, diritto di vita e di morte. Nella contemporaneità: potere diffuso, produttivo, capillare.",
        evoluzione: "Da potere sovrano (Hobbes) a potere disciplinare (Foucault) e biopotere. Da potere come repressione a potere come produzione di soggettività.",
        esempio: "Hobbes: potere come leviatano che garantisce sicurezza. Foucault: 'Il potere è ovunque', potere produttivo che crea saperi e soggetti.",
        autore_riferimento: "F14"
    },
    {
        id: "C11",
        parola: "Giustizia",
        periodo: "entrambi",
        definizione: "Virtù che dà a ciascuno il suo. Da giustizia distributiva (Aristotele) a giustizia come equità (Rawls) o riconoscimento (Honneth).",
        evoluzione: "CLASSICO: Giustizia come proporzione e equità distributiva. CONTEMPORANEO: Giustizia come riconoscimento, capacità, riparazione. Allargamento della nozione oltre la distribuzione materiale.",
        esempio: "Aristotele: giustizia distributiva (secondo merito) e commutativa. Rawls: 'Giustizia come equità' con principi di libertà e differenza.",
        autore_riferimento: "F2, F18"
    },
    {
        id: "C12",
        parola: "Comunità",
        periodo: "entrambi",
        definizione: "Insieme di individui legati da valori comuni. Da comunità organica (classico) a comunità senza identità, inoperosa, degli esclusi (contemporaneo).",
        evoluzione: "Da comunità come organismo unitario con identità forte a comunità come spazio di esposizione alla singolarità (Nancy), comunità degli esclusi (Agamben).",
        esempio: "Aristotele: 'L'uomo è animale politico' (zoon politikon). Nancy: 'Comunità inoperosa' come esposizione reciproca delle singolarità.",
        autore_riferimento: "F2, F17"
    },
    
    // ============ CONCETTI ANTROPOLOGICI ============
    {
        id: "C13",
        parola: "Soggetto",
        periodo: "entrambi",
        definizione: "Individuo cosciente e autonomo. Nella tradizione classica: soggetto sostanziale, cogito cartesiano. Nella contemporaneità: soggetto decentrato, costruito, effetto.",
        evoluzione: "Da soggetto come fondamento (Descartes) a soggetto come effetto del linguaggio (Wittgenstein), del potere (Foucault), dell'inconscio (Lacan). Soggetto come costruzione storica.",
        esempio: "Descartes: 'Cogito ergo sum'. Foucault: 'Il soggetto è un effetto del potere'. Butler: soggetto come performatività.",
        autore_riferimento: "F5, F14"
    },
    {
        id: "C14",
        parola: "Corpo",
        periodo: "entrambi",
        definizione: "Realtà materiale dell'essere umano. Nella tradizione classica: prigione dell'anima, ostacolo alla conoscenza. Nella contemporaneità: luogo di espressione, medium della coscienza, oggetto di potere.",
        evoluzione: "Da corpo come ostacolo (Platone) a corpo come medium della coscienza (Merleau-Ponty) o superficie di iscrizione del potere (Foucault). Rivalutazione del corpo nella filosofia contemporanea.",
        esempio: "Platone: 'Il corpo è la tomba dell'anima'. Merleau-Ponty: 'Siamo il nostro corpo'. Foucault: corpo disciplinato.",
        autore_riferimento: "F1, F14"
    },
    {
        id: "C15",
        parola: "Desiderio",
        periodo: "entrambi",
        definizione: "Tendenza verso un oggetto percepito come buono. Nella tradizione classica: desiderio come mancanza (Platone). Nella contemporaneità: desiderio come produzione, forza attiva.",
        evoluzione: "Da desiderio come mancanza da colmare a desiderio come produzione creativa (Deleuze). Da desiderio come passività a desiderio come attività, forza che produce realtà.",
        esempio: "Platone: Eros come desiderio dell'immortalità, del Bene. Deleuze e Guattari: 'Il desiderio produce la realtà sociale'.",
        autore_riferimento: "F1"
    },
    
    // ============ CONCETTI ESTETICI ============
    {
        id: "C16",
        parola: "Bello",
        periodo: "entrambi",
        definizione: "Ciò che suscita piacere disinteressato. Nella tradizione classica: bellezza come armonia, proporzione, riflesso dell'Idea. Nella contemporaneità: bellezza come inquietante, sublime, evento.",
        evoluzione: "Da bello come armonia e proporzione a sublime come esperienza del limite (Kant, Lyotard). Da bellezza ideale a bellezza come evento che dischiude verità (Heidegger).",
        esempio: "Platone: bellezza delle Idee. Kant: sublime come esperienza dell'illimitato. Heidegger: 'L'arte dischiude la verità'.",
        autore_riferimento: "F1, F6"
    },
    {
        id: "C17",
        parola: "Arte",
        periodo: "entrambi",
        definizione: "Produzione umana di opere significative. Nella tradizione classica: mimesi della natura (imitazione). Nella contemporaneità: espressione, creazione, evento di verità.",
        evoluzione: "Da arte come imitazione (mimesis) a arte come espressione (Croce), creazione (Bergson), evento di verità (Heidegger). Da arte come rappresentazione a arte come produzione di senso.",
        esempio: "Aristotele: 'L'arte imita la natura'. Heidegger: 'L'arte è il porre-in-opera della verità'.",
        autore_riferimento: "F2, F11"
    },
    
    // ============ CONCETTI METAFISICI ============
    {
        id: "C18",
        parola: "Tempo",
        periodo: "entrambi",
        definizione: "Dimensione del divenire. Nella tradizione classica: tempo cosmico, misura del movimento. Nella contemporaneità: tempo esistenziale, cura, differimento.",
        evoluzione: "Da tempo come movimento circolare (Aristotele) a tempo come cura (Heidegger), differimento (Derrida), durata (Bergson). Temporalizzazione dell'essere.",
        esempio: "Agostino: 'Che cos'è dunque il tempo? Se nessuno me lo chiede, lo so; se voglio spiegarlo a chi me lo chiede, non lo so'. Heidegger: 'Il tempo è l'orizzonte dell'essere'.",
        autore_riferimento: "F3, F11"
    },
    {
        id: "C19",
        parola: "Causalità",
        periodo: "classico",
        definizione: "Relazione tra causa ed effetto. Le quattro cause aristoteliche: materiale, formale, efficiente, finale. Concetto fondamentale nella scienza e metafisica classica.",
        evoluzione: "Criticata da Hume (nesso causale come abitudine) e dalla scienza moderna (sostituita da probabilità, relazione statistica). Nella filosofia contemporanea: sostituita da relazione, struttura, sistema.",
        esempio: "Aristotele: 'Tutto ciò che si muove è mosso da un altro'. Hume: critica del nesso causale come necessità logica.",
        autore_riferimento: "F2"
    },
    {
        id: "C20",
        parola: "Contingenza",
        periodo: "contemporaneo",
        definizione: "Carattere di ciò che potrebbe non essere o essere altrimenti. Opposta alla necessità. Concetto centrale nella filosofia contemporanea.",
        evoluzione: "Da categoria marginale nella filosofia classica a principio ontologico fondamentale nella filosofia contemporanea. Affermazione della contingenza contro ogni necessità metafisica.",
        exemplo: "Heidegger: 'L'Esserci è il fondamento di una nullità'. Vattimo: 'Pensiero debole' della contingenza contro i fondamenti forti.",
        autore_riferimento: "F11"
    },
    
    // ============ CONCETTI LINGUISTICI ============
    {
        id: "C21",
        parola: "Linguaggio",
        periodo: "entrambi",
        definizione: "Sistema di segni per comunicare. Nella tradizione classica: strumento di rappresentazione della realtà. Nella contemporaneità: casa dell'essere, gioco, pratica sociale.",
        evoluzione: "Da linguaggio come copia della realtà a linguaggio come costituzione del mondo (Wittgenstein, Heidegger). Svolta linguistica nella filosofia del Novecento.",
        esempio: "Aristotele: 'Le parole sono simboli delle affezioni dell'anima'. Heidegger: 'Il linguaggio è la casa dell'essere'. Wittgenstein: 'I limiti del mio linguaggio sono i limiti del mio mondo'.",
        autore_riferimento: "F2, F11, F12"
    },
    {
        id: "C22",
        parola: "Interpretazione",
        periodo: "contemporaneo",
        definizione: "Attività di attribuire significato. Da ermeneutica come metodo di interpretazione dei testi a condizione esistenziale dell'essere umano.",
        evoluzione: "Da interpretazione come accesso al senso del testo (esegesi) a interpretazione come modo di essere (Heidegger, Gadamer). Ermeneutica come filosofia prima.",
        esempio: "Gadamer: 'L'essere che può essere compreso è linguaggio'. L'interpretazione come fusione di orizzonti tra testo e interprete.",
        autore_riferimento: "F11"
    },
    {
        id: "C23",
        parola: "Dialogo",
        periodo: "entrambi",
        definizione: "Scambio discorsivo tra interlocutori. Nella tradizione classica: metodo per raggiungere la verità (dialettica socratica). Nella contemporaneità: struttura ontologica, evento di verità.",
        evoluzione: "Da dialogo socratico come maieutica (far partorire la verità) a dialogo come evento di verità (Gadamer). Da dialogo come metodo a dialogo come ethos filosofico.",
        esempio: "Platone: dialoghi socratici come ricerca comune della verità. Gadamer: 'La comprensione è sempre fusione di orizzonti' nel dialogo.",
        autore_riferimento: "F1"
    }
];

// ==================== INIZIALIZZAZIONE APP ====================
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📚 Aeterna Lexicon - Avvio con dataset completo...');
    
    // 1. SPLASH SCREEN
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.classList.add('hidden');
            setTimeout(() => {
                splash.style.display = 'none';
            }, 500);
        }
        
        checkMaintenanceMode();
        showScreen('home-screen');
        handleUrlParameters();
        
        console.log('✅ Interfaccia Sbloccata');
    }, 2000);
    
    // 2. CARICA DATI DAL DATASET COMPLETO (non più da Firebase)
    await loadPhilosophicalData();
    
    // 3. SETUP LISTENER DI BASE
    if (typeof setupConnectionListeners === 'function') setupConnectionListeners();
    if (typeof setupImportListeners === 'function') setupImportListeners();
    
    console.log('✅ Dataset completo caricato:', {
        filosofi: filosofiData.length,
        opere: opereData.length,
        concetti: concettiData.length
    });
});

// ==================== CARICAMENTO DATI COMPLETI ====================
async function loadPhilosophicalData() {
    try {
        console.log('📖 Caricamento dataset filosofico completo...');
        
        // Carica dai dataset integrati (non più da Firebase)
        filosofiData = FILOSOFI_DATASET;
        opereData = OPERE_DATASET;
        concettiData = CONCETTI_DATASET;
        
        // Renderizza le liste
        renderFilosofiList();
        renderOpereList();
        renderConcettiList();
        
        console.log('✅ Dataset caricato:', {
            filosofi: filosofiData.length,
            opere: opereData.length,
            concetti: concettiData.length
        });
        
    } catch (error) {
        console.error('❌ Errore caricamento dati:', error);
        showToast('Errore nel caricamento dei dati filosofici', 'error');
        // Fallback: usa i dati integrati comunque
        filosofiData = FILOSOFI_DATASET;
        opereData = OPERE_DATASET;
        concettiData = CONCETTI_DATASET;
        renderFilosofiList();
        renderOpereList();
        renderConcettiList();
    }
}

// ==================== GESTIONE NAVIGAZIONE ====================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    
    const target = document.getElementById(screenId);
    if (target) {
        if (screenId !== currentScreen) {
            previousScreen = currentScreen;
        }
        currentScreen = screenId;

        target.classList.add('active');
        target.style.display = 'flex';
        
        updateTabBar(screenId);
        loadScreenData(screenId);
        
        if(document.querySelector('.content-area')) {
            document.querySelector('.content-area').scrollTop = 0;
        }
        window.scrollTo(0,0);
    }
}

function goBack() {
    if (currentScreen === 'home-screen') return;

    if (currentScreen === 'filosofo-detail-screen') {
        showScreen('filosofi-screen');
    } else if (currentScreen === 'opera-detail-screen') {
        showScreen('opere-screen');
    } else if (currentScreen === 'concetto-detail-screen') {
        showScreen('concetti-screen');
    } else if (previousScreen && previousScreen !== currentScreen) {
        showScreen(previousScreen);
    } else {
        showScreen('home-screen');
    }
}

function updateTabBar(screenId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-target') === screenId) {
            btn.classList.add('active');
        }
    });
}

function handleUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const screen = urlParams.get('screen');
    if (screen) {
        const map = {
            'filosofi': 'filosofi-screen',
            'opere': 'opere-screen',
            'concetti': 'concetti-screen',
            'mappa': 'mappa-screen',
            'analisi': 'comparative-analysis-modal'
        };
        if (map[screen] && map[screen] !== 'comparative-analysis-modal') {
            showScreen(map[screen]);
        }
    }
}

// ==================== RENDER LISTE ====================
function renderFilosofiList() {
    const container = document.getElementById('filosofi-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (filosofiData.length === 0) {
        container.innerHTML = `<div class="empty-state"><p>Nessun filosofo trovato</p></div>`;
        return;
    }
    
    // Applica filtro
    const filtered = currentFilter === 'all' 
        ? filosofiData 
        : filosofiData.filter(f => f.periodo === currentFilter);
    
    filtered.forEach(filosofo => {
        container.appendChild(createFilosofoCard(filosofo));
    });
}

function renderOpereList() {
    const container = document.getElementById('opere-list');
    if (!container) return;
    container.innerHTML = '';
    
    opereData.forEach(opera => {
        container.appendChild(createOperaCard(opera));
    });
}

function renderConcettiList() {
    const container = document.getElementById('concetti-list');
    if (!container) return;
    container.innerHTML = '';
    
    if (concettiData.length > 0) {
        container.appendChild(createConcettiSection('Tutti i Concetti', concettiData, 'entrambi'));
    }
}

// ==================== CREAZIONE CARD ====================
function createFilosofoCard(filosofo) {
    const card = document.createElement('div');
    card.className = 'grid-item';
    card.classList.add(`border-${filosofo.periodo === 'contemporaneo' ? 'contemporary' : 'classic'}`);
    
    card.innerHTML = `
        <div class="item-image-container">
            ${filosofo.immagine ? 
                `<img src="${filosofo.immagine}" alt="${filosofo.nome}" class="item-image" 
                     onerror="this.src='https://derolu0.github.io/aeterna/images/default-filosofo.jpg'">` :
                `<div class="image-fallback">👤</div>`
            }
        </div>
        <div class="item-content">
            <h3 class="item-name">${filosofo.nome}</h3>
            <div class="item-details">
                <div><strong>Periodo:</strong> ${getPeriodoLabel(filosofo.periodo)}</div>
                <div><strong>Scuola:</strong> ${filosofo.scuola || 'N/D'}</div>
                <div><strong>Anni:</strong> ${filosofo.anni || 'N/D'}</div>
            </div>
            <div class="item-footer">
                <span class="item-periodo periodo-${filosofo.periodo}">
                    ${filosofo.periodo === 'contemporaneo' ? 'CONTEMPORANEO' : 'CLASSICO'}
                </span>
                ${generateMapButton(filosofo)}
            </div>
        </div>
    `;
    
    card.addEventListener('click', () => showFilosofoDetail(filosofo.id));
    return card;
}

function createOperaCard(opera) {
    const card = document.createElement('div');
    card.className = 'compact-item';
    card.classList.add(`border-${opera.periodo === 'contemporaneo' ? 'contemporary' : 'classic'}`);
    
    card.innerHTML = `
        <div class="compact-item-image-container">
            <div class="compact-image-fallback">📖</div>
        </div>
        <div class="compact-item-content">
            <div class="compact-item-header">
                <h3 class="compact-item-name">${opera.titolo}</h3>
            </div>
            <div class="compact-item-autore"><i class="fas fa-user-pen"></i> ${opera.autore || 'Autore sconosciuto'}</div>
            <div class="compact-item-footer">
                <span class="compact-item-anno">${opera.anno || 'N/D'}</span>
                <span class="compact-item-periodo periodo-${opera.periodo}">${opera.periodo === 'contemporaneo' ? 'CONTEMP.' : 'CLASSICO'}</span>
            </div>
        </div>
    `;
    card.addEventListener('click', () => showOperaDetail(opera.id));
    return card;
}

function createConcettiSection(title, concetti, periodo) {
    const section = document.createElement('div');
    section.className = 'concetti-section';
    
    section.innerHTML = `
        <div class="section-header"><h3>${title}</h3><span class="section-count">${concetti.length}</span></div>
        <div class="concetti-grid">
            ${concetti.map(c => createConcettoCardString(c)).join('')}
        </div>
    `;
    return section;
}

function createConcettoCardString(concetto) {
    return `
    <div class="concetto-card border-${concetto.periodo === 'contemporaneo' ? 'contemporary' : 'classic'}" 
         onclick="showConcettoDetail('${concetto.id}')">
        <div class="concetto-header">
            <h3 class="concetto-parola">${concetto.parola}</h3>
        </div>
        <p class="concetto-definizione">${concetto.definizione ? (concetto.definizione.length > 150 ? concetto.definizione.substring(0, 150) + '...' : concetto.definizione) : ''}</p>
        <div class="concetto-actions">
            <button class="btn-analisi small" 
                    onclick="event.stopPropagation(); openComparativeAnalysis('${concetto.parola}')">
                Analisi
            </button>
        </div>
    </div>
    `;
}

// ==================== DETTAGLI ====================
function showFilosofoDetail(id) {
    const filosofo = filosofiData.find(f => f.id === id);
    if (!filosofo) return;
    
    const content = document.getElementById('filosofo-detail-content');
    if (!content) return;
    
    // Trova le opere di questo filosofo
    const opereFilosofo = opereData.filter(o => o.autore_id === id);
    
    content.innerHTML = `
        <div class="detail-header">
            <h1 class="detail-name">${filosofo.nome}</h1>
            <div class="detail-meta-grid">
                <div class="meta-item"><strong>Periodo:</strong> ${getPeriodoLabel(filosofo.periodo)}</div>
                <div class="meta-item"><strong>Anni:</strong> ${filosofo.anni || 'N/D'}</div>
                <div class="meta-item"><strong>Scuola:</strong> ${filosofo.scuola || 'N/D'}</div>
                <div class="meta-item"><strong>Luogo:</strong> ${filosofo.citta_nascita || ''}, ${filosofo.paese_nascita || ''}</div>
            </div>
        </div>
        
        <div class="detail-info">
            <h3>Biografia</h3>
            <p class="biography-text">${filosofo.biografia || 'Nessuna biografia disponibile.'}</p>
        </div>
        
        ${filosofo.concetti_principali ? `
        <div class="detail-info">
            <h3>Concetti Principali</h3>
            <div class="tags-cloud">
                ${filosofo.concetti_principali.map(c => `<span class="tag-chip">${c}</span>`).join('')}
            </div>
        </div>` : ''}
        
        ${opereFilosofo.length > 0 ? `
        <div class="detail-info">
            <h3>Opere Principali</h3>
            <div class="opere-list">
                ${opereFilosofo.map(opera => `
                    <div class="opera-item" onclick="showOperaDetail('${opera.id}')">
                        <strong>${opera.titolo}</strong> (${opera.anno})
                        <p class="opera-sintesi">${opera.sintesi ? (opera.sintesi.length > 100 ? opera.sintesi.substring(0, 100) + '...' : opera.sintesi) : ''}</p>
                    </div>
                `).join('')}
            </div>
        </div>` : ''}
        
        ${filosofo.coordinate && typeof filosofo.coordinate.lat !== 'undefined' ? `
        <div class="action-buttons-container">
            <button class="btn-analisi" onclick="goToMapLocation(${filosofo.coordinate.lat}, ${filosofo.coordinate.lng}, '${filosofo.nome.replace(/'/g, "\\'")}')">
                <i class="fas fa-map-marker-alt"></i> Vedi sulla Mappa
            </button>
        </div>` : ''}
    `;
    
    showScreen('filosofo-detail-screen');
}

function showOperaDetail(id) {
    const opera = opereData.find(o => o.id === id);
    if (!opera) return;
    
    const content = document.getElementById('opera-detail-content');
    content.innerHTML = `
        <div class="detail-header">
            <h1 class="detail-name">${opera.titolo}</h1>
            <div class="detail-meta-grid">
                <div class="meta-item"><strong>Autore:</strong> ${opera.autore}</div>
                <div class="meta-item"><strong>Anno:</strong> ${opera.anno}</div>
                <div class="meta-item"><strong>Periodo:</strong> ${getPeriodoLabel(opera.periodo)}</div>
            </div>
        </div>
        <div class="detail-info">
            <h3>Sintesi</h3>
            <p class="biography-text">${opera.sintesi || 'Sintesi non disponibile.'}</p>
        </div>
        ${opera.concetti ? `
        <div class="detail-info">
            <h3>Concetti Chiave</h3>
            <div class="tags-cloud">
                ${opera.concetti.map(c => `<span class="tag-chip">${c}</span>`).join('')}
            </div>
        </div>` : ''}
    `;
    showScreen('opera-detail-screen');
}

function showConcettoDetail(id) {
    const concetto = concettiData.find(c => c.id === id);
    if (!concetto) return;
    
    const content = document.getElementById('concetto-detail-content');
    
    // Trova autori di riferimento
    let autoriRiferimento = '';
    if (concetto.autore_riferimento) {
        const autoriIds = concetto.autore_riferimento.split(',');
        const autori = autoriIds.map(id => {
            const filosofo = filosofiData.find(f => f.id === id.trim());
            return filosofo ? filosofo.nome : '';
        }).filter(nome => nome !== '');
        
        if (autori.length > 0) {
            autoriRiferimento = `<p><strong>Autori di riferimento:</strong> ${autori.join(', ')}</p>`;
        }
    }
    
    content.innerHTML = `
        <div class="detail-header">
            <h1 class="detail-name">${concetto.parola}</h1>
            <div class="detail-meta-grid">
                <div class="meta-item"><strong>Periodo:</strong> ${getPeriodoLabel(concetto.periodo)}</div>
                ${autoriRiferimento ? `<div class="meta-item">${autoriRiferimento}</div>` : ''}
            </div>
        </div>
        <div class="detail-info">
            <h3>Definizione</h3>
            <p>${concetto.definizione}</p>
        </div>
        ${concetto.esempio ? `
        <div class="detail-info">
            <h3>Esempio</h3>
            <p><em>${concetto.esempio}</em></p>
        </div>` : ''}
        ${concetto.evoluzione ? `
        <div class="detail-info">
            <h3>Evoluzione Storica</h3>
            <p>${concetto.evoluzione}</p>
        </div>` : ''}
        <div class="action-buttons-container">
            <button class="btn-analisi" onclick="openComparativeAnalysis('${concetto.parola}')">Analisi Comparativa</button>
        </div>
    `;
    showScreen('concetto-detail-screen');
}

// ==================== FUNZIONI MENU (NUOVE) ====================
function toggleMenuModal() {
    const modal = document.getElementById('top-menu-modal');
    if (!modal) return;
    
    modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function closeMenuModal(event = null) {
    const modal = document.getElementById('top-menu-modal');
    if (!modal) return;
    
    // Se c'è un evento, controlla che non sia stato cliccato sul contenuto del modal
    if (event && event.target.classList.contains('menu-modal-content')) {
        return;
    }
    
    modal.style.display = 'none';
}

function openCreditsScreen() {
    closeMenuModal();
    showScreen('credits-screen');
}

function openReportScreen() {
    closeMenuModal();
    showScreen('segnalazioni-screen');
}

function openQRModal() {
    closeMenuModal();
    
    const modal = document.getElementById('qr-modal');
    const container = document.getElementById('qrcode-container');
    
    if (modal && container) {
        container.innerHTML = '';
        new QRCode(container, {
            text: 'https://derolu0.github.io/aeterna/',
            width: 200,
            height: 200,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.H
        });
        modal.style.display = 'flex';
    }
}

function closeQRModal() {
    const modal = document.getElementById('qr-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function openAdminPanel() {
    closeMenuModal();
    document.getElementById('admin-panel').style.display = 'flex';
    switchAdminTab('admin-filosofi');
}

function closeAdminPanel() {
    document.getElementById('admin-panel').style.display = 'none';
}

function checkAdminAuth() {
    const email = document.getElementById('admin-email')?.value;
    const password = document.getElementById('admin-password')?.value;
    
    if (email && password) {
        closeAdminAuth();
        openAdminPanel();
    } else {
        const errorElement = document.getElementById('auth-error');
        if (errorElement) {
            errorElement.style.display = 'block';
        }
    }
}

function closeAdminAuth() {
    const authElement = document.getElementById('admin-auth');
    if (authElement) {
        authElement.style.display = 'none';
    }
}

function logoutAdmin() {
    closeAdminPanel();
}

// ==================== GESTIONE MAPPA ====================
window.goToMapLocation = function(lat, lng, nome) {
    console.log(`🗺️ Navigazione verso: ${nome} [${lat}, ${lng}]`);
    
    if (typeof showScreen === 'function') {
        showScreen('mappa-screen');
    } else {
        document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
        document.getElementById('mappa-screen').style.display = 'block';
    }

    setTimeout(() => {
        if (philosophicalMap) {
            philosophicalMap.flyTo([lat, lng], 8, {
                duration: 1.5
            });
        } else {
            initPhilosophicalMap();
            setTimeout(() => {
                if (philosophicalMap) {
                    philosophicalMap.flyTo([lat, lng], 8, {
                        duration: 1.5
                    });
                }
            }, 500);
        }
    }, 300);
};

// ==================== MAPPA GEOGRAFICA ====================
function initPhilosophicalMap() {
    if (!document.getElementById('map')) return;
    if (philosophicalMap) return;
    
    try {
        philosophicalMap = L.map('map').setView([41.8719, 12.5674], 3);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(philosophicalMap);
        
        updateMapWithPhilosophers();
    } catch (error) {
        console.error('Errore mappa:', error);
    }
}

function updateMapWithPhilosophers() {
    if (!philosophicalMap) return;
    
    // Rimuovi layer precedente se esiste
    if (markersLayer) {
        markersLayer.remove();
    }
    
    // Crea un nuovo layer
    markersLayer = L.layerGroup().addTo(philosophicalMap);
    
    filosofiData.forEach(filosofo => {
        if (filosofo.coordinate && filosofo.coordinate.lat && filosofo.coordinate.lng) {
            const { lat, lng } = filosofo.coordinate;
            
            // Scegli icona in base al periodo
            const iconColor = filosofo.periodo === 'contemporaneo' ? 'orange' : 'blue';
            const icon = L.divIcon({
                html: `<div style="background-color: ${iconColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                className: 'custom-marker',
                iconSize: [20, 20]
            });
            
            const marker = L.marker([lat, lng], { icon: icon })
                .addTo(markersLayer)
                .bindPopup(`
                    <b>${filosofo.nome}</b><br>
                    <small>${filosofo.scuola || ''}</small><br>
                    <small>${filosofo.anni || ''}</small><br>
                    <button onclick="showFilosofoDetail('${filosofo.id}')" style="margin-top: 5px; padding: 3px 8px; background: #3b82f6; color: white; border: none; border-radius: 3px; cursor: pointer;">
                        Vedi dettagli
                    </button>
                `);
            
            marker.on('click', () => {
                // Il popup si apre automaticamente
            });
        }
    });
}

// ==================== MAPPA CONCETTUALE ====================
function initConceptMap() {
    const container = document.getElementById('concept-network');
    if (!container) return;

    try {
        // Prepara nodi e collegamenti
        const nodes = new vis.DataSet();
        const edges = new vis.DataSet();
        
        // Aggiungi filosofi come nodi
        filosofiData.forEach(f => {
            nodes.add({
                id: f.id,
                label: f.nome.split(' ')[0], // Solo nome
                group: f.periodo,
                title: `${f.nome}\n${f.scuola || ''}`,
                value: 15,
                shape: 'dot'
            });
        });
        
        // Aggiungi concetti come nodi
        concettiData.forEach(c => {
            nodes.add({
                id: 'C_' + c.id,
                label: c.parola,
                group: 'concetto',
                title: `${c.parola}\n${c.definizione ? (c.definizione.substring(0, 100) + '...') : ''}`,
                value: 10,
                shape: 'diamond'
            });
        });
        
        // Crea collegamenti: filosofi -> loro concetti principali
        filosofiData.forEach(filosofo => {
            if (filosofo.concetti_principali) {
                filosofo.concetti_principali.forEach(concettoNome => {
                    const concetto = concettiData.find(c => c.parola === concettoNome);
                    if (concetto) {
                        edges.add({
                            from: filosofo.id,
                            to: 'C_' + concetto.id,
                            arrows: 'to',
                            color: { color: filosofo.periodo === 'contemporaneo' ? '#f59e0b' : '#10b981' }
                        });
                    }
                });
            }
        });
        
        // Crea collegamenti: concetti -> autori di riferimento
        concettiData.forEach(concetto => {
            if (concetto.autore_riferimento) {
                const autoriIds = concetto.autore_riferimento.split(',');
                autoriIds.forEach(autoreId => {
                    const id = autoreId.trim();
                    if (filosofiData.find(f => f.id === id)) {
                        edges.add({
                            from: 'C_' + concetto.id,
                            to: id,
                            arrows: 'to',
                            color: { color: '#8b5cf6' }
                        });
                    }
                });
            }
        });
        
        // Configurazione
        const data = { nodes: nodes, edges: edges };
        const options = {
            nodes: {
                shape: 'dot',
                font: { size: 14, color: '#1f2937', face: 'Inter' },
                borderWidth: 2,
                size: 20
            },
            edges: {
                width: 2,
                smooth: true
            },
            groups: {
                classico: { 
                    color: { background: '#10b981', border: '#059669' },
                    font: { color: '#ffffff' }
                },
                contemporaneo: { 
                    color: { background: '#f59e0b', border: '#d97706' },
                    font: { color: '#ffffff' }
                },
                concetto: { 
                    color: { background: '#8b5cf6', border: '#7c3aed' },
                    font: { color: '#ffffff' },
                    shape: 'diamond'
                }
            },
            physics: {
                enabled: true,
                stabilization: {
                    iterations: 100,
                    updateInterval: 50
                },
                barnesHut: {
                    gravitationalConstant: -2000,
                    springConstant: 0.04,
                    springLength: 150,
                    damping: 0.09
                }
            },
            interaction: { 
                hover: true, 
                tooltipDelay: 200,
                navigationButtons: true,
                keyboard: true
            }
        };

        // Crea la rete
        if (networkInstance) {
            networkInstance.destroy();
        }
        networkInstance = new vis.Network(container, data, options);
        
        // Eventi
        networkInstance.on("click", function (params) {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                
                if (nodeId.startsWith('C_')) {
                    // È un concetto
                    const concettoId = nodeId.substring(2);
                    showConcettoDetail(concettoId);
                } else {
                    // È un filosofo
                    showFilosofoDetail(nodeId);
                }
            }
        });
        
        console.log("✅ Mappa concettuale generata con", nodes.length, "nodi e", edges.length, "collegamenti");
        
    } catch (error) {
        console.error("❌ Errore generazione mappa concettuale:", error);
        container.innerHTML = '<p style="color:red; text-align:center; padding: 20px;">Errore nella visualizzazione della mappa concettuale.</p>';
    }
}

// ==================== ANALISI COMPARATIVA ====================
function openComparativeAnalysis(termine) {
    const modal = document.getElementById('comparative-analysis-modal');
    if (!modal) {
        showToast('Analisi non disponibile', 'info');
        return;
    }
    
    document.getElementById('comparative-term-title').textContent = termine.toUpperCase();
    
    // Trova il concetto
    const concetto = concettiData.find(c => c.parola === termine);
    if (!concetto) {
        document.getElementById('evolution-timeline').innerHTML = '<p>Concetto non trovato per l\'analisi</p>';
        return;
    }
    
    // Aggiorna la timeline
    updateEvolutionTimeline(concetto);
    
    // Aggiorna testi comparativi
    updateComparativeTexts(concetto);
    
    // Aggiorna trasformazioni
    updateTransformationsTable(concetto);
    
    modal.style.display = 'flex';
}

function closeComparativeModal() {
    const modal = document.getElementById('comparative-analysis-modal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function updateEvolutionTimeline(concetto) {
    const timelineContainer = document.getElementById('evolution-timeline');
    
    // Crea timeline semplice
    timelineContainer.innerHTML = `
        <div class="timeline-container">
            <div class="timeline-track">
                <div class="timeline-item period-classico" style="left: 20%;">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-year">Periodo Classico</div>
                        <div class="timeline-concept">${concetto.parola}</div>
                        <div class="timeline-excerpt">"${getClassicalDefinition(concetto.parola)}"</div>
                    </div>
                </div>
                <div class="timeline-item period-contemporaneo" style="left: 80%;">
                    <div class="timeline-dot"></div>
                    <div class="timeline-content">
                        <div class="timeline-year">Periodo Contemporaneo</div>
                        <div class="timeline-concept">${concetto.parola}</div>
                        <div class="timeline-excerpt">"${getContemporaryDefinition(concetto.parola)}"</div>
                    </div>
                </div>
            </div>
            <div class="timeline-scale">
                <span>Antichità</span>
                <span>Medioevo</span>
                <span>Modernità</span>
                <span>Contemporaneità</span>
            </div>
        </div>
    `;
}

function updateComparativeTexts(concetto) {
    console.log(`📖 Caricamento testi per: ${concetto.parola}`);
    
    // Usa i dati da comparative-data.js
    if (window.comparativeData && window.comparativeData.testiComparativi) {
        const concettoNome = concetto.parola;
        const dati = window.comparativeData.testiComparativi[concettoNome];
        
        if (dati) {
            // Testo classico
            document.getElementById('classical-original-text').textContent = 
                dati.classico.testo || "Testo classico non disponibile";
            document.getElementById('classical-definition').textContent = 
                dati.classico.definizione || "Definizione classica non disponibile";
            
            // Testo contemporaneo
            document.getElementById('contemporary-original-text').textContent = 
                dati.contemporaneo.testo || "Testo contemporaneo non disponibile";
            document.getElementById('contemporary-definition').textContent = 
                dati.contemporaneo.definizione || "Definizione contemporanea non disponibile";
            
            console.log(`✅ Testi caricati da comparative-data.js per: ${concettoNome}`);
            
            // Aggiorna anche le metriche
            updateMetrics(dati.classico.testo, dati.contemporaneo.testo);
            return;
        }
    }
    
    // FALLBACK: Se non trova i dati
    const testiFallback = {
        'Essere': {
            classico: {
                testo: "L'essere si dice in molti modi. Tra questi, il primo e principale è la sostanza, che è ciò che esiste di per sé.",
                definizione: "Sostanza statica ed eterna, fondamento della realtà."
            },
            contemporaneo: {
                testo: "L'essere non è un ente, ma ciò che si dà nell'evento. La questione dell'essere è stata dimenticata dalla metafisica.",
                definizione: "Evento storico e processuale che si dà nella temporalità."
            }
        },
        'Verità': {
            classico: {
                testo: "Veritas est adaequatio rei et intellectus. La verità è la corrispondenza della cosa con l'intelletto.",
                definizione: "Corrispondenza oggettiva tra pensiero e realtà."
            },
            contemporaneo: {
                testo: "Non ci sono fatti, solo interpretazioni. La verità è quella specie di errore senza la quale una determinata specie di esseri viventi non potrebbe vivere.",
                definizione: "Costruzione storica e interpretativa, non corrispondenza oggettiva."
            }
        }
    };
    
    const concettoNome = concetto.parola;
    const datiFallback = testiFallback[concettoNome] || {
        classico: {
            testo: `Testo originale classico per "${concettoNome}"`,
            definizione: `Definizione canonica classica per "${concettoNome}"`
        },
        contemporaneo: {
            testo: `Testo originale contemporaneo per "${concettoNome}"`,
            definizione: `Definizione canonica contemporanea per "${concettoNome}"`
        }
    };
    
    document.getElementById('classical-original-text').textContent = datiFallback.classico.testo;
    document.getElementById('classical-definition').textContent = datiFallback.classico.definizione;
    document.getElementById('contemporary-original-text').textContent = datiFallback.contemporaneo.testo;
    document.getElementById('contemporary-definition').textContent = datiFallback.contemporaneo.definizione;
    
    console.log(`⚠️ Usati dati di fallback per: ${concettoNome}`);
    updateMetrics(datiFallback.classico.testo, datiFallback.contemporaneo.testo);
}

function updateTransformationsTable(concetto) {
    const tableBody = document.getElementById('transformations-body');
    if (!tableBody) return;
    
    // Ottieni trasformazioni da comparativeData
    const trasformazioni = window.comparativeData?.trasformazioni?.[concetto.parola] || [
        "Trasformazione ontologica: da sostanza statica a evento dinamico",
        "Trasformazione epistemologica: da oggetto di conoscenza a interpretazione",
        "Trasformazione etica: da fondamento assoluto a costruzione storica"
    ];
    
    const aspetti = ['Ontologica', 'Epistemologica', 'Etica', 'Politica'];
    
    tableBody.innerHTML = trasformazioni.map((trasformazione, index) => {
        const aspetto = aspetti[index] || 'Generale';
        
        return `
            <tr>
                <td><strong>${aspetto}</strong></td>
                <td>${trasformazione}</td>
                <td>
                    <span class="badge ${
                        index % 3 === 0 ? 'badge-classico' : 
                        index % 3 === 1 ? 'badge-transizione' : 'badge-contemporaneo'
                    }">
                        ${index % 3 === 0 ? 'IV sec. a.C.' : 
                          index % 3 === 1 ? 'XIX sec.' : 'XX sec.'}
                    </span>
                </td>
            </tr>
        `;
    }).join('');
}

function updateMetrics(testoClassico, testoContemporaneo) {
    // Analisi semplice
    const paroleClassico = testoClassico.split(' ').length;
    const paroleContemporaneo = testoContemporaneo.split(' ').length;
    
    // Aggiorna metriche classiche
    document.getElementById('classical-metrics').innerHTML = `
        <div class="metric-item">
            <span class="metric-label">Parole:</span>
            <span class="metric-value">${paroleClassico}</span>
        </div>
        <div class="metric-item">
            <span class="metric-label">Complessità:</span>
            <span class="metric-value">${paroleClassico > 50 ? 'alta' : 'media'}</span>
        </div>
        <div class="metric-item">
            <span class="metric-label">Struttura:</span>
            <span class="metric-value">sistematica</span>
        </div>
    `;
    
    // Aggiorna metriche contemporanee
    document.getElementById('contemporary-metrics').innerHTML = `
        <div class="metric-item">
            <span class="metric-label">Parole:</span>
            <span class="metric-value">${paroleContemporaneo}</span>
        </div>
        <div class="metric-item">
            <span class="metric-label">Complessità:</span>
            <span class="metric-value">${paroleContemporaneo > 60 ? 'molto alta' : 'alta'}</span>
        </div>
        <div class="metric-item">
            <span class="metric-label">Struttura:</span>
            <span class="metric-value">ermeneutica</span>
        </div>
    `;
}

// Funzioni per definizioni brevi
function getClassicalDefinition(concetto) {
    const defs = {
        'Essere': 'Sostanza statica ed eterna',
        'Verità': 'Corrispondenza tra pensiero e realtà',
        'Soggetto': 'Sostanza pensante autonoma',
        'Bene': 'Idea trascendente e oggettiva',
        'Potere': 'Diritto sovrano di vita e di morte',
        'Libertà': 'Autonomia della volontà razionale'
    };
    return defs[concetto] || 'Definizione classica';
}

function getContemporaryDefinition(concetto) {
    const defs = {
        'Essere': 'Evento storico e processuale',
        'Verità': 'Costruzione discorsiva e interpretativa',
        'Soggetto': 'Effetto di pratiche discorsive',
        'Bene': 'Relazione etica con l\'altro',
        'Potere': 'Rete diffusa e produttiva',
        'Libertà': 'Condizione esistenziale e progetto'
    };
    return defs[concetto] || 'Definizione contemporanea';
}

// ==================== UTILITY ====================
function generateMapButton(filosofo) {
    if (filosofo.coordinate && 
        typeof filosofo.coordinate.lat !== 'undefined' && 
        typeof filosofo.coordinate.lng !== 'undefined') {
        
        return `
            <button class="action-btn map-btn" 
                onclick="goToMapLocation(${filosofo.coordinate.lat}, ${filosofo.coordinate.lng}, '${filosofo.nome.replace(/'/g, "\\'")}')">
                <i class="fas fa-map-marker-alt"></i> Vedi Luogo
            </button>
        `;
    }
    return '<button class="action-btn disabled" disabled><i class="fas fa-map-slash"></i> Luogo non disponibile</button>';
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('#filosofi-screen .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if ((filter === 'all' && btn.classList.contains('all')) || 
            (filter === 'classico' && btn.classList.contains('funzionante')) ||
            (filter === 'contemporaneo' && btn.classList.contains('non-funzionante'))) {
            btn.classList.add('active');
        }
    });
    renderFilosofiList();
}

function searchFilosofi(query) {
    const term = query.toLowerCase();
    const items = document.querySelectorAll('#filosofi-list .grid-item');
    items.forEach(item => {
        const name = item.querySelector('.item-name').textContent.toLowerCase();
        item.style.display = name.includes(term) ? 'flex' : 'none';
    });
}

function searchOpere(query) {
    const term = query.toLowerCase();
    const items = document.querySelectorAll('#opere-list .compact-item');
    items.forEach(item => {
        const title = item.querySelector('.compact-item-name').textContent.toLowerCase();
        item.style.display = title.includes(term) ? 'flex' : 'none';
    });
}

function getPeriodoLabel(periodo) {
    const labels = {
        'classico': 'Classico/Antico',
        'medioevale': 'Medioevale',
        'rinascimentale': 'Rinascimentale',
        'moderno': 'Moderno',
        'contemporaneo': 'Contemporaneo',
        'entrambi': 'Transperiodale'
    };
    return labels[periodo] || periodo;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

function loadScreenData(screenId) {
    if (screenId === 'mappa-screen') {
        setTimeout(initPhilosophicalMap, 200);
    } else if (screenId === 'mappa-concettuale-screen') {
        setTimeout(initConceptMap, 200);
    }
}

function checkMaintenanceMode() {
    const maintenance = localStorage.getItem('maintenance_mode');
    const element = document.getElementById('maintenance-mode');
    if (element) {
        element.style.display = maintenance === 'true' ? 'flex' : 'none';
    }
}

// ==================== PWA ====================
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
        banner.style.display = 'flex';
        console.log("📲 Banner PWA attivato");
    }
});

async function installPWA() {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Esito installazione: ${outcome}`);
    
    deferredPrompt = null;
    
    const banner = document.getElementById('pwa-install-banner');
    if(banner) banner.style.display = 'none';
}

// ==================== ESPORTAZIONE DATI ====================
function exportFilosofiToExcel() {
    exportToCSV('filosofi', filosofiData);
}

function exportOpereToExcel() {
    exportToCSV('opere', opereData);
}

function exportConcettiToExcel() {
    exportToCSV('concetti', concettiData);
}

async function exportFullDataset() {
    showToast("Preparazione export completo...", "info");
    exportToCSV('filosofi', filosofiData);
    setTimeout(() => exportToCSV('opere', opereData), 1000);
    setTimeout(() => exportToCSV('concetti', concettiData), 2000);
}

function exportToCSV(filename, data) {
    if (!data || data.length === 0) {
        showToast(`Nessun dato da esportare per ${filename}`, "warning");
        return;
    }

    try {
        const headers = Object.keys(data[0]);
        const csvRows = [];
        csvRows.push(headers.join(','));

        for (const row of data) {
            const values = headers.map(header => {
                const val = row[header] !== undefined ? '' + row[header] : '';
                const escaped = val.replace(/"/g, '\\"');
                return `"${escaped}"`;
            });
            csvRows.push(values.join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `aeterna_${filename}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showToast(`Export ${filename} completato`, "success");
    } catch (error) {
        console.error("Errore export:", error);
        showToast("Errore durante l'esportazione", "error");
    }
}

// ==================== FUNZIONI GLOBALI ====================
window.showScreen = showScreen;
window.goBack = goBack;
window.toggleMenuModal = toggleMenuModal;
window.closeMenuModal = closeMenuModal;
window.openCreditsScreen = openCreditsScreen;
window.openReportScreen = openReportScreen;
window.openQRModal = openQRModal;
window.closeQRModal = closeQRModal;
window.openAdminPanel = openAdminPanel;
window.closeAdminPanel = closeAdminPanel;
window.checkAdminAuth = checkAdminAuth;
window.closeAdminAuth = closeAdminAuth;
window.logoutAdmin = logoutAdmin;
window.installPWA = installPWA;
window.searchFilosofi = searchFilosofi;
window.searchOpere = searchOpere;
window.setFilter = setFilter;
window.showFilosofoDetail = showFilosofoDetail;
window.showOperaDetail = showOperaDetail;
window.showConcettoDetail = showConcettoDetail;
window.openComparativeAnalysis = openComparativeAnalysis;
window.closeComparativeModal = closeComparativeModal;
window.goToMapLocation = goToMapLocation;
window.initConceptMap = initConceptMap;
window.exportFilosofiToExcel = exportFilosofiToExcel;
window.exportOpereToExcel = exportOpereToExcel;
window.exportConcettiToExcel = exportConcettiToExcel;
window.exportFullDataset = exportFullDataset;

// Funzioni admin placeholder (per compatibilità)
window.loadAdminFilosofi = window.loadAdminFilosofi || function(){ 
    console.log("Caricamento admin filosofi - dati già integrati");
};
window.loadAdminOpere = window.loadAdminOpere || function(){
    console.log("Caricamento admin opere - dati già integrati");
};
window.loadAdminConcetti = window.loadAdminConcetti || function(){
    console.log("Caricamento admin concetti - dati già integrati");
};

// ==================== FIX AUTOMATICO PER TAB BAR ====================
function fixTabBarSpacing() {
    // Per tutte le schermate tranne la home
    document.querySelectorAll('.screen:not(#home-screen)').forEach(screen => {
        const contentArea = screen.querySelector('.content-area, .detail-content');
        if (contentArea) {
            contentArea.style.paddingBottom = '80px';
        }
    });
    console.log('✅ Spazio per tab bar aggiunto');
}

// Esegui il fix dopo il caricamento
document.addEventListener('DOMContentLoaded', fixTabBarSpacing);

// Intercetta la funzione showScreen per applicare il fix dopo ogni cambio schermata
const originalShowScreen = window.showScreen;
window.showScreen = function(screenId) {
    originalShowScreen(screenId);
    // Dopo aver cambiato schermata, applica il fix
    setTimeout(fixTabBarSpacing, 100);
};

// ==================== DEBUG E VERIFICA ====================

// Debug: verifica caricamento dati analisi comparativa
console.log("🔍 ANALISI CARICAMENTO DATI:");
console.log("comparativeData caricato?", !!window.comparativeData);
if (window.comparativeData) {
    console.log("Concetti disponibili:", Object.keys(window.comparativeData.testiComparativi || {}));
    
    // Test di funzionamento per un concetto specifico
    if (window.comparativeData.testiComparativi && window.comparativeData.testiComparativi['Essere']) {
        console.log("✅ Dati per 'Essere' presenti:", {
            autoreClassico: window.comparativeData.testiComparativi['Essere'].classico.autore,
            autoreContemporaneo: window.comparativeData.testiComparativi['Essere'].contemporaneo.autore
        });
    }
}

// ==================== FINE APP.JS ====================

console.log('📚 Aeterna Lexicon App.js v4.0.0 - DATASET COMPLETO INTEGRATO - READY');