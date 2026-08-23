import { expect, it } from "vitest";
import { createSeedState } from "../../repository/seed";
import { validateVehicleIntake } from "./intakeValidation";

const specifications = { bodyType: "Sedan", fuel: "Petrol", transmission: "Automatic", engine: "2.0L turbo", registration: "Unregistered" } as const;

it("returns a specific duplicate VIN error", () => {
  const state = createSeedState();
  expect(validateVehicleIntake({ vin: state.vehicles[0].vin, stockId: "WEE-1000", year: 2024, make: "BMW", model: "M3", price: 1_000_000, ...specifications }, state)).toEqual({ vin: "VIN already exists in the active Weelee inventory." });
});

it("reports the required invalid intake fields", () => {
  expect(validateVehicleIntake({ vin: "", stockId: "", year: 1979, make: "", model: "", price: 0, bodyType: "Unknown", fuel: "Unknown", transmission: "Unknown", engine: "", registration: "" }, createSeedState())).toEqual({
    vin: "VIN is required.", stockId: "Stock ID is required.", year: "Year must be between 1980 and 2026.", make: "Make is required.", model: "Model is required.", price: "Price must be greater than zero.",
    bodyType: "Select a body type.", fuel: "Select a fuel type.", transmission: "Select a transmission.", engine: "Engine is required.", registration: "Registration is required.",
  });
});

it("rejects VIN characters that are invalid in the standard format", () => {
  expect(validateVehicleIntake({ vin: "MCRMDMO0000000011", stockId: "WEE-1000", year: 2024, make: "BMW", model: "M3", price: 1_000_000, ...specifications }, createSeedState()).vin).toBe("VIN may only contain valid letters and numbers (excluding I, O and Q).");
});
