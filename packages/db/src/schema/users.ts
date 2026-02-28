import { sqliteTable, text, integer, blob } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  gameUserId: text('game_user_id').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  nickname: text('nickname'),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['r1', 'r2', 'r3', 'r4', 'r5'] }).notNull().default('r1'),
  discordId: text('discord_id'),
  discordWebhook: text('discord_webhook'),
  telegramChatId: text('telegram_chat_id'),
  email: text('email'),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
