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

function OperationsView({ subview, repository, state, onReset }: { subview: string; repository: DemoRepository; state: ReturnType<DemoRepository["getState"]>; onReset: () => void }) {
  if (subview === "tasks") return <ActionCentreView state={state} repository={repository} />;
  if (subview === "calendar") return <section className="action-centre" aria-labelledby="calendar-title"><header className="action-centre-heading"><p>Operations</p><h1 id="calendar-title">Calendar</h1></header><ul className="action-centre-list">{state.tasks.map((task) => <li key={task.id}><div><strong>{task.title}</strong><p>{task.detail}</p></div><time dateTime={task.dueAt}>{new Intl.DateTimeFormat("en-NA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(task.dueAt))}</time></li>)}</ul></section>;
  if (subview === "audit-trail") return <section className="action-centre" aria-labelledby="audit-title"><header className="action-centre-heading"><p>Operations</p><h1 id="audit-title">Audit trail</h1></header><ul className="action-centre-list">{state.activities.map((activity) => <li key={activity.id}><div><strong>{activity.action}</strong><p>{activity.detail}</p></div><time dateTime={activity.occurredAt}>{new Intl.DateTimeFormat("en-NA", { dateStyle: "medium", timeStyle: "short" }).format(new Date(activity.occurredAt))}</time></li>)}</ul></section>;
  return <section className="action-centre" aria-labelledby="operations-title"><header className="action-centre-heading"><p>Operations</p><h1 id="operations-title">{subview === "settings" ? "Workspace settings" : "Employee operations"}</h1></header><p>{subview === "settings" ? "Demo preferences are stored only in this browser." : "Use the connected task, calendar, customer and sales workspaces to manage this employee demo."}</p>{subview === "settings" ? <Button variant="secondary" onClick={onReset}>Reset demo data</Button> : <p>Branch: {state.preferences.branch} · Density: {state.preferences.density}</p>}</section>;
}

export function App({ repository: providedRepository }: { repository?: DemoRepository }) {
  const repository = useMemo(() => providedRepository ?? browserRepository(), [providedRepository]);
  const app = useDemoApp(repository);
  const [resetOpen, setResetOpen] = useState(false);
  const target = isPageKey(app.target.page) ? app.target : { page: "my-day" as const, subview: "overview" };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); app.setSearchOpen(true); } };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [app.setSearchOpen]);

  const navigate = (next: NavigationTarget) => {
    const change = () => app.navigate(next);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const transition = (document as ViewTransitionDocument).startViewTransition;
    if (transition && !reducedMotion) transition(change); else change();
  };
  const notify = (title: string, detail?: string) => app.pushToast({ title, detail, tone: "positive" });
  const content = (() => {
    switch (target.page) {
      case "my-day":
        if (target.subview === "action-centre") return <ActionCentreView state={app.state} repository={repository} />;
        if (target.subview === "notifications") return <ActionCentreView state={app.state} repository={repository} view="notifications" />;
        return <MyDayPage state={app.state} repository={repository} onNavigate={navigate} onCommandSelect={(_, result) => { navigate(result.target); notify("Opened connected record", result.title); }} />;
      case "inventory": return <InventoryPage key={`${target.page}-${target.subview}`} state={app.state} repository={repository} initialSubview={target.subview} onNavigate={(subview) => navigate({ page: "inventory", subview })} />;
      case "customers": {
        const customer = app.state.customers.find((item) => item.id === target.subview);
        return customer ? <CustomerDetail customer={customer} state={app.state} repository={repository} /> : <CustomersPage state={app.state} repository={repository} onOpenCustomer={(customerId) => navigate({ page: "customers", subview: customerId })} />;
      }
      case "pipeline": return <PipelinePage state={app.state} repository={repository} />;
      case "sales": return <SalesPage state={app.state} repository={repository} />;
      case "finance": return <FinancePage state={app.state} repository={repository} />;
      case "service": return <ServicePage state={app.state} repository={repository} />;
      case "operations": return <OperationsView subview={target.subview} repository={repository} state={app.state} onReset={() => setResetOpen(true)} />;
    }
  })();

  return <EmployeeShell activePage={target.page} onNavigate={navigate} branch={app.state.preferences.branch} actionCount={app.state.tasks.filter((task) => task.status !== "Completed").length} notificationCount={app.state.notifications.filter((notification) => !notification.read).length} onSearch={() => app.setSearchOpen(true)}>
    {content}
    <CommandPalette open={app.searchOpen} state={app.state} onClose={() => app.setSearchOpen(false)} onSelect={(result) => { navigate(result.target); notify("Opened connected record", result.title); }} />
    <Dialog open={resetOpen} title="Reset demo data" onClose={() => setResetOpen(false)}><p>This restores the deterministic Weelee demonstration data in this browser. This cannot be undone.</p><div className="modal-footer"><Button variant="secondary" onClick={() => setResetOpen(false)}>Cancel</Button><Button onClick={() => { repository.reset(); setResetOpen(false); navigate({ page: "my-day", subview: "overview" }); notify("Demo data reset", "The deterministic demo data was restored."); }}>Reset demo data</Button></div></Dialog>
    <ToastRegion toasts={app.toasts} onDismiss={app.dismissToast} />
  </EmployeeShell>;
}

export default App;
