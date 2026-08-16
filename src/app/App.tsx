import { useEffect, useMemo, useState } from "react";
import { ActionCentreView } from "../features/action-centre/ActionCentreView";
import { CommandPalette } from "../features/action-centre/CommandPalette";
import { CustomerDetail } from "../features/customers/CustomerDetail";
import { CustomersPage } from "../features/customers/CustomersPage";
import { FinancePage } from "../features/finance/FinancePage";
import { InventoryPage } from "../features/inventory/InventoryPage";
import { MyDayPage } from "../features/my-day/MyDayPage";
import { PipelinePage } from "../features/pipeline/PipelinePage";
import { SalesPage } from "../features/sales/SalesPage";
import { ServicePage } from "../features/service/ServicePage";
import { Button } from "../components/controls/Button";
import { ToastRegion } from "../components/feedback/ToastRegion";
import { Dialog } from "../components/overlays/Dialog";
import { EmployeeShell } from "../components/navigation/EmployeeShell";
import type { DemoRepository } from "../repository/demoRepository";
import { createDemoRepository } from "../repository/demoRepository";
import { pageKeys, type NavigationTarget, type PageKey } from "./routes";
import { useDemoApp } from "./useDemoApp";

type ViewTransitionDocument = Document & { startViewTransition?: (callback: () => void) => unknown };

const isPageKey = (value: string): value is PageKey => (pageKeys as readonly string[]).includes(value);
const browserRepository = () => createDemoRepository(window.localStorage);

const subviewTitles: Record<string, string> = {
  appraisals: "Vehicle appraisals", "trade-ins": "Trade-ins", recon: "Reconditioning queue", transfers: "Vehicle transfers", pricing: "Pricing review",
  leads: "CRM leads", "follow-ups": "Customer follow-ups", appointments: "Appointments", "test-drives": "Test drives",
  deals: "Deals", quotations: "Quotations", approvals: "Sales approvals", deliveries: "Vehicle deliveries", commissions: "Sales commissions",
  applications: "Finance applications", lenders: "Lender queue", products: "Finance products", documents: "Finance documents",
  bookings: "Service bookings", "job-cards": "Workshop job cards", "repair-orders": "Repair orders", history: "Service history",
  employees: "Employees", teams: "Teams", targets: "Team targets", attendance: "Attendance",
};

function ConnectedSubview({ subview, state, onNavigate }: { subview: string; state: ReturnType<DemoRepository["getState"]>; onNavigate: (target: NavigationTarget) => void }) {
  const title = subviewTitles[subview] ?? "Connected operations";
  const records = subviewTitles[subview]?.includes("Customer") || ["leads", "appointments", "test-drives"].includes(subview) ? state.leads.map((lead) => ({ id: lead.id, title: lead.nextAction, detail: lead.stage })) : subviewTitles[subview]?.includes("Service") || ["bookings", "job-cards", "repair-orders", "history"].includes(subview) ? state.serviceJobs.map((job) => ({ id: job.id, title: job.status, detail: job.note })) : ["deals", "quotations", "approvals", "deliveries", "commissions"].includes(subview) ? state.deals.map((deal) => ({ id: deal.id, title: `${deal.status} deal`, detail: deal.salesRep })) : state.vehicles.map((vehicle) => ({ id: vehicle.id, title: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, detail: vehicle.status }));
  return <section className="action-centre" aria-labelledby={`${subview}-title`}><header className="action-centre-heading"><p>Connected employee workspace</p><h1 id={`${subview}-title`}>{title}</h1><span>{records.length} connected records</span></header><ul className="action-centre-list">{records.map((record) => <li key={record.id}><div><strong>{record.title}</strong><p>{record.detail}</p></div><Button variant="secondary" onClick={() => onNavigate({ page: subviewTitles[subview]?.includes("Customer") ? "customers" : subviewTitles[subview]?.includes("Service") ? "service" : ["deals", "quotations", "approvals", "deliveries", "commissions"].includes(subview) ? "sales" : "inventory", subview: record.id })}>Open record</Button></li>)}</ul></section>;
}

