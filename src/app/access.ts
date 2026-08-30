import { demoBranches, demoOrganizationId } from "../domain/models";
import { pageKeys, type NavigationTarget, type PageKey } from "./routes";

export const DEMO_ACCESS_CODE = "motorcrm-demo";

export type DemoRole = "owner" | "ceo" | "manager" | "salesmanager" | "sales" | "finance" | "stock" | "marketing" | "accounts" | "employee" | "auditor";
export type DemoBranch = (typeof demoBranches)[number];
export type DemoPermission =
  | "branch.switch"
  | "inventory.write"
  | "customers.write"
  | "pipeline.write"
  | "sales.write"
  | "finance.write"
  | "service.write"
  | "tasks.write"
  | "notifications.write"
  | "work.item.write"
  | "work.view.manage"
  | "inventory.cost.read"
  | "finance.read"
  | "deal.financial.read"
  | "sales.performance.read"
  | "sales.approvals.read"
  | "sales.export"
  | "staff.read"
  | "settings.manage"
  | "audit.read"
  | "demo.reset";

export type DataScope = "organization" | "branch" | "own";

export type DemoAccount = {
  id: DemoRole;
  role: DemoRole;
  email: string;
  name: string;
  recordAssignee: string;
  title: string;
  organizationId: string;
  homeBranch: DemoBranch;
  allowedBranches: readonly DemoBranch[];
  dataScope: DataScope;
  pages: readonly PageKey[];
  permissions: readonly DemoPermission[];
  initialTarget: NavigationTarget;
};

const allBranches = [...demoBranches];
const allPages = [...pageKeys];
const allPermissions: DemoPermission[] = ["branch.switch", "inventory.write", "customers.write", "pipeline.write", "sales.write", "finance.write", "service.write", "tasks.write", "notifications.write", "work.item.write", "work.view.manage", "inventory.cost.read", "finance.read", "deal.financial.read", "sales.performance.read", "sales.approvals.read", "sales.export", "staff.read", "settings.manage", "audit.read", "demo.reset"];

