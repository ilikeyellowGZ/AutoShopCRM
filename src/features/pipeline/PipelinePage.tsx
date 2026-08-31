import { useState } from "react";
import type { DemoState, Lead, LeadStage } from "../../domain/models";
import type { DemoRepository } from "../../repository/demoRepository";
import type { NavigationTarget } from "../../app/routes";
import { Button } from "../../components/controls/Button";
import { StatusPill } from "../../components/controls/StatusPill";
import { canMoveLead, PIPELINE_STAGES } from "./pipelineRules";

const currency = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });

export function PipelinePage({ state, repository, onNavigate, canWrite = true, defaultOwner = "Alicia Brown", lockOwner = false }: { state: DemoState; repository: DemoRepository; onNavigate?: (target: NavigationTarget) => void; canWrite?: boolean; defaultOwner?: string; lockOwner?: boolean }) {
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [expandedStages, setExpandedStages] = useState<LeadStage[]>([]);
  const [form, setForm] = useState({ customerId: state.customers[0]?.id ?? "", vehicleId: state.vehicles[0]?.id ?? "", owner: defaultOwner, stage: "Lead" as LeadStage, nextAction: "Call customer" });
  const move = (lead: Lead, stage: LeadStage) => { if (canMoveLead(lead.stage, stage)) repository.moveLead(lead.id, stage); };
  const createLead = () => {
    const vehicle = state.vehicles.find((item) => item.id === form.vehicleId);
    const owner = lockOwner ? defaultOwner : form.owner.trim();
    if (!form.customerId || !vehicle || !owner || !form.nextAction.trim()) { setError("Choose a customer and vehicle, then provide an owner and next action."); return; }
    try { repository.addLead({ id: `lead-${crypto.randomUUID?.() ?? Date.now()}`, ...form, owner, value: vehicle.price, dueAt: new Date().toISOString(), tone: "info" }); setCreating(false); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "The lead could not be saved."); }
  };
  return <section className="pipeline-page" aria-labelledby="pipeline-title">
    <header className="crm-heading"><div><p className="crm-eyebrow">Sales workflow</p><h1 id="pipeline-title">Pipeline</h1><p>Move each opportunity by pointer or the accessible stage menu. All changes persist locally.</p></div><div className="sales-actions"><strong className="pipeline-value">{currency.format(state.leads.reduce((sum, lead) => sum + lead.value, 0))}</strong>{canWrite ? <Button onClick={() => setCreating(!creating)}>{creating ? "Close form" : "New lead"}</Button> : null}</div></header>
    {creating && canWrite ? <form className="crm-form" onSubmit={(event) => { event.preventDefault(); createLead(); }} noValidate><h2>New lead</h2>{error && <p className="form-error" role="alert">{error}</p>}<label>Customer<select value={form.customerId} onChange={(event) => setForm({ ...form, customerId: event.target.value })}>{state.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label><label>Vehicle<select value={form.vehicleId} onChange={(event) => setForm({ ...form, vehicleId: event.target.value })}>{state.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model}</option>)}</select></label><label>Owner<input value={lockOwner ? defaultOwner : form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })} readOnly={lockOwner} required /></label><label>Stage<select value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value as LeadStage })}>{PIPELINE_STAGES.map((stage) => <option key={stage}>{stage}</option>)}</select></label><label>Next action<input value={form.nextAction} onChange={(event) => setForm({ ...form, nextAction: event.target.value })} required /></label><Button type="submit">Save lead</Button></form> : null}
    <div className="pipeline-board" data-tour="pipeline-board" aria-label="Sales pipeline">{PIPELINE_STAGES.map((stage) => {
      const leads = state.leads.filter((lead) => lead.stage === stage);
      const visibleLeads = expandedStages.includes(stage) ? leads : leads.slice(0, 8);
      return <section className="pipeline-column" key={stage} onDragOver={(event) => { if (canWrite) event.preventDefault(); }} onDrop={() => { if (!canWrite) return; const lead = state.leads.find((item) => item.id === draggedId); if (lead) move(lead, stage); setDraggedId(null); }}><header><h2>{stage}</h2><span>{leads.length}</span></header><div className="pipeline-cards">{visibleLeads.map((lead) => {
        const customer = state.customers.find((item) => item.id === lead.customerId); const vehicle = state.vehicles.find((item) => item.id === lead.vehicleId);
        return <article className="pipeline-card" key={lead.id} draggable={canWrite} onDragStart={() => { if (canWrite) setDraggedId(lead.id); }}><StatusPill tone={lead.tone}>{lead.nextAction}</StatusPill><h3>{customer?.name ?? "Unknown customer"}</h3><p>{vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle unavailable"}</p><strong>{currency.format(lead.value)}</strong>{canWrite ? <label>Move {customer?.name ?? "lead"} to<select value={lead.stage} onChange={(event) => move(lead, event.target.value as LeadStage)} aria-label={`Move ${customer?.name ?? "lead"} to a different stage`}>{PIPELINE_STAGES.map((option) => <option disabled={!canMoveLead(lead.stage, option) && option !== lead.stage} key={option}>{option}</option>)}</select></label> : null}<div className="pipeline-card-actions">{onNavigate ? <Button variant="secondary" onClick={() => onNavigate({ page: "customers", subview: "leads", recordType: "lead", recordId: lead.id })}>Open lead record</Button> : null}{canWrite ? PIPELINE_STAGES.filter((option) => canMoveLead(lead.stage, option)).slice(0, 2).map((option) => <Button variant="secondary" key={option} onClick={() => move(lead, option)}>Move to {option}</Button>) : null}</div></article>;
      })}</div>{leads.length > visibleLeads.length ? <Button variant="quiet" onClick={() => setExpandedStages((current) => [...current, stage])}>Show all {leads.length} {stage} leads</Button> : null}</section>;
    })}</div>
  </section>;
}
