import { financeBreakdown } from "../../domain/calculations";
import type { FinanceDraft } from "../../domain/models";

const zar = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function PaymentBreakdown({ draft }: { draft: FinanceDraft }) {
  const breakdown = financeBreakdown(draft);
  return <aside className="finance-breakdown" data-tour="finance-breakdown" aria-labelledby="payment-breakdown-title">
    <p className="finance-eyebrow">Live estimate</p>
    <h2 id="payment-breakdown-title">Payment breakdown</h2>
    <strong className="finance-monthly">{zar.format(breakdown.monthly)}<small>/ month</small></strong>
    <p className="finance-term">Estimated over {draft.termMonths} months at {draft.aprPercent.toFixed(2)}% APR.</p>
    <dl>
      <div><dt>Vehicle price</dt><dd>{zar.format(draft.vehiclePrice)}</dd></div>
      <div><dt>Down payment</dt><dd>− {zar.format(draft.downPayment)}</dd></div>
      <div><dt>Net trade equity</dt><dd>{breakdown.netTrade < 0 ? "− " : "+ "}{zar.format(Math.abs(breakdown.netTrade))}</dd></div>
      <div><dt>Products</dt><dd>+ {zar.format(breakdown.feesAndProducts)}</dd></div>
      <div className="finance-breakdown-total"><dt>Amount financed</dt><dd>{zar.format(breakdown.amountFinanced)}</dd></div>
    </dl>
  </aside>;
}
