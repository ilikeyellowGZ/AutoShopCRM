import { describe, expect, it } from "vitest";
import { createSeedState } from "./seed";

describe("inventory seed", () => {
  it("provides 30 distinct vehicles with eight complete gallery entries each", () => {
    const vehicles = createSeedState().vehicles;
    const images = vehicles.flatMap((vehicle) => vehicle.gallery.images);

    expect(vehicles).toHaveLength(30);
    expect(images).toHaveLength(240);
    expect(new Set(vehicles.map((vehicle) => vehicle.id)).size).toBe(30);
    expect(new Set(vehicles.map((vehicle) => vehicle.stockId)).size).toBe(30);
    expect(new Set(vehicles.map((vehicle) => vehicle.vin)).size).toBe(30);
    expect(vehicles.every((vehicle) => /^[A-HJ-NPR-Z0-9]{17}$/u.test(vehicle.vin))).toBe(true);
    expect(new Set(images.map((image) => image.src)).size).toBe(240);

    for (const vehicle of vehicles) {
      expect(vehicle.gallery.images).toHaveLength(8);
      expect(vehicle.gallery.images.some((image) => image.id === vehicle.gallery.coverImageId)).toBe(true);
    }
  });

  it("represents varied South African dealership inventory", () => {
    const vehicles = createSeedState().vehicles;

    expect(new Set(vehicles.map((vehicle) => vehicle.make)).size).toBeGreaterThanOrEqual(14);
    expect(new Set(vehicles.map((vehicle) => vehicle.bodyType)).size).toBeGreaterThanOrEqual(6);
    expect(new Set(vehicles.map((vehicle) => vehicle.fuel)).size).toBeGreaterThanOrEqual(4);
    expect(new Set(vehicles.map((vehicle) => vehicle.transmission)).size).toBeGreaterThanOrEqual(3);
    expect([...new Set(vehicles.map((vehicle) => vehicle.branch))].sort()).toEqual(["Johannesburg North", "Midrand", "Pretoria", "Sandton"]);
    expect(new Set(vehicles.map((vehicle) => vehicle.status)).size).toBeGreaterThanOrEqual(6);
    expect(Math.min(...vehicles.map((vehicle) => vehicle.daysInStock))).toBeLessThanOrEqual(5);
    expect(Math.max(...vehicles.map((vehicle) => vehicle.daysInStock))).toBeGreaterThanOrEqual(75);
  });
});
