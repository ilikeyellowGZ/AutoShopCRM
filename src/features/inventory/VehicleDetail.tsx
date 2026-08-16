import { useState } from "react";
import { Button } from "../../components/controls/Button";
import { StatusPill } from "../../components/controls/StatusPill";
import type { DemoRepository } from "../../repository/demoRepository";
import type { DemoState, Vehicle } from "../../domain/models";
import { VehicleGallery } from "./VehicleGallery";

const currency = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });
const toneForStatus = (status: Vehicle["status"]) => status === "Available" ? "positive" : status === "Reserved" || status === "Recon" ? "warning" : status === "In Transit" ? "info" : status === "Service Hold" ? "critical" : "neutral";

export function VehicleDetail({ vehicle, state, repository, onBack, onCreateDeal }: { vehicle: Vehicle; state: DemoState; repository: DemoRepository; onBack: () => void; onCreateDeal?: () => void }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(vehicle.price));
  const save = () => { const next = Number(price); if (Number.isFinite(next) && next > 0) repository.updateVehicle(vehicle.id, { price: next }); setEditing(false); };
  const margin = vehicle.price - vehicle.purchasePrice;
  const history = state.activities.filter((activity) => activity.targetType === "vehicle" && activity.targetId === vehicle.id).slice(0, 4);
  const service = state.serviceJobs.filter((job) => job.vehicleId === vehicle.id);
  const tasks = state.tasks.filter((task) => task.relatedType === "vehicle" && task.relatedId === vehicle.id);
  const finance = state.financeDrafts.find((draft) => draft.vehicleId === vehicle.id);
  const deal = state.deals.find((item) => item.vehicleId === vehicle.id);
  const documents = [{ label: `Gallery manifest (${vehicle.gallery.images.length} images)`, status: "Ready" }, ...service.map((job) => ({ label: `Service record: ${job.id}`, status: job.status })), ...(finance ? [{ label: "Finance worksheet", status: "Draft" }] : []), ...(deal ? [{ label: `Deal contract: ${deal.id}`, status: deal.status }] : [])];
  return <article className="vehicle-detail">
    <div className="vehicle-detail-actions"><Button variant="quiet" onClick={onBack}>Back to inventory</Button><Button variant="secondary" onClick={() => window.print()}>Print sheet</Button><Button onClick={onCreateDeal}>Create deal</Button></div>
    <header className="vehicle-detail-heading"><div><p className="inventory-eyebrow">{vehicle.stockId} · {vehicle.vin}</p><h1>{vehicle.year} {vehicle.make} {vehicle.model} {vehicle.derivative}</h1><p>{vehicle.exterior} · {vehicle.mileageKm.toLocaleString("en-ZA")} km · {vehicle.branch}</p></div><StatusPill tone={toneForStatus(vehicle.status)}>{vehicle.status}</StatusPill></header>
    <div className="vehicle-detail-grid"><VehicleGallery vehicle={vehicle} /><aside className="vehicle-detail-summary"><p className="inventory-eyebrow">Retail price</p>{editing ? <label>Price (ZAR)<input aria-label="Price (ZAR)" type="number" value={price} onChange={(event) => setPrice(event.target.value)} /></label> : <strong>{currency.format(vehicle.price)}</strong>}<p>{vehicle.location} · {vehicle.daysInStock} days in stock</p><Button variant="secondary" onClick={() => editing ? save() : setEditing(true)}>{editing ? "Save price" : "Edit record"}</Button></aside></div>
    <div className="vehicle-detail-sections"><section><h2>Specifications</h2><dl><div><dt>Exterior</dt><dd>{vehicle.exterior}</dd></div><div><dt>Branch</dt><dd>{vehicle.branch}</dd></div><div><dt>Mileage</dt><dd>{vehicle.mileageKm.toLocaleString("en-ZA")} km</dd></div><div><dt>Location</dt><dd>{vehicle.location}</dd></div></dl></section><section><h2>Cost & margin</h2><dl><div><dt>Purchase cost</dt><dd>{currency.format(vehicle.purchasePrice)}</dd></div><div><dt>Projected gross</dt><dd>{currency.format(margin)}</dd></div><div><dt>Margin</dt><dd>{((margin / vehicle.price) * 100).toFixed(1)}%</dd></div></dl></section><section><h2>Tasks</h2>{tasks.length ? <ul>{tasks.map((task) => <li key={task.id}>{task.title} — {task.status}</li>)}</ul> : <p>No open vehicle tasks.</p>}</section><section><h2>Service history</h2>{service.length ? <ul>{service.map((job) => <li key={job.id}>{job.status} — {job.note}</li>)}</ul> : <p>No linked service jobs.</p>}</section><section><h2>Documents</h2>{documents.length ? <ul>{documents.map((document) => <li key={document.label}>{document.label} — {document.status}</li>)}</ul> : <p>No linked documents.</p>}</section><section><h2>Audit activity</h2>{history.length ? <ul>{history.map((activity) => <li key={activity.id}>{activity.action} — {activity.detail}</li>)}</ul> : <p>No vehicle-specific activity recorded yet.</p>}</section></div>
  </article>;
}
