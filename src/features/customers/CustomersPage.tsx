import { useMemo, useState } from "react";
import type { Customer, DemoState } from "../../domain/models";
import type { DemoRepository } from "../../repository/demoRepository";
import { Button } from "../../components/controls/Button";
import { StatusPill } from "../../components/controls/StatusPill";
import { RecordTable } from "../../components/data-display/RecordTable";

const newId = () => `customer-${crypto.randomUUID?.() ?? Date.now()}`;

export function CustomersPage({ state, repository, onOpenCustomer }: { state: DemoState; repository: DemoRepository; onOpenCustomer?: (customerId: string) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", city: "Windhoek", vehicleInterestId: state.vehicles[0]?.id ?? "" });
  const rows = useMemo(() => state.customers.filter((customer) => (status === "All" || customer.crmStatus === status) && `${customer.name} ${customer.email} ${customer.phone} ${customer.city}`.toLowerCase().includes(query.toLowerCase())), [query, state.customers, status]);
  const addCustomer = () => {
    setError("");
    if (!form.name.trim() || !form.email.trim()) { setError("Enter the customer name and email address before saving."); return; }
    try {
      repository.addCustomer({ id: newId(), ...form, crmStatus: "Prospect", lastActivityAt: new Date().toISOString() });
      setCreating(false); setForm({ name: "", email: "", phone: "", city: "Windhoek", vehicleInterestId: state.vehicles[0]?.id ?? "" });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The customer could not be saved."); }
  };
  return <section className="crm-page customers-page" aria-labelledby="customers-title">
    <header className="crm-heading"><div><p className="crm-eyebrow">CRM directory</p><h1 id="customers-title">Customers</h1><p>Ownership, interests, and every next conversation in one connected directory.</p></div><Button onClick={() => setCreating((value) => !value)} aria-expanded={creating}>{creating ? "Close form" : "Create customer"}</Button></header>
    {creating && <form className="crm-form" onSubmit={(event) => { event.preventDefault(); addCustomer(); }} noValidate><h2>New customer</h2>{error && <p className="form-error" role="alert">{error}</p>}<label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label><label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label><label>Phone<input value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label><label>City<input value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} /></label><label>Vehicle interest<select value={form.vehicleInterestId} onChange={(event) => setForm({ ...form, vehicleInterestId: event.target.value })}>{state.vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model}</option>)}</select></label><Button type="submit">Save customer</Button></form>}
    <div className="crm-toolbar"><label>Search customers<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name, email, phone or city" /></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option>All</option><option>Active</option><option>Prospect</option></select></label></div>
    <RecordTable caption="Customer directory" records={rows} emptyMessage="No customers match these filters." columns={[{ key: "customer", label: "Customer", render: (customer: Customer) => <button className="inventory-record-link" onClick={() => onOpenCustomer?.(customer.id)}><strong>{customer.name}</strong><small>{customer.email} · {customer.phone || "No phone recorded"}</small></button> }, { key: "interest", label: "Interest", render: (customer: Customer) => { const vehicle = state.vehicles.find((item) => item.id === customer.vehicleInterestId); return vehicle ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : "No vehicle assigned"; } }, { key: "status", label: "Status", render: (customer: Customer) => <StatusPill tone={customer.crmStatus === "Active" ? "positive" : "info"}>{customer.crmStatus}</StatusPill> }, { key: "followup", label: "Next follow-up", render: (customer: Customer) => state.leads.find((lead) => lead.customerId === customer.id)?.nextAction ?? "No open follow-up" }]} />
  </section>;
}
