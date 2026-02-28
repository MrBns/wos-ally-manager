import * as v from 'valibot';

export const SignUpSchema = v.object({
  gameUserId: v.pipe(
    v.string(),
    v.minLength(1, 'Game User ID is required'),
    v.maxLength(50, 'Game User ID must be 50 characters or less'),
    v.regex(/^\d+$/, 'Game User ID must be numeric')
  ),
  password: v.pipe(
    v.string(),
    v.minLength(6, 'Password must be at least 6 characters'),
    v.maxLength(100, 'Password too long')
  ),
});

export const LoginSchema = v.object({
  gameUserId: v.pipe(v.string(), v.minLength(1, 'Game User ID is required')),
  password: v.pipe(v.string(), v.minLength(1, 'Password is required')),
});

export type SignUpInput = v.InferOutput<typeof SignUpSchema>;
export type LoginInput = v.InferOutput<typeof LoginSchema>;
