// app.js - Funzionalità principali dell'applicazione EpiCo

// Registrazione del Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/js/service-worker.js')
            .then(registration => {
                console.log('ServiceWorker registrato con successo:', registration.scope);
            })
            .catch(error => {
                console.log('Registrazione ServiceWorker fallita:', error);
            });
    });
}

// DOM Elements
let sidebar = null;
let toggleSidebarBtn = null;
let closeSidebarBtn = null;
let dropdownToggles = null;
let searchInput = null;

// Inizializzazione al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
    // Inizializza elementi DOM
    sidebar = document.getElementById('sidebar');
    toggleSidebarBtn = document.getElementById('toggleSidebar');
    closeSidebarBtn = document.getElementById('closeSidebar');
    dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    searchInput = document.querySelector('.search-input');

    // Imposta gli event listener
    setupEventListeners();
    
    // Imposta la navigazione corrente
    highlightCurrentPage();
    
    // Carica dati necessari per la pagina corrente
    loadPageSpecificData();
    
    // Aggiorna l'interfaccia del progresso
    updateProgressUI();
});

// Configurazione degli event listeners
function setupEventListeners() {
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
            
            // Toggle del dropdown corrente
            parent.classList.toggle('open');
            
            // Aggiorna l'icona
            const icon = toggle.querySelector('.fa-chevron-down');
            if (icon) {
                icon.style.transform = parent.classList.contains('open') ? 'rotate(180deg)' : '';
            }
        });
    });

    // Gestione della ricerca
    if (searchInput) {
        searchInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') {
                const query = searchInput.value.trim();
                if (query) {
                    window.location.href = `/ricerca.html?q=${encodeURIComponent(query)}`;
                }
            }
        });
    }

    // Gestione dei pulsanti "Preferiti"
    const favButtons = document.querySelectorAll('.btn-preferito');
    favButtons.forEach(btn => {
        const lezioneId = btn.dataset.lezione;
        if (lezioneId) {
            // Imposta lo stato iniziale
            updateFavoriteButtonUI(btn, isLezionePreferita(lezioneId));
            
            // Aggiungi event listener
            btn.addEventListener('click', () => {
                const isNowFavorite = toggleLezionePreferita(lezioneId);
                updateFavoriteButtonUI(btn, isNowFavorite);
            });
        }
    });

    // Gestione del pulsante "Segna come completata"
    const completeButton = document.querySelector('.btn-completa');
    if (completeButton) {
        const lezioneId = window.location.pathname;
        const progresso = ottieniProgresso(lezioneId);
        
        // Imposta lo stato iniziale
        if (progresso && progresso.percentuale === 100) {
            completeButton.textContent = 'Completata ✓';
            completeButton.disabled = true;
            completeButton.classList.add('completed');
        }
        
        // Aggiungi event listener
        completeButton.addEventListener('click', () => {
            salvaProgresso(lezioneId, 100);
            completeButton.textContent = 'Completata ✓';
            completeButton.disabled = true;
            completeButton.classList.add('completed');
        });
    }
}

// Evidenzia la pagina corrente nel menu
function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    
    // Rimuovi classe active da tutti gli elementi
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.classList.remove('active');
    });
    
    // Trova e marca l'elemento corretto
    const menuItems = document.querySelectorAll('.sidebar-menu a');
    for (const item of menuItems) {
        if (item.getAttribute('href') === currentPath) {
            item.parentElement.classList.add('active');
            
            // Se è in un sottomenu, apri anche il dropdown
            const dropdown = item.closest('.menu-dropdown');
            if (dropdown) {
                dropdown.classList.add('open');
            }
            
            break;
        }
    }
    
    // Evidenzia anche la materia corrente
    if (currentPath.includes('/materie/')) {
        const materia = currentPath.split('/')[2]; // es: programming, webdev, etc.
        const menuMateria = document.querySelector(`.sidebar-menu a[href*="/${materia}/"]`);
        if (menuMateria) {
            const dropdownParent = menuMateria.closest('.menu-dropdown');
            if (dropdownParent) {
                dropdownParent.classList.add('active');
            }
        }
    }
}

// Carica dati specifici per la pagina corrente
function loadPageSpecificData() {
    const currentPath = window.location.pathname;
    
    // Pagina preferiti
    if (currentPath === '/preferiti.html') {
        loadFavoriteItems();
    }
    
    // Pagina recenti
    else if (currentPath === '/recenti.html') {
        loadRecentItems();
    }
    
    // Pagina ricerca
    else if (currentPath === '/ricerca.html') {
        const params = new URLSearchParams(window.location.search);
        const query = params.get('q');
        if (query) {
            document.getElementById('search-query').textContent = query;
            searchLessons(query);
        }
    }
    
    // Registra visualizzazione se è una pagina di lezione
    else if (isLessonPage(currentPath)) {
        registerLessonView(currentPath);
    }
}

