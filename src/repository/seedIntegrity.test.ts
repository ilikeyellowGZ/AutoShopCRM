import { describe, expect, it } from "vitest";
import { createSeedState } from "./seed";
import { validateDemoState } from "./seedIntegrity";

describe("connected MotorCRM demo seed", () => {
  it("contains the agreed deterministic operating dataset", () => {
    const state = createSeedState();

    expect(state.vehicles).toHaveLength(30);
    expect(state.customers).toHaveLength(48);
    expect(state.leads).toHaveLength(64);
    expect(state.deals).toHaveLength(24);
    expect(state.employees).toHaveLength(15);
    expect(state.serviceJobs).toHaveLength(18);
    expect(state.appointments).toHaveLength(24);
    expect(state.testDrives).toHaveLength(16);
    expect(state.quotes).toHaveLength(24);
    expect(state.payments).toHaveLength(18);
    expect(state.financeApplications).toHaveLength(20);
    expect(state.documents).toHaveLength(30);
    expect(state.tasks).toHaveLength(40);
    expect(state.activities).toHaveLength(40);
    expect(validateDemoState(state)).toEqual([]);
  });

  it("reports duplicate identifiers and broken connected-record references", () => {
    const state = createSeedState();
    state.customers[1].id = state.customers[0].id;
    state.financeDrafts[1].vehicleId = state.financeDrafts[0].vehicleId;
    state.deals[0].customerId = "customer-missing";
    state.financeApplications[0].dealId = "deal-missing";
    state.documents[0].vehicleId = "vehicle-missing";

    expect(validateDemoState(state)).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: "duplicate-id", collection: "customers", recordId: state.customers[0].id }),
      expect.objectContaining({ code: "duplicate-value", collection: "financeDrafts", field: "vehicleId", targetId: state.financeDrafts[0].vehicleId }),
      expect.objectContaining({ code: "dangling-reference", collection: "deals", field: "customerId", targetId: "customer-missing" }),
      expect.objectContaining({ code: "dangling-reference", collection: "financeApplications", field: "dealId", targetId: "deal-missing" }),
      expect.objectContaining({ code: "dangling-reference", collection: "documents", field: "vehicleId", targetId: "vehicle-missing" }),
    ]));
  });
});
