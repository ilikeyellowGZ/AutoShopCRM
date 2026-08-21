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

  it.each(primaryNavigation)("resolves the $label primary destination", async (destination) => {
    const repository = createDemoRepository(memoryStorage());
    const user = userEvent.setup();
    render(<App repository={repository} />);

    await user.click(screen.getByRole("button", { name: destination.label }));
    expect(repository.getState().preferences).toMatchObject({ activePage: destination.target.page, activeSubview: destination.target.subview });
  });

  it.each(navigationGroups.flatMap((group) => group.destinations.map((destination) => ({ group, destination }))))("resolves the $group.label / $destination.label employee destination", async ({ group, destination }) => {
    const repository = createDemoRepository(memoryStorage());
    const user = userEvent.setup();
    render(<App repository={repository} />);

    await user.click(screen.getByRole("button", { name: "More" }));
    const menu = screen.getByRole("navigation", { name: "Employee destinations" });
    const groupSection = within(menu).getByRole("heading", { name: group.label }).parentElement!;
    await user.click(within(groupSection).getByRole("button", { name: destination.label }));
    expect(repository.getState().preferences).toMatchObject({ activePage: destination.target.page, activeSubview: destination.target.subview });
  });

  it("opens a chosen inventory record and returns to the list without remounting", async () => {
    const user = userEvent.setup();
    render(<App repository={createDemoRepository(memoryStorage())} />);
    await user.click(screen.getByRole("button", { name: "Inventory" }));
    await user.click(screen.getByRole("button", { name: /2024 Porsche 911/i }));
    expect(screen.getByRole("heading", { name: /2024 Porsche 911 GT3/i })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to inventory" }));
    expect(screen.getByRole("heading", { name: "Vehicle inventory" })).toBeInTheDocument();
  });

  it("opens an exact deal command record", async () => {
    const user = userEvent.setup();
    render(<App repository={createDemoRepository(memoryStorage())} />);
    await user.click(screen.getByRole("button", { name: /Search. Press/i }));
    await user.type(screen.getByRole("combobox", { name: "Search employee records" }), "deal-01");
    await user.click(screen.getByRole("option", { name: /Deal deal-01/i }));
    expect(screen.getByRole("heading", { name: "Deal deal-01" })).toBeInTheDocument();
  });

  it("persists inventory filter and table view across repository reload", async () => {
    const storage = memoryStorage(); const user = userEvent.setup(); const first = createDemoRepository(storage);
    const { unmount } = render(<App repository={first} />);
    await user.click(screen.getByRole("button", { name: "Inventory" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Status" }), "Reserved");
    await user.click(screen.getByRole("button", { name: "Table" }));
    unmount(); render(<App repository={createDemoRepository(storage)} />);
    expect(screen.getByRole("combobox", { name: "Status" })).toHaveValue("Reserved");
    expect(screen.getByRole("button", { name: "Table" })).toHaveAttribute("aria-pressed", "true");
  });

  it("restores persisted exact record navigation metadata", () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage);
    repository.setPreferences({ activePage: "sales", activeSubview: "deals", activeRecordType: "deal", activeRecordId: "deal-02" });
    render(<App repository={createDemoRepository(storage)} />);
    expect(screen.getByRole("heading", { name: "Deal deal-02" })).toBeInTheDocument();
  });
});
