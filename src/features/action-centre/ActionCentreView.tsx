import type { DemoRepository } from "../../repository/demoRepository";
import type { DemoState } from "../../domain/models";
import { Button } from "../../components/controls/Button";
import { StatusPill } from "../../components/controls/StatusPill";
import { demoClock, nextDemoDayAtNine, type DemoClock } from "../../domain/demoClock";
import type { NavigationTarget } from "../../app/routes";
import { targetForRelatedId, taskRelatedTarget } from "../../app/recordTargets";

type ActionCentreViewProps = { state: DemoState; repository: Pick<DemoRepository, "completeTask" | "rescheduleTask" | "markNotificationRead">; view?: "actions" | "notifications"; clock?: DemoClock; onNavigate?: (target: NavigationTarget) => void; canManageTasks?: boolean; canMarkNotifications?: boolean };

export function ActionCentreView({ state, repository, view = "actions", clock = demoClock, onNavigate, canManageTasks = true, canMarkNotifications = true }: ActionCentreViewProps) {
  if (view === "notifications") return <section className="action-centre" aria-labelledby="notifications-title"><header className="action-centre-heading"><p>Command</p><h1 id="notifications-title">Notifications</h1><span>{state.notifications.filter((notification) => !notification.read).length} unread</span></header><ul className="action-centre-list">{state.notifications.map((notification) => { const target = targetForRelatedId(state, notification.relatedId); return <li key={notification.id}><div><StatusPill tone={notification.tone}>{notification.read ? "Read" : "Unread"}</StatusPill><strong>{notification.title}</strong><p>{notification.detail}</p></div><div className="action-centre-buttons">{target && onNavigate ? <Button variant="secondary" onClick={() => onNavigate(target)}>Open related record</Button> : null}{!notification.read && canMarkNotifications ? <Button variant="secondary" onClick={() => repository.markNotificationRead(notification.id)}>Mark read</Button> : null}</div></li>; })}</ul></section>;

  const actions = state.tasks.filter((task) => task.status !== "Completed");
  return <section className="action-centre" aria-labelledby="action-centre-title"><header className="action-centre-heading"><p>Command</p><h1 id="action-centre-title">Action Centre</h1><span>{actions.length} open</span></header><ul className="action-centre-list">{actions.length ? actions.map((task) => <li key={task.id}><div><StatusPill tone={task.tone}>{task.status}</StatusPill><strong>{task.title}</strong><p>{task.detail}</p></div><div className="action-centre-buttons">{onNavigate ? <Button variant="secondary" onClick={() => onNavigate(taskRelatedTarget(task))}>Open related record</Button> : null}{canManageTasks ? <><Button variant="secondary" onClick={() => repository.rescheduleTask(task.id, nextDemoDayAtNine(clock.now(), task.dueAt))}>Reschedule</Button><Button onClick={() => repository.completeTask(task.id)}>Complete</Button></> : null}</div></li>) : <li className="my-day-empty">No open actions. Your day is clear.</li>}</ul></section>;
}
