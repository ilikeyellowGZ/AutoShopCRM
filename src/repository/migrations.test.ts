import { describe, expect, it } from "vitest";
import { createSeedState } from "./seed";
import { migrateDemoState } from "./migrations";
import { loadDemoState, STORAGE_KEY } from "./storage";
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
    expect(migrated.vehicles).toHaveLength(10);
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
