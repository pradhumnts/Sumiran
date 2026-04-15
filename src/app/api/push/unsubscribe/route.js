import { NextResponse } from "next/server";
import { deletePushRecord, getPushRedis } from "@/lib/redis-push";

export const runtime = "nodejs";

export async function POST(request) {
  const redis = getPushRedis();
  if (!redis) {
    return NextResponse.json({ ok: true });
  }

  let json;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clientId = typeof json.clientId === "string" && json.clientId.length > 8 ? json.clientId : null;
  if (!clientId) {
    return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
  }

  await deletePushRecord(redis, clientId);
  return NextResponse.json({ ok: true });
}
