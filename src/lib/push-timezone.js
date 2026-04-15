/** Hour 0–23 in `timeZone` for the given instant. */
export function getLocalHour(timeZone, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    hourCycle: "h23",
  }).formatToParts(date);
  return Number(parts.find((p) => p.type === "hour")?.value ?? 0);
}

/** YYYY-MM-DD in `timeZone` for the given instant (en-CA yields ISO date). */
export function getLocalDateKeyForZone(timeZone, date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
