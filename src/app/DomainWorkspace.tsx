import type { DemoState, PersistedRecordType } from "../domain/models";
import { Button } from "../components/controls/Button";
import type { NavigationTarget } from "./routes";

type Row = { id: string; title: string; detail: string; action: string; target: NavigationTarget };
type Workspace = { eyebrow: string; heading: string; rows: Row[] };
const money = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
const exact = (type: PersistedRecordType, id: string): NavigationTarget => type === "vehicle" ? { page: "inventory", subview: id, recordType: type, recordId: id } : type === "customer" ? { page: "customers", subview: id, recordType: type, recordId: id } : type === "lead" ? { page: "customers", subview: "leads", recordType: type, recordId: id } : type === "deal" ? { page: "sales", subview: "deals", recordType: type, recordId: id } : type === "service" ? { page: "service", subview: "service-board", recordType: type, recordId: id } : { page: "operations", subview: "tasks", recordType: type, recordId: id };

function vehicleRows(state: DemoState, action: string, filter: (id: string) => boolean = () => true): Row[] {
  return state.vehicles.filter((vehicle) => filter(vehicle.id)).map((vehicle) => ({ id: vehicle.id, title: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.derivative}`, detail: `${vehicle.stockId} · ${vehicle.status} · ${vehicle.branch} · ${money.format(vehicle.price)}`, action: `${action} ${vehicle.id}`, target: exact("vehicle", vehicle.id) }));
}
function leadRows(state: DemoState, action: string, detail: (leadId: string) => string): Row[] {
  return state.leads.map((lead) => ({ id: lead.id, title: detail(lead.id), detail: `${state.customers.find((customer) => customer.id === lead.customerId)?.name ?? "Customer"} · ${state.vehicles.find((vehicle) => vehicle.id === lead.vehicleId)?.year} ${state.vehicles.find((vehicle) => vehicle.id === lead.vehicleId)?.make} ${state.vehicles.find((vehicle) => vehicle.id === lead.vehicleId)?.model}`, action: `${action} ${lead.id}`, target: exact("lead", lead.id) }));
}
function dealRows(state: DemoState, action: string, filter: (status: string) => boolean = () => true): Row[] {
  return state.deals.filter((deal) => filter(deal.status)).map((deal) => ({ id: deal.id, title: `Deal ${deal.id}`, detail: `${state.customers.find((customer) => customer.id === deal.customerId)?.name ?? "Customer"} · ${deal.salesRep} · ${deal.status} · ${money.format(deal.grossProfit)}`, action: `${action} ${deal.id}`, target: exact("deal", deal.id) }));
}
function serviceRows(state: DemoState, action: string): Row[] {
  return state.serviceJobs.map((job) => ({ id: job.id, title: `Service job ${job.id}`, detail: `${job.note} · ${job.advisor} · ${job.technician} · ${job.status}`, action: `${action} ${job.id}`, target: exact("service", job.id) }));
}
function taskRows(state: DemoState, action: string, title: string, detail: string): Row[] {
  return state.tasks.map((task) => ({ id: task.id, title: title.replace("{title}", task.title), detail: detail.replace("{detail}", task.detail), action: `${action} ${task.id}`, target: exact("task", task.id) }));
}

function workspaceFor(page: NavigationTarget["page"], subview: string, state: DemoState): Workspace | null {
  if (page === "inventory") {
    if (subview === "appraisals") return { eyebrow: "Vehicle operations", heading: "Vehicle appraisals", rows: vehicleRows(state, "Open appraisal") };
    if (subview === "trade-ins") return { eyebrow: "Vehicle operations", heading: "Trade-ins", rows: vehicleRows(state, "Open trade-in") };
    if (subview === "recon") return { eyebrow: "Vehicle operations", heading: "Reconditioning queue", rows: vehicleRows(state, "Open recon", (id) => id === "vehicle-08") };
    if (subview === "transfers") return { eyebrow: "Vehicle operations", heading: "Vehicle transfers", rows: vehicleRows(state, "Open transfer", (id) => id === "vehicle-03") };
    if (subview === "pricing") return { eyebrow: "Vehicle operations", heading: "Pricing review", rows: vehicleRows(state, "Open pricing") };
  }
  if (page === "customers") {
    if (subview === "leads") return { eyebrow: "CRM", heading: "CRM leads", rows: leadRows(state, "Open lead", (id) => state.leads.find((lead) => lead.id === id)!.nextAction) };
    if (subview === "follow-ups") return { eyebrow: "CRM", heading: "Customer follow-ups", rows: leadRows(state, "Open follow-up", (id) => state.leads.find((lead) => lead.id === id)!.nextAction) };
    if (subview === "appointments") return { eyebrow: "CRM", heading: "Customer appointments", rows: leadRows(state, "Open appointment", (id) => state.customers.find((customer) => customer.id === state.leads.find((lead) => lead.id === id)!.customerId)!.name) };
    if (subview === "test-drives") return { eyebrow: "CRM", heading: "Test drives", rows: leadRows(state, "Open test drive", (id) => { const vehicle = state.vehicles.find((item) => item.id === state.leads.find((lead) => lead.id === id)!.vehicleId)!; return `${vehicle.year} ${vehicle.make} ${vehicle.model}`; }) };
  }
  if (page === "sales") {
    if (subview === "deals") return { eyebrow: "Sales", heading: "Deals", rows: dealRows(state, "Open deal") };
    if (subview === "quotations") return { eyebrow: "Sales", heading: "Quotations", rows: dealRows(state, "Open quotation") };
    if (subview === "approvals") return { eyebrow: "Sales", heading: "Sales approvals", rows: dealRows(state, "Open approval", (status) => status === "Approval") };
    if (subview === "deliveries") return { eyebrow: "Sales", heading: "Vehicle deliveries", rows: dealRows(state, "Open delivery", (status) => status === "Closed") };
    if (subview === "commissions") return { eyebrow: "Sales", heading: "Sales commissions", rows: dealRows(state, "Open commission") };
  }
  if (page === "finance") {
    const rows = state.financeDrafts.map((draft) => { const vehicle = state.vehicles.find((item) => item.id === draft.vehicleId)!; const deal = state.deals.find((item) => item.vehicleId === draft.vehicleId)!; return { draft, vehicle, deal }; });
    if (subview === "applications") return { eyebrow: "F&I", heading: "Finance applications", rows: rows.map(({ draft, vehicle, deal }) => ({ id: deal.id, title: `Application for ${vehicle.year} ${vehicle.make} ${vehicle.model}`, detail: `${draft.termMonths} months · ${draft.aprPercent}% APR`, action: `Open application ${deal.id}`, target: exact("deal", deal.id) })) };
    if (subview === "lenders") return { eyebrow: "F&I", heading: "Lender queue", rows: rows.map(({ draft, deal }) => ({ id: deal.id, title: `Indicative lender review for ${deal.id}`, detail: `${draft.aprPercent}% APR · sandbox only`, action: `Open lender review ${deal.id}`, target: exact("deal", deal.id) })) };
    if (subview === "products") return { eyebrow: "F&I", heading: "Finance products", rows: rows.map(({ draft, deal }) => ({ id: deal.id, title: `Products for deal ${deal.id}`, detail: `Service contract ${money.format(draft.serviceContract)} · GAP ${money.format(draft.gapInsurance)}`, action: `Open products ${deal.id}`, target: exact("deal", deal.id) })) };
    if (subview === "documents") return { eyebrow: "F&I", heading: "Finance documents", rows: rows.map(({ deal, vehicle }) => ({ id: deal.id, title: `Deal contract ${deal.id}`, detail: `${vehicle.stockId} · local finance artifact · ${deal.status}`, action: `Open finance document ${deal.id}`, target: exact("deal", deal.id) })) };
  }
  if (page === "service") {
    if (subview === "bookings") return { eyebrow: "Aftersales", heading: "Service bookings", rows: serviceRows(state, "Open booking") };
    if (subview === "job-cards") return { eyebrow: "Aftersales", heading: "Workshop job cards", rows: serviceRows(state, "Open job card") };
    if (subview === "repair-orders") return { eyebrow: "Aftersales", heading: "Repair orders", rows: serviceRows(state, "Open repair order") };
    if (subview === "history") return { eyebrow: "Aftersales", heading: "Service history", rows: serviceRows(state, "Open service history") };
  }
  if (page === "operations") {
    if (subview === "employees") return { eyebrow: "Workforce", heading: "Employees", rows: state.activities.map((activity, index) => { const task = state.tasks[index % state.tasks.length]; return { id: activity.id, title: `${activity.actor} · ${task.title}`, detail: `Assigned task · ${task.detail} · ${activity.action}`, action: `Open assigned task ${task.id}`, target: exact("task", task.id) }; }) };
    if (subview === "teams") return { eyebrow: "Workforce", heading: "Teams", rows: state.leads.map((lead, index) => { const task = state.tasks[index % state.tasks.length]; return { id: lead.id, title: `Sales team · ${lead.owner}`, detail: `${lead.stage} pipeline assignment · ${task.title}`, action: `Open team task ${task.id}`, target: exact("task", task.id) }; }) };
    if (subview === "targets") return { eyebrow: "Workforce", heading: "Team targets", rows: state.deals.map((deal, index) => { const task = state.tasks[index % state.tasks.length]; return { id: deal.id, title: `Pipeline value · ${deal.salesRep}`, detail: `${money.format(deal.grossProfit)} gross profit · ${task.title}`, action: `Open target task ${task.id}`, target: exact("task", task.id) }; }) };
    if (subview === "attendance") return { eyebrow: "Workforce", heading: "Attendance", rows: state.activities.map((activity, index) => { const task = state.tasks[index % state.tasks.length]; return { id: activity.id, title: `Latest recorded activity · ${activity.actor}`, detail: `${activity.occurredAt} · ${activity.action}`, action: `Open attendance task ${task.id}`, target: exact("task", task.id) }; }) };
    if (subview === "tasks") return { eyebrow: "Operations", heading: "Operations tasks", rows: taskRows(state, "Open task", "{title}", "{detail}") };
    if (subview === "calendar") return { eyebrow: "Operations", heading: "Operations calendar", rows: taskRows(state, "Open calendar task", "{title}", "Scheduled action · {detail}") };
    if (subview === "documents") return { eyebrow: "Operations", heading: "Operations documents", rows: state.activities.map((activity) => ({ id: activity.id, title: `Local artifact · ${activity.action}`, detail: activity.detail, action: `Open audit artifact ${activity.id}`, target: activity.targetType === "system" ? exact("task", state.tasks[0].id) : exact(activity.targetType, activity.targetId) })) };
    if (subview === "audit-trail") return { eyebrow: "Operations", heading: "Audit trail", rows: state.activities.map((activity) => ({ id: activity.id, title: activity.action, detail: `${activity.actor} · ${activity.detail}`, action: `Open audit ${activity.targetId}`, target: activity.targetType === "system" ? exact("task", state.tasks[0].id) : exact(activity.targetType, activity.targetId) })) };
  }
  return null;
}

export function DomainWorkspace({ page, subview, state, onNavigate }: { page: NavigationTarget["page"]; subview: string; state: DemoState; onNavigate: (target: NavigationTarget) => void }) {
  const workspace = workspaceFor(page, subview, state);
  if (!workspace) return null;
  return <section className="action-centre" aria-labelledby={`${page}-${subview}-title`}><header className="action-centre-heading"><p>{workspace.eyebrow}</p><h1 id={`${page}-${subview}-title`}>{workspace.heading}</h1><span>{workspace.rows.length} connected records</span></header><ul className="action-centre-list">{workspace.rows.map((row) => <li key={row.id}><div><strong>{row.title}</strong><p>{row.detail}</p></div><Button variant="secondary" onClick={() => onNavigate(row.target)}>{row.action}</Button></li>)}</ul></section>;
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
