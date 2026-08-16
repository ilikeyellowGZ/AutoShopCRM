import { useEffect, useMemo } from "react";
import { ActionCentreView } from "../features/action-centre/ActionCentreView";
import { CommandPalette } from "../features/action-centre/CommandPalette";
import { CustomerDetail } from "../features/customers/CustomerDetail";
import { CustomersPage } from "../features/customers/CustomersPage";
import { FinancePage } from "../features/finance/FinancePage";
import { InventoryPage } from "../features/inventory/InventoryPage";
import { MyDayPage } from "../features/my-day/MyDayPage";
import { PipelinePage } from "../features/pipeline/PipelinePage";
import { DealEntry } from "../features/sales/DealEntry";
import { SalesPage } from "../features/sales/SalesPage";
import { ServicePage } from "../features/service/ServicePage";
import { VehicleDetail } from "../features/inventory/VehicleDetail";
import { Button } from "../components/controls/Button";
import { ToastRegion } from "../components/feedback/ToastRegion";
import { Dialog } from "../components/overlays/Dialog";
import { EmployeeShell } from "../components/navigation/EmployeeShell";
import type { DemoRepository } from "../repository/demoRepository";
import { createDemoRepository } from "../repository/demoRepository";
import type { ViewPreferences } from "../domain/models";
import { pageKeys, type NavigationTarget, type PageKey } from "./routes";
import { useDemoApp } from "./useDemoApp";
import { DomainWorkspace, ExactRecordView } from "./DomainWorkspace";

type ViewTransitionDocument = Document & { startViewTransition?: (callback: () => void) => unknown };
const isPageKey = (value: string): value is PageKey => (pageKeys as readonly string[]).includes(value);
const browserRepository = () => createDemoRepository(window.localStorage);
const domainSubviews = {
  inventory: ["appraisals", "trade-ins", "recon", "transfers", "pricing"],
  customers: ["leads", "follow-ups", "appointments", "test-drives"],
  sales: ["deals", "quotations", "approvals", "deliveries", "commissions"],
  finance: ["applications", "lenders", "products", "documents"],
  service: ["bookings", "job-cards", "repair-orders", "history"],
  operations: ["employees", "teams", "targets", "attendance", "tasks", "calendar", "documents", "audit-trail"],
} as const;

