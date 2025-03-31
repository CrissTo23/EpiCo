// Gestione degli esercizi interattivi

// Variabili globali
let exercises = [];
let currentExercise = null;
let completedExercises = {};
let editor;
let currentLanguage = 'python';
let pyodideReady = false;

// Carica Pyodide all'avvio
async function loadPyodide() {
    try {
        console.log('Caricamento di Pyodide...');
        window.pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.21.3/full/"
        });
        console.log('Pyodide caricato con successo!');
        pyodideReady = true;
    } catch (error) {
        console.error('Errore nel caricamento di Pyodide:', error);
    }
}

// Carica gli esercizi dal file JSON
async function loadExercises() {
    try {
        // Sostituisci con il percorso corretto per la materia
        const response = await fetch('/data/exercises/programming_exercises.json');
        const data = await response.json();
        exercises = data.exercises;
        
        // Carica gli esercizi completati dal localStorage
        loadCompletedExercises();
        
        // Visualizza gli esercizi
        displayExercises();
    } catch (error) {
        console.error('Errore nel caricamento degli esercizi:', error);
        document.getElementById('exercises-container').innerHTML = 
            '<div class="error-message">Errore nel caricamento degli esercizi. Riprova più tardi.</div>';
    }
}

// Carica gli esercizi completati dal localStorage
function loadCompletedExercises() {
    completedExercises = JSON.parse(localStorage.getItem('completedExercises')) || {};
}

// Salva un esercizio completato
function saveCompletedExercise(exerciseId) {
    completedExercises[exerciseId] = {
        completed: true,
        completedAt: new Date().toISOString()
    };
    localStorage.setItem('completedExercises', JSON.stringify(completedExercises));
    
    // Aggiorna la visualizzazione
    document.querySelector(`.exercise-card[data-id="${exerciseId}"]`)?.classList.add('completed');
}

// Filtra gli esercizi in base ai criteri selezionati
function filterExercises() {
    const difficultyFilter = document.getElementById('difficulty-filter').value;
    const lessonFilter = document.getElementById('lesson-filter').value;
    const statusFilter = document.getElementById('status-filter').value;
    const searchText = document.getElementById('search-exercises').value.toLowerCase();
    
    return exercises.filter(exercise => {
        // Filtro per difficoltà
        if (difficultyFilter !== 'all' && exercise.difficulty !== difficultyFilter) {
            return false;
        }
        
        // Filtro per lezione
        if (lessonFilter !== 'all' && !exercise.relatedLessons.includes(lessonFilter)) {
            return false;
        }
        
        // Filtro per stato
        if (statusFilter === 'completed' && !completedExercises[exercise.id]) {
            return false;
        }
        if (statusFilter === 'uncompleted' && completedExercises[exercise.id]) {
            return false;
        }
        
        // Filtro per testo di ricerca
        if (searchText && !exercise.title.toLowerCase().includes(searchText) && 
            !exercise.description.toLowerCase().includes(searchText)) {
            return false;
        }
        
        return true;
    });
}

