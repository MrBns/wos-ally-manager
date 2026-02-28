import * as v from 'valibot';

export const CreateEventSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, 'Event name required'), v.maxLength(100)),
  description: v.optional(v.pipe(v.string(), v.maxLength(500))),
  dayOfWeek: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(6)),
  startTime: v.pipe(
    v.string(),
    v.regex(/^\d{2}:\d{2}$/, 'Start time must be HH:MM format')
  ),
  durationMinutes: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(1440)),
  isActive: v.optional(v.boolean(), true),
});

export const UpdateEventSchema = v.partial(CreateEventSchema);

export type CreateEventInput = v.InferOutput<typeof CreateEventSchema>;
export type UpdateEventInput = v.InferOutput<typeof UpdateEventSchema>;
