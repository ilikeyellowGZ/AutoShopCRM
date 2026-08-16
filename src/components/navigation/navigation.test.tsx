import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PrimaryNavigation } from "./PrimaryNavigation";

describe("PrimaryNavigation", () => {
  it("opens the employee menu and emits a working grouped destination", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();

    render(<PrimaryNavigation activePage="my-day" onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("menuitem", { name: "Vehicle intake" }));

    expect(onNavigate).toHaveBeenCalledWith({ page: "inventory", subview: "intake" });
  });
});
