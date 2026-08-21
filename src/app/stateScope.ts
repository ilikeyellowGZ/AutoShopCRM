import type { DemoState, TaskItem } from "../domain/models";
import { hasPermission, type DemoAccount, type DemoBranch } from "./access";

const groupWideRoles = new Set(["owner", "ceo", "auditor"]);
const individuallyScopedRoles = new Set(["sales", "employee"]);

export function scopeStateForAccount(state: DemoState, account: DemoAccount): DemoState {
  const selectedBranch = account.allowedBranches.includes(state.preferences.branch as DemoBranch) ? state.preferences.branch as DemoBranch : account.homeBranch;
  const visibleBranches = groupWideRoles.has(account.role) ? account.allowedBranches : [selectedBranch];
  const individuallyScoped = individuallyScopedRoles.has(account.role);
  const vehicles = state.vehicles.filter((vehicle) => visibleBranches.includes(vehicle.branch as DemoBranch));
  const vehicleIds = new Set(vehicles.map((vehicle) => vehicle.id));
  const leads = state.leads.filter((lead) => vehicleIds.has(lead.vehicleId) && (!individuallyScoped || lead.owner === account.recordAssignee));
  const leadIds = new Set(leads.map((lead) => lead.id));
  const deals = state.deals.filter((deal) => vehicleIds.has(deal.vehicleId) && (!individuallyScoped || deal.salesRep === account.recordAssignee));
  const dealIds = new Set(deals.map((deal) => deal.id));
  const financeDrafts = state.financeDrafts.filter((draft) => vehicleIds.has(draft.vehicleId));
  const serviceJobs = state.serviceJobs.filter((job) => vehicleIds.has(job.vehicleId) && (!individuallyScoped || job.advisor === account.recordAssignee || job.technician === account.recordAssignee));
  const serviceIds = new Set(serviceJobs.map((job) => job.id));
  const customerIds = new Set([
    ...leads.map((lead) => lead.customerId),
    ...deals.map((deal) => deal.customerId),
    ...serviceJobs.map((job) => job.customerId),
  ]);
  const customers = state.customers.filter((customer) => customerIds.has(customer.id) || (!individuallyScoped && vehicleIds.has(customer.vehicleInterestId)));
  const visibleTask = (task: TaskItem) => {
    if (task.relatedType === "vehicle") return !individuallyScoped && account.pages.includes("inventory") && vehicleIds.has(task.relatedId);
    if (task.relatedType === "lead") return (account.pages.includes("customers") || account.pages.includes("pipeline")) && leadIds.has(task.relatedId);
    if (task.relatedType === "deal") return account.pages.includes("sales") && dealIds.has(task.relatedId);
    return account.pages.includes("service") && serviceIds.has(task.relatedId);
  };
  const tasks = state.tasks.filter(visibleTask);
  const relatedIds = new Set([...vehicleIds, ...leadIds, ...dealIds, ...serviceIds, ...customerIds, ...tasks.map((task) => task.id)]);
  const notifications = state.notifications.filter((notification) => relatedIds.has(notification.relatedId));
  const activities = hasPermission(account, "audit.read") ? state.activities.filter((activity) => activity.targetType === "system" || relatedIds.has(activity.targetId)) : [];
  const draftScope = `${account.id}:${selectedBranch}`;
  const vehicleIntake = state.drafts.vehicleIntakes[draftScope] ?? null;

  return { ...state, vehicles, customers, leads, deals, financeDrafts, serviceJobs, tasks, notifications, activities, preferences: { ...state.preferences, branch: selectedBranch }, drafts: { ...state.drafts, vehicleIntake, vehicleIntakes: vehicleIntake ? { [draftScope]: vehicleIntake } : {} } };
}
