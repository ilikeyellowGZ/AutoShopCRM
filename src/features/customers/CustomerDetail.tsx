import { useState } from "react";
import { Button } from "../../components/controls/Button";
import { Tabs, type TabItem } from "../../components/controls/Tabs";
import type { Customer, DemoState } from "../../domain/models";
import type { DemoRepository } from "../../repository/demoRepository";

type DetailTab = "overview" | "activity" | "leads" | "vehicles" | "deals" | "service" | "tasks" | "notes";

export function CustomerDetail({ customer, state, repository, canWrite = true, canViewFinancials = true, canViewService = true, canViewAudit = true }: { customer: Customer; state: DemoState; repository: DemoRepository; canWrite?: boolean; canViewFinancials?: boolean; canViewService?: boolean; canViewAudit?: boolean }) {
  const [tab, setTab] = useState<DetailTab>("overview");
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState("");
  const vehicle = state.vehicles.find((item) => item.id === customer.vehicleInterestId);
  const leads = state.leads.filter((item) => item.customerId === customer.id);
  const deals = state.deals.filter((item) => item.customerId === customer.id);
  const activity = state.activities.filter((item) => item.targetId === customer.id || leads.some((lead) => lead.id === item.targetId) || deals.some((deal) => deal.id === item.targetId));
  const saveNote = () => { if (!note.trim()) return; repository.addCustomerNote(customer.id, note); setNote(""); };
  const list = (items: string[], empty: string) => items.length ? <ul className="customer-detail-list">{items.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p className="customer-empty">{empty}</p>;
  const tabs: TabItem<DetailTab>[] = [
    { id: "overview", label: "Overview", panel: <div className="customer-tab"><h2>Overview</h2><dl><div><dt>Status</dt><dd>{customer.crmStatus}</dd></div><div><dt>Vehicle interest</dt><dd>{vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.derivative}` : "None"}</dd></div><div><dt>Last activity</dt><dd>{new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(customer.lastActivityAt))}</dd></div></dl></div> },
    ...(canViewAudit ? [{ id: "activity" as const, label: "Activity", panel: <div className="customer-tab"><h2>Activity</h2>{list(activity.map((item) => `${item.action}: ${item.detail}`), "No activity has been recorded yet.")}</div> }] : []),
    { id: "leads", label: "Leads", panel: <div className="customer-tab"><h2>Leads</h2>{list(leads.map((item) => `${item.stage} · ${item.nextAction} · ${item.owner}`), "No leads are linked to this customer.")}</div> },
    { id: "vehicles", label: "Vehicles", panel: <div className="customer-tab"><h2>Vehicles</h2>{list(vehicle ? [`${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.derivative} · ${vehicle.vin}`] : [], "No vehicle interest is linked.")}</div> },
    { id: "deals", label: "Deals", panel: <div className="customer-tab"><h2>Deals</h2>{list(deals.map((item) => canViewFinancials ? `${item.status} · R ${item.grossProfit.toLocaleString("en-ZA")} gross profit` : item.status), "No deals are linked to this customer.")}</div> },
    ...(canViewService ? [{ id: "service" as const, label: "Service", panel: <div className="customer-tab"><h2>Service</h2>{list(state.serviceJobs.filter((item) => item.customerId === customer.id).map((item) => `${item.status} · ${item.note}`), "No service work is linked to this customer.")}</div> }] : []),
    { id: "tasks", label: "Tasks", panel: <div className="customer-tab"><h2>Tasks</h2>{list(state.tasks.filter((item) => leads.some((lead) => lead.id === item.relatedId) || deals.some((deal) => deal.id === item.relatedId)).map((item) => `${item.status} · ${item.title}`), "No tasks are linked to this customer.")}</div> },
    { id: "notes", label: "Notes", panel: <div className="customer-tab"><h2>Notes</h2>{canWrite ? <><label className="notes-field">Add a customer note<textarea value={note} onChange={(event) => setNote(event.target.value)} /></label><Button onClick={saveNote} disabled={!note.trim()}>Save note</Button><p className="customer-empty">Saving a note records a timestamped customer update in this demo.</p></> : <p className="customer-empty">Notes are read-only for this demo role.</p>}</div> },
  ];

  return <section className="customer-detail" aria-labelledby="customer-name">
    <header className="crm-heading"><div><p className="crm-eyebrow">Customer record</p><h1 id="customer-name">{customer.name}</h1><p>{customer.email} · {customer.phone || "Phone pending"} · {customer.city}</p></div>{canWrite ? <Button variant="secondary" onClick={() => setEditing(!editing)}>{editing ? "Close edit" : "Edit customer"}</Button> : null}</header>
    {editing && canWrite ? <form className="crm-form crm-form--inline" onSubmit={(event) => { event.preventDefault(); const values = new FormData(event.currentTarget); repository.updateCustomer(customer.id, { name: String(values.get("name")), email: String(values.get("email")), phone: String(values.get("phone")), city: String(values.get("city")) }); setEditing(false); }}><label>Name<input name="name" defaultValue={customer.name} required /></label><label>Email<input name="email" type="email" defaultValue={customer.email} required /></label><label>Phone<input name="phone" defaultValue={customer.phone} /></label><label>City<input name="city" defaultValue={customer.city} /></label><Button type="submit">Save changes</Button></form> : null}
    <Tabs label="Customer record sections" activeId={tab} onChange={setTab} items={tabs} />
  </section>;
}
