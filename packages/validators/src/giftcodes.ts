import * as v from 'valibot';

export const AddGiftcodeSchema = v.object({
  code: v.pipe(v.string(), v.minLength(1, 'Code required'), v.maxLength(50)),
  expiresAt: v.optional(v.nullable(v.string())),
});

export type AddGiftcodeInput = v.InferOutput<typeof AddGiftcodeSchema>;
