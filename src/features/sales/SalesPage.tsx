import { useMemo, useState } from "react";
import type { Deal, DemoState, ViewPreferences } from "../../domain/models";
import type { DemoRepository } from "../../repository/demoRepository";
import { Button } from "../../components/controls/Button";
import { StatusPill } from "../../components/controls/StatusPill";
import { RecordTable } from "../../components/data-display/RecordTable";
import { exportSalesCsv } from "./exportSalesCsv";
import { downloadSalesCsv } from "./downloadSalesCsv";
import { DealEntry } from "./DealEntry";

const money = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
const defaults: ViewPreferences["sales"] = { query: "", status: "All", sort: "date" };
type Props = { state: DemoState; repository: DemoRepository; viewPreferences?: ViewPreferences["sales"]; onViewPreferencesChange?: (patch: Partial<ViewPreferences["sales"]>) => void };

export function SalesPage({ state, repository, viewPreferences, onViewPreferencesChange }: Props) {
  const [fallback, setFallback] = useState(defaults); const { query, status, sort } = viewPreferences ?? fallback; const [creating, setCreating] = useState(false);
  const changeView = (patch: Partial<ViewPreferences["sales"]>) => { if (!viewPreferences) setFallback((current) => ({ ...current, ...patch })); onViewPreferencesChange?.(patch); };
  const deals = useMemo(() => state.deals.filter((deal) => { const vehicle = state.vehicles.find((item) => item.id === deal.vehicleId); const customer = state.customers.find((item) => item.id === deal.customerId); return (status === "All" || deal.status === status) && `${customer?.name} ${vehicle?.make} ${vehicle?.model} ${deal.salesRep}`.toLowerCase().includes(query.toLowerCase()); }).sort((a, b) => sort === "profit" ? b.grossProfit - a.grossProfit : b.date.localeCompare(a.date)), [query, sort, state, status]);
  const download = () => downloadSalesCsv(exportSalesCsv(deals, state));
  return <section className="sales-page crm-page" aria-labelledby="sales-title"><header className="crm-heading"><div><p className="crm-eyebrow">Completed and active deals</p><h1 id="sales-title">Sales log</h1><p>Filter, sort, create and export locally persisted deal records.</p></div><div className="sales-actions"><Button variant="secondary" onClick={download}>Export CSV</Button><Button onClick={() => setCreating(!creating)}>{creating ? "Close form" : "New deal"}</Button></div></header>{creating && <DealEntry state={state} repository={repository} onCreated={() => setCreating(false)} />}<div className="crm-toolbar"><label>Search sales<input value={query} onChange={(event) => changeView({ query: event.target.value })} placeholder="Customer, vehicle or sales rep" /></label><label>Status<select value={status} onChange={(event) => changeView({ status: event.target.value as ViewPreferences["sales"]["status"] })}><option>All</option><option>Pending</option><option>Approval</option><option>Closed</option></select></label><label>Sort<select value={sort} onChange={(event) => changeView({ sort: event.target.value as ViewPreferences["sales"]["sort"] })}><option value="date">Newest date</option><option value="profit">Highest profit</option></select></label></div><RecordTable caption="Sales log" records={deals} emptyMessage="No sales records match these filters." columns={[{ key: "date", label: "Date", render: (deal: Deal) => new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(deal.date)) }, { key: "vehicle", label: "Vehicle", render: (deal: Deal) => { const vehicle = state.vehicles.find((item) => item.id === deal.vehicleId); return vehicle ? <><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong><small>{vehicle.vin}</small></> : "Vehicle unavailable"; } }, { key: "rep", label: "Sales rep", render: (deal: Deal) => deal.salesRep }, { key: "profit", label: "Gross profit", render: (deal: Deal) => money.format(deal.grossProfit) }, { key: "status", label: "Status", render: (deal: Deal) => <StatusPill tone={deal.status === "Closed" ? "positive" : deal.status === "Approval" ? "warning" : "info"}>{deal.status}</StatusPill> }]} /></section>;
}
