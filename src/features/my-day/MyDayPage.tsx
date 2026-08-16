import type { DemoRepository } from "../../repository/demoRepository";
import { useState } from "react";
import type { DemoState, TaskItem } from "../../domain/models";
import type { NavigationTarget } from "../../app/routes";
import { selectDashboardMetrics } from "../../domain/selectors";
import { MetricBlock } from "../../components/data-display/MetricBlock";
import { Button } from "../../components/controls/Button";
import { StatusPill } from "../../components/controls/StatusPill";
import { demoClock, nextDemoDayAtNine, type DemoClock } from "../../domain/demoClock";
import { CommandPalette } from "../action-centre/CommandPalette";
import type { CommandSearchResult } from "../action-centre/commandSearch";

type MyDayPageProps = {
  state: DemoState;
  repository: Pick<DemoRepository, "completeTask" | "rescheduleTask">;
  onNavigate: (target: NavigationTarget) => void;
  onCommandSelect?: (target: NavigationTarget, result: CommandSearchResult) => void;
  clock?: DemoClock;
};

const dateFormat = new Intl.DateTimeFormat("en-NA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const timeFormat = new Intl.DateTimeFormat("en-NA", { hour: "2-digit", minute: "2-digit" });
const currency = new Intl.NumberFormat("en-NA", { style: "currency", currency: "NAD", maximumFractionDigits: 0 });

function TaskRow({ task, onComplete, onReschedule, onNavigate }: { task: TaskItem; onComplete: () => void; onReschedule: () => void; onNavigate: () => void }) {
  return <li className="my-day-task">
    <div><StatusPill tone={task.tone}>{task.status}</StatusPill><strong>{task.title}</strong><p>{task.detail}</p><button type="button" className="my-day-link" onClick={onNavigate}>Open related record</button></div>
    <div className="my-day-task-actions"><time dateTime={task.dueAt}>{timeFormat.format(new Date(task.dueAt))}</time><Button variant="secondary" onClick={onReschedule}>Reschedule</Button><Button onClick={onComplete}>Complete</Button></div>
  </li>;
}

export function relatedRecordTarget(task: TaskItem): NavigationTarget {
  if (task.relatedType === "vehicle") return { page: "inventory", subview: task.relatedId, recordType: "vehicle", recordId: task.relatedId };
  if (task.relatedType === "deal") return { page: "sales", subview: "deals", recordType: "deal", recordId: task.relatedId };
  if (task.relatedType === "lead") return { page: "customers", subview: "leads", recordType: "lead", recordId: task.relatedId };
  return { page: "service", subview: "service-board", recordType: "service", recordId: task.relatedId };
}

export function MyDayPage({ state, repository, onNavigate, onCommandSelect, clock = demoClock }: MyDayPageProps) {
  const [commandOpen, setCommandOpen] = useState(false);
  const metrics = selectDashboardMetrics(state);
  const activeTasks = state.tasks.filter((task) => task.status !== "Completed");
  const priorityTasks = [...activeTasks].sort((a, b) => (a.status === "Overdue" ? -1 : 0) - (b.status === "Overdue" ? -1 : 0)).slice(0, 4);
  const approvals = state.deals.filter((deal) => deal.status === "Approval");
  const agenda = [...activeTasks].sort((a, b) => a.dueAt.localeCompare(b.dueAt)).slice(0, 5);

  return <div className="my-day-page">
    <header className="my-day-heading"><p>Employee workspace</p><div className="my-day-heading-row"><div><h1>Good morning, Anele.</h1><time dateTime={clock.now()}>{dateFormat.format(new Date(clock.now()))}</time></div><Button variant="secondary" className="my-day-action-search" aria-haspopup="dialog" aria-expanded={commandOpen} onClick={() => setCommandOpen(true)}>Action Search</Button></div></header>
    <section className="my-day-metrics" aria-label="Today at a glance"><MetricBlock label="Due today" value={metrics.dueTodayTasks} detail="Actions requiring attention" /><MetricBlock label="Active pipeline" value={metrics.activePipelineCount} detail={currency.format(metrics.activePipelineValue)} /><MetricBlock label="Available stock" value={metrics.availableVehicles} detail={`${metrics.inTransitVehicles} in transit`} /><MetricBlock label="Unread updates" value={metrics.unreadNotifications} detail="Branch and customer activity" /></section>
    <section className="my-day-grid">
      <section aria-labelledby="priority-actions"><div className="my-day-section-heading"><div><p>Focus</p><h2 id="priority-actions">Priority actions</h2></div><Button variant="secondary" onClick={() => onNavigate({ page: "my-day", subview: "action-centre" })}>View all actions</Button></div><ul className="my-day-list">{priorityTasks.length ? priorityTasks.map((task) => <TaskRow key={task.id} task={task} onComplete={() => repository.completeTask(task.id)} onReschedule={() => repository.rescheduleTask(task.id, nextDemoDayAtNine(clock.now(), task.dueAt))} onNavigate={() => onNavigate(relatedRecordTarget(task))} />) : <li className="my-day-empty">No priority actions right now.</li>}</ul></section>
      <section aria-labelledby="agenda"><div className="my-day-section-heading"><div><p>Schedule</p><h2 id="agenda">Today’s agenda</h2></div></div><ol className="my-day-agenda">{agenda.map((task) => <li key={task.id}><time dateTime={task.dueAt}>{timeFormat.format(new Date(task.dueAt))}</time><div><strong>{task.title}</strong><p>{task.detail}</p></div></li>)}</ol></section>
    </section>
    <section className="my-day-grid">
      <section aria-labelledby="approvals"><div className="my-day-section-heading"><div><p>Sales desk</p><h2 id="approvals">Approvals</h2></div><Button variant="secondary" onClick={() => onNavigate({ page: "sales", subview: "approvals" })}>Open approvals</Button></div><ul className="my-day-list">{approvals.map((deal) => <li className="my-day-compact-row" key={deal.id}><div><strong>{deal.id}</strong><p>Margin approval for {state.customers.find((customer) => customer.id === deal.customerId)?.name ?? "customer"}</p></div><StatusPill tone="warning">Approval</StatusPill></li>)}</ul></section>
      <section aria-labelledby="branch-activity"><div className="my-day-section-heading"><div><p>Branch pulse</p><h2 id="branch-activity">Recent activity</h2></div></div><ul className="my-day-list">{state.activities.slice(0, 4).map((activity) => <li className="my-day-compact-row" key={activity.id}><div><strong>{activity.action}</strong><p>{activity.detail}</p></div><StatusPill tone={activity.tone}>{activity.actor}</StatusPill></li>)}</ul></section>
    </section>
    <CommandPalette open={commandOpen} state={state} onClose={() => setCommandOpen(false)} onSelect={(result) => { if (onCommandSelect) onCommandSelect(result.target, result); else onNavigate(result.target); }} />
  </div>;
}
