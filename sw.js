// Service worker: fa funzionare il gioco anche offline.
//
// Tutti i file del gioco vengono salvati in una cache che porta il numero di
// versione. Quando esce una versione nuova, quella vecchia resta in uso finché
// il giocatore non tocca "Nuova versione disponibile — tocca per aggiornare".
//
// VERSION e FILES non si scrivono a mano: li aggiorna `node tools/versione.js`
// (un test controlla che siano aggiornati).

// <versione>
const VERSION = 'f06c89288f06';
const FILES = [
  './',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/icon.svg',
  './index.html',
  './manifest.webmanifest',
  './src/config.js',
  './src/engine/board.js',
  './src/engine/game.js',
  './src/engine/match.js',
  './src/engine/moves.js',
  './src/engine/resolve.js',
  './src/engine/rng.js',
  './src/engine/specials.js',
  './src/levels/levels.js',
  './src/main.js',
  './src/storage.js',
  './src/strings.js',
  './src/ui/dom.js',
  './src/ui/hud.js',
  './src/ui/input.js',
  './src/ui/pieces.js',
  './src/ui/render.js',
  './src/ui/screens.js',
  './src/ui/update.js',
  './styles.css',
];
// </versione>

const PREFIX = 'trisdidolci-';
const CACHE = PREFIX + VERSION;

self.addEventListener('install', (event) => {
  // { cache: 'reload' } salta la cache del browser: si scaricano i file davvero nuovi.
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(FILES.map((file) => new Request(file, { cache: 'reload' }))))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith(PREFIX) && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

// La pagina chiede di passare subito alla versione nuova.
self.addEventListener('message', (event) => {
  if (event.data === 'aggiorna') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request, { ignoreSearch: true });
      if (cached) return cached;
      try {
        return await fetch(request);
      } catch (error) {
        // Offline: per le pagine si torna sempre al gioco.
        if (request.mode === 'navigate') {
          const page = await cache.match('./index.html');
          if (page) return page;
        }
        throw error;
      }
    })
  );
});
