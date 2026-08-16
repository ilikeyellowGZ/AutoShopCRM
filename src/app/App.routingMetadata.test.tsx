import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createDemoRepository } from "../repository/demoRepository";
import { memoryStorage } from "../test/memoryStorage";
import { App } from "./App";

afterEach(cleanup);

describe("route metadata clearing across reload", () => {
  it.each([
    [{ activePage: "customers", activeSubview: "leads", activeRecordType: "lead", activeRecordId: "lead-01" }, "Customers", "Customers"],
    [{ activePage: "sales", activeSubview: "deals", activeRecordType: "deal", activeRecordId: "deal-01" }, "Sales", "Sales log"],
    [{ activePage: "service", activeSubview: "service-board", activeRecordType: "service", activeRecordId: "service-01" }, "Service", "Service board"],
    [{ activePage: "operations", activeSubview: "tasks", activeRecordType: "task", activeRecordId: "task-01" }, "My Day", "Good morning, Anele."],
  ] as const)("clears an exact route when navigating to primary %s", async (exact, navigation, heading) => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const user = userEvent.setup();
    repository.setPreferences(exact); render(<App repository={repository} />);

    await user.click(screen.getByRole("button", { name: navigation }));
    cleanup(); const reloaded = createDemoRepository(storage); render(<App repository={reloaded} />);

    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    expect(reloaded.getState().preferences).not.toHaveProperty("activeRecordType");
    expect(reloaded.getState().preferences).not.toHaveProperty("activeRecordId");
    expect(reloaded.getState().preferences).not.toHaveProperty("activeContextId");
  });

  it("replaces vehicle deal context with the exact created deal across reload", async () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const user = userEvent.setup();
    repository.setPreferences({ activePage: "inventory", activeSubview: "vehicle-09", activeRecordType: "vehicle", activeRecordId: "vehicle-09" });
    render(<App repository={repository} />); await user.click(screen.getByRole("button", { name: "Create deal" }));
    expect(screen.getByRole("combobox", { name: "Vehicle" })).toHaveValue("vehicle-09");
    await user.clear(screen.getByLabelText("Gross profit (ZAR)")); await user.type(screen.getByLabelText("Gross profit (ZAR)"), "125000"); await user.click(screen.getByRole("button", { name: "Save deal" }));
    expect(screen.getByRole("heading", { name: "Deal deal-09" })).toBeInTheDocument();

    cleanup(); const reloaded = createDemoRepository(storage); render(<App repository={reloaded} />);
    expect(screen.getByRole("heading", { name: "Deal deal-09" })).toBeInTheDocument();
    expect(reloaded.getState().preferences).toMatchObject({ activeRecordType: "deal", activeRecordId: "deal-09" });
    expect(reloaded.getState().preferences).not.toHaveProperty("activeContextId");
  });

  it("clears an unassigned finance context when navigating to an ordinary route", async () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const user = userEvent.setup();
    repository.updateFinanceDraft("vehicle-09", { aprPercent: 10 }); repository.setPreferences({ activePage: "finance", activeSubview: "applications" });
    render(<App repository={repository} />); await user.click(screen.getByRole("button", { name: "Open finance draft vehicle-09" }));
    expect(screen.getByRole("combobox", { name: "Vehicle" })).toHaveValue("vehicle-09"); await user.click(screen.getByRole("button", { name: "Inventory" }));

    cleanup(); const reloaded = createDemoRepository(storage); render(<App repository={reloaded} />);
    expect(screen.getByRole("heading", { name: "Vehicle inventory" })).toBeInTheDocument();
    expect(reloaded.getState().preferences).toMatchObject({ activePage: "inventory", activeSubview: "list" });
    expect(reloaded.getState().preferences).not.toHaveProperty("activeContextId");
  });
});