export function App({ repository: providedRepository }: { repository?: DemoRepository }) {
  const repository = useMemo(() => providedRepository ?? browserRepository(), [providedRepository]);
  const app = useDemoApp(repository);
  const target = isPageKey(app.target.page) ? app.target : { page: "my-day" as const, subview: "overview" };

  useEffect(() => { const onKeyDown = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); app.setSearchOpen(true); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [app.setSearchOpen]);
  const navigate = (next: NavigationTarget) => { const change = () => app.navigate(next); const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches; const transitionDocument = document as ViewTransitionDocument; if (transitionDocument.startViewTransition && !reducedMotion) transitionDocument.startViewTransition(change); else change(); };
  const notify = (title: string, detail?: string) => app.pushToast({ title, detail, tone: "positive" });
  const updateView = <K extends keyof ViewPreferences>(key: K, patch: Partial<ViewPreferences[K]>) => repository.setPreferences({ viewPreferences: { ...app.state.preferences.viewPreferences, [key]: { ...app.state.preferences.viewPreferences[key], ...patch } } });

  const content = (() => {
    if (target.recordType === "vehicle" && target.recordId) { const vehicle = app.state.vehicles.find((item) => item.id === target.recordId); return vehicle ? <VehicleDetail vehicle={vehicle} state={app.state} repository={repository} onBack={() => navigate({ page: "inventory", subview: "list" })} onCreateDeal={() => navigate({ page: "sales", subview: "new-deal", contextId: vehicle.id })} /> : <ExactRecordView target={target} state={app.state} />; }
    if (target.recordType === "customer" && target.recordId) { const customer = app.state.customers.find((item) => item.id === target.recordId); return customer ? <CustomerDetail customer={customer} state={app.state} repository={repository} /> : <ExactRecordView target={target} state={app.state} />; }
    if (target.recordType && target.recordId) return <ExactRecordView target={target} state={app.state} />;
    if (target.page === "my-day") {
      if (target.subview === "action-centre") return <ActionCentreView state={app.state} repository={repository} />;
      if (target.subview === "notifications") return <ActionCentreView state={app.state} repository={repository} view="notifications" />;
      return <MyDayPage state={app.state} repository={repository} onNavigate={navigate} onCommandSelect={(_, result) => { navigate(result.target); notify("Opened connected record", result.title); }} />;
    }
    if (target.page === "inventory") {
      if ((domainSubviews.inventory as readonly string[]).includes(target.subview)) return <DomainWorkspace page="inventory" subview={target.subview} state={app.state} onNavigate={navigate} />;
      return <InventoryPage state={app.state} repository={repository} initialSubview={target.subview} viewPreferences={app.state.preferences.viewPreferences.inventory} onViewPreferencesChange={(patch) => updateView("inventory", patch)} onNavigate={(subview, recordId) => navigate(recordId ? { page: "inventory", subview: recordId, recordType: "vehicle", recordId } : { page: "inventory", subview })} onCreateDeal={(vehicleId) => navigate({ page: "sales", subview: "new-deal", contextId: vehicleId })} />;
    }
    if (target.page === "customers") {
      if ((domainSubviews.customers as readonly string[]).includes(target.subview)) return <DomainWorkspace page="customers" subview={target.subview} state={app.state} onNavigate={navigate} />;
      return <CustomersPage state={app.state} repository={repository} viewPreferences={app.state.preferences.viewPreferences.customers} onViewPreferencesChange={(patch) => updateView("customers", patch)} onOpenCustomer={(recordId) => navigate({ page: "customers", subview: recordId, recordType: "customer", recordId })} />;
    }
    if (target.page === "pipeline") return <PipelinePage state={app.state} repository={repository} />;
    if (target.page === "sales") {
      if (target.subview === "new-deal") return <section className="sales-page crm-page"><header className="crm-heading"><div><p className="crm-eyebrow">Sales · connected vehicle</p><h1>New vehicle deal</h1><p>Create a locally persisted deal linked to the selected inventory record.</p></div></header><DealEntry title="Deal details" state={app.state} repository={repository} initialVehicleId={target.contextId} onCreated={(deal) => navigate({ page: "sales", subview: "deals", recordType: "deal", recordId: deal.id })} /></section>;
      if ((domainSubviews.sales as readonly string[]).includes(target.subview)) return <DomainWorkspace page="sales" subview={target.subview} state={app.state} onNavigate={navigate} />;
      return <SalesPage state={app.state} repository={repository} viewPreferences={app.state.preferences.viewPreferences.sales} onViewPreferencesChange={(patch) => updateView("sales", patch)} />;
    }
    if (target.page === "finance") return (domainSubviews.finance as readonly string[]).includes(target.subview) ? <DomainWorkspace page="finance" subview={target.subview} state={app.state} onNavigate={navigate} /> : <FinancePage state={app.state} repository={repository} />;
    if (target.page === "service") return (domainSubviews.service as readonly string[]).includes(target.subview) ? <DomainWorkspace page="service" subview={target.subview} state={app.state} onNavigate={navigate} /> : <ServicePage state={app.state} repository={repository} viewPreferences={app.state.preferences.viewPreferences.service} onViewPreferencesChange={(patch) => updateView("service", patch)} />;
    if (target.subview === "settings") return <section className="action-centre"><header className="action-centre-heading"><p>Operations</p><h1>Workspace settings</h1></header><p>Demo preferences are stored only in this browser.</p><p>Current branch: {app.state.preferences.branch} · Density: {app.state.preferences.density}</p><Button variant="secondary" onClick={() => app.setActiveOverlay({ kind: "dialog", id: "reset" })}>Reset demo data</Button></section>;
    return <DomainWorkspace page="operations" subview={target.subview} state={app.state} onNavigate={navigate} />;
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
