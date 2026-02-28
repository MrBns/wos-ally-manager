import cron from 'node-cron';
import { getDb } from '../../db/index.ts';
import { events } from '../../db/schema.ts';
import { NotificationService } from './service.ts';
import { NotificationDispatcher } from './dispatcher.ts';

export class NotificationScheduler {
  private svc = new NotificationService();
  private dispatcher = new NotificationDispatcher();
  private task: cron.ScheduledTask | null = null;

  start() {
    // Run every minute — lightweight, 60s resolution is enough
    this.task = cron.schedule('* * * * *', () => this.tick().catch(console.error));
    console.log('[Scheduler] Started');
  }

  stop() {
    this.task?.stop();
    console.log('[Scheduler] Stopped');
  }

  private async tick() {
    const now = new Date();
    const db = getDb();
    const allEvents = await db.select().from(events);

    for (const event of allEvents.filter(e => e.isActive)) {
      const [h, m] = event.startTime.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) continue;

      for (const offsetMin of this.getOffsetsForEvent(event.id, allEvents)) {
        const target = this.nextOccurrence(event.dayOfWeek, h, m, now);
        const notifyAt = new Date(target.getTime() - offsetMin * 60_000);

        if (this.matchesCurrentMinute(now, notifyAt)) {
          await this.fire(event, offsetMin);
        }
      }
    }
  }

  // Standard offsets — always check 0, 5, 10
  private getOffsetsForEvent(_id: string, _all: unknown[]): number[] {
    return [0, 5, 10];
    // Custom offsets per user are handled inside getUsersToNotify()
  }

  /** Next UTC occurrence of dayOfWeek + HH:MM from now */
  private nextOccurrence(dow: number, h: number, m: number, from: Date): Date {
    let daysUntil = dow - from.getUTCDay();
    if (daysUntil < 0) daysUntil += 7;
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate() + daysUntil, h, m, 0, 0));
    // If same day but time already passed, push to next week
    if (d.getTime() <= from.getTime()) d.setUTCDate(d.getUTCDate() + 7);
    return d;
  }

  private matchesCurrentMinute(now: Date, target: Date): boolean {
    // True if target falls within the current clock-minute window
    const nowMin = Math.floor(now.getTime() / 60_000);
    const targetMin = Math.floor(target.getTime() / 60_000);
    return nowMin === targetMin;
  }

  private async fire(event: typeof events.$inferSelect, offsetMin: number) {
    const targets = await this.svc.getUsersToNotify(event.id, offsetMin);
    if (targets.length === 0) return;

    const title = offsetMin === 0
      ? `🎯 ${event.name} is starting now!`
      : `⏰ ${event.name} in ${offsetMin} min`;
    const body = offsetMin === 0
      ? `The event "${event.name}" has just started (${event.startTime} UTC).`
      : `"${event.name}" starts at ${event.startTime} UTC — ${offsetMin} minutes to go.`;

    for (const { userId, channels } of targets) {
      await this.dispatcher.dispatch({ userId, channels, type: 'event_reminder', eventId: event.id, title, body });
    }

    console.log(`[Scheduler] Fired "${event.name}" (${offsetMin}min) → ${targets.length} users`);
  }
}
