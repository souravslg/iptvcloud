import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getDb() {
  const { env } = await getCloudflareContext();
  if (!env || !env.DB) {
    throw new Error("Cloudflare D1 database binding (DB) is missing. Check your wrangler.toml and Cloudflare dashboard settings.");
  }
  return env.DB;
}

export async function getEnv() {
  const { env } = await getCloudflareContext();
  return env;
}
