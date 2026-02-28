import * as v from 'valibot';

const NotificationChannel = v.picklist(['discord', 'telegram', 'inapp', 'email']);

export const GlobalNotificationPrefSchema = v.object({
  channel: NotificationChannel,
  enabled: v.boolean(),
});

export const EventNotificationPrefSchema = v.object({
  eventId: v.pipe(v.string(), v.minLength(1)),
  channel: NotificationChannel,
  enabled: v.boolean(),
  notifyAt10Min: v.optional(v.boolean(), true),
  notifyAt5Min: v.optional(v.boolean(), true),
  notifyAtStart: v.optional(v.boolean(), true),
  customMinutesBefore: v.optional(v.nullable(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(1440)))),
});

export type GlobalNotificationPrefInput = v.InferOutput<typeof GlobalNotificationPrefSchema>;
export type EventNotificationPrefInput = v.InferOutput<typeof EventNotificationPrefSchema>;
