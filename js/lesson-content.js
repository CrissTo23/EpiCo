// Gestione dei contenuti specifici delle lezioni (glossario ed esercizi)

// Variabili globali
let lessonGlossary = [];
let lessonExercises = [];

// Funzione per ottenere i metadati della lezione corrente
function getCurrentLessonInfo() {
    const path = window.location.pathname;
    const matches = path.match(/\/materie\/([^\/]+)\/lezione(\d+)\.html/);
    
    if (!matches) return null;
    
    return {
        course: matches[1],
        lessonNumber: parseInt(matches[2]),
        lessonId: `lezione${matches[2]}`
    };
}

// Carica il glossario della lezione
async function loadLessonGlossary() {
    const lessonInfo = getCurrentLessonInfo();
    if (!lessonInfo) return;
    
    const glossaryTab = document.getElementById('glossary-tab');
    if (!glossaryTab) return;
    
    try {
        const response = await fetch(`/data/glossary/${lessonInfo.course}_${lessonInfo.lessonId}_glossary.json`);
        if (!response.ok) {
            throw new Error('Glossario non disponibile');
        }
        
        const data = await response.json();
        lessonGlossary = data.terms;
        renderLessonGlossary(data);
    } catch (error) {
        console.error('Errore nel caricamento del glossario della lezione:', error);
        glossaryTab.innerHTML = `
            <div class="lesson-glossary">
                <h2>Glossario: ${document.querySelector('h1').textContent}</h2>
                <div class="error-message">Il glossario per questa lezione non è ancora disponibile.</div>
                <div class="glossary-navigation">
                    <a href="/materie/${lessonInfo.course}/glossario.html" class="btn-view-all">Visualizza glossario completo</a>
                </div>
            </div>
        `;
    }
}

// Renderizza il glossario della lezione
function renderLessonGlossary(data) {
    const glossaryTab = document.getElementById('glossary-tab');
    if (!glossaryTab) return;
    
    // Costruisci il contenuto HTML
    let html = `
        <div class="lesson-glossary">
            <h2>Glossario: ${data.lesson.title}</h2>
    `;
    
    if (!data.terms || data.terms.length === 0) {
        html += '<div class="empty-state">Nessun termine nel glossario per questa lezione.</div>';
    } else {
        html += '<div class="glossary-items">';
        
        data.terms.forEach(term => {
            html += `
                <div class="glossary-item">
                    <h3>${term.term}</h3>
                    <p>${term.definition}</p>
                </div>
            `;
        });
        
        html += '</div>';
    }
    
    html += `
        <div class="glossary-navigation">
            <a href="/materie/${data.lesson.course}/glossario.html" class="btn-view-all">Visualizza glossario completo</a>
        </div>
    </div>
    `;
    
    glossaryTab.innerHTML = html;
}

// Carica gli esercizi della lezione
async function loadLessonExercises() {
    const lessonInfo = getCurrentLessonInfo();
    if (!lessonInfo) return;
    
    const exercisesTab = document.getElementById('exercises-tab');
    if (!exercisesTab) return;
    
    try {
        const response = await fetch(`/data/exercises/${lessonInfo.course}_${lessonInfo.lessonId}_exercises.json`);
        if (!response.ok) {
            throw new Error('Esercizi non disponibili');
        }
        
        const data = await response.json();
        lessonExercises = data.exercises;
        renderLessonExercises(data);
    } catch (error) {
        console.error('Errore nel caricamento degli esercizi della lezione:', error);
        exercisesTab.innerHTML = `
            <div class="lesson-exercises">
                <h2>Esercizi: ${document.querySelector('h1').textContent}</h2>
                <div class="error-message">Gli esercizi per questa lezione non sono ancora disponibili.</div>
                <div class="exercises-navigation">
                    <a href="/materie/${lessonInfo.course}/esercizi.html" class="btn-view-all">Visualizza tutti gli esercizi</a>
                </div>
            </div>
        `;
    }
}

// Renderizza gli esercizi della lezione
function renderLessonExercises(data) {
    const exercisesTab = document.getElementById('exercises-tab');
    if (!exercisesTab) return;
    
    // Costruisci il contenuto HTML
    let html = `
        <div class="lesson-exercises">
            <h2>Esercizi: ${data.lesson.title}</h2>
    `;
    
    if (!data.exercises || data.exercises.length === 0) {
        html += '<div class="empty-state">Nessun esercizio disponibile per questa lezione.</div>';
    } else {
        data.exercises.forEach((exercise, index) => {
            html += `
                <div class="exercise-item">
                    <h3>Esercizio ${index + 1}: ${exercise.title}</h3>
                    <p>${exercise.description}</p>
                    <div class="code-editor-container" 
                         data-challenge-title="${exercise.title}" 
                         data-challenge-description="${exercise.description}" 
                         data-python-code="${exercise.languages.python.startingCode.replace(/"/g, '&quot;')}"
                         ${exercise.languages.javascript ? `data-js-code="${exercise.languages.javascript.startingCode.replace(/"/g, '&quot;')}"` : ''}
                         ${exercise.languages.java ? `data-java-code="${exercise.languages.java.startingCode.replace(/"/g, '&quot;')}"` : ''}>
                        <div class="code-editor-header">
                            <div class="code-editor-title">Editor di Codice</div>
                            <div class="code-editor-languages">
                                <button class="language-selector active" data-lang="python">Python</button>
                                ${exercise.languages.javascript ? '<button class="language-selector" data-lang="javascript">JavaScript</button>' : ''}
                                ${exercise.languages.java ? '<button class="language-selector" data-lang="java">Java</button>' : ''}
                            </div>
                        </div>
                        <div class="code-editor-wrapper" id="editor-${exercise.id}">
                            <div class="editor"></div>
                        </div>
                        <div class="code-editor-controls">
                            <div class="code-editor-buttons">
                                <button class="reset-code">Reset</button>
                                <button class="run-code">Esegui</button>
                                <button class="submit-solution">Verifica</button>
                            </div>
                            <button class="hint-button">Mostra suggerimento</button>
                        </div>
                        <div class="hint-content">
                            ${exercise.languages.python.hint || 'Nessun suggerimento disponibile.'}
                        </div>
                        <div class="output-container">
                            > Esegui il codice per vedere l'output qui
                        </div>
                        <div class="feedback-message"></div>
                    </div>
                </div>
            `;
        });
    }
    
    html += `
        <div class="exercises-navigation">
            <a href="/materie/${data.lesson.course}/esercizi.html" class="btn-view-all">Visualizza tutti gli esercizi</a>
        </div>
    </div>
    `;
    
    exercisesTab.innerHTML = html;
    
    // Inizializza gli editor dopo aver renderizzato gli esercizi
    if (typeof initializeEditors === 'function') {
        setTimeout(() => {
            initializeEditors();
        }, 100);
    }
}

// Inizializzazione al caricamento della pagina
document.addEventListener('DOMContentLoaded', function() {
    // Carica glossario e esercizi
    loadLessonGlossary();
    loadLessonExercises();
    
    // Gestione dei tab
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Attiva il pulsante corrente
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Mostra il contenuto corretto
            tabContents.forEach(content => {
                if (content.id === tabName + '-tab') {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });
});