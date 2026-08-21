import { describe, expect, it } from "vitest";
import { createSeedState } from "../repository/seed";
import { getDemoAccount } from "./access";
import { scopeStateForAccount } from "./stateScope";

describe("role and branch record scope", () => {
  it("limits a stock controller to connected records in the selected allowed branch", () => {
    const state = createSeedState();
    state.preferences.branch = "Pretoria";

    const scoped = scopeStateForAccount(state, getDemoAccount("stock"));

    expect(scoped.vehicles.length).toBeGreaterThan(0);
    expect(scoped.vehicles.length).toBeLessThan(30);
    expect(scoped.vehicles.every((vehicle) => vehicle.branch === "Pretoria")).toBe(true);
    expect(scoped.leads.every((lead) => scoped.vehicles.some((vehicle) => vehicle.id === lead.vehicleId))).toBe(true);
    expect(scoped.deals.every((deal) => scoped.vehicles.some((vehicle) => vehicle.id === deal.vehicleId))).toBe(true);
    expect(scoped.tasks.every((task) => task.relatedType === "vehicle" || task.relatedType === "service")).toBe(true);
    expect(scoped.activities).toEqual([]);
  });

  it("changes visible records when a multi-branch employee switches branch", () => {
    const state = createSeedState();
    const account = getDemoAccount("stock");
    state.preferences.branch = "Pretoria";
    const pretoriaIds = scopeStateForAccount(state, account).vehicles.map((vehicle) => vehicle.id);
    state.preferences.branch = "Midrand";
    const midrandIds = scopeStateForAccount(state, account).vehicles.map((vehicle) => vehicle.id);

    expect(pretoriaIds.length).toBeGreaterThan(0);
    expect(midrandIds.length).toBeGreaterThan(0);
    expect(midrandIds).not.toEqual(pretoriaIds);
  });

  it("keeps group-wide accounts on the complete connected dataset", () => {
    const scoped = scopeStateForAccount(createSeedState(), getDemoAccount("owner"));

    expect(scoped.vehicles).toHaveLength(30);
    expect(scoped.activities.length).toBeGreaterThan(0);
  });

  it("limits an individual sales account to its own same-branch records and tasks", () => {
    const state = createSeedState();
    const account = getDemoAccount("sales");
    state.preferences.branch = account.homeBranch;

    const scoped = scopeStateForAccount(state, account);

    expect(scoped.leads.length).toBeGreaterThan(0);
    expect(scoped.leads.every((lead) => lead.owner === account.recordAssignee)).toBe(true);
    expect(scoped.deals.every((deal) => deal.salesRep === account.recordAssignee)).toBe(true);
    expect(scoped.leads.some((lead) => lead.owner === "Marcus Botha")).toBe(false);
    expect(scoped.tasks.every((task) => {
      if (task.relatedType === "lead") return scoped.leads.some((lead) => lead.id === task.relatedId);
      if (task.relatedType === "deal") return scoped.deals.some((deal) => deal.id === task.relatedId);
      return false;
    })).toBe(true);
  });

  it("shows only the signed-in account and branch vehicle-intake draft", () => {
    const state = createSeedState();
    state.drafts.vehicleIntakes = {
      "owner:Johannesburg North": { step: 2, values: { vin: "1HGCM82633A004352", stockId: "OWNER-DRAFT" } },
      "stock:Pretoria": { step: 1, values: { vin: "1M8GDM9AXKP042788", stockId: "STOCK-DRAFT" } },
    };

    expect(scopeStateForAccount(state, getDemoAccount("owner")).drafts.vehicleIntake?.values.stockId).toBe("OWNER-DRAFT");
    expect(scopeStateForAccount(state, getDemoAccount("stock")).drafts.vehicleIntake?.values.stockId).toBe("STOCK-DRAFT");
    state.preferences.branch = "Midrand";
    expect(scopeStateForAccount(state, getDemoAccount("stock")).drafts.vehicleIntake).toBeNull();
  });

  it("limits a general employee to personally assigned service work", () => {
    const state = createSeedState();
    const account = getDemoAccount("employee");
    state.preferences.branch = account.homeBranch;

    const scoped = scopeStateForAccount(state, account);

    expect(scoped.serviceJobs.length).toBeGreaterThan(0);
    expect(scoped.serviceJobs.every((job) => job.advisor === account.recordAssignee || job.technician === account.recordAssignee)).toBe(true);
    expect(scoped.tasks.every((task) => task.relatedType === "service" && scoped.serviceJobs.some((job) => job.id === task.relatedId))).toBe(true);
    expect(scoped.customers.every((customer) => scoped.serviceJobs.some((job) => job.customerId === customer.id))).toBe(true);
  });
});
