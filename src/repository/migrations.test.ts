import { describe, expect, it } from "vitest";
import { createSeedState } from "./seed";
import { migrateDemoState } from "./migrations";
import { LEGACY_STORAGE_KEY, loadDemoState, STORAGE_KEY } from "./storage";
import { memoryStorage } from "../test/memoryStorage";

const defaults = createSeedState().preferences;
type UnknownRecord = Record<string, unknown>;
const asRecord = (value: unknown): UnknownRecord => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Expected object test fixture.");
  return value as UnknownRecord;
};
const stateRecord = () => asRecord(createSeedState());
const preferences = (state: UnknownRecord) => asRecord(state.preferences);
const viewPreferences = (state: UnknownRecord) => asRecord(preferences(state).viewPreferences);
const viewGroup = (state: UnknownRecord, group: string) => asRecord(viewPreferences(state)[group]);

describe("preference migrations", () => {
  it("upgrades a persisted ten-vehicle v1 demo without discarding employee edits", () => {
    const state = stateRecord();
    state.schemaVersion = 1;
    state.vehicles = (state.vehicles as UnknownRecord[]).slice(0, 10).map((vehicle, index) => {
      const legacy = { ...vehicle };
      delete legacy.bodyType;
      delete legacy.fuel;
      delete legacy.transmission;
      delete legacy.engine;
      delete legacy.registration;
      legacy.branch = index % 2 ? "Swakopmund" : "Windhoek";
      return legacy;
    });
    (state.vehicles as UnknownRecord[])[0].price = 4_300_000;

    const migrated = migrateDemoState(state)!;

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.vehicles).toHaveLength(30);
    expect(migrated.vehicles[0]).toMatchObject({ price: 4_300_000, bodyType: "Coupe", branch: "Johannesburg North" });
    expect(migrated.vehicles.every((vehicle) => vehicle.engine && vehicle.registration)).toBe(true);
  });

  it("discovers the legacy storage key and persists its migration under v2", () => {
    const storage = memoryStorage();
    const state = stateRecord();
    state.schemaVersion = 1;
    storage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(state));

    expect(loadDemoState(storage).schemaVersion).toBe(2);
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).schemaVersion).toBe(2);
  });

  it("does not assign seeded specifications to a legacy user vehicle with a colliding ID", () => {
    const state = stateRecord();
    state.schemaVersion = 1;
    const custom: UnknownRecord = { ...(state.vehicles as UnknownRecord[])[10], vin: "1HGCM82633A004352", stockId: "USER-0011", make: "Honda", model: "Civic", branch: "Windhoek" };
    delete custom.bodyType;
    delete custom.fuel;
    delete custom.transmission;
    delete custom.engine;
    delete custom.registration;
    state.vehicles = [...(state.vehicles as UnknownRecord[]).slice(0, 10), custom];

    const migrated = migrateDemoState(state)!;
    const userVehicle = migrated.vehicles.find((vehicle) => vehicle.vin === "1HGCM82633A004352")!;
    const seededGle = migrated.vehicles.find((vehicle) => vehicle.stockId === "MCR-2511")!;

    expect(migrated.vehicles).toHaveLength(31);
    expect(userVehicle).toMatchObject({ id: "vehicle-11", make: "Honda", bodyType: "Unknown", engine: "Not captured", branch: "Johannesburg North" });
    expect(seededGle).toMatchObject({ id: "vehicle-31", make: "Mercedes-Benz", bodyType: "SUV" });
  });

  it("repairs the earlier invalid seeded demo VIN when stock identity matches", () => {
    const state = stateRecord();
    state.schemaVersion = 1;
    (state.vehicles as UnknownRecord[])[10].vin = "MCRMDMO0000000011";

    const migrated = migrateDemoState(state)!;

    expect(migrated.vehicles.find((vehicle) => vehicle.stockId === "MCR-2511")?.vin).toBe("MCRMDMA0000000011");
  });

  it("fills every nested default when view preferences are missing", () => {
    const state = stateRecord();
    delete preferences(state).viewPreferences;

    expect(migrateDemoState(state)?.preferences.viewPreferences).toEqual(defaults.viewPreferences);
  });

  it("deep-merges a partial view preference payload without discarding valid values", () => {
    const state = stateRecord();
    preferences(state).viewPreferences = { inventory: { query: "GT3" }, service: { view: "List" } };

    expect(migrateDemoState(state)?.preferences.viewPreferences).toEqual({
      ...defaults.viewPreferences,
      inventory: { ...defaults.viewPreferences.inventory, query: "GT3" },
      service: { ...defaults.viewPreferences.service, view: "List" },
    });
  });

  it.each([
    ["inventory query", (state: UnknownRecord) => { viewGroup(state, "inventory").query = 42; }, "inventory", "query", ""],
    ["inventory status", (state: UnknownRecord) => { viewGroup(state, "inventory").status = "Sold"; }, "inventory", "status", "All"],
    ["inventory mode", (state: UnknownRecord) => { viewGroup(state, "inventory").mode = "grid"; }, "inventory", "mode", "cards"],
    ["customer status", (state: UnknownRecord) => { viewGroup(state, "customers").status = "VIP"; }, "customers", "status", "All"],
    ["customer tab", (state: UnknownRecord) => { viewGroup(state, "customers").tab = "unknown"; }, "customers", "tab", "overview"],
    ["sales status", (state: UnknownRecord) => { viewGroup(state, "sales").status = "Lost"; }, "sales", "status", "All"],
    ["sales sort", (state: UnknownRecord) => { viewGroup(state, "sales").sort = "customer"; }, "sales", "sort", "date"],
    ["service filter", (state: UnknownRecord) => { viewGroup(state, "service").filter = "Cancelled"; }, "service", "filter", "All"],
    ["service view", (state: UnknownRecord) => { viewGroup(state, "service").view = "Timeline"; }, "service", "view", "Board"],
    ["customer query", (state: UnknownRecord) => { viewGroup(state, "customers").query = null; }, "customers", "query", ""],
    ["sales query", (state: UnknownRecord) => { viewGroup(state, "sales").query = []; }, "sales", "query", ""],
    ["service query", (state: UnknownRecord) => { viewGroup(state, "service").query = {}; }, "service", "query", ""],
  ] as const)("defaults an invalid %s while preserving the compatible state", (_label, corrupt, group, field, expected) => {
    const state = stateRecord();
    corrupt(state);

    const migrated = migrateDemoState(state)!;

    expect((migrated.preferences.viewPreferences[group] as Record<string, unknown>)[field]).toBe(expected);
    expect(migrated.vehicles).toHaveLength(30);
  });

  it.each([
    ["unknown page", { activePage: "reports", activeSubview: "overview" }],
    ["unknown subview", { activePage: "sales", activeSubview: "missing" }],
    ["dangling record", { activePage: "sales", activeSubview: "deals", activeRecordType: "deal", activeRecordId: "deal-404" }],
    ["mismatched record type", { activePage: "inventory", activeSubview: "vehicle-01", activeRecordType: "deal", activeRecordId: "deal-01" }],
    ["orphan context", { activePage: "sales", activeSubview: "sales-log", activeContextId: "vehicle-01" }],
    ["mismatched task context", { activePage: "operations", activeSubview: "tasks", activeRecordType: "task", activeRecordId: "task-01", activeContextId: "vehicle-99" }],
  ])("repairs %s route metadata to the safe My Day route", (_label, route) => {
    const state = stateRecord();
    Object.assign(preferences(state), route);

    expect(migrateDemoState(state)?.preferences).toMatchObject({ activePage: "my-day", activeSubview: "overview" });
    expect(migrateDemoState(state)?.preferences).not.toHaveProperty("activeRecordType");
    expect(migrateDemoState(state)?.preferences).not.toHaveProperty("activeRecordId");
    expect(migrateDemoState(state)?.preferences).not.toHaveProperty("activeContextId");
  });

  it("retains a valid exact record route and rewrites the migrated payload", () => {
    const storage = memoryStorage();
    const state = stateRecord();
    delete viewGroup(state, "customers").tab;
    Object.assign(preferences(state), { activePage: "sales", activeSubview: "deals", activeRecordType: "deal", activeRecordId: "deal-02" });
    storage.setItem(STORAGE_KEY, JSON.stringify(state));

    expect(loadDemoState(storage).preferences).toMatchObject({ activePage: "sales", activeRecordId: "deal-02", viewPreferences: { customers: { tab: "overview" } } });
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).preferences.viewPreferences.customers.tab).toBe("overview");
  });

  it("retains a valid finance draft vehicle context", () => {
    const state = stateRecord();
    Object.assign(preferences(state), { activePage: "finance", activeSubview: "deal-finance", activeContextId: "vehicle-09" });

    expect(migrateDemoState(state)?.preferences).toMatchObject({ activePage: "finance", activeSubview: "deal-finance", activeContextId: "vehicle-09" });
  });
});
