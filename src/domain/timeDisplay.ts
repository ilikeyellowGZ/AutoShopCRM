const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function magnitude(ms: number): string {
  const days = Math.floor(ms / DAY);
  const hours = Math.floor((ms % DAY) / HOUR);
  const minutes = Math.floor((ms % HOUR) / MINUTE);
  if (days > 0) return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
  if (hours > 0) return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  return `${Math.max(minutes, 1)}m`;
}

/** A short, human estimate of when a due task will be finished relative to `now`. */
export function formatTimeRemaining(dueAt: string, now: string): string {
  const diff = new Date(dueAt).getTime() - new Date(now).getTime();
  if (Math.abs(diff) < MINUTE) return "Due now";
  return diff > 0 ? `Due in ${magnitude(diff)}` : `Overdue by ${magnitude(-diff)}`;
}

/** A short "time ago" label for activity and notification timestamps. */
export function formatRelativeTime(pastAt: string, now: string): string {
  const diff = new Date(now).getTime() - new Date(pastAt).getTime();
  if (diff < MINUTE) return "Just now";
  return `${magnitude(diff)} ago`;
}
