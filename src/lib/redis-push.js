import { Redis } from "@upstash/redis";

const CLIENTS_KEY = "sumiran:push:clients";
export const pushDataKey = (clientId) => `sumiran:push:data:${clientId}`;

/**
 * Upstash `get` may return a JSON string or an already-parsed object.
 * @returns {object|null}
 */
export function parsePushRecordRaw(raw) {
  if (raw == null) return null;
  if (typeof raw === "string") {
    try {
      const v = JSON.parse(raw);
      return v && typeof v === "object" && !Array.isArray(v) ? v : null;
    } catch {
      return null;
    }
  }
  if (typeof raw === "object" && !Array.isArray(raw) && raw.subscription != null) {
    return raw;
  }
  return null;
}

export function getPushRedis() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.SUMIRAN_KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.SUMIRAN_KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

export async function savePushRecord(redis, clientId, payloadJson) {
  const idKey = pushDataKey(clientId);
  await redis.set(idKey, payloadJson);
  await redis.sadd(CLIENTS_KEY, clientId);
}

export async function deletePushRecord(redis, clientId) {
  await redis.del(pushDataKey(clientId));
  await redis.srem(CLIENTS_KEY, clientId);
}

export async function listPushClientIds(redis) {
  const ids = await redis.smembers(CLIENTS_KEY);
  return Array.isArray(ids) ? ids : [];
}
