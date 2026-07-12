self.addEventListener('push', function (event) {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'Naskar Motors', {
      body: data.body || '',
      icon: data.icon || '/icon.png',
      badge: '/badge.png',
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow('/admin'));
});
