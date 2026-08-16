import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { createDemoRepository } from "../../repository/demoRepository";
import { memoryStorage } from "../../test/memoryStorage";
import { VehicleIntake } from "./VehicleIntake";

it("completes four-step intake, persists the vehicle, gallery paths, and audit", async () => {
  const user = userEvent.setup(); const storage = memoryStorage(); const repository = createDemoRepository(storage);
  render(<VehicleIntake state={repository.getState()} repository={repository} />);
  await user.type(screen.getByLabelText("VIN"), "1HGCM82633A004352"); await user.type(screen.getByLabelText("Stock ID"), "WEE-2411"); await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.clear(screen.getByLabelText("Make")); await user.type(screen.getByLabelText("Make"), "Honda"); await user.clear(screen.getByLabelText("Model")); await user.type(screen.getByLabelText("Model"), "Civic"); await user.clear(screen.getByLabelText("Price (ZAR)")); await user.type(screen.getByLabelText("Price (ZAR)"), "1000000"); await user.click(screen.getByRole("button", { name: "Continue" }));
  await user.click(screen.getByRole("button", { name: "Continue" })); expect(screen.getByRole("button", { name: "Add vehicle to inventory" })).toBeEnabled(); await user.click(screen.getByRole("button", { name: "Add vehicle to inventory" }));
  const reloaded = createDemoRepository(storage).getState(); const vehicle = reloaded.vehicles.find((item) => item.stockId === "WEE-2411")!;
  expect(vehicle.gallery.images.map((image) => image.src)).toEqual(["front", "front-left", "left", "rear-left", "rear", "rear-right", "right", "front-right"].map((angle, index) => `/media/vehicles/2024-honda-civic-standard/${String(index + 1).padStart(2, "0")}-${angle}.png`));
  expect(reloaded.activities.find((activity) => activity.action === "Vehicle added")).toMatchObject({ action: "Vehicle added", targetType: "vehicle", targetId: vehicle.id });
});
