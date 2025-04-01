/**
 * Gestione avanzata della sidebar per EpiCo
 */

// Selettori per elementi della sidebar
const SELECTORS = {
    sidebar: '.sidebar',
    menuItem: '.menu-item',
    dropdownToggle: '.dropdown-toggle',
    submenu: '.submenu',
    activePage: window.location.pathname
};

// Configurazione
const CONFIG = {
    submenuMaxHeight: '500px',  // Altezza massima per i sottomenu
    animationDuration: 300,     // Durata dell'animazione in ms
    mobileBreakpoint: 768       // Breakpoint per dispositivi mobili
};

/**
 * Inizializza la sidebar
 */
function initSidebar() {
    // Configura i toggle per i dropdown
    setupDropdownToggles();
    
    // Imposta lo stato attivo basato sull'URL corrente
    setActiveState();
    
    // Configura i listener per dispositivi mobili
    setupMobileListeners();
    
    // Aggiunge funzionalità di ricerca
    setupSearch();

    // Configura lo scroll nella sidebar
    setupSidebarScroll();
}

/**
 * Configura i toggle per i dropdown
 */
function setupDropdownToggles() {
    const dropdownToggles = document.querySelectorAll(SELECTORS.dropdownToggle);
    
    dropdownToggles.forEach(toggle => {
        // Rimuove eventuali listener precedenti
        toggle.removeEventListener('click', toggleDropdown);
        
        // Aggiunge il nuovo listener
        toggle.addEventListener('click', toggleDropdown);
        
        // Verifica se il dropdown dovrebbe essere già aperto (se contiene la pagina attiva)
        const menuItem = toggle.closest(SELECTORS.menuItem);
        const shouldBeOpen = shouldDropdownBeOpen(menuItem);
        
        if (shouldBeOpen) {
            openDropdown(menuItem);
        }
    });
}

/**
 * Funzione di callback per il toggle dei dropdown
 * @param {Event} e - Evento click
 */
function toggleDropdown(e) {
    e.preventDefault();
    
    const menuItem = this.closest(SELECTORS.menuItem);
    const isOpen = menuItem.classList.contains('open');
    
    // Chiudi tutti gli altri dropdown
    closeAllDropdowns();
    
    // Apri o chiudi questo dropdown
    if (!isOpen) {
        openDropdown(menuItem);
    }
}

/**
 * Verifica se un dropdown dovrebbe essere aperto (contiene la pagina corrente)
 * @param {HTMLElement} menuItem - Elemento del menu
 * @returns {boolean} - True se il dropdown dovrebbe essere aperto
 */
