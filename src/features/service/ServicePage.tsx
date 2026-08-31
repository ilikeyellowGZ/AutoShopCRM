import { useMemo, useState } from "react";
import type { NavigationTarget } from "../../app/routes";
import { Button } from "../../components/controls/Button";
import { StatusPill } from "../../components/controls/StatusPill";
import { Tabs } from "../../components/controls/Tabs";
import type { DemoState, ServiceJob, ViewPreferences } from "../../domain/models";
import type { DemoRepository } from "../../repository/demoRepository";
import { canTransitionServiceJob, type ServiceStatus } from "./serviceRules";

const statuses: ServiceStatus[] = ["Booked", "Checked In", "In Progress", "Waiting for Parts", "Quality Check", "Ready", "Completed"];
const tone = (status: ServiceStatus) => status === "Completed" || status === "Ready" ? "positive" : status === "Waiting for Parts" ? "critical" : status === "Quality Check" ? "warning" : "info" as const;
const partsRiskOptions: ServiceJob["partsRisk"][] = ["Clear", "At Risk", "Blocked"];
const partsRiskTone = (risk: ServiceJob["partsRisk"]) => risk === "Blocked" ? "critical" : risk === "At Risk" ? "warning" : "positive" as const;
const approvalTone = (approval: ServiceJob["approvalState"]) => approval === "Approved" ? "positive" : approval === "Pending" ? "warning" : "neutral" as const;
const defaults: ViewPreferences["service"] = { query: "", filter: "All", view: "Board" };

type ServicePageProps = { state: DemoState; repository: DemoRepository; viewPreferences?: ViewPreferences["service"]; onViewPreferencesChange?: (patch: Partial<ViewPreferences["service"]>) => void; onNavigate?: (target: NavigationTarget) => void; canWrite?: boolean };

export function ServicePage({ state, repository, viewPreferences, onViewPreferencesChange, onNavigate, canWrite = true }: ServicePageProps) {
  const [fallback, setFallback] = useState(defaults);
  const { view, filter, query } = viewPreferences ?? fallback;
  const [notes, setNotes] = useState<Record<string, string>>({});
  const changeView = (patch: Partial<ViewPreferences["service"]>) => { if (!viewPreferences) setFallback((current) => ({ ...current, ...patch })); onViewPreferencesChange?.(patch); };
  const jobs = useMemo(() => state.serviceJobs.filter((job) => {
    const customer = state.customers.find((item) => item.id === job.customerId);
    const vehicle = state.vehicles.find((item) => item.id === job.vehicleId);
    return (filter === "All" || job.status === filter) && `${customer?.name} ${vehicle?.make} ${vehicle?.model} ${job.advisor} ${job.technician}`.toLowerCase().includes(query.toLowerCase());
  }), [filter, query, state]);
  const jobCard = (job: ServiceJob) => {
    const customer = state.customers.find((item) => item.id === job.customerId);
    const vehicle = state.vehicles.find((item) => item.id === job.vehicleId);
    const next = statuses.filter((status) => canTransitionServiceJob(job.status, status));
    return <article className="service-card" key={job.id}>
      <header><StatusPill tone={tone(job.status)}>{job.status}</StatusPill><time dateTime={job.dueAt}>Due {new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(job.dueAt))}</time></header>
      <h3>{vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle unavailable"}</h3>
      <p>{customer?.name ?? "Customer unavailable"} · Advisor: {job.advisor}</p>
      <p>Technician: {job.technician}</p>
      <p className="service-card-status-row">Parts risk: <StatusPill tone={partsRiskTone(job.partsRisk)}>{job.partsRisk}</StatusPill>{canWrite ? <label className="sr-only" htmlFor={`parts-risk-${job.id}`}>Parts risk for job {job.id}</label> : null}{canWrite ? <select id={`parts-risk-${job.id}`} value={job.partsRisk} onChange={(event) => repository.updateServicePartsRisk(job.id, event.target.value as ServiceJob["partsRisk"])}>{partsRiskOptions.map((risk) => <option key={risk} value={risk}>{risk}</option>)}</select> : null}</p>
      <p className="service-card-status-row">Customer approval: <StatusPill tone={approvalTone(job.approvalState)}>{job.approvalState}</StatusPill></p>
      <label className="service-notes">Job note<textarea value={notes[job.id] ?? job.note} readOnly={!canWrite} onChange={(event) => { if (canWrite) setNotes({ ...notes, [job.id]: event.target.value }); }} /></label>
      <div className="service-card-actions">{onNavigate ? <Button variant="secondary" onClick={() => onNavigate({ page: "service", subview: "service-board", recordType: "service", recordId: job.id })}>Open service job {job.id}</Button> : null}{canWrite ? <><Button variant="secondary" onClick={() => repository.updateServiceJob(job.id, { note: notes[job.id] ?? job.note })}>Save note</Button>{job.approvalState === "Pending" ? <Button onClick={() => repository.approveServiceJob(job.id)}>Record customer approval</Button> : null}{next.map((status) => <Button key={status} onClick={() => repository.updateServiceState(job.id, status)}>Move to {status}</Button>)}</> : null}</div>
    </article>;
  };
  const orderedJobs = [...jobs].sort((a, b) => a.dueAt.localeCompare(b.dueAt));
  const schedule = <div className="service-schedule" aria-label="Service schedule">{Object.entries(orderedJobs.reduce<Record<string, ServiceJob[]>>((groups, job) => { const day = job.dueAt.slice(0, 10); (groups[day] ??= []).push(job); return groups; }, {})).map(([day, scheduled]) => <section className="service-schedule-day" key={day}><h2><time dateTime={day}>{new Intl.DateTimeFormat("en-ZA", { weekday: "long", day: "numeric", month: "long" }).format(new Date(`${day}T12:00:00`))}</time></h2><ol>{scheduled.map((job) => <li key={job.id}>{jobCard(job)}</li>)}</ol></section>)}</div>;
  const content = jobs.length === 0 ? <p className="service-empty">No service jobs match these filters. Clear a filter or create a booking from the service desk.</p> : view === "Board" ? <div className="service-board">{statuses.filter((status) => jobs.some((job) => job.status === status)).map((status) => <section className="service-column" key={status} aria-labelledby={`service-${status}`}><h2 id={`service-${status}`}>{status}</h2>{jobs.filter((job) => job.status === status).map(jobCard)}</section>)}</div> : view === "Schedule" ? schedule : <div className="service-list" aria-label="Service job list">{orderedJobs.map(jobCard)}</div>;
  return <section className="service-page" aria-labelledby="service-title"><header className="finance-heading"><div><p className="finance-eyebrow">Aftersales · connected operations</p><h1 id="service-title">Service board</h1><p>Manage booked work, customer approval, parts risk and handover through local demo job cards.</p></div></header><div className="service-toolbar" data-tour="service-toolbar"><label>Search jobs<input value={query} onChange={(event) => changeView({ query: event.target.value })} placeholder="Customer, vehicle, advisor" /></label><label>Status<select value={filter} onChange={(event) => changeView({ filter: event.target.value as ViewPreferences["service"]["filter"] })}><option>All</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label></div><Tabs items={[{ id: "Board", label: "Board", panel: view === "Board" ? content : null }, { id: "Schedule", label: "Schedule", panel: view === "Schedule" ? content : null }, { id: "List", label: "List", panel: view === "List" ? content : null }]} activeId={view} onChange={(next) => changeView({ view: next })} label="Service views" /></section>;
}
