export type DemoClock = { now(): string };

export const DEMO_NOW = "2026-08-16T08:00:00+02:00";

export function createDemoClock(now = DEMO_NOW): DemoClock {
  return { now: () => now };
}

export const demoClock = createDemoClock();

/** Schedules at 09:00 on the calendar day after the later demo/task date. */
export function nextDemoDayAtNine(now: string, taskDueAt: string): string {
  const baseDate = now.slice(0, 10) > taskDueAt.slice(0, 10) ? now.slice(0, 10) : taskDueAt.slice(0, 10);
  const next = new Date(`${baseDate}T00:00:00Z`);
  next.setUTCDate(next.getUTCDate() + 1);
  return `${next.toISOString().slice(0, 10)}T09:00:00+02:00`;
}
