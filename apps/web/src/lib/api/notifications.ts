import { api } from './client.js';

export type NotificationChannel = 'discord' | 'telegram' | 'inapp' | 'email';

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
