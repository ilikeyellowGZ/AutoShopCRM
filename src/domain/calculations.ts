import type { FinanceDraft } from "./models";

export type AppraisalInputs = {
  conservativeMarketValue: number;
  estimatedRecon: number;
  transport: number;
  riskBuffer: number;
  requiredGrossProfit: number;
  otherAcquisitionCosts: number;
};

export function landedCost(values: {
  acquisitionPrice: number;
  transport: number;
  verification: number;
  reconditioning: number;
  parts: number;
  labour: number;
  allocatedDirectCosts: number;
  otherApprovedVehicleCosts: number;
}): number {
  return Object.values(values).reduce((total, value) => total + value, 0);
}

export function projectedGrossProfit(plannedSellingPrice: number, totalLandedCost: number, projectedDealCosts: number): number {
  return plannedSellingPrice - totalLandedCost - projectedDealCosts;
}

export function projectedMarginPercent(plannedSellingPrice: number, grossProfit: number): number {
  return plannedSellingPrice <= 0 ? 0 : (grossProfit / plannedSellingPrice) * 100;
}

export function maximumOffer(values: AppraisalInputs): number {
  return Math.max(
    0,
    values.conservativeMarketValue -
      values.estimatedRecon -
      values.transport -
      values.riskBuffer -
      values.requiredGrossProfit -
      values.otherAcquisitionCosts,
  );
}

export function stockAge(acquiredAt: string, today = new Date()): number {
  const acquired = new Date(acquiredAt).getTime();
  const current = today.getTime();
  return Math.max(0, Math.floor((current - acquired) / 86_400_000));
}

export type FinancePaymentInput = {
  principal: number;
  annualRatePercent: number;
  termMonths: number;
};

export type FinanceBreakdown = {
  netTrade: number;
  feesAndProducts: number;
  amountFinanced: number;
  monthly: number;
};

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const nonNegativeFinite = (value: number) => Number.isFinite(value) && value >= 0 ? value : 0;

export function monthlyPayment({ principal, annualRatePercent, termMonths }: FinancePaymentInput): number {
  if (!Number.isFinite(principal) || !Number.isFinite(annualRatePercent) || !Number.isFinite(termMonths) || principal < 0 || annualRatePercent < 0 || termMonths <= 0) {
    return 0;
  }

  if (principal === 0) return 0;
  if (annualRatePercent === 0) return roundCurrency(principal / termMonths);

  const monthlyRate = annualRatePercent / 100 / 12;
  const compoundRate = (1 + monthlyRate) ** termMonths;
  const payment = principal * monthlyRate * compoundRate / (compoundRate - 1);

  return Number.isFinite(payment) ? roundCurrency(payment) : 0;
}

export function financeBreakdown(draft: FinanceDraft): FinanceBreakdown {
  const vehiclePrice = nonNegativeFinite(draft.vehiclePrice);
  const downPayment = nonNegativeFinite(draft.downPayment);
  const tradeAllowance = nonNegativeFinite(draft.tradeAllowance);
  const lienPayoff = nonNegativeFinite(draft.lienPayoff);
  const serviceContract = nonNegativeFinite(draft.serviceContract);
  const gapInsurance = nonNegativeFinite(draft.gapInsurance);
  const netTrade = tradeAllowance - lienPayoff;
  const feesAndProducts = serviceContract + gapInsurance;
  const amountFinanced = Math.max(0, vehiclePrice - downPayment - netTrade + feesAndProducts);

  return {
    netTrade,
    feesAndProducts,
    amountFinanced,
    monthly: monthlyPayment({ principal: amountFinanced, annualRatePercent: draft.aprPercent, termMonths: draft.termMonths }),
  };
}
