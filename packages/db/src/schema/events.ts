import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sun, 1=Mon, ... 6=Sat
  startTime: text('start_time').notNull(), // HH:MM in UTC
  durationMinutes: integer('duration_minutes').notNull().default(60),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdBy: text('created_by').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
