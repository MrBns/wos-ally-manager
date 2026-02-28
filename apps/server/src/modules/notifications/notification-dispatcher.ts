import { getDb } from '../../shared/db.js';
import { users } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { NotificationsService, type NotificationChannel } from './notifications.service.js';

export class NotificationDispatcher {
  private svc = new NotificationsService();

  async dispatch(params: {
    userIds: string[];
    channels: NotificationChannel[];
    type: 'event_reminder' | 'giftcode' | 'announcement' | 'system';
    eventId?: string | null;
    title: string;
    body: string;
  }) {
    for (const userId of params.userIds) {
      for (const channel of params.channels) {
        await this.sendToChannel(userId, channel, params.type, params.eventId ?? null, params.title, params.body);
      }
    }
  }

  private async sendToChannel(
    userId: string,
    channel: NotificationChannel,
    type: 'event_reminder' | 'giftcode' | 'announcement' | 'system',
    eventId: string | null,
    title: string,
    body: string
  ) {
    // Always create in-app notification record
    await this.svc.createNotification({ userId, eventId, type, channel: 'inapp', title, body });

    // Get user details for external channels
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) return;

    switch (channel) {
      case 'discord':
        if (user.discordWebhook) {
          await this.sendDiscord(user.discordWebhook, title, body).catch(console.error);
        }
        break;
      case 'telegram':
        if (user.telegramChatId) {
          await this.sendTelegram(user.telegramChatId, title, body).catch(console.error);
        }
        break;
      case 'email':
        if (user.email) {
          // Email sending would be implemented with an email service
          console.log(`[Email] To: ${user.email} | ${title}: ${body}`);
        }
        break;
      case 'inapp':
        // Already saved above
        break;
    }
  }

  private async sendDiscord(webhookUrl: string, title: string, body: string) {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title,
          description: body,
          color: 0x5865F2,
          timestamp: new Date().toISOString(),
        }],
      }),
    });
    if (!response.ok) {
      console.error(`Discord webhook failed: ${response.status}`);
    }
  }

  private async sendTelegram(chatId: string, title: string, body: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
      console.warn('[Telegram] TELEGRAM_BOT_TOKEN not set');
      return;
    }
    const text = `*${title}*\n\n${body}`;
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    });
    if (!response.ok) {
      console.error(`Telegram send failed: ${response.status}`);
    }
  }
}
