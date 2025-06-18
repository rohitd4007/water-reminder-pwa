const CACHE_NAME = 'water-reminder-v1';
const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/manifest.json',
    '/reminder-sound.mp3'
];

// Install event: cache files
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
    );
    self.skipWaiting();
});

// Fetch event: serve from cache
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => response || fetch(event.request))
    );
});

// Notification click action
self.addEventListener("notificationclick", function (event) {
    if (event.action === "confirm") {
        event.notification.close();
        self.clients.matchAll().then(clients => {
            clients.forEach(client => {
                // Send message to stop sound immediately
                client.postMessage({ type: "STOP_SOUND" });
                // Send message to confirm user drank water after a small delay
                setTimeout(() => {
                    client.postMessage({ type: "DRANK_CONFIRMED" });
                }, 100);
            });
        });
    } else {
        event.notification.close();
    }
});