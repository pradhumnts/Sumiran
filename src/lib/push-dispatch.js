import { getLocalDateKeyForZone, getLocalHour } from "./push-timezone";

/**
 * Decide which Web Push notifications to send for one stored subscriber row.
 * `last` is updated only when a corresponding notification is sent (caller persists).
 * @param {{ fastTest?: boolean }} [options] — `fastTest`: shorten server hourly spacing (~50s) for cron integration tests (same auth as cron).
 */
export function planPushSends(record, nowMs = Date.now(), options = {}) {
  const fastTest = options.fastTest === true;
  const timeZone = record.timeZone || "UTC";
  const prefs = record.prefs || {};
  const snap = record.snapshot || { todayCount: 0, goal: 5000, todayKey: "" };
  const last = { ...(record.last || {}) };
  const localHour = getLocalHour(timeZone, new Date(nowMs));
  const localDate = getLocalDateKeyForZone(timeZone, new Date(nowMs));

  /** @type {{ kind: string; title: string; body: string; tag: string }[]} */
  const sends = [];

  if (prefs.hourly?.enabled && !prefs.hourly?.testEverySec) {
    const intervalH = Math.max(1, Number(prefs.hourly.interval) || 1);
    const normalMinMs = intervalH * 60 * 60 * 1000 * 0.85;
    const minMs = fastTest ? Math.min(normalMinMs, 50_000) : normalMinMs;
    const prev = last.hourlyAt;
    if (!prev || nowMs - prev >= minMs) {
      sends.push({
        kind: "hourly",
        title: "Sumiran — Time to log",
        body: `You've done ${Number(snap.todayCount || 0).toLocaleString()} so far today. Keep going!`,
        tag: "sumiran-reminder-hourly",
      });
      last.hourlyAt = nowMs;
    }
  }

  if (prefs.evening?.enabled && localHour === 20) {
    const count = Number(snap.todayCount || 0);
    const goal = Number(snap.goal || 5000);
    if (count < goal && last.eveningDate !== localDate) {
      const remaining = goal - count;
      sends.push({
        kind: "evening",
        title: "Sumiran — Evening Check-in",
        body: `You're at ${count.toLocaleString()} today. ${remaining.toLocaleString()} more to reach your goal.`,
        tag: "sumiran-reminder-evening",
      });
      last.eveningDate = localDate;
    }
  }

  if (prefs.lateNight?.enabled && localHour === 22) {
    const count = Number(snap.todayCount || 0);
    const goal = Number(snap.goal || 5000);
    if (count < goal * 0.5 && last.lateNightDate !== localDate) {
      sends.push({
        kind: "lateNight",
        title: "Sumiran — Gentle Reminder",
        body: `You're at ${count.toLocaleString()} — still time to sit for a session before the day ends.`,
        tag: "sumiran-reminder-late",
      });
      last.lateNightDate = localDate;
    }
  }

  return { sends, nextLast: last };
}
