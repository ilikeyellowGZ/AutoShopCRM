import { describe, expect, it } from "vitest";
import { financeBreakdown, landedCost, maximumOffer, monthlyPayment, projectedGrossProfit, projectedMarginPercent, stockAge } from "./calculations";

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

  it("calculates amortized monthly payment and guards a zero interest rate", () => {
    expect(monthlyPayment({ principal: 100_000, annualRatePercent: 0, termMonths: 60 })).toBeCloseTo(1666.67, 2);
    expect(monthlyPayment({ principal: 100_000, annualRatePercent: 12, termMonths: 60 })).toBeCloseTo(2224.44, 2);
  });

  it("returns zero for finance payments with invalid amounts, rates, or terms", () => {
    expect(monthlyPayment({ principal: -1, annualRatePercent: 12, termMonths: 60 })).toBe(0);
    expect(monthlyPayment({ principal: 100_000, annualRatePercent: -1, termMonths: 60 })).toBe(0);
    expect(monthlyPayment({ principal: 100_000, annualRatePercent: 12, termMonths: 0 })).toBe(0);
    expect(monthlyPayment({ principal: Number.NaN, annualRatePercent: 12, termMonths: 60 })).toBe(0);
  });

  it("derives a finance breakdown with trade equity, products, and a non-negative amount financed", () => {
    expect(financeBreakdown({
      vehicleId: "vehicle-01",
      vehiclePrice: 100_000,
      downPayment: 10_000,
      termMonths: 60,
      aprPercent: 12,
      tradeAllowance: 25_000,
      lienPayoff: 5_000,
      serviceContract: 3_000,
      gapInsurance: 2_000,
    })).toEqual({ netTrade: 20_000, feesAndProducts: 5_000, amountFinanced: 75_000, monthly: 1668.33 });
  });

  it("keeps a malformed finance draft from producing non-finite currency values", () => {
    expect(financeBreakdown({
      vehicleId: "vehicle-01",
      vehiclePrice: Number.NaN,
      downPayment: Number.POSITIVE_INFINITY,
      termMonths: 60,
      aprPercent: Number.NaN,
      tradeAllowance: Number.NaN,
      lienPayoff: Number.NaN,
      serviceContract: Number.NaN,
      gapInsurance: Number.NaN,
    })).toEqual({ netTrade: 0, feesAndProducts: 0, amountFinanced: 0, monthly: 0 });
  });
});