// Visualizza gli esercizi filtrati
function displayExercises() {
    const filteredExercises = filterExercises();
    const container = document.getElementById('exercises-container');
    
    if (filteredExercises.length === 0) {
        container.innerHTML = '<div class="no-exercises">Nessun esercizio corrisponde ai filtri selezionati.</div>';
        return;
    }
    
    let html = '';
    filteredExercises.forEach(exercise => {
        const isCompleted = completedExercises[exercise.id];
        
        html += `
        <div class="exercise-card ${isCompleted ? 'completed' : ''}" data-id="${exercise.id}">
            <div class="exercise-header">
                <h3 class="exercise-title">${exercise.title}</h3>
                <span class="exercise-difficulty ${exercise.difficulty}">${exercise.difficulty}</span>
            </div>
            <div class="exercise-description">${exercise.description}</div>
            <div class="exercise-footer">
                <span class="exercise-related">
                    <i class="fas fa-book"></i> Lezioni correlate: ${exercise.relatedLessons.map(lesson => `Lezione ${lesson.replace('lezione', '')}`).join(', ')}
                </span>
                <button class="start-exercise-btn" data-id="${exercise.id}">
                    ${isCompleted ? '<i class="fas fa-redo"></i> Riprova' : '<i class="fas fa-play"></i> Inizia'}
                </button>
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Aggiungi gli event listener ai pulsanti
    document.querySelectorAll('.start-exercise-btn').forEach(button => {
        button.addEventListener('click', function() {
            const exerciseId = this.getAttribute('data-id');
            openExercise(exerciseId);
        });
    });
}

// Apre l'esercizio selezionato nell'editor
function openExercise(exerciseId) {
    currentExercise = exercises.find(ex => ex.id === exerciseId);
    
    if (!currentExercise) {
        console.error(`Esercizio con ID ${exerciseId} non trovato.`);
        return;
    }
    
    // Nascondi la lista degli esercizi e mostra l'editor
    document.getElementById('exercises-container').style.display = 'none';
    document.getElementById('code-editor-container').style.display = 'block';
    
    // Imposta il titolo e la descrizione
    document.getElementById('exercise-title').textContent = currentExercise.title;
    document.getElementById('exercise-description').textContent = currentExercise.description;
    
    // Imposta il suggerimento
    document.getElementById('hint-content').textContent = currentExercise.languages[currentLanguage].hint;
    
    // Inizializza o aggiorna l'editor
    if (!editor) {
        initializeEditor();
    }
    
    // Imposta il codice di partenza per il linguaggio corrente
    editor.setValue(currentExercise.languages[currentLanguage].startingCode, -1);
    
    // Nascondi il feedback
    document.getElementById('feedback-panel').style.display = 'none';
    
    // Resetta l'output
    document.getElementById('code-output').textContent = '> Esegui il codice per vedere l\'output qui';
}

// Inizializza l'editor di codice
function initializeEditor() {
    editor = ace.edit("code-editor");
    editor.setTheme("ace/theme/monokai");
    editor.session.setMode("ace/mode/python"); // Default
    editor.setFontSize(14);
    
    // Configura l'editor
    editor.setOptions({
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showPrintMargin: false,
        highlightActiveLine: true
    });
    
    // Event listeners per i pulsanti dell'editor
    document.getElementById('close-editor').addEventListener('click', closeEditor);
    document.getElementById('reset-code').addEventListener('click', resetCode);
    document.getElementById('run-code').addEventListener('click', runCode);
    document.getElementById('submit-solution').addEventListener('click', submitSolution);
    document.getElementById('show-hint').addEventListener('click', toggleHint);
    document.getElementById('clear-output').addEventListener('click', clearOutput);
    
    // Event listeners per i selettori di linguaggio
    document.querySelectorAll('.language-btn').forEach(button => {
        button.addEventListener('click', function() {
            changeLanguage(this.getAttribute('data-lang'));
        });
    });
}

// Chiudi l'editor e torna alla lista degli esercizi
function closeEditor() {
    document.getElementById('code-editor-container').style.display = 'none';
    document.getElementById('exercises-container').style.display = 'block';
}

// Reimposta il codice all'inizio
function resetCode() {
    if (currentExercise && currentExercise.languages[currentLanguage]) {
        editor.setValue(currentExercise.languages[currentLanguage].startingCode, -1);
    }
}

// Esegui il codice
async function runCode() {
    const code = editor.getValue();
    const outputElement = document.getElementById('code-output');
    outputElement.textContent = '> Esecuzione in corso...';
    
    try {
        let output = '';
        
        if (currentLanguage === 'python') {
            if (!pyodideReady) {
                outputElement.textContent = '> Pyodide non è ancora pronto. Attendi qualche istante...';
                return;
            }
            
            try {
                // Reindirizza l'output di print
                window.pyodide.runPython(`
                    import sys
                    import io
                    sys.stdout = io.StringIO()
                `);
                
                // Esegui il codice
                window.pyodide.runPython(code);
                
                // Recupera l'output
                output = window.pyodide.runPython("sys.stdout.getvalue()");
                
                // Ripristina stdout
                window.pyodide.runPython("sys.stdout = sys.__stdout__");
            } catch (err) {
                output = `Errore nell'esecuzione: ${err.message}`;
            }
        } else if (currentLanguage === 'javascript') {
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
        }
        
        outputElement.textContent = `> ${output || "Nessun output generato"}`;
    } catch (error) {
        outputElement.textContent = `> Errore: ${error.message}`;
    }
}

