/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst, CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

// Injected by VitePWA at build time
const WB_MANIFEST = self.__WB_MANIFEST;
precacheAndRoute(WB_MANIFEST);
cleanupOutdatedCaches();

// ── App shell: SPA navigation → serve cached index.html ─────────────────────
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'pages',
      networkTimeoutSeconds: 3,
      plugins: [new CacheableResponsePlugin({ statuses: [200] })],
    })
  )
);

// ── API calls: network-first, short cache (5 min) ───────────────────────────
// IMPORTANT: We do NOT background-sync or poll. The server pushes to us.
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth/'),
  new NetworkFirst({
    cacheName: 'api',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 300 }),
      new CacheableResponsePlugin({ statuses: [200] }),
    ],
  })
);

// ── Static assets: stale-while-revalidate ───────────────────────────────────
registerRoute(
  ({ request }) => ['style', 'script', 'font'].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: 'assets',
    plugins: [new ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 86400 * 30 })],
  })
);

// ── Web Push: server sends a push event → show notification ─────────────────
// This is battery-safe: the OS delivers the push, no client polling needed.
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data: { title?: string; body?: string; url?: string } = {};
  try { data = event.data.json(); } catch { data = { title: 'WOS Ally', body: event.data.text() }; }

  const title = data.title ?? 'WOS Ally Manager';
  const options: NotificationOptions = {
    body: data.body ?? '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'wos-notification',
    renotify: true,
    data: { url: data.url ?? '/' },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click → focus/open the app ─────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data?.url as string) ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus().then(c => c.navigate(url));
      return self.clients.openWindow(url);
    })
  );
});

// ── Update badge with unread count (called by the app via postMessage) ───────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SET_BADGE' && 'setAppBadge' in self.navigator) {
    const count = Number(event.data.count) || 0;
    if (count > 0) self.navigator.setAppBadge(count).catch(() => {});
    else self.navigator.clearAppBadge().catch(() => {});
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
