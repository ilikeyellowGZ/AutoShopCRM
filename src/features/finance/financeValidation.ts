import type { FinanceDraft } from "../../domain/models";

export type FinanceValidationErrors = Partial<Record<Exclude<keyof FinanceDraft, "vehicleId">, string>>;

const terms = new Set([36, 48, 60, 72]);
const nonNegativeFields: Array<Exclude<keyof FinanceDraft, "vehicleId" | "vehiclePrice" | "downPayment" | "termMonths" | "aprPercent">> = ["tradeAllowance", "lienPayoff", "serviceContract", "gapInsurance"];

export function validateFinanceDraft(draft: FinanceDraft): FinanceValidationErrors {
  const errors: FinanceValidationErrors = {};
  if (!Number.isFinite(draft.vehiclePrice) || draft.vehiclePrice <= 0) errors.vehiclePrice = "Vehicle price must be greater than zero.";
  if (!Number.isFinite(draft.downPayment) || draft.downPayment < 0) errors.downPayment = "Down payment cannot be negative.";
  else if (draft.downPayment >= draft.vehiclePrice) errors.downPayment = "Down payment must be lower than the vehicle price.";
  if (!terms.has(draft.termMonths)) errors.termMonths = "Choose a term of 36, 48, 60, or 72 months.";
  if (!Number.isFinite(draft.aprPercent) || draft.aprPercent < 0 || draft.aprPercent > 30) errors.aprPercent = "APR must be between 0% and 30%.";
  const labels = { tradeAllowance: "Trade allowance", lienPayoff: "Lien payoff", serviceContract: "Service contract", gapInsurance: "GAP insurance" };
  nonNegativeFields.forEach((field) => {
    if (!Number.isFinite(draft[field]) || draft[field] < 0) errors[field] = `${labels[field]} cannot be negative.`;
  });
  return errors;
}
