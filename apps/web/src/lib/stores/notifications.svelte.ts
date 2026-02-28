import type { InAppNotification } from '../api/notifications.js';
import { getNotifications, markAllRead as apiMarkAllRead } from '../api/notifications.js';

/** Tell the service worker to update the OS app badge — zero battery cost */
function syncBadge(count: number) {
  if (typeof window === 'undefined') return;
  navigator.serviceWorker?.controller?.postMessage({ type: 'SET_BADGE', count });
}

function createNotificationsStore() {
  let items = $state<InAppNotification[]>([]);
  let loading = $state(false);

  async function load(unreadOnly = false) {
    loading = true;
    try {
      items = await getNotifications(unreadOnly);
      syncBadge(items.filter(n => !n.read).length);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      loading = false;
    }
  }

  async function markAllRead() {
    await apiMarkAllRead();
    items = items.map(n => ({ ...n, read: true }));
    syncBadge(0);
  }

  return {
    get items() { return items; },
    get loading() { return loading; },
    get unreadCount() { return items.filter(n => !n.read).length; },
    load,
    markAllRead,
  };
}

export const notificationsStore = createNotificationsStore();
