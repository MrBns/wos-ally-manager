import { api } from './client.js';

export type NotificationChannel = 'discord' | 'telegram' | 'inapp' | 'email' | 'push';

export interface InAppNotification {
  id: string;
  userId: string;
  eventId?: string | null;
  type: 'event_reminder' | 'giftcode' | 'announcement' | 'system';
  channel: NotificationChannel;
  title: string;
  body: string;
  read: boolean;
  sentAt: string;
}

export interface GlobalPref {
  id: string;
  userId: string;
  channel: NotificationChannel;
  enabled: boolean;
}

export interface EventPref {
  id: string;
  userId: string;
  eventId: string;
  channel: NotificationChannel;
  enabled: boolean;
  notifyAt10Min: boolean;
  notifyAt5Min: boolean;
  notifyAtStart: boolean;
  customMinutesBefore?: number | null;
}

export async function getNotifications(unread = false) {
  return api.get<InAppNotification[]>(`/api/notifications${unread ? '?unread=true' : ''}`);
}

export async function markRead(id: string) {
  return api.patch(`/api/notifications/${id}/read`);
}

export async function markAllRead() {
  return api.post('/api/notifications/read-all');
}

export async function getGlobalPrefs() {
  return api.get<GlobalPref[]>('/api/notifications/preferences/global');
}

export async function setGlobalPref(channel: NotificationChannel, enabled: boolean) {
  return api.put('/api/notifications/preferences/global', { channel, enabled });
}

export async function getEventPrefs() {
  return api.get<EventPref[]>('/api/notifications/preferences/events');
}

export async function setEventPref(data: {
  eventId: string; channel: NotificationChannel; enabled: boolean;
  notifyAt10Min?: boolean; notifyAt5Min?: boolean; notifyAtStart?: boolean;
  customMinutesBefore?: number | null;
}) {
  return api.put('/api/notifications/preferences/events', data);
}

// ── Web Push ─────────────────────────────────────────────────────────────────

export async function getVapidPublicKey(): Promise<string | null> {
  try {
    const key = await api.get<string>('/api/notifications/push/vapid-public-key');
    return key;
  } catch {
    return null;
  }
}

export async function subscribeToPush(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
  try {
    const vapidKey = await getVapidPublicKey();
    if (!vapidKey) return false;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) return true; // already subscribed

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey),
    });
    const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
    await api.post('/api/notifications/push/subscribe', {
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    });
    return true;
  } catch (e) {
    console.error('[Push] Subscribe failed', e);
    return false;
  }
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return;
  await api.delete('/api/notifications/push/subscribe');
  await sub.unsubscribe();
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
