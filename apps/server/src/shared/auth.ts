import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from '../db/index.ts';
import * as schema from '../db/schema.ts';

let _auth: ReturnType<typeof betterAuth> | null = null;

export function getAuth() {
  if (!_auth) {
    _auth = betterAuth({
      database: drizzleAdapter(getDb(), {
        provider: 'sqlite',
        schema: {
          user: schema.users,
          session: schema.sessions,
          account: schema.accounts,
          verification: schema.verifications,
        },
      }),
      emailAndPassword: { enabled: true },
      user: {
        additionalFields: {
          gameUserId: { type: 'string', required: true, unique: true },
          role: { type: 'string', required: false, defaultValue: 'r1' },
          nickname: { type: 'string', required: false },
          discordWebhook: { type: 'string', required: false },
          telegramChatId: { type: 'string', required: false },
          notifyEmail: { type: 'string', required: false },
        },
      },
      session: { expiresIn: 60 * 60 * 24 * 30, updateAge: 60 * 60 * 24 },
      trustedOrigins: (process.env.TRUSTED_ORIGINS ?? 'http://localhost:5173').split(','),
      secret: process.env.BETTER_AUTH_SECRET ?? 'dev-secret-change-in-production-32ch',
      baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    });
  }
  return _auth;
}
