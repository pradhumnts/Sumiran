import { NextResponse } from "next/server";
import { getPushRedis, parsePushRecordRaw, pushDataKey, savePushRecord } from "@/lib/redis-push";

export const runtime = "nodejs";

function isValidSubscription(body) {
  if (!body || typeof body !== "object") return false;
  const sub = body.subscription;
  if (!sub || typeof sub.endpoint !== "string" || !sub.keys) return false;
  const { p256dh, auth } = sub.keys;
  return typeof p256dh === "string" && typeof auth === "string";
}

export async function POST(request) {
  const redis = getPushRedis();
  if (!redis) {
    return NextResponse.json(
      { error: "Push storage is not configured (Upstash Redis env missing)." },
      { status: 503 }
    );
  }

  let json;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isValidSubscription(json)) {
    return NextResponse.json({ error: "Invalid subscription payload" }, { status: 400 });
  }

  const clientId = typeof json.clientId === "string" && json.clientId.length > 8 ? json.clientId : null;
  if (!clientId) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }

  const timeZone = typeof json.timeZone === "string" && json.timeZone.length > 1 ? json.timeZone : "UTC";
  const prefs = json.prefs && typeof json.prefs === "object" ? json.prefs : {};
  const snap = json.snapshot && typeof json.snapshot === "object" ? json.snapshot : {};

  const existingRaw = await redis.get(pushDataKey(clientId));
  const existing = parsePushRecordRaw(existingRaw);

  const record = {
    subscription: json.subscription,
    timeZone,
    prefs,
    snapshot: {
      todayKey: typeof snap.todayKey === "string" ? snap.todayKey : "",
      todayCount: Number(snap.todayCount) || 0,
      goal: Number(snap.goal) || 5000,
    },
    last: existing?.last && typeof existing.last === "object" ? existing.last : {},
  };

  await savePushRecord(redis, clientId, JSON.stringify(record));
  return NextResponse.json({ ok: true });
}
