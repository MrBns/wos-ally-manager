import * as v from 'valibot';

export const CreateAnnouncementSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1, 'Title required'), v.maxLength(200)),
  body: v.pipe(v.string(), v.minLength(1, 'Body required'), v.maxLength(5000)),
});

export type CreateAnnouncementInput = v.InferOutput<typeof CreateAnnouncementSchema>;
