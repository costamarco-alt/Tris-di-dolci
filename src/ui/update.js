// Registra il service worker (gioco offline) e avvisa quando c'è una versione nuova.

// onUpdateReady(applica): chiamato quando una versione nuova è pronta;
// chiamando applica() il gioco si aggiorna e la pagina si ricarica.
export function registerUpdates(onUpdateReady) {
  if (!('serviceWorker' in navigator)) return;
  const sw = navigator.serviceWorker;
  const hadController = Boolean(sw.controller);
  let reloading = false;

  // Quando la versione nuova prende il controllo, si ricarica una volta sola.
  sw.addEventListener('controllerchange', () => {
    if (!hadController || reloading) return;
    reloading = true;
    location.reload();
  });

  sw.register('./sw.js')
    .then((registration) => {
      const notify = () => {
        // "waiting" con un controller attivo = aggiornamento pronto (non la prima installazione).
        if (registration.waiting && sw.controller) {
          onUpdateReady(() => registration.waiting?.postMessage('aggiorna'));
        }
      };
      notify();
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') notify();
        });
      });
      // Tornando sul gioco si controlla se è uscita una versione nuova.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') registration.update().catch(() => {});
      });
    })
    .catch(() => {
      // Senza service worker il gioco funziona lo stesso, solo non offline.
    });
}