// Verifica se è una pagina di lezione
function isLessonPage(path) {
    return path.includes('/materie/') && path.includes('lezione') && path.endsWith('.html');
}

// Salva quando una lezione è stata visualizzata
function registerLessonView(lessonPath) {
    // Verifica se è una nuova visualizzazione o è già in progresso
    const progresso = ottieniProgresso(lessonPath);
    
    // Se è una nuova visualizzazione o non ancora completata
    if (!progresso || progresso.percentuale < 25) {
        salvaProgresso(lessonPath, 25); // Inizia con il 25%
    }
    
    // Aggiungi alla lista recenti
    aggiungiARecenti(lessonPath);
    
    // Imposta lo scrolling per aumentare il progresso
    setupScrollProgressTracking(lessonPath);
}

// Monitoraggio del progresso durante lo scrolling
function setupScrollProgressTracking(lessonPath) {
    window.addEventListener('scroll', throttle(() => {
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollTop = window.scrollY;
        const scrollPercentage = Math.round((scrollTop / (documentHeight - windowHeight)) * 100);
        
        // Aggiorna il progresso se è maggiore di quello attuale
        const currentProgress = ottieniProgresso(lessonPath);
        const currentPercentage = currentProgress ? currentProgress.percentuale : 0;
        
        if (scrollPercentage > currentPercentage && currentPercentage < 100) {
            // Limita al 90% - l'utente deve cliccare "Segna come completata" per arrivare al 100%
            const newPercentage = Math.min(90, scrollPercentage);
            salvaProgresso(lessonPath, newPercentage);
        }
    }, 1000)); // Controlla ogni secondo
}

// Throttle function per limitare la frequenza delle chiamate
function throttle(func, delay) {
    let lastCall = 0;
    return function(...args) {
        const now = new Date().getTime();
        if (now - lastCall >= delay) {
            lastCall = now;
            func(...args);
        }
    };
}

// Funzioni per salvare e gestire il progresso delle lezioni
function salvaProgresso(lezioneId, percentuale) {
    const progressoLezioni = JSON.parse(localStorage.getItem('progressoLezioni')) || {};
    
    progressoLezioni[lezioneId] = {
        percentuale: percentuale,
        ultimoAccesso: new Date().toISOString()
    };
    
    localStorage.setItem('progressoLezioni', JSON.stringify(progressoLezioni));
    updateProgressUI();
}

function ottieniProgresso(lezioneId) {
    const progressoLezioni = JSON.parse(localStorage.getItem('progressoLezioni')) || {};
    return progressoLezioni[lezioneId];
}

function updateProgressUI() {
    // Aggiorna la UI con il progresso delle lezioni
    const progressBars = document.querySelectorAll('.progress-bar');
    progressBars.forEach(bar => {
        const lezioneId = bar.dataset.lezione;
        if (lezioneId) {
            const progresso = ottieniProgresso(lezioneId);
            if (progresso) {
                const progressElement = bar.querySelector('.progress');
                if (progressElement) {
                    progressElement.style.width = `${progresso.percentuale}%`;
                }
            }
        }
    });
}

// Gestione delle lezioni recenti
function aggiungiARecenti(lezioneId) {
    const lezioniRecenti = JSON.parse(localStorage.getItem('lezioniRecenti')) || [];
    
    // Rimuovi se già presente
    const index = lezioniRecenti.findIndex(item => item.id === lezioneId);
    if (index > -1) {
        lezioniRecenti.splice(index, 1);
    }
    
    // Ottieni metadati della lezione
    const title = document.querySelector('h1')?.textContent || getPageTitle(lezioneId);
    const category = getCategoryFromPath(lezioneId);
    
    // Aggiungi all'inizio
    lezioniRecenti.unshift({
        id: lezioneId,
        title: title,
        category: category,
        timestamp: new Date().toISOString()
    });
    
    // Mantieni solo le ultime 10
    if (lezioniRecenti.length > 10) {
        lezioniRecenti.pop();
    }
    
    localStorage.setItem('lezioniRecenti', JSON.stringify(lezioniRecenti));
}