function OperationsView({ subview, repository, state, onReset }: { subview: string; repository: DemoRepository; state: ReturnType<DemoRepository["getState"]>; onReset: () => void }) {
  if (subview === "tasks") return <ActionCentreView state={state} repository={repository} />;
  if (subview === "calendar") return <section className="action-centre" aria-labelledby="calendar-title"><header className="action-centre-heading"><p>Operations</p><h1 id="calendar-title">Calendar</h1></header><ul className="action-centre-list">{state.tasks.map((task) => <li key={task.id}><div><strong>{task.title}</strong><p>{task.detail}</p></div><time dateTime={task.dueAt}>{new Intl.DateTimeFormat("en-NA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(task.dueAt))}</time></li>)}</ul></section>;
  if (subview === "audit-trail") return <section className="action-centre" aria-labelledby="audit-title"><header className="action-centre-heading"><p>Operations</p><h1 id="audit-title">Audit trail</h1></header><ul className="action-centre-list">{state.activities.map((activity) => <li key={activity.id}><div><strong>{activity.action}</strong><p>{activity.detail}</p></div><time dateTime={activity.occurredAt}>{new Intl.DateTimeFormat("en-NA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.occurredAt))}</time></li>)}</ul></section>;
  return <section className="action-centre" aria-labelledby="operations-title"><header className="action-centre-heading"><p>Operations</p><h1 id="operations-title">{subview === "settings" ? "Workspace settings" : "Employee operations"}</h1></header><p>{subview === "settings" ? "Demo preferences are stored only in this browser." : "Use the connected task, calendar, customer and sales workspaces to manage this employee demo."}</p>{subview === "settings" ? <Button variant="secondary" onClick={onReset}>Reset demo data</Button> : <p>Branch: {state.preferences.branch} · Density: {state.preferences.density}</p>}</section>;
}

export function App({ repository: providedRepository }: { repository?: DemoRepository }) {
  const repository = useMemo(() => providedRepository ?? browserRepository(), [providedRepository]);
  const app = useDemoApp(repository);
  const target = isPageKey(app.target.page) ? app.target : { page: "my-day" as const, subview: "overview" };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); app.setSearchOpen(true); } };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [app.setSearchOpen]);

  const navigate = (next: NavigationTarget) => {
    const change = () => app.navigate(next);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const transitionDocument = document as ViewTransitionDocument;
    if (transitionDocument.startViewTransition && !reducedMotion) transitionDocument.startViewTransition(change); else change();
  };
  const notify = (title: string, detail?: string) => app.pushToast({ title, detail, tone: "positive" });
  const content = (() => {
    switch (target.page) {
      case "my-day":
        if (target.subview === "action-centre") return <ActionCentreView state={app.state} repository={repository} />;
        if (target.subview === "notifications") return <ActionCentreView state={app.state} repository={repository} view="notifications" />;
        return <MyDayPage state={app.state} repository={repository} onNavigate={navigate} onCommandSelect={(_, result) => { navigate(result.target); notify("Opened connected record", result.title); }} />;
      case "inventory": return ["appraisals", "trade-ins", "recon", "transfers", "pricing"].includes(target.subview) ? <ConnectedSubview subview={target.subview} state={app.state} onNavigate={navigate} /> : <InventoryPage state={app.state} repository={repository} initialSubview={target.subview} viewPreferences={app.state.preferences.viewPreferences.inventory} onViewPreferencesChange={(patch) => repository.setPreferences({ viewPreferences: { ...app.state.preferences.viewPreferences, inventory: { ...app.state.preferences.viewPreferences.inventory, ...patch } } })} onNavigate={(subview) => navigate({ page: "inventory", subview })} />;
      case "customers": {
        const customer = app.state.customers.find((item) => item.id === target.subview);
        return customer ? <CustomerDetail customer={customer} state={app.state} repository={repository} /> : ["leads", "follow-ups", "appointments", "test-drives"].includes(target.subview) ? <ConnectedSubview subview={target.subview} state={app.state} onNavigate={navigate} /> : <CustomersPage state={app.state} repository={repository} onOpenCustomer={(customerId) => navigate({ page: "customers", subview: customerId })} />;
      }
      case "pipeline": return <PipelinePage state={app.state} repository={repository} />;
      case "sales": return ["deals", "quotations", "approvals", "deliveries", "commissions"].includes(target.subview) ? <ConnectedSubview subview={target.subview} state={app.state} onNavigate={navigate} /> : <SalesPage state={app.state} repository={repository} />;
      case "finance": return ["applications", "lenders", "products", "documents"].includes(target.subview) ? <ConnectedSubview subview={target.subview} state={app.state} onNavigate={navigate} /> : <FinancePage state={app.state} repository={repository} />;
      case "service": return ["bookings", "job-cards", "repair-orders", "history"].includes(target.subview) ? <ConnectedSubview subview={target.subview} state={app.state} onNavigate={navigate} /> : <ServicePage state={app.state} repository={repository} />;
      case "operations": return ["employees", "teams", "targets", "attendance", "documents"].includes(target.subview) ? <ConnectedSubview subview={target.subview} state={app.state} onNavigate={navigate} /> : <OperationsView subview={target.subview} repository={repository} state={app.state} onReset={() => app.setActiveOverlay({ kind: "dialog", id: "reset" })} />;
    }
  })();

  return <EmployeeShell activePage={target.page} onNavigate={navigate} branch={app.state.preferences.branch} actionCount={app.state.tasks.filter((task) => task.status !== "Completed").length} notificationCount={app.state.notifications.filter((notification) => !notification.read).length} onSearch={() => app.setSearchOpen(true)} onBranch={() => app.setActiveOverlay({ kind: "dialog", id: "branch" })} onEmployeeMenu={() => app.setActiveOverlay({ kind: "dialog", id: "employee" })}>
    {content}
    <CommandPalette open={app.searchOpen} state={app.state} onClose={() => app.setSearchOpen(false)} onSelect={(result) => { navigate(result.target); notify("Opened connected record", result.title); }} />
    <Dialog open={app.activeOverlay?.id === "reset"} title="Reset demo data" onClose={app.closeOverlay}><p>This restores the deterministic Weelee demonstration data in this browser. This cannot be undone.</p><div className="modal-footer"><Button variant="secondary" onClick={app.closeOverlay}>Cancel</Button><Button onClick={() => { repository.reset(); app.closeOverlay(); notify("Demo data reset", "The deterministic demo data was restored."); }}>Reset demo data</Button></div></Dialog>
    <Dialog open={app.activeOverlay?.id === "branch"} title="Select branch" onClose={app.closeOverlay}><p>Choose the current employee branch for this local demo.</p>{["Windhoek", "Swakopmund"].map((branch) => <Button key={branch} variant="secondary" onClick={() => { repository.setPreferences({ branch }); app.closeOverlay(); }}>{branch}</Button>)}</Dialog>
    <Dialog open={app.activeOverlay?.id === "employee"} title="Employee demo controls" onClose={app.closeOverlay}><p>Anele Dlamini · Sales Executive · Demo mode</p><Button variant="secondary" onClick={() => { app.closeOverlay(); navigate({ page: "operations", subview: "settings" }); }}>Open workspace settings</Button><Button variant="secondary" onClick={() => { app.closeOverlay(); app.setActiveOverlay({ kind: "dialog", id: "reset" }); }}>Reset demo data</Button></Dialog>
    <ToastRegion toasts={app.toasts} onDismiss={app.dismissToast} />
  </EmployeeShell>;
}

export default App;
