import { describe, expect, it } from "vitest";
import { createDemoClock, nextDemoDayAtNine } from "./demoClock";

describe("demo clock", () => {
  it("is injectable and exposes the deterministic employee-demo time", () => {
    expect(createDemoClock("2026-08-16T08:00:00+02:00").now()).toBe("2026-08-16T08:00:00+02:00");
  });

  it("reschedules for 09:00 on the day after the later clock or task date", () => {
    expect(nextDemoDayAtNine("2026-08-16T08:00:00+02:00", "2026-08-15T10:00:00+02:00")).toBe("2026-08-17T09:00:00+02:00");
    expect(nextDemoDayAtNine("2026-08-16T08:00:00+02:00", "2026-08-18T14:00:00+02:00")).toBe("2026-08-19T09:00:00+02:00");
  });
});
