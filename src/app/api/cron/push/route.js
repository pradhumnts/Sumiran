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
import { planPushSends } from "@/lib/push-dispatch";

export const runtime = "nodejs";
export const maxDuration = 60;

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

  for (const clientId of ids) {
    const raw = await redis.get(pushDataKey(clientId));
    const record = parsePushRecordRaw(raw);
    if (!record) continue;

    const { sends, nextLast } = planPushSends(record);
    if (sends.length === 0) continue;

    const sub = record.subscription;
    if (!sub?.endpoint) continue;

    let recordMutated = false;
    const mergedLast = { ...(record.last || {}) };

    for (const msg of sends) {
      const payload = JSON.stringify({
        title: msg.title,
        body: msg.body,
        tag: msg.tag,
        icon: "/logo/icon-192.png",
        badge: "/logo/icon-192.png",
      });

      try {
        await webpush.sendNotification(sub, payload, {
          TTL: 3600,
          urgency: "normal",
        });
        sent += 1;
        if (msg.kind === "hourly") mergedLast.hourlyAt = nextLast.hourlyAt;
        if (msg.kind === "evening") mergedLast.eveningDate = nextLast.eveningDate;
        if (msg.kind === "lateNight") mergedLast.lateNightDate = nextLast.lateNightDate;
        recordMutated = true;
      } catch (err) {
        const code = typeof err?.statusCode === "number" ? err.statusCode : null;
        if (code === 410) {
          await deletePushRecord(redis, clientId);
          removed += 1;
          recordMutated = false;
          break;
        }
        if (errors.length < 25) {
          errors.push({ clientId, kind: msg.kind, message: String(err?.message || err) });
        }
      }
    }

    if (recordMutated) {
      const next = { ...record, last: mergedLast };
      await redis.set(pushDataKey(clientId), JSON.stringify(next));
    }
  }

  return NextResponse.json({ ok: true, subscribers: ids.length, sent, removed, errors });
}

/** cron-job.org can use GET with query — discouraged; POST + header is preferred. */
export async function GET(request) {
  return POST(request);
}
