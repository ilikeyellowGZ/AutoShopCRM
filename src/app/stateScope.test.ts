import { describe, expect, it } from "vitest";
import { branchIdForName, demoOrganizationId } from "../domain/models";
import { createSeedState } from "../repository/seed";
import { demoAccounts, getDemoAccount } from "./access";
import { scopeStateForAccount } from "./stateScope";
import { targetFromPreferences } from "./useDemoApp";

describe("role and branch record scope", () => {
  it("limits a stock controller to connected records in the selected allowed branch", () => {
    const state = createSeedState();
    state.preferences.branch = "Pretoria";

    const scoped = scopeStateForAccount(state, getDemoAccount("stock"));

    expect(scoped.vehicles.length).toBeGreaterThan(0);
    expect(scoped.vehicles.length).toBeLessThan(30);
    expect(scoped.vehicles.every((vehicle) => vehicle.branch === "Pretoria")).toBe(true);
    expect(scoped.leads.every((lead) => scoped.vehicles.some((vehicle) => vehicle.id === lead.vehicleId))).toBe(true);
    expect(scoped.deals.every((deal) => scoped.vehicles.some((vehicle) => vehicle.id === deal.vehicleId))).toBe(true);
    expect(scoped.tasks.every((task) => task.relatedType === "vehicle" || task.relatedType === "service")).toBe(true);
    expect(scoped.activities).toEqual([]);
  });

  it("changes visible records when a multi-branch employee switches branch", () => {
    const state = createSeedState();
    const account = getDemoAccount("stock");
    state.preferences.branch = "Pretoria";
    const pretoriaIds = scopeStateForAccount(state, account).vehicles.map((vehicle) => vehicle.id);
    state.preferences.branch = "Midrand";
    const midrandIds = scopeStateForAccount(state, account).vehicles.map((vehicle) => vehicle.id);

    expect(pretoriaIds.length).toBeGreaterThan(0);
    expect(midrandIds.length).toBeGreaterThan(0);
    expect(midrandIds).not.toEqual(pretoriaIds);
  });

  it("keeps group-wide accounts on the complete connected dataset", () => {
    const scoped = scopeStateForAccount(createSeedState(), getDemoAccount("owner"));

    expect(scoped.vehicles).toHaveLength(30);
    expect(scoped.activities.length).toBeGreaterThan(0);
  });

  it("limits an individual sales account to its own same-branch records and tasks", () => {
    const state = createSeedState();
    const account = getDemoAccount("sales");
    state.preferences.branch = account.homeBranch;

    const scoped = scopeStateForAccount(state, account);

    expect(scoped.leads.length).toBeGreaterThan(0);
    expect(scoped.leads.every((lead) => lead.owner === account.recordAssignee)).toBe(true);
    expect(scoped.deals.every((deal) => deal.salesRep === account.recordAssignee)).toBe(true);
    expect(scoped.leads.some((lead) => lead.owner === "Marcus Botha")).toBe(false);
    expect(scoped.tasks.every((task) => {
      if (task.relatedType === "lead") return scoped.leads.some((lead) => lead.id === task.relatedId);
      if (task.relatedType === "deal") return scoped.deals.some((deal) => deal.id === task.relatedId);
      return false;
    })).toBe(true);
    expect(scoped.appointments.every((appointment) => scoped.leads.some((lead) => lead.id === appointment.leadId))).toBe(true);
    expect(scoped.testDrives.every((drive) => scoped.leads.some((lead) => lead.id === drive.leadId))).toBe(true);
    expect(scoped.quotes.every((quote) => scoped.leads.some((lead) => lead.id === quote.leadId))).toBe(true);
    expect(scoped.financeDrafts).toEqual([]);
    expect(scoped.financeApplications).toEqual([]);
    expect(scoped.payments).toEqual([]);
    // The directory stays shut: she sees herself and the colleagues she shares a channel with, nobody else.
    const sharedWithNaledi = new Set(state.chatChannels.filter((channel) => channel.memberEmployeeIds.includes("employee-05")).flatMap((channel) => channel.memberEmployeeIds));
    expect(scoped.employees.every((employee) => employee.name === account.name || sharedWithNaledi.has(employee.id))).toBe(true);
    expect(scoped.employees.some((employee) => employee.id === "employee-07")).toBe(false);
  });

  it("limits connected employee and operational collections to a manager's selected branch", () => {
    const state = createSeedState();
    const account = getDemoAccount("manager");
    state.preferences.branch = "Midrand";

    const scoped = scopeStateForAccount(state, account);
    const vehicleIds = new Set(scoped.vehicles.map((vehicle) => vehicle.id));

    const sharedWithManager = new Set(scoped.chatChannels.flatMap((channel) => channel.memberEmployeeIds));
    const tenantBranchIds = new Set(state.branches.filter((branch) => branch.organizationId === demoOrganizationId).map((branch) => branch.id));
    expect(scoped.employees.every((employee) => employee.branch === "Midrand" || sharedWithManager.has(employee.id))).toBe(true);
    expect(scoped.employees.every((employee) => tenantBranchIds.has(employee.branchId))).toBe(true);
    expect(scoped.appointments.every((appointment) => appointment.branch === "Midrand" && vehicleIds.has(appointment.vehicleId))).toBe(true);
    expect(scoped.financeApplications.every((application) => vehicleIds.has(application.vehicleId))).toBe(true);
    expect(scoped.documents.every((document) => !document.vehicleId || vehicleIds.has(document.vehicleId))).toBe(true);
  });

  it("shows only the signed-in account and branch vehicle-intake draft", () => {
    const state = createSeedState();
    state.drafts.vehicleIntakes = {
      "owner:Johannesburg North": { step: 2, values: { vin: "1HGCM82633A004352", stockId: "OWNER-DRAFT" } },
      "stock:Pretoria": { step: 1, values: { vin: "1M8GDM9AXKP042788", stockId: "STOCK-DRAFT" } },
    };

    expect(scopeStateForAccount(state, getDemoAccount("owner")).drafts.vehicleIntake?.values.stockId).toBe("OWNER-DRAFT");
    expect(scopeStateForAccount(state, getDemoAccount("stock")).drafts.vehicleIntake?.values.stockId).toBe("STOCK-DRAFT");
    state.preferences.branch = "Midrand";
    expect(scopeStateForAccount(state, getDemoAccount("stock")).drafts.vehicleIntake).toBeNull();
  });

  it("derives record visibility from the declared data scope, not the role name", () => {
    const state = createSeedState();
    const manager = getDemoAccount("manager");
    state.preferences.branch = "Midrand";

    const branchScoped = scopeStateForAccount(state, manager);
    const promoted = scopeStateForAccount(state, { ...manager, dataScope: "organization" });
    const demoted = scopeStateForAccount(state, { ...manager, dataScope: "own" });

    expect(branchScoped.vehicles.every((vehicle) => vehicle.branch === "Midrand")).toBe(true);
    expect(new Set(promoted.vehicles.map((vehicle) => vehicle.branch)).size).toBeGreaterThan(1);
    expect(promoted.vehicles.length).toBeGreaterThan(branchScoped.vehicles.length);
    expect(demoted.leads.every((lead) => lead.owner === manager.recordAssignee)).toBe(true);
    expect(demoted.leads.length).toBeLessThan(branchScoped.leads.length);
  });

  it("keeps every demo account on a declared data scope", () => {
    for (const account of demoAccounts) {
      expect(["organization", "branch", "own"]).toContain(account.dataScope);
    }
  });

  it("limits a general employee to personally assigned service work", () => {
    const state = createSeedState();
    const account = getDemoAccount("employee");
    state.preferences.branch = account.homeBranch;

    const scoped = scopeStateForAccount(state, account);

    expect(scoped.serviceJobs.length).toBeGreaterThan(0);
    expect(scoped.serviceJobs.every((job) => job.advisor === account.recordAssignee || job.technician === account.recordAssignee)).toBe(true);
    expect(scoped.tasks.every((task) => task.relatedType === "service" && scoped.serviceJobs.some((job) => job.id === task.relatedId))).toBe(true);
    expect(scoped.customers.every((customer) => scoped.serviceJobs.some((job) => job.customerId === customer.id))).toBe(true);
  });

  it("denies an account every record when its organization owns no branch", () => {
    const state = createSeedState();
    const account = { ...getDemoAccount("owner"), organizationId: "org-rival-motors" };

    const scoped = scopeStateForAccount(state, account);

    expect(scoped.organizations).toEqual([]);
    expect(scoped.branches).toEqual([]);
    expect(scoped.vehicles).toEqual([]);
    expect(scoped.customers).toEqual([]);
    expect(scoped.leads).toEqual([]);
    expect(scoped.deals).toEqual([]);
    expect(scoped.employees).toEqual([]);
    expect(scoped.activities).toEqual([]);
  });

  it("hides a branch that has been transferred to another organization", () => {
    const state = createSeedState();
    const account = getDemoAccount("stock");
    state.preferences.branch = "Pretoria";
    const beforeTransfer = scopeStateForAccount(state, account);
    expect(beforeTransfer.vehicles.every((vehicle) => vehicle.branch === "Pretoria")).toBe(true);

    state.organizations.push({ id: "org-rival-motors", name: "Rival Motors", tradingName: "Rival" });
    state.branches = state.branches.map((branch) => branch.name === "Pretoria" ? { ...branch, organizationId: "org-rival-motors" } : branch);

    const afterTransfer = scopeStateForAccount(state, account);

    expect(afterTransfer.vehicles.some((vehicle) => vehicle.branch === "Pretoria")).toBe(false);
    expect(afterTransfer.vehicles.length).toBeGreaterThan(0);
    expect(afterTransfer.preferences.branch).toBe("Midrand");
  });

  it("returns only the signed-in account's own organization and its branches", () => {
    const state = createSeedState();
    state.organizations.push({ id: "org-rival-motors", name: "Rival Motors", tradingName: "Rival" });
    state.branches.push({ id: "branch-rival-east", organizationId: "org-rival-motors", name: "Rival East" });

    const scoped = scopeStateForAccount(state, getDemoAccount("owner"));

    expect(scoped.organizations.map((organization) => organization.id)).toEqual([demoOrganizationId]);
    expect(scoped.branches.every((branch) => branch.organizationId === demoOrganizationId)).toBe(true);
    expect(scoped.branches.some((branch) => branch.name === "Rival East")).toBe(false);
  });
it("isolates a branch that shares its name with another organization's branch", () => {
    const state = createSeedState();
    state.organizations.push({ id: "org-rival-motors", name: "Rival Motors", tradingName: "Rival" });
    state.branches.push({ id: "branch-rival-sandton", organizationId: "org-rival-motors", name: "Sandton" });
    state.vehicles.push({ ...state.vehicles[0], id: "vehicle-rival-01", stockId: "RIVAL-01", vin: "1HGCM82633A987654", branch: "Sandton", branchId: "branch-rival-sandton" });
    state.employees.push({ ...state.employees[0], id: "employee-rival-01", accountId: undefined, name: "Rival Staffer", email: "staffer@rival.demo", branch: "Sandton", branchId: "branch-rival-sandton" });

    const scoped = scopeStateForAccount(state, getDemoAccount("owner"));

    expect(scoped.vehicles.some((vehicle) => vehicle.id === "vehicle-rival-01")).toBe(false);
    expect(scoped.employees.some((employee) => employee.id === "employee-rival-01")).toBe(false);
    expect(scoped.vehicles).toHaveLength(30);
  });

  it("clears drafts and record routing in the scoped state when access is denied", () => {
    const state = createSeedState();
    state.drafts.lead = { id: "lead-99", owner: "Nobody" };
    state.drafts.serviceNotes = { "service-01": "draft note" };
    state.preferences.activeRecordType = "vehicle";
    state.preferences.activeRecordId = "vehicle-01";

    const scoped = scopeStateForAccount(state, { ...getDemoAccount("owner"), organizationId: "org-rival-motors" });

    expect(scoped.drafts.lead).toBeNull();
    expect(scoped.drafts.serviceNotes).toEqual({});
    expect(scoped.preferences.activeRecordId).toBeUndefined();
    expect(scoped.preferences.activePage).toBe("my-day");
  });
it("hides a same-named employee owned by another organization when staff access is limited", () => {
    const state = createSeedState();
    const account = getDemoAccount("stock");
    state.preferences.branch = account.homeBranch;
    state.organizations.push({ id: "org-rival-motors", name: "Rival Motors", tradingName: "Rival" });
    state.branches.push({ id: "branch-rival-pretoria", organizationId: "org-rival-motors", name: "Pretoria" });
    state.employees.push({ ...state.employees[0], id: "employee-rival-01", accountId: undefined, name: account.name, email: "clone@rival.demo", branch: "Pretoria", branchId: "branch-rival-pretoria" });

    const scoped = scopeStateForAccount(state, account);

    expect(scoped.employees.some((employee) => employee.id === "employee-rival-01")).toBe(false);
    const ownBranchIds = new Set(state.branches.filter((branch) => branch.organizationId === demoOrganizationId).map((branch) => branch.id));
    expect(scoped.employees.every((employee) => ownBranchIds.has(employee.branchId))).toBe(true);
    expect(scoped.employees.some((employee) => employee.branchId === branchIdForName(demoOrganizationId, "Pretoria"))).toBe(true);
  });
it("resolves a denied account's persisted deep link to the safe default route", () => {
    const state = createSeedState();
    state.preferences.activePage = 'inventory';
    state.preferences.activeSubview = 'vehicle-01';
    state.preferences.activeRecordType = 'vehicle';
    state.preferences.activeRecordId = 'vehicle-01';

    const denied = scopeStateForAccount(state, { ...getDemoAccount('owner'), organizationId: 'org-rival-motors' });

    expect(targetFromPreferences(denied.preferences)).toEqual({ page: 'my-day', subview: 'overview', recordType: undefined, recordId: undefined, contextId: undefined });
  });
});
