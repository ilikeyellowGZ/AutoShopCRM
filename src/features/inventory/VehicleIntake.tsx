import { useMemo, useState } from "react";
import { Button } from "../../components/controls/Button";
import { Field, SelectField } from "../../components/controls/Field";
import { demoBranches, vehicleBodyTypes, vehicleFuels, vehicleTransmissions, type DemoState, type Vehicle, type VehicleStatus } from "../../domain/models";
import type { DemoRepository } from "../../repository/demoRepository";
import { createVehicleGallery } from "../../media/vehicleGalleries";
import { validateVehicleIntake, type VehicleIntakeErrors, type VehicleIntakeInput } from "./intakeValidation";

type IntakeValues = VehicleIntakeInput & { derivative: string; exterior: string; mileageKm: number; branch: string; location: string; status: VehicleStatus };
const defaults: IntakeValues = { vin: "", stockId: "", year: 2024, make: "", model: "", derivative: "", price: 0, exterior: "", mileageKm: 0, branch: "Johannesburg North", location: "Intake bay", status: "Photography", bodyType: "Unknown", fuel: "Unknown", transmission: "Unknown", engine: "", registration: "Unregistered" };
const steps = ["Identification", "Specifications", "Media", "Review"] as const;
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export function VehicleIntake({ state, repository, allowedBranches = demoBranches, draftScopeKey = "standalone", onComplete, onCancel }: { state: DemoState; repository: DemoRepository; allowedBranches?: readonly string[]; draftScopeKey?: string; onComplete?: (vehicleId: string) => void; onCancel?: () => void }) {
  const scopedDraft = state.drafts.vehicleIntakes[draftScopeKey] ?? state.drafts.vehicleIntake;
  const draft = scopedDraft?.values as Partial<IntakeValues> | undefined;
  const branches = allowedBranches.length ? allowedBranches : demoBranches;
  const requestedBranch = draft?.branch ?? state.preferences.branch;
  const initialBranch = branches.includes(requestedBranch) ? requestedBranch : branches[0];
  const [step, setStep] = useState<1 | 2 | 3 | 4>(scopedDraft?.step ?? 1);
  const [values, setValues] = useState<IntakeValues>({ ...defaults, ...draft, branch: initialBranch });
  const [errors, setErrors] = useState<VehicleIntakeErrors>({});
  const persist = (next = values, nextStep = step) => repository.updateVehicleIntakeDraft(draftScopeKey, { step: nextStep, values: next });
  const change = <K extends keyof IntakeValues>(key: K, value: IntakeValues[K]) => setValues((current) => ({ ...current, [key]: value }));
  const fullState = useMemo(() => repository.getState(), [repository, state.vehicles]);
  const validation = useMemo(() => validateVehicleIntake(values, fullState), [fullState, values]);
  const advance = () => { const nextErrors = validateVehicleIntake(values, fullState); if (step === 1 && (nextErrors.vin || nextErrors.stockId)) { setErrors(nextErrors); return; } if (step === 2 && (nextErrors.year || nextErrors.make || nextErrors.model || nextErrors.price || nextErrors.bodyType || nextErrors.fuel || nextErrors.transmission || nextErrors.engine || nextErrors.registration)) { setErrors(nextErrors); return; } setErrors({}); const next = Math.min(4, step + 1) as 1 | 2 | 3 | 4; setStep(next); persist(values, next); };
  const submit = () => { const nextErrors = validateVehicleIntake(values, fullState); if (Object.keys(nextErrors).length) { setErrors(nextErrors); return; } const usedIds = new Set(fullState.vehicles.map((vehicle) => vehicle.id)); let sequence = fullState.vehicles.length + 1; while (usedIds.has(`vehicle-${String(sequence).padStart(2, "0")}`)) sequence += 1; const id = `vehicle-${String(sequence).padStart(2, "0")}`; const derivative = values.derivative.trim() || "Standard"; const exterior = values.exterior.trim() || "Unspecified"; const vehicleName = `${values.year} ${values.make} ${values.model} ${derivative}`.trim(); const vehicle: Vehicle = { id, ...values, derivative, exterior, engine: values.engine.trim(), registration: values.registration.trim(), vin: values.vin.trim().toUpperCase(), stockId: values.stockId.trim().toUpperCase(), purchasePrice: Math.round(values.price * .82), daysInStock: 0, gallery: createVehicleGallery(slugify(vehicleName), vehicleName) }; repository.addVehicle(vehicle); repository.updateVehicleIntakeDraft(draftScopeKey, null); onComplete?.(id); };
  return <section className="vehicle-intake">
    <header className="vehicle-intake-heading"><div><p className="inventory-eyebrow">Inventory</p><h1>Vehicle intake</h1><p>Capture a vehicle record before it moves into the operational inventory.</p></div>{onCancel ? <Button variant="quiet" onClick={() => { persist(); onCancel(); }}>Cancel</Button> : null}</header>
    <ol className="intake-steps" aria-label="Vehicle intake steps">{steps.map((label, index) => <li key={label} aria-current={step === index + 1 ? "step" : undefined}>{index + 1}. {label}</li>)}</ol>
    <div className="intake-content">
      <p className="sr-only" aria-live="polite">Step {step}: {steps[step - 1]}</p>
      {step === 1 ? <div className="intake-fields" onBlur={() => persist()}><Field label="VIN" value={values.vin} error={errors.vin} onChange={(event) => change("vin", event.target.value)} /><Field label="Stock ID" value={values.stockId} error={errors.stockId} onChange={(event) => change("stockId", event.target.value)} /><SelectField label="Branch" value={values.branch} onChange={(event) => change("branch", event.target.value)}>{branches.map((branch) => <option key={branch}>{branch}</option>)}</SelectField></div> : null}
      {step === 2 ? <div className="intake-fields intake-fields--three" onBlur={() => persist()}>
        <Field label="Year" type="number" value={values.year} error={errors.year} onChange={(event) => change("year", Number(event.target.value))} />
        <Field label="Make" value={values.make} error={errors.make} onChange={(event) => change("make", event.target.value)} />
        <Field label="Model" value={values.model} error={errors.model} onChange={(event) => change("model", event.target.value)} />
        <Field label="Derivative" value={values.derivative} onChange={(event) => change("derivative", event.target.value)} />
        <SelectField label="Body type" value={values.bodyType} error={errors.bodyType} onChange={(event) => change("bodyType", event.target.value as IntakeValues["bodyType"])}>{vehicleBodyTypes.map((option) => <option key={option} value={option} disabled={option === "Unknown"}>{option === "Unknown" ? "Select body type" : option}</option>)}</SelectField>
        <SelectField label="Fuel" value={values.fuel} error={errors.fuel} onChange={(event) => change("fuel", event.target.value as IntakeValues["fuel"])}>{vehicleFuels.map((option) => <option key={option} value={option} disabled={option === "Unknown"}>{option === "Unknown" ? "Select fuel" : option}</option>)}</SelectField>
        <SelectField label="Transmission" value={values.transmission} error={errors.transmission} onChange={(event) => change("transmission", event.target.value as IntakeValues["transmission"])}>{vehicleTransmissions.map((option) => <option key={option} value={option} disabled={option === "Unknown"}>{option === "Unknown" ? "Select transmission" : option}</option>)}</SelectField>
        <Field label="Engine" value={values.engine} error={errors.engine} onChange={(event) => change("engine", event.target.value)} />
        <Field label="Registration" value={values.registration} error={errors.registration} onChange={(event) => change("registration", event.target.value)} />
        <Field label="Exterior colour" value={values.exterior} onChange={(event) => change("exterior", event.target.value)} />
        <Field label="Mileage (km)" type="number" value={values.mileageKm} onChange={(event) => change("mileageKm", Number(event.target.value))} />
        <Field label="Price (ZAR)" type="number" value={values.price} error={errors.price} onChange={(event) => change("price", Number(event.target.value))} />
      </div> : null}
      {step === 3 ? <div className="intake-media"><h2>Media path contract</h2><p>On submission, the record receives eight ordered studio-image paths under <code>/media/vehicles/&lt;vehicle-slug&gt;/</code>. Image files can be supplied later without changing the record.</p><ul>{["Front elevation", "Front-left three-quarter", "Left profile", "Rear-left three-quarter", "Rear elevation", "Rear-right three-quarter", "Right profile", "Front-right three-quarter"].map((angle, index) => <li key={angle}>{String(index + 1).padStart(2, "0")} · {angle}</li>)}</ul></div> : null}
      {step === 4 ? <div className="intake-review"><h2>Review vehicle record</h2><dl><div><dt>Vehicle</dt><dd>{values.year} {values.make} {values.model} {values.derivative}</dd></div><div><dt>Specifications</dt><dd>{values.bodyType} · {values.fuel} · {values.transmission}</dd></div><div><dt>Engine</dt><dd>{values.engine}</dd></div><div><dt>Registration</dt><dd>{values.registration}</dd></div><div><dt>Branch</dt><dd>{values.branch}</dd></div><div><dt>VIN</dt><dd>{values.vin || "Not entered"}</dd></div><div><dt>Stock ID</dt><dd>{values.stockId || "Not entered"}</dd></div><div><dt>Price</dt><dd>{new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(values.price)}</dd></div></dl>{Object.keys(errors).length ? <div role="alert">Please correct the highlighted fields before submitting.</div> : null}</div> : null}
    </div>
    <footer className="vehicle-intake-actions">{step > 1 ? <Button variant="secondary" onClick={() => { const previous = (step - 1) as 1 | 2 | 3; setStep(previous); persist(values, previous); }}>Previous</Button> : null}{step < 4 ? <Button onClick={advance}>Continue</Button> : <Button onClick={submit} disabled={Object.keys(validation).length > 0}>Add vehicle to inventory</Button>}</footer>
  </section>;
}
