import type { DemoState, TaskItem } from "../domain/models";
import { hasPermission, type DemoAccount, type DemoBranch } from "./access";

export function scopeStateForAccount(state: DemoState, account: DemoAccount): DemoState {
  const selectedBranch = account.allowedBranches.includes(state.preferences.branch as DemoBranch) ? state.preferences.branch as DemoBranch : account.homeBranch;
  const visibleBranches = account.dataScope === "organization" ? account.allowedBranches : [selectedBranch];
  const individuallyScoped = account.dataScope === "own";
  const vehicles = state.vehicles.filter((vehicle) => visibleBranches.includes(vehicle.branch as DemoBranch));
  const vehicleIds = new Set(vehicles.map((vehicle) => vehicle.id));
  const leads = state.leads.filter((lead) => vehicleIds.has(lead.vehicleId) && (!individuallyScoped || lead.owner === account.recordAssignee));
  const leadIds = new Set(leads.map((lead) => lead.id));
  const deals = state.deals.filter((deal) => vehicleIds.has(deal.vehicleId) && (!individuallyScoped || deal.salesRep === account.recordAssignee));
  const dealIds = new Set(deals.map((deal) => deal.id));
  const canViewFinance = hasPermission(account, "finance.read");
  const financeDrafts = canViewFinance ? state.financeDrafts.filter((draft) => vehicleIds.has(draft.vehicleId)) : [];
  const serviceJobs = state.serviceJobs.filter((job) => vehicleIds.has(job.vehicleId) && (!individuallyScoped || job.advisor === account.recordAssignee || job.technician === account.recordAssignee));
  const serviceIds = new Set(serviceJobs.map((job) => job.id));
  const customerIds = new Set([
    ...leads.map((lead) => lead.customerId),
    ...deals.map((deal) => deal.customerId),
    ...serviceJobs.map((job) => job.customerId),
  ]);
  const customers = state.customers.filter((customer) => customerIds.has(customer.id) || (!individuallyScoped && vehicleIds.has(customer.vehicleInterestId)));
  const visibleCustomerIds = new Set(customers.map((customer) => customer.id));
  const financeApplications = canViewFinance ? state.financeApplications.filter((application) => vehicleIds.has(application.vehicleId) && dealIds.has(application.dealId) && visibleCustomerIds.has(application.customerId)) : [];
  const appointments = state.appointments.filter((appointment) => vehicleIds.has(appointment.vehicleId) && leadIds.has(appointment.leadId) && visibleCustomerIds.has(appointment.customerId) && (!individuallyScoped || appointment.assignedTo === account.recordAssignee));
  const appointmentIds = new Set(appointments.map((appointment) => appointment.id));
  const testDrives = state.testDrives.filter((drive) => appointmentIds.has(drive.appointmentId) && vehicleIds.has(drive.vehicleId) && leadIds.has(drive.leadId) && visibleCustomerIds.has(drive.customerId));
  const quotes = state.quotes.filter((quote) => vehicleIds.has(quote.vehicleId) && leadIds.has(quote.leadId) && visibleCustomerIds.has(quote.customerId) && (!individuallyScoped || quote.createdBy === account.recordAssignee));
  const payments = canViewFinance ? state.payments.filter((payment) => dealIds.has(payment.dealId) && visibleCustomerIds.has(payment.customerId)) : [];
  const documents = state.documents.filter((document) => (!document.vehicleId || vehicleIds.has(document.vehicleId)) && (!document.customerId || visibleCustomerIds.has(document.customerId)) && (!document.leadId || leadIds.has(document.leadId)) && (!document.dealId || dealIds.has(document.dealId)));
  const employees = hasPermission(account, "staff.read") ? state.employees.filter((employee) => visibleBranches.includes(employee.branch as DemoBranch)) : state.employees.filter((employee) => employee.name === account.name);
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

  return { ...state, vehicles, customers, leads, deals, financeDrafts, financeApplications, serviceJobs, employees, appointments, testDrives, quotes, payments, documents, tasks, notifications, activities, preferences: { ...state.preferences, branch: selectedBranch }, drafts: { ...state.drafts, vehicleIntake, vehicleIntakes: vehicleIntake ? { [draftScope]: vehicleIntake } : {} } };
}
