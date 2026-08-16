import { useEffect, useMemo, useState } from "react";
import type { FinanceDraft, DemoState } from "../../domain/models";
import type { DemoRepository } from "../../repository/demoRepository";
import { Button } from "../../components/controls/Button";
import { Field } from "../../components/controls/Field";
import { PaymentBreakdown } from "./PaymentBreakdown";
import { validateFinanceDraft, type FinanceValidationErrors } from "./financeValidation";

const terms = [36, 48, 60, 72] as const;

function draftForVehicle(state: DemoState, vehicleId: string): FinanceDraft {
  const vehicle = state.vehicles.find((item) => item.id === vehicleId);
  return state.financeDrafts.find((item) => item.vehicleId === vehicleId) ?? { vehicleId, vehiclePrice: vehicle?.price ?? 0, downPayment: 0, termMonths: 60, aprPercent: 0, tradeAllowance: 0, lienPayoff: 0, serviceContract: 0, gapInsurance: 0 };
}

export function FinancePage({ state, repository }: { state: DemoState; repository: DemoRepository }) {
  const initialVehicleId = useMemo(() => state.financeDrafts[0]?.vehicleId ?? state.vehicles[0]?.id ?? "", [state]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(initialVehicleId);
  const saved = useMemo(() => draftForVehicle(state, selectedVehicleId), [state, selectedVehicleId]);
  const [draft, setDraft] = useState(saved);
  const [errors, setErrors] = useState<FinanceValidationErrors>({});
  const [submitted, setSubmitted] = useState(false);
  useEffect(() => setDraft(saved), [saved]);
  const update = <K extends keyof FinanceDraft>(key: K, value: FinanceDraft[K]) => {
    const next = { ...draft, [key]: value };
    setDraft(next); setSubmitted(false); repository.updateFinanceDraft(selectedVehicleId, { [key]: value });
  };
  const submit = () => {
    const nextErrors = validateFinanceDraft(draft); setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    repository.submitFinanceApplication(selectedVehicleId); setSubmitted(true);
  };
  return <section className="finance-page" aria-labelledby="finance-title">
    <header className="finance-heading"><div><p className="finance-eyebrow">F&I · local demo workspace</p><h1 id="finance-title">Structure a deal</h1><p>Build an indicative South African Rand repayment plan for a connected vehicle.</p></div></header>
    <div className="finance-layout"><form className="finance-form" onSubmit={(event) => { event.preventDefault(); submit(); }} noValidate>
      <fieldset><legend>Vehicle and customer contribution</legend>
        <label className="finance-select">Vehicle<select value={selectedVehicleId} onChange={(event) => { const vehicleId = event.target.value; const next = draftForVehicle(repository.getState(), vehicleId); setSelectedVehicleId(vehicleId); setDraft(next); setErrors({}); setSubmitted(false); }}>{state.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model}</option>)}</select></label>
        <Field label="Vehicle price (ZAR)" type="number" min="0" value={draft.vehiclePrice} onChange={(event) => update("vehiclePrice", Number(event.target.value))} error={errors.vehiclePrice} />
        <Field label="Down payment (ZAR)" type="number" min="0" value={draft.downPayment} onChange={(event) => update("downPayment", Number(event.target.value))} error={errors.downPayment} />
        <Field label="Trade allowance (ZAR)" type="number" min="0" value={draft.tradeAllowance} onChange={(event) => update("tradeAllowance", Number(event.target.value))} error={errors.tradeAllowance} />
        <Field label="Lien payoff (ZAR)" type="number" min="0" value={draft.lienPayoff} onChange={(event) => update("lienPayoff", Number(event.target.value))} error={errors.lienPayoff} />
      </fieldset>
      <fieldset><legend>Finance and protection</legend>
        <label className="finance-select">Term<select value={draft.termMonths} onChange={(event) => update("termMonths", Number(event.target.value) as FinanceDraft["termMonths"])}>{terms.map((term) => <option key={term} value={term}>{term} months</option>)}</select></label>
        <Field label="Interest rate (APR %)" type="number" min="0" max="30" step="0.01" value={draft.aprPercent} onChange={(event) => update("aprPercent", Number(event.target.value))} error={errors.aprPercent} />
        <Field label="Service contract (ZAR)" type="number" min="0" value={draft.serviceContract} onChange={(event) => update("serviceContract", Number(event.target.value))} error={errors.serviceContract} />
        <Field label="GAP insurance (ZAR)" type="number" min="0" value={draft.gapInsurance} onChange={(event) => update("gapInsurance", Number(event.target.value))} error={errors.gapInsurance} />
      </fieldset>
      <div className="finance-submit"><Button type="submit">Submit demo application</Button><p>Sandbox only — this records a local activity and does not contact a lender.</p></div>
      {submitted && <p className="finance-success" role="status">Demo application recorded locally. No lender was contacted.</p>}
    </form><PaymentBreakdown draft={draft} /></div>
  </section>;
}