// Funzione per eseguire codice Python (usata nei test)
async function runPythonCode(code) {
    if (!pyodideReady) {
        return 'Pyodide non pronto';
    }
    
    try {
        // Reindirizza l'output di print
        window.pyodide.runPython(`
            import sys
            import io
            sys.stdout = io.StringIO()
        `);
        
        // Esegui il codice
        window.pyodide.runPython(code);
        
        // Recupera l'output
        const output = window.pyodide.runPython("sys.stdout.getvalue()");
        
        // Ripristina stdout
        window.pyodide.runPython("sys.stdout = sys.__stdout__");
        
        return output;
    } catch (err) {
        return `Errore: ${err.message}`;
    }
}

// Verifica la soluzione
async function submitSolution() {
    const code = editor.getValue();
    const feedbackPanel = document.getElementById('feedback-panel');
    
    try {
        // Esegui la funzione di test specifica dell'esercizio
        const testFunction = new Function('code', 'language', 'runPythonCode', currentExercise.testCode);
        const isCorrect = await testFunction(code, currentLanguage, runPythonCode);
        
        if (isCorrect) {
            feedbackPanel.innerHTML = `
                <div class="success-feedback">
                    <i class="fas fa-check-circle"></i>
                    <div class="feedback-text">
                        <h3>Soluzione corretta!</h3>
                        <p>Ottimo lavoro! Hai risolto correttamente l'esercizio.</p>
                    </div>
                </div>
            `;
            
            // Salva l'esercizio come completato
            saveCompletedExercise(currentExercise.id);
        } else {
            feedbackPanel.innerHTML = `
                <div class="error-feedback">
                    <i class="fas fa-times-circle"></i>
                    <div class="feedback-text">
                        <h3>Non ancora corretto</h3>
                        <p>La tua soluzione non passa tutti i test. Ricontrolla e riprova.</p>
                    </div>
                </div>
            `;
        }
        
        feedbackPanel.style.display = 'block';
    } catch (error) {
        feedbackPanel.innerHTML = `
            <div class="error-feedback">
                <i class="fas fa-exclamation-triangle"></i>
                <div class="feedback-text">
                    <h3>Errore durante la verifica</h3>
                    <p>${error.message}</p>
                </div>
            </div>
        `;
        feedbackPanel.style.display = 'block';
    }
}

// Mostra/nascondi il suggerimento
function toggleHint() {
    const hintContent = document.getElementById('hint-content');
    const hintButton = document.getElementById('show-hint');
    
    if (hintContent.classList.contains('visible')) {
        hintContent.classList.remove('visible');
        hintButton.textContent = 'Mostra suggerimento';
    } else {
        hintContent.classList.add('visible');
        hintButton.textContent = 'Nascondi suggerimento';
    }
}

// Cambia il linguaggio di programmazione
function changeLanguage(language) {
    if (currentLanguage === language) return;
    
    // Aggiorna il pulsante attivo
    document.querySelectorAll('.language-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === language);
    });
    
    // Aggiorna il linguaggio corrente
    currentLanguage = language;
    
    // Cambia la modalità dell'editor
    editor.session.setMode(`ace/mode/${language}`);
    
    // Carica il codice template per il nuovo linguaggio
    if (currentExercise && currentExercise.languages[language]) {
        editor.setValue(currentExercise.languages[language].startingCode, -1);
        
        // Aggiorna il suggerimento
        document.getElementById('hint-content').textContent = 
            currentExercise.languages[language].hint || 'Nessun suggerimento disponibile';
    }
    
    // Resetta feedback e output
    document.getElementById('feedback-panel').style.display = 'none';
    clearOutput();
}

// Pulisci l'output
function clearOutput() {
    document.getElementById('code-output').textContent = '> Esegui il codice per vedere l\'output qui';
}

// Inizializzazione della pagina
document.addEventListener('DOMContentLoaded', function() {
    // Carica Pyodide
    loadPyodide();
    
    // Carica gli esercizi
    loadExercises();
    
    // Event listeners per i filtri
    document.getElementById('difficulty-filter').addEventListener('change', displayExercises);
    document.getElementById('lesson-filter').addEventListener('change', displayExercises);
    document.getElementById('status-filter').addEventListener('change', displayExercises);
    
    // Event listener per la ricerca
    document.getElementById('search-exercises').addEventListener('input', debounce(displayExercises, 300));
});

// Funzione per debounce (ritarda l'esecuzione di una funzione)
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(function() {
            func.apply(context, args);
        }, wait);
    };
}