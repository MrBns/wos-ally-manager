import cron from 'node-cron';
import { getDb } from '../../shared/db.js';
import { events } from '../../shared/schema.js';
import { NotificationsService } from './notifications.service.js';
import { NotificationDispatcher } from './notification-dispatcher.js';

/**
 * Notification Scheduler
 *
 * Runs every minute to check if any events need notifications sent.
 * For each active event, calculates if the current time matches:
 *   - 10 minutes before start
 *   - 5 minutes before start
 *   - At start
 *   - Custom minutes before start
 *
 * All times are in UTC.
 */
export class NotificationScheduler {
  private svc = new NotificationsService();
  private dispatcher = new NotificationDispatcher();
  private task: cron.ScheduledTask | null = null;

  start() {
    // Run every minute
    this.task = cron.schedule('* * * * *', async () => {
      await this.checkAndSendNotifications();
    });
    console.log('[NotificationScheduler] Started — checking every minute');
  }

  stop() {
    this.task?.stop();
    console.log('[NotificationScheduler] Stopped');
  }

  private async checkAndSendNotifications() {
    const now = new Date();
    const db = getDb();
    const allEvents = await db.select().from(events);
    const activeEvents = allEvents.filter(e => e.isActive);

    for (const event of activeEvents) {
      const offsets = [0, 5, 10]; // minutes before to notify

      for (const offsetMin of offsets) {
        const notifyTime = this.getEventNotifyTime(event.dayOfWeek, event.startTime, offsetMin);
        if (!notifyTime) continue;

        if (this.isWithinCurrentMinute(now, notifyTime)) {
          await this.triggerEventNotifications(event, offsetMin);
        }
      }

      // Also check for custom preferences — get unique customMinutesBefore values
      await this.checkCustomOffsets(event, now);
    }
  }

  private getEventNotifyTime(dayOfWeek: number, startTime: string, minutesBefore: number): Date | null {
    const [hours, minutes] = startTime.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return null;

    const now = new Date();
    // Find the next occurrence of this event's dayOfWeek
    const currentDay = now.getUTCDay();
    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil < 0) daysUntil += 7;

    const eventDate = new Date(Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysUntil,
      hours,
      minutes,
      0,
      0
    ));

    const notifyTime = new Date(eventDate.getTime() - minutesBefore * 60 * 1000);
    return notifyTime;
  }

  private isWithinCurrentMinute(now: Date, target: Date): boolean {
    // Check if the target time falls within the current minute window
    const nowMs = now.getTime();
    const targetMs = target.getTime();
    const diffMs = Math.abs(nowMs - targetMs);
    return diffMs < 60 * 1000; // within 1 minute
  }

  private async triggerEventNotifications(event: { id: string; name: string; startTime: string }, minutesBefore: number) {
    const usersToNotify = await this.svc.getUsersToNotify(event.id, minutesBefore);

    if (usersToNotify.length === 0) return;

    const title = minutesBefore === 0
      ? `🎯 ${event.name} has started!`
      : `⏰ ${event.name} starts in ${minutesBefore} minutes`;

    const body = minutesBefore === 0
      ? `The event "${event.name}" is starting now at ${event.startTime} UTC.`
      : `The event "${event.name}" starts at ${event.startTime} UTC (${minutesBefore} minutes from now).`;

    for (const { userId, channels } of usersToNotify) {
      await this.dispatcher.dispatch({
        userIds: [userId],
        channels,
        type: 'event_reminder',
        eventId: event.id,
        title,
        body,
      });
    }

    console.log(`[Scheduler] Sent notifications for event "${event.name}" (${minutesBefore}min before) to ${usersToNotify.length} users`);
  }

  private async checkCustomOffsets(event: { id: string; name: string; startTime: string; dayOfWeek: number }, now: Date) {
    const { eventNotificationPrefs } = await import('../../shared/schema.js');
    const { and, eq, isNotNull } = await import('drizzle-orm');
    const db = getDb();

    const customPrefs = await db.select().from(eventNotificationPrefs)
      .where(and(
        eq(eventNotificationPrefs.eventId, event.id),
        eq(eventNotificationPrefs.enabled, true),
        isNotNull(eventNotificationPrefs.customMinutesBefore),
      ));

    const uniqueOffsets = [...new Set(customPrefs.map(p => p.customMinutesBefore!))];

    for (const offset of uniqueOffsets) {
      const notifyTime = this.getEventNotifyTime(event.dayOfWeek, event.startTime, offset);
      if (notifyTime && this.isWithinCurrentMinute(now, notifyTime)) {
        await this.triggerEventNotifications(event, offset);
      }
    }
  }
}
