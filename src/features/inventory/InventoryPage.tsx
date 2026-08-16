import { useMemo, useState } from "react";
import { Button } from "../../components/controls/Button";
import { StatusPill } from "../../components/controls/StatusPill";
import { MetricBlock } from "../../components/data-display/MetricBlock";
import { RecordTable } from "../../components/data-display/RecordTable";
import { selectFilteredVehicles, type VehicleFilterStatus } from "../../domain/selectors";
import type { DemoState, Vehicle } from "../../domain/models";
import type { DemoRepository } from "../../repository/demoRepository";
import { VehicleDetail } from "./VehicleDetail";
import { VehicleIntake } from "./VehicleIntake";

const currency = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
const toneForStatus = (status: Vehicle["status"]) => status === "Available" ? "positive" : status === "Reserved" || status === "Recon" ? "warning" : status === "In Transit" ? "info" : status === "Service Hold" ? "critical" : "neutral";

export function InventoryPage({ state, repository, initialSubview = "list", onNavigate }: { state: DemoState; repository: DemoRepository; initialSubview?: string; onNavigate?: (subview: string) => void }) {
  const [subview, setSubview] = useState(initialSubview);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<VehicleFilterStatus>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = (next: string) => { setSubview(next); onNavigate?.(next); };
  const vehicles = useMemo(() => selectFilteredVehicles(state, query, status), [state, query, status]);
  const selected = state.vehicles.find((vehicle) => vehicle.id === selectedId);
  if (selected && subview === "detail") return <VehicleDetail vehicle={selected} repository={repository} onBack={() => navigate("list")} onCreateDeal={() => onNavigate?.("create-deal")} />;
  if (subview === "intake") return <VehicleIntake state={state} repository={repository} onComplete={(id) => { setSelectedId(id); navigate("detail"); }} onCancel={() => navigate("list")} />;
  const available = state.vehicles.filter((vehicle) => vehicle.status === "Available").length;
  return <section className="inventory-page"><header className="inventory-heading"><div><p className="inventory-eyebrow">Vehicles</p><h1>Inventory</h1><p>{state.vehicles.length} connected vehicle records, maintained in this local demo workspace.</p></div><Button onClick={() => navigate("intake")}>Add vehicle</Button></header><div className="inventory-metrics"><MetricBlock label="On hand" value={state.vehicles.length} detail="Connected records" /><MetricBlock label="Available" value={available} detail="Ready to sell" /><MetricBlock label="Retail value" value={currency.format(state.vehicles.reduce((total, vehicle) => total + vehicle.price, 0))} detail="Current inventory" /></div><div className="inventory-toolbar"><label className="inventory-search">Search inventory<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="VIN, model, stock or branch" /></label><label className="inventory-filter">Status<select value={status} onChange={(event) => setStatus(event.target.value as VehicleFilterStatus)}><option>All</option>{["Available", "Reserved", "In Transit", "Service Hold", "Recon", "Photography"].map((item) => <option key={item}>{item}</option>)}</select></label><Button variant="quiet" onClick={() => { setQuery(""); setStatus("All"); }}>Reset filters</Button></div><section className="inventory-list"><header><div><p className="inventory-eyebrow">Selected inventory</p><h2>Vehicle records</h2></div><span>{vehicles.length} shown</span></header><RecordTable caption="Inventory vehicles" records={vehicles} emptyMessage="No vehicles match these filters." columns={[{ key: "vehicle", label: "Vehicle", render: (vehicle) => <button className="inventory-record-link" type="button" onClick={() => { setSelectedId(vehicle.id); navigate("detail"); }}><strong>{vehicle.year} {vehicle.make} {vehicle.model}</strong><small>{vehicle.derivative} · {vehicle.stockId}</small></button> }, { key: "status", label: "Status", render: (vehicle) => <StatusPill tone={toneForStatus(vehicle.status)}>{vehicle.status}</StatusPill> }, { key: "price", label: "Price", render: (vehicle) => currency.format(vehicle.price) }, { key: "mileage", label: "Mileage", render: (vehicle) => `${vehicle.mileageKm.toLocaleString("en-ZA")} km` }, { key: "location", label: "Location", render: (vehicle) => <>{vehicle.branch}<small>{vehicle.location}</small></> }, { key: "action", label: "Next action", render: (vehicle) => <Button variant="quiet" onClick={() => { setSelectedId(vehicle.id); navigate("detail"); }}>Open</Button> }]} /></section></section>;
}
