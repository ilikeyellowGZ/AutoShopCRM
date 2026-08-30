import { describe, expect, it } from "vitest";
import type { SessionRecord } from "./models";
import { PRESENCE_THRESHOLDS, sessionDurationMs, sessionPresence } from "./sessions";

const at = (minutesAgo: number) => new Date(Date.parse("2026-08-29T12:00:00Z") - minutesAgo * 60_000).toISOString();
const NOW = "2026-08-29T12:00:00Z";

const session = (patch: Partial<SessionRecord> = {}): SessionRecord => ({
  id: "session-0001",
  organizationId: "org-motorgroup-sa",
  branchId: "org-motorgroup-sa-branch-johannesburg-north",
  accountId: "sales",
  actor: "Naledi Ndlovu · Sales Executive",
  startedAt: at(60),
  lastActivityAt: at(0),
  status: "active",
  userAgent: "test-agent",
  ...patch,
});

describe("session presence", () => {
  it("reports a recently active session as online", () => {
    expect(sessionPresence(session({ lastActivityAt: at(1) }), NOW)).toBe("online");
  });

  it("reports idle once the configured idle threshold passes", () => {
    const justIdle = at(PRESENCE_THRESHOLDS.idleAfterMs / 60_000);
    expect(sessionPresence(session({ lastActivityAt: justIdle }), NOW)).toBe("idle");
  });

  it("reports away once the configured away threshold passes", () => {
    const justAway = at(PRESENCE_THRESHOLDS.awayAfterMs / 60_000);
    expect(sessionPresence(session({ lastActivityAt: justAway }), NOW)).toBe("away");
  });

  it("reports an ended session as offline regardless of its last activity", () => {
    expect(sessionPresence(session({ status: "ended", lastActivityAt: at(0) }), NOW)).toBe("offline");
  });

  it("reports offline rather than guessing when the timestamp is unreadable", () => {
    expect(sessionPresence(session({ lastActivityAt: "not-a-date" }), NOW)).toBe("offline");
  });
});

describe("session duration", () => {
  it("measures an open session up to the current time", () => {
    expect(sessionDurationMs(session({ startedAt: at(30) }), NOW)).toBe(30 * 60_000);
  });

  it("measures a closed session up to the time it ended", () => {
    expect(sessionDurationMs(session({ startedAt: at(30), endedAt: at(10), status: "ended" }), NOW)).toBe(20 * 60_000);
  });

  it("never reports a negative duration", () => {
    expect(sessionDurationMs(session({ startedAt: NOW, endedAt: at(10), status: "ended" }), NOW)).toBe(0);
  });
});
