// Bump VERSION on every release. A new version waits until the user taps "Update" in the app.
const VERSION = '1.3.4';
const CACHE = 'word-shooter-' + VERSION;
const FILES = [
  './', 'index.html', 'css/style.css',
  'js/main.js', 'js/game.js', 'js/fx.js', 'js/mathstats.js', 'js/players.js', 'js/audio.js', 'js/i18n.js',
  'lang/en.json', 'words/sv.json',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('word-shooter-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request)));
});

self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'GET_VERSION') e.ports[0]?.postMessage(VERSION);
});
