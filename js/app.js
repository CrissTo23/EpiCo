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

    document.querySelector('.search-button').addEventListener('click', () => {
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
function caricaLezioniRecenti() {
    const recentList = document.getElementById('recent-lessons-list');
    if (!recentList) return;
    
    const lezioniRecenti = JSON.parse(localStorage.getItem('lezioniRecenti')) || [];
    if (lezioniRecenti.length === 0) {
        recentList.innerHTML = '<div class="empty-state">Non hai ancora visualizzato lezioni. Inizia a esplorare!</div>';
        return;
    }
    
    // Ottieni i metadati delle lezioni (potrebbe richiedere un'API in un'app reale)
    const lezioniData = {
        '/materie/programming/lezione1.html': { // Cambia programmazione in programming
            title: 'Introduzione alla Programmazione',
            materia: 'Programmazione',
            icon: 'fa-code'
        },
        '/materie/programmazione/lezione2.html': {
            title: 'Variabili e Tipi di Dati',
            materia: 'Programmazione',
            icon: 'fa-code'
        },
        '/materie/database/lezione1.html': {
            title: 'Introduzione ai Database',
            materia: 'Database',
            icon: 'fa-database'
        },
        '/materie/webdev/lezione1.html': {
            title: 'HTML Fondamenti',
            materia: 'Web Development',
            icon: 'fa-laptop-code'
        }
        // Aggiungi altri metadati per le tue lezioni
    };
    
    let html = '';
    lezioniRecenti.forEach(lezione => {
        const data = lezioniData[lezione] || {
            title: 'Lezione',
            materia: 'Corso',
            icon: 'fa-book'
        };
        
        const progresso = ottieniProgresso(lezione);
        const dataAccesso = progresso.ultimoAccesso ? new Date(progresso.ultimoAccesso).toLocaleDateString() : 'N/D';
        
        html += `
        <div class="lesson-item">
            <div class="lesson-icon"><i class="fas ${data.icon}"></i></div>
            <div class="lesson-details">
                <h4>${data.title}</h4>
                <p>${data.materia} - Ultimo accesso: ${dataAccesso}</p>
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
function caricaLezioniPreferite() {
    const preferitiList = document.getElementById('favorites-list');
    if (!preferitiList) return;
    
    const preferiti = JSON.parse(localStorage.getItem('lezioniPreferite')) || [];
    if (preferiti.length === 0) {
        preferitiList.innerHTML = '<div class="empty-state">Non hai ancora aggiunto lezioni ai preferiti. Aggiungi le tue lezioni preferite cliccando sulla stella!</div>';
        return;
    }
    
    // Stessa logica delle lezioni recenti per caricare i metadati
    // ...
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
    
    aplicaImpostazioni(impostazioni);
}

function aplicaImpostazioni(impostazioni) {
    // Applica darkMode
    if (impostazioni.darkMode) {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Applica fontSize
    document.documentElement.setAttribute('data-font-size', impostazioni.fontSize);
}

// Inizializza l'interfaccia al caricamento della pagina
document.addEventListener('DOMContentLoaded', () => {
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
    
    // Gestione form impostazioni
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            salvaImpostazioni();
        });
    }
});