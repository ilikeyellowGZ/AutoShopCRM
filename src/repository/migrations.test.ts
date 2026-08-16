import { describe, expect, it } from "vitest";
import { createSeedState } from "./seed";
import { migrateDemoState } from "./migrations";
import { loadDemoState, STORAGE_KEY } from "./storage";
import { memoryStorage } from "../test/memoryStorage";

const defaults = createSeedState().preferences;

describe("preference migrations", () => {
  it("fills every nested default when view preferences are missing", () => {
    const state = createSeedState() as unknown as Record<string, any>;
    delete state.preferences.viewPreferences;

    expect(migrateDemoState(state)?.preferences.viewPreferences).toEqual(defaults.viewPreferences);
  });

  it("deep-merges a partial view preference payload without discarding valid values", () => {
    const state = createSeedState() as unknown as Record<string, any>;
    state.preferences.viewPreferences = { inventory: { query: "GT3" }, service: { view: "List" } };

    expect(migrateDemoState(state)?.preferences.viewPreferences).toEqual({
      ...defaults.viewPreferences,
      inventory: { ...defaults.viewPreferences.inventory, query: "GT3" },
      service: { ...defaults.viewPreferences.service, view: "List" },
    });
  });

  it.each([
    ["inventory query", (state: Record<string, any>) => { state.preferences.viewPreferences.inventory.query = 42; }, "inventory", "query", ""],
    ["inventory status", (state: Record<string, any>) => { state.preferences.viewPreferences.inventory.status = "Sold"; }, "inventory", "status", "All"],
    ["inventory mode", (state: Record<string, any>) => { state.preferences.viewPreferences.inventory.mode = "grid"; }, "inventory", "mode", "cards"],
    ["customer status", (state: Record<string, any>) => { state.preferences.viewPreferences.customers.status = "VIP"; }, "customers", "status", "All"],
    ["customer tab", (state: Record<string, any>) => { state.preferences.viewPreferences.customers.tab = "unknown"; }, "customers", "tab", "overview"],
    ["sales status", (state: Record<string, any>) => { state.preferences.viewPreferences.sales.status = "Lost"; }, "sales", "status", "All"],
    ["sales sort", (state: Record<string, any>) => { state.preferences.viewPreferences.sales.sort = "customer"; }, "sales", "sort", "date"],
    ["service filter", (state: Record<string, any>) => { state.preferences.viewPreferences.service.filter = "Cancelled"; }, "service", "filter", "All"],
    ["service view", (state: Record<string, any>) => { state.preferences.viewPreferences.service.view = "Timeline"; }, "service", "view", "Board"],
    ["customer query", (state: Record<string, any>) => { state.preferences.viewPreferences.customers.query = null; }, "customers", "query", ""],
    ["sales query", (state: Record<string, any>) => { state.preferences.viewPreferences.sales.query = []; }, "sales", "query", ""],
    ["service query", (state: Record<string, any>) => { state.preferences.viewPreferences.service.query = {}; }, "service", "query", ""],
  ] as const)("defaults an invalid %s while preserving the compatible state", (_label, corrupt, group, field, expected) => {
    const state = createSeedState() as unknown as Record<string, any>;
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
    const state = createSeedState() as unknown as Record<string, any>;
    Object.assign(state.preferences, route);

    expect(migrateDemoState(state)?.preferences).toMatchObject({ activePage: "my-day", activeSubview: "overview" });
    expect(migrateDemoState(state)?.preferences).not.toHaveProperty("activeRecordType");
    expect(migrateDemoState(state)?.preferences).not.toHaveProperty("activeRecordId");
    expect(migrateDemoState(state)?.preferences).not.toHaveProperty("activeContextId");
  });

  it("retains a valid exact record route and rewrites the migrated payload", () => {
    const storage = memoryStorage();
    const state = createSeedState() as unknown as Record<string, any>;
    delete state.preferences.viewPreferences.customers.tab;
    Object.assign(state.preferences, { activePage: "sales", activeSubview: "deals", activeRecordType: "deal", activeRecordId: "deal-02" });
    storage.setItem(STORAGE_KEY, JSON.stringify(state));

    expect(loadDemoState(storage).preferences).toMatchObject({ activePage: "sales", activeRecordId: "deal-02", viewPreferences: { customers: { tab: "overview" } } });
    expect(JSON.parse(storage.getItem(STORAGE_KEY)!).preferences.viewPreferences.customers.tab).toBe("overview");
  });
});
