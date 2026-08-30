import { useEffect, useMemo, useState, useRef } from "react";
import { Button } from "../components/controls/Button";
import { ToastRegion } from "../components/feedback/ToastRegion";
import { EmployeeShell } from "../components/navigation/EmployeeShell";
import { Dialog } from "../components/overlays/Dialog";
import type { ViewPreferences } from "../domain/models";
import { ActionCentreView } from "../features/action-centre/ActionCentreView";
import { CommandPalette } from "../features/action-centre/CommandPalette";
import { CustomerDetail } from "../features/customers/CustomerDetail";
import { CustomersPage } from "../features/customers/CustomersPage";
import { FinancePage } from "../features/finance/FinancePage";
import { InventoryPage } from "../features/inventory/InventoryPage";
import { MyDayPage } from "../features/my-day/MyDayPage";
import { PipelinePage } from "../features/pipeline/PipelinePage";
import { BoardsPage } from "../features/work/BoardsPage";
import { DealEntry } from "../features/sales/DealEntry";
import { SalesPage } from "../features/sales/SalesPage";
import { ServicePage } from "../features/service/ServicePage";
import type { DemoRepository } from "../repository/demoRepository";
import { createDemoRepository } from "../repository/demoRepository";
import { canAccessTarget, getDemoAccount, hasPermission, initialTargetForAccount, type DemoAccount, type DemoRole } from "./access";
import { DomainWorkspace, ExactRecordView } from "./DomainWorkspace";
import { LoginPage } from "./LoginPage";
import { pageKeys, type NavigationTarget, type PageKey } from "./routes";
import { scopeStateForAccount } from "./stateScope";
import { targetFromPreferences, useDemoApp } from "./useDemoApp";

type ViewTransitionDocument = Document & { startViewTransition?: (callback: () => void) => unknown };
type AppProps = { repository?: DemoRepository; initialAccountId?: DemoRole | null };

const isPageKey = (value: string): value is PageKey => (pageKeys as readonly string[]).includes(value);
const browserRepository = () => createDemoRepository(window.localStorage);
const domainSubviews = {
  inventory: ["appraisals", "trade-ins", "recon", "transfers", "pricing"],
  customers: ["leads", "follow-ups", "appointments", "test-drives"],
  sales: ["deals", "quotations", "approvals", "deliveries", "commissions"],
  finance: ["applications", "lenders", "products", "documents"],
  service: ["bookings", "job-cards", "repair-orders", "history"],
} as const;

