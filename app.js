// Registra il service worker
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

// Funzionalità per salvare il progresso dell'utente
function salvaProgresso(lezioneId) {
  const lezioniCompletate = JSON.parse(localStorage.getItem('lezioniCompletate')) || [];
  
  if (!lezioniCompletate.includes(lezioneId)) {
    lezioniCompletate.push(lezioneId);
    localStorage.setItem('lezioniCompletate', JSON.stringify(lezioniCompletate));
    aggiornaInterfaccia();
  }
}

function aggiornaInterfaccia() {
  const lezioniCompletate = JSON.parse(localStorage.getItem('lezioniCompletate')) || [];
  
  // Aggiunge un indicatore visivo alle lezioni completate
  document.querySelectorAll('.lezioni-lista li').forEach(item => {
    const lezioneId = item.querySelector('a').getAttribute('href');
    if (lezioniCompletate.includes(lezioneId)) {
      item.classList.add('completata');
    }
  });
}

// Aggiorna l'interfaccia al caricamento della pagina
document.addEventListener('DOMContentLoaded', aggiornaInterfaccia);