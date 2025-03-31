// Editor di Codice - Funzionalità

// Variabili globali
let editor;
let currentLanguage = 'python';
let challenges = {};
let originalCode = {};

// Inizializzazione al caricamento della pagina
document.addEventListener('DOMContentLoaded', function() {
    initializeEditors();
});

// Funzione per inizializzare tutti gli editor nella pagina
function initializeEditors() {
    const editorContainers = document.querySelectorAll('.code-editor-container');
    
    editorContainers.forEach((container, index) => {
        const editorId = container.querySelector('.code-editor-wrapper').id || `editor-container-${index}`;
        const editorElement = container.querySelector('.code-editor-wrapper').firstElementChild;
        
        // Inizializza editor Ace
        const editorInstance = ace.edit(editorElement);
        editorInstance.setTheme("ace/theme/monokai");
        editorInstance.session.setMode("ace/mode/python"); // Default
        
        // Memorizza il codice originale per ogni linguaggio
        const pythonCode = container.getAttribute('data-python-code') || getDefaultCode('python');
        const jsCode = container.getAttribute('data-js-code') || getDefaultCode('javascript');
        const javaCode = container.getAttribute('data-java-code') || getDefaultCode('java');
        
        originalCode[editorId] = {
            'python': pythonCode,
            'javascript': jsCode,
            'java': javaCode
        };
        
        // Imposta il codice iniziale
        editorInstance.setValue(pythonCode, -1);
        
        // Memorizza la sfida associata
        challenges[editorId] = {
            title: container.getAttribute('data-challenge-title') || 'Esercizio',
            description: container.getAttribute('data-challenge-description') || 'Risolvi l\'esercizio seguente',
            testFunction: container.getAttribute('data-test-function') || ''
        };
        
        // Configura i listener per questo editor
        setupEventListeners(container, editorInstance, editorId);
    });
    
    // Carica Pyodide se necessario
    loadPyodide();
}

// Funzione per ottenere codice predefinito per linguaggi
function getDefaultCode(language) {
    switch(language) {
        case 'python':
            return `# Scrivi qui il tuo codice Python\n\ndef main():\n    print("Hello, World!")\n\nmain()`;
        case 'javascript':
            return `// Scrivi qui il tuo codice JavaScript\n\nfunction main() {\n    console.log("Hello, World!");\n}\n\nmain();`;
        case 'java':
            return `// Scrivi qui il tuo codice Java\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}`;
        default:
            return `# Scrivi il tuo codice qui`;
    }
}

// Configurazione dei listener per eventi
function setupEventListeners(container, editorInstance, editorId) {
    // Gestione cambio lingua
    container.querySelectorAll('.language-selector').forEach(button => {
        button.addEventListener('click', function() {
            const lang = this.getAttribute('data-lang');
            
            // Aggiorna UI
            container.querySelectorAll('.language-selector').forEach(btn => {
                btn.classList.remove('active');
            });
            this.classList.add('active');
            
            // Cambia modalità editor
            editorInstance.session.setMode(`ace/mode/${lang}`);
            
            // Carica codice template per il linguaggio
            editorInstance.setValue(originalCode[editorId][lang], -1);
            
            // Aggiorna linguaggio corrente
            currentLanguage = lang;
        });
    });
    
    // Pulsante reset
    container.querySelector('.reset-code').addEventListener('click', function() {
        editorInstance.setValue(originalCode[editorId][currentLanguage], -1);
    });
    
    // Pulsante esegui
    container.querySelector('.run-code').addEventListener('click', async function() {
        const outputContainer = container.querySelector('.output-container');
        outputContainer.textContent = '> Esecuzione in corso...';
        
        executeCode(editorInstance.getValue(), currentLanguage, outputContainer);
    });
    
    // Pulsante verifica soluzione
    container.querySelector('.submit-solution').addEventListener('click', function() {
        const code = editorInstance.getValue();
        const feedbackElement = container.querySelector('.feedback-message');
        
        verifyCode(code, currentLanguage, challenges[editorId], feedbackElement, editorId);
    });
    
    // Pulsante suggerimento
    const hintButton = container.querySelector('.hint-button');
    if (hintButton) {
        hintButton.addEventListener('click', function() {
            const hintContent = container.querySelector('.hint-content');
            if (hintContent.classList.contains('visible')) {
                hintContent.classList.remove('visible');
                this.textContent = 'Mostra suggerimento';
            } else {
                hintContent.classList.add('visible');
                this.textContent = 'Nascondi suggerimento';
            }
        });
    }
}

// Caricamento di Pyodide (per Python)
async function loadPyodide() {
    if (typeof window.pyodide === 'undefined') {
        console.log('Loading Pyodide...');
        try {
            window.pyodide = await loadPyodide({
                indexURL: "https://cdn.jsdelivr.net/pyodide/v0.21.3/full/"
            });
            console.log('Pyodide loaded successfully!');
        } catch (error) {
            console.error('Failed to load Pyodide:', error);
        }
    }
}

