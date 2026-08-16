import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { createSeedState } from "../../repository/seed";
import { MediaViewer } from "./MediaViewer";

it("replaces a failed full-screen image with an accessible fallback while preserving navigation", () => {
  const images = createSeedState().vehicles[0].gallery.images;
  const onIndexChange = vi.fn();
  render(<MediaViewer images={images} activeIndex={0} onIndexChange={onIndexChange} onClose={vi.fn()} />);
  fireEvent.error(screen.getByRole("img", { name: images[0].alt }));
  expect(screen.getByRole("img", { name: /unavailable/i })).toBeInTheDocument();
  expect(screen.getByText(/1 of 8/)).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "ArrowRight" });
  expect(onIndexChange).toHaveBeenCalledWith(1);
});
