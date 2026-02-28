import { and, eq } from 'drizzle-orm';
import { getDb } from '../../db/index.ts';
import {
  notifications, globalNotifPrefs, eventNotifPrefs,
  pushSubscriptions,
} from '../../db/schema.ts';
import { generateId } from '../../shared/id.ts';

export type Channel = 'discord' | 'telegram' | 'inapp' | 'email' | 'push';

export class NotificationService {
  private get db() { return getDb(); }

  // ── In-app notification log ──────────────────────────────────────────────

  async list(userId: string, unreadOnly = false) {
    const rows = await this.db.select().from(notifications)
      .where(unreadOnly
        ? and(eq(notifications.userId, userId), eq(notifications.read, false))
        : eq(notifications.userId, userId))
      .orderBy(notifications.sentAt);
    return rows.reverse(); // newest first
  }

  async create(data: {
    userId: string; eventId?: string | null; type: typeof notifications.$inferInsert['type'];
    channel: Channel; title: string; body: string;
  }) {
    const [row] = await this.db.insert(notifications).values({
      id: generateId(), ...data, eventId: data.eventId ?? null,
    }).returning();
    return row;
  }

  async markRead(userId: string, id: string) {
    await this.db.update(notifications).set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
  }

  async markAllRead(userId: string) {
    await this.db.update(notifications).set({ read: true })
      .where(eq(notifications.userId, userId));
  }

  // ── Global prefs ────────────────────────────────────────────────────────

  async getGlobalPrefs(userId: string) {
    return this.db.select().from(globalNotifPrefs).where(eq(globalNotifPrefs.userId, userId));
  }

  async setGlobalPref(userId: string, channel: Channel, enabled: boolean) {
    const now = new Date().toISOString();
    await this.db.insert(globalNotifPrefs)
      .values({ id: generateId(), userId, channel, enabled, updatedAt: now })
      .onConflictDoUpdate({
        target: [globalNotifPrefs.userId, globalNotifPrefs.channel],
        set: { enabled, updatedAt: now },
      });
  }

  // ── Per-event prefs ──────────────────────────────────────────────────────

  async getEventPrefs(userId: string) {
    return this.db.select().from(eventNotifPrefs).where(eq(eventNotifPrefs.userId, userId));
  }

  async setEventPref(userId: string, data: {
    eventId: string; channel: Channel; enabled: boolean;
    notifyAt10Min?: boolean; notifyAt5Min?: boolean; notifyAtStart?: boolean;
    customMinutesBefore?: number | null;
  }) {
    const now = new Date().toISOString();
    await this.db.insert(eventNotifPrefs).values({
      id: generateId(), userId, ...data,
      notifyAt10Min: data.notifyAt10Min ?? true,
      notifyAt5Min: data.notifyAt5Min ?? true,
      notifyAtStart: data.notifyAtStart ?? true,
      customMinutesBefore: data.customMinutesBefore ?? null,
      updatedAt: now,
    }).onConflictDoUpdate({
      target: [eventNotifPrefs.userId, eventNotifPrefs.eventId, eventNotifPrefs.channel],
      set: {
        enabled: data.enabled,
        notifyAt10Min: data.notifyAt10Min ?? true,
        notifyAt5Min: data.notifyAt5Min ?? true,
        notifyAtStart: data.notifyAtStart ?? true,
        customMinutesBefore: data.customMinutesBefore ?? null,
        updatedAt: now,
      },
    });
  }

  // ── Push subscriptions ───────────────────────────────────────────────────

  async savePushSubscription(userId: string, sub: { endpoint: string; p256dh: string; auth: string }) {
    await this.db.insert(pushSubscriptions).values({
      id: generateId(), userId, ...sub,
    }).onConflictDoUpdate({
      target: [pushSubscriptions.endpoint],
      set: { userId, p256dh: sub.p256dh, auth: sub.auth },
    });
  }

  async removePushSubscription(endpoint: string) {
    await this.db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  }

  async getPushSubscriptions(userId: string) {
    return this.db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
  }

  // ── Resolve who gets notified for an event at offset ────────────────────

  async getUsersToNotify(eventId: string, minutesBefore: number): Promise<
    { userId: string; channels: Channel[] }[]
  > {
    const prefs = await this.db.select().from(eventNotifPrefs)
      .where(and(eq(eventNotifPrefs.eventId, eventId), eq(eventNotifPrefs.enabled, true)));

    const byUser = new Map<string, Set<Channel>>();

    for (const pref of prefs) {
      const shouldNotify =
        (minutesBefore === 10 && pref.notifyAt10Min) ||
        (minutesBefore === 5  && pref.notifyAt5Min)  ||
        (minutesBefore === 0  && pref.notifyAtStart) ||
        (pref.customMinutesBefore !== null && pref.customMinutesBefore === minutesBefore);
      if (!shouldNotify) continue;

      // Check global opt-out
      const global = await this.db.select().from(globalNotifPrefs)
        .where(and(
          eq(globalNotifPrefs.userId, pref.userId),
          eq(globalNotifPrefs.channel, pref.channel),
        ));
      if (global.length > 0 && !global[0].enabled) continue;

      if (!byUser.has(pref.userId)) byUser.set(pref.userId, new Set());
      byUser.get(pref.userId)!.add(pref.channel as Channel);
    }

    return [...byUser.entries()].map(([userId, channels]) => ({ userId, channels: [...channels] }));
  }
}
