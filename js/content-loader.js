/**
 * Sistema di caricamento contenuti per EpiCo
 * 
 * Questo modulo gestisce il caricamento dei contenuti della piattaforma:
 * - Corsi e lezioni
 * - Glossari (per lezione e completi)
 * - Esercizi (per lezione e completi)
 */

// Dati globali
let coursesData = null;
let currentCourse = null;
let currentLesson = null;
let contentCache = {};

/**
 * Estrae informazioni dal percorso della pagina corrente
 * @returns {Object|null} Informazioni sul corso e la lezione, o null se non in una pagina di lezione
 */
function extractPageInfo() {
    const path = window.location.pathname;
    const courseMatch = path.match(/\/materie\/([^\/]+)/);
    
    if (!courseMatch) return null;
    
    const courseId = courseMatch[1];
    let lessonId = null;
    
    // Controlla se siamo in una pagina di lezione
    const lessonMatch = path.match(/\/materie\/[^\/]+\/lezione(\d+)\.html/);
    if (lessonMatch) {
        lessonId = `lezione${lessonMatch[1]}`;
    }
    
    return {
        courseId: courseId,
        lessonId: lessonId,
        isLesson: !!lessonId,
        isGlossary: path.includes('/glossario.html'),
        isExercises: path.includes('/esercizi.html')
    };
}

/**
 * Carica i dati dei corsi
 * @returns {Promise<Object>} Dati dei corsi caricati
 */
async function loadCoursesData() {
    // Controlla se i dati sono già in cache
    if (coursesData) return coursesData;
    
    // Controlla se i dati sono nella cache local storage (max 1 giorno)
    const cachedData = getCachedData('courses_data');
    if (cachedData) {
        coursesData = cachedData;
        return coursesData;
    }
    
    try {
        const response = await fetch('/data/courses.json');
        if (!response.ok) {
            throw new Error('Impossibile caricare i dati dei corsi');
        }
        
        const data = await response.json();
        coursesData = data.courses;
        
        // Salva in cache
        cacheData('courses_data', coursesData);
        
        return coursesData;
    } catch (error) {
        console.error('Errore nel caricamento dei dati dei corsi:', error);
        // Fallback a un array vuoto per evitare errori nelle chiamate successive
        return [];
    }
}

/**
 * Carica i dati di un corso specifico
 * @param {string} courseId ID del corso da caricare
 * @returns {Promise<Object>} Dati del corso
 */
async function loadCourseData(courseId) {
    const courses = await loadCoursesData();
    return courses.find(course => course.id === courseId) || null;
}

/**
 * Carica i dati di una lezione specifica
 * @param {string} courseId ID del corso
 * @param {string} lessonId ID della lezione
 * @returns {Promise<Object>} Dati della lezione
 */
async function loadLessonData(courseId, lessonId) {
    const course = await loadCourseData(courseId);
    if (!course) return null;
    
    return course.lessons.find(lesson => lesson.id === lessonId) || null;
}

/**
 * Carica il glossario di una lezione specifica
 * @param {string} courseId ID del corso
 * @param {string} lessonId ID della lezione
 * @returns {Promise<Object>} Dati del glossario della lezione
 */
async function loadLessonGlossary(courseId, lessonId) {
    const cacheKey = `glossary_${courseId}_${lessonId}`;
    
    // Controlla se i dati sono già in cache
    if (contentCache[cacheKey]) {
        return contentCache[cacheKey];
    }
    
    // Controlla se i dati sono nella cache local storage
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
        contentCache[cacheKey] = cachedData;
        return cachedData;
    }
    
    try {
        const response = await fetch(`/data/glossary/${courseId}_${lessonId}_glossary.json`);
        if (!response.ok) {
            throw new Error(`Impossibile caricare il glossario per ${courseId} - ${lessonId}`);
        }
        
        const data = await response.json();
        
        // Salva in cache
        contentCache[cacheKey] = data;
        cacheData(cacheKey, data);
        
        return data;
    } catch (error) {
        console.error(`Errore nel caricamento del glossario per ${courseId} - ${lessonId}:`, error);
        return null;
    }
}

/**
 * Carica il glossario completo di un corso
 * @param {string} courseId ID del corso
 * @returns {Promise<Object>} Dati del glossario completo
 */
