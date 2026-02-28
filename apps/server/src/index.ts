import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { getAuth } from './shared/auth.js';
import { runMigrations } from './modules/db-migrate/migrate.js';
import { usersRouter } from './modules/users/users.router.js';
import { eventsRouter } from './modules/events/events.router.js';
import { notificationsRouter } from './modules/notifications/notifications.router.js';
import { giftcodesRouter } from './modules/giftcodes/giftcodes.router.js';
import { announcementsRouter } from './modules/announcements/announcements.router.js';
import { NotificationScheduler } from './modules/notifications/notification-scheduler.js';

const PORT = Number(process.env.PORT ?? 3000);

async function bootstrap() {
  // Run DB migrations first
  await runMigrations();

  const app = new Hono();
  const auth = getAuth();

  // Global middleware
  app.use('*', logger());
  app.use('*', prettyJSON());
  app.use('*', cors({
    origin: (process.env.TRUSTED_ORIGINS ?? 'http://localhost:5173').split(','),
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,
  }));

  // BetterAuth routes (handles /api/auth/*)
  app.on(['GET', 'POST'], '/api/auth/**', (c) => auth.handler(c.req.raw));

  // API routes
  app.route('/api/users', usersRouter());
  app.route('/api/events', eventsRouter());
  app.route('/api/notifications', notificationsRouter());
  app.route('/api/giftcodes', giftcodesRouter());
  app.route('/api/announcements', announcementsRouter());

  // Health check
  app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

  // Start notification scheduler
  const scheduler = new NotificationScheduler();
  scheduler.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    scheduler.stop();
    process.exit(0);
  });
  process.on('SIGINT', () => {
    scheduler.stop();
    process.exit(0);
  });

  serve({ fetch: app.fetch, port: PORT }, (info) => {
    console.log(`🚀 WOS Ally Manager Server running on http://localhost:${info.port}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
