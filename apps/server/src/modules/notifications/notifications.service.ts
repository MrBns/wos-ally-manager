import { and, eq } from 'drizzle-orm';
import { getDb } from '../../shared/db.js';
import {
  notifications, globalNotificationPrefs, eventNotificationPrefs,
  type Notification,
} from '../../shared/schema.js';
import { generateId } from '../../shared/id.js';
import { notFound } from '../../shared/errors.js';

export type NotificationChannel = 'discord' | 'telegram' | 'inapp' | 'email';

export class NotificationsService {
  private get db() { return getDb(); }

  async getNotifications(userId: string, unreadOnly = false) {
    const all = await this.db.select().from(notifications).where(
      unreadOnly
        ? and(eq(notifications.userId, userId), eq(notifications.read, false))
        : eq(notifications.userId, userId)
    );
    return all;
  }

  async markRead(userId: string, notificationId: string): Promise<void> {
    await this.db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  }

  async markAllRead(userId: string): Promise<void> {
    await this.db.update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  async createNotification(data: {
    userId: string;
    eventId?: string | null;
    type: 'event_reminder' | 'giftcode' | 'announcement' | 'system';
    channel: NotificationChannel;
    title: string;
    body: string;
  }): Promise<Notification> {
    const id = generateId();
    const now = new Date().toISOString();
    const [n] = await this.db.insert(notifications).values({
      id,
      userId: data.userId,
      eventId: data.eventId ?? null,
      type: data.type,
      channel: data.channel,
      title: data.title,
      body: data.body,
      sentAt: now,
    }).returning();
    return n;
  }

  async getGlobalPrefs(userId: string) {
    return this.db.select().from(globalNotificationPrefs).where(eq(globalNotificationPrefs.userId, userId));
  }

  async setGlobalPref(userId: string, data: { channel: NotificationChannel; enabled: boolean }) {
    const existing = await this.db.select().from(globalNotificationPrefs)
      .where(and(eq(globalNotificationPrefs.userId, userId), eq(globalNotificationPrefs.channel, data.channel)));
    const now = new Date().toISOString();
    if (existing.length > 0) {
      const [updated] = await this.db.update(globalNotificationPrefs)
        .set({ enabled: data.enabled, updatedAt: now })
        .where(and(eq(globalNotificationPrefs.userId, userId), eq(globalNotificationPrefs.channel, data.channel)))
        .returning();
      return updated;
    } else {
      const [created] = await this.db.insert(globalNotificationPrefs)
        .values({ id: generateId(), userId, channel: data.channel, enabled: data.enabled, updatedAt: now })
        .returning();
      return created;
    }
  }

  async getEventPrefs(userId: string) {
    return this.db.select().from(eventNotificationPrefs).where(eq(eventNotificationPrefs.userId, userId));
  }

  async setEventPref(userId: string, data: {
    eventId: string;
    channel: NotificationChannel;
    enabled: boolean;
    notifyAt10Min?: boolean;
    notifyAt5Min?: boolean;
    notifyAtStart?: boolean;
    customMinutesBefore?: number | null;
  }) {
    const existing = await this.db.select().from(eventNotificationPrefs)
      .where(and(
        eq(eventNotificationPrefs.userId, userId),
        eq(eventNotificationPrefs.eventId, data.eventId),
        eq(eventNotificationPrefs.channel, data.channel),
      ));
    const now = new Date().toISOString();
    const values = {
      userId,
      eventId: data.eventId,
      channel: data.channel,
      enabled: data.enabled,
      notifyAt10Min: data.notifyAt10Min ?? true,
      notifyAt5Min: data.notifyAt5Min ?? true,
      notifyAtStart: data.notifyAtStart ?? true,
      customMinutesBefore: data.customMinutesBefore ?? null,
      updatedAt: now,
    };
    if (existing.length > 0) {
      const [updated] = await this.db.update(eventNotificationPrefs).set(values)
        .where(and(
          eq(eventNotificationPrefs.userId, userId),
          eq(eventNotificationPrefs.eventId, data.eventId),
          eq(eventNotificationPrefs.channel, data.channel),
        )).returning();
      return updated;
    } else {
      const [created] = await this.db.insert(eventNotificationPrefs)
        .values({ id: generateId(), ...values }).returning();
      return created;
    }
  }

  /** Get user IDs that should be notified for an event at a given offset */
  async getUsersToNotify(eventId: string, minutesBefore: number): Promise<{
    userId: string;
    channels: NotificationChannel[];
  }[]> {
    const db = this.db;
    // Get all event prefs for this event that are enabled
    const eventPrefs = await db.select().from(eventNotificationPrefs)
      .where(and(eq(eventNotificationPrefs.eventId, eventId), eq(eventNotificationPrefs.enabled, true)));
    
    // Group by userId
    const byUser = new Map<string, Set<NotificationChannel>>();
    for (const pref of eventPrefs) {
      const shouldNotify =
        (minutesBefore === 10 && pref.notifyAt10Min) ||
        (minutesBefore === 5 && pref.notifyAt5Min) ||
        (minutesBefore === 0 && pref.notifyAtStart) ||
        (pref.customMinutesBefore !== null && pref.customMinutesBefore === minutesBefore);
      if (!shouldNotify) continue;

      // Check global pref for this channel
      const [globalPref] = await db.select().from(globalNotificationPrefs)
        .where(and(
          eq(globalNotificationPrefs.userId, pref.userId),
          eq(globalNotificationPrefs.channel, pref.channel),
        ));
      // If global pref exists and is disabled, skip
      if (globalPref && !globalPref.enabled) continue;

      if (!byUser.has(pref.userId)) byUser.set(pref.userId, new Set());
      byUser.get(pref.userId)!.add(pref.channel as NotificationChannel);
    }

    return Array.from(byUser.entries()).map(([userId, channels]) => ({
      userId,
      channels: Array.from(channels),
    }));
  }
}
