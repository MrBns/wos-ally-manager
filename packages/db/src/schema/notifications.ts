import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { events } from './events';

export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: text('event_id').references(() => events.id, { onDelete: 'set null' }),
  type: text('type', { enum: ['event_reminder', 'giftcode', 'announcement', 'system'] }).notNull(),
  channel: text('channel', { enum: ['discord', 'telegram', 'inapp', 'email'] }).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  sentAt: text('sent_at').notNull().default(sql`(datetime('now'))`),
});

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
