import { Hono } from 'hono';
import { vValidator } from '@hono/valibot-validator';
import * as v from 'valibot';
import { requireAuth, requireRole, type AuthEnv } from '../../shared/middleware.js';
import { EventsService } from './events.service.js';

const CreateEventSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(100)),
  description: v.optional(v.pipe(v.string(), v.maxLength(500))),
  dayOfWeek: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(6)),
  startTime: v.pipe(v.string(), v.regex(/^\d{2}:\d{2}$/)),
  durationMinutes: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 60),
  isActive: v.optional(v.boolean(), true),
});

export function eventsRouter() {
  const router = new Hono<AuthEnv>();
  const svc = new EventsService();

  router.get('/', requireAuth, async (c) => {
    const events = await svc.listEvents();
    return c.json({ data: events });
  });

  router.get('/:id', requireAuth, async (c) => {
    const { id } = c.req.param();
    const event = await svc.getEvent(id);
    return c.json({ data: event });
  });

  router.post('/', requireRole('r4'), vValidator('json', CreateEventSchema), async (c) => {
    const user = c.get('user');
    const body = c.req.valid('json');
    const event = await svc.createEvent({ ...body, createdBy: user.id });
    return c.json({ data: event }, 201);
  });

  router.patch('/:id', requireRole('r4'), vValidator('json', v.partial(CreateEventSchema)), async (c) => {
    const { id } = c.req.param();
    const body = c.req.valid('json');
    const event = await svc.updateEvent(id, body);
    return c.json({ data: event });
  });

  router.delete('/:id', requireRole('r4'), async (c) => {
    const { id } = c.req.param();
    await svc.deleteEvent(id);
    return c.json({ success: true });
  });

  return router;
}
