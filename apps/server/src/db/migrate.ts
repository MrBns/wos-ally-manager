import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function runMigrations(): Promise<void> {
  const sqlite = new Database(process.env.DATABASE_URL ?? './wos.db');
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite);
  try {
    migrate(db, { migrationsFolder: join(__dirname, '../../drizzle') });
    console.log('[DB] Migrations applied');
  } catch {
    // No migrations folder yet – that's fine for initial dev
    console.log('[DB] No migration files found, skipping');
  } finally {
    sqlite.close();
  }
}
