const KEYS = {
  DAILY_COUNTS: "sumiran_daily_counts",
  DAILY_GOAL: "sumiran_daily_goal",
  REMINDERS: "sumiran_reminders",
  ENTRY_LOG: "sumiran_entry_log",
};

/** YYYY-MM-DD in the user's local calendar (not UTC). */
function getLocalDateKey(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getToday() {
  return getLocalDateKey(new Date());
}

function read(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function newEntryId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// --- Entry log (each tally tap; newest first) ---

export function getEntryLog() {
  return read(KEYS.ENTRY_LOG, []);
}

function appendEntry(amount) {
  if (amount <= 0) return;
  const log = getEntryLog();
  log.unshift({
    id: newEntryId(),
    date: getToday(),
    amount,
    at: new Date().toISOString(),
  });
  write(KEYS.ENTRY_LOG, log);
}

/** Removes one log line and subtracts its amount from that day's total. */
export function removeEntry(id) {
  const log = getEntryLog();
  const idx = log.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  const entry = log[idx];
  const counts = getDailyCounts();
  const d = entry.date;
  const next = Math.max(0, (counts[d] || 0) - entry.amount);
  if (next === 0) delete counts[d];
  else counts[d] = next;
  write(KEYS.DAILY_COUNTS, counts);
  log.splice(idx, 1);
  write(KEYS.ENTRY_LOG, log);
  return true;
}

// --- Daily counts (keyed by YYYY-MM-DD) ---

export function getDailyCounts() {
  return read(KEYS.DAILY_COUNTS, {});
}

export function getTodayCount() {
  const counts = getDailyCounts();
  return counts[getToday()] || 0;
}

export function addToTodayCount(amount) {
  const counts = getDailyCounts();
  const today = getToday();
  counts[today] = (counts[today] || 0) + amount;
  write(KEYS.DAILY_COUNTS, counts);
  appendEntry(amount);
  return counts[today];
}

export function getAllTimeTotal() {
  const counts = getDailyCounts();
  return Object.values(counts).reduce((sum, n) => sum + n, 0);
}

// --- Daily goal ---

export function getDailyGoal() {
  return read(KEYS.DAILY_GOAL, 5000);
}

export function setDailyGoal(goal) {
  write(KEYS.DAILY_GOAL, goal);
}

// --- Last 7 days data for the bar chart ---

export function getLast7Days() {
  const counts = getDailyCounts();
  const goal = getDailyGoal();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = getLocalDateKey(d);
    const count = counts[key] || 0;
    const label = d.toLocaleDateString("en", { weekday: "short" });
    const isToday = i === 0;
    days.push({ date: key, label, count, goal, metGoal: count >= goal, isToday });
  }

  return days;
}

// --- Reminder settings ---

const DEFAULT_REMINDERS = {
  hourly: { enabled: false, interval: 1 },
  evening: { enabled: false },
  lateNight: { enabled: false },
};

export function getReminderSettings() {
  return read(KEYS.REMINDERS, DEFAULT_REMINDERS);
}

export function setReminderSettings(settings) {
  write(KEYS.REMINDERS, settings);
}
