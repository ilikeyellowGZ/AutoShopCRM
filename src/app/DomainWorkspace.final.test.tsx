import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createDemoRepository } from "../repository/demoRepository";
import { memoryStorage } from "../test/memoryStorage";
import { DomainWorkspace } from "./DomainWorkspace";
import { App } from "./App";
import { ActionCentreView } from "../features/action-centre/ActionCentreView";

afterEach(cleanup);

describe("finance workspaces without linked deals", () => {
  it.each(["applications", "lenders", "products", "documents"])("renders %s for finance drafts with and without deals", async (subview) => {
    const storage = memoryStorage(); const repository = createDemoRepository(storage);
    repository.updateFinanceDraft("vehicle-25", { aprPercent: 10.25, termMonths: 48, tradeAllowance: 0, serviceContract: 18_000 });
    repository.updateFinanceDraft("vehicle-26", { aprPercent: 12, termMonths: 72, tradeAllowance: 250_000, serviceContract: 24_000 });
    repository.setPreferences({ activePage: "finance", activeSubview: subview });
    const user = userEvent.setup();

    expect(() => render(<App repository={repository} />)).not.toThrow();
    await user.click(screen.getByRole("button", { name: /Show all \d+ connected records/ }));
    expect(screen.getAllByText(/Toyota Corolla Cross|MCR-2525/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/No linked deal/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "Open finance draft vehicle-25" }));
    expect(screen.getByRole("heading", { name: "Structure a deal" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Vehicle" })).toHaveValue("vehicle-25");
    cleanup(); render(<App repository={createDemoRepository(storage)} />);
    expect(screen.getByRole("combobox", { name: "Vehicle" })).toHaveValue("vehicle-25");
  }, 10_000);
});

describe("honest domain queue selectors", () => {
  it("separates appraisal, trade-in, recon, transfer, and pricing vehicle sets and reacts to mutation", () => {
    const state = createDemoRepository(memoryStorage()).getState(); const onNavigate = vi.fn();
    state.financeDrafts.push({ vehicleId: "vehicle-09", vehiclePrice: 1_060_000, downPayment: 0, termMonths: 48, aprPercent: 10, tradeAllowance: 0, lienPayoff: 0, serviceContract: 0, gapInsurance: 0 });
    const view = render(<DomainWorkspace page="inventory" subview="appraisals" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open appraisal vehicle-09" })).toBeInTheDocument();
    view.rerender(<DomainWorkspace page="inventory" subview="trade-ins" state={state} onNavigate={onNavigate} />);
    expect(screen.queryByRole("button", { name: "Open trade-in vehicle-09" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open trade-in vehicle-02" })).toBeInTheDocument();
    view.rerender(<DomainWorkspace page="inventory" subview="recon" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open recon vehicle-08" })).toBeInTheDocument();
    view.rerender(<DomainWorkspace page="inventory" subview="transfers" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open transfer vehicle-03" })).toBeInTheDocument();
    state.vehicles.find((vehicle) => vehicle.id === "vehicle-03")!.status = "Available";
    view.rerender(<DomainWorkspace page="inventory" subview="transfers" state={state} onNavigate={onNavigate} />);
    expect(screen.getByText("No connected records match this operational queue.")).toBeInTheDocument();
    view.rerender(<DomainWorkspace page="inventory" subview="pricing" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open pricing vehicle-01" })).toBeInTheDocument();
  });

  it("separates follow-up, appointment, and test-drive lead queues", () => {
    const state = createDemoRepository(memoryStorage()).getState(); const onNavigate = vi.fn();
    const view = render(<DomainWorkspace page="customers" subview="follow-ups" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open follow-up lead-01" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open follow-up lead-07" })).not.toBeInTheDocument();
    view.rerender(<DomainWorkspace page="customers" subview="appointments" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open appointment lead-07" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open appointment lead-01" })).not.toBeInTheDocument();
    view.rerender(<DomainWorkspace page="customers" subview="test-drives" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open test drive lead-01" })).toBeInTheDocument();
    state.tasks.find((task) => task.id === "task-06")!.status = "Due Today";
    view.rerender(<DomainWorkspace page="customers" subview="follow-ups" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open follow-up lead-07" })).toBeInTheDocument();
  });

  it("separates quotation, approval, delivery, and earned commission deals", () => {
    const state = createDemoRepository(memoryStorage()).getState(); const onNavigate = vi.fn();
    const view = render(<DomainWorkspace page="sales" subview="quotations" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open quotation deal-01" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open quotation deal-02" })).not.toBeInTheDocument();
    view.rerender(<DomainWorkspace page="sales" subview="approvals" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open approval deal-02" })).toBeInTheDocument();
    view.rerender(<DomainWorkspace page="sales" subview="deliveries" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open delivery deal-03" })).toBeInTheDocument();
    view.rerender(<DomainWorkspace page="sales" subview="commissions" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open commission deal-06" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open commission deal-03" })).not.toBeInTheDocument();
    state.deals.find((deal) => deal.id === "deal-02")!.status = "Pending";
    view.rerender(<DomainWorkspace page="sales" subview="quotations" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open quotation deal-02" })).toBeInTheDocument();
  });

  it("separates booking, workshop, repair-order, and completed history service sets", () => {
    const state = createDemoRepository(memoryStorage()).getState(); const onNavigate = vi.fn();
    const view = render(<DomainWorkspace page="service" subview="bookings" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open booking service-01" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open booking service-02" })).not.toBeInTheDocument();
    view.rerender(<DomainWorkspace page="service" subview="job-cards" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open job card service-02" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open job card service-01" })).not.toBeInTheDocument();
    view.rerender(<DomainWorkspace page="service" subview="repair-orders" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open repair order service-03" })).toBeInTheDocument();
    view.rerender(<DomainWorkspace page="service" subview="history" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open service history service-07" })).toBeInTheDocument();
    state.serviceJobs[0].status = "Completed";
    view.rerender(<DomainWorkspace page="service" subview="history" state={state} onNavigate={onNavigate} />);
    expect(screen.getByRole("button", { name: "Open service history service-01" })).toBeInTheDocument();
  });
});

describe("workspace links are real and optional", () => {
  it("renders empty Workforce views safely without tasks or activities", () => {
    const state = createDemoRepository(memoryStorage()).getState(); state.tasks = []; state.activities = [];
    expect(() => render(<DomainWorkspace page="operations" subview="employees" state={state} onNavigate={vi.fn()} />)).not.toThrow();
    expect(screen.getByText("No connected records match this operational queue.")).toBeInTheDocument();
  });

  it("does not fabricate an Open action for a system activity", () => {
    const state = createDemoRepository(memoryStorage()).getState(); state.tasks = []; state.activities = [{ id: "activity-system", organizationId: "org-motorgroup-sa", action: "Demo data reset", detail: "Seed restored.", actor: "Weelee Employee", occurredAt: "2026-08-16T08:00:00+02:00", tone: "neutral", targetType: "system", targetId: "system" }];
    render(<DomainWorkspace page="operations" subview="documents" state={state} onNavigate={vi.fn()} />);
    expect(screen.getByText(/Demo data reset/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Open audit artifact/ })).not.toBeInTheDocument();
  });

  it("does not offer an Open action for an untyped system notification", () => {
    const repository = createDemoRepository(memoryStorage()); const state = repository.getState();
    state.notifications = [{ id: "notification-system", title: "Local maintenance", detail: "No connected entity.", read: false, tone: "neutral", relatedId: "system" }];
    render(<ActionCentreView view="notifications" state={state} repository={repository} onNavigate={vi.fn()} />);
    expect(screen.getByText("Local maintenance")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open related record" })).not.toBeInTheDocument();
  });
});
