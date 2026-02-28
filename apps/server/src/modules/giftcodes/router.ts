import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { getDb } from '../../db/index.ts';
import { giftcodes, giftcodeRedemptions, users } from '../../db/schema.ts';
import { requireRole, type AuthEnv } from '../../shared/middleware.ts';
import { generateId } from '../../shared/id.ts';
import { NotificationService } from '../notifications/service.ts';
import { createHash } from 'node:crypto';

const WOS_API = 'https://wos-giftcode-api.centurygame.com/api';
const SALT = 'tB87#kPtkxqOS2'; // community-known WOS API salt

function wosSign(input: string) {
  return createHash('md5').update(input + SALT).digest('hex');
}

async function claimForUser(code: string, gameUserId: string): Promise<'success' | 'failed' | 'already_claimed'> {
  try {
    // 1. Verify player exists
    const sign1 = wosSign(gameUserId);
    const r1 = await fetch(`${WOS_API}/player`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ fid: gameUserId, sign: sign1 }),
    });
    if (!r1.ok) return 'failed';

    // 2. Exchange gift code
    const sign2 = wosSign(gameUserId + code);
    const r2 = await fetch(`${WOS_API}/gift_code`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ fid: gameUserId, cdk: code, sign: sign2 }),
    });
    const data = await r2.json() as { err_code?: number };
    if (data.err_code === 40014) return 'already_claimed';
    return data.err_code === 0 ? 'success' : 'failed';
  } catch {
    return 'failed';
  }
}

export function giftcodesRouter() {
  const r = new Hono<AuthEnv>();
  const svc = new NotificationService();

  r.get('/', requireRole('r4'), async (c) => {
    return c.json({ data: await getDb().select().from(giftcodes).orderBy(giftcodes.createdAt) });
  });

  r.post('/', requireRole('r4'), vValidator('json', v.object({
    code: v.pipe(v.string(), v.minLength(1), v.maxLength(50)),
    expiresAt: v.optional(v.nullable(v.string())),
  })), async (c) => {
    const u = c.get('user');
    const { code, expiresAt } = c.req.valid('json');
    const db = getDb();

    const [row] = await db.insert(giftcodes).values({
      id: generateId(), code, addedBy: u.id, expiresAt: expiresAt ?? null,
    }).returning();

    // Auto-claim for all users in background (non-blocking)
    (async () => {
      const allUsers = await db.select({ id: users.id, gameUserId: users.gameUserId }).from(users);
      for (const user of allUsers) {
        const status = await claimForUser(code, user.gameUserId);
        await db.insert(giftcodeRedemptions).values({
          id: generateId(), giftcodeId: row.id, userId: user.id, status,
        }).onConflictDoNothing();

        if (status === 'success') {
          await svc.create({
            userId: user.id, type: 'giftcode', channel: 'inapp',
            title: '🎁 Gift Code Claimed!',
            body: `"${code}" was successfully redeemed for your account.`,
          });
        }
        // Small delay between users to avoid rate limiting
        await new Promise(res => setTimeout(res, 300));
      }
    })().catch(console.error);

    return c.json({ data: row }, 201);
  });

  r.get('/:id/redemptions', requireRole('r4'), async (c) => {
    return c.json({ data: await getDb().select().from(giftcodeRedemptions)
      .where(eq(giftcodeRedemptions.giftcodeId, c.req.param('id'))) });
  });

  r.patch('/:id/deactivate', requireRole('r4'), async (c) => {
    await getDb().update(giftcodes).set({ isActive: false }).where(eq(giftcodes.id, c.req.param('id')));
    return c.json({ success: true });
  });

  return r;
}
