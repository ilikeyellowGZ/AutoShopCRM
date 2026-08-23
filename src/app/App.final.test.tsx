import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDemoRepository } from "../repository/demoRepository";
import { memoryStorage } from "../test/memoryStorage";
import { App } from "./App";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); Reflect.deleteProperty(document, "startViewTransition"); });

describe("Inventory route ownership", () => {
  it("keeps one InventoryPage mount across list, detail, Back, and command detail navigation", async () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const user = userEvent.setup();
    const rendered = render(<App repository={repository} />); await user.click(screen.getByRole("button", { name: "Inventory" }));
    const mount = screen.getByTestId("inventory-route"); const identity = mount.getAttribute("data-mount-identity");
    await user.type(screen.getByLabelText("Search inventory"), "BMW"); await user.click(screen.getByRole("button", { name: /2023 BMW M4/i }));
    expect(screen.getByTestId("inventory-route")).toHaveAttribute("data-mount-identity", identity); expect(screen.getByRole("heading", { name: /2023 BMW M4 CSL/ })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to inventory" })); expect(screen.getByTestId("inventory-route")).toHaveAttribute("data-mount-identity", identity); expect(screen.getByLabelText("Search inventory")).toHaveValue("BMW");
    await user.click(screen.getByRole("button", { name: /Search. Press/ })); await user.type(screen.getByRole("combobox", { name: "Search employee records" }), "vehicle-10"); await user.click(within(screen.getByRole("listbox", { name: "Search results" })).getByRole("option"));
    expect(screen.getByTestId("inventory-route")).toHaveAttribute("data-mount-identity", identity); expect(screen.getByRole("heading", { name: "2024 BMW X5 M Competition" })).toBeInTheDocument();
    rendered.unmount(); render(<App repository={createDemoRepository(storage)} />); expect(screen.getByTestId("inventory-route")).toBeInTheDocument(); expect(screen.getByRole("heading", { name: "2024 BMW X5 M Competition" })).toBeInTheDocument();
  }, 10_000);
});

describe("exact Open actions on composed primary and command views", () => {
  it("opens the Action Centre task's exact related lead", async () => {
    const user = userEvent.setup(); render(<App repository={createDemoRepository(memoryStorage())} />); await user.click(screen.getByRole("button", { name: /Action Centre \d+/ }));
    const row = screen.getByText("Call Amelia").closest("li")!; await user.click(within(row).getByRole("button", { name: "Open related record" })); expect(screen.getByRole("heading", { name: "Lead lead-01" })).toBeInTheDocument();
  });

  it("opens a notification's exact linked deal when the related id is typed", async () => {
    const user = userEvent.setup(); render(<App repository={createDemoRepository(memoryStorage())} />); await user.click(screen.getByRole("button", { name: /Notifications 4/ }));
    const row = screen.getByText("M4 CSL reserved").closest("li")!; await user.click(within(row).getByRole("button", { name: "Open related record" })); expect(screen.getByRole("heading", { name: "Deal deal-02" })).toBeInTheDocument();
  });

  it.each([
    ["Pipeline", "Amelia van Wyk", "Open lead record", "Lead lead-01"],
    ["Sales", "2024 Porsche 911", "Open deal deal-01", "Deal deal-01"],
    ["Service", "2024 Land Rover Defender", "Open service job service-01", "Service job service-01"],
  ])("opens exact records from the primary %s view", async (navigation, rowText, action, heading) => {
    const user = userEvent.setup(); render(<App repository={createDemoRepository(memoryStorage())} />); await user.click(screen.getByRole("button", { name: navigation }));
    const row = screen.getAllByText(rowText, { exact: false })[0].closest<HTMLElement>("article, tr")!; await user.click(within(row).getByRole("button", { name: action })); expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });
});

describe("passive preference persistence", () => {
  it("persists every keystroke and navigation without adding audit artifacts", async () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const before = repository.getState().activities.length; const user = userEvent.setup();
    render(<App repository={repository} />); await user.click(screen.getByRole("button", { name: "Inventory" })); await user.type(screen.getByLabelText("Search inventory"), "BMW"); await user.selectOptions(screen.getByLabelText("Status"), "Reserved"); await user.click(screen.getByRole("button", { name: "Table" })); await user.click(screen.getByRole("button", { name: "Customers" }));
    expect(repository.getState().activities).toHaveLength(before); expect(createDemoRepository(storage).getState().preferences.viewPreferences.inventory).toEqual({ query: "BMW", status: "Reserved", mode: "table" });
    repository.setPreferences({ activePage: "operations", activeSubview: "documents" });
    expect(repository.getState().activities.some((activity) => activity.action === "Preferences updated")).toBe(false);
  });

  it("keeps the reset audit latest after passive navigation", async () => {
    const repository = createDemoRepository(memoryStorage()); repository.reset(); repository.setPreferences({ activePage: "my-day", activeSubview: "overview" });
    expect(repository.getState().activities[0].action).toBe("Demo data reset");
  });
});

describe("reduced motion", () => {
  it("suppresses startViewTransition while still applying navigation", async () => {
    const transition = vi.fn(); (document as unknown as { startViewTransition: typeof transition }).startViewTransition = transition;
    vi.stubGlobal("matchMedia", vi.fn().mockReturnValue({ matches: true, media: "(prefers-reduced-motion: reduce)", onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() }));
    const user = userEvent.setup(); render(<App repository={createDemoRepository(memoryStorage())} />); await user.click(screen.getByRole("button", { name: "Inventory" }));
    expect(transition).not.toHaveBeenCalled(); expect(screen.getByRole("heading", { name: "Vehicle inventory" })).toBeInTheDocument();
  });
});
