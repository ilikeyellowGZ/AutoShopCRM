import { describe, expect, it } from "vitest";
import { CURRENT_SCHEMA_VERSION } from "../domain/models";
import type { TaskItem } from "../domain/models";
import { createSeedState } from "./seed";

const expectedAngles = ["front", "front-left", "left", "rear-left", "rear", "rear-right", "right", "front-right"];
const originalMojibakeSeparator = "\u00e2\u20ac\u201d";

describe("createSeedState", () => {
  it("creates the complete connected demo roster with stable vehicle IDs", () => {
    const state = createSeedState();

    expect(state.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
    expect(state.vehicles.map((vehicle) => vehicle.id)).toEqual(Array.from({ length: 30 }, (_, index) => `vehicle-${String(index + 1).padStart(2, "0")}`));
    expect(state.customers).toHaveLength(48);
    expect(state.leads).toHaveLength(64);
    expect(state.deals).toHaveLength(24);
    expect(state.serviceJobs).toHaveLength(18);
    expect(state.tasks).toHaveLength(40);
    expect(state.notifications).toHaveLength(6);
    expect(state.activities).toHaveLength(40);
  });

  it("creates 30 galleries with the required ordered PNG paths and accessible alt text", () => {
    const state = createSeedState();

    for (const vehicle of state.vehicles) {
      const slug = vehicle.gallery.images[0].src.split("/")[3];
      expect(vehicle.gallery.images.map((image) => image.angle)).toEqual(expectedAngles);
      expect(vehicle.gallery.images.map((image) => image.src)).toEqual(expectedAngles.map((angle, index) => `/media/vehicles/${slug}/${String(index + 1).padStart(2, "0")}-${angle}.png`));
      expect(vehicle.gallery.images.every((image) => image.alt.includes(originalMojibakeSeparator) === false)).toBe(true);
      expect(vehicle.gallery.images.every((image) => image.alt.endsWith(`: ${image.label.toLowerCase()}`))).toBe(true);
    }
    expect(new Set(state.vehicles.flatMap((vehicle) => vehicle.gallery.images.map((image) => image.src))).size).toBe(240);
  });

  it("connects every lead, deal, service job, and typed task reference to an existing record", () => {
    const state = createSeedState();
    const vehicleIds = new Set(state.vehicles.map((vehicle) => vehicle.id));
    const customerIds = new Set(state.customers.map((customer) => customer.id));
    const taskReferenceIds: Record<TaskItem["relatedType"], Set<string>> = {
      lead: new Set(state.leads.map((lead) => lead.id)),
      deal: new Set(state.deals.map((deal) => deal.id)),
      vehicle: vehicleIds,
      service: new Set(state.serviceJobs.map((job) => job.id)),
    };

    expect(state.leads.every((lead) => vehicleIds.has(lead.vehicleId) && customerIds.has(lead.customerId))).toBe(true);
    expect(state.deals.every((deal) => vehicleIds.has(deal.vehicleId) && customerIds.has(deal.customerId))).toBe(true);
    expect(state.serviceJobs.every((job) => vehicleIds.has(job.vehicleId) && customerIds.has(job.customerId))).toBe(true);
    expect(state.tasks.every((task) => taskReferenceIds[task.relatedType].has(task.relatedId))).toBe(true);
  });

  it("returns mutation-isolated state, including nested gallery data", () => {
    const first = createSeedState();
    first.customers[0].name = "Mutated customer";
    first.leads[0].nextAction = "Mutated lead";
    first.vehicles[0].gallery.images[0].alt = "Mutated gallery alt";
    first.activities[0].detail = "Mutated activity";

    const second = createSeedState();
    expect(second.customers).not.toBe(first.customers);
    expect(second.leads).not.toBe(first.leads);
    expect(second.vehicles[0].gallery).not.toBe(first.vehicles[0].gallery);
    expect(second.vehicles[0].gallery.images).not.toBe(first.vehicles[0].gallery.images);
    expect(second.customers[0].name).toBe("Amelia van Wyk");
    expect(second.leads[0].nextAction).toBe("Call customer");
    expect(second.vehicles[0].gallery.images[0].alt).not.toBe("Mutated gallery alt");
    expect(second.activities[0].detail).toBe("Demo activity 1 recorded for the employee workspace.");
  });
});
