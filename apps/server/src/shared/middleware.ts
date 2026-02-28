import { createMiddleware } from 'hono/factory';
import { getAuth } from './auth.ts';
import { err } from './errors.ts';
import type { users } from '../db/schema.ts';
import type { InferSelectModel } from 'drizzle-orm';

export type UserRow = InferSelectModel<typeof users>;
type Role = 'r1' | 'r2' | 'r3' | 'r4' | 'r5';
const LEVELS: Record<Role, number> = { r1:1, r2:2, r3:3, r4:4, r5:5 };

export type AuthEnv = { Variables: { user: UserRow } };

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const session = await getAuth().api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) throw err.unauthorized();
  c.set('user', session.user as unknown as UserRow);
  await next();
});

export function requireRole(min: Role) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const session = await getAuth().api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) throw err.unauthorized();
    const u = session.user as unknown as UserRow;
    if ((LEVELS[u.role as Role] ?? 1) < LEVELS[min]) throw err.forbidden();
    c.set('user', u);
    await next();
  });
}
