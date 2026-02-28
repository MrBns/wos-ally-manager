import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const giftcodes = sqliteTable('giftcodes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  addedBy: text('added_by').notNull(),
  expiresAt: text('expires_at'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const giftcodeRedemptions = sqliteTable('giftcode_redemptions', {
  id: text('id').primaryKey(),
  giftcodeId: text('giftcode_id').notNull().references(() => giftcodes.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(),
  status: text('status', { enum: ['success', 'failed', 'already_claimed'] }).notNull(),
  redeemedAt: text('redeemed_at').notNull().default(sql`(datetime('now'))`),
});

export type Giftcode = typeof giftcodes.$inferSelect;
export type GiftcodeRedemption = typeof giftcodeRedemptions.$inferSelect;