// Esecuzione del codice
async function executeCode(code, language, outputElement) {
    try {
        let output = '';
        
        if (language === 'python') {
            if (typeof window.pyodide === 'undefined') {
                output = 'Pyodide non è stato caricato. Riprova tra qualche istante.';
            } else {
                try {
                    // Reindirizza l'output di print
                    window.pyodide.runPython(`
                        import sys
                        import io
                        sys.stdout = io.StringIO()
                    `);
                    
                    // Esegui codice
                    window.pyodide.runPython(code);
                    
                    // Recupera output
                    output = window.pyodide.runPython("sys.stdout.getvalue()");
                    
                    // Ripristina stdout
                    window.pyodide.runPython("sys.stdout = sys.__stdout__");
                } catch (err) {
                    output = `Errore nell'esecuzione: ${err.message}`;
                }
            }
        } else if (language === 'javascript') {
            // Cattura console.log per JavaScript
            const originalLog = console.log;
            const logs = [];
            
            console.log = function() {
                logs.push(Array.from(arguments).join(' '));
                originalLog.apply(console, arguments);
            };
            
            try {
                eval(code);
                output = logs.join('\n');
            } catch (err) {
                output = `Errore nell'esecuzione: ${err.message}`;
            }
            
            // Ripristina console.log
            console.log = originalLog;
        } else if (language === 'java') {
            output = "Esecuzione Java non supportata direttamente nel browser.\nQuesta è solo una simulazione.";
        }
        
        outputElement.textContent = `> ${output || "Nessun output generato"}`;
    } catch (error) {
        outputElement.textContent = `> Errore: ${error.message}`;
    }
}

// Verifica del codice
async function verifyCode(code, language, challenge, feedbackElement, editorId) {
    feedbackElement.className = 'feedback-message';
    
    try {
        let isCorrect = false;
        
        // Se c'è una funzione di test personalizzata, usa quella
        if (challenge.testFunction) {
            try {
                // Converte la stringa in funzione
                const testFunc = new Function('code', 'language', challenge.testFunction);
                isCorrect = await testFunc(code, language);
            } catch (err) {
                feedbackElement.textContent = `Errore nel test: ${err.message}`;
                feedbackElement.classList.add('error');
                return;
            }
        } else {
            // Verifica di base
            if (language === 'python') {
                try {
                    // Esecuzione del test di base per Python
                    isCorrect = basicPythonTest(code, challenge);
                } catch (err) {
                    feedbackElement.textContent = `Errore nel test: ${err.message}`;
                    feedbackElement.classList.add('error');
                    return;
                }
            } else if (language === 'javascript') {
                try {
                    // Esecuzione del test di base per JavaScript
                    isCorrect = basicJavaScriptTest(code, challenge);
                } catch (err) {
                    feedbackElement.textContent = `Errore nel test: ${err.message}`;
                    feedbackElement.classList.add('error');
                    return;
                }
            } else {
                feedbackElement.textContent = 'La verifica per questo linguaggio non è supportata.';
                feedbackElement.classList.add('error');
                return;
            }
        }
        
        if (isCorrect) {
            feedbackElement.textContent = 'Ottimo lavoro! La tua soluzione è corretta. ✅';
            feedbackElement.classList.add('success');
            
            // Salva progresso
            saveProgress(editorId, challenge.title);
        } else {
            feedbackElement.textContent = 'La tua soluzione non è ancora corretta. Ricontrolla e riprova. ❌';
            feedbackElement.classList.add('error');
        }
    } catch (error) {
        feedbackElement.textContent = `Errore: ${error.message}`;
        feedbackElement.classList.add('error');
    }
}

// Test base per Python
function basicPythonTest(code, challenge) {
    // Questa è solo una verifica generale
    // In un'implementazione reale si dovrebbero verificare funzioni specifiche
    return code.includes('print') && !code.includes('error');
}

// Test base per JavaScript
function basicJavaScriptTest(code, challenge) {
    // Questa è solo una verifica generale
    // In un'implementazione reale si dovrebbero verificare funzioni specifiche
    return code.includes('console.log') && !code.includes('error');
}

// Salvataggio progresso
function saveProgress(editorId, exerciseTitle) {
    const completedExercises = JSON.parse(localStorage.getItem('completedExercises')) || {};
    if (!completedExercises[editorId]) {
        completedExercises[editorId] = [];
    }
    
    if (!completedExercises[editorId].includes(exerciseTitle)) {
        completedExercises[editorId].push(exerciseTitle);
        localStorage.setItem('completedExercises', JSON.stringify(completedExercises));
        
        // Aggiorna progresso lezione
        const lessonId = window.location.pathname;
        const progressData = JSON.parse(localStorage.getItem('progressoLezioni')) || {};
        
        if (!progressData[lessonId] || progressData[lessonId].percentuale < 100) {
            const currentPercentage = progressData[lessonId]?.percentuale || 0;
            const newPercentage = Math.min(100, currentPercentage + 20);
            
            progressData[lessonId] = {
                percentuale: newPercentage,
                ultimoAccesso: new Date().toISOString()
            };
            
            localStorage.setItem('progressoLezioni', JSON.stringify(progressData));
            
            // Aggiorna interfaccia se esiste un indicatore di progresso
            const progressIndicator = document.querySelector('.progress-indicator');
            if (progressIndicator) {
                progressIndicator.style.width = `${newPercentage}%`;
            }
        }
    }
}