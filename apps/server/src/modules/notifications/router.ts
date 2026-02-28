import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import * as v from 'valibot';
import { requireAuth, type AuthEnv } from '../../shared/middleware.ts';
import { NotificationService } from './service.ts';

const Channel = v.picklist(['discord','telegram','inapp','email','push']);

export function notificationsRouter() {
  const r = new Hono<AuthEnv>();
  const svc = new NotificationService();

  r.get('/', requireAuth, async (c) => {
    const unread = c.req.query('unread') === 'true';
    return c.json({ data: await svc.list(c.get('user').id, unread) });
  });

  r.patch('/:id/read', requireAuth, async (c) => {
    await svc.markRead(c.get('user').id, c.req.param('id'));
    return c.json({ success: true });
  });

  r.post('/read-all', requireAuth, async (c) => {
    await svc.markAllRead(c.get('user').id);
    return c.json({ success: true });
  });

  // Global prefs
  r.get('/prefs/global', requireAuth, async (c) => {
    return c.json({ data: await svc.getGlobalPrefs(c.get('user').id) });
  });

  r.put('/prefs/global', requireAuth, vValidator('json', v.object({ channel: Channel, enabled: v.boolean() })), async (c) => {
    const { channel, enabled } = c.req.valid('json');
    await svc.setGlobalPref(c.get('user').id, channel, enabled);
    return c.json({ success: true });
  });

  // Per-event prefs
  r.get('/prefs/events', requireAuth, async (c) => {
    return c.json({ data: await svc.getEventPrefs(c.get('user').id) });
  });

  r.put('/prefs/events', requireAuth, vValidator('json', v.object({
    eventId: v.pipe(v.string(), v.minLength(1)),
    channel: Channel,
    enabled: v.boolean(),
    notifyAt10Min: v.optional(v.boolean(), true),
    notifyAt5Min: v.optional(v.boolean(), true),
    notifyAtStart: v.optional(v.boolean(), true),
    customMinutesBefore: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(1440)))),
  })), async (c) => {
    await svc.setEventPref(c.get('user').id, c.req.valid('json'));
    return c.json({ success: true });
  });

  // Web Push subscription management
  r.post('/push/subscribe', requireAuth, vValidator('json', v.object({
    endpoint: v.pipe(v.string(), v.url()),
    p256dh: v.pipe(v.string(), v.minLength(1)),
    auth: v.pipe(v.string(), v.minLength(1)),
  })), async (c) => {
    await svc.savePushSubscription(c.get('user').id, c.req.valid('json'));
    return c.json({ success: true });
  });

  r.delete('/push/subscribe', requireAuth, vValidator('json', v.object({ endpoint: v.string() })), async (c) => {
    await svc.removePushSubscription(c.req.valid('json').endpoint);
    return c.json({ success: true });
  });

  // VAPID public key — client needs this to subscribe
  r.get('/push/vapid-public-key', (c) => {
    const key = process.env.VAPID_PUBLIC_KEY ?? '';
    if (!key) return c.json({ error: 'Push not configured' }, 503);
    return c.json({ data: key });
  });

  return r;
}
