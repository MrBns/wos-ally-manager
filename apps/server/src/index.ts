import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { getAuth } from './shared/auth.ts';
import { usersRouter } from './modules/users/router.ts';
import { eventsRouter } from './modules/events/router.ts';
import { notificationsRouter } from './modules/notifications/router.ts';
import { giftcodesRouter } from './modules/giftcodes/router.ts';
import { announcementsRouter } from './modules/announcements/router.ts';
import { NotificationScheduler } from './modules/notifications/scheduler.ts';

const PORT = Number(process.env.PORT ?? 3000);
const ORIGINS = (process.env.TRUSTED_ORIGINS ?? 'http://localhost:5173').split(',');

const app = new Hono();

app.use('*', logger());
app.use('*', cors({
  origin: ORIGINS,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// BetterAuth handles /api/auth/**
app.on(['GET', 'POST'], '/api/auth/**', c => getAuth().handler(c.req.raw));

app.route('/api/users', usersRouter());
app.route('/api/events', eventsRouter());
app.route('/api/notifications', notificationsRouter());
app.route('/api/giftcodes', giftcodesRouter());
app.route('/api/announcements', announcementsRouter());

app.get('/health', c => c.json({ ok: true, ts: new Date().toISOString() }));

// Start scheduler
const scheduler = new NotificationScheduler();
scheduler.start();

process.on('SIGTERM', () => { scheduler.stop(); process.exit(0); });
process.on('SIGINT',  () => { scheduler.stop(); process.exit(0); });

serve({ fetch: app.fetch, port: PORT }, info => {
  console.log(`🚀 Server ready at http://localhost:${info.port}`);
});
