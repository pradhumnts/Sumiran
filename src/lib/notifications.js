import { getTodayCount, getDailyGoal, getReminderSettings } from "./storage";
import { shouldSkipClientHourlyTimer } from "./push-client";

let hourlyTimer = null;
let eveningTimer = null;
let lateNightTimer = null;
let visibilityBound = false;

export function getNotificationSupport() {
  if (typeof window === "undefined") return "unsupported";
  if (!("Notification" in window)) return "unsupported";
  return "supported";
}

export function getNotificationPermission() {
  if (getNotificationSupport() === "unsupported") return "unsupported";
  return Notification.permission;
}

/** Must run from a tap / user gesture (required on iOS Safari). */
export async function requestPermissionFromUserGesture() {
  if (getNotificationSupport() === "unsupported") return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

/** Re-schedule when the user returns to the tab (timers are frozen in background on mobile). */
export function ensureReminderVisibilityBinding() {
  if (typeof document === "undefined" || visibilityBound) return;
  visibilityBound = true;
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    initReminders(getReminderSettings());
  });
}

async function send(title, body) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const opts = {
    body,
    icon: "/logo/icon-192.png",
    badge: "/logo/icon-192.png",
    tag: "sumiran-reminder",
    vibrate: [60, 40, 60],
  };

  try {
    if ("serviceWorker" in navigator) {
      const reg =
        (await navigator.serviceWorker.getRegistration()) ||
        (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
      await reg.showNotification(title, opts);
      return;
    }
  } catch {
    /* fall through */
  }
  try {
    new Notification(title, opts);
  } catch {
    /* ignore */
  }
}

function clearAll() {
  if (hourlyTimer) {
    clearInterval(hourlyTimer);
    hourlyTimer = null;
  }
  if (eveningTimer) {
    clearTimeout(eveningTimer);
    eveningTimer = null;
  }
  if (lateNightTimer) {
    clearTimeout(lateNightTimer);
    lateNightTimer = null;
  }
}

function msUntilHour(hour) {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hour, 0, 0, 0);
  if (target <= now) return -1;
  return target - now;
}

function hourlyIntervalMs(settings) {
  return (settings.hourly?.interval || 1) * 60 * 60 * 1000;
}

export function initReminders(settings) {
  clearAll();
  if (!settings) return;

  if (settings.hourly?.enabled && !shouldSkipClientHourlyTimer(settings)) {
    const ms = hourlyIntervalMs(settings);
    if (ms > 0) {
      hourlyTimer = setInterval(() => {
        void send(
          "Sumiran — Time to log",
          `You've done ${getTodayCount().toLocaleString()} so far today. Keep going!`
        );
      }, ms);
    }
  }

  if (settings.evening?.enabled) {
    const ms = msUntilHour(20);
    if (ms > 0) {
      eveningTimer = setTimeout(() => {
        const count = getTodayCount();
        const goal = getDailyGoal();
        if (count < goal) {
          const remaining = goal - count;
          void send(
            "Sumiran — Evening Check-in",
            `You're at ${count.toLocaleString()} today. ${remaining.toLocaleString()} more to reach your goal.`
          );
        }
      }, ms);
    }
  }

  if (settings.lateNight?.enabled) {
    const ms = msUntilHour(22);
    if (ms > 0) {
      lateNightTimer = setTimeout(() => {
        const count = getTodayCount();
        const goal = getDailyGoal();
        if (count < goal * 0.5) {
          void send(
            "Sumiran — Gentle Reminder",
            `You're at ${count.toLocaleString()} — still time to sit for a session before the day ends.`
          );
        }
      }, ms);
    }
  }
}
