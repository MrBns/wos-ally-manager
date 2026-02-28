import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import * as v from 'valibot';
import { requireAuth, type AuthEnv } from '../../shared/middleware.js';
import { UsersService } from './users.service.js';
import { requireRole } from '../../shared/middleware.js';

const UpdateProfileSchema = v.object({
  nickname: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(100))),
  avatarUrl: v.optional(v.pipe(v.string(), v.url())),
  discordWebhook: v.optional(v.string()),
  telegramChatId: v.optional(v.string()),
  email: v.optional(v.pipe(v.string(), v.email())),
});

export function usersRouter() {
  const router = new Hono<AuthEnv>();
  const svc = new UsersService();

  // Get current user profile
  router.get('/me', requireAuth, async (c) => {
    const user = c.get('user');
    const profile = await svc.getProfile(user.id);
    return c.json({ data: profile });
  });

  // Update current user profile
  router.patch('/me', requireAuth, vValidator('json', UpdateProfileSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const updated = await svc.updateProfile(user.id, body);
    return c.json({ data: updated });
  });

  // List all users (r4+)
  router.get('/', requireRole('r4'), async (c) => {
    const users = await svc.listUsers();
    return c.json({ data: users });
  });

  // Update user role (r5 only)
  router.patch('/:id/role', requireRole('r5'), vValidator('json', v.object({
    role: v.picklist(['r1', 'r2', 'r3', 'r4', 'r5']),
  })), async (c) => {
    const { id } = c.req.param();
    const { role } = c.req.valid('json');
    const updated = await svc.updateRole(id, role);
    return c.json({ data: updated });
  });

  return router;
}
