import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { createSeedState } from "../../repository/seed";
import { VehicleGallery } from "./VehicleGallery";

it("moves through all eight images with arrow keys after the gallery receives focus", async () => {
  const user = userEvent.setup();
  render(<VehicleGallery vehicle={createSeedState().vehicles[0]} />);

  const gallery = screen.getByRole("region", { name: /vehicle gallery/i });
  gallery.focus();
  expect(screen.getByText("Image 1 of 8")).toBeInTheDocument();

  for (let index = 1; index < 8; index += 1) await user.keyboard("{ArrowRight}");

  expect(screen.getByText("Image 8 of 8")).toBeInTheDocument();
});

it("does not hijack arrow keys before the gallery receives focus", async () => {
  const user = userEvent.setup();
  render(<><button type="button">Outside gallery</button><VehicleGallery vehicle={createSeedState().vehicles[0]} /></>);

  await user.click(screen.getByRole("button", { name: "Outside gallery" }));
  await user.keyboard("{ArrowRight}");

  expect(screen.getByText("Image 1 of 8")).toBeInTheDocument();
});
