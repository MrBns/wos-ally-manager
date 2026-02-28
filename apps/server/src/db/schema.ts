import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),             // BetterAuth uses 'name'
  email: text('email').notNull().unique(),  // we store gameUserId@wos.local here
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),                     // avatar URL
  nickname: text('nickname'),
  role: text('role', { enum: ['r1','r2','r3','r4','r5'] }).notNull().default('r1'),
  gameUserId: text('game_user_id').notNull().unique(),
  discordWebhook: text('discord_webhook'),
  telegramChatId: text('telegram_chat_id'),
  notifyEmail: text('notify_email'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const sessions = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const accounts = sqliteTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  idToken: text('id_token'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verifications = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const events = sqliteTable('events', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  dayOfWeek: integer('day_of_week').notNull(), // 0=Sun…6=Sat
  startTime: text('start_time').notNull(),     // 'HH:MM' UTC
  durationMinutes: integer('duration_minutes').notNull().default(60),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdBy: text('created_by').notNull().references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
});

// Global per-channel opt-in (default: all enabled)
export const globalNotifPrefs = sqliteTable('global_notif_prefs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  channel: text('channel', { enum: ['discord','telegram','inapp','email','push'] }).notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  uniqueIndex('uniq_global_pref').on(t.userId, t.channel),
]);

// Per-event per-channel preferences
export const eventNotifPrefs = sqliteTable('event_notif_prefs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  channel: text('channel', { enum: ['discord','telegram','inapp','email','push'] }).notNull(),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  notifyAt10Min: integer('notify_at_10_min', { mode: 'boolean' }).notNull().default(true),
  notifyAt5Min: integer('notify_at_5_min', { mode: 'boolean' }).notNull().default(true),
  notifyAtStart: integer('notify_at_start', { mode: 'boolean' }).notNull().default(true),
  customMinutesBefore: integer('custom_minutes_before'),
  updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  uniqueIndex('uniq_event_pref').on(t.userId, t.eventId, t.channel),
]);

// In-app notification log
export const notifications = sqliteTable('notifications', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventId: text('event_id').references(() => events.id, { onDelete: 'set null' }),
  type: text('type', { enum: ['event_reminder','giftcode','announcement','system'] }).notNull(),
  channel: text('channel', { enum: ['discord','telegram','inapp','email','push'] }).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  read: integer('read', { mode: 'boolean' }).notNull().default(false),
  sentAt: text('sent_at').notNull().default(sql`(datetime('now'))`),
});

// Web Push subscriptions (VAPID)
export const pushSubscriptions = sqliteTable('push_subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  uniqueIndex('uniq_push_endpoint').on(t.endpoint),
]);

export const giftcodes = sqliteTable('giftcodes', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  addedBy: text('added_by').notNull().references(() => users.id),
  expiresAt: text('expires_at'),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});

export const giftcodeRedemptions = sqliteTable('giftcode_redemptions', {
  id: text('id').primaryKey(),
  giftcodeId: text('giftcode_id').notNull().references(() => giftcodes.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: text('status', { enum: ['success','failed','already_claimed'] }).notNull(),
  redeemedAt: text('redeemed_at').notNull().default(sql`(datetime('now'))`),
}, (t) => [
  uniqueIndex('uniq_redemption').on(t.giftcodeId, t.userId),
]);

export const announcements = sqliteTable('announcements', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  authorId: text('author_id').notNull().references(() => users.id),
  createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
});
