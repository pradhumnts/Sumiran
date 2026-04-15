import {
  getDailyGoal,
  getReminderSettings,
  getTodayCount,
  getTodayDateKey,
} from "./storage";

const CLIENT_KEY = "sumiran_push_client_id";
const SERVER_HOURLY_FLAG = "sumiran_push_server_hourly";

function getPublicVapidKey() {
  if (typeof window === "undefined") return "";
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

export function getOrCreatePushClientId() {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id && typeof crypto !== "undefined" && crypto.randomUUID) {
      id = crypto.randomUUID();
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id || "";
  } catch {
    return "";
  }
}

export function shouldSkipClientHourlyTimer(settings) {
  if (typeof window === "undefined") return false;
  if (!settings?.hourly?.enabled) return false;
  try {
    return localStorage.getItem(SERVER_HOURLY_FLAG) === "1";
  } catch {
    return false;
  }
}

function setServerHourlyFlag(on) {
  try {
    if (on) localStorage.setItem(SERVER_HOURLY_FLAG, "1");
    else localStorage.removeItem(SERVER_HOURLY_FLAG);
  } catch {
    /* ignore */
  }
}

function anyReminderOn(settings) {
  if (!settings) return false;
  return !!(settings.hourly?.enabled || settings.evening?.enabled || settings.lateNight?.enabled);
}

async function postJson(path, body) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
}

/**
 * Registers Web Push + syncs prefs to Upstash via `/api/push/subscribe`, or tears down when reminders off / permission not granted.
 * Safe to call often (e.g. when counts or reminder toggles change).
 */
export async function syncPushWithReminders(settings) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return;

  const clientId = getOrCreatePushClientId();
  if (!clientId) return;

  const permission = Notification.permission;
  const reminders = settings || getReminderSettings();

  if (permission !== "granted" || !anyReminderOn(reminders)) {
    setServerHourlyFlag(false);
    try {
      await postJson("/api/push/unsubscribe", { clientId });
    } catch {
      /* Redis may be unset in dev */
    }
    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      if (existing) await existing.unsubscribe();
    } catch {
      /* ignore */
    }
    return;
  }

  const vapid = getPublicVapidKey();
  if (!vapid) {
    setServerHourlyFlag(false);
    return;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapid),
      });
    }

    const snapshot = {
      todayKey: getTodayDateKey(),
      todayCount: getTodayCount(),
      goal: getDailyGoal(),
    };

    await postJson("/api/push/subscribe", {
      clientId,
      subscription: sub.toJSON(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      prefs: reminders,
      snapshot,
    });

    setServerHourlyFlag(!!reminders.hourly?.enabled);
  } catch {
    setServerHourlyFlag(false);
  }
}
