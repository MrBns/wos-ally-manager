import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { getDb } from '../../db/index.ts';
import { users } from '../../db/schema.ts';
import { requireAuth, requireRole, type AuthEnv } from '../../shared/middleware.ts';
import { err } from '../../shared/errors.ts';

const UpdateSchema = v.object({
  nickname: v.optional(v.pipe(v.string(), v.maxLength(100))),
  image: v.optional(v.pipe(v.string(), v.url())),
  discordWebhook: v.optional(v.string()),
  telegramChatId: v.optional(v.string()),
  notifyEmail: v.optional(v.pipe(v.string(), v.email())),
});

export function usersRouter() {
  const r = new Hono<AuthEnv>();

  r.get('/me', requireAuth, async (c) => {
    const u = c.get('user');
    const { createdAt: _, updatedAt: __, ...safe } = u as typeof u & { createdAt: unknown; updatedAt: unknown };
    return c.json({ data: safe });
  });

  r.patch('/me', requireAuth, vValidator('json', UpdateSchema), async (c) => {
    const u = c.get('user');
    const data = c.req.valid('json');
    const now = new Date();
    await getDb().update(users).set({ ...data, updatedAt: now }).where(eq(users.id, u.id));
    const updated = await getDb().query.users.findFirst({ where: eq(users.id, u.id) });
    return c.json({ data: updated });
  });

  r.get('/', requireRole('r4'), async (c) => {
    const all = await getDb().select({
      id: users.id, gameUserId: users.gameUserId, nickname: users.nickname,
      role: users.role, image: users.image, email: users.email, createdAt: users.createdAt,
    }).from(users);
    return c.json({ data: all });
  });

  r.patch('/:id/role', requireRole('r5'), vValidator('json', v.object({
    role: v.picklist(['r1','r2','r3','r4','r5']),
  })), async (c) => {
    const { id } = c.req.param();
    const { role } = c.req.valid('json');
    await getDb().update(users).set({ role, updatedAt: new Date() }).where(eq(users.id, id));
    return c.json({ success: true });
  });

  return r;
}
