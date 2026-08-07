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
