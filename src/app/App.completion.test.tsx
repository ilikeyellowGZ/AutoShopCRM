import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { NavigationTarget } from "./routes";
import { App } from "./App";
import { createDemoRepository } from "../repository/demoRepository";
import { memoryStorage } from "../test/memoryStorage";

afterEach(() => { cleanup(); Reflect.deleteProperty(document, "startViewTransition"); });

type RouteCase = { label: string; target: NavigationTarget; heading: string; control?: string; row: string };
const primaryCases: RouteCase[] = [
  { label: "primary My Day", target: { page: "my-day", subview: "overview" }, heading: "Good morning, Anele.", control: "Action Search", row: "Call Amelia" },
  { label: "primary Inventory", target: { page: "inventory", subview: "list" }, heading: "Vehicle inventory", control: "Add vehicle", row: "2024 Porsche 911" },
  { label: "primary Customers", target: { page: "customers", subview: "directory" }, heading: "Customers", control: "Create customer", row: "Amelia van Wyk" },
  { label: "primary Pipeline", target: { page: "pipeline", subview: "board" }, heading: "Pipeline", control: "New lead", row: "Amelia van Wyk" },
  { label: "primary Sales", target: { page: "sales", subview: "sales-log" }, heading: "Sales log", control: "New deal", row: "2024 Porsche 911" },
  { label: "primary Finance", target: { page: "finance", subview: "deal-finance" }, heading: "Structure a deal", control: "Submit demo application", row: "2023 BMW M4" },
  { label: "primary Service", target: { page: "service", subview: "service-board" }, heading: "Service board", control: "Save note", row: "2024 Land Rover Defender" },
];
const groupedCases: RouteCase[] = [
  { label: "Command / My Day", target: { page: "my-day", subview: "overview" }, heading: "Good morning, Anele.", control: "Action Search", row: "Call Amelia" },
  { label: "Command / Action Centre", target: { page: "my-day", subview: "action-centre" }, heading: "Action Centre", control: "Complete", row: "Call Amelia" },
  { label: "Command / Notifications", target: { page: "my-day", subview: "notifications" }, heading: "Notifications", control: "Mark read", row: "M4 CSL reserved" },
  { label: "CRM / Leads", target: { page: "customers", subview: "leads" }, heading: "CRM leads", control: "Open lead lead-01", row: "Call customer" },
  { label: "CRM / Customers", target: { page: "customers", subview: "directory" }, heading: "Customers", control: "Create customer", row: "Amelia van Wyk" },
  { label: "CRM / Pipeline", target: { page: "pipeline", subview: "board" }, heading: "Pipeline", control: "New lead", row: "Amelia van Wyk" },
  { label: "CRM / Follow-ups", target: { page: "customers", subview: "follow-ups" }, heading: "Customer follow-ups", control: "Open follow-up lead-01", row: "Call customer" },
  { label: "CRM / Appointments", target: { page: "customers", subview: "appointments" }, heading: "Customer appointments", control: "Open appointment lead-07", row: "Mia Hamutenya" },
  { label: "CRM / Test Drives", target: { page: "customers", subview: "test-drives" }, heading: "Test drives", control: "Open test drive lead-01", row: "2024 Porsche 911" },
  { label: "Vehicles / Inventory", target: { page: "inventory", subview: "list" }, heading: "Vehicle inventory", control: "Add vehicle", row: "2024 Porsche 911" },
  { label: "Vehicles / Intake", target: { page: "inventory", subview: "intake" }, heading: "Vehicle intake", control: "Continue", row: "1. Identification" },
  { label: "Vehicles / Appraisals", target: { page: "inventory", subview: "appraisals" }, heading: "Vehicle appraisals", control: "Open appraisal vehicle-01", row: "2024 Porsche 911 GT3" },
  { label: "Vehicles / Trade-ins", target: { page: "inventory", subview: "trade-ins" }, heading: "Trade-ins", control: "Open trade-in vehicle-02", row: "WEE-2402" },
  { label: "Vehicles / Recon", target: { page: "inventory", subview: "recon" }, heading: "Reconditioning queue", control: "Open recon vehicle-08", row: "2024 Ford Ranger Raptor" },
  { label: "Vehicles / Transfers", target: { page: "inventory", subview: "transfers" }, heading: "Vehicle transfers", control: "Open transfer vehicle-03", row: "Pretoria" },
  { label: "Vehicles / Pricing", target: { page: "inventory", subview: "pricing" }, heading: "Pricing review", control: "Open pricing vehicle-01", row: "WEE-2401" },
  { label: "Sales / Sales Log", target: { page: "sales", subview: "sales-log" }, heading: "Sales log", control: "New deal", row: "2024 Porsche 911" },
  { label: "Sales / Deals", target: { page: "sales", subview: "deals" }, heading: "Deals", control: "Open deal deal-01", row: "Deal deal-01" },
  { label: "Sales / Quotations", target: { page: "sales", subview: "quotations" }, heading: "Quotations", control: "Open quotation deal-01", row: "Amelia van Wyk" },
  { label: "Sales / Approvals", target: { page: "sales", subview: "approvals" }, heading: "Sales approvals", control: "Open approval deal-02", row: "Jonas Kisting" },
  { label: "Sales / Deliveries", target: { page: "sales", subview: "deliveries" }, heading: "Vehicle deliveries", control: "Open delivery deal-03", row: "Nadine Swart" },
  { label: "Sales / Commissions", target: { page: "sales", subview: "commissions" }, heading: "Sales commissions", control: "Open commission deal-06", row: "Marcus Botha" },
  { label: "F&I / Deal Finance", target: { page: "finance", subview: "deal-finance" }, heading: "Structure a deal", control: "Submit demo application", row: "2023 BMW M4" },
  { label: "F&I / Applications", target: { page: "finance", subview: "applications" }, heading: "Finance applications", control: "Open application deal-02", row: "60 months" },
  { label: "F&I / Lenders", target: { page: "finance", subview: "lenders" }, heading: "Lender queue", control: "Open lender review deal-02", row: "11.5% APR" },
  { label: "F&I / Products", target: { page: "finance", subview: "products" }, heading: "Finance products", control: "Open products deal-02", row: "Service contract" },
  { label: "F&I / Documents", target: { page: "finance", subview: "documents" }, heading: "Finance documents", control: "Open finance document deal-02", row: "Deal contract deal-02" },
  { label: "Aftersales / Service Board", target: { page: "service", subview: "service-board" }, heading: "Service board", control: "Save note", row: "2024 Land Rover Defender" },
  { label: "Aftersales / Bookings", target: { page: "service", subview: "bookings" }, heading: "Service bookings", control: "Open booking service-01", row: "Annual inspection" },
  { label: "Aftersales / Job Cards", target: { page: "service", subview: "job-cards" }, heading: "Workshop job cards", control: "Open job card service-02", row: "Sasha Naobes" },
  { label: "Aftersales / Repair Orders", target: { page: "service", subview: "repair-orders" }, heading: "Repair orders", control: "Open repair order service-03", row: "Marius Louw" },
  { label: "Aftersales / Service History", target: { page: "service", subview: "history" }, heading: "Service history", row: "No connected records match this operational queue." },
  { label: "Workforce / Employees", target: { page: "operations", subview: "employees" }, heading: "Employees", control: "Open assigned task task-01", row: "Alicia Brown" },
  { label: "Workforce / Teams", target: { page: "operations", subview: "teams" }, heading: "Teams", control: "Open team task task-01", row: "Connected team" },
  { label: "Workforce / Targets", target: { page: "operations", subview: "targets" }, heading: "Team targets", control: "Open target deal deal-01", row: "Pipeline value" },
  { label: "Workforce / Attendance", target: { page: "operations", subview: "attendance" }, heading: "Attendance", control: "Open attendance record vehicle-01", row: "Latest recorded activity" },
  { label: "Operations / Tasks", target: { page: "operations", subview: "tasks" }, heading: "Operations tasks", control: "Open task task-01", row: "Confirm GT3 test drive" },
  { label: "Operations / Calendar", target: { page: "operations", subview: "calendar" }, heading: "Operations calendar", control: "Open calendar task task-01", row: "Call Amelia" },
  { label: "Operations / Documents", target: { page: "operations", subview: "documents" }, heading: "Operations documents", control: "Open audit artifact activity-01", row: "Demo activity 1" },
  { label: "Operations / Audit Trail", target: { page: "operations", subview: "audit-trail" }, heading: "Audit trail", control: "Open audit vehicle-01", row: "Vehicle updated" },
  { label: "Operations / Settings", target: { page: "operations", subview: "settings" }, heading: "Workspace settings", control: "Reset demo data", row: "Johannesburg North" },
];

