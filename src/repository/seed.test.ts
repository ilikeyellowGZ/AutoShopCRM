import { describe, expect, it } from "vitest";
import { createSeedState } from "./seed";

describe("createSeedState", () => {
  it("creates ten connected gallery vehicles with eight unique angles each", () => {
    const state = createSeedState();
    expect(state.schemaVersion).toBe(1);
    expect(state.vehicles).toHaveLength(10);
    expect(state.vehicles.every((vehicle) => vehicle.gallery.images.length === 8)).toBe(true);
    expect(new Set(state.vehicles.flatMap((vehicle) => vehicle.gallery.images.map((image) => image.src))).size).toBe(80);
  });

  it("connects every lead, deal, service job, and task to an existing record", () => {
    const state = createSeedState();
    const vehicleIds = new Set(state.vehicles.map((vehicle) => vehicle.id));
    const customerIds = new Set(state.customers.map((customer) => customer.id));
    expect(state.leads.every((lead) => vehicleIds.has(lead.vehicleId) && customerIds.has(lead.customerId))).toBe(true);
    expect(state.deals.every((deal) => vehicleIds.has(deal.vehicleId) && customerIds.has(deal.customerId))).toBe(true);
    expect(state.serviceJobs.every((job) => vehicleIds.has(job.vehicleId) && customerIds.has(job.customerId))).toBe(true);
    expect(state.tasks.every((task) => task.relatedId.length > 0)).toBe(true);
  });
});
