import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { createDemoRepository } from "../../repository/demoRepository";
import { memoryStorage } from "../../test/memoryStorage";
import { VehicleIntake } from "./VehicleIntake";

it("completes four-step intake, persists the vehicle, gallery paths, and audit", async () => {
  const user = userEvent.setup(); const storage = memoryStorage(); const repository = createDemoRepository(storage);
  render(<VehicleIntake state={repository.getState()} repository={repository} />);
  fireEvent.change(screen.getByLabelText("VIN"), { target: { value: "1HGCM82633A004352" } }); fireEvent.change(screen.getByLabelText("Stock ID"), { target: { value: "WEE-2411" } }); await user.click(screen.getByRole("button", { name: "Continue" }));
  fireEvent.change(screen.getByLabelText("Make"), { target: { value: "Honda" } }); fireEvent.change(screen.getByLabelText("Model"), { target: { value: "Civic" } }); fireEvent.change(screen.getByLabelText("Price (ZAR)"), { target: { value: "1000000" } });
  fireEvent.change(screen.getByLabelText("Body type"), { target: { value: "Hatchback" } });
  fireEvent.change(screen.getByLabelText("Fuel"), { target: { value: "Hybrid" } });
  fireEvent.change(screen.getByLabelText("Transmission"), { target: { value: "e-CVT" } });
  fireEvent.change(screen.getByLabelText("Engine"), { target: { value: "2.0L hybrid" } });
  await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Continue" })); expect(screen.getByRole("button", { name: "Add vehicle to inventory" })).toBeEnabled(); await user.click(screen.getByRole("button", { name: "Add vehicle to inventory" }));
  const reloaded = createDemoRepository(storage).getState(); const vehicle = reloaded.vehicles.find((item) => item.stockId === "WEE-2411")!;
  expect(vehicle).toMatchObject({ bodyType: "Hatchback", fuel: "Hybrid", transmission: "e-CVT", engine: "2.0L hybrid", branch: "Johannesburg North" });
  expect(vehicle.gallery.images.map((image) => image.src)).toEqual(["front", "front-left", "left", "rear-left", "rear", "rear-right", "right", "front-right"].map((angle, index) => `/media/vehicles/2024-honda-civic-standard/${String(index + 1).padStart(2, "0")}-${angle}.png`));
  expect(reloaded.activities.find((activity) => activity.action === "Vehicle added")).toMatchObject({ action: "Vehicle added", targetType: "vehicle", targetId: vehicle.id });
}, 10_000);
