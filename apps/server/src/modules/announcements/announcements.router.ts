import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import * as v from 'valibot';
import { requireAuth, requireRole, type AuthEnv } from '../../shared/middleware.js';
import { AnnouncementsService } from './announcements.service.js';

const CreateSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  body: v.pipe(v.string(), v.minLength(1), v.maxLength(5000)),
});

export function announcementsRouter() {
  const router = new Hono<AuthEnv>();
  const svc = new AnnouncementsService();

  router.get('/', requireAuth, async (c) => {
    const items = await svc.listAnnouncements();
    return c.json({ data: items });
  });

  router.post('/', requireRole('r4'), vValidator('json', CreateSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const item = await svc.createAnnouncement({ ...body, authorId: user.id });
    // Broadcast to all users
    await svc.broadcastAnnouncement(item);
    return c.json({ data: item }, 201);
  });

  router.delete('/:id', requireRole('r4'), async (c) => {
    const { id } = c.req.param();
    await svc.deleteAnnouncement(id);
    return c.json({ success: true });
  });

  return router;
}
