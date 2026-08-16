import { expect, it } from "vitest";
import { createSeedState } from "../../repository/seed";
import { validateVehicleIntake } from "./intakeValidation";

it("returns a specific duplicate VIN error", () => {
  const state = createSeedState();
  expect(validateVehicleIntake({ vin: state.vehicles[0].vin, stockId: "WEE-1000", year: 2024, make: "BMW", model: "M3", price: 1_000_000 }, state)).toEqual({ vin: "VIN already exists in the active Weelee inventory." });
});

it("reports the required invalid intake fields", () => {
  expect(validateVehicleIntake({ vin: "", stockId: "", year: 1979, make: "", model: "", price: 0 }, createSeedState())).toEqual({
    vin: "VIN is required.", stockId: "Stock ID is required.", year: "Year must be between 1980 and 2026.", make: "Make is required.", model: "Model is required.", price: "Price must be greater than zero.",
  });
});
