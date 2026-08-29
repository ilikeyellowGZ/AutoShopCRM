import type { SessionRecord } from "./models";

export type SessionPresence = "online" | "idle" | "away" | "offline";

export const PRESENCE_THRESHOLDS = { idleAfterMs: 5 * 60_000, awayAfterMs: 20 * 60_000 } as const;

export function sessionPresence(session: SessionRecord, now: string): SessionPresence {
  if (session.status === "ended") return "offline";
  const elapsed = new Date(now).getTime() - new Date(session.lastActivityAt).getTime();
  if (!Number.isFinite(elapsed)) return "offline";
  if (elapsed >= PRESENCE_THRESHOLDS.awayAfterMs) return "away";
  if (elapsed >= PRESENCE_THRESHOLDS.idleAfterMs) return "idle";
  return "online";
}

export function sessionDurationMs(session: SessionRecord, now: string): number {
  const end = session.endedAt ?? now;
  const elapsed = new Date(end).getTime() - new Date(session.startedAt).getTime();
  return Number.isFinite(elapsed) && elapsed > 0 ? elapsed : 0;
}
