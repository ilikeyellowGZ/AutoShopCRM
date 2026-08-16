import { describe, expect, it } from "vitest";
import { canMoveLead } from "./pipelineRules";

describe("canMoveLead", () => {
  it("permits forward and recovery pipeline moves but rejects an identical stage", () => {
    expect(canMoveLead("Lead", "Negotiation")).toBe(true);
    expect(canMoveLead("Contract", "Negotiation")).toBe(true);
    expect(canMoveLead("Delivery", "Delivery")).toBe(false);
  });
});
