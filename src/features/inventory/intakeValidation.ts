import type { DemoState } from "../../domain/models";

export type VehicleIntakeInput = { vin: string; stockId: string; year: number; make: string; model: string; price: number };
export type VehicleIntakeErrors = Partial<Record<keyof VehicleIntakeInput, string>>;

export function validateVehicleIntake(input: VehicleIntakeInput, state: DemoState): VehicleIntakeErrors {
  const errors: VehicleIntakeErrors = {};
  const vin = input.vin.trim().toUpperCase();
  const stockId = input.stockId.trim().toUpperCase();
  if (!vin) errors.vin = "VIN is required.";
  else if (vin.length !== 17) errors.vin = "VIN must contain exactly 17 characters.";
  else if (state.vehicles.some((vehicle) => vehicle.vin.toUpperCase() === vin)) errors.vin = "VIN already exists in the active Weelee inventory.";
  if (!stockId) errors.stockId = "Stock ID is required.";
  else if (state.vehicles.some((vehicle) => vehicle.stockId.toUpperCase() === stockId)) errors.stockId = "Stock ID already exists in the active Weelee inventory.";
  if (!Number.isInteger(input.year) || input.year < 1980 || input.year > 2026) errors.year = "Year must be between 1980 and 2026.";
  if (!input.make.trim()) errors.make = "Make is required.";
  if (!input.model.trim()) errors.model = "Model is required.";
  if (!Number.isFinite(input.price) || input.price <= 0) errors.price = "Price must be greater than zero.";
  return errors;
}
