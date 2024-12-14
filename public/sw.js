// sw.js

self.addEventListener('install', function(event) {

    event.waitUntil(

        caches.open('my-cache').then(function(cache) {

            return cache.addAll([

                '/',

                '/index.html',

                '/script.js',

                '/style.css'

            ]);

        })

    );

});

self.addEventListener('fetch', function(event) {

    event.respondWith(

        caches.match(event.request).then(function(response) {

            return response || fetch(event.request);

        })

    );

});

self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Default Title';
    const body = data.body || 'Default Body';
  
    event.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: './favicon.png',
      })
    );
});
  

navigator.serviceWorker.getRegistration().then(registration => {
    if (registration) {
        registration.update();
    }
});

self.addEventListener('activate', event => {
    event.waitUntil(clients.claim());
});

// navigator.serviceWorker.getRegistration().then(registration => {
//     if (registration) {
//         registration.unregister().then(() => {
//             console.log('Service Worker unregistered');
//         });
//     }
// });