function loadRecentItems() {
    const container = document.getElementById('recent-items-container');
    if (!container) return;

    const lezioniRecenti = JSON.parse(localStorage.getItem('lezioniRecenti')) || [];
    
    if (lezioniRecenti.length === 0) {
        container.innerHTML = '<div class="empty-state">Non hai ancora visualizzato lezioni.</div>';
        return;
    }
    
    let html = '';
    lezioniRecenti.forEach(item => {
        const progresso = ottieniProgresso(item.id);
        const percentuale = progresso ? progresso.percentuale : 0;
        const date = new Date(item.timestamp).toLocaleDateString();
        
        html += `
        <div class="lesson-item">
            <div class="lesson-icon"><i class="fas ${getCategoryIcon(item.category)}"></i></div>
            <div class="lesson-details">
                <h4>${item.title}</h4>
                <p>${getCategoryName(item.category)} - Visitata il ${date}</p>
                <div class="progress-bar" data-lezione="${item.id}">
                    <div class="progress" style="width: ${percentuale}%"></div>
                </div>
            </div>
            <a href="${item.id}" class="btn-continue">Continua</a>
        </div>
        `;
    });
    
    container.innerHTML = html;
}

// Gestione dei preferiti
function toggleLezionePreferita(lezioneId) {
    const preferiti = JSON.parse(localStorage.getItem('lezioniPreferite')) || [];
    
    const index = preferiti.findIndex(item => item.id === lezioneId);
    if (index > -1) {
        // Rimuovi dai preferiti
        preferiti.splice(index, 1);
        localStorage.setItem('lezioniPreferite', JSON.stringify(preferiti));
        return false;
    } else {
        // Aggiungi ai preferiti
        const title = document.querySelector('h1')?.textContent || getPageTitle(lezioneId);
        const category = getCategoryFromPath(lezioneId);
        
        preferiti.push({
            id: lezioneId,
            title: title,
            category: category,
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem('lezioniPreferite', JSON.stringify(preferiti));
        return true;
    }
}

function isLezionePreferita(lezioneId) {
    const preferiti = JSON.parse(localStorage.getItem('lezioniPreferite')) || [];
    return preferiti.some(item => item.id === lezioneId);
}

function updateFavoriteButtonUI(button, isFavorite) {
    if (isFavorite) {
        button.innerHTML = '<i class="fas fa-star"></i>';
        button.classList.add('active');
    } else {
        button.innerHTML = '<i class="far fa-star"></i>';
        button.classList.remove('active');
    }
}

function loadFavoriteItems() {
    const container = document.getElementById('favorite-items-container');
    if (!container) return;

    const preferiti = JSON.parse(localStorage.getItem('lezioniPreferite')) || [];
    
    if (preferiti.length === 0) {
        container.innerHTML = '<div class="empty-state">Non hai ancora aggiunto lezioni ai preferiti.</div>';
        return;
    }
    
    let html = '';
    preferiti.forEach(item => {
        const progresso = ottieniProgresso(item.id);
        const percentuale = progresso ? progresso.percentuale : 0;
        
        html += `
        <div class="lesson-item">
            <div class="lesson-icon"><i class="fas ${getCategoryIcon(item.category)}"></i></div>
            <div class="lesson-details">
                <h4>${item.title}</h4>
                <p>${getCategoryName(item.category)}</p>
                <div class="progress-bar" data-lezione="${item.id}">
                    <div class="progress" style="width: ${percentuale}%"></div>
                </div>
            </div>
            <div class="lesson-actions">
                <button class="remove-favorite" data-lezione="${item.id}"><i class="fas fa-trash"></i></button>
                <a href="${item.id}" class="btn-continue">Vai</a>
            </div>
        </div>
        `;
    });
    
    container.innerHTML = html;
    
    // Aggiungi gli event listener per i pulsanti di rimozione
    document.querySelectorAll('.remove-favorite').forEach(btn => {
        btn.addEventListener('click', () => {
            const lezioneId = btn.dataset.lezione;
            toggleLezionePreferita(lezioneId);
            loadFavoriteItems(); // Ricarica per aggiornare l'UI
        });
    });
}

// Funzione di ricerca
function searchLessons(query) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    // In una implementazione reale, potresti usare un indice di ricerca
    // Per ora, raccogliamo semplicemente tutte le lezioni dai recenti e preferiti
    const recenti = JSON.parse(localStorage.getItem('lezioniRecenti')) || [];
    const preferiti = JSON.parse(localStorage.getItem('lezioniPreferite')) || [];
    
    // Combina e rimuovi duplicati
    const allLessons = [...recenti];
    preferiti.forEach(fav => {
        if (!allLessons.some(lesson => lesson.id === fav.id)) {
            allLessons.push(fav);
        }
    });
    
    // Filtra in base alla query
    const results = allLessons.filter(lesson => 
        lesson.title.toLowerCase().includes(query.toLowerCase()) ||
        getCategoryName(lesson.category).toLowerCase().includes(query.toLowerCase())
    );
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="empty-state">Nessun risultato trovato per questa ricerca.</div>';
        return;
    }
    
    let html = '';
    results.forEach(item => {
        html += `
        <div class="search-result-item">
            <div class="result-icon"><i class="fas ${getCategoryIcon(item.category)}"></i></div>
            <div class="result-details">
                <h4>${item.title}</h4>
                <p>${getCategoryName(item.category)}</p>
            </div>
            <a href="${item.id}" class="btn-view">Visualizza</a>
        </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
}

// Funzioni helper
function getCategoryFromPath(path) {
    const parts = path.split('/');
    if (parts.length >= 3 && parts[1] === 'materie') {
        return parts[2];
    }
    return 'unknown';
}

function getCategoryName(category) {
    const categories = {
        'programming': 'Principi di Programmazione',
        'webdev': 'Web Development',
        'architecture': 'Architettura dei Calcolatori',
        'networks': 'Reti di Calcolatori',
        'mathematics': 'Matematica Discreta',
        'unknown': 'Categoria Sconosciuta'
    };
    
    return categories[category] || categories.unknown;
}

function getCategoryIcon(category) {
    const icons = {
        'programming': 'fa-code',
        'webdev': 'fa-laptop-code',
        'architecture': 'fa-microchip',
        'networks': 'fa-network-wired',
        'mathematics': 'fa-calculator',
        'unknown': 'fa-book'
    };
    
    return icons[category] || icons.unknown;
}

function getPageTitle(path) {
    // Estrai il nome della lezione dal percorso
    const match = path.match(/lezione(\d+)\.html$/);
    if (match) {
        const lezioneNum = match[1];
        const category = getCategoryFromPath(path);
        
        // Generazioni di titoli standard per le lezioni
        const titles = {
            'programming': {
                1: 'Introduzione alla Programmazione',
                2: 'Variabili e Tipi di Dati',
                3: 'Controllo di Flusso',
                4: 'Funzioni',
                5: 'Strutture Dati',
                6: 'Programmazione Orientata agli Oggetti',
                7: 'Gestione degli Errori',
                8: 'File e I/O',
                9: 'Algoritmi Base',
                10: 'Best Practices'
            },
            'webdev': {
                1: 'HTML Fondamenti',
                2: 'CSS Styling',
                3: 'JavaScript Base',
                4: 'DOM Manipulation',
                5: 'Responsive Design',
                6: 'Frameworks Frontend',
                7: 'Backend Basics',
                8: 'API RESTful',
                9: 'Database Integration',
                10: 'Deployment'
            },
            'architecture': {
                1: 'Introduzione all\'Architettura',
                2: 'CPU e Memoria',
                3: 'Architettura di Von Neumann',
                4: 'Sistema di Input/Output',
                5: 'Cache',
                6: 'Pipelining',
                7: 'Sistemi Multiprocessore',
                8: 'Architetture RISC vs CISC',
                9: 'Memoria Virtuale',
                10: 'Architetture Moderne'
            },
            'networks': {
                1: 'Introduzione alle Reti',
                2: 'Modello OSI',
                3: 'Protocolli TCP/IP',
                4: 'Routing',
                5: 'Switching',
                6: 'Reti Wireless',
                7: 'Sicurezza di Rete',
                8: 'Protocolli Applicativi',
                9: 'Virtualizzazione di Rete',
                10: 'Cloud Networking'
            },
            'mathematics': {
                1: 'Insiemi e Logica',
                2: 'Relazioni e Funzioni',
                3: 'Teoria dei Grafi',
                4: 'Combinatoria',
                5: 'Teoria dei Numeri',
                6: 'Algebra Booleana',
                7: 'Matematica per la Crittografia',
                8: 'Probabilità Discreta',
                9: 'Ricorsione e Induzione',
                10: 'Applicazioni alla Informatica'
            }
        };
        
        if (titles[category] && titles[category][lezioneNum]) {
            return titles[category][lezioneNum];
        }
        
        return `Lezione ${lezioneNum}`;
    }
    
    return 'Pagina sconosciuta';
}