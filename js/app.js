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

// Funzione per reimpostare i listener dei dropdown
function setupDropdownListeners() {
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
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
            
            // Gestisci l'altezza max della submenu
            const submenu = parent.querySelector('.submenu');
            if (submenu) {
                if (parent.classList.contains('open')) {
                    submenu.style.maxHeight = '300px';
                } else {
                    submenu.style.maxHeight = '0';
                }
            }
        });
    });
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

// Registra quando una lezione è stata visualizzata e avanza il progresso man mano che l'utente scorre
function registraVisualizzazioneLezione() {
    // Ottieni l'URL corrente
    const currentPath = window.location.pathname;
    
    // Se siamo in una pagina di lezione
    if (currentPath.includes('/lezione')) {
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
    }
}

// Gestione delle lezioni recenti
function aggiungiARecenti(lezioneId) {
    const lezioniRecenti = JSON.parse(localStorage.getItem('lezioniRecenti')) || [];
    
    // Rimuovi se già presente
    const index = lezioniRecenti.indexOf(lezioneId);
    if (index > -1) {
        lezioniRecenti.splice(index, 1);
    }
    
    // Aggiungi all'inizio
    lezioniRecenti.unshift(lezioneId);
    
    // Mantieni solo le ultime 5
    if (lezioniRecenti.length > 5) {
        lezioniRecenti.pop();
    }
    
    localStorage.setItem('lezioniRecenti', JSON.stringify(lezioniRecenti));
}

// Carica le lezioni recenti nella pagina recenti.html
async function caricaLezioniRecenti() {
    const recentList = document.getElementById('recent-lessons-list');
    if (!recentList) return;
    
    const lezioniRecenti = JSON.parse(localStorage.getItem('lezioniRecenti')) || [];
    if (lezioniRecenti.length === 0) {
        recentList.innerHTML = '<div class="empty-state">Non hai ancora visualizzato lezioni. Inizia a esplorare!</div>';
        return;
    }
    
    // Carica i dati dei corsi se non sono ancora stati caricati
    if (corsiData.length === 0) {
        corsiData = await loadCoursesData();
    }
    
    let html = '';
    lezioniRecenti.forEach(lezione => {
        // Cerca nei dati dei corsi per trovare i metadati della lezione
        let lessonData = null;
        let courseData = null;
        
        // Estrai course e lesson id dall'URL della lezione
        const match = lezione.match(/\/materie\/([^\/]+)\/lezione(\d+)\.html/);
        if (match) {
            const courseId = match[1];
            const lessonNumber = parseInt(match[2]);
            
            // Trova il corso
            courseData = corsiData.find(c => c.id === courseId);
            if (courseData) {
                // Trova la lezione
                lessonData = courseData.lessons.find(l => l.id === `lezione${lessonNumber}`);
            }
        }
        
        // Usa dati predefiniti se non trovati
        const data = {
            title: lessonData ? lessonData.title : 'Lezione',
            course: courseData ? courseData.title : 'Corso',
            icon: courseData ? courseData.icon : 'fa-book'
        };
        
        const progresso = ottieniProgresso(lezione);
        const dataAccesso = progresso.ultimoAccesso ? new Date(progresso.ultimoAccesso).toLocaleDateString() : 'N/D';
        
        html += `
        <div class="lesson-item">
            <div class="lesson-icon"><i class="${data.icon}"></i></div>
            <div class="lesson-details">
                <h4>${data.title}</h4>
                <p>${data.course} - Ultimo accesso: ${dataAccesso}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${progresso.percentuale}%"></div>
                </div>
            </div>
            <a href="${lezione}" class="btn-continue">Continua</a>
        </div>`;
    });
    
    recentList.innerHTML = html;
}

// Gestione dei preferiti
function togglePreferito(lezioneId) {
    const preferiti = JSON.parse(localStorage.getItem('lezioniPreferite')) || [];
    
    const index = preferiti.indexOf(lezioneId);
    if (index > -1) {
        // Rimuovi dai preferiti
        preferiti.splice(index, 1);
        localStorage.setItem('lezioniPreferite', JSON.stringify(preferiti));
        return false;
    } else {
        // Aggiungi ai preferiti
        preferiti.push(lezioneId);
        localStorage.setItem('lezioniPreferite', JSON.stringify(preferiti));
        return true;
    }
}

