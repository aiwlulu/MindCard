const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const dateFormatter = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

/** Short label for list cards: relative within a week, a plain date after. */
export function formatShortDate(date: Date, now: Date = new Date()): string {
  const elapsed = now.getTime() - date.getTime();

  if (elapsed < 0 || elapsed >= 7 * DAY) return dateFormatter.format(date);
  if (elapsed < MINUTE) return "just now";
  if (elapsed < HOUR) {
    return relativeFormatter.format(-Math.floor(elapsed / MINUTE), "minute");
  }
  if (elapsed < DAY) {
    return relativeFormatter.format(-Math.floor(elapsed / HOUR), "hour");
  }
  return relativeFormatter.format(-Math.floor(elapsed / DAY), "day");
}
