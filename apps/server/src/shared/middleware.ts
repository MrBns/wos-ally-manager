import { createMiddleware } from 'hono/factory';
import { getAuth } from './auth.js';
import { unauthorized, forbidden } from './errors.js';
import type { User } from './schema.js';

type Role = 'r1' | 'r2' | 'r3' | 'r4' | 'r5';

const ROLE_LEVELS: Record<Role, number> = {
  r1: 1, r2: 2, r3: 3, r4: 4, r5: 5,
};

export type AuthEnv = {
  Variables: {
    user: User;
    session: { id: string; token: string; userId: string };
  };
};

export const requireAuth = createMiddleware<AuthEnv>(async (c, next) => {
  const auth = getAuth();
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user) {
    throw unauthorized();
  }
  c.set('user', session.user as unknown as User);
  c.set('session', session.session as { id: string; token: string; userId: string });
  await next();
});

export function requireRole(minRole: Role) {
  return createMiddleware<AuthEnv>(async (c, next) => {
    const auth = getAuth();
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user) throw unauthorized();
    const user = session.user as unknown as User;
    const userLevel = ROLE_LEVELS[user.role as Role] ?? 1;
    const required = ROLE_LEVELS[minRole];
    if (userLevel < required) throw forbidden('Insufficient role');
    c.set('user', user);
    c.set('session', session.session as { id: string; token: string; userId: string });
    await next();
  });
}
