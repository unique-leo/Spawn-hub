// SpawnHub — Service Worker для Web Push
// Файл должен лежать в КОРНЕ сайта (например /sw-push.js), не в подпапке —
// иначе scope регистрации не покроет все страницы.

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Приходит push-событие от Supabase Edge Function (через web-push протокол).
// data — JSON вида { title, body, icon, url, tag }
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (e) {
    payload = { title: 'SpawnHub', body: event.data ? event.data.text() : '' };
  }

  const title = payload.title || 'SpawnHub';
  const options = {
    body: payload.body || '',
    icon: payload.icon || '/icon-192.png',
    badge: payload.badge || '/icon-192.png',
    tag: payload.tag || undefined,       // одинаковый tag схлопывает повторные уведомления по одному чату
    renotify: !!payload.tag,
    data: { url: payload.url || '/' },
    vibrate: [100, 50, 100],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Клик по уведомлению — открыть сайт на нужной странице, либо переключиться
// на уже открытую вкладку, если она есть, вместо дублирования вкладок.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data && event.notification.data.url ? event.notification.data.url : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.navigate(targetUrl).catch(() => {});
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
