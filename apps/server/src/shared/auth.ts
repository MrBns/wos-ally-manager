import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { getDb } from './db.js';
import * as schema from './schema.js';

export function createAuth() {
  const db = getDb();
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'sqlite',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
    },
    user: {
      additionalFields: {
        gameUserId: {
          type: 'string',
          required: true,
          unique: true,
          fieldName: 'gameUserId',
        },
        role: {
          type: 'string',
          required: false,
          defaultValue: 'r1',
          fieldName: 'role',
        },
        nickname: {
          type: 'string',
          required: false,
          fieldName: 'nickname',
        },
        avatarUrl: {
          type: 'string',
          required: false,
          fieldName: 'avatarUrl',
        },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 30, // 30 days
      updateAge: 60 * 60 * 24, // update if < 1 day left
    },
    trustedOrigins: (process.env.TRUSTED_ORIGINS ?? 'http://localhost:5173').split(','),
  });
}

let authInstance: ReturnType<typeof createAuth> | null = null;

export function getAuth() {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
}