// Funzione per verificare se una lezione è preferita
function isPreferita(lezioneId) {
    const preferiti = JSON.parse(localStorage.getItem('lezioniPreferite')) || [];
    return preferiti.includes(lezioneId);
}

// Carica lezioni preferite nella pagina preferiti.html
async function caricaLezioniPreferite() {
    const preferitiList = document.getElementById('favorites-list');
    if (!preferitiList) return;
    
    const preferiti = JSON.parse(localStorage.getItem('lezioniPreferite')) || [];
    if (preferiti.length === 0) {
        preferitiList.innerHTML = '<div class="empty-state">Non hai ancora aggiunto lezioni ai preferiti. Aggiungi le tue lezioni preferite cliccando sulla stella!</div>';
        return;
    }
    
    // Carica i dati dei corsi se non sono ancora stati caricati
    if (corsiData.length === 0) {
        corsiData = await loadCoursesData();
    }
    
    let html = '';
    preferiti.forEach(lezione => {
        // Cerca nei dati dei corsi per trovare i metadati della lezione
        let lessonData = null;
        let courseData = null;
        
        // Estrai course e lesson id dall'URL della lezione
        const match = lezione.match(/\/materie\/([^\/]+)\/lezione(\d+)\.html/);
        if (match) {
            const courseId = match[1];
            const lessonNumber = parseInt(match[2]);
            
            // Trova il corso
            courseData = corsiData.find(c => c.id === courseId);
            if (courseData) {
                // Trova la lezione
                lessonData = courseData.lessons.find(l => l.id === `lezione${lessonNumber}`);
            }
        }
        
        // Usa dati predefiniti se non trovati
        const data = {
            title: lessonData ? lessonData.title : 'Lezione',
            course: courseData ? courseData.title : 'Corso',
            icon: courseData ? courseData.icon : 'fa-book'
        };
        
        const progresso = ottieniProgresso(lezione);
        const dataAccesso = progresso.ultimoAccesso ? new Date(progresso.ultimoAccesso).toLocaleDateString() : 'N/D';
        
        html += `
        <div class="lesson-item">
            <div class="lesson-icon"><i class="${data.icon}"></i></div>
            <div class="lesson-details">
                <h4>${data.title}</h4>
                <p>${data.course} - Ultimo accesso: ${dataAccesso}</p>
                <div class="progress-bar">
                    <div class="progress" style="width: ${progresso.percentuale}%"></div>
                </div>
            </div>
            <a href="${lezione}" class="btn-continue">Continua</a>
        </div>`;
    });
    
    preferitiList.innerHTML = html;
}

// Gestione delle impostazioni
function salvaImpostazioni() {
    const darkMode = document.getElementById('dark-mode').checked;
    const fontSize = document.getElementById('font-size').value;
    const notificationsEnabled = document.getElementById('notifications').checked;
    
    const impostazioni = {
        darkMode,
        fontSize,
        notificationsEnabled,
        ultimoAggiornamento: new Date().toISOString()
    };
    
    localStorage.setItem('impostazioni', JSON.stringify(impostazioni));
    applicaImpostazioni(impostazioni);
    
    // Mostra feedback
    const feedbackMsg = document.getElementById('settings-feedback');
    if (feedbackMsg) {
        feedbackMsg.classList.add('show');
        setTimeout(() => {
            feedbackMsg.classList.remove('show');
        }, 3000);
    }
}

function caricaImpostazioni() {
    const impostazioni = JSON.parse(localStorage.getItem('impostazioni')) || {
        darkMode: false,
        fontSize: 'medium',
        notificationsEnabled: true
    };
    
    // Imposta i valori dei controlli form
    const darkModeToggle = document.getElementById('dark-mode');
    const fontSizeSelect = document.getElementById('font-size');
    const notificationsToggle = document.getElementById('notifications');
    
    if (darkModeToggle) darkModeToggle.checked = impostazioni.darkMode;
    if (fontSizeSelect) fontSizeSelect.value = impostazioni.fontSize;
    if (notificationsToggle) notificationsToggle.checked = impostazioni.notificationsEnabled;
    
    applicaImpostazioni(impostazioni);
}

