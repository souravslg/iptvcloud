import { drizzle as drizzleD1 } from 'drizzle-orm/d1';
import * as schema from './schema';
import { getRequestContext } from '@cloudflare/next-on-pages';

export function getDb(d1?: any) {
  if (d1) {
    return drizzleD1(d1, { schema });
  }
  
  // Dynamic import for local dev fallback
  try {
    const req = eval('require');
    const { drizzle: drizzleSqlite } = req('drizzle-orm/better-sqlite3');
    const Database = req('better-sqlite3');
    const sqlite = new Database('local.db');
    return drizzleSqlite(sqlite, { schema });
  } catch (e) {
    throw new Error('Database not available in this environment');
  }
}

export function getDbFromContext() {
  try {
    const env = getRequestContext().env as any;
    if (env && env.DB) {
      return getDb(env.DB);
    }
    throw new Error('D1 not found');
  } catch (e) {
    // Fallback for local dev
    return getDb();
  }
}