export function App({ repository: providedRepository, initialAccountId }: AppProps) {
  const repository = useMemo(() => providedRepository ?? browserRepository(), [providedRepository]);
  const defaultAccountId = initialAccountId === undefined ? (providedRepository ? "owner" : null) : initialAccountId;
  const [accountId, setAccountId] = useState<DemoRole | null>(defaultAccountId);
  const sessionId = useRef<string | null>(null);
  const [usesPersistedTarget, setUsesPersistedTarget] = useState(initialAccountId === undefined);
  const account = accountId ? getDemoAccount(accountId) : null;
  const app = useDemoApp(repository);
  const scopedState = account ? scopeStateForAccount(app.state, account) : app.state;
  const scopedTarget = targetFromPreferences(scopedState.preferences);
  const persistedTarget = isPageKey(scopedTarget.page) ? scopedTarget : { page: "my-day" as const, subview: "overview" };
  const target = account && usesPersistedTarget && canAccessTarget(account, persistedTarget) ? persistedTarget : account ? initialTargetForAccount(account) : persistedTarget;

  useEffect(() => {
    if (!account) return;
    repository.setAuditActor(`${account.name} · ${account.title}`);
    if (!usesPersistedTarget) {
      if (app.state.preferences.branch !== account.homeBranch) repository.setPreferences({ branch: account.homeBranch });
      app.navigate(initialTargetForAccount(account));
      setUsesPersistedTarget(true);
      return;
    }
    if (!canAccessTarget(account, persistedTarget)) app.navigate(initialTargetForAccount(account));
    if (!account.allowedBranches.includes(app.state.preferences.branch as DemoAccount["homeBranch"])) repository.setPreferences({ branch: account.homeBranch });
  }, [account, app.navigate, app.state.preferences.branch, persistedTarget.page, persistedTarget.subview, repository, usesPersistedTarget]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (account && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); app.setSearchOpen(true); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [account, app.setSearchOpen]);

  const notify = (title: string, detail?: string) => app.pushToast({ title, detail, tone: "positive" });
  const navigate = (next: NavigationTarget) => {
    if (!account || !canAccessTarget(account, next)) {
      app.pushToast({ title: "Access limited for this demo role", detail: "Choose an available destination or sign in with another account.", tone: "warning" });
      return;
    }
    if (sessionId.current) repository.touchSession(sessionId.current);
    const change = () => app.navigate(next);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const transitionDocument = document as ViewTransitionDocument;
    if (transitionDocument.startViewTransition && !reducedMotion) transitionDocument.startViewTransition(change); else change();
  };
  const updateView = <K extends keyof ViewPreferences>(key: K, patch: Partial<ViewPreferences[K]>) => repository.setPreferences({ viewPreferences: { ...app.state.preferences.viewPreferences, [key]: { ...app.state.preferences.viewPreferences[key], ...patch } } });
  const signIn = (nextAccount: DemoAccount) => {
    repository.setAuditActor(`${nextAccount.name} · ${nextAccount.title}`);
    repository.setPreferences({ branch: nextAccount.homeBranch, activePage: nextAccount.initialTarget.page, activeSubview: nextAccount.initialTarget.subview, activeRecordType: undefined, activeRecordId: undefined, activeContextId: undefined });
    sessionId.current = repository.startSession(nextAccount, typeof navigator === "undefined" ? "unknown" : navigator.userAgent);
    setUsesPersistedTarget(true);
    setAccountId(nextAccount.id);
  };
  const signOut = () => {
    if (sessionId.current) repository.endSession(sessionId.current);
    sessionId.current = null;
    app.closeOverlay();
    app.setSearchOpen(false);
    repository.setAuditActor("Weelee Employee");
    setAccountId(null);
  };

  if (!account) return <LoginPage onSignIn={signIn} />;

  const canWriteInventory = hasPermission(account, "inventory.write");
  const canCreateDeal = hasPermission(account, "sales.write");
  const canWriteCustomers = hasPermission(account, "customers.write");
  const canWritePipeline = hasPermission(account, "pipeline.write");
  const canWriteFinance = hasPermission(account, "finance.write");
  const canWriteService = hasPermission(account, "service.write");
  const canManageTasks = hasPermission(account, "tasks.write");
  const canMarkNotifications = hasPermission(account, "notifications.write");
  const canViewInventoryCost = hasPermission(account, "inventory.cost.read");
  const canViewFinance = hasPermission(account, "finance.read");
  const canViewDealFinancials = hasPermission(account, "deal.financial.read");
  const canViewSalesPerformance = hasPermission(account, "sales.performance.read");
  const canViewSalesApprovals = hasPermission(account, "sales.approvals.read");
  const canExportSales = hasPermission(account, "sales.export");
  const canViewAudit = hasPermission(account, "audit.read");
  const lockIndividualAssignee = account.role === "sales";
  const content = (() => {
    if (target.recordType === "customer" && target.recordId) {
      const customer = scopedState.customers.find((item) => item.id === target.recordId);
      return customer ? <CustomerDetail customer={customer} state={scopedState} repository={repository} canWrite={canWriteCustomers} canViewFinancials={canViewDealFinancials || canViewFinance} canViewService={account.pages.includes("service")} canViewAudit={canViewAudit} /> : <ExactRecordView target={target} state={scopedState} />;
    }
    if (target.recordType && target.recordId && target.recordType !== "vehicle") return <ExactRecordView target={target} state={scopedState} />;
    if (target.page === "my-day") {
      if (target.subview === "action-centre") return <ActionCentreView state={scopedState} repository={repository} onNavigate={navigate} canManageTasks={canManageTasks} />;
      if (target.subview === "notifications") return <ActionCentreView state={scopedState} repository={repository} view="notifications" onNavigate={navigate} canMarkNotifications={canMarkNotifications} />;
      return <MyDayPage state={scopedState} repository={repository} employeeName={account.name} canManageTasks={canManageTasks} canViewPipeline={account.pages.includes("pipeline") && canViewSalesPerformance} canViewApprovals={canViewSalesApprovals} canViewAudit={canViewAudit} canNavigateTarget={(next) => canAccessTarget(account, next)} onNavigate={navigate} onCommandSelect={(_, result) => { navigate(result.target); notify("Opened connected record", result.title); }} />;
    }
    if (target.page === "inventory") {
      if ((domainSubviews.inventory as readonly string[]).includes(target.subview)) return <DomainWorkspace page="inventory" subview={target.subview} state={scopedState} onNavigate={navigate} />;
      return <InventoryPage state={scopedState} repository={repository} initialSubview={target.subview} viewPreferences={scopedState.preferences.viewPreferences.inventory} onViewPreferencesChange={(patch) => updateView("inventory", patch)} onNavigate={(subview, recordId) => navigate(recordId ? { page: "inventory", subview: recordId, recordType: "vehicle", recordId } : { page: "inventory", subview })} onCreateDeal={(vehicleId) => navigate({ page: "sales", subview: "new-deal", contextId: vehicleId })} canWrite={canWriteInventory} canCreateDeal={canCreateDeal} allowedBranches={account.allowedBranches} draftScopeKey={`${account.id}:${scopedState.preferences.branch}`} canViewCost={canViewInventoryCost} canViewFinance={canViewFinance} canViewSalesInsights={canViewDealFinancials} canViewAudit={canViewAudit} />;
    }
    if (target.page === "customers") {
      if ((domainSubviews.customers as readonly string[]).includes(target.subview)) return <DomainWorkspace page="customers" subview={target.subview} state={scopedState} onNavigate={navigate} />;
      return <CustomersPage state={scopedState} repository={repository} canWrite={canWriteCustomers} viewPreferences={scopedState.preferences.viewPreferences.customers} onViewPreferencesChange={(patch) => updateView("customers", patch)} onOpenCustomer={(recordId) => navigate({ page: "customers", subview: recordId, recordType: "customer", recordId })} />;
    }
    if (target.page === "work") return <BoardsPage state={scopedState} repository={repository} boardId={target.subview === "boards" ? undefined : target.subview} onNavigate={navigate} canWriteItems={hasPermission(account, "work.item.write")} canManageViews={hasPermission(account, "work.view.manage")} authorEmployeeId={scopedState.employees.find((employee) => employee.name === account.name)?.id} />;
    if (target.page === "pipeline") return <PipelinePage state={scopedState} repository={repository} onNavigate={navigate} canWrite={canWritePipeline} defaultOwner={account.recordAssignee} lockOwner={lockIndividualAssignee} />;
    if (target.page === "sales") {
      if (target.subview === "new-deal") return <section className="sales-page crm-page"><header className="crm-heading"><div><p className="crm-eyebrow">Sales · connected vehicle</p><h1>New vehicle deal</h1><p>Create a locally persisted deal linked to the selected inventory record.</p></div></header><DealEntry title="Deal details" state={scopedState} repository={repository} initialVehicleId={target.contextId} defaultSalesRep={account.recordAssignee} lockSalesRep={lockIndividualAssignee} onCreated={(deal) => navigate({ page: "sales", subview: "deals", recordType: "deal", recordId: deal.id })} /></section>;
      if ((domainSubviews.sales as readonly string[]).includes(target.subview)) return <DomainWorkspace page="sales" subview={target.subview} state={scopedState} onNavigate={navigate} canViewFinancials={canViewDealFinancials} />;
      return <SalesPage state={scopedState} repository={repository} canWrite={canCreateDeal} canViewFinancials={canViewDealFinancials} canExport={canExportSales} defaultSalesRep={account.recordAssignee} lockSalesRep={lockIndividualAssignee} viewPreferences={scopedState.preferences.viewPreferences.sales} onViewPreferencesChange={(patch) => updateView("sales", patch)} onNavigate={navigate} />;
    }
    if (target.page === "finance") return (domainSubviews.finance as readonly string[]).includes(target.subview) ? <DomainWorkspace page="finance" subview={target.subview} state={scopedState} onNavigate={navigate} /> : <FinancePage state={scopedState} repository={repository} initialVehicleId={target.contextId} canWrite={canWriteFinance} />;
    if (target.page === "service") return (domainSubviews.service as readonly string[]).includes(target.subview) ? <DomainWorkspace page="service" subview={target.subview} state={scopedState} onNavigate={navigate} /> : <ServicePage state={scopedState} repository={repository} canWrite={canWriteService} viewPreferences={scopedState.preferences.viewPreferences.service} onViewPreferencesChange={(patch) => updateView("service", patch)} onNavigate={navigate} />;
    if (target.subview === "settings") return <section className="action-centre"><header className="action-centre-heading"><p>Operations</p><h1>Workspace settings</h1></header><p>Demo preferences are stored only in this browser.</p><p>Current branch: {scopedState.preferences.branch} · Density: {scopedState.preferences.density}</p><Button variant="secondary" onClick={() => app.setActiveOverlay({ kind: "dialog", id: "reset" })}>Reset demo data</Button></section>;
    return <DomainWorkspace page="operations" subview={target.subview} state={scopedState} onNavigate={navigate} />;
  })();

  return <EmployeeShell activePage={target.page} onNavigate={navigate} canNavigate={(next) => canAccessTarget(account, next)} branch={scopedState.preferences.branch} employeeName={account.name} employeeRole={account.title} actionCount={scopedState.tasks.filter((task) => task.status !== "Completed").length} notificationCount={scopedState.notifications.filter((notification) => !notification.read).length} onSearch={() => app.setSearchOpen(true)} onBranch={hasPermission(account, "branch.switch") ? () => app.setActiveOverlay({ kind: "dialog", id: "branch" }) : undefined} onEmployeeMenu={() => app.setActiveOverlay({ kind: "dialog", id: "employee" })}>
    {account.role === "auditor" ? <p className="access-context" role="status">Read-only demo view</p> : null}
    {content}
    <CommandPalette open={app.searchOpen} state={scopedState} onClose={() => app.setSearchOpen(false)} filterResult={(result) => canAccessTarget(account, result.target)} onSelect={(result) => { navigate(result.target); notify("Opened connected record", result.title); }} />
    {hasPermission(account, "demo.reset") ? <Dialog open={app.activeOverlay?.id === "reset"} title="Reset demo data" onClose={app.closeOverlay}><p>This restores the deterministic Weelee demonstration data in this browser. This cannot be undone.</p><div className="modal-footer"><Button variant="secondary" onClick={app.closeOverlay}>Cancel</Button><Button onClick={() => { repository.reset(); sessionId.current = repository.startSession(account, typeof navigator === "undefined" ? "unknown" : navigator.userAgent); app.closeOverlay(); notify("Demo data reset", "The deterministic demo data was restored."); }}>Reset demo data</Button></div></Dialog> : null}
    <Dialog open={app.activeOverlay?.id === "branch"} title="Select branch" onClose={app.closeOverlay}><p>Choose the current employee branch for this local demo.</p>{account.allowedBranches.map((branch) => <Button key={branch} variant="secondary" onClick={() => { repository.setPreferences({ branch }); app.closeOverlay(); }}>{branch}</Button>)}</Dialog>
    <Dialog open={app.activeOverlay?.id === "employee"} title="Employee demo controls" onClose={app.closeOverlay}><p>{account.name} · {account.title} · {account.email}</p>{hasPermission(account, "settings.manage") ? <Button variant="secondary" onClick={() => { app.closeOverlay(); navigate({ page: "operations", subview: "settings" }); }}>Open workspace settings</Button> : null}{hasPermission(account, "demo.reset") ? <Button variant="secondary" onClick={() => { app.closeOverlay(); app.setActiveOverlay({ kind: "dialog", id: "reset" }); }}>Reset demo data</Button> : null}<Button variant="secondary" onClick={signOut}>Sign out</Button></Dialog>
    <ToastRegion toasts={app.toasts} onDismiss={app.dismissToast} />
  </EmployeeShell>;
}

export default App;
