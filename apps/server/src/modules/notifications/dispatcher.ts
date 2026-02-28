import { getDb } from '../../db/index.ts';
import { users } from '../../db/schema.ts';
import { eq } from 'drizzle-orm';
import { NotificationService, type Channel } from './service.ts';
import webpush from 'web-push';

// Lazy-init VAPID — only set once
let vapidReady = false;
function ensureVapid() {
  if (vapidReady) return;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const mailto = process.env.VAPID_MAILTO ?? 'mailto:admin@wos.local';
  if (pub && priv) {
    webpush.setVapidDetails(mailto, pub, priv);
    vapidReady = true;
  }
}

export class NotificationDispatcher {
  private svc = new NotificationService();

  async dispatch(params: {
    userId: string;
    channels: Channel[];
    type: 'event_reminder' | 'giftcode' | 'announcement' | 'system';
    eventId?: string | null;
    title: string;
    body: string;
  }) {
    const db = getDb();
    const [user] = await db.select().from(users).where(eq(users.id, params.userId));
    if (!user) return;

    for (const ch of params.channels) {
      // Always log in-app
      await this.svc.create({
        userId: params.userId, eventId: params.eventId,
        type: params.type, channel: ch,
        title: params.title, body: params.body,
      });

      switch (ch) {
        case 'discord':
          if (user.discordWebhook) await this.sendDiscord(user.discordWebhook, params.title, params.body);
          break;
        case 'telegram':
          if (user.telegramChatId) await this.sendTelegram(user.telegramChatId, params.title, params.body);
          break;
        case 'email':
          if (user.notifyEmail) await this.sendEmail(user.notifyEmail, params.title, params.body);
          break;
        case 'push':
          await this.sendWebPush(params.userId, params.title, params.body);
          break;
      }
    }
  }

  private async sendDiscord(webhook: string, title: string, body: string) {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [{ title, description: body, color: 0x5865f2, timestamp: new Date().toISOString() }] }),
    }).catch(e => console.error('[Discord]', e));
  }

  private async sendTelegram(chatId: string, title: string, body: string) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) { console.warn('[Telegram] TELEGRAM_BOT_TOKEN not set'); return; }
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: `*${title}*\n\n${body}`, parse_mode: 'Markdown' }),
    }).catch(e => console.error('[Telegram]', e));
  }

  private async sendEmail(_to: string, _title: string, _body: string) {
    // Email transport is pluggable — log for now; integrate nodemailer/resend as needed
    console.log(`[Email] To: ${_to} | ${_title}`);
  }

  /**
   * Web Push — server pushes to idle browser/PWA.
   * The service worker wakes up and shows the notification.
   * Zero battery drain on the client (no polling).
   */
  private async sendWebPush(userId: string, title: string, body: string) {
    ensureVapid();
    if (!vapidReady) return;
    const subs = await this.svc.getPushSubscriptions(userId);
    const payload = JSON.stringify({ title, body, timestamp: Date.now() });
    for (const sub of subs) {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
        { TTL: 60 * 60 }, // 1h TTL — if device is offline, retry for 1h
      ).catch(async (e: { statusCode?: number }) => {
        if (e?.statusCode === 410 || e?.statusCode === 404) {
          // Subscription expired — clean up
          await this.svc.removePushSubscription(sub.endpoint);
        } else {
          console.error('[WebPush]', e);
        }
      });
    }
  }
}
