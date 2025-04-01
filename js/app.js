// Registrazione del Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registrato con successo:', registration.scope);
            })
            .catch(error => {
                console.log('Registrazione ServiceWorker fallita:', error);
            });
    });
}

// Variabili globali
let corsiData = [];

// DOM Elements
const sidebar = document.getElementById('sidebar');
const toggleSidebarBtn = document.getElementById('toggleSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
const searchInput = document.querySelector('.search-input');

// Gestione della sidebar per dispositivi mobili
if (toggleSidebarBtn) {
    toggleSidebarBtn.addEventListener('click', () => {
        sidebar.classList.add('open');
    });
}

if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
}

// Chiudi la sidebar quando si fa clic all'esterno su dispositivi mobili
document.addEventListener('click', (event) => {
    const isMobile = window.innerWidth <= 768;
    const isClickInside = sidebar.contains(event.target) || 
                          (toggleSidebarBtn && toggleSidebarBtn.contains(event.target));
    
    if (isMobile && !isClickInside && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
    }
});

// Gestione dei dropdown nel menu
dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const parent = toggle.parentElement;
        
        // Chiudi tutti gli altri dropdown
        dropdownToggles.forEach(otherToggle => {
            if (otherToggle !== toggle) {
                otherToggle.parentElement.classList.remove('open');
            }
        });
        
        // Toggle del dropdown corrente
        parent.classList.toggle('open');
    });
});

// Funzioni per la ricerca
if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            cercaLezioni(searchInput.value);
        }
    });

    document.querySelector('.search-button')?.addEventListener('click', () => {
        cercaLezioni(searchInput.value);
    });
}

function cercaLezioni(query) {
    if (!query || query.trim() === '') return;
    
    // Memorizza la ricerca
    const ricercheRecenti = JSON.parse(localStorage.getItem('ricercheRecenti')) || [];
    if (!ricercheRecenti.includes(query)) {
        ricercheRecenti.unshift(query);
        if (ricercheRecenti.length > 5) ricercheRecenti.pop();
        localStorage.setItem('ricercheRecenti', JSON.stringify(ricercheRecenti));
    }
    
    // Reindirizza alla pagina di ricerca
    window.location.href = `/ricerca.html?q=${encodeURIComponent(query)}`;
}

// Funzione per caricare i dati dei corsi
async function loadCoursesData() {
    try {
        const response = await fetch('/data/courses.json');
        if (!response.ok) {
            throw new Error('Errore nel caricamento dei dati dei corsi');
        }
        const data = await response.json();
        corsiData = data.courses;
        return data.courses;
    } catch (error) {
        console.error('Errore nel caricamento dei dati:', error);
        return [];
    }
}

