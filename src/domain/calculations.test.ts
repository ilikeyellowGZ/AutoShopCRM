import { describe, expect, it } from "vitest";
import { landedCost, maximumOffer, projectedGrossProfit, projectedMarginPercent, stockAge } from "./calculations";

describe("MotorOS domain calculations", () => {
  it("calculates landed cost from every approved vehicle cost", () => {
    expect(landedCost({ acquisitionPrice: 300_000, transport: 4_500, verification: 900, reconditioning: 12_000, parts: 2_000, labour: 3_000, allocatedDirectCosts: 800, otherApprovedVehicleCosts: 1_000 })).toBe(324_200);
  });

  it("calculates gross profit and guards zero-price margin", () => {
    expect(projectedGrossProfit(400_000, 324_200, 8_000)).toBe(67_800);
    expect(projectedMarginPercent(400_000, 67_800)).toBeCloseTo(16.95);
    expect(projectedMarginPercent(0, 100)).toBe(0);
  });

  it("explains the maximum offer calculation", () => {
    expect(maximumOffer({ conservativeMarketValue: 520_000, estimatedRecon: 18_000, transport: 4_000, riskBuffer: 7_500, requiredGrossProfit: 42_000, otherAcquisitionCosts: 1_500 })).toBe(447_000);
  });

  it("calculates operational age in whole days", () => {
    expect(stockAge("2025-05-01T00:00:00.000Z", new Date("2025-05-20T12:00:00.000Z"))).toBe(19);
  });
});
