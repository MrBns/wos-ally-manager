import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import * as v from 'valibot';
import { eq } from 'drizzle-orm';
import { getDb } from '../../db/index.ts';
import { events } from '../../db/schema.ts';
import { requireAuth, requireRole, type AuthEnv } from '../../shared/middleware.ts';
import { generateId } from '../../shared/id.ts';
import { err } from '../../shared/errors.ts';

const EventSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  description: v.optional(v.pipe(v.string(), v.maxLength(500))),
  dayOfWeek: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(6)),
  startTime: v.pipe(v.string(), v.regex(/^\d{2}:\d{2}$/)),
  durationMinutes: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 60),
  isActive: v.optional(v.boolean(), true),
});

export function eventsRouter() {
  const r = new Hono<AuthEnv>();

  r.get('/', requireAuth, async (c) => {
    const rows = await getDb().select().from(events).orderBy(events.dayOfWeek, events.startTime);
    return c.json({ data: rows });
  });

  r.get('/:id', requireAuth, async (c) => {
    const row = await getDb().query.events.findFirst({ where: eq(events.id, c.req.param('id')) });
    if (!row) throw err.notFound('Event not found');
    return c.json({ data: row });
  });

  r.post('/', requireRole('r4'), vValidator('json', EventSchema), async (c) => {
    const u = c.get('user');
    const body = c.req.valid('json');
    const now = new Date().toISOString();
    const [row] = await getDb().insert(events).values({
      ...body, id: generateId(), createdBy: u.id, createdAt: now, updatedAt: now,
    }).returning();
    return c.json({ data: row }, 201);
  });

  r.patch('/:id', requireRole('r4'), vValidator('json', v.partial(EventSchema)), async (c) => {
    const now = new Date().toISOString();
    const [row] = await getDb().update(events)
      .set({ ...c.req.valid('json'), updatedAt: now })
      .where(eq(events.id, c.req.param('id')))
      .returning();
    if (!row) throw err.notFound('Event not found');
    return c.json({ data: row });
  });

  r.delete('/:id', requireRole('r4'), async (c) => {
    await getDb().delete(events).where(eq(events.id, c.req.param('id')));
    return c.json({ success: true });
  });

  return r;
}
