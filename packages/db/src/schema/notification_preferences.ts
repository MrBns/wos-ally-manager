import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { events } from './events';

// Global notification preferences per channel
export const globalNotificationPrefs = sqliteTable('global_notification_prefs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  channel: text('channel', { enum: ['discord', 'telegram', 'inapp', 'email'] }).notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// Per-event notification preferences
export const eventNotificationPrefs = sqliteTable('event_notification_prefs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  channel: text('channel', { enum: ['discord', 'telegram', 'inapp', 'email'] }).notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  // When to notify before event: 10min, 5min, 0min (start), custom
  notifyAt10Min: integer('notify_at_10_min', { mode: 'boolean' }).notNull().default(true),
  notifyAt5Min: integer('notify_at_5_min', { mode: 'boolean' }).notNull().default(true),
  notifyAtStart: integer('notify_at_start', { mode: 'boolean' }).notNull().default(true),
  customMinutesBefore: integer('custom_minutes_before'), // null = no custom
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type GlobalNotificationPref = typeof globalNotificationPrefs.$inferSelect;
export type EventNotificationPref = typeof eventNotificationPrefs.$inferSelect;
