import type { BoardItem, CrmDocument, DemoState, PersistedRecordType, TaskItem } from "../domain/models";
import { hasPermission, type DemoAccount, type DemoBranch } from "./access";

const emptyScope = (state: DemoState, branch: string): DemoState => ({
  ...state,
  organizations: [], branches: [], sessions: [], workspaces: [], boards: [], boardGroups: [], boardColumns: [], boardItems: [], boardViews: [], vehicles: [], customers: [], leads: [], deals: [], financeDrafts: [],
  financeApplications: [], serviceJobs: [], employees: [], appointments: [], testDrives: [], quotes: [],
  payments: [], documents: [], tasks: [], notifications: [], activities: [],
  preferences: { ...state.preferences, branch, activePage: "my-day", activeSubview: "overview", activeRecordType: undefined, activeRecordId: undefined, activeContextId: undefined },
  drafts: { vehicleIntake: null, vehicleIntakes: {}, lead: null, deal: null, serviceNotes: {} },
});

export function scopeStateForAccount(state: DemoState, account: DemoAccount): DemoState {
  const organizations = state.organizations.filter((organization) => organization.id === account.organizationId);
  const branches = state.branches.filter((branch) => branch.organizationId === account.organizationId);
  const permittedBranches = branches.filter((branch) => account.allowedBranches.includes(branch.name as DemoBranch));
  if (organizations.length === 0 || permittedBranches.length === 0) return emptyScope(state, account.homeBranch);
  const selected = permittedBranches.find((branch) => branch.name === state.preferences.branch)
    ?? permittedBranches.find((branch) => branch.name === account.homeBranch)
    ?? permittedBranches[0];
  const selectedBranch = selected.name;
  const visibleBranchIds = new Set((account.dataScope === "organization" ? permittedBranches : [selected]).map((branch) => branch.id));
  const tenantBranchIds = new Set(branches.map((branch) => branch.id));
  const individuallyScoped = account.dataScope === "own";
  const vehicles = state.vehicles.filter((vehicle) => visibleBranchIds.has(vehicle.branchId));
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
  const appointments = state.appointments.filter((appointment) => visibleBranchIds.has(appointment.branchId) && vehicleIds.has(appointment.vehicleId) && leadIds.has(appointment.leadId) && visibleCustomerIds.has(appointment.customerId) && (!individuallyScoped || appointment.assignedTo === account.recordAssignee));
  const appointmentIds = new Set(appointments.map((appointment) => appointment.id));
  const testDrives = state.testDrives.filter((drive) => appointmentIds.has(drive.appointmentId) && vehicleIds.has(drive.vehicleId) && leadIds.has(drive.leadId) && visibleCustomerIds.has(drive.customerId));
  const quotes = state.quotes.filter((quote) => vehicleIds.has(quote.vehicleId) && leadIds.has(quote.leadId) && visibleCustomerIds.has(quote.customerId) && (!individuallyScoped || quote.createdBy === account.recordAssignee));
  const payments = canViewFinance ? state.payments.filter((payment) => dealIds.has(payment.dealId) && visibleCustomerIds.has(payment.customerId)) : [];
  const documentLinks = (document: CrmDocument) => [
    document.vehicleId === undefined ? null : vehicleIds.has(document.vehicleId),
    document.customerId === undefined ? null : visibleCustomerIds.has(document.customerId),
    document.leadId === undefined ? null : leadIds.has(document.leadId),
    document.dealId === undefined ? null : dealIds.has(document.dealId),
  ].filter((link): link is boolean => link !== null);
  const documents = state.documents.filter((document) => { const links = documentLinks(document); return links.length > 0 && links.every(Boolean); });
  const visibleTask = (task: TaskItem) => {
    if (task.relatedType === "vehicle") return !individuallyScoped && account.pages.includes("inventory") && vehicleIds.has(task.relatedId);
    if (task.relatedType === "lead") return (account.pages.includes("customers") || account.pages.includes("pipeline")) && leadIds.has(task.relatedId);
    if (task.relatedType === "deal") return account.pages.includes("sales") && dealIds.has(task.relatedId);
    return account.pages.includes("service") && serviceIds.has(task.relatedId);
  };
  const tasks = state.tasks.filter(visibleTask);
  const relatedIds = new Set([...vehicleIds, ...leadIds, ...dealIds, ...serviceIds, ...customerIds, ...tasks.map((task) => task.id)]);
  const notifications = state.notifications.filter((notification) => notification.organizationId === account.organizationId && relatedIds.has(notification.relatedId));
  const activities = hasPermission(account, "audit.read") ? state.activities.filter((activity) => activity.organizationId === account.organizationId && (activity.targetType === "system" || relatedIds.has(activity.targetId))) : [];
  const sessions = state.sessions.filter((session) => session.organizationId === account.organizationId && (session.accountId === account.id || (hasPermission(account, "staff.read") && visibleBranchIds.has(session.branchId))));
  const workspaces = state.workspaces.filter((workspace) => workspace.organizationId === account.organizationId && (!workspace.branchId || visibleBranchIds.has(workspace.branchId)));
  const workspaceIds = new Set(workspaces.map((workspace) => workspace.id));
  const boards = state.boards.filter((board) => workspaceIds.has(board.workspaceId));
  const boardIds = new Set(boards.map((board) => board.id));
  const boardGroups = state.boardGroups.filter((group) => boardIds.has(group.boardId));
  const boardColumns = state.boardColumns.filter((column) => boardIds.has(column.boardId));
  const boardViews = state.boardViews.filter((view) => boardIds.has(view.boardId));
  const scopedRecordIds: Record<PersistedRecordType, Set<string>> = { vehicle: vehicleIds, customer: visibleCustomerIds, lead: leadIds, deal: dealIds, service: serviceIds, task: new Set(tasks.map((task) => task.id)) };
  const ownEmployeeIds = new Set(state.employees.filter((employee) => employee.name === account.name).map((employee) => employee.id));
  const personColumnIds = new Set(state.boardColumns.filter((column) => column.kind === "person").map((column) => column.id));
  const itemIsVisible = (item: BoardItem) => Object.entries(item.values).every(([columnId, value]) => {
    if (value.kind === "relation") return scopedRecordIds[value.recordType].has(value.recordId);
    if (individuallyScoped && value.kind === "person" && personColumnIds.has(columnId)) return ownEmployeeIds.has(value.employeeId);
    return true;
  });
  const reachableItems = state.boardItems.filter((item) => boardIds.has(item.boardId) && itemIsVisible(item));
  const reachableItemIds = new Set(reachableItems.map((item) => item.id));
  const boardItems = reachableItems.filter((item) => item.parentItemId === undefined || reachableItemIds.has(item.parentItemId));
  const assignedEmployeeIds = new Set(boardItems.flatMap((item) => Object.values(item.values).flatMap((value) => value.kind === "person" ? [value.employeeId] : [])));
  const employees = hasPermission(account, "staff.read")
    ? state.employees.filter((employee) => visibleBranchIds.has(employee.branchId))
    : state.employees.filter((employee) => (tenantBranchIds.has(employee.branchId) && employee.name === account.name) || (visibleBranchIds.has(employee.branchId) && assignedEmployeeIds.has(employee.id)));
  const draftScope = `${account.id}:${selectedBranch}`;
  const vehicleIntake = state.drafts.vehicleIntakes[draftScope] ?? null;

  return { ...state, organizations, branches, sessions, workspaces, boards, boardGroups, boardColumns, boardItems, boardViews, vehicles, customers, leads, deals, financeDrafts, financeApplications, serviceJobs, employees, appointments, testDrives, quotes, payments, documents, tasks, notifications, activities, preferences: { ...state.preferences, branch: selectedBranch }, drafts: { ...state.drafts, vehicleIntake, vehicleIntakes: vehicleIntake ? { [draftScope]: vehicleIntake } : {} } };
}
