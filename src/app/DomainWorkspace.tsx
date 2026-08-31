import { useEffect, useState } from "react";
import type { DemoState, Lead, PersistedRecordType, ServiceJob, TaskItem } from "../domain/models";
import { Button } from "../components/controls/Button";
import type { NavigationTarget } from "./routes";

type Row = { id: string; title: string; detail: string; action?: string; target?: NavigationTarget };
type Workspace = { eyebrow: string; heading: string; rows: Row[] };
const money = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
const exact = (type: PersistedRecordType, id: string): NavigationTarget => type === "vehicle" ? { page: "inventory", subview: id, recordType: type, recordId: id } : type === "customer" ? { page: "customers", subview: id, recordType: type, recordId: id } : type === "lead" ? { page: "customers", subview: "leads", recordType: type, recordId: id } : type === "deal" ? { page: "sales", subview: "deals", recordType: type, recordId: id } : type === "service" ? { page: "service", subview: "service-board", recordType: type, recordId: id } : { page: "operations", subview: "tasks", recordType: type, recordId: id };

function vehicleRows(state: DemoState, action: string, ids: Set<string>): Row[] {
  return state.vehicles.filter((vehicle) => ids.has(vehicle.id)).map((vehicle) => ({ id: vehicle.id, title: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.derivative}`, detail: `${vehicle.stockId} · ${vehicle.status} · ${vehicle.branch} · ${money.format(vehicle.price)}`, action: `${action} ${vehicle.id}`, target: exact("vehicle", vehicle.id) }));
}

function leadRows(state: DemoState, leads: Lead[], action: string): Row[] {
  return leads.map((lead) => {
    const customer = state.customers.find((item) => item.id === lead.customerId);
    const vehicle = state.vehicles.find((item) => item.id === lead.vehicleId);
    return { id: lead.id, title: lead.nextAction, detail: `${customer?.name ?? "Customer"} · ${vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "Vehicle unavailable"}`, action: `${action} ${lead.id}`, target: exact("lead", lead.id) };
  });
}

function dealRows(state: DemoState, action: string, predicate: (deal: DemoState["deals"][number]) => boolean, canViewFinancials: boolean): Row[] {
  return state.deals.filter(predicate).map((deal) => ({ id: deal.id, title: `Deal ${deal.id}`, detail: `${state.customers.find((customer) => customer.id === deal.customerId)?.name ?? "Customer"} · ${deal.salesRep} · ${deal.status}${canViewFinancials ? ` · ${money.format(deal.grossProfit)}` : ""}`, action: `${action} ${deal.id}`, target: exact("deal", deal.id) }));
}

function serviceRows(state: DemoState, action: string, predicate: (job: ServiceJob) => boolean): Row[] {
  return state.serviceJobs.filter(predicate).map((job) => ({ id: job.id, title: `Service job ${job.id}`, detail: `${job.note} · ${job.advisor} · ${job.technician} · ${job.status}`, action: `${action} ${job.id}`, target: exact("service", job.id) }));
}

function taskRows(state: DemoState, action: string, prefix = ""): Row[] {
  return state.tasks.map((task) => ({ id: task.id, title: task.title, detail: `${prefix}${task.detail}`, action: `${action} ${task.id}`, target: exact("task", task.id) }));
}

function relatedOwner(task: TaskItem, state: DemoState): string | undefined {
  if (task.relatedType === "lead") return state.leads.find((lead) => lead.id === task.relatedId)?.owner;
  if (task.relatedType === "deal") return state.deals.find((deal) => deal.id === task.relatedId)?.salesRep;
  if (task.relatedType === "service") return state.serviceJobs.find((job) => job.id === task.relatedId)?.advisor;
  return undefined;
}

function financeRows(state: DemoState, kind: "applications" | "lenders" | "products" | "documents"): Row[] {
  return state.financeDrafts.flatMap((draft) => {
    const vehicle = state.vehicles.find((item) => item.id === draft.vehicleId);
    if (!vehicle) return [];
    const deal = state.deals.find((item) => item.vehicleId === draft.vehicleId);
    const target: NavigationTarget = deal ? exact("deal", deal.id) : { page: "finance", subview: "deal-finance", contextId: vehicle.id };
    const action = deal ? `${kind === "applications" ? "Open application" : kind === "lenders" ? "Open lender review" : kind === "products" ? "Open products" : "Open finance document"} ${deal.id}` : `Open finance draft ${vehicle.id}`;
    const noDeal = deal ? deal.status : "No linked deal";
    if (kind === "applications") return [{ id: draft.vehicleId, title: `Application for ${vehicle.year} ${vehicle.make} ${vehicle.model}`, detail: `${draft.termMonths} months · ${draft.aprPercent}% APR · ${noDeal}`, action, target }];
    if (kind === "lenders") return [{ id: draft.vehicleId, title: `Indicative lender review for ${deal?.id ?? vehicle.stockId}`, detail: `${draft.aprPercent}% APR · sandbox only · ${noDeal}`, action, target }];
    if (kind === "products") return [{ id: draft.vehicleId, title: `Products for ${deal ? `deal ${deal.id}` : vehicle.stockId}`, detail: `Service contract ${money.format(draft.serviceContract)} · GAP ${money.format(draft.gapInsurance)} · ${noDeal}`, action, target }];
    return [{ id: draft.vehicleId, title: deal ? `Deal contract ${deal.id}` : `Finance draft ${vehicle.stockId}`, detail: `${vehicle.stockId} · local finance artifact · ${noDeal}`, action, target }];
  });
}

function workspaceFor(page: NavigationTarget["page"], subview: string, state: DemoState, canViewFinancials: boolean): Workspace | null {
  if (page === "inventory") {
    const appraisalIds = new Set([...state.financeDrafts.map((draft) => draft.vehicleId), ...state.tasks.filter((task) => task.relatedType === "vehicle" && /apprais|trade|price|margin/i.test(`${task.title} ${task.detail}`)).map((task) => task.relatedId)]);
    const tradeIds = new Set(state.financeDrafts.filter((draft) => draft.tradeAllowance > 0).map((draft) => draft.vehicleId));
    const reconIds = new Set([...state.vehicles.filter((vehicle) => vehicle.status === "Recon").map((vehicle) => vehicle.id), ...state.tasks.filter((task) => task.relatedType === "vehicle" && /recon/i.test(`${task.title} ${task.detail}`)).map((task) => task.relatedId)]);
    const transferIds = new Set(state.vehicles.filter((vehicle) => vehicle.status === "In Transit").map((vehicle) => vehicle.id));
    const pricingIds = new Set(state.vehicles.filter((vehicle) => vehicle.price > 0 && (vehicle.daysInStock >= 30 || state.tasks.some((task) => task.relatedType === "vehicle" && task.relatedId === vehicle.id && /price|margin/i.test(`${task.title} ${task.detail}`)))).map((vehicle) => vehicle.id));
    if (subview === "appraisals") return { eyebrow: "Vehicle operations", heading: "Vehicle appraisals", rows: vehicleRows(state, "Open appraisal", appraisalIds) };
    if (subview === "trade-ins") return { eyebrow: "Vehicle operations", heading: "Trade-ins", rows: vehicleRows(state, "Open trade-in", tradeIds) };
    if (subview === "recon") return { eyebrow: "Vehicle operations", heading: "Reconditioning queue", rows: vehicleRows(state, "Open recon", reconIds) };
    if (subview === "transfers") return { eyebrow: "Vehicle operations", heading: "Vehicle transfers", rows: vehicleRows(state, "Open transfer", transferIds) };
    if (subview === "pricing") return { eyebrow: "Vehicle operations", heading: "Pricing review", rows: vehicleRows(state, "Open pricing", pricingIds) };
  }
  if (page === "customers") {
    const leadTasks = (predicate: (task: TaskItem) => boolean) => new Set(state.tasks.filter((task) => task.relatedType === "lead" && predicate(task)).map((task) => task.relatedId));
    if (subview === "leads") return { eyebrow: "CRM", heading: "CRM leads", rows: leadRows(state, state.leads, "Open lead") };
    if (subview === "follow-ups") { const ids = leadTasks((task) => task.status === "Due Today" || task.status === "Overdue"); return { eyebrow: "CRM", heading: "Customer follow-ups", rows: leadRows(state, state.leads.filter((lead) => ids.has(lead.id)), "Open follow-up") }; }
    if (subview === "appointments") { const ids = leadTasks((task) => task.status === "Upcoming" && Boolean(task.dueAt)); return { eyebrow: "CRM", heading: "Customer appointments", rows: leadRows(state, state.leads.filter((lead) => ids.has(lead.id)), "Open appointment") }; }
    if (subview === "test-drives") return { eyebrow: "CRM", heading: "Test drives", rows: leadRows(state, state.leads.filter((lead) => state.customers.find((customer) => customer.id === lead.customerId)?.vehicleInterestId === lead.vehicleId), "Open test drive") };
  }
  if (page === "sales") {
    if (subview === "deals") return { eyebrow: "Sales", heading: "Deals", rows: dealRows(state, "Open deal", () => true, canViewFinancials) };
    if (subview === "quotations") return { eyebrow: "Sales", heading: "Quotations", rows: dealRows(state, "Open quotation", (deal) => deal.status === "Pending", canViewFinancials) };
    if (subview === "approvals") return { eyebrow: "Sales", heading: "Sales approvals", rows: dealRows(state, "Open approval", (deal) => deal.status === "Approval", canViewFinancials) };
    if (subview === "deliveries") return { eyebrow: "Sales", heading: "Vehicle deliveries", rows: dealRows(state, "Open delivery", (deal) => deal.status === "Closed", canViewFinancials) };
    if (subview === "commissions") return { eyebrow: "Sales", heading: "Sales commissions", rows: dealRows(state, "Open commission", (deal) => deal.status === "Closed" && deal.grossProfit >= 150_000, canViewFinancials) };
  }
  if (page === "finance" && ["applications", "lenders", "products", "documents"].includes(subview)) {
    const headings = { applications: "Finance applications", lenders: "Lender queue", products: "Finance products", documents: "Finance documents" } as const;
    return { eyebrow: "F&I", heading: headings[subview as keyof typeof headings], rows: financeRows(state, subview as keyof typeof headings) };
  }
  if (page === "service") {
    if (subview === "bookings") return { eyebrow: "Aftersales", heading: "Service bookings", rows: serviceRows(state, "Open booking", (job) => job.status === "Booked") };
    if (subview === "job-cards") return { eyebrow: "Aftersales", heading: "Workshop job cards", rows: serviceRows(state, "Open job card", (job) => job.status !== "Booked" && job.status !== "Completed") };
    if (subview === "repair-orders") return { eyebrow: "Aftersales", heading: "Repair orders", rows: serviceRows(state, "Open repair order", (job) => job.status === "In Progress" || job.status === "Waiting for Parts") };
    if (subview === "history") return { eyebrow: "Aftersales", heading: "Service history", rows: serviceRows(state, "Open service history", (job) => job.status === "Completed") };
  }
  if (page === "operations") {
    if (subview === "employees") return { eyebrow: "Workforce", heading: "Employees", rows: state.tasks.flatMap((task) => { const owner = relatedOwner(task, state); return owner ? [{ id: task.id, title: `${owner} · ${task.title}`, detail: `Assigned task · ${task.detail}`, action: `Open assigned task ${task.id}`, target: exact("task", task.id) }] : []; }) };
    if (subview === "teams") return { eyebrow: "Workforce", heading: "Teams", rows: state.tasks.flatMap((task) => { const owner = relatedOwner(task, state); return owner ? [{ id: task.id, title: `Connected team · ${owner}`, detail: `${task.status} · ${task.title}`, action: `Open team task ${task.id}`, target: exact("task", task.id) }] : []; }) };
    if (subview === "targets") return { eyebrow: "Workforce", heading: "Team targets", rows: state.deals.map((deal) => ({ id: deal.id, title: `Pipeline value · ${deal.salesRep}`, detail: `${money.format(deal.grossProfit)} gross profit · ${deal.status}`, action: `Open target deal ${deal.id}`, target: exact("deal", deal.id) })) };
    if (subview === "attendance") return { eyebrow: "Workforce", heading: "Attendance", rows: state.activities.map((activity) => ({ id: activity.id, title: `Latest recorded activity · ${activity.actor}`, detail: `${activity.occurredAt} · ${activity.action}`, ...(activity.targetType === "system" ? {} : { action: `Open attendance record ${activity.targetId}`, target: exact(activity.targetType, activity.targetId) }) })) };
    if (subview === "tasks") return { eyebrow: "Operations", heading: "Operations tasks", rows: taskRows(state, "Open task") };
    if (subview === "calendar") return { eyebrow: "Operations", heading: "Operations calendar", rows: taskRows(state, "Open calendar task", "Scheduled action · ") };
    if (subview === "documents") return { eyebrow: "Operations", heading: "Operations documents", rows: state.activities.map((activity) => ({ id: activity.id, title: `Local artifact · ${activity.action}`, detail: activity.detail, ...(activity.targetType === "system" ? {} : { action: `Open audit artifact ${activity.id}`, target: exact(activity.targetType, activity.targetId) }) })) };
    if (subview === "audit-trail") return { eyebrow: "Operations", heading: "Audit trail", rows: state.activities.map((activity) => ({ id: activity.id, title: activity.action, detail: `${activity.actor} · ${activity.detail}`, ...(activity.targetType === "system" ? {} : { action: `Open audit ${activity.targetId}`, target: exact(activity.targetType, activity.targetId) }) })) };
  }
  return null;
}

export function DomainWorkspace({ page, subview, state, onNavigate, canViewFinancials = true }: { page: NavigationTarget["page"]; subview: string; state: DemoState; onNavigate: (target: NavigationTarget) => void; canViewFinancials?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  useEffect(() => setExpanded(false), [page, subview]);
  const workspace = workspaceFor(page, subview, state, canViewFinancials);
  if (!workspace) return null;
  const visibleRows = expanded ? workspace.rows : workspace.rows.slice(0, 12);
  return <section className="action-centre" data-tour="operations-workspace" aria-labelledby={`${page}-${subview}-title`}><header className="action-centre-heading"><p>{workspace.eyebrow}</p><h1 id={`${page}-${subview}-title`}>{workspace.heading}</h1><span>{workspace.rows.length} connected records</span></header><ul className="action-centre-list">{visibleRows.length === 0 ? <li className="my-day-empty">No connected records match this operational queue.</li> : visibleRows.map((row) => <li key={row.id}><div><strong>{row.title}</strong><p>{row.detail}</p></div>{row.action && row.target ? <Button variant="secondary" onClick={() => { if (row.target) onNavigate(row.target); }}>{row.action}</Button> : null}</li>)}</ul>{workspace.rows.length > visibleRows.length ? <Button variant="secondary" onClick={() => setExpanded(true)}>Show all {workspace.rows.length} connected records</Button> : null}</section>;
}

export function ExactRecordView({ target, state }: { target: NavigationTarget; state: DemoState }) {
  const id = target.recordId;
  const missing = <section className="action-centre"><h1>Record not found</h1><p>The requested connected record is not available in this demo.</p></section>;
  if (target.recordType === "lead") { const record = state.leads.find((item) => item.id === id); const customer = state.customers.find((item) => item.id === record?.customerId); return record ? <section className="action-centre"><h1>Lead {record.id}</h1><p>{customer?.name} · {record.stage} · {record.nextAction}</p></section> : missing; }
  if (target.recordType === "deal") { const record = state.deals.find((item) => item.id === id); const vehicle = state.vehicles.find((item) => item.id === record?.vehicleId); return record ? <section className="action-centre"><h1>Deal {record.id}</h1><p>{vehicle?.year} {vehicle?.make} {vehicle?.model} · {record.status} · {record.salesRep}</p></section> : missing; }
  if (target.recordType === "service") { const record = state.serviceJobs.find((item) => item.id === id); return record ? <section className="action-centre"><h1>Service job {record.id}</h1><p>{record.status} · {record.note} · {record.advisor}</p></section> : missing; }
  if (target.recordType === "task") { const record = state.tasks.find((item) => item.id === id); return record ? <section className="action-centre"><h1>Task: {record.title}</h1><p>{record.detail} · {record.status}</p></section> : missing; }
  return missing;
}
