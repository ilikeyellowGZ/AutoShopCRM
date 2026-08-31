import { useMemo, useState } from "react";
import type { Deal, DemoState, ViewPreferences } from "../../domain/models";
import type { DemoRepository } from "../../repository/demoRepository";
import type { NavigationTarget } from "../../app/routes";
import { Button } from "../../components/controls/Button";
import { StatusPill } from "../../components/controls/StatusPill";
import { RecordTable } from "../../components/data-display/RecordTable";
import { exportSalesCsv } from "./exportSalesCsv";
import { downloadSalesCsv } from "./downloadSalesCsv";
import { DealEntry } from "./DealEntry";

const money = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
const defaults: ViewPreferences["sales"] = { query: "", status: "All", sort: "date" };
type Props = { state: DemoState; repository: DemoRepository; viewPreferences?: ViewPreferences["sales"]; onViewPreferencesChange?: (patch: Partial<ViewPreferences["sales"]>) => void; onNavigate?: (target: NavigationTarget) => void; canWrite?: boolean; canViewFinancials?: boolean; canExport?: boolean; defaultSalesRep?: string; lockSalesRep?: boolean };

export function SalesPage({ state, repository, viewPreferences, onViewPreferencesChange, onNavigate, canWrite = true, canViewFinancials = true, canExport = true, defaultSalesRep, lockSalesRep = false }: Props) {
  const [fallback, setFallback] = useState(defaults); const { query, status, sort } = viewPreferences ?? fallback; const [creating, setCreating] = useState(false);
  const effectiveSort = canViewFinancials ? sort : "date";
  const changeView = (patch: Partial<ViewPreferences["sales"]>) => { if (!viewPreferences) setFallback((current) => ({ ...current, ...patch })); onViewPreferencesChange?.(patch); };
  const deals = useMemo(() => state.deals.filter((deal) => { const vehicle = state.vehicles.find((item) => item.id === deal.vehicleId); const customer = state.customers.find((item) => item.id === deal.customerId); return (status === "All" || deal.status === status) && `${customer?.name} ${vehicle?.make} ${vehicle?.model} ${deal.salesRep}`.toLowerCase().includes(query.toLowerCase()); }).sort((a, b) => effectiveSort === "profit" ? b.grossProfit - a.grossProfit : b.date.localeCompare(a.date)), [effectiveSort, query, state, status]);
  const columns = [
    { key: "date", label: "Date", render: (deal: Deal) => new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(deal.date)) },
    { key: "vehicle", label: "Vehicle", render: (deal: Deal) => { const vehicle = state.vehicles.find((item) => item.id === deal.vehicleId); return vehicle ? <><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong><small>{vehicle.vin}</small></> : "Vehicle unavailable"; } },
    { key: "rep", label: "Sales rep", render: (deal: Deal) => deal.salesRep },
    ...(canViewFinancials ? [{ key: "profit", label: "Gross profit", render: (deal: Deal) => money.format(deal.grossProfit) }] : []),
    { key: "status", label: "Status", render: (deal: Deal) => <StatusPill tone={deal.status === "Closed" ? "positive" : deal.status === "Approval" ? "warning" : "info"}>{deal.status}</StatusPill> },
    { key: "action", label: "Action", render: (deal: Deal) => onNavigate ? <Button variant="quiet" onClick={() => onNavigate({ page: "sales", subview: "deals", recordType: "deal", recordId: deal.id })}>Open deal {deal.id}</Button> : null },
  ];
  return <section className="sales-page crm-page" aria-labelledby="sales-title"><header className="crm-heading"><div><p className="crm-eyebrow">Completed and active deals</p><h1 id="sales-title">Sales log</h1><p>Filter and review locally persisted deal records.</p></div><div className="sales-actions">{canViewFinancials && canExport ? <Button variant="secondary" onClick={() => downloadSalesCsv(exportSalesCsv(deals, state))}>Export CSV</Button> : null}{canWrite ? <Button onClick={() => setCreating(!creating)}>{creating ? "Close form" : "New deal"}</Button> : null}</div></header>{creating && canWrite ? <DealEntry state={state} repository={repository} defaultSalesRep={defaultSalesRep} lockSalesRep={lockSalesRep} onCreated={() => setCreating(false)} /> : null}<div className="crm-toolbar" data-tour="sales-toolbar"><label>Search sales<input value={query} onChange={(event) => changeView({ query: event.target.value })} placeholder="Customer, vehicle or sales rep" /></label><label>Status<select value={status} onChange={(event) => changeView({ status: event.target.value as ViewPreferences["sales"]["status"] })}><option>All</option><option>Pending</option><option>Approval</option><option>Closed</option></select></label><label>Sort<select value={effectiveSort} onChange={(event) => changeView({ sort: event.target.value as ViewPreferences["sales"]["sort"] })}><option value="date">Newest date</option>{canViewFinancials ? <option value="profit">Highest profit</option> : null}</select></label></div><RecordTable caption="Sales log" records={deals} emptyMessage="No sales records match these filters." columns={columns} /></section>;
}