async function loadCourseGlossary(courseId) {
    const cacheKey = `glossary_${courseId}_complete`;
    
    // Controlla se i dati sono già in cache
    if (contentCache[cacheKey]) {
        return contentCache[cacheKey];
    }
    
    // Controlla se i dati sono nella cache local storage
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
        contentCache[cacheKey] = cachedData;
        return cachedData;
    }
    
    try {
        const response = await fetch(`/data/glossary/${courseId}_complete_glossary.json`);
        if (!response.ok) {
            throw new Error(`Impossibile caricare il glossario completo per ${courseId}`);
        }
        
        const data = await response.json();
        
        // Salva in cache
        contentCache[cacheKey] = data;
        cacheData(cacheKey, data);
        
        return data;
    } catch (error) {
        console.error(`Errore nel caricamento del glossario completo per ${courseId}:`, error);
        return null;
    }
}

/**
 * Carica gli esercizi di una lezione specifica
 * @param {string} courseId ID del corso
 * @param {string} lessonId ID della lezione
 * @returns {Promise<Object>} Dati degli esercizi della lezione
 */
async function loadLessonExercises(courseId, lessonId) {
    const cacheKey = `exercises_${courseId}_${lessonId}`;
    
    // Controlla se i dati sono già in cache
    if (contentCache[cacheKey]) {
        return contentCache[cacheKey];
    }
    
    // Controlla se i dati sono nella cache local storage
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
        contentCache[cacheKey] = cachedData;
        return cachedData;
    }
    
    try {
        const response = await fetch(`/data/exercises/${courseId}_${lessonId}_exercises.json`);
        if (!response.ok) {
            throw new Error(`Impossibile caricare gli esercizi per ${courseId} - ${lessonId}`);
        }
        
        const data = await response.json();
        
        // Salva in cache
        contentCache[cacheKey] = data;
        cacheData(cacheKey, data);
        
        return data;
    } catch (error) {
        console.error(`Errore nel caricamento degli esercizi per ${courseId} - ${lessonId}:`, error);
        return null;
    }
}

/**
 * Carica gli esercizi completi di un corso
 * @param {string} courseId ID del corso
 * @returns {Promise<Object>} Dati degli esercizi completi
 */
async function loadCourseExercises(courseId) {
    const cacheKey = `exercises_${courseId}_complete`;
    
    // Controlla se i dati sono già in cache
    if (contentCache[cacheKey]) {
        return contentCache[cacheKey];
    }
    
    // Controlla se i dati sono nella cache local storage
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
        contentCache[cacheKey] = cachedData;
        return cachedData;
    }
    
    try {
        const response = await fetch(`/data/exercises/${courseId}_complete_exercises.json`);
        if (!response.ok) {
            throw new Error(`Impossibile caricare gli esercizi completi per ${courseId}`);
        }
        
        const data = await response.json();
        
        // Salva in cache
        contentCache[cacheKey] = data;
        cacheData(cacheKey, data);
        
        return data;
    } catch (error) {
        console.error(`Errore nel caricamento degli esercizi completi per ${courseId}:`, error);
        return null;
    }
}

/**
 * Carica tutti i dati per una lezione (contenuto, glossario, esercizi)
 * @param {string} courseId ID del corso
 * @param {string} lessonId ID della lezione
 * @returns {Promise<Object>} Tutti i dati della lezione
 */
async function loadLessonBundle(courseId, lessonId) {
    // Carica in parallelo i dati della lezione, il glossario e gli esercizi
    const [lesson, glossary, exercises] = await Promise.all([
        loadLessonData(courseId, lessonId),
        loadLessonGlossary(courseId, lessonId),
        loadLessonExercises(courseId, lessonId)
    ]);
    
    return {
        lesson: lesson,
        glossary: glossary,
        exercises: exercises
    };
}

/**
 * Inizializza la pagina corrente in base al percorso
 */
