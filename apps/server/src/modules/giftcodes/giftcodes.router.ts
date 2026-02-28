import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import * as v from 'valibot';
import { requireAuth, requireRole, type AuthEnv } from '../../shared/middleware.js';
import { GiftcodesService } from './giftcodes.service.js';

const AddCodeSchema = v.object({
  code: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
  expiresAt: v.optional(v.nullable(v.string())),
});

export function giftcodesRouter() {
  const router = new Hono<AuthEnv>();
  const svc = new GiftcodesService();

  // List all giftcodes (r4+)
  router.get('/', requireRole('r4'), async (c) => {
    const codes = await svc.listGiftcodes();
    return c.json({ data: codes });
  });

  // Add a giftcode (r4+) — triggers auto-claim for all users
  router.post('/', requireRole('r4'), vValidator('json', AddCodeSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const result = await svc.addGiftcode({ ...body, addedBy: user.id });
    return c.json({ data: result }, 201);
  });

  // Get redemption status for a code
  router.get('/:id/redemptions', requireRole('r4'), async (c) => {
    const { id } = c.req.param();
    const redemptions = await svc.getRedemptions(id);
    return c.json({ data: redemptions });
  });

  // Deactivate a giftcode
  router.patch('/:id/deactivate', requireRole('r4'), async (c) => {
    const { id } = c.req.param();
    await svc.deactivateGiftcode(id);
    return c.json({ success: true });
  });

  return router;
}