export const demoAccounts: readonly DemoAccount[] = [
  { id: "owner", role: "owner", email: "owner@motorcrm.demo", name: "Anele Dlamini", recordAssignee: "Anele Dlamini", title: "Dealership Owner", organizationId: demoOrganizationId, homeBranch: "Johannesburg North", allowedBranches: allBranches, dataScope: "organization", pages: allPages, permissions: allPermissions, initialTarget: { page: "my-day", subview: "overview" } },
  { id: "ceo", role: "ceo", email: "ceo@motorcrm.demo", name: "Thandi Mokoena", recordAssignee: "Thandi Mokoena", title: "Group CEO", organizationId: demoOrganizationId, homeBranch: "Sandton", allowedBranches: allBranches, dataScope: "organization", pages: allPages, permissions: ["branch.switch", "tasks.write", "notifications.write", "inventory.cost.read", "finance.read", "deal.financial.read", "sales.performance.read", "sales.approvals.read", "sales.export", "staff.read", "audit.read"], initialTarget: { page: "my-day", subview: "overview" } },
  { id: "manager", role: "manager", email: "manager@motorcrm.demo", name: "Jacques van der Merwe", recordAssignee: "Jacques van der Merwe", title: "General Manager", organizationId: demoOrganizationId, homeBranch: "Johannesburg North", allowedBranches: ["Johannesburg North", "Sandton", "Midrand"], dataScope: "branch", pages: allPages, permissions: ["work.item.write", "work.view.manage", "branch.switch", "inventory.write", "customers.write", "pipeline.write", "sales.write", "service.write", "tasks.write", "notifications.write", "inventory.cost.read", "finance.read", "deal.financial.read", "sales.performance.read", "sales.approvals.read", "sales.export", "staff.read", "audit.read"], initialTarget: { page: "my-day", subview: "overview" } },
  { id: "salesmanager", role: "salesmanager", email: "salesmanager@motorcrm.demo", name: "Lindiwe Khumalo", recordAssignee: "Lindiwe Khumalo", title: "Sales Manager", organizationId: demoOrganizationId, homeBranch: "Sandton", allowedBranches: ["Sandton", "Johannesburg North"], dataScope: "branch", pages: ["my-day", "work", "inventory", "customers", "pipeline", "sales", "finance", "operations"], permissions: ["work.item.write", "work.view.manage", "branch.switch", "customers.write", "pipeline.write", "sales.write", "tasks.write", "notifications.write", "finance.read", "deal.financial.read", "sales.performance.read", "sales.approvals.read", "sales.export", "staff.read"], initialTarget: { page: "pipeline", subview: "board" } },
  { id: "sales", role: "sales", email: "sales@motorcrm.demo", name: "Naledi Ndlovu", recordAssignee: "Naledi Ndlovu", title: "Sales Executive", organizationId: demoOrganizationId, homeBranch: "Johannesburg North", allowedBranches: ["Johannesburg North"], dataScope: "own", pages: ["my-day", "work", "inventory", "customers", "pipeline", "sales"], permissions: ["work.item.write", "customers.write", "pipeline.write", "sales.write", "tasks.write", "notifications.write", "deal.financial.read", "sales.performance.read"], initialTarget: { page: "my-day", subview: "overview" } },
  { id: "finance", role: "finance", email: "finance@motorcrm.demo", name: "Priya Naidoo", recordAssignee: "Priya Naidoo", title: "F&I Manager", organizationId: demoOrganizationId, homeBranch: "Sandton", allowedBranches: ["Sandton", "Johannesburg North"], dataScope: "branch", pages: ["my-day", "work", "customers", "sales", "finance", "operations"], permissions: ["work.item.write", "branch.switch", "finance.write", "tasks.write", "notifications.write", "finance.read", "deal.financial.read"], initialTarget: { page: "finance", subview: "applications" } },
  { id: "stock", role: "stock", email: "stock@motorcrm.demo", name: "Kabelo Molefe", recordAssignee: "Kabelo Molefe", title: "Stock Controller", organizationId: demoOrganizationId, homeBranch: "Pretoria", allowedBranches: ["Pretoria", "Midrand"], dataScope: "branch", pages: ["my-day", "work", "inventory", "service", "operations"], permissions: ["work.item.write", "branch.switch", "inventory.write", "service.write", "tasks.write", "notifications.write", "inventory.cost.read"], initialTarget: { page: "inventory", subview: "list" } },
  { id: "marketing", role: "marketing", email: "marketing@motorcrm.demo", name: "Zanele Sithole", recordAssignee: "Zanele Sithole", title: "Marketing Specialist", organizationId: demoOrganizationId, homeBranch: "Midrand", allowedBranches: ["Midrand", "Sandton"], dataScope: "branch", pages: ["my-day", "work", "inventory", "customers", "pipeline", "operations"], permissions: ["work.item.write", "branch.switch", "pipeline.write", "tasks.write", "notifications.write"], initialTarget: { page: "customers", subview: "leads" } },
  { id: "accounts", role: "accounts", email: "accounts@motorcrm.demo", name: "Ayesha Patel", recordAssignee: "Ayesha Patel", title: "Accounts Clerk", organizationId: demoOrganizationId, homeBranch: "Johannesburg North", allowedBranches: ["Johannesburg North", "Sandton"], dataScope: "branch", pages: ["my-day", "work", "sales", "finance", "operations"], permissions: ["work.item.write", "branch.switch", "finance.write", "tasks.write", "notifications.write", "finance.read"], initialTarget: { page: "finance", subview: "deal-finance" } },
  { id: "employee", role: "employee", email: "employee@motorcrm.demo", name: "Sipho Dlamini", recordAssignee: "Sipho Dlamini", title: "Employee", organizationId: demoOrganizationId, homeBranch: "Midrand", allowedBranches: ["Midrand"], dataScope: "own", pages: ["my-day", "work", "inventory", "customers", "service", "operations"], permissions: ["work.item.write", "tasks.write", "notifications.write"], initialTarget: { page: "my-day", subview: "overview" } },
  { id: "auditor", role: "auditor", email: "auditor@motorcrm.demo", name: "Mia Botha", recordAssignee: "Mia Botha", title: "External Auditor", organizationId: demoOrganizationId, homeBranch: "Johannesburg North", allowedBranches: allBranches, dataScope: "organization", pages: allPages, permissions: ["branch.switch", "inventory.cost.read", "finance.read", "deal.financial.read", "sales.performance.read", "sales.approvals.read", "sales.export", "staff.read", "audit.read"], initialTarget: { page: "operations", subview: "audit-trail" } },
];

export type DemoAuthenticationResult = { ok: true; account: DemoAccount } | { ok: false; error: string };

export function getDemoAccount(id: DemoRole): DemoAccount {
  const account = demoAccounts.find((candidate) => candidate.id === id);
  if (!account) throw new Error(`Unknown demo account: ${id}`);
  return account;
}

export function authenticateDemoAccount(email: string, accessCode: string): DemoAuthenticationResult {
  const account = demoAccounts.find((candidate) => candidate.email === email.trim().toLowerCase());
  if (!account || accessCode !== DEMO_ACCESS_CODE) return { ok: false, error: "Check the demo email and access code, then try again." };
  return { ok: true, account };
}

export function hasPermission(account: DemoAccount, permission: DemoPermission): boolean {
  return account.permissions.includes(permission);
}

export function canAccessTarget(account: DemoAccount, target: NavigationTarget): boolean {
  if (!account.pages.includes(target.page)) return false;
  if (target.page === "operations" && target.subview === "settings") return hasPermission(account, "settings.manage");
  if (target.page === "operations" && target.subview === "audit-trail") return hasPermission(account, "audit.read");
  if (target.page === "operations" && ["employees", "teams", "targets", "attendance"].includes(target.subview)) return hasPermission(account, "staff.read");
  if (target.page === "operations" && target.subview === "documents") return hasPermission(account, "audit.read");
  if (target.page === "sales" && target.subview === "approvals") return hasPermission(account, "sales.approvals.read");
  if (target.page === "sales" && target.subview === "commissions") return hasPermission(account, "sales.performance.read");
  if (target.page === "inventory" && target.subview === "intake") return hasPermission(account, "inventory.write");
  if (target.page === "sales" && target.subview === "new-deal") return hasPermission(account, "sales.write");
  return true;
}

export function initialTargetForAccount(account: DemoAccount): NavigationTarget {
  return account.initialTarget;
}