function applicaImpostazioni(impostazioni) {
    // Applica darkMode
    if (impostazioni.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Applica fontSize
    document.documentElement.setAttribute('data-font-size', impostazioni.fontSize);
}

// Gestione del glossario
function caricaGlossario() {
    const glossarioContainer = document.getElementById('glossary-container');
    if (!glossarioContainer) return;
    
    // Ottieni l'ID del corso dall'URL
    const match = window.location.pathname.match(/\/materie\/([^\/]+)\/glossario\.html/);
    if (!match) return;
    
    const courseId = match[1];
    
    // Carica il glossario per questo corso
    fetch(`/data/glossary/${courseId}_glossary.json`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Glossario non disponibile');
            }
            return response.json();
        })
        .then(data => {
            renderGlossario(data, glossarioContainer);
        })
        .catch(error => {
            console.error('Errore nel caricamento del glossario:', error);
            glossarioContainer.innerHTML = '<div class="error-message">Il glossario per questo corso non è ancora disponibile.</div>';
        });
}

function renderGlossario(data, container) {
    if (!data || !data.terms || data.terms.length === 0) {
        container.innerHTML = '<div class="empty-state">Nessun termine nel glossario.</div>';
        return;
    }
    
    // Organizza i termini per lettera iniziale
    const termsByLetter = {};
    
    data.terms.forEach(term => {
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
        
        termsByLetter[letter].forEach(term => {
            html += `
            <div class="glossary-term">
                <h3 class="term-title">${term.term}</h3>
                <div class="term-definition">${term.definition}</div>
                ${term.relatedLesson ? `<div class="term-related">Lezione correlata: <a href="${term.relatedLesson.path}">${term.relatedLesson.title}</a></div>` : ''}
            </div>`;
        });
        
        html += '</div></div>';
    });
    
    html += '</div>';
    
    container.innerHTML = html;
    
    // Aggiungi funzionalità di ricerca
    setTimeout(() => {
        const searchInput = document.getElementById('glossary-search-input');
        const searchBtn = document.getElementById('glossary-search-btn');
        
        if (searchInput && searchBtn) {
            searchBtn.addEventListener('click', () => {
                searchGlossary(searchInput.value);
            });
            
            searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    searchGlossary(searchInput.value);
                }
            });
        }
    }, 100);
}

function searchGlossary(query) {
    if (!query || query.trim() === '') {
        // Resetta la ricerca - mostra tutti i termini
        document.querySelectorAll('.glossary-term').forEach(term => {
            term.style.display = 'block';
        });
        document.querySelectorAll('.letter-section').forEach(section => {
            section.style.display = 'block';
        });
        return;
    }
    
    query = query.toLowerCase();
    let foundAny = false;
    
    // Nascondi tutte le sezioni
    document.querySelectorAll('.letter-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Filtra i termini
    document.querySelectorAll('.glossary-term').forEach(term => {
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
        const searchResultMsg = document.getElementById('search-results-message');
        if (searchResultMsg) {
            searchResultMsg.textContent = `Nessun risultato per "${query}"`;
            searchResultMsg.style.display = 'block';
        } else {
            const msg = document.createElement('div');
            msg.id = 'search-results-message';
            msg.className = 'empty-state';
            msg.textContent = `Nessun risultato per "${query}"`;
            document.querySelector('.glossary-terms').prepend(msg);
        }
    } else {
        // Nascondi messaggio "nessun risultato" se esiste
        const searchResultMsg = document.getElementById('search-results-message');
        if (searchResultMsg) {
            searchResultMsg.style.display = 'none';
        }
    }
}

// Inizializza l'interfaccia al caricamento della pagina
document.addEventListener('DOMContentLoaded', async () => {
    // Carica i dati dei corsi
    const courses = await loadCoursesData();
    
    // Genera sidebar
    generateSidebar(courses);
    
    // Genera cards dei corsi nella homepage
    generateCourseCards(courses);
    
    // Carica le impostazioni
    caricaImpostazioni();
    
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
        caricaLezioniRecenti();
    }
    
    // Carica preferiti se siamo nella pagina relativa
    if (window.location.pathname.includes('/preferiti.html')) {
        caricaLezioniPreferite();
    }
    
    // Carica glossario se siamo nella pagina relativa
    if (window.location.pathname.includes('/glossario.html')) {
        caricaGlossario();
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