// Funzione per generare il menu laterale dinamicamente
function generateSidebar(courses) {
    const sidebarMenu = document.querySelector('.sidebar-menu ul');
    if (!sidebarMenu) return;
    
    // Svuota il menu corrente mantenendo la home
    const homeItem = sidebarMenu.querySelector('.menu-item:first-child');
    sidebarMenu.innerHTML = '';
    if (homeItem) sidebarMenu.appendChild(homeItem);
    
    // Aggiungi i corsi dinamicamente
    courses.forEach(course => {
        const isActive = window.location.pathname.includes(`/materie/${course.id}/`);
        const isOpen = isActive || false; // Apri il dropdown se siamo in una pagina del corso
        
        const li = document.createElement('li');
        li.className = `menu-item menu-dropdown ${isActive ? 'active' : ''} ${isOpen ? 'open' : ''}`;
        
        const a = document.createElement('a');
        a.href = "#";
        a.className = "dropdown-toggle";
        a.innerHTML = `<i class="${course.icon}"></i> ${course.title} <i class="fas fa-chevron-down"></i>`;
        
        const submenu = document.createElement('ul');
        submenu.className = "submenu";
        if (isOpen) submenu.style.maxHeight = "300px";
        
        // Aggiungi link al corso
        const overviewLi = document.createElement('li');
        overviewLi.innerHTML = `<a href="/materie/${course.id}/index.html">Panoramica</a>`;
        submenu.appendChild(overviewLi);
        
        // Aggiungi lezioni
        course.lessons.forEach(lesson => {
            const lessonLi = document.createElement('li');
            const isCurrentPage = window.location.pathname === lesson.path;
            if (isCurrentPage) lessonLi.className = 'active';
            lessonLi.innerHTML = `<a href="${lesson.path}">${lesson.title}</a>`;
            submenu.appendChild(lessonLi);
        });
        
        // Aggiungi link al glossario
        const glossaryLi = document.createElement('li');
        glossaryLi.innerHTML = `<a href="/materie/${course.id}/glossario.html"><i class="fas fa-book"></i> Glossario</a>`;
        submenu.appendChild(glossaryLi);
        
        // Aggiungi link agli esercizi
        const exercisesLi = document.createElement('li');
        exercisesLi.innerHTML = `<a href="/materie/${course.id}/esercizi.html"><i class="fas fa-laptop-code"></i> Esercizi Interattivi</a>`;
        submenu.appendChild(exercisesLi);
        
        li.appendChild(a);
        li.appendChild(submenu);
        sidebarMenu.appendChild(li);
    });
    
    // Aggiungi gli elementi fissi (preferiti, recenti, ecc.)
    const favoritesLi = document.createElement('li');
    favoritesLi.className = 'menu-item';
    favoritesLi.innerHTML = `<a href="/preferiti.html"><i class="fas fa-star"></i> Preferiti</a>`;
    sidebarMenu.appendChild(favoritesLi);
    
    const recentLi = document.createElement('li');
    recentLi.className = 'menu-item';
    recentLi.innerHTML = `<a href="/recenti.html"><i class="fas fa-history"></i> Recenti</a>`;
    sidebarMenu.appendChild(recentLi);
    
    // Reimposta i listener per i dropdown
    setupDropdownListeners();
}

// Funzione per migliorare la gestione dei dropdown nel menu
function setupDropdownListeners() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    
    dropdownToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const parent = toggle.parentElement;
            const submenu = parent.querySelector('.submenu');
            
            // Calcola l'altezza reale del sottomenu
            const submenuHeight = calculateSubmenuHeight(submenu);
            
            // Chiudi tutti gli altri dropdown
            dropdownToggles.forEach(otherToggle => {
                if (otherToggle !== toggle) {
                    const otherParent = otherToggle.parentElement;
                    otherParent.classList.remove('open');
                    const otherSubmenu = otherParent.querySelector('.submenu');
                    if (otherSubmenu) {
                        otherSubmenu.style.maxHeight = '0';
                    }
                }
            });
            
            // Toggle del dropdown corrente
            if (parent.classList.contains('open')) {
                parent.classList.remove('open');
                submenu.style.maxHeight = '0';
            } else {
                parent.classList.add('open');
                submenu.style.maxHeight = submenuHeight + 'px';
            }
        });
    });
    
    // Apri automaticamente il dropdown attivo
    const activeDropdown = document.querySelector('.menu-item.active.menu-dropdown');
    if (activeDropdown) {
        const submenu = activeDropdown.querySelector('.submenu');
        if (submenu) {
            const submenuHeight = calculateSubmenuHeight(submenu);
            activeDropdown.classList.add('open');
            submenu.style.maxHeight = submenuHeight + 'px';
        }
    }
}

// Funzione per calcolare l'altezza effettiva del sottomenu
function calculateSubmenuHeight(submenu) {
    if (!submenu) return 0;
    
    // Clona il sottomenu per misurarne l'altezza reale
    const clone = submenu.cloneNode(true);
    
    // Nascondi il clone ma permettigli di espandersi completamente per la misurazione
    clone.style.maxHeight = 'none';
    clone.style.opacity = '0';
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    
    // Aggiungi il clone al DOM per misurarlo
    document.body.appendChild(clone);
    const height = clone.scrollHeight;
    
    // Rimuovi il clone
    document.body.removeChild(clone);
    
    return height;
}

// Funzione per generare le card dei corsi nella homepage
function generateCourseCards(courses) {
    const categoryCardsContainer = document.querySelector('.category-cards');
    if (!categoryCardsContainer) return;
    
    // Svuota il container
    categoryCardsContainer.innerHTML = '';
    
    // Aggiungi le card dei corsi
    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'category-card';
        card.innerHTML = `
            <div class="category-icon"><i class="${course.icon}"></i></div>
            <h3>${course.title}</h3>
            <p>${course.description}</p>
            <a href="/materie/${course.id}/index.html" class="btn-explore">Esplora</a>
        `;
        categoryCardsContainer.appendChild(card);
    });
}

