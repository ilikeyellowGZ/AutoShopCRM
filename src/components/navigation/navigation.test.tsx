import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { primaryNavigation } from "../../app/routes";
import { PrimaryNavigation } from "./PrimaryNavigation";

describe("PrimaryNavigation", () => {
  afterEach(cleanup);
  it("opens the employee menu and emits a working grouped destination", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();

    render(<PrimaryNavigation activePage="my-day" onNavigate={onNavigate} />);

    await user.click(screen.getByRole("button", { name: "More" }));
    await user.click(screen.getByRole("button", { name: "Vehicle intake" }));

    expect(onNavigate).toHaveBeenCalledWith({ page: "inventory", subview: "intake" });
  });

  it("emits a working target for every visible primary destination", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<PrimaryNavigation activePage="my-day" onNavigate={onNavigate} />);

    for (const destination of primaryNavigation) {
      await user.click(screen.getByRole("button", { name: destination.label }));
    }

    expect(onNavigate.mock.calls.map(([target]) => target)).toEqual(primaryNavigation.map((destination) => destination.target));
  });

  it("opens the mobile destination sheet, focuses its close control, and returns focus on Escape", async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();
    render(<PrimaryNavigation activePage="my-day" onNavigate={onNavigate} />);

    const trigger = screen.getByRole("button", { name: "Open destinations" });
    await user.click(trigger);

    const close = screen.getByRole("button", { name: "Close destinations" });
    expect(close).toHaveFocus();
    const sheet = screen.getByRole("navigation", { name: "Employee destinations" });
    const primaryDestinations = within(sheet).getByRole("heading", { name: "Primary" }).parentElement!;
    expect(sheet).toBeVisible();
    expect(within(primaryDestinations).getByRole("button", { name: "My Day" })).toBeVisible();
    expect(within(primaryDestinations).getByRole("button", { name: "Service" })).toBeVisible();

    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("navigation", { name: "Employee destinations" })).not.toBeInTheDocument();
  });
});
