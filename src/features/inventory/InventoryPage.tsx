import { useEffect, useId, useMemo, useState } from "react";
import type { DemoState, Vehicle, ViewPreferences } from "../../domain/models";
import { selectFilteredVehicles } from "../../domain/selectors";
import type { DemoRepository } from "../../repository/demoRepository";
import { Button } from "../../components/controls/Button";
import { MetricBlock } from "../../components/data-display/MetricBlock";
import { RecordTable } from "../../components/data-display/RecordTable";
import { StatusPill } from "../../components/controls/StatusPill";
import { VehicleDetail } from "./VehicleDetail";
import { VehicleIntake } from "./VehicleIntake";

type VehicleFilterStatus = Vehicle["status"] | "All";
const currency = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
const toneForStatus = (status: Vehicle["status"]) => status === "Available" ? "positive" : status === "Reserved" || status === "Recon" ? "warning" : status === "In Transit" ? "info" : status === "Service Hold" ? "critical" : "neutral" as const;
const defaultPreferences: ViewPreferences["inventory"] = { query: "", status: "All", mode: "cards" };

type InventoryPageProps = { state: DemoState; repository: DemoRepository; initialSubview?: string; onNavigate?: (subview: string, recordId?: string) => void; onCreateDeal?: (vehicleId: string) => void; viewPreferences?: ViewPreferences["inventory"]; onViewPreferencesChange?: (patch: Partial<ViewPreferences["inventory"]>) => void };

export function InventoryPage({ state, repository, initialSubview = "list", onNavigate, onCreateDeal, viewPreferences, onViewPreferencesChange }: InventoryPageProps) {
  const mountIdentity = useId();
  const initialVehicle = state.vehicles.find((vehicle) => vehicle.id === initialSubview);
  const [subview, setSubview] = useState(initialVehicle ? "detail" : initialSubview);
  const [selectedId, setSelectedId] = useState<string | null>(initialVehicle?.id ?? null);
  const [fallbackPreferences, setFallbackPreferences] = useState(defaultPreferences);
  const { query, status, mode } = viewPreferences ?? fallbackPreferences;
  useEffect(() => { const vehicle = state.vehicles.find((item) => item.id === initialSubview); setSelectedId(vehicle?.id ?? null); setSubview(vehicle ? "detail" : initialSubview); }, [initialSubview, state.vehicles]);
  const navigate = (next: string, recordId?: string) => { setSubview(next); onNavigate?.(next, recordId); };
  const selected = state.vehicles.find((vehicle) => vehicle.id === selectedId);
  const vehicles = useMemo(() => selectFilteredVehicles(state, query, status), [query, state, status]);
  const changeView = (patch: Partial<ViewPreferences["inventory"]>) => { if (!viewPreferences) setFallbackPreferences((current) => ({ ...current, ...patch })); onViewPreferencesChange?.(patch); };
  if (selected && subview === "detail") return <div data-testid="inventory-route" data-mount-identity={mountIdentity}><VehicleDetail vehicle={selected} state={state} repository={repository} onBack={() => navigate("list")} onCreateDeal={() => onCreateDeal?.(selected.id)} /></div>;
  if (subview === "intake") return <div data-testid="inventory-route" data-mount-identity={mountIdentity}><VehicleIntake state={state} repository={repository} onComplete={(id) => { setSelectedId(id); navigate("detail", id); }} onCancel={() => navigate("list")} /></div>;
  const open = (vehicle: Vehicle) => { setSelectedId(vehicle.id); navigate("detail", vehicle.id); };
  const available = state.vehicles.filter((vehicle) => vehicle.status === "Available").length;
  return <div data-testid="inventory-route" data-mount-identity={mountIdentity}><section className="inventory-page">
    <header className="inventory-heading"><div><p className="inventory-eyebrow">Vehicles</p><h1>Vehicle inventory</h1><p>{state.vehicles.length} connected vehicle records, maintained in this local demo workspace.</p></div><Button onClick={() => navigate("intake")}>Add vehicle</Button></header>
    <div className="inventory-metrics"><MetricBlock label="On hand" value={state.vehicles.length} detail="Connected records" /><MetricBlock label="Available" value={available} detail="Ready to sell" /><MetricBlock label="Retail value" value={currency.format(state.vehicles.reduce((total, vehicle) => total + vehicle.price, 0))} detail="Current inventory" /></div>
    <div className="inventory-toolbar"><label className="inventory-search">Search inventory<input value={query} onChange={(event) => changeView({ query: event.target.value })} placeholder="VIN, model, stock or branch" /></label><label className="inventory-filter">Status<select value={status} onChange={(event) => changeView({ status: event.target.value as VehicleFilterStatus })}><option>All</option>{["Available", "Reserved", "In Transit", "Service Hold", "Recon", "Photography"].map((item) => <option key={item}>{item}</option>)}</select></label><div className="inventory-view-toggle" role="group" aria-label="Inventory view"><Button variant={mode === "cards" ? "primary" : "secondary"} aria-pressed={mode === "cards"} onClick={() => changeView({ mode: "cards" })}>Cards</Button><Button variant={mode === "table" ? "primary" : "secondary"} aria-pressed={mode === "table"} onClick={() => changeView({ mode: "table" })}>Table</Button></div><Button variant="quiet" onClick={() => changeView({ query: "", status: "All" })}>Reset filters</Button></div>
    <section className="inventory-list"><header><div><p className="inventory-eyebrow">Selected inventory</p><h2>Vehicle records</h2></div><span>{vehicles.length} shown</span></header>{mode === "cards" ? <div className="inventory-card-grid">{vehicles.map((vehicle) => <button className="inventory-card" type="button" key={vehicle.id} onClick={() => open(vehicle)}><span className="inventory-card-media">{vehicle.gallery.images[0] ? <img src={vehicle.gallery.images[0].src} alt="" /> : "Vehicle image pending"}</span><span><StatusPill tone={toneForStatus(vehicle.status)}>{vehicle.status}</StatusPill><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong><small>{vehicle.derivative} · {vehicle.stockId}</small><b>{currency.format(vehicle.price)}</b></span></button>)}</div> : <RecordTable caption="Inventory vehicles" records={vehicles} emptyMessage="No vehicles match these filters." columns={[{ key: "vehicle", label: "Vehicle", render: (vehicle) => <button className="inventory-record-link" type="button" onClick={() => open(vehicle)}><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong><small>{vehicle.derivative} · {vehicle.stockId}</small></button> }, { key: "status", label: "Status", render: (vehicle) => <StatusPill tone={toneForStatus(vehicle.status)}>{vehicle.status}</StatusPill> }, { key: "price", label: "Price", render: (vehicle) => currency.format(vehicle.price) }, { key: "mileage", label: "Mileage", render: (vehicle) => `${vehicle.mileageKm.toLocaleString("en-ZA")} km` }, { key: "location", label: "Location", render: (vehicle) => <>{vehicle.branch}<small>{vehicle.location}</small></> }, { key: "action", label: "Next action", render: (vehicle) => <Button variant="quiet" onClick={() => open(vehicle)}>Open</Button> }]} />}</section>
  </section></div>;
}
