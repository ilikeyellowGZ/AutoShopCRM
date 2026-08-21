import { afterEach, describe, expect, it, vi } from "vitest";
import { createSeedState } from "../repository/seed";
import { selectCustomerDirectory, selectDashboardMetrics, selectFilteredVehicles, selectPipelineColumns } from "./selectors";

describe("demo selectors", () => {
  afterEach(() => vi.restoreAllMocks());

  it("filters inventory by model, VIN, stock ID, and status", () => {
    const state = createSeedState();
    expect(selectFilteredVehicles(state, "GT3", "All")).toHaveLength(1);
    expect(selectFilteredVehicles(state, state.vehicles[1].vin, "All")).toHaveLength(1);
    expect(selectFilteredVehicles(state, state.vehicles[2].stockId, "In Transit")).toHaveLength(1);
  });

  it("matches inventory case-insensitively without changing the source state", () => {
    const state = createSeedState();
    const vehicleIds = state.vehicles.map((vehicle) => vehicle.id);

    expect(selectFilteredVehicles(state, "porsche", "All").map((vehicle) => vehicle.id)).toEqual(["vehicle-01", "vehicle-05"]);
    expect(state.vehicles.map((vehicle) => vehicle.id)).toEqual(vehicleIds);
  });

  it("uses invariant normalization when locale-sensitive lowercasing differs", () => {
    vi.spyOn(String.prototype, "toLocaleLowerCase").mockImplementation(function toLocaleLowerCase(this: string): string {
      return this.toString().includes("Porsche") ? "locale-dependent" : this.toString().toLowerCase();
    });

    expect(selectFilteredVehicles(createSeedState(), "porsche", "All").map((vehicle) => vehicle.id)).toEqual(["vehicle-01", "vehicle-05"]);
  });

  it("returns all four pipeline columns even when one is empty", () => {
    const state = createSeedState();
    state.leads = state.leads.filter((lead) => lead.stage !== "Delivery");

    const columns = selectPipelineColumns(state);

    expect(columns.map((column) => column.stage)).toEqual(["Lead", "Negotiation", "Contract", "Delivery"]);
    expect(columns.find((column) => column.stage === "Delivery")).toMatchObject({ count: 0, value: 0, leads: [] });
  });

  it("recomputes a non-empty stage count and value from changed lead data", () => {
    const state = createSeedState();
    const movedLead = state.leads[0];
    movedLead.stage = "Contract";
    movedLead.value = 5_000_000;

    const columns = selectPipelineColumns(state);

    expect(columns.map((column) => column.stage)).toEqual(["Lead", "Negotiation", "Contract", "Delivery"]);
    expect(columns.find((column) => column.stage === "Contract")).toMatchObject({
      stage: "Contract",
      count: 5,
      value: 16_000_000,
      leads: expect.arrayContaining([expect.objectContaining({ id: "lead-01", value: 5_000_000 })]),
    });
  });

  it("derives dashboard counts and pipeline value from the connected state", () => {
    const metrics = selectDashboardMetrics(createSeedState());

    expect(metrics).toEqual({
      availableVehicles: 15,
      inTransitVehicles: 1,
      activePipelineCount: 16,
      activePipelineValue: 38_970_000,
      dueTodayTasks: 4,
      unreadNotifications: 4,
    });
  });

  it("filters the customer directory across customer details without mutation", () => {
    const state = createSeedState();
    const customerIds = state.customers.map((customer) => customer.id);

    expect(selectCustomerDirectory(state, "WALVIS BAY").map((customer) => customer.name)).toEqual(["Karabo Molefe", "Sofia Mouton"]);
    expect(selectCustomerDirectory(state, "+264 81 410 2101")).toHaveLength(1);
    expect(state.customers.map((customer) => customer.id)).toEqual(customerIds);
  });
});
