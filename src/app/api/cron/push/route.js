import { NextResponse } from "next/server";
import webpush from "web-push";
import { deletePushRecord, getPushRedis, listPushClientIds, pushDataKey } from "@/lib/redis-push";
import { planPushSends } from "@/lib/push-dispatch";

export const runtime = "nodejs";
export const maxDuration = 60;

function verifyCron(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:sumiran@localhost";
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function POST(request) {
  if (!verifyCron(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const redis = getPushRedis();
  if (!redis) {
    return NextResponse.json({ error: "Redis not configured" }, { status: 503 });
  }

  if (!configureWebPush()) {
    return NextResponse.json({ error: "VAPID keys not configured" }, { status: 503 });
  }

  const ids = await listPushClientIds(redis);
  let sent = 0;
  let removed = 0;
  const errors = [];

  for (const clientId of ids) {
    const raw = await redis.get(pushDataKey(clientId));
    if (!raw || typeof raw !== "string") continue;

    let record;
    try {
      record = JSON.parse(raw);
    } catch {
      continue;
    }

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
