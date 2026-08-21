import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createDemoRepository } from "../repository/demoRepository";
import { memoryStorage } from "../test/memoryStorage";
import { DEMO_ACCESS_CODE } from "./access";
import { App } from "./App";

afterEach(cleanup);

describe("functional demo sign-in", () => {
  it("starts the public app at an accessible demo sign-in", () => {
    render(<App repository={createDemoRepository(memoryStorage())} initialAccountId={null} />);

    expect(screen.getByRole("heading", { name: "Sign in to MotorCRM" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Demo account email" })).toHaveAttribute("autocomplete", "username");
    expect(screen.getByLabelText("Demo access code")).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByText(/functional browser demo/i)).toBeInTheDocument();
    expect(screen.getByText(DEMO_ACCESS_CODE)).toBeInTheDocument();
  });

  it("reports invalid demo credentials without entering the workspace", async () => {
    const user = userEvent.setup();
    render(<App repository={createDemoRepository(memoryStorage())} initialAccountId={null} />);

    await user.type(screen.getByRole("textbox", { name: "Demo account email" }), "owner@motorcrm.demo");
    await user.type(screen.getByLabelText("Demo access code"), "incorrect");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Check the demo email and access code");
    expect(screen.queryByRole("navigation", { name: "Primary employee navigation" })).not.toBeInTheDocument();
  });

  it("changes routes and navigation after a stock-controller sign-in", async () => {
    const user = userEvent.setup();
    render(<App repository={createDemoRepository(memoryStorage())} initialAccountId={null} />);

    await user.click(screen.getByRole("button", { name: "Use stock@motorcrm.demo" }));
    await user.type(screen.getByLabelText("Demo access code"), DEMO_ACCESS_CODE);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.getByRole("heading", { name: "Vehicle inventory" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Kabelo Molefe, Stock Controller/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inventory" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Finance" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Customers" })).not.toBeInTheDocument();
    expect(screen.getByText(/connected vehicle records/i)).not.toHaveTextContent("30 connected");

    await user.click(screen.getByRole("button", { name: /Change branch/ }));
    await user.click(within(screen.getByRole("dialog", { name: "Select branch" })).getByRole("button", { name: "Midrand" }));
    expect(screen.getByRole("button", { name: /2024 Land Rover Defender/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /2024 Audi RS6/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add vehicle" }));
    const branch = screen.getByRole("combobox", { name: "Branch" });
    expect(within(branch).getByRole("option", { name: "Midrand" })).toBeInTheDocument();
    expect(within(branch).getByRole("option", { name: "Pretoria" })).toBeInTheDocument();
    expect(within(branch).queryByRole("option", { name: "Johannesburg North" })).not.toBeInTheDocument();
  });

  it("falls back from a persisted route the signed-in account cannot access", () => {
    const repository = createDemoRepository(memoryStorage());
    repository.setPreferences({ activePage: "finance", activeSubview: "deal-finance" });

    render(<App repository={repository} initialAccountId="stock" />);

    expect(screen.getByRole("heading", { name: "Vehicle inventory" })).toBeInTheDocument();
    expect(repository.getState().preferences).toMatchObject({ activePage: "inventory", activeSubview: "list" });
  });

  it("keeps the auditor read-only while retaining relevant record access", async () => {
    const user = userEvent.setup();
    render(<App repository={createDemoRepository(memoryStorage())} initialAccountId="auditor" />);

    expect(screen.getByRole("heading", { name: "Audit trail" })).toBeInTheDocument();
    expect(screen.getByText("Read-only demo view")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Inventory" }));
    expect(screen.getByRole("heading", { name: "Vehicle inventory" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Add vehicle" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /2024 Porsche 911/i }));
    expect(screen.queryByRole("button", { name: "Edit record" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create deal" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Customers" }));
    expect(screen.queryByRole("button", { name: "Create customer" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Amelia van Wyk/i }));
    expect(screen.queryByRole("button", { name: "Edit customer" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Pipeline" }));
    expect(screen.queryByRole("button", { name: "New lead" })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: /Move Amelia van Wyk/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Sales" }));
    expect(screen.queryByRole("button", { name: "New deal" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Finance" }));
    expect(screen.getByLabelText("Down payment (ZAR)")).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Submit demo application" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Service" }));
    expect(screen.getAllByLabelText("Job note")[0]).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: "Save note" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Action Centre/i }));
    expect(screen.queryByRole("button", { name: "Complete" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reschedule" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Notifications/i }));
    expect(screen.queryByRole("button", { name: "Mark read" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Mia Botha, External Auditor/ }));
    const dialog = screen.getByRole("dialog", { name: "Employee demo controls" });
    expect(within(dialog).queryByRole("button", { name: "Reset demo data" })).not.toBeInTheDocument();
    expect(within(dialog).queryByRole("button", { name: "Open workspace settings" })).not.toBeInTheDocument();
  });

  it("personalises My Day for the signed-in employee", () => {
    render(<App repository={createDemoRepository(memoryStorage())} initialAccountId="sales" />);

    expect(screen.getByRole("heading", { name: "Good morning, Naledi." })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Change branch/ })).toBeDisabled();
  });

  it("hides sensitive financial and audit context from sales and stock roles", async () => {
    const user = userEvent.setup();
    const sales = render(<App repository={createDemoRepository(memoryStorage())} initialAccountId="sales" />);
    await user.click(screen.getByRole("button", { name: "Inventory" }));
    await user.click(screen.getByRole("button", { name: /2024 Porsche 911/i }));
    expect(screen.queryByRole("heading", { name: "Cost & margin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Audit activity" })).not.toBeInTheDocument();
    expect(screen.queryByText("Finance worksheet")).not.toBeInTheDocument();
    sales.unmount();

    render(<App repository={createDemoRepository(memoryStorage())} initialAccountId="stock" />);
    await user.click(screen.getByRole("button", { name: "My Day" }));
    expect(screen.queryByRole("region", { name: "Active pipeline" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Approvals" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Recent activity" })).not.toBeInTheDocument();
  });

  it("shows sales status without margin data to accounts staff", async () => {
    const user = userEvent.setup();
    render(<App repository={createDemoRepository(memoryStorage())} initialAccountId="accounts" />);

    await user.click(screen.getByRole("button", { name: "Sales" }));
    expect(screen.getByRole("heading", { name: "Sales log" })).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Gross profit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Highest profit" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export CSV" })).not.toBeInTheDocument();
  });

  it("limits a sales executive to own same-branch performance without exports", async () => {
    const user = userEvent.setup();
    render(<App repository={createDemoRepository(memoryStorage())} initialAccountId="sales" />);

    await user.click(screen.getByRole("button", { name: "Sales" }));
    expect(screen.getByRole("columnheader", { name: "Gross profit" })).toBeInTheDocument();
    expect(screen.getAllByText("Naledi Ndlovu").length).toBeGreaterThan(0);
    expect(screen.queryByText("Marcus Botha")).not.toBeInTheDocument();
    expect(screen.queryByText("Alicia Brown")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Export CSV" })).not.toBeInTheDocument();
  });

  it("lets a sales executive mutate only an assigned task", async () => {
    const user = userEvent.setup();
    const repository = createDemoRepository(memoryStorage());
    render(<App repository={repository} initialAccountId="sales" />);

    await user.click(screen.getByRole("button", { name: /Action Centre/ }));
    expect(screen.getByText("Call Amelia")).toBeInTheDocument();
    expect(screen.queryByText("Finance pack")).not.toBeInTheDocument();
    expect(screen.queryByText("Price review")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Complete" }));
    expect(repository.getState().tasks.find((task) => task.id === "task-01")?.status).toBe("Completed");
    expect(repository.getState().tasks.find((task) => task.id === "task-02")?.status).toBe("Due Today");
  });

  it("keeps vehicle-intake drafts private to their account and branch", async () => {
    const user = userEvent.setup();
    const repository = createDemoRepository(memoryStorage());
    const owner = render(<App repository={repository} initialAccountId="owner" />);
    await user.click(screen.getByRole("button", { name: "Inventory" }));
    await user.click(screen.getByRole("button", { name: "Add vehicle" }));
    await user.type(screen.getByLabelText("VIN"), "OWNER");
    await user.tab();
    owner.unmount();

    const stock = render(<App repository={repository} initialAccountId="stock" />);
    await user.click(screen.getByRole("button", { name: "Add vehicle" }));
    expect(screen.getByLabelText("VIN")).toHaveValue("");
    await user.type(screen.getByLabelText("VIN"), "STOCK");
    stock.unmount();

    render(<App repository={repository} initialAccountId="owner" />);
    await user.click(screen.getByRole("button", { name: "Inventory" }));
    await user.click(screen.getByRole("button", { name: "Add vehicle" }));
    expect(screen.getByLabelText("VIN")).toHaveValue("OWNER");
  });

  it("remounts vehicle intake when a live branch switch changes the draft scope", async () => {
    const user = userEvent.setup();
    const repository = createDemoRepository(memoryStorage());
    render(<App repository={repository} initialAccountId="owner" />);
    await user.click(screen.getByRole("button", { name: "Inventory" }));
    await user.click(screen.getByRole("button", { name: "Add vehicle" }));
    await user.type(screen.getByLabelText("VIN"), "JOHANNESBURG");
    await user.click(screen.getByRole("button", { name: /Change branch/ }));
    await user.click(within(screen.getByRole("dialog", { name: "Select branch" })).getByRole("button", { name: "Sandton" }));

    expect(screen.getByLabelText("VIN")).toHaveValue("");
    expect(repository.getState().drafts.vehicleIntakes["owner:Johannesburg North"]?.values.vin).toBe("JOHANNESBURG");
    expect(repository.getState().drafts.vehicleIntakes["owner:Sandton"]).toBeUndefined();
  });

  it("attributes sequential sign-in branch changes to the newly selected account", async () => {
    const user = userEvent.setup();
    const repository = createDemoRepository(memoryStorage());
    render(<App repository={repository} initialAccountId={null} />);

    await user.click(screen.getByRole("button", { name: "Use stock@motorcrm.demo" }));
    await user.type(screen.getByLabelText("Demo access code"), DEMO_ACCESS_CODE);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(repository.getState().activities[0]).toMatchObject({ action: "Preferences updated", actor: "Kabelo Molefe · Stock Controller" });
    await user.click(screen.getByRole("button", { name: /Kabelo Molefe, Stock Controller/ }));
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    await user.click(screen.getByRole("button", { name: "Use finance@motorcrm.demo" }));
    await user.type(screen.getByLabelText("Demo access code"), DEMO_ACCESS_CODE);
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(repository.getState().activities[0]).toMatchObject({ action: "Preferences updated", actor: "Priya Naidoo · F&I Manager" });
  });

  it("exposes branch and account controls through the destination sheet used on mobile", async () => {
    const user = userEvent.setup();
    render(<App repository={createDemoRepository(memoryStorage())} initialAccountId="salesmanager" />);

    await user.click(screen.getByRole("button", { name: "Open destinations" }));
    const destinations = screen.getByRole("navigation", { name: "Employee destinations" });
    expect(within(destinations).getByRole("button", { name: "Change branch from Sandton" })).toBeInTheDocument();
    expect(within(destinations).getByRole("button", { name: "Account: Lindiwe Khumalo" })).toBeInTheDocument();
    await user.click(within(destinations).getByRole("button", { name: "Account: Lindiwe Khumalo" }));
    expect(screen.getByRole("dialog", { name: "Employee demo controls" })).toBeInTheDocument();
  });

  it("limits the branch picker and returns to sign-in on sign-out", async () => {
    const user = userEvent.setup();
    render(<App repository={createDemoRepository(memoryStorage())} initialAccountId="salesmanager" />);

    await user.click(screen.getByRole("button", { name: /Change branch/ }));
    const branchDialog = screen.getByRole("dialog", { name: "Select branch" });
    expect(within(branchDialog).getByRole("button", { name: "Sandton" })).toBeInTheDocument();
    expect(within(branchDialog).getByRole("button", { name: "Johannesburg North" })).toBeInTheDocument();
    expect(within(branchDialog).queryByRole("button", { name: "Pretoria" })).not.toBeInTheDocument();
    await user.click(within(branchDialog).getByRole("button", { name: "Sandton" }));

    await user.click(screen.getByRole("button", { name: /Lindiwe Khumalo, Sales Manager/ }));
    await user.click(screen.getByRole("button", { name: "Sign out" }));
    expect(screen.getByRole("heading", { name: "Sign in to MotorCRM" })).toBeInTheDocument();
  });
});