// Funzioni per salvare e gestire il progresso delle lezioni
function salvaProgresso(lezioneId, percentuale = 100) {
    const progressoLezioni = JSON.parse(localStorage.getItem('progressoLezioni')) || {};
    
    progressoLezioni[lezioneId] = {
        percentuale: percentuale,
        ultimoAccesso: new Date().toISOString()
    };
    
    localStorage.setItem('progressoLezioni', JSON.stringify(progressoLezioni));
    aggiornaInterfacciaProgresso();
}

function ottieniProgresso(lezioneId) {
    const progressoLezioni = JSON.parse(localStorage.getItem('progressoLezioni')) || {};
    return progressoLezioni[lezioneId] || { percentuale: 0, ultimoAccesso: null };
}

function aggiornaInterfacciaProgresso() {
    const progressoLezioni = JSON.parse(localStorage.getItem('progressoLezioni')) || {};
    
    // Aggiorna la visualizzazione del progresso nella pagina
    document.querySelectorAll('.lesson-item').forEach(item => {
        const link = item.querySelector('a');
        if (!link) return;
        
        const lezioneId = link.getAttribute('href');
        const progresso = progressoLezioni[lezioneId];
        
        if (progresso) {
            const progressBar = item.querySelector('.progress');
            if (progressBar) {
                progressBar.style.width = `${progresso.percentuale}%`;
            }
            
            // Aggiungi badge "completato" se 100%
            if (progresso.percentuale === 100) {
                if (!item.querySelector('.completed-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'completed-badge';
                    badge.innerHTML = '<i class="fas fa-check-circle"></i>';
                    item.appendChild(badge);
                }
            }
        }
    });
}

// Integrazione di app.js con content-loader.js
// Aggiungere questo codice alla fine di app.js dopo aver caricato content-loader.js

// Modifica funzione per visualizzare la lezione in base al nuovo sistema
function registraVisualizzazioneLezione() {
    // Ottieni l'URL corrente
    const currentPath = window.location.pathname;
    
    // Se siamo in una pagina di lezione
    if (currentPath.includes('/lezione')) {
        // Estrai informazioni corso e lezione
        const pathMatch = currentPath.match(/\/materie\/([^\/]+)\/lezione(\d+)\.html/);
        if (!pathMatch) return;
        
        const courseId = pathMatch[1];
        const lessonNumber = pathMatch[2];
        const lessonId = `lezione${lessonNumber}`;
        
        // Verifica se è una nuova visualizzazione o è già in progresso
        const progresso = ottieniProgresso(currentPath);
        
        // Se è una nuova visualizzazione o non ancora completata
        if (progresso.percentuale < 25) {
            salvaProgresso(currentPath, 25); // Inizia con il 25%
        }
        
        // Aggiungi alla lista recenti
        aggiungiARecenti(currentPath);
        
        // Monitora lo scroll per aggiornare il progresso
        const lessonContent = document.querySelector('.lesson-content');
        if (lessonContent) {
            window.addEventListener('scroll', () => {
                const windowHeight = window.innerHeight;
                const fullHeight = document.body.clientHeight;
                const scrolled = window.scrollY;
                const percentScrolled = Math.min(100, Math.floor((scrolled / (fullHeight - windowHeight)) * 100));
                
                // Aggiorna il progresso solo se è maggiore di quello attuale e non è già al 100%
                const progressoAttuale = ottieniProgresso(currentPath);
                if (percentScrolled > progressoAttuale.percentuale && progressoAttuale.percentuale < 100) {
                    salvaProgresso(currentPath, percentScrolled);
                }
            });
        }
        
        // Carica i dati dal nuovo sistema
        loadLessonBundle(courseId, lessonId).then(data => {
            console.log('Dati della lezione caricati dal nuovo sistema', data);
            // Qui puoi aggiungere logica per utilizzare i dati caricati
        });
    }
}

// Funzione per generare il menu della sidebar con il nuovo sistema
async function generateDynamicSidebar() {
    const sidebarMenu = document.querySelector('.sidebar-menu ul');
    if (!sidebarMenu) return;
    
    // Ottieni i dati dei corsi
    const courses = await loadCoursesData();
    if (!courses || courses.length === 0) return;
    
    // Ottieni info sulla pagina corrente
    const pageInfo = extractPageInfo();
    
    // Svuota il menu corrente mantenendo la home
    const homeItem = sidebarMenu.querySelector('.menu-item:first-child');
    sidebarMenu.innerHTML = '';
    if (homeItem) sidebarMenu.appendChild(homeItem);
    
    // Aggiungi i corsi dinamicamente
    courses.forEach(course => {
        const isActive = pageInfo && pageInfo.courseId === course.id;
        const isOpen = isActive || false; // Apri il dropdown se siamo in una pagina del corso
        
        const li = document.createElement('li');
        li.className = `menu-item menu-dropdown ${isActive ? 'active' : ''} ${isOpen ? 'open' : ''}`;
        
        const a = document.createElement('a');
        a.href = "#";
        a.className = "dropdown-toggle";
        a.innerHTML = `<i class="${course.icon}"></i> ${course.title} <i class="fas fa-chevron-down"></i>`;
        
        const submenu = document.createElement('ul');
        submenu.className = "submenu";
        
        // Aggiungi link al corso
        const overviewLi = document.createElement('li');
        overviewLi.innerHTML = `<a href="/materie/${course.id}/index.html">Panoramica</a>`;
        submenu.appendChild(overviewLi);
        
        // Aggiungi lezioni
        course.lessons.forEach(lesson => {
            const lessonLi = document.createElement('li');
            const isCurrentPage = pageInfo && pageInfo.lessonId === lesson.id && pageInfo.courseId === course.id;
            if (isCurrentPage) lessonLi.className = 'active';
            lessonLi.innerHTML = `<a href="${lesson.path}">${lesson.title}</a>`;
            submenu.appendChild(lessonLi);
        });
        
        // Aggiungi link al glossario
        const glossaryLi = document.createElement('li');
        const isGlossaryPage = pageInfo && pageInfo.isGlossary && pageInfo.courseId === course.id;
        glossaryLi.className = isGlossaryPage ? 'active' : '';
        glossaryLi.innerHTML = `<a href="/materie/${course.id}/glossario.html"><i class="fas fa-book"></i> Glossario</a>`;
        submenu.appendChild(glossaryLi);
        
        // Aggiungi link agli esercizi
        const exercisesLi = document.createElement('li');
        const isExercisesPage = pageInfo && pageInfo.isExercises && pageInfo.courseId === course.id;
        exercisesLi.className = isExercisesPage ? 'active' : '';
        exercisesLi.innerHTML = `<a href="/materie/${course.id}/esercizi.html"><i class="fas fa-laptop-code"></i> Esercizi Interattivi</a>`;
        submenu.appendChild(exercisesLi);
        
        li.appendChild(a);
        li.appendChild(submenu);
        sidebarMenu.appendChild(li);
    });
    
    // Aggiungi gli elementi fissi (preferiti, recenti, ecc.)
    const favoritesLi = document.createElement('li');
    favoritesLi.className = 'menu-item';
    const isFavoritesPage = window.location.pathname.includes('/preferiti.html');
    if (isFavoritesPage) favoritesLi.classList.add('active');
    favoritesLi.innerHTML = `<a href="/preferiti.html"><i class="fas fa-star"></i> Preferiti</a>`;
    sidebarMenu.appendChild(favoritesLi);
    
    const recentLi = document.createElement('li');
    recentLi.className = 'menu-item';
    const isRecentPage = window.location.pathname.includes('/recenti.html');
    if (isRecentPage) recentLi.classList.add('active');
    recentLi.innerHTML = `<a href="/recenti.html"><i class="fas fa-history"></i> Recenti</a>`;
    sidebarMenu.appendChild(recentLi);
    
    // Configura i dropdown dopo averli aggiunti al DOM
    setupDropdownListeners();
}

// Funzione per caricare i dati di un corso specifico nella dashboard
async function loadCourseDataInDashboard(courseId) {
    // Carica i dati del corso
    const course = await loadCourseData(courseId);
    if (!course) return;
    
    // Aggiorna i contenuti nella dashboard
    const courseTitle = document.querySelector('.welcome-section h1');
    if (courseTitle) courseTitle.textContent = course.title;
    
    const courseDescription = document.querySelector('.welcome-section p');
    if (courseDescription) courseDescription.textContent = course.description;
    
    // Carica le lezioni del corso
    const lessonsContainer = document.getElementById('course-lessons-container');
    if (lessonsContainer) {
        let html = '';
        
        course.lessons.forEach((lesson, index) => {
            const lessonNumber = index + 1;
            const formattedNumber = lessonNumber < 10 ? `0${lessonNumber}` : lessonNumber;
            
            html += `
            <div class="lesson-card">
                <div class="lesson-number">${formattedNumber}</div>
                <div class="lesson-info">
                    <h3>${lesson.title}</h3>
                    <p>${lesson.description}</p>
                    <div class="lesson-meta">
                        <span class="lesson-duration"><i class="far fa-clock"></i> ${lesson.duration}</span>
                        <span class="lesson-difficulty"><i class="fas fa-signal"></i> ${lesson.difficulty}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress" style="width: 0%"></div>
                    </div>
                </div>
                <a href="${lesson.path}" class="lesson-link">
                    <i class="fas fa-arrow-right"></i>
                </a>
            </div>
            `;
        });
        
        lessonsContainer.innerHTML = html;
        
        // Aggiorna il progresso per ogni lezione
        aggiornaInterfacciaProgresso();
    }
}

// Funzione per caricare le lezioni recenti con il nuovo sistema
async function loadRecentLessonsEnhanced() {
    const recentList = document.getElementById('recent-lessons-list');
    if (!recentList) return;
    
    const lezioniRecenti = JSON.parse(localStorage.getItem('lezioniRecenti')) || [];
    if (lezioniRecenti.length === 0) {
        recentList.innerHTML = '<div class="empty-state">Non hai ancora visualizzato lezioni. Inizia a esplorare!</div>';
        return;
    }
    
    // Carica i dati di tutti i corsi
    const courses = await loadCoursesData();
    
    let html = '';
    const promises = lezioniRecenti.map(async (lezione) => {
        // Estrai course e lesson id dall'URL della lezione
        const match = lezione.match(/\/materie\/([^\/]+)\/lezione(\d+)\.html/);
        if (!match) return null;
        
        const courseId = match[1];
        const lessonNumber = parseInt(match[2]);
        const lessonId = `lezione${lessonNumber}`;
        
        // Trova i dati del corso
        const course = courses.find(c => c.id === courseId);
        if (!course) return null;
        
        // Trova i dati della lezione
        const lesson = course.lessons.find(l => l.id === lessonId);
        if (!lesson) return null;
        
        // Ottieni info sul progresso
        const progresso = JSON.parse(localStorage.getItem('progressoLezioni')) || {};
        const lessonProgress = progresso[lezione] || { percentuale: 0, ultimoAccesso: null };
        const dataAccesso = lessonProgress.ultimoAccesso 
            ? new Date(lessonProgress.ultimoAccesso).toLocaleDateString() 
            : 'N/D';
        
        return `
        <div class="lesson-item">
            <div class="lesson-icon"><i class="${course.icon}"></i></div>
            <div class="lesson-details">
                <h4>${lesson.title}</h4>
                <p>${course.title} - Ultimo accesso: ${dataAccesso}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${lessonProgress.percentuale}%"></div>
                </div>
            </div>
            <a href="${lezione}" class="btn-continue">Continua</a>
        </div>`;
    });
    
    // Attendi che tutte le promesse siano risolte
    const results = await Promise.all(promises);
    html = results.filter(Boolean).join('');
    
    if (html) {
        recentList.innerHTML = html;
    } else {
        recentList.innerHTML = '<div class="empty-state">Nessuna lezione recente disponibile.</div>';
    }
}

// Modifica caricaLezioniPreferite per usare il nuovo sistema
async function caricaLezioniPreferiteEnhanced() {
    const preferitiList = document.getElementById('favorites-list');
    if (!preferitiList) return;
    
    const preferiti = JSON.parse(localStorage.getItem('lezioniPreferite')) || [];
    if (preferiti.length === 0) {
        preferitiList.innerHTML = '<div class="empty-state">Non hai ancora aggiunto lezioni ai preferiti. Aggiungi le tue lezioni preferite cliccando sulla stella!</div>';
        return;
    }
    
    // Carica i dati di tutti i corsi
    const courses = await loadCoursesData();
    
    let html = '';
    const promises = preferiti.map(async (lezione) => {
        // Estrai course e lesson id dall'URL della lezione
        const match = lezione.match(/\/materie\/([^\/]+)\/lezione(\d+)\.html/);
        if (!match) return null;
        
        const courseId = match[1];
        const lessonNumber = parseInt(match[2]);
        const lessonId = `lezione${lessonNumber}`;
        
        // Trova i dati del corso
        const course = courses.find(c => c.id === courseId);
        if (!course) return null;
        
        // Trova i dati della lezione
        const lesson = course.lessons.find(l => l.id === lessonId);
        if (!lesson) return null;
        
        // Ottieni info sul progresso
        const progresso = JSON.parse(localStorage.getItem('progressoLezioni')) || {};
        const lessonProgress = progresso[lezione] || { percentuale: 0, ultimoAccesso: null };
        const dataAccesso = lessonProgress.ultimoAccesso 
            ? new Date(lessonProgress.ultimoAccesso).toLocaleDateString() 
            : 'N/D';
        
        return `
        <div class="lesson-item">
            <div class="lesson-icon"><i class="${course.icon}"></i></div>
            <div class="lesson-details">
                <h4>${lesson.title}</h4>
                <p>${course.title} - Ultimo accesso: ${dataAccesso}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${lessonProgress.percentuale}%"></div>
                </div>
            </div>
            <a href="${lezione}" class="btn-continue">Continua</a>
        </div>`;
    });
    
    // Attendi che tutte le promesse siano risolte
    const results = await Promise.all(promises);
    html = results.filter(Boolean).join('');
    
    if (html) {
        preferitiList.innerHTML = html;
    } else {
        preferitiList.innerHTML = '<div class="empty-state">Nessuna lezione preferita disponibile.</div>';
    }
}

// Aggiorna il calcolo delle statistiche di progresso
async function updateProgressStats() {
    const progressoLezioni = JSON.parse(localStorage.getItem('progressoLezioni')) || {};
    const completedExercises = JSON.parse(localStorage.getItem('completedExercises')) || {};
    
    // Carica i dati di tutti i corsi per avere il conteggio totale delle lezioni
    const courses = await loadCoursesData();
    let totalLessons = 0;
    
    courses.forEach(course => {
        totalLessons += course.lessons.length;
    });
    
    // Calcola quante lezioni sono state completate
    let completedLessonsCount = 0;
    for (const lezione in progressoLezioni) {
        if (progressoLezioni[lezione].percentuale === 100) {
            completedLessonsCount++;
        }
    }
    
    // Calcola quanti esercizi sono stati completati
    let exercisesCompleted = 0;
    for (const exerciseSet in completedExercises) {
        exercisesCompleted += completedExercises[exerciseSet].length;
    }
    
    // Calcola la percentuale totale di completamento
    const completionPercentage = totalLessons > 0 ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;
    
    // Aggiorna la visualizzazione
    const completedElement = document.getElementById('lessons-completed');
    if (completedElement) completedElement.textContent = completedLessonsCount;
    
    const exercisesElement = document.getElementById('exercises-completed');
    if (exercisesElement) exercisesElement.textContent = exercisesCompleted;
    
    const percentageElement = document.getElementById('completed-percentage');
    if (percentageElement) percentageElement.textContent = completionPercentage + '%';
    
    // Aggiorna il cerchio di progresso
    const progressCircle = document.getElementById('progress-completed');
    if (progressCircle) {
        progressCircle.setAttribute('stroke-dasharray', `${completionPercentage}, 100`);
    }
    
    // Calcola il tempo di studio approssimativo (10 minuti per lezione visualizzata)
    const timeSpent = Math.round(Object.keys(progressoLezioni).length * 0.5 * 10) / 10; // in ore
    const timeElement = document.getElementById('time-spent');
    if (timeElement) timeElement.textContent = timeSpent + 'h';
}

// Funzione per inizializzare la dashboard con il nuovo sistema
async function initDashboard() {
    // Genera la sidebar dinamica
    await generateDynamicSidebar();
    
    // Carica i corsi nella dashboard principale
    await generateCourseCards();
    
    // Carica le lezioni recenti
    await loadRecentLessonsEnhanced();
    
    // Aggiorna le statistiche
    await updateProgressStats();
}

// Funzione per generare le card dei corsi nella homepage
async function generateCourseCards() {
    const categoryCardsContainer = document.querySelector('.category-cards');
    if (!categoryCardsContainer) return;
    
    // Carica i dati dei corsi
    const courses = await loadCoursesData();
    if (!courses || courses.length === 0) return;
    
    // Genera le card dei corsi
    let html = '';
    courses.forEach(course => {
        html += `
        <div class="category-card">
            <div class="category-icon"><i class="${course.icon}"></i></div>
            <h3>${course.title}</h3>
            <p>${course.description}</p>
            <a href="/materie/${course.id}/index.html" class="btn-explore">Esplora</a>
        </div>
        `;
    });
    
    categoryCardsContainer.innerHTML = html;
}

// Codice di inizializzazione alternativo
document.addEventListener('DOMContentLoaded', async () => {
    // Prima carichiamo le impostazioni
    caricaImpostazioni();
    
    // Determina la pagina corrente
    const pageInfo = extractPageInfo();
    
    // Inizializza la dashboard se siamo nella home
    if (!pageInfo && window.location.pathname === '/' || window.location.pathname === '/index.html') {
        await initDashboard();
    } 
    // Inizializza la pagina del corso se siamo in una pagina del corso
    else if (pageInfo && pageInfo.courseId && !pageInfo.lessonId && !pageInfo.isGlossary && !pageInfo.isExercises) {
        await loadCourseDataInDashboard(pageInfo.courseId);
        await generateDynamicSidebar();
    }
    // Altrimenti, genera solo la sidebar dinamica
    else {
        await generateDynamicSidebar();
    }
    
    // Aggiorna l'interfaccia del progresso
    aggiornaInterfacciaProgresso();
    
    // Registra visualizzazione se è una pagina di lezione
    registraVisualizzazioneLezione();
    
    // Imposta bottoni preferiti se presenti
    const btnPreferiti = document.querySelectorAll('.btn-preferito');
    btnPreferiti.forEach(btn => {
        const lezioneId = btn.dataset.lezione;
        if (lezioneId && isPreferita(lezioneId)) {
            btn.classList.add('active');
            btn.innerHTML = '<i class="fas fa-star"></i>';
        }
        
        btn.addEventListener('click', () => {
            const isActive = togglePreferito(lezioneId);
            if (isActive) {
                btn.classList.add('active');
                btn.innerHTML = '<i class="fas fa-star"></i>';
            } else {
                btn.classList.remove('active');
                btn.innerHTML = '<i class="far fa-star"></i>';
            }
        });
    });
    
    // Imposta bottone "Segna come completata" se presente
    const btnCompleta = document.querySelector('.btn-completa');
    if (btnCompleta) {
        const lezioneId = window.location.pathname;
        btnCompleta.addEventListener('click', () => {
            salvaProgresso(lezioneId, 100);
            btnCompleta.textContent = 'Completata ✓';
            btnCompleta.disabled = true;
        });
        
        // Controlla se già completata
        const progresso = ottieniProgresso(lezioneId);
        if (progresso.percentuale === 100) {
            btnCompleta.textContent = 'Completata ✓';
            btnCompleta.disabled = true;
        }
    }
    
    // Carica lezioni recenti se siamo nella pagina relativa
    if (window.location.pathname.includes('/recenti.html')) {
        await loadRecentLessonsEnhanced();
    }
    
    // Carica preferiti se siamo nella pagina relativa
    if (window.location.pathname.includes('/preferiti.html')) {
        await caricaLezioniPreferiteEnhanced();
    }
    
    // Gestione form impostazioni
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            salvaImpostazioni();
        });
    }
});