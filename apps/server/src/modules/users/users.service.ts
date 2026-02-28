import { eq } from 'drizzle-orm';
import { getDb } from '../../shared/db.js';
import { users, type User } from '../../shared/schema.js';
import { notFound } from '../../shared/errors.js';

export class UsersService {
  private get db() { return getDb(); }

  async getProfile(userId: string): Promise<Omit<User, 'passwordHash'>> {
    const [user] = await this.db.select().from(users).where(eq(users.id, userId));
    if (!user) throw notFound('User not found');
    const { passwordHash: _, ...profile } = user;
    return profile;
  }

  async updateProfile(userId: string, data: {
    nickname?: string;
    avatarUrl?: string;
    discordWebhook?: string;
    telegramChatId?: string;
    email?: string;
  }): Promise<Omit<User, 'passwordHash'>> {
    const now = new Date().toISOString();
    await this.db.update(users).set({ ...data, updatedAt: now }).where(eq(users.id, userId));
    return this.getProfile(userId);
  }

  async listUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    const all = await this.db.select().from(users);
    return all.map(({ passwordHash: _, ...u }) => u);
  }

  async updateRole(userId: string, role: 'r1' | 'r2' | 'r3' | 'r4' | 'r5'): Promise<Omit<User, 'passwordHash'>> {
    const now = new Date().toISOString();
    await this.db.update(users).set({ role, updatedAt: now }).where(eq(users.id, userId));
    return this.getProfile(userId);
  }
}
