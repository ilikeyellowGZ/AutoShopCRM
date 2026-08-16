import { describe, expect, it } from "vitest";
import { createSeedState } from "../../repository/seed";
import { exportSalesCsv } from "./exportSalesCsv";

describe("exportSalesCsv", () => {
  it("exports South African currency-safe sales rows without spreadsheet formulas", () => {
    const state = createSeedState();
    const csv = exportSalesCsv(state.deals, state);

    expect(csv).toContain("Date,Vehicle,VIN,Sales Rep,Gross Profit,Status");
    expect(csv).toContain("2024 Porsche 911 GT3");
    expect(csv.split("\n").some((line) => /^[=+\-@]/.test(line))).toBe(false);
  });

  it("quotes commas, quotes, and newlines while neutralising spreadsheet formula cells", () => {
    const state = createSeedState();
    state.deals[0] = { ...state.deals[0], salesRep: '=SUM(1,1) "quoted"\nnext line' };
    const csv = exportSalesCsv([state.deals[0]], state);

    expect(csv).toContain('"\'=SUM(1,1) ""quoted""\nnext line"');
  });

  it.each(["=SUM(1,1)", "+1+1", "-12", "@cmd", " \t=SUM(2,2)"])("neutralises formula-like cells beginning with %s", (salesRep) => {
    const state = createSeedState(); state.deals[0] = { ...state.deals[0], salesRep };
    expect(exportSalesCsv([state.deals[0]], state)).toContain(`'${salesRep}`);
  });
});
