import * as v from 'valibot';

export const UpdateProfileSchema = v.object({
  nickname: v.optional(
    v.pipe(v.string(), v.minLength(1), v.maxLength(100))
  ),
  avatarUrl: v.optional(v.pipe(v.string(), v.url('Must be a valid URL'))),
  discordWebhook: v.optional(v.union([v.pipe(v.string(), v.url()), v.literal('')])),
  telegramChatId: v.optional(v.string()),
  email: v.optional(v.union([v.pipe(v.string(), v.email()), v.literal('')])),
});

export type UpdateProfileInput = v.InferOutput<typeof UpdateProfileSchema>;