describe("rendered employee route matrix", () => {
  it.each([...primaryCases, ...groupedCases])("renders $label with its domain control and connected row", ({ target, heading, control, row }) => {
    const repository = createDemoRepository(memoryStorage());
    repository.setPreferences({ activePage: target.page, activeSubview: target.subview });
    render(<App repository={repository} />);

    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    if (control) expect(screen.getAllByRole("button", { name: control }).length).toBeGreaterThan(0);
    expect(screen.getAllByText(row, { exact: false }).length).toBeGreaterThan(0);
  });
});

describe("exact connected navigation", () => {
  it.each([
    ["vehicle", { activePage: "inventory", activeSubview: "vehicle-01", activeRecordType: "vehicle", activeRecordId: "vehicle-01" }, "2024 Porsche 911 GT3"],
    ["customer", { activePage: "customers", activeSubview: "customer-01", activeRecordType: "customer", activeRecordId: "customer-01" }, "Amelia van Wyk"],
    ["lead", { activePage: "customers", activeSubview: "leads", activeRecordType: "lead", activeRecordId: "lead-01" }, "Lead lead-01"],
    ["deal", { activePage: "sales", activeSubview: "deals", activeRecordType: "deal", activeRecordId: "deal-01" }, "Deal deal-01"],
    ["service", { activePage: "service", activeSubview: "service-board", activeRecordType: "service", activeRecordId: "service-01" }, "Service job service-01"],
    ["task", { activePage: "operations", activeSubview: "tasks", activeRecordType: "task", activeRecordId: "task-01" }, "Task: Call Amelia"],
  ] as const)("renders an exact %s record", (_type, preferences, heading) => {
    const repository = createDemoRepository(memoryStorage()); repository.setPreferences(preferences);
    render(<App repository={repository} />);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it.each([
    ["Call Amelia", "Lead lead-01"], ["Finance pack", "Deal deal-02"], ["Photograph X5 M", "2024 BMW X5 M Competition"], ["Parts follow-up", "Service job service-02"],
  ])("routes the My Day %s action to its exact related record", async (taskTitle, heading) => {
    const user = userEvent.setup(); render(<App repository={createDemoRepository(memoryStorage())} />);
    const row = screen.getAllByText(taskTitle)[0].closest("li")!;
    await user.click(within(row).getByRole("button", { name: "Open related record" }));
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("opens exact typed records from domain workspace Open actions", async () => {
    const user = userEvent.setup(); const repository = createDemoRepository(memoryStorage());
    repository.setPreferences({ activePage: "sales", activeSubview: "deals" }); render(<App repository={repository} />);
    await user.click(screen.getByRole("button", { name: "Open deal deal-01" }));
    expect(repository.getState().preferences).toMatchObject({ activeRecordType: "deal", activeRecordId: "deal-01" });
    expect(screen.getByRole("heading", { name: "Deal deal-01" })).toBeInTheDocument();
  });

  it.each([
    [{ page: "customers", subview: "leads" }, "Open lead lead-01", "Lead lead-01"],
    [{ page: "customers", subview: "follow-ups" }, "Open follow-up lead-01", "Lead lead-01"],
    [{ page: "customers", subview: "appointments" }, "Open appointment lead-07", "Lead lead-07"],
    [{ page: "customers", subview: "test-drives" }, "Open test drive lead-01", "Lead lead-01"],
    [{ page: "inventory", subview: "appraisals" }, "Open appraisal vehicle-01", "2024 Porsche 911 GT3"],
    [{ page: "inventory", subview: "trade-ins" }, "Open trade-in vehicle-02", "2023 BMW M4 CSL"],
    [{ page: "inventory", subview: "recon" }, "Open recon vehicle-08", "2024 Ford Ranger Raptor"],
    [{ page: "inventory", subview: "transfers" }, "Open transfer vehicle-03", "2024 Audi RS6 Avant"],
    [{ page: "inventory", subview: "pricing" }, "Open pricing vehicle-01", "2024 Porsche 911 GT3"],
    [{ page: "sales", subview: "deals" }, "Open deal deal-01", "Deal deal-01"],
    [{ page: "sales", subview: "quotations" }, "Open quotation deal-01", "Deal deal-01"],
    [{ page: "sales", subview: "approvals" }, "Open approval deal-02", "Deal deal-02"],
    [{ page: "sales", subview: "deliveries" }, "Open delivery deal-03", "Deal deal-03"],
    [{ page: "sales", subview: "commissions" }, "Open commission deal-06", "Deal deal-06"],
    [{ page: "finance", subview: "applications" }, "Open application deal-02", "Deal deal-02"],
    [{ page: "finance", subview: "lenders" }, "Open lender review deal-02", "Deal deal-02"],
    [{ page: "finance", subview: "products" }, "Open products deal-02", "Deal deal-02"],
    [{ page: "finance", subview: "documents" }, "Open finance document deal-02", "Deal deal-02"],
    [{ page: "service", subview: "bookings" }, "Open booking service-01", "Service job service-01"],
    [{ page: "service", subview: "job-cards" }, "Open job card service-02", "Service job service-02"],
    [{ page: "service", subview: "repair-orders" }, "Open repair order service-03", "Service job service-03"],
    [{ page: "operations", subview: "employees" }, "Open assigned task task-01", "Task: Call Amelia"],
    [{ page: "operations", subview: "teams" }, "Open team task task-01", "Task: Call Amelia"],
    [{ page: "operations", subview: "targets" }, "Open target deal deal-01", "Deal deal-01"],
    [{ page: "operations", subview: "attendance" }, "Open attendance record vehicle-01", "2024 Porsche 911 GT3"],
    [{ page: "operations", subview: "tasks" }, "Open task task-01", "Task: Call Amelia"],
    [{ page: "operations", subview: "calendar" }, "Open calendar task task-01", "Task: Call Amelia"],
    [{ page: "operations", subview: "documents" }, "Open audit artifact activity-01", "2024 Porsche 911 GT3"],
    [{ page: "operations", subview: "audit-trail" }, "Open audit vehicle-01", "2024 Porsche 911 GT3"],
  ] as const)("opens the exact entity from %o / %s", async (target, action, heading) => {
    const user = userEvent.setup(); const repository = createDemoRepository(memoryStorage());
    repository.setPreferences({ activePage: target.page, activeSubview: target.subview }); render(<App repository={repository} />);
    await user.click(screen.getByRole("button", { name: action }));
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it.each([
    ["vehicle-01", "2024 Porsche 911 GT3"], ["customer-01", "Amelia van Wyk"], ["lead-01", "Lead lead-01"], ["deal-01", "Deal deal-01"], ["service-01", "Service job service-01"], ["task-01", "Task: Call Amelia"],
  ])("opens the exact %s command result", async (query, heading) => {
    const user = userEvent.setup(); render(<App repository={createDemoRepository(memoryStorage())} />);
    await user.click(screen.getByRole("button", { name: /Search. Press/ })); await user.type(screen.getByRole("combobox", { name: "Search employee records" }), query); await user.click(screen.getAllByRole("option")[0]);
    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it.each([
    [{ activePage: "inventory", activeSubview: "appraisals" }, "Open appraisal vehicle-01", "2024 Porsche 911 GT3"],
    [{ activePage: "customers", activeSubview: "leads" }, "Open lead lead-01", "Lead lead-01"],
    [{ activePage: "sales", activeSubview: "deals" }, "Open deal deal-01", "Deal deal-01"],
    [{ activePage: "service", activeSubview: "bookings" }, "Open booking service-01", "Service job service-01"],
    [{ activePage: "operations", activeSubview: "tasks" }, "Open task task-01", "Task: Call Amelia"],
  ] as const)("opens the exact typed record from %s/%s", async (preferences, action, heading) => {
    const user = userEvent.setup(); const repository = createDemoRepository(memoryStorage()); repository.setPreferences(preferences); render(<App repository={repository} />);
    await user.click(screen.getByRole("button", { name: action })); expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
  });

  it("restores a grouped subview and its exact opened record from the same storage", async () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const user = userEvent.setup(); const rendered = render(<App repository={repository} />);
    await user.click(screen.getByRole("button", { name: "More" })); const finance = within(screen.getByRole("navigation", { name: "Employee destinations" })).getByRole("heading", { name: "F&I" }).parentElement!; await user.click(within(finance).getByRole("button", { name: "Documents" }));
    expect(screen.getByRole("heading", { name: "Finance documents" })).toBeInTheDocument(); rendered.unmount(); render(<App repository={createDemoRepository(storage)} />); expect(screen.getByRole("heading", { name: "Finance documents" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open finance document deal-02" })); cleanup(); render(<App repository={createDemoRepository(storage)} />); expect(screen.getByRole("heading", { name: "Deal deal-02" })).toBeInTheDocument();
  });
});

describe("connected inventory and deal journey", () => {
  it("keeps Inventory mounted through intake, completion detail, Back, and linked deal creation", async () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const user = userEvent.setup();
    render(<App repository={repository} />); await user.click(screen.getByRole("button", { name: "Inventory" })); await user.click(screen.getByRole("button", { name: "Add vehicle" }));
    expect(screen.getByRole("heading", { name: "Vehicle intake" })).toBeInTheDocument();
    await user.type(screen.getByLabelText("VIN"), "1HGCM82633A004352"); await user.type(screen.getByLabelText("Stock ID"), "WEE-2411"); await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.clear(screen.getByLabelText("Year")); await user.type(screen.getByLabelText("Year"), "2025"); await user.type(screen.getByLabelText("Make"), "Volvo"); await user.type(screen.getByLabelText("Model"), "EX90"); await user.type(screen.getByLabelText("Derivative"), "Twin Motor"); await user.clear(screen.getByLabelText("Price (ZAR)")); await user.type(screen.getByLabelText("Price (ZAR)"), "1800000");
    await user.selectOptions(screen.getByLabelText("Body type"), "SUV"); await user.selectOptions(screen.getByLabelText("Fuel"), "Electric"); await user.selectOptions(screen.getByLabelText("Transmission"), "Single-speed"); await user.type(screen.getByLabelText("Engine"), "Dual motor electric");
    await user.click(screen.getByRole("button", { name: "Continue" })); await user.click(screen.getByRole("button", { name: "Continue" })); await user.click(screen.getByRole("button", { name: "Add vehicle to inventory" }));
    expect(screen.getByRole("heading", { name: "2025 Volvo EX90 Twin Motor" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Back to inventory" })); expect(screen.getByRole("heading", { name: "Vehicle inventory" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /2025 Volvo EX90/i })); await user.click(screen.getByRole("button", { name: "Create deal" }));
    expect(screen.getByRole("heading", { name: "New vehicle deal" })).toBeInTheDocument(); expect(screen.getByRole("combobox", { name: "Vehicle" })).toHaveValue("vehicle-31");
    await user.clear(screen.getByLabelText("Gross profit (ZAR)")); await user.type(screen.getByLabelText("Gross profit (ZAR)"), "125000"); await user.click(screen.getByRole("button", { name: "Save deal" }));
    const deal = repository.getState().deals.at(-1)!;
    expect(deal).toMatchObject({ vehicleId: "vehicle-31", grossProfit: 125000 }); expect(repository.getState().activities.find((activity) => activity.action === "Deal added")).toMatchObject({ targetId: deal.id });
    expect(screen.getByRole("heading", { name: `Deal ${deal.id}` })).toBeInTheDocument();
  });
});

describe("controlled persisted feature preferences", () => {
  it("persists every query, filter, tab, sort, and view across route changes and same-storage remount", async () => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage); const user = userEvent.setup(); const rendered = render(<App repository={repository} />);
    await user.click(screen.getByRole("button", { name: "Inventory" })); await user.type(screen.getByLabelText("Search inventory"), "BMW"); await user.selectOptions(screen.getByLabelText("Status"), "Reserved"); await user.click(screen.getByRole("button", { name: "Table" }));
    await user.click(screen.getByRole("button", { name: "Customers" })); await user.type(screen.getByLabelText("Search customers"), "Jonas"); await user.selectOptions(screen.getByLabelText("Status"), "Active"); await user.click(screen.getByRole("tab", { name: "Follow-ups" }));
    await user.click(screen.getByRole("button", { name: "Sales" })); await user.type(screen.getByLabelText("Search sales"), "Marcus"); await user.selectOptions(screen.getByLabelText("Status"), "Approval"); await user.selectOptions(screen.getByLabelText("Sort"), "profit");
    await user.click(screen.getByRole("button", { name: "Service" })); await user.type(screen.getByLabelText("Search jobs"), "Sasha"); await user.selectOptions(screen.getByLabelText("Status"), "Checked In"); await user.click(screen.getByRole("tab", { name: "List" }));
    expect(repository.getState().preferences.viewPreferences).toEqual({ inventory: { query: "BMW", status: "Reserved", mode: "table" }, customers: { query: "Jonas", status: "Active", tab: "follow-ups" }, sales: { query: "Marcus", status: "Approval", sort: "profit" }, service: { query: "Sasha", filter: "Checked In", view: "List" } });
    rendered.unmount(); render(<App repository={createDemoRepository(storage)} />);
    expect(screen.getByLabelText("Search jobs")).toHaveValue("Sasha"); expect(screen.getByLabelText("Status")).toHaveValue("Checked In"); expect(screen.getByRole("tab", { name: "List" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("button", { name: "Inventory" })); expect(screen.getByLabelText("Search inventory")).toHaveValue("BMW"); expect(screen.getByRole("button", { name: "Table" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "Customers" })); expect(screen.getByLabelText("Search customers")).toHaveValue("Jonas"); expect(screen.getByRole("tab", { name: "Follow-ups" })).toHaveAttribute("aria-selected", "true");
    await user.click(screen.getByRole("button", { name: "Sales" })); expect(screen.getByLabelText("Search sales")).toHaveValue("Marcus"); expect(screen.getByLabelText("Sort")).toHaveValue("profit");
  });
});

describe("shell controls and transitions", () => {
  it("binds navigation to a view transition and exposes branch and employee controls", async () => {
    const transition = vi.fn((callback: () => void) => { callback(); return {}; }); (document as unknown as { startViewTransition: typeof transition }).startViewTransition = transition;
    const user = userEvent.setup(); const repository = createDemoRepository(memoryStorage()); render(<App repository={repository} />);
    await user.click(screen.getByRole("button", { name: "Inventory" })); expect(transition).toHaveBeenCalledTimes(1); expect(screen.getByRole("heading", { name: "Vehicle inventory" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Change branch/ })); const branchDialog = screen.getByRole("dialog", { name: "Select branch" }); await user.click(within(branchDialog).getByRole("button", { name: "Sandton" })); expect(repository.getState().preferences.branch).toBe("Sandton");
    await user.click(screen.getByRole("button", { name: /Anele Dlamini, Sales Executive/ })); expect(screen.getByRole("dialog", { name: "Employee demo controls" })).toBeInTheDocument();
  });

  it("resets visibly and places the reset audit first on My Day", async () => {
    const user = userEvent.setup(); const repository = createDemoRepository(memoryStorage()); render(<App repository={repository} />);
    await user.click(screen.getByRole("button", { name: /Anele Dlamini, Sales Executive/ })); await user.click(screen.getByRole("button", { name: "Reset demo data" })); const dialog = screen.getByRole("dialog", { name: "Reset demo data" }); await user.click(within(dialog).getByRole("button", { name: "Reset demo data" }));
    expect(screen.getByText("The deterministic demo data was restored.")).toBeInTheDocument(); expect(repository.getState().activities[0].action).toBe("Demo data reset");
    await user.click(screen.getByRole("button", { name: "My Day" })); expect(screen.getAllByText("Demo data reset").length).toBeGreaterThan(0);
  });
});
