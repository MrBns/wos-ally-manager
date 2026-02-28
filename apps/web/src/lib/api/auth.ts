import { api } from './client.js';

export interface User {
  id: string;
  gameUserId: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  role: 'r1' | 'r2' | 'r3' | 'r4' | 'r5';
  discordWebhook?: string | null;
  telegramChatId?: string | null;
  email?: string | null;
  createdAt: string;
}

export async function signUp(gameUserId: string, password: string) {
  return api.post<{ user: User; session: { token: string } }>('/api/auth/sign-up/email', {
    email: `${gameUserId}@wos.local`,
    password,
    name: gameUserId,
    gameUserId,
  });
}

export async function signIn(gameUserId: string, password: string) {
  return api.post<{ user: User; session: { token: string } }>('/api/auth/sign-in/email', {
    email: `${gameUserId}@wos.local`,
    password,
  });
}

export async function signOut() {
  return api.post('/api/auth/sign-out');
}

export async function getSession() {
  return api.get<{ user: User; session: { token: string } } | null>('/api/auth/get-session');
}
