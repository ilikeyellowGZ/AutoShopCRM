import { describe, expect, it } from "vitest";
import { createSeedState } from "../../repository/seed";
import { searchCommands } from "./commandSearch";

describe("searchCommands", () => {
  it("finds vehicles, customers, deals, and actions with permission-safe labels", () => {
    const state = createSeedState();

    expect(searchCommands(state, "GT3").some((result) => result.type === "vehicle")).toBe(true);
    expect(searchCommands(state, state.customers[0].phone).some((result) => result.type === "customer")).toBe(true);
    expect(searchCommands(state, state.deals[0].id).some((result) => result.type === "deal")).toBe(true);
    expect(searchCommands(state, "Call Amelia").some((result) => result.type === "action")).toBe(true);
  });

  it("ranks exact identifiers before title substring matches and caps results", () => {
    const state = createSeedState();
    state.customers[0] = { ...state.customers[0], name: "vehicle-01 customer" };
    const [exact] = searchCommands(state, "vehicle-01");

    expect(exact).toMatchObject({
      id: "vehicle-01",
      type: "vehicle",
      target: { page: "inventory", subview: "vehicle-01" },
    });
    expect(searchCommands(state, "a")).toHaveLength(8);
  });

  it("keeps seeded matches in deterministic order and returns explicit type, title, and safe detail", () => {
    const state = createSeedState();
    const first = searchCommands(state, "Windhoek").filter((result) => result.type === "customer");
    const action = searchCommands(state, "Call Amelia").find((result) => result.type === "action");

    expect(first.map((result) => result.id).slice(0, 2)).toEqual(["customer-01", "customer-02"]);
    expect(action).toEqual(expect.objectContaining({ type: "action", title: "Call Amelia", detail: "Confirm GT3 test drive" }));
  });

  it("ranks an exact deal identifier ahead of a customer title collision and preserves each result label", () => {
    const state = createSeedState();
    state.customers[0] = { ...state.customers[0], name: "deal-01" };
    const results = searchCommands(state, "deal-01");

    expect(results[0]).toMatchObject({ id: "deal-01", type: "deal", title: "Deal deal-01" });
    expect(searchCommands(state, "GT3")[0]).toMatchObject({ type: "vehicle", title: "2024 Porsche 911 GT3", detail: "WEE-2401 · Available" });
    expect(searchCommands(state, state.customers[1].phone)[0]).toMatchObject({ type: "customer", title: "Jonas Kisting", detail: "Windhoek · Active" });
    expect(searchCommands(state, "Call Amelia")[0]).toMatchObject({ type: "action", title: "Call Amelia", detail: "Confirm GT3 test drive" });
  });

  it("returns no results for an empty or unmatched query", () => {
    const state = createSeedState();

    expect(searchCommands(state, "")).toEqual([]);
    expect(searchCommands(state, "no connected employee record")).toEqual([]);
  });
});
