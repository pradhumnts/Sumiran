import { NextResponse } from "next/server";
import webpush from "web-push";
import { configureWebPushFromEnv, verifyCronRequest } from "@/lib/cron-push-shared";
import {
  deletePushRecord,
  getPushRedis,
  listPushClientIds,
  parsePushRecordRaw,
  pushDataKey,
} from "@/lib/redis-push";

export const runtime = "nodejs";
export const maxDuration = 60;

const TEST_TAG = "sumiran-push-test";

/**
 * One-shot connectivity test: sends a fixed notification to every stored subscription.
 * Same auth as /api/cron/push. Does not update reminder scheduling state in Redis.
 * Use manual curl only — do not point repeating crons here.
 */
export async function POST(request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redis = getPushRedis();
  if (!redis) {
    return NextResponse.json({ error: "Redis not configured" }, { status: 503 });
  }

  if (!configureWebPushFromEnv()) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 503 });
  }

  const debug = new URL(request.url).searchParams.get("debug") === "1";
  const ids = await listPushClientIds(redis);
  let sent = 0;
  let removed = 0;
  const errors = [];
  /** @type {object[]} */
  const debugSteps = [];

  const payload = JSON.stringify({
    title: "Sumiran — push test",
    body: "If you see this, Web Push from the server is working.",
    tag: TEST_TAG,
    icon: "/logo/icon-192.png",
    badge: "/logo/icon-192.png",
  });

  for (const clientId of ids) {
    const key = pushDataKey(clientId);
    const raw = await redis.get(key);
    const rawType = raw === null || raw === undefined ? "null" : typeof raw;
    const record = parsePushRecordRaw(raw);
    const sub = record?.subscription;
    const endpointPreview =
      typeof sub?.endpoint === "string" ? `${sub.endpoint.slice(0, 48)}…` : null;

    if (!record) {
      if (raw == null) {
        await deletePushRecord(redis, clientId);
        if (debug) {
          debugSteps.push({
            clientId,
            key,
            rawType,
            outcome: "orphan_index_removed",
          });
        }
      } else if (debug) {
        debugSteps.push({
          clientId,
          key,
          rawType,
          outcome: "unparseable_record",
        });
      }
      continue;
    }

    if (!sub?.endpoint) {
      if (debug) {
        debugSteps.push({
          clientId,
          key,
          rawType,
          hasSubscription: !!sub,
          outcome: "missing_endpoint",
        });
      }
      continue;
    }

    try {
      await webpush.sendNotification(sub, payload, { TTL: 120, urgency: "high" });
      sent += 1;
      if (debug) {
        debugSteps.push({
          clientId,
          key,
          rawType,
          endpointPreview,
          outcome: "sent",
        });
      }
    } catch (err) {
      const code = typeof err?.statusCode === "number" ? err.statusCode : null;
      if (code === 410) {
        await deletePushRecord(redis, clientId);
        removed += 1;
        if (debug) {
          debugSteps.push({ clientId, key, outcome: "removed_410", body: err?.body });
        }
      } else if (errors.length < 25) {
        const msg = String(err?.message || err);
        errors.push({ clientId, message: msg, statusCode: code });
        if (debug) {
          debugSteps.push({
            clientId,
            key,
            rawType,
            endpointPreview,
            outcome: "send_error",
            statusCode: code,
            message: msg,
          });
        }
      }
    }
  }

  const body = {
    ok: true,
    mode: "push-test",
    subscribers: ids.length,
    sent,
    removed,
    errors,
  };
  if (debug) body.debug = debugSteps;
  return NextResponse.json(body);
}

export async function GET(request) {
  return POST(request);
}
