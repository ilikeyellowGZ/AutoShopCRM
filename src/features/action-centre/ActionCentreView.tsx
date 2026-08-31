import { useState } from "react";
import type { DemoRepository } from "../../repository/demoRepository";
import { notificationCategories, type DemoState, type NotificationCategory } from "../../domain/models";
import { Button } from "../../components/controls/Button";
import { StatusPill } from "../../components/controls/StatusPill";
import { demoClock, nextDemoDayAtNine, type DemoClock } from "../../domain/demoClock";
import { formatRelativeTime, formatTimeRemaining } from "../../domain/timeDisplay";
import type { NavigationTarget } from "../../app/routes";
import { targetForRelatedId, taskRelatedTarget } from "../../app/recordTargets";

type NotificationRepository = Pick<DemoRepository, "markNotificationRead" | "markAllNotificationsRead">;
type ActionCentreViewProps = { state: DemoState; repository: Pick<DemoRepository, "completeTask" | "rescheduleTask" | "markNotificationRead" | "markAllNotificationsRead">; view?: "actions" | "notifications"; clock?: DemoClock; onNavigate?: (target: NavigationTarget) => void; canManageTasks?: boolean; canMarkNotifications?: boolean };
type NotificationCentreProps = { state: DemoState; repository: NotificationRepository; clock: DemoClock; onNavigate?: (target: NavigationTarget) => void; canMarkNotifications: boolean };

const categoryLabels: Record<NotificationCategory, string> = { mention: "Mentions", deal: "Deals", lead: "Leads", customer: "Customers", inventory: "Inventory", service: "Service", task: "Tasks", system: "System" };

function NotificationCentre({ state, repository, clock, onNavigate, canMarkNotifications }: NotificationCentreProps) {
  const [category, setCategory] = useState<NotificationCategory | "all">("all");
  const ordered = [...state.notifications].sort((first, second) => second.createdAt.localeCompare(first.createdAt));
  const present = notificationCategories.filter((candidate) => state.notifications.some((notification) => notification.category === candidate));
  const active = category !== "all" && present.includes(category) ? category : "all";
  const visible = active === "all" ? ordered : ordered.filter((notification) => notification.category === active);
  const unread = state.notifications.filter((notification) => !notification.read).length;
  const unreadVisible = visible.filter((notification) => !notification.read);
  const now = clock.now();

  return <section className="action-centre" aria-labelledby="notifications-title">
    <header className="action-centre-heading"><p>Command</p><h1 id="notifications-title">Notifications</h1><span>{unread} unread</span></header>
    <div className="action-centre-buttons" role="group" aria-label="Filter notifications by category">
      <Button variant={active === "all" ? "primary" : "secondary"} aria-pressed={active === "all"} onClick={() => setCategory("all")}>All</Button>
      {present.map((candidate) => <Button key={candidate} variant={active === candidate ? "primary" : "secondary"} aria-pressed={active === candidate} onClick={() => setCategory(candidate)}>{categoryLabels[candidate]}</Button>)}
      {unreadVisible.length && canMarkNotifications ? <Button variant="secondary" onClick={() => repository.markAllNotificationsRead(unreadVisible.map((notification) => notification.id))}>Mark all read</Button> : null}
    </div>
    <ul className="action-centre-list notification-list">{visible.length ? visible.map((notification) => {
      const target = targetForRelatedId(state, notification.relatedId);
      return <li key={notification.id} className={notification.read ? "notification-row" : "notification-row notification-row--unread"}>
        <div className="notification-row-body">
          <span className="notification-unread-dot" aria-hidden="true" />
          <div className="notification-row-text">
            <div className="notification-row-heading"><strong>{notification.title}</strong><time className="notification-row-time" dateTime={notification.createdAt}>{formatRelativeTime(notification.createdAt, now)}</time></div>
            <p>{notification.detail}</p>
            {notification.priority === "high" ? <StatusPill tone="critical">High priority</StatusPill> : null}
          </div>
        </div>
        <div className="action-centre-buttons">
          {target && onNavigate ? <Button variant="secondary" onClick={() => onNavigate(target)}>Open related record</Button> : null}
          {!notification.read && canMarkNotifications ? <Button variant="secondary" onClick={() => repository.markNotificationRead(notification.id)}>Mark read</Button> : null}
        </div>
      </li>;
    }) : <li className="my-day-empty">No notifications in this view.</li>}</ul>
  </section>;
}

export function ActionCentreView({ state, repository, view = "actions", clock = demoClock, onNavigate, canManageTasks = true, canMarkNotifications = true }: ActionCentreViewProps) {
  if (view === "notifications") return <NotificationCentre state={state} repository={repository} clock={clock} onNavigate={onNavigate} canMarkNotifications={canMarkNotifications} />;

  const actions = state.tasks.filter((task) => task.status !== "Completed");
  const now = clock.now();
  return <section className="action-centre" aria-labelledby="action-centre-title"><header className="action-centre-heading"><p>Command</p><h1 id="action-centre-title">Action Centre</h1><span>{actions.length} open</span></header><ul className="action-centre-list">{actions.length ? actions.map((task) => <li key={task.id}><div><StatusPill tone={task.tone}>{task.status}</StatusPill><strong>{task.title}</strong><p>{task.detail}</p><time className="action-centre-eta" dateTime={task.dueAt}>{formatTimeRemaining(task.dueAt, now)}</time></div><div className="action-centre-buttons">{onNavigate ? <Button variant="secondary" onClick={() => onNavigate(taskRelatedTarget(task))}>Open related record</Button> : null}{canManageTasks ? <><Button variant="secondary" onClick={() => repository.rescheduleTask(task.id, nextDemoDayAtNine(clock.now(), task.dueAt))}>Reschedule</Button><Button onClick={() => repository.completeTask(task.id)}>Complete</Button></> : null}</div></li>) : <li className="my-day-empty">No open actions. Your day is clear.</li>}</ul></section>;
}
