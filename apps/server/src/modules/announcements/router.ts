import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { getDb } from '../../db/index.ts';
import { announcements, users } from '../../db/schema.ts';
import { requireAuth, requireRole, type AuthEnv } from '../../shared/middleware.ts';
import { generateId } from '../../shared/id.ts';
import { NotificationDispatcher } from '../notifications/dispatcher.ts';

export function announcementsRouter() {
  const r = new Hono<AuthEnv>();
  const dispatcher = new NotificationDispatcher();

  r.get('/', requireAuth, async (c) => {
    return c.json({ data: await getDb().select().from(announcements).orderBy(announcements.createdAt) });
  });

  r.post('/', requireRole('r4'), vValidator('json', v.object({
    title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
    body: v.pipe(v.string(), v.minLength(1), v.maxLength(5000)),
  })), async (c) => {
    const u = c.get('user');
    const { title, body } = c.req.valid('json');
    const [row] = await getDb().insert(announcements).values({
      id: generateId(), title, body, authorId: u.id,
    }).returning();

    // Broadcast to all users (background, non-blocking)
    (async () => {
      const allUsers = await getDb().select({ id: users.id }).from(users);
      for (const user of allUsers) {
        await dispatcher.dispatch({
          userId: user.id, channels: ['inapp', 'push', 'discord', 'telegram'],
          type: 'announcement', title: `📢 ${title}`, body,
        });
      }
    })().catch(console.error);

    return c.json({ data: row }, 201);
  });

  r.delete('/:id', requireRole('r4'), async (c) => {
    await getDb().delete(announcements).where(eq(announcements.id, c.req.param('id')));
    return c.json({ success: true });
  });

  return r;
}