function shouldDropdownBeOpen(menuItem) {
    // Verifica se il menuItem contiene un link alla pagina corrente
    const currentPath = SELECTORS.activePage;
    const links = menuItem.querySelectorAll('a:not(.dropdown-toggle)');
    
    for (const link of links) {
        // Verifica match esatto o se è una sottopagina
        if (link.getAttribute('href') === currentPath) {
            return true;
        }
        
        // Verifica se la pagina corrente è una sottopagina di questo corso
        const href = link.getAttribute('href');
        if (href && href.includes('/materie/') && currentPath.includes('/materie/')) {
            const courseMatch = href.match(/\/materie\/([^\/]+)/);
            const currentMatch = currentPath.match(/\/materie\/([^\/]+)/);
            
            if (courseMatch && currentMatch && courseMatch[1] === currentMatch[1]) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Apre un dropdown
 * @param {HTMLElement} menuItem - Elemento del menu da aprire
 */
function openDropdown(menuItem) {
    menuItem.classList.add('open');
    
    const submenu = menuItem.querySelector(SELECTORS.submenu);
    if (submenu) {
        // Ottieni l'altezza reale del submenu
        const height = getSubmenuHeight(submenu);
        
        // Imposta l'altezza massima del submenu con transizione fluida
        submenu.style.maxHeight = `${height}px`;
        submenu.style.overflow = 'auto';
    }
}

/**
 * Chiude tutti i dropdown
 */
function closeAllDropdowns() {
    document.querySelectorAll(`${SELECTORS.menuItem}.open`).forEach(item => {
        item.classList.remove('open');
        
        const submenu = item.querySelector(SELECTORS.submenu);
        if (submenu) {
            submenu.style.maxHeight = '0';
            submenu.style.overflow = 'hidden';
        }
    });
}

/**
 * Calcola l'altezza reale di un submenu
 * @param {HTMLElement} submenu - Elemento submenu
 * @returns {number} - Altezza in pixel
 */
function getSubmenuHeight(submenu) {
    // Clona il submenu per misurarne l'altezza reale
    const clone = submenu.cloneNode(true);
    
    // Imposta proprietà per la misurazione
    clone.style.position = 'absolute';
    clone.style.visibility = 'hidden';
    clone.style.maxHeight = 'none';
    clone.style.height = 'auto';
    clone.style.display = 'block';
    clone.style.overflow = 'visible';
    
    // Aggiungi al DOM per la misurazione
    document.body.appendChild(clone);
    
    // Misura l'altezza
    const height = clone.scrollHeight;
    
    // Rimuovi il clone
    document.body.removeChild(clone);
    
    return Math.min(height, parseInt(CONFIG.submenuMaxHeight));
}

/**
 * Imposta lo stato attivo basato sull'URL corrente
 */
function setActiveState() {
    const currentPath = SELECTORS.activePage;
    
    // Rimuovi tutti gli stati attivi esistenti
    document.querySelectorAll(`${SELECTORS.menuItem}.active, ${SELECTORS.submenu} li.active`).forEach(item => {
        item.classList.remove('active');
    });
    
    // Cerca il link che corrisponde alla pagina corrente
    const activeLink = Array.from(document.querySelectorAll('a')).find(link => {
        return link.getAttribute('href') === currentPath;
    });
    
    if (activeLink) {
        // Imposta lo stato attivo per il link
        const parentLi = activeLink.closest('li');
        if (parentLi) {
            parentLi.classList.add('active');
            
            // Se è in un submenu, imposta anche il parent menu item come attivo
            const parentMenuItem = parentLi.closest(SELECTORS.menuItem);
            if (parentMenuItem && !parentLi.isEqualNode(parentMenuItem)) {
                parentMenuItem.classList.add('active');
                openDropdown(parentMenuItem);
            }
        }
    } else {
        // Se non troviamo una corrispondenza esatta, cerca un match parziale per la sezione corrente
        if (currentPath.includes('/materie/')) {
            const match = currentPath.match(/\/materie\/([^\/]+)/);
            if (match) {
                const courseId = match[1];
                
                // Cerca il menu item che corrisponde a questo corso
                document.querySelectorAll(SELECTORS.menuItem).forEach(item => {
                    const links = item.querySelectorAll('a');
                    for (const link of links) {
                        const href = link.getAttribute('href');
                        if (href && href.includes(`/materie/${courseId}/`)) {
                            item.classList.add('active');
                            openDropdown(item);
                            break;
                        }
                    }
                });
            }
        }
    }
}

/**
 * Configura i listener per dispositivi mobili
 */
function setupMobileListeners() {
    const sidebar = document.querySelector(SELECTORS.sidebar);
    const toggleButton = document.querySelector('#toggleSidebar');
    const closeButton = document.querySelector('#closeSidebar');
    
    if (toggleButton && sidebar) {
        toggleButton.addEventListener('click', () => {
            sidebar.classList.add('open');
        });
    }
    
    if (closeButton && sidebar) {
        closeButton.addEventListener('click', () => {
            sidebar.classList.remove('open');
        });
    }
    
    // Chiudi la sidebar quando si fa clic all'esterno
    document.addEventListener('click', (event) => {
        const isMobile = window.innerWidth <= CONFIG.mobileBreakpoint;
        if (!isMobile) return;
        
        const isClickInside = sidebar.contains(event.target) || 
                             (toggleButton && toggleButton.contains(event.target));
        
        if (!isClickInside && sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });
}

/**
 * Configura la funzionalità di ricerca nella sidebar
 */
function setupSearch() {
    const searchInput = document.querySelector('.sidebar-search input');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', () => {
        const value = searchInput.value.toLowerCase();
        
        // Se il valore è vuoto, mostra tutti gli elementi
        if (!value) {
            document.querySelectorAll(`${SELECTORS.menuItem}, ${SELECTORS.submenu} li`).forEach(item => {
                item.style.display = '';
            });
            return;
        }
        
        // Filtra gli elementi del menu
        document.querySelectorAll(`${SELECTORS.menuItem}, ${SELECTORS.submenu} li`).forEach(item => {
            const links = item.querySelectorAll('a');
            let shouldShow = false;
            
            links.forEach(link => {
                if (link.textContent.toLowerCase().includes(value)) {
                    shouldShow = true;
                }
            });
            
            item.style.display = shouldShow ? '' : 'none';
            
            // Se è un item con sottomenu e dovrebbe essere mostrato, apri il sottomenu
            if (shouldShow && item.classList.contains(SELECTORS.menuItem.replace('.', '')) && 
                item.querySelector(SELECTORS.submenu)) {
                openDropdown(item);
            }
        });
    });
}

/**
 * Configura lo scrolling della sidebar
 */
function setupSidebarScroll() {
    const sidebar = document.querySelector(SELECTORS.sidebar);
    const sidebarContent = document.querySelector('.sidebar-content');
    
    if (!sidebar || !sidebarContent) return;
    
    // Assicura che la barra di scorrimento sia sempre visibile se necessario
    sidebarContent.style.overflowY = 'auto';
    
    // Scorri fino all'elemento attivo
    const activeItem = sidebar.querySelector('li.active');
    if (activeItem) {
        setTimeout(() => {
            activeItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, CONFIG.animationDuration);
    }
}

// Inizializza quando il DOM è pronto
document.addEventListener('DOMContentLoaded', initSidebar);