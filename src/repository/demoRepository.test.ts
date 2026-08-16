import { describe, expect, it, vi } from "vitest";
import { memoryStorage } from "../test/memoryStorage";
import { createDemoRepository, STORAGE_KEY } from "./demoRepository";

describe("DemoRepository", () => {
  it("recovers from corrupt storage and persists the recovered seed", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, "not-json");

    const repository = createDemoRepository(storage);

    expect(repository.getState().vehicles).toHaveLength(10);
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? "{}").schemaVersion).toBe(1);
  });

  it("recovers from an incompatible payload and persists the deterministic seed", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 2, vehicles: [] }));

    expect(createDemoRepository(storage).getState().activities).toHaveLength(12);
    expect(JSON.parse(storage.getItem(STORAGE_KEY) ?? "{}").schemaVersion).toBe(1);
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

    expect(recovered).toMatchObject({ schemaVersion: 1 });
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

  it("persists successful vehicle creation with a typed vehicle audit", () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const vehicle = repository.getState().vehicles[0];
    repository.addVehicle({ ...vehicle, id: "vehicle-11", vin: "1HGCM82633A004352", stockId: "WEE-2411" });
    const reloaded = createDemoRepository(storage).getState();
    expect(reloaded.vehicles.find((item) => item.id === "vehicle-11")?.stockId).toBe("WEE-2411");
    expect(reloaded.activities[0]).toMatchObject({ action: "Vehicle added", targetType: "vehicle", targetId: "vehicle-11" });
  });

  it("persists successful vehicle edit with a typed vehicle audit", () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const vehicle = repository.getState().vehicles[0];
    repository.updateVehicle(vehicle.id, { price: 4_300_000 });
    const reloaded = createDemoRepository(storage).getState();
    expect(reloaded.vehicles[0].price).toBe(4_300_000);
    expect(reloaded.activities[0]).toMatchObject({ action: "Vehicle updated", targetType: "vehicle", targetId: vehicle.id });
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
    expect(reloaded.activities[0]).toMatchObject({ id: "activity-13", action: "Lead moved" });
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

  it("resets to seed data and records the reset as the latest activity", () => {
    const repository = createDemoRepository(memoryStorage());
    repository.completeTask(repository.getState().tasks[0].id);

    repository.reset();

    expect(repository.getState().tasks[0].status).not.toBe("Completed");
    expect(repository.getState().activities[0].action).toBe("Demo data reset");
  });

  it("keeps reset audit activity IDs increasing within a repository session", () => {
    const repository = createDemoRepository(memoryStorage());
    repository.reset();
    const firstId = repository.getState().activities[0].id;
    repository.reset();

    expect(repository.getState().activities[0].id).not.toBe(firstId);
    expect(repository.getState().activities[0].id).toBe("activity-14");
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