async function initCurrentPage() {
    // Estrai informazioni dalla pagina corrente
    const pageInfo = extractPageInfo();
    if (!pageInfo) return;
    
    // Carica i dati di base
    const course = await loadCourseData(pageInfo.courseId);
    currentCourse = course;
    
    // Se siamo in una pagina di lezione
    if (pageInfo.isLesson && pageInfo.lessonId) {
        const lesson = course.lessons.find(l => l.id === pageInfo.lessonId);
        currentLesson = lesson;
        
        // Inizializza i tab della lezione, se presenti
        initLessonTabs(pageInfo.courseId, pageInfo.lessonId);
        
        // Precarica la lezione successiva in background
        prefetchNextLesson(pageInfo.courseId, pageInfo.lessonId);
    }
    
    // Se siamo nella pagina del glossario del corso
    if (pageInfo.isGlossary && !pageInfo.isLesson) {
        initCourseGlossary(pageInfo.courseId);
    }
    
    // Se siamo nella pagina degli esercizi del corso
    if (pageInfo.isExercises && !pageInfo.isLesson) {
        initCourseExercises(pageInfo.courseId);
    }
}

/**
 * Inizializza i tab della lezione (contenuto, glossario, esercizi)
 * @param {string} courseId ID del corso
 * @param {string} lessonId ID della lezione 
 */
async function initLessonTabs(courseId, lessonId) {
    // Verifica l'esistenza dei tab nella pagina
    const tabButtons = document.querySelectorAll('.tab-btn');
    if (!tabButtons || tabButtons.length === 0) return;
    
    // Carica in background il glossario e gli esercizi della lezione
    loadLessonGlossary(courseId, lessonId).then(glossaryData => {
        if (glossaryData) {
            renderLessonGlossary(glossaryData);
        }
    });
    
    loadLessonExercises(courseId, lessonId).then(exercisesData => {
        if (exercisesData) {
            renderLessonExercises(exercisesData);
        }
    });
    
    // Gestione dei click sui tab
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // Cambia l'active tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // Mostra il contenuto del tab selezionato
            document.querySelectorAll('.tab-content').forEach(content => {
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });
}

/**
 * Renderizza il glossario di una lezione nel tab corrispondente
 * @param {Object} glossaryData Dati del glossario
 */
function renderLessonGlossary(glossaryData) {
    const glossaryTab = document.getElementById('glossary-tab');
    if (!glossaryTab) return;
    
    // Sostituisci il messaggio di caricamento con il contenuto effettivo
    let html = `
        <div class="lesson-glossary">
            <h2>${glossaryData.title}</h2>
    `;
    
    if (!glossaryData.terms || glossaryData.terms.length === 0) {
        html += `<div class="empty-state">Nessun termine nel glossario per questa lezione.</div>`;
    } else {
        html += `<div class="glossary-items">`;
        
        glossaryData.terms.forEach(term => {
            html += `
                <div class="glossary-item">
                    <h3>${term.term}</h3>
                    <p>${term.definition}</p>
                </div>
            `;
        });
        
        html += `</div>`;
    }
    
    html += `
        <div class="glossary-navigation">
            <a href="/materie/${glossaryData.courseId}/glossario.html" class="btn-view-all">Visualizza glossario completo</a>
        </div>
    </div>
    `;
    
    glossaryTab.innerHTML = html;
}

/**
 * Renderizza gli esercizi di una lezione nel tab corrispondente
 * @param {Object} exercisesData Dati degli esercizi
 */
