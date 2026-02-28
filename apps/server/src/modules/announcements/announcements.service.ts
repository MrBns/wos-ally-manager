import { eq } from 'drizzle-orm';
import { getDb } from '../../shared/db.js';
import { announcements, users, notifications, type Announcement } from '../../shared/schema.js';
import { generateId } from '../../shared/id.js';
import { NotificationDispatcher } from '../notifications/notification-dispatcher.js';

export class AnnouncementsService {
  private dispatcher = new NotificationDispatcher();
  private get db() { return getDb(); }

  async listAnnouncements(): Promise<Announcement[]> {
    return this.db.select().from(announcements).orderBy(announcements.createdAt);
  }

  async createAnnouncement(data: { title: string; body: string; authorId: string }): Promise<Announcement> {
    const id = generateId();
    const now = new Date().toISOString();
    const [item] = await this.db.insert(announcements)
      .values({ id, title: data.title, body: data.body, authorId: data.authorId, createdAt: now })
      .returning();
    return item;
  }

  async broadcastAnnouncement(announcement: Announcement): Promise<void> {
    const allUsers = await this.db.select().from(users);
    console.log(`[Announcements] Broadcasting to ${allUsers.length} users`);

    for (const user of allUsers) {
      // Create in-app notification for every user
      await this.db.insert(notifications).values({
        id: generateId(),
        userId: user.id,
        eventId: null,
        type: 'announcement',
        channel: 'inapp',
        title: `📢 ${announcement.title}`,
        body: announcement.body,
        read: false,
        sentAt: new Date().toISOString(),
      });

      // Also send via Discord webhook if configured
      if (user.discordWebhook) {
        await this.dispatcher.dispatch({
          userIds: [user.id],
          channels: ['discord'],
          type: 'announcement',
          title: `📢 ${announcement.title}`,
          body: announcement.body,
        }).catch(console.error);
      }

      // Also send via Telegram if configured
      if (user.telegramChatId) {
        await this.dispatcher.dispatch({
          userIds: [user.id],
          channels: ['telegram'],
          type: 'announcement',
          title: `📢 ${announcement.title}`,
          body: announcement.body,
        }).catch(console.error);
      }
    }
  }

  async deleteAnnouncement(id: string): Promise<void> {
    await this.db.delete(announcements).where(eq(announcements.id, id));
  }
}
