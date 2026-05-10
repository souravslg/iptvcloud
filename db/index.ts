import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import { getRequestContext } from '@cloudflare/next-on-pages';

export function getDbFromContext() {
  const env = getRequestContext().env as any;
  if (!env || !env.DB) {
    throw new Error('Cloudflare D1 binding (DB) is not available. Ensure DB is bound in wrangler.toml.');
  }
  return drizzle(env.DB, { schema });
}