import { describe, expect, it } from "vitest";
import { formatRelativeTime, formatTimeRemaining } from "./timeDisplay";

const now = "2026-08-18T08:00:00+02:00";

describe("formatTimeRemaining", () => {
  it("shows a future due date as a countdown", () => {
    expect(formatTimeRemaining("2026-08-18T10:15:00+02:00", now)).toBe("Due in 2h 15m");
  });

  it("rolls over to days once the countdown exceeds 24 hours", () => {
    expect(formatTimeRemaining("2026-08-20T09:00:00+02:00", now)).toBe("Due in 2d 1h");
  });

  it("shows an overdue task as overdue by an elapsed amount", () => {
    expect(formatTimeRemaining("2026-08-18T06:45:00+02:00", now)).toBe("Overdue by 1h 15m");
  });

  it("treats anything within a minute of now as due now", () => {
    expect(formatTimeRemaining("2026-08-18T08:00:20+02:00", now)).toBe("Due now");
  });
});

describe("formatRelativeTime", () => {
  it("renders a short time-ago label", () => {
    expect(formatRelativeTime("2026-08-18T06:00:00+02:00", now)).toBe("2h ago");
  });

  it("collapses sub-minute gaps to just now", () => {
    expect(formatRelativeTime("2026-08-18T07:59:45+02:00", now)).toBe("Just now");
  });
});
