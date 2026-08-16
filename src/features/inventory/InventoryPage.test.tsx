import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { createDemoRepository } from "../../repository/demoRepository";
import { memoryStorage } from "../../test/memoryStorage";
import { InventoryPage } from "./InventoryPage";
import { VehicleDetail } from "./VehicleDetail";

it("switches between accessible inventory card and table modes", () => {
  const repository = createDemoRepository(memoryStorage());
  render(<InventoryPage state={repository.getState()} repository={repository} />);
  expect(screen.getByRole("button", { name: "Cards" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(screen.getByRole("button", { name: "Table" }));
  expect(screen.getByRole("button", { name: "Table" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("table", { name: /inventory vehicles/i })).toBeInTheDocument();
});

it("renders exact linked detail artifacts and an empty document state when links are removed", () => {
  const repository = createDemoRepository(memoryStorage());
  const state = repository.getState(); const vehicle = state.vehicles[1];
  const { rerender } = render(<VehicleDetail vehicle={vehicle} state={state} repository={repository} onBack={() => {}} />);
  expect(screen.getByText(/Finance worksheet/)).toBeInTheDocument();
  const empty = { ...state, financeDrafts: [], serviceJobs: [], deals: [], activities: [], tasks: [], vehicles: state.vehicles.map((item) => item.id === vehicle.id ? { ...item, gallery: { ...item.gallery, images: [] } } : item) };
  rerender(<VehicleDetail vehicle={empty.vehicles[1]} state={empty} repository={repository} onBack={() => {}} />);
  expect(screen.getByText("No linked documents.")).toBeInTheDocument();
});
