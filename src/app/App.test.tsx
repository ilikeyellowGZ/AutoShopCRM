import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createDemoRepository } from "../repository/demoRepository";
import { memoryStorage } from "../test/memoryStorage";
import { App } from "./App";
import { navigationGroups, primaryNavigation } from "./routes";

describe("App", () => {
  afterEach(cleanup);

  it("navigates to inventory and restores the page from persisted preferences", async () => {
    const storage = memoryStorage();
    const repository = createDemoRepository(storage);
    const user = userEvent.setup();
    const { unmount } = render(<App repository={repository} />);

    await user.click(screen.getByRole("button", { name: "Inventory" }));
    expect(screen.getByRole("heading", { name: "Vehicle inventory" })).toBeInTheDocument();

    unmount();
    render(<App repository={createDemoRepository(storage)} />);
    expect(screen.getByRole("heading", { name: "Vehicle inventory" })).toBeInTheDocument();
  });

  it("resolves every primary and grouped employee destination", async () => {
    const repository = createDemoRepository(memoryStorage());
    const user = userEvent.setup();
    render(<App repository={repository} />);

    for (const destination of primaryNavigation) {
      await user.click(screen.getByRole("button", { name: destination.label }));
      expect(repository.getState().preferences).toMatchObject({ activePage: destination.target.page, activeSubview: destination.target.subview });
    }

    for (const group of navigationGroups) {
      for (const destination of group.destinations) {
        await user.click(screen.getByRole("button", { name: "More" }));
        const menu = screen.getByRole("navigation", { name: "Employee destinations" });
        const groupSection = within(menu).getByRole("heading", { name: group.label }).parentElement!;
        await user.click(within(groupSection).getByRole("button", { name: destination.label }));
        expect(repository.getState().preferences).toMatchObject({ activePage: destination.target.page, activeSubview: destination.target.subview });
      }
    }
  }, 15_000);
});
