import { getTodayCount, getDailyGoal } from "./storage";

let hourlyTimer = null;
let eveningTimer = null;
let lateNightTimer = null;

export function requestPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function send(title, body) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  new Notification(title, { body, icon: "/logo/icon-192.png" });
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

export function initReminders(settings) {
  clearAll();
  if (!settings) return;

  // Hourly reminder
  if (settings.hourly?.enabled) {
    const ms = (settings.hourly.interval || 1) * 60 * 60 * 1000;
    hourlyTimer = setInterval(() => {
      const count = getTodayCount();
      send("Sumiran — Time to log", `You've done ${count.toLocaleString()} so far today. Keep going! 🙏`);
    }, ms);
  }

  // Evening check-in at 8 PM
  if (settings.evening?.enabled) {
    const ms = msUntilHour(20);
    if (ms > 0) {
      eveningTimer = setTimeout(() => {
        const count = getTodayCount();
        const goal = getDailyGoal();
        if (count < goal) {
          const remaining = goal - count;
          send(
            "Sumiran — Evening Check-in",
            `You're at ${count.toLocaleString()} today. ${remaining.toLocaleString()} more to reach your goal. 🙏`
          );
        }
      }, ms);
    }
  }

  // Late night push at 10 PM (only if below 50%)
  if (settings.lateNight?.enabled) {
    const ms = msUntilHour(22);
    if (ms > 0) {
      lateNightTimer = setTimeout(() => {
        const count = getTodayCount();
        const goal = getDailyGoal();
        if (count < goal * 0.5) {
          send(
            "Sumiran — Gentle Reminder",
            `You're at ${count.toLocaleString()} — still time to sit for a session before the day ends. 🙏`
          );
        }
      }, ms);
    }
  }
}
