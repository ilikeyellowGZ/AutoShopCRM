import { describe, expect, it, vi } from "vitest";
import { memoryStorage } from "../test/memoryStorage";
import { createDemoRepository, STORAGE_KEY } from "./demoRepository";

describe("DemoRepository", () => {
  it("recovers from corrupt storage and persists the recovered seed", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, "not-json");

    const repository = createDemoRepository(storage);

    expect(repository.getState().vehicles).toHaveLength(30);
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? "{}").schemaVersion).toBe(4);
  });

  it("recovers from an incompatible payload and persists the deterministic seed", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 2, vehicles: [] }));

    expect(createDemoRepository(storage).getState().activities).toHaveLength(40);
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? "{}").schemaVersion).toBe(4);
  });

  it.each([
    ["legacy activity without targets", (state: Record<string, any>) => { delete state.activities[0].targetType; delete state.activities[0].targetId; }],
    ["unknown activity target type", (state: Record<string, any>) => { state.activities[0].targetType = "unknown"; }],
    ["dangling activity target", (state: Record<string, any>) => { state.activities[0].targetId = "vehicle-999"; }],
  ])("recovers deterministic seed from %s", (_name, corrupt) => {
    const storage = memoryStorage(); const state = createDemoRepository(storage).getState() as unknown as Record<string, any>; corrupt(state); storage.setItem(STORAGE_KEY, JSON.stringify(state));
    expect(createDemoRepository(storage).getState().activities).toHaveLength(40);
  });

  it("recovers from nested corrupt records before repository actions can crash", () => {
    const storage = memoryStorage();
    const state = createDemoRepository(storage).getState();
    state.vehicles[0] = null as never;
    storage.setItem(STORAGE_KEY, JSON.stringify(state));

    const repository = createDemoRepository(storage);

    expect(() => repository.updateVehicle("vehicle-01", { exterior: "White" })).not.toThrow();
    expect(repository.getState().vehicles[0].id).toBe("vehicle-01");
  });

  it.each([
    ["a vehicle missing price", (state: Record<string, any>) => { delete state.vehicles[0].price; }],
    ["a vehicle missing derivative", (state: Record<string, any>) => { delete state.vehicles[0].derivative; }],
    ["a gallery missing its cover image", (state: Record<string, any>) => { delete state.vehicles[0].gallery.coverImageId; }],
    ["an image missing its label", (state: Record<string, any>) => { delete state.vehicles[0].gallery.images[0].label; }],
    ["an image with an invalid angle", (state: Record<string, any>) => { state.vehicles[0].gallery.images[0].angle = "side"; }],
    ["an image with a non-path source", (state: Record<string, any>) => { state.vehicles[0].gallery.images[0].src = "data:image/png;base64,abc"; }],
    ["a truncated finance draft", (state: Record<string, any>) => { delete state.financeDrafts[0].aprPercent; }],
    ["a truncated customer", (state: Record<string, any>) => { delete state.customers[0].city; }],
    ["a truncated lead", (state: Record<string, any>) => { delete state.leads[0].dueAt; }],
    ["a truncated deal", (state: Record<string, any>) => { delete state.deals[0].grossProfit; }],
    ["a truncated service job", (state: Record<string, any>) => { delete state.serviceJobs[0].note; }],
    ["a truncated task", (state: Record<string, any>) => { delete state.tasks[0].tone; }],
    ["a truncated activity", (state: Record<string, any>) => { delete state.activities[0].occurredAt; }],
    ["a task with a mismatched related record type", (state: Record<string, any>) => { state.tasks[0].relatedId = "service-01"; }],
  ])("recovers from %s", (_name, corrupt) => {
    const storage = memoryStorage();
    const state = createDemoRepository(storage).getState() as unknown as Record<string, any>;
    corrupt(state);
    storage.setItem(STORAGE_KEY, JSON.stringify(state));

    const recovered = createDemoRepository(storage).getState();

    expect(recovered).toMatchObject({ schemaVersion: 4 });
    expect(recovered.vehicles[0]).toMatchObject({ derivative: "GT3", price: 4_250_000 });
    expect(recovered.financeDrafts[0].aprPercent).toBe(11.5);
    expect(recovered.tasks[0].relatedId).toBe("lead-01");
  });

  it("persists a task completion and writes an audit activity", () => {
    const storage = memoryStorage();
    const repository = createDemoRepository(storage);
    const taskId = repository.getState().tasks[0].id;

    repository.completeTask(taskId);

    const reloaded = createDemoRepository(storage).getState();
    expect(reloaded.tasks.find((task) => task.id === taskId)?.status).toBe("Completed");
    expect(reloaded.activities[0].action).toBe("Task completed");
  });

  it("rejects duplicate VIN values with a specific error", () => {
    const repository = createDemoRepository(memoryStorage());
    const existing = repository.getState().vehicles[0];

    expect(() => repository.addVehicle({ ...existing, id: "vehicle-11", stockId: "WEE-0011" })).toThrow("VIN already exists in the active Weelee inventory.");
  });

  it("rejects duplicate customer emails without persisting a partial customer", () => {
    const repository = createDemoRepository(memoryStorage());
    const existing = repository.getState().customers[0];

    expect(() => repository.addCustomer({ ...existing, id: "customer-49", email: ` ${existing.email.toUpperCase()} ` })).toThrow("A customer with this email already exists.");
    expect(repository.getState().customers).toHaveLength(48);
  });

  it("rejects lead and deal references that do not belong to the active directory", () => {
    const repository = createDemoRepository(memoryStorage());
    const state = repository.getState();

    expect(() => repository.addLead({ ...state.leads[0], id: "lead-99", customerId: "customer-missing" })).toThrow("Customer not found.");
    expect(() => repository.addDeal({ ...state.deals[0], id: "deal-99", vehicleId: "vehicle-missing" })).toThrow("Vehicle not found.");
  });

  it("rejects an identical persisted pipeline stage move", () => {
    const repository = createDemoRepository(memoryStorage());
    const lead = repository.getState().leads[0];

    expect(() => repository.moveLead(lead.id, lead.stage)).toThrow("Lead is already in this pipeline stage.");
  });

  it("rejects runtime-invalid lead stages without changing stored state or audit history", () => {
    const repository = createDemoRepository(memoryStorage());
    const before = repository.getState();

    expect(() => repository.moveLead(before.leads[0].id, "Lost" as never)).toThrow("Invalid lead stage.");
    expect(() => repository.addLead({ ...before.leads[0], id: "lead-invalid", stage: "Lost" as never })).toThrow("Invalid lead stage.");
    expect(repository.getState()).toEqual(before);
  });

  it("rejects dangling customer vehicle interests on create and update without an audit", () => {
    const repository = createDemoRepository(memoryStorage());
    const before = repository.getState();
    expect(() => repository.addCustomer({ ...before.customers[0], id: "customer-49", email: "new@example.com", vehicleInterestId: "vehicle-missing" })).toThrow("Vehicle interest not found.");
    expect(() => repository.updateCustomer(before.customers[0].id, { vehicleInterestId: "vehicle-missing" })).toThrow("Vehicle interest not found.");
    expect(repository.getState()).toEqual(before);
  });

  it("persists a customer note as a customer-targeted activity across reload", () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const customer = repository.getState().customers[0];
    repository.addCustomerNote(customer.id, "Confirm the morning test drive.");
    const activity = createDemoRepository(storage).getState().activities[0];
    expect(activity).toMatchObject({ action: "Customer note added", detail: "Confirm the morning test drive.", targetType: "customer", targetId: customer.id });
  });

  it("persists successful customer lead and deal mutations with typed audits across reload", () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const state = repository.getState();
    const customer = { ...state.customers[0], id: "customer-49", email: "reload@example.com" };
    repository.addCustomer(customer); repository.addLead({ ...state.leads[0], id: "lead-99", customerId: customer.id }); repository.addDeal({ ...state.deals[0], id: "deal-99", customerId: customer.id });
    const reloaded = createDemoRepository(storage).getState();
    expect(reloaded.activities.slice(0, 3).map((activity) => activity.targetType)).toEqual(["deal", "lead", "customer"]);
  });

  it("persists successful vehicle creation with a typed vehicle audit", () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const vehicle = repository.getState().vehicles[0];
    repository.addVehicle({ ...vehicle, id: "vehicle-31", vin: "1HGCM82633A004352", stockId: "WEE-2431" });
    const reloaded = createDemoRepository(storage).getState();
    expect(reloaded.vehicles.find((item) => item.id === "vehicle-31")?.stockId).toBe("WEE-2431");
    expect(reloaded.activities[0]).toMatchObject({ action: "Vehicle added", targetType: "vehicle", targetId: "vehicle-31" });
  });

  it("persists successful vehicle edit with a typed vehicle audit", () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const vehicle = repository.getState().vehicles[0];
    repository.updateVehicle(vehicle.id, { price: 4_300_000 });
    const reloaded = createDemoRepository(storage).getState();
    expect(reloaded.vehicles[0].price).toBe(4_300_000);
    expect(reloaded.activities[0]).toMatchObject({ action: "Vehicle updated", targetType: "vehicle", targetId: vehicle.id });
  });

  it("writes typed targets for task, lead, deal, finance, and service mutations", () => {
    const repository = createDemoRepository(memoryStorage()); const state = repository.getState();
    repository.completeTask(state.tasks[0].id); expect(repository.getState().activities[0]).toMatchObject({ targetType: "task", targetId: state.tasks[0].id });
    repository.moveLead(state.leads[0].id, "Delivery"); expect(repository.getState().activities[0]).toMatchObject({ targetType: "lead", targetId: state.leads[0].id });
    repository.updateFinanceDraft(state.vehicles[0].id, { downPayment: 1 }); expect(repository.getState().activities[0]).toMatchObject({ targetType: "vehicle", targetId: state.vehicles[0].id });
    repository.updateServiceJob(state.serviceJobs[0].id, { note: "Checked" }); expect(repository.getState().activities[0]).toMatchObject({ targetType: "service", targetId: state.serviceJobs[0].id });
  });

  it("persists vehicle-intake drafts independently by account and branch", () => {
    const repository = createDemoRepository(memoryStorage());
    const initialActivityCount = repository.getState().activities.length;

    repository.updateVehicleIntakeDraft("owner:Johannesburg North", { step: 2, values: { stockId: "OWNER-DRAFT" } });
    repository.updateVehicleIntakeDraft("stock:Pretoria", { step: 1, values: { stockId: "STOCK-DRAFT" } });

    expect(repository.getState().drafts.vehicleIntakes["owner:Johannesburg North"]?.values.stockId).toBe("OWNER-DRAFT");
    expect(repository.getState().drafts.vehicleIntakes["stock:Pretoria"]?.values.stockId).toBe("STOCK-DRAFT");
    repository.updateVehicleIntakeDraft("stock:Pretoria", null);
    expect(repository.getState().drafts.vehicleIntakes["stock:Pretoria"]).toBeUndefined();
    expect(repository.getState().drafts.vehicleIntakes["owner:Johannesburg North"]?.values.stockId).toBe("OWNER-DRAFT");
    expect(repository.getState().activities).toHaveLength(initialActivityCount);
  });

  it("reloads an incomplete vehicle-intake draft without resetting persisted CRM state", () => {
    const storage = memoryStorage();
    const repository = createDemoRepository(storage);
    repository.setPreferences({ density: "compact" });
    repository.updateVehicleIntakeDraft("owner:Johannesburg North", {
      step: 1,
      values: { vin: "OWNER", stockId: "", year: 2024, make: "", model: "", engine: "", registration: "Unregistered" },
    });

    const reloaded = createDemoRepository(storage).getState();

    expect(reloaded.preferences.density).toBe("compact");
    expect(reloaded.vehicles).toHaveLength(30);
    expect(reloaded.drafts.vehicleIntakes["owner:Johannesburg North"]?.values.vin).toBe("OWNER");
  });

  it("writes an explicit audit target matrix for every entity mutation", () => {
    const repository = createDemoRepository(memoryStorage()); const state = repository.getState();
    const cases: Array<[string, () => void, string, string, string]> = [
      ["task complete", () => repository.completeTask(state.tasks[0].id), "Task completed", "task", state.tasks[0].id],
      ["task reschedule", () => repository.rescheduleTask(state.tasks[0].id, "2026-08-20T09:00:00+02:00"), "Task rescheduled", "task", state.tasks[0].id],
      ["customer update", () => repository.updateCustomer(state.customers[0].id, { city: "Walvis Bay" }), "Customer updated", "customer", state.customers[0].id],
      ["lead stage", () => repository.updateLeadStage(state.leads[0].id, "Delivery"), "Lead moved", "lead", state.leads[0].id],
      ["deal status", () => repository.updateDealStatus(state.deals[0].id, "Closed"), "Deal updated", "deal", state.deals[0].id],
      ["service state", () => repository.updateServiceState(state.serviceJobs.find((job) => job.status === "Quality Check")!.id, "Ready"), "Service job updated", "service", state.serviceJobs.find((job) => job.status === "Quality Check")!.id],
    ];
    for (const [_name, invoke, action, targetType, targetId] of cases) { invoke(); expect(repository.getState().activities[0]).toMatchObject({ action, targetType, targetId }); }
  });

  it("keeps preferences, drafts, and notifications intentionally system-scoped", () => {
    const repository = createDemoRepository(memoryStorage()); const state = repository.getState();
    repository.setPreferences({ branch: "Sandton" }); expect(repository.getState().activities[0]).toMatchObject({ targetType: "system", targetId: "system" });
    repository.updateDraft("lead", { owner: "Alicia Brown" }); expect(repository.getState().activities[0]).toMatchObject({ targetType: "system", targetId: "system" });
    repository.markNotificationRead(state.notifications[0].id); expect(repository.getState().activities[0]).toMatchObject({ targetType: "system", targetId: "system" });
  });

  it("clears optional route metadata in memory and persisted storage", () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage);
    repository.setPreferences({ activePage: "sales", activeSubview: "deals", activeRecordType: "deal", activeRecordId: "deal-01", activeContextId: "vehicle-01" });

    repository.setPreferences({ activePage: "sales", activeSubview: "sales-log", activeRecordType: undefined, activeRecordId: undefined, activeContextId: undefined });

    expect(repository.getState().preferences).not.toHaveProperty("activeRecordType");
    expect(repository.getState().preferences).not.toHaveProperty("activeRecordId");
    expect(repository.getState().preferences).not.toHaveProperty("activeContextId");
    const persisted = JSON.parse(storage.getItem(STORAGE_KEY) ?? "{}") as { preferences?: Record<string, unknown> };
    expect(persisted.preferences).not.toHaveProperty("activeRecordType");
    expect(persisted.preferences).not.toHaveProperty("activeRecordId");
    expect(persisted.preferences).not.toHaveProperty("activeContextId");
  });

  it("rejects canonical VIN and stock duplicates without mutating state or audit history", () => {
    const repository = createDemoRepository(memoryStorage());
    const before = repository.getState();
    const existing = before.vehicles[0];
    expect(() => repository.addVehicle({ ...existing, id: "vehicle-11", vin: ` ${existing.vin.toLowerCase()} `, stockId: "WEE-9999" })).toThrow("VIN already exists");
    expect(() => repository.addVehicle({ ...existing, id: "vehicle-11", vin: "1HGCM82633A004352", stockId: ` ${existing.stockId.toLowerCase()} ` })).toThrow("Stock ID already exists");
    expect(repository.getState().vehicles).toHaveLength(before.vehicles.length);
    expect(repository.getState().activities).toHaveLength(before.activities.length);
  });

  it("rejects blank VIN and canonical stock update without mutating the record", () => {
    const repository = createDemoRepository(memoryStorage());
    const [first, second] = repository.getState().vehicles;
    expect(() => repository.updateVehicle(second.id, { vin: "  " })).toThrow("VIN must contain exactly 17 characters");
    expect(() => repository.updateVehicle(second.id, { stockId: ` ${first.stockId.toLowerCase()} ` })).toThrow("Stock ID already exists");
    expect(repository.getState().vehicles.find((vehicle) => vehicle.id === second.id)).toMatchObject({ vin: second.vin, stockId: second.stockId });
  });

  it("rejects blank VIN updates", () => {
    const repository = createDemoRepository(memoryStorage());
    const [first, second] = repository.getState().vehicles;
    expect(() => repository.updateVehicle(first.id, { vin: "" })).toThrow("VIN must contain exactly 17 characters.");
    expect(repository.getState().vehicles.find((vehicle) => vehicle.id === second.id)?.vin).toBe(second.vin);
  });

  it("updates, persists, audits, and notifies for a mutation", () => {
    const storage = memoryStorage();
    const repository = createDemoRepository(storage);
    const listener = vi.fn();
    const unsubscribe = repository.subscribe(listener);
    const lead = repository.getState().leads[0];

    repository.moveLead(lead.id, "Delivery");
    unsubscribe();

    const reloaded = createDemoRepository(storage).getState();
    expect(reloaded.leads.find((item) => item.id === lead.id)?.stage).toBe("Delivery");
    expect(reloaded.activities[0]).toMatchObject({ id: "activity-41", action: "Lead moved" });
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("merges finance drafts and marks notifications read without losing other state", () => {
    const repository = createDemoRepository(memoryStorage());
    const { financeDrafts, notifications, vehicles } = repository.getState();
    const notification = notifications.find((item) => !item.read)!;

    repository.updateFinanceDraft(financeDrafts[0].vehicleId, { downPayment: 425_000 });
    repository.markNotificationRead(notification.id);

    expect(repository.getState().financeDrafts[0].downPayment).toBe(425_000);
    expect(repository.getState().notifications.find((item) => item.id === notification.id)?.read).toBe(true);
    expect(repository.getState().vehicles).toHaveLength(vehicles.length);
  });

  it("persists a valid service transition with a typed audit across reload", () => {
    const storage = memoryStorage();
    const repository = createDemoRepository(storage);
    const job = repository.getState().serviceJobs.find((item) => item.status === "Quality Check")!;

    repository.updateServiceState(job.id, "Ready");

    const reloaded = createDemoRepository(storage).getState();
    expect(reloaded.serviceJobs.find((item) => item.id === job.id)?.status).toBe("Ready");
    expect(reloaded.activities[0]).toMatchObject({ action: "Service job updated", targetType: "service", targetId: job.id });
  });

  it("records a finance submission as a local demo simulation across reload", () => {
    const storage = memoryStorage();
    const repository = createDemoRepository(storage);
    const vehicleId = repository.getState().financeDrafts[0].vehicleId;

    repository.submitFinanceApplication(vehicleId);

    expect(createDemoRepository(storage).getState().activities[0]).toMatchObject({
      action: "Finance demo submitted", targetType: "vehicle", targetId: vehicleId,
      detail: "A local sandbox finance submission was recorded; no lender was contacted.",
    });
  });

  it("rejects an invalid service transition without changing the job or audit history", () => {
    const repository = createDemoRepository(memoryStorage());
    const before = repository.getState();
    const job = before.serviceJobs.find((item) => item.status === "In Progress")!;

    expect(() => repository.updateServiceState(job.id, "Ready")).toThrow("Service job cannot move from In Progress to Ready.");
    expect(repository.getState()).toEqual(before);
  });

  it("rejects runtime-invalid service transitions without committing an audit", () => {
    const repository = createDemoRepository(memoryStorage()); const before = repository.getState(); const job = before.serviceJobs[0];
    expect(() => repository.updateServiceState(job.id, "Unknown" as never)).toThrow("Invalid service job status.");
    expect(() => repository.updateServiceJob(job.id, { status: "Unknown" as never })).toThrow("Invalid service job status.");
    expect(repository.getState()).toEqual(before);
  });

  it("guards service job customer and vehicle relationships before persistence", () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const before = repository.getState(); const job = before.serviceJobs[0];
    expect(() => repository.addServiceJob({ ...job, id: "service-99", customerId: "missing" })).toThrow("Customer not found.");
    expect(() => repository.updateServiceJob(job.id, { vehicleId: "missing" })).toThrow("Vehicle not found.");
    expect(repository.getState()).toEqual(before);
    repository.updateServiceJob(job.id, { note: "Verified by advisor" });
    const reloaded = createDemoRepository(storage).getState();
    expect(reloaded.serviceJobs[0].note).toBe("Verified by advisor"); expect(reloaded.activities[0]).toMatchObject({ targetType: "service", targetId: job.id });
  });

  it("resets to seed data and records the reset as the latest activity", () => {
    const repository = createDemoRepository(memoryStorage());
    repository.completeTask(repository.getState().tasks[0].id);

    repository.reset();

    expect(repository.getState().tasks[0].status).not.toBe("Completed");
    expect(repository.getState().activities[0].action).toBe("Demo data reset");
  });

  it("attributes mutations and resets to the active in-memory demo employee", () => {
    const repository = createDemoRepository(memoryStorage());
    repository.setAuditActor("Kabelo Molefe · Stock Controller");

    repository.updateVehicle("vehicle-01", { location: "Stock control bay" });
    expect(repository.getState().activities[0].actor).toBe("Kabelo Molefe · Stock Controller");

    repository.reset();
    expect(repository.getState().activities[0].actor).toBe("Kabelo Molefe · Stock Controller");
  });

  it("keeps reset audit activity IDs increasing within a repository session", () => {
    const repository = createDemoRepository(memoryStorage());
    repository.reset();
    const firstId = repository.getState().activities[0].id;
    repository.reset();

    expect(repository.getState().activities[0].id).not.toBe(firstId);
    expect(repository.getState().activities[0].id).toBe("activity-42");
  });

  it("remains usable when browser storage reads and writes fail", () => {
    const storage = memoryStorage();
    storage.getItem = () => { throw new Error("Storage unavailable"); };
    storage.setItem = () => { throw new Error("Storage full"); };
    const repository = createDemoRepository(storage);

    expect(() => repository.completeTask(repository.getState().tasks[0].id)).not.toThrow();
    expect(repository.getState().tasks[0].status).toBe("Completed");
  });

  it("isolates subscriber snapshots from repository state", () => {
    const repository = createDemoRepository(memoryStorage());
    repository.subscribe((snapshot) => { snapshot.vehicles[0].exterior = "Subscriber mutation"; });

    repository.updateVehicle("vehicle-01", { location: "Updated location" });

    expect(repository.getState().vehicles[0]).toMatchObject({ exterior: "Chalk", location: "Updated location" });
  });
});