function renderLessonExercises(exercisesData) {
    const exercisesTab = document.getElementById('exercises-tab');
    if (!exercisesTab) return;
    
    // Sostituisci il messaggio di caricamento con il contenuto effettivo
    let html = `
        <div class="lesson-exercises">
            <h2>${exercisesData.title}</h2>
    `;
    
    if (!exercisesData.exercises || exercisesData.exercises.length === 0) {
        html += `<div class="empty-state">Nessun esercizio disponibile per questa lezione.</div>`;
    } else {
        exercisesData.exercises.forEach((exercise, index) => {
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
            <a href="/materie/${exercisesData.courseId}/esercizi.html" class="btn-view-all">Visualizza tutti gli esercizi</a>
        </div>
    </div>
    `;
    
    exercisesTab.innerHTML = html;
    
    // Inizializza gli editor di codice
    if (typeof initializeEditors === 'function') {
        setTimeout(() => {
            initializeEditors();
        }, 100);
    }
}

/**
 * Inizializza la pagina del glossario completo del corso
 * @param {string} courseId ID del corso
 */
async function initCourseGlossary(courseId) {
    const glossaryContainer = document.getElementById('glossary-container');
    if (!glossaryContainer) return;
    
    // Mostra un indicatore di caricamento
    glossaryContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i> Caricamento del glossario in corso...
        </div>
    `;
    
    // Carica il glossario completo
    const glossaryData = await loadCourseGlossary(courseId);
    if (!glossaryData) {
        glossaryContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Si è verificato un errore nel caricamento del glossario. Riprova più tardi.</p>
            </div>
        `;
        return;
    }
    
    // Renderizza il glossario
    renderCourseGlossary(glossaryData, glossaryContainer);
}

/**
 * Renderizza il glossario completo di un corso
 * @param {Object} glossaryData Dati del glossario
 * @param {HTMLElement} container Elemento HTML dove renderizzare il glossario
 */
function renderCourseGlossary(glossaryData, container) {
    // Organizza i termini per lettera iniziale
    const termsByLetter = {};
    
    glossaryData.terms.forEach(term => {
        const firstLetter = term.term.charAt(0).toUpperCase();
        if (!termsByLetter[firstLetter]) {
            termsByLetter[firstLetter] = [];
        }
        termsByLetter[firstLetter].push(term);
    });
    
    // Crea indice alfabetico
    let html = '<div class="alphabet-index">';
    
    for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        if (termsByLetter[letter]) {
            html += `<a href="#letter-${letter}" class="letter-link">${letter}</a>`;
        } else {
            html += `<span class="letter-disabled">${letter}</span>`;
        }
    }
    
    html += '</div>';
    
    // Aggiungi ricerca
    html += `
    <div class="glossary-search">
        <input type="text" id="glossary-search-input" placeholder="Cerca nel glossario...">
        <button id="glossary-search-btn"><i class="fas fa-search"></i></button>
    </div>`;
    
    // Aggiungi i termini organizzati per lettera
    html += '<div class="glossary-terms">';
    
    Object.keys(termsByLetter).sort().forEach(letter => {
        html += `<div class="letter-section" id="letter-${letter}">
            <h2 class="letter-heading">${letter}</h2>
            <div class="terms-list">`;
        
        termsByLetter[letter].sort((a, b) => a.term.localeCompare(b.term)).forEach(term => {
            html += `
            <div class="glossary-term">
                <h3 class="term-title">${term.term}</h3>
                <div class="term-definition">${term.definition}</div>
                ${term.relatedLessons ? `
                <div class="term-related">Lezioni correlate: ${term.relatedLessons.map(lessonId => {
                    const lesson = currentCourse.lessons.find(l => l.id === lessonId);
                    return lesson ? `<a href="${lesson.path}">${lesson.title}</a>` : '';
                }).filter(Boolean).join(', ')}</div>` : ''}
            </div>`;
        });
        
        html += '</div></div>';
    });
    
    html += '</div>';
    
    container.innerHTML = html;
    
    // Aggiungi funzionalità di ricerca
    setupGlossarySearch(container);
}

/**
 * Configura la funzionalità di ricerca nel glossario
 * @param {HTMLElement} container Contenitore del glossario
 */
function setupGlossarySearch(container) {
    const searchInput = container.querySelector('#glossary-search-input');
    const searchBtn = container.querySelector('#glossary-search-btn');
    
    if (!searchInput || !searchBtn) return;
    
    // Cerca quando si preme il pulsante
    searchBtn.addEventListener('click', () => {
        searchGlossary(searchInput.value, container);
    });
    
    // Cerca quando si preme Enter
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            searchGlossary(searchInput.value, container);
        }
    });
}

/**
 * Esegue la ricerca nel glossario
 * @param {string} query Testo da cercare
 * @param {HTMLElement} container Contenitore del glossario
 */
function searchGlossary(query, container) {
    if (!query || query.trim() === '') {
        // Resetta la ricerca - mostra tutti i termini
        container.querySelectorAll('.glossary-term').forEach(term => {
            term.style.display = 'block';
        });
        container.querySelectorAll('.letter-section').forEach(section => {
            section.style.display = 'block';
        });
        
        // Nascondi il messaggio "nessun risultato"
        const searchResultMsg = container.querySelector('#search-results-message');
        if (searchResultMsg) {
            searchResultMsg.style.display = 'none';
        }
        return;
    }
    
    query = query.toLowerCase();
    let foundAny = false;
    
    // Nascondi tutte le sezioni
    container.querySelectorAll('.letter-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Filtra i termini
    container.querySelectorAll('.glossary-term').forEach(term => {
        const title = term.querySelector('.term-title').textContent.toLowerCase();
        const definition = term.querySelector('.term-definition').textContent.toLowerCase();
        
        if (title.includes(query) || definition.includes(query)) {
            term.style.display = 'block';
            term.closest('.letter-section').style.display = 'block';
            foundAny = true;
        } else {
            term.style.display = 'none';
        }
    });
    
    if (!foundAny) {
        // Mostra messaggio "nessun risultato"
        const searchResultMsg = container.querySelector('#search-results-message');
        if (searchResultMsg) {
            searchResultMsg.textContent = `Nessun risultato per "${query}"`;
            searchResultMsg.style.display = 'block';
        } else {
            const msg = document.createElement('div');
            msg.id = 'search-results-message';
            msg.className = 'empty-state';
            msg.textContent = `Nessun risultato per "${query}"`;
            container.querySelector('.glossary-terms').prepend(msg);
        }
    } else {
        // Nascondi messaggio "nessun risultato" se esiste
        const searchResultMsg = container.querySelector('#search-results-message');
        if (searchResultMsg) {
            searchResultMsg.style.display = 'none';
        }
    }
}

/**
 * Inizializza la pagina degli esercizi completi del corso
 * @param {string} courseId ID del corso
 */
async function initCourseExercises(courseId) {
    const exercisesContainer = document.getElementById('exercises-container');
    if (!exercisesContainer) return;
    
    // Mostra un indicatore di caricamento
    exercisesContainer.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i> Caricamento degli esercizi in corso...
        </div>
    `;
    
    // Carica gli esercizi completi
    const exercisesData = await loadCourseExercises(courseId);
    if (!exercisesData) {
        exercisesContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Si è verificato un errore nel caricamento degli esercizi. Riprova più tardi.</p>
            </div>
        `;
        return;
    }
    
    // Renderizza gli esercizi
    renderCourseExercises(exercisesData, exercisesContainer);
}

/**
 * Renderizza gli esercizi completi di un corso
 * @param {Object} exercisesData Dati degli esercizi
 * @param {HTMLElement} container Elemento HTML dove renderizzare gli esercizi
 */
function renderCourseExercises(exercisesData, container) {
    // Organizza gli esercizi per categoria
    const exercisesByCategory = {};
    
    if (exercisesData.categories) {
        exercisesData.categories.forEach(category => {
            exercisesByCategory[category.id] = {
                title: category.title,
                description: category.description,
                exercises: []
            };
        });
    }
    
    // Suddividi gli esercizi in categorie
    exercisesData.exercises.forEach(exercise => {
        if (exercise.category && exercisesByCategory[exercise.category]) {
            exercisesByCategory[exercise.category].exercises.push(exercise);
        } else {
            // Categoria di fallback per esercizi senza categoria
            if (!exercisesByCategory['uncategorized']) {
                exercisesByCategory['uncategorized'] = {
                    title: 'Altri Esercizi',
                    description: 'Esercizi vari',
                    exercises: []
                };
            }
            exercisesByCategory['uncategorized'].exercises.push(exercise);
        }
    });
    
    // Aggiungi filtri
    let html = `
    <div class="exercises-filters">
        <div class="filter-group">
            <label>Difficoltà:</label>
            <select id="difficulty-filter">
                <option value="all">Tutti</option>
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzato">Avanzato</option>
            </select>
        </div>
        
        <div class="filter-group">
            <label>Categoria:</label>
            <select id="category-filter">
                <option value="all">Tutte</option>
                ${Object.keys(exercisesByCategory).map(categoryId => 
                    `<option value="${categoryId}">${exercisesByCategory[categoryId].title}</option>`
                ).join('')}
            </select>
        </div>
        
        <div class="filter-group">
            <label>Lezione:</label>
            <select id="lesson-filter">
                <option value="all">Tutte</option>
                ${currentCourse.lessons.map(lesson => 
                    `<option value="${lesson.id}">${lesson.title}</option>`
                ).join('')}
            </select>
        </div>
        
        <div class="filter-group">
            <label>Stato:</label>
            <select id="status-filter">
                <option value="all">Tutti</option>
                <option value="completed">Completati</option>
                <option value="uncompleted">Da completare</option>
            </select>
        </div>
        
        <div class="filter-group search-group">
            <input type="text" id="search-exercises" placeholder="Cerca esercizi...">
        </div>
    </div>
    
    <div class="exercises-list" id="filtered-exercises">
    `;
    
    // Aggiungi gli esercizi per categoria
    Object.keys(exercisesByCategory).forEach(categoryId => {
        const category = exercisesByCategory[categoryId];
        
        html += `
        <div class="exercise-category" data-category="${categoryId}">
            <h3 class="category-title">${category.title}</h3>
            <p class="category-description">${category.description}</p>
            <div class="category-exercises">
        `;
        
        category.exercises.forEach(exercise => {
            // Recupera i dati della lezione correlata
            let lessonBadges = '';
            if (exercise.relatedLessons && exercise.relatedLessons.length > 0) {
                lessonBadges = `
                <span class="exercise-related">
                    <i class="fas fa-book"></i> Lezioni correlate: ${exercise.relatedLessons.map(lessonId => {
                        const lesson = currentCourse.lessons.find(l => l.id === lessonId);
                        return lesson ? `<a href="${lesson.path}" class="lesson-badge">${lesson.title}</a>` : '';
                    }).filter(Boolean).join(', ')}
                </span>`;
            }
            
            html += `
            <div class="exercise-card" data-id="${exercise.id}" data-difficulty="${exercise.difficulty}" data-lessons="${exercise.relatedLessons ? exercise.relatedLessons.join(' ') : ''}">
                <div class="exercise-header">
                    <h4 class="exercise-title">${exercise.title}</h4>
                    <span class="exercise-difficulty ${exercise.difficulty}">${exercise.difficulty}</span>
                </div>
                <div class="exercise-description">${exercise.description}</div>
                <div class="exercise-footer">
                    ${lessonBadges}
                    <button class="start-exercise-btn" data-id="${exercise.id}">
                        <i class="fas fa-play"></i> Inizia
                    </button>
                </div>
            </div>
            `;
        });
        
        html += `
            </div>
        </div>
        `;
    });
    
    html += `</div>`;
    
    container.innerHTML = html;
    
    // Inizializza i filtri
    setupExerciseFilters(container);
    
    // Inizializza i pulsanti degli esercizi
    setupExerciseButtons(container);
}

/**
 * Configura i filtri per gli esercizi
 * @param {HTMLElement} container Contenitore degli esercizi
 */
function setupExerciseFilters(container) {
    const difficultyFilter = container.querySelector('#difficulty-filter');
    const categoryFilter = container.querySelector('#category-filter');
    const lessonFilter = container.querySelector('#lesson-filter');
    const statusFilter = container.querySelector('#status-filter');
    const searchInput = container.querySelector('#search-exercises');
    
    const allFilters = [difficultyFilter, categoryFilter, lessonFilter, statusFilter];
    
    // Funzione per filtrare gli esercizi
    function filterExercises() {
        const difficulty = difficultyFilter.value;
        const category = categoryFilter.value;
        const lesson = lessonFilter.value;
        const status = statusFilter.value;
        const searchText = searchInput.value.toLowerCase();
        
        const completedExercises = JSON.parse(localStorage.getItem('completedExercises')) || {};
        
        container.querySelectorAll('.exercise-card').forEach(card => {
            const cardDifficulty = card.getAttribute('data-difficulty');
            const cardCategory = card.closest('.exercise-category').getAttribute('data-category');
            const cardLessons = card.getAttribute('data-lessons') ? card.getAttribute('data-lessons').split(' ') : [];
            const cardId = card.getAttribute('data-id');
            const isCompleted = completedExercises[cardId];
            const cardTitle = card.querySelector('.exercise-title').textContent.toLowerCase();
            const cardDescription = card.querySelector('.exercise-description').textContent.toLowerCase();
            
            let showCard = true;
            
            // Filtra per difficoltà
            if (difficulty !== 'all' && cardDifficulty !== difficulty) {
                showCard = false;
            }
            
            // Filtra per categoria
            if (category !== 'all' && cardCategory !== category) {
                showCard = false;
            }
            
            // Filtra per lezione
            if (lesson !== 'all' && !cardLessons.includes(lesson)) {
                showCard = false;
            }
            
            // Filtra per stato
            if (status === 'completed' && !isCompleted) {
                showCard = false;
            }
            if (status === 'uncompleted' && isCompleted) {
                showCard = false;
            }
            
            // Filtra per testo di ricerca
            if (searchText && !cardTitle.includes(searchText) && !cardDescription.includes(searchText)) {
                showCard = false;
            }
            
            // Mostra o nascondi la card
            card.style.display = showCard ? 'block' : 'none';
        });
        
        // Mostra o nascondi categorie vuote
        container.querySelectorAll('.exercise-category').forEach(category => {
            const visibleCards = category.querySelectorAll('.exercise-card[style="display: block"]').length;
            category.style.display = visibleCards > 0 ? 'block' : 'none';
        });
    }
    
    // Aggiungi event listener per ogni filtro
    allFilters.forEach(filter => {
        if (filter) {
            filter.addEventListener('change', filterExercises);
        }
    });
    
    // Aggiungi event listener per la ricerca con debounce
    if (searchInput) {
        searchInput.addEventListener('input', debounce(filterExercises, 300));
    }
    
    // Applica i filtri iniziali
    filterExercises();
}

/**
 * Configura i pulsanti degli esercizi
 * @param {HTMLElement} container Contenitore degli esercizi
 */
function setupExerciseButtons(container) {
    const startButtons = container.querySelectorAll('.start-exercise-btn');
    
    startButtons.forEach(button => {
        button.addEventListener('click', () => {
            const exerciseId = button.getAttribute('data-id');
            openExercise(exerciseId, container);
        });
    });
}

/**
 * Apre l'editor di un esercizio specifico
 * @param {string} exerciseId ID dell'esercizio
 * @param {HTMLElement} container Contenitore degli esercizi
 */
function openExercise(exerciseId, container) {
    // Implementazione specifica per l'apertura dell'esercizio
    // Questa funzione dovrebbe essere personalizzata in base alle tue esigenze
    console.log(`Apertura dell'esercizio ${exerciseId}`);
    
    // Esempio di implementazione: mostra un editor di codice per l'esercizio
    // Qui dovresti integrare con la tua logica specifica per l'editor di codice
}

/**
 * Precarica la lezione successiva per migliorare l'esperienza utente
 * @param {string} courseId ID del corso
 * @param {string} currentLessonId ID della lezione corrente
 */
function prefetchNextLesson(courseId, currentLessonId) {
    if (!currentCourse) return;
    
    // Trova l'indice della lezione corrente
    const lessonIndex = currentCourse.lessons.findIndex(lesson => lesson.id === currentLessonId);
    if (lessonIndex === -1 || lessonIndex >= currentCourse.lessons.length - 1) return;
    
    // Ottieni l'ID della lezione successiva
    const nextLesson = currentCourse.lessons[lessonIndex + 1];
    if (!nextLesson) return;
    
    // Precarica i dati della lezione successiva in background
    setTimeout(() => {
        loadLessonBundle(courseId, nextLesson.id).then(data => {
            console.log(`Precaricati i dati della lezione successiva: ${nextLesson.title}`);
        });
    }, 2000); // Ritardo di 2 secondi per dare priorità al caricamento della lezione corrente
}

/**
 * Salva i dati nella cache locale
 * @param {string} key Chiave della cache
 * @param {Object} data Dati da memorizzare
 */
function cacheData(key, data) {
    try {
        const cacheEntry = {
            timestamp: new Date().getTime(),
            data: data
        };
        localStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (error) {
        console.warn('Errore nel salvataggio dei dati in cache:', error);
    }
}

/**
 * Recupera i dati dalla cache locale
 * @param {string} key Chiave della cache
 * @returns {Object|null} Dati dalla cache o null se non presenti o scaduti
 */
function getCachedData(key) {
    try {
        const cachedEntry = localStorage.getItem(key);
        if (!cachedEntry) return null;
        
        const entry = JSON.parse(cachedEntry);
        const now = new Date().getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        
        // Verifica che i dati non siano più vecchi di un giorno
        if (now - entry.timestamp < oneDay) {
            return entry.data;
        }
        
        return null;
    } catch (error) {
        console.warn('Errore nel recupero dei dati dalla cache:', error);
        return null;
    }
}

/**
 * Funzione di debounce per limitare la frequenza di esecuzione di una funzione
 * @param {Function} func Funzione da eseguire
 * @param {number} wait Tempo di attesa in ms
 * @returns {Function} Funzione con debounce
 */
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

// Inizializza il modulo al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
    initCurrentPage();
});