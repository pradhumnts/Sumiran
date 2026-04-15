import { NextResponse } from "next/server";
import webpush from "web-push";
import { configureWebPushFromEnv, verifyCronRequest } from "@/lib/cron-push-shared";
import { deletePushRecord, getPushRedis, listPushClientIds, pushDataKey } from "@/lib/redis-push";

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

  const ids = await listPushClientIds(redis);
  let sent = 0;
  let removed = 0;
  const errors = [];

  const payload = JSON.stringify({
    title: "Sumiran — push test",
    body: "If you see this, Web Push from the server is working.",
    tag: TEST_TAG,
    icon: "/logo/icon-192.png",
    badge: "/logo/icon-192.png",
  });

  for (const clientId of ids) {
    const raw = await redis.get(pushDataKey(clientId));
    if (!raw || typeof raw !== "string") continue;

    let record;
    try {
      record = JSON.parse(raw);
    } catch {
      continue;
    }

    const sub = record.subscription;
    if (!sub?.endpoint) continue;

    try {
      await webpush.sendNotification(sub, payload, { TTL: 120, urgency: "high" });
      sent += 1;
    } catch (err) {
      const code = typeof err?.statusCode === "number" ? err.statusCode : null;
      if (code === 410) {
        await deletePushRecord(redis, clientId);
        removed += 1;
      } else if (errors.length < 25) {
        errors.push({ clientId, message: String(err?.message || err) });
      }
    }
  }

  return NextResponse.json({
    ok: true,
    mode: "push-test",
    subscribers: ids.length,
    sent,
    removed,
    errors,
  });
}

export async function GET(request) {
  return POST(request);
}
