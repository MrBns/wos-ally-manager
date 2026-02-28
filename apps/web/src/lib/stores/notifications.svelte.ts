import type { InAppNotification } from '../api/notifications.js';
import { getNotifications, markAllRead as apiMarkAllRead } from '../api/notifications.js';

function createNotificationsStore() {
  let items = $state<InAppNotification[]>([]);
  let loading = $state(false);

  async function load(unread = false) {
    loading = true;
    try {
      items = await getNotifications(unread);
    } catch (e) {
      console.error('Failed to load notifications', e);
    } finally {
      loading = false;
    }
  }

  async function markAllRead() {
    await apiMarkAllRead();
    items = items.map(n => ({ ...n, read: true }));
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
