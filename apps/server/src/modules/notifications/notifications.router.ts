import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import * as v from 'valibot';
import { requireAuth, type AuthEnv } from '../../shared/middleware.js';
import { NotificationsService } from './notifications.service.js';

const NotificationChannel = v.picklist(['discord', 'telegram', 'inapp', 'email']);

const GlobalPrefSchema = v.object({
  channel: NotificationChannel,
  enabled: v.boolean(),
});

const EventPrefSchema = v.object({
  eventId: v.pipe(v.string(), v.minLength(1)),
  channel: NotificationChannel,
  enabled: v.boolean(),
  notifyAt10Min: v.optional(v.boolean(), true),
  notifyAt5Min: v.optional(v.boolean(), true),
  notifyAtStart: v.optional(v.boolean(), true),
  customMinutesBefore: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1)))),
});

export function notificationsRouter() {
  const router = new Hono<AuthEnv>();
  const svc = new NotificationsService();

  // Get in-app notifications for current user
  router.get('/', requireAuth, async (c) => {
    const user = c.get('user');
    const unreadOnly = c.req.query('unread') === 'true';
    const items = await svc.getNotifications(user.id, unreadOnly);
    return c.json({ data: items });
  });

  // Mark notification as read
  router.patch('/:id/read', requireAuth, async (c) => {
    const user = c.get('user');
    const { id } = c.req.param();
    await svc.markRead(user.id, id);
    return c.json({ success: true });
  });

  // Mark all as read
  router.post('/read-all', requireAuth, async (c) => {
    const user = c.get('user');
    await svc.markAllRead(user.id);
    return c.json({ success: true });
  });

  // Get global notification preferences
  router.get('/preferences/global', requireAuth, async (c) => {
    const user = c.get('user');
    const prefs = await svc.getGlobalPrefs(user.id);
    return c.json({ data: prefs });
  });

  // Set global notification preference
  router.put('/preferences/global', requireAuth, vValidator('json', GlobalPrefSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const pref = await svc.setGlobalPref(user.id, body);
    return c.json({ data: pref });
  });

  // Get per-event preferences
  router.get('/preferences/events', requireAuth, async (c) => {
    const user = c.get('user');
    const prefs = await svc.getEventPrefs(user.id);
    return c.json({ data: prefs });
  });

  // Set per-event preference
  router.put('/preferences/events', requireAuth, vValidator('json', EventPrefSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const pref = await svc.setEventPref(user.id, body);
    return c.json({ data: pref });
  });

  return router;
}
