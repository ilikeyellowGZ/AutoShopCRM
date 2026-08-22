import { describe, expect, it } from "vitest";
import { createSeedState } from "../repository/seed";
import { insightsForCustomer, insightsForVehicle } from "./intelligence";

describe("deterministic CRM intelligence", () => {
  it("flags stale customer follow-ups with evidence instead of invented claims", () => {
    const state = createSeedState();
    state.leads[0] = { ...state.leads[0], dueAt: "2026-08-10T09:00:00+02:00", stage: "Lead" };

    const insights = insightsForCustomer(state, "customer-01", "2026-08-22T08:00:00+02:00");

    expect(insights).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "stale-lead-lead-01",
        severity: "warning",
        title: "Follow-up is overdue",
        evidence: expect.arrayContaining(["lead-01"]),
      }),
    ]));
  });

  it("flags aged stock and missing documents for a vehicle with transparent evidence", () => {
    const state = createSeedState();
    state.vehicles[0] = { ...state.vehicles[0], daysInStock: 75 };
    state.documents = state.documents.filter((document) => document.vehicleId !== "vehicle-01");

    const insights = insightsForVehicle(state, "vehicle-01");

    expect(insights.map((insight) => insight.id)).toEqual(expect.arrayContaining(["aged-stock-vehicle-01", "missing-documents-vehicle-01"]));
    expect(insights.find((insight) => insight.id === "aged-stock-vehicle-01")?.evidence).toEqual(["vehicle-01"]);
    expect(insights.find((insight) => insight.id === "missing-documents-vehicle-01")?.evidence).toEqual(["deal-01"]);
  });
});
