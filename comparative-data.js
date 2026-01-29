/**
 * DATI PER ANALISI COMPARATIVA
 */

window.comparativeData = {
    // Testi per analisi linguistica comparativa
    testiComparativi: {
        'Essere': {
            classico: {
                autore: "Aristotele",
                opera: "Metafisica",
                testo: "L'essere si dice in molti modi, ma soprattutto in quattro: secondo le categorie, secondo la potenza e l'atto, secondo l'accidente, e secondo il vero e il falso. Tra tutti questi modi, il primo e principale è la sostanza, poiché tutto il resto si dice in riferimento ad essa.",
                caratteristiche: {
                    lunghezza: "media",
                    complessità: "alta",
                    termini_astratti: ["essere", "sostanza", "potenza", "atto", "categorie"],
                    struttura: "sistematica"
                }
            },
            contemporaneo: {
                autore: "Martin Heidegger",
                opera: "Essere e tempo",
                testo: "L'essere non è un ente. La questione dell'essere è stata dimenticata dalla metafisica. L'essere si dà nell'evento appropriante, nella Lichtung, nel disvelamento. L'essere non è, ma dà sé. La differenza ontologica tra essere ed ente è fondamentale.",
                caratteristiche: {
                    lunghezza: "media",
                    complessità: "molto alta",
                    termini_astratti: ["essere", "ente", "evento", "disvelamento", "differenza"],
                    struttura: "ermeneutica"
                }
            }
        },
        'Verità': {
            classico: {
                autore: "Tommaso d'Aquino",
                opera: "De Veritate",
                testo: "Veritas est adaequatio rei et intellectus. La verità è la corrispondenza della cosa con l'intelletto. Questa adeguazione si realizza quando l'intelletto conosce la cosa così come essa è in se stessa.",
                caratteristiche: {
                    lunghezza: "breve",
                    complessità: "media",
                    termini_astratti: ["verità", "adeguazione", "cosa", "intelletto", "corrispondenza"],
                    struttura: "definitoria"
                }
            },
            contemporaneo: {
                autore: "Friedrich Nietzsche",
                opera: "Al di là del bene e del male",
                testo: "Non ci sono fatti, solo interpretazioni. La verità è quella specie di errore senza la quale una determinata specie di esseri viventi non potrebbe vivere. Ciò che in un caso è verità, nell'altro è menzogna.",
                caratteristiche: {
                    lunghezza: "breve",
                    complessità: "alta",
                    termini_astratti: ["verità", "interpretazioni", "errore", "menzogna", "fatti"],
                    struttura: "aforistica"
                }
            }
        }
    },
    
    // Trasformazioni concettuali
    trasformazioni: {
        'Essere': [
            "Da sostanza statica a evento dinamico",
            "Da concetto univoco a differenza ontologica",
            "Da oggetto di conoscenza a questione ermeneutica",
            "Da fondamento metafisico a dono/storia"
        ],
        'Verità': [
            "Da corrispondenza a costruzione",
            "Da oggettività a interpretazione",
            "Da certezza a probabilità",
            "Da assoluto a storico"
        ],
        'Soggetto': [
            "Da sostanza pensante a effetto discorsivo",
            "Da autonomia a costruzione sociale",
            "Da unità a molteplicità",
            "Da fondamento a posizione linguistica"
        ]
    }
};