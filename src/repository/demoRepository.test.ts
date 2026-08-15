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
});
