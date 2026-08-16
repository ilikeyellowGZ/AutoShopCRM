import { describe, expect, it } from "vitest";
import type { FinanceDraft } from "../../domain/models";
import { validateFinanceDraft } from "./financeValidation";

const validDraft: FinanceDraft = {
  vehicleId: "vehicle-01", vehiclePrice: 3_699_900, downPayment: 450_000, termMonths: 60,
  aprPercent: 11.25, tradeAllowance: 300_000, lienPayoff: 120_000, serviceContract: 45_000, gapInsurance: 8_950,
};

describe("validateFinanceDraft", () => {
  it("rejects a down payment greater than the vehicle price", () => {
    expect(validateFinanceDraft({ ...validDraft, downPayment: validDraft.vehiclePrice + 1 }))
      .toEqual({ downPayment: "Down payment must be lower than the vehicle price." });
  });

  it("rejects unsupported terms and invalid monetary inputs", () => {
    expect(validateFinanceDraft({ ...validDraft, vehiclePrice: 0, termMonths: 24 as 36, aprPercent: 31, lienPayoff: -1 }))
      .toEqual({ vehiclePrice: "Vehicle price must be greater than zero.", downPayment: "Down payment must be lower than the vehicle price.", termMonths: "Choose a term of 36, 48, 60, or 72 months.", aprPercent: "APR must be between 0% and 30%.", lienPayoff: "Lien payoff cannot be negative." });
  });
});
