import { describe, expect, it } from "vitest";
import { canTransitionServiceJob } from "./serviceRules";

describe("canTransitionServiceJob", () => {
  it("requires quality check before a vehicle can be marked ready", () => {
    expect(canTransitionServiceJob("In Progress", "Ready")).toBe(false);
    expect(canTransitionServiceJob("Quality Check", "Ready")).toBe(true);
  });

  it("allows only operational next steps and never a same-state update", () => {
    expect(canTransitionServiceJob("Checked In", "In Progress")).toBe(true);
    expect(canTransitionServiceJob("Checked In", "Waiting for Parts")).toBe(true);
    expect(canTransitionServiceJob("Booked", "Completed")).toBe(false);
    expect(canTransitionServiceJob("Completed", "Completed")).toBe(false);
  });

  it("returns false rather than throwing for runtime-invalid states", () => {
    expect(canTransitionServiceJob("Unknown" as never, "Ready")).toBe(false);
    expect(canTransitionServiceJob("Booked", "Unknown" as never)).toBe(false);
  });
});
