import { describe, expect, it } from "vitest";
import { createSeedState } from "../repository/seed";
import { customerContext, dealContext, leadContext, vehicleContext } from "./context";

describe("record context selectors", () => {
  it("connects a customer to leads, vehicles, deals, finance, documents, tasks, and timeline events", () => {
    const state = createSeedState();
    const context = customerContext(state, "customer-01");

    expect(context?.customer.id).toBe("customer-01");
    expect(context?.vehicles.map((vehicle) => vehicle.id)).toContain("vehicle-01");
    expect(context?.leads.map((lead) => lead.id)).toContain("lead-01");
    expect(context?.deals.map((deal) => deal.id)).toContain("deal-01");
    expect(context?.financeDrafts.map((draft) => draft.vehicleId)).toContain("vehicle-01");
    expect(context?.financeApplications.map((application) => application.dealId)).toContain("deal-01");
    expect(context?.documents.map((document) => document.id)).toContain("document-01");
    expect(context?.tasks.map((task) => task.relatedId)).toContain("lead-01");
    expect(context?.timeline.map((event) => event.id)).toEqual(expect.arrayContaining(["lead-01", "deal-01", "finance-application-01", "document-01"]));
  });

  it("builds vehicle context from every connected operational collection", () => {
    const state = createSeedState();
    const context = vehicleContext(state, "vehicle-01");

    expect(context?.vehicle.id).toBe("vehicle-01");
    expect(context?.customers.map((customer) => customer.id)).toContain("customer-01");
    expect(context?.leads.map((lead) => lead.id)).toContain("lead-01");
    expect(context?.deals.map((deal) => deal.id)).toContain("deal-01");
    expect(context?.quotes.map((quote) => quote.vehicleId)).toContain("vehicle-01");
    expect(context?.appointments.map((appointment) => appointment.vehicleId)).toContain("vehicle-01");
    expect(context?.testDrives.map((drive) => drive.vehicleId)).toContain("vehicle-01");
    expect(context?.documents.map((document) => document.vehicleId)).toContain("vehicle-01");
  });

  it("returns null for missing records and keeps lead and deal lookups exact", () => {
    const state = createSeedState();

    expect(customerContext(state, "customer-missing")).toBeNull();
    expect(vehicleContext(state, "vehicle-missing")).toBeNull();
    expect(leadContext(state, "lead-01")?.lead.customerId).toBe("customer-01");
    expect(dealContext(state, "deal-01")?.deal.vehicleId).toBe("vehicle-01");
  });
});
