import { getRequestContext } from '@cloudflare/next-on-pages';

export function getDb() {
  const env = getRequestContext().env as any;
  if (!env || !env.DB) {
    throw new Error('D1 database binding (DB) is not available');
  }
  return env.DB as D1Database;
}
