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
    const [exact] = searchCommands(state, "vehicle-01");

    expect(exact).toMatchObject({
      id: "vehicle-01",
      type: "vehicle",
      target: { page: "inventory", subview: "vehicle-01" },
    });
    expect(searchCommands(state, "a")).toHaveLength(8);
  });

  it("returns no results for an empty or unmatched query", () => {
    const state = createSeedState();

    expect(searchCommands(state, "")).toEqual([]);
    expect(searchCommands(state, "no connected employee record")).toEqual([]);
  });
});
