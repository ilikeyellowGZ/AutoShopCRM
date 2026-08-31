import { describe, expect, it } from "vitest";
import {
  DEMO_ACCESS_CODE,
  DEMO_TUTORIAL_ACCESS_CODE,
  authenticateDemoAccount,
  canAccessTarget,
  demoAccounts,
  getDemoAccount,
  hasPermission,
  initialTargetForAccount,
} from "./access";

describe("demo access", () => {
  it("authenticates a known account with the shared demo code as a returning user", () => {
    const result = authenticateDemoAccount("  STOCK@MOTORCRM.DEMO ", DEMO_ACCESS_CODE);

    expect(result.ok).toBe(true);
    if (result.ok) { expect(result.account).toMatchObject({ id: "stock", role: "stock", title: "Stock Controller" }); expect(result.experience).toBe("returning"); }
  });

  it("authenticates the same account as a first-time user with the tutorial code", () => {
    const result = authenticateDemoAccount("stock@motorcrm.demo", DEMO_TUTORIAL_ACCESS_CODE);

    expect(result.ok).toBe(true);
    if (result.ok) { expect(result.account.id).toBe("stock"); expect(result.experience).toBe("first-time"); }
  });

  it("gives every role a distinct accent colour", () => {
    const colors = demoAccounts.map((account) => account.color);
    expect(colors.every((color) => /^#[0-9a-f]{6}$/i.test(color))).toBe(true);
    expect(new Set(colors).size).toBe(demoAccounts.length);
  });

  it("rejects an incorrect demo code without returning account data", () => {
    expect(authenticateDemoAccount("owner@motorcrm.demo", "not-the-code")).toEqual({
      ok: false,
      error: "Check the demo email and access code, then try again.",
    });
  });

  it("provides every required role through a unique demo email", () => {
    expect(demoAccounts.map((account) => account.email)).toEqual([
      "owner@motorcrm.demo",
      "ceo@motorcrm.demo",
      "manager@motorcrm.demo",
      "salesmanager@motorcrm.demo",
      "sales@motorcrm.demo",
      "finance@motorcrm.demo",
      "stock@motorcrm.demo",
      "marketing@motorcrm.demo",
      "accounts@motorcrm.demo",
      "employee@motorcrm.demo",
      "auditor@motorcrm.demo",
    ]);
    expect(new Set(demoAccounts.map((account) => account.role)).size).toBe(11);
  });

  it("keeps stock control out of finance while allowing vehicle intake", () => {
    const account = getDemoAccount("stock");

    expect(canAccessTarget(account, { page: "inventory", subview: "intake" })).toBe(true);
    expect(canAccessTarget(account, { page: "finance", subview: "deal-finance" })).toBe(false);
    expect(hasPermission(account, "inventory.write")).toBe(true);
    expect(initialTargetForAccount(account)).toEqual({ page: "inventory", subview: "list" });
    expect(hasPermission(account, "inventory.cost.read")).toBe(true);
    expect(hasPermission(account, "deal.financial.read")).toBe(false);
  });

  it("gives the auditor broad record visibility with no write or reset permissions", () => {
    const account = getDemoAccount("auditor");

    expect(canAccessTarget(account, { page: "finance", subview: "applications" })).toBe(true);
    expect(canAccessTarget(account, { page: "operations", subview: "audit-trail" })).toBe(true);
    expect(hasPermission(account, "inventory.write")).toBe(false);
    expect(hasPermission(account, "finance.write")).toBe(false);
    expect(hasPermission(account, "demo.reset")).toBe(false);
  });

  it("reserves workspace settings and reset for the owner", () => {
    const owner = getDemoAccount("owner");
    const manager = getDemoAccount("manager");

    expect(canAccessTarget(owner, { page: "operations", subview: "settings" })).toBe(true);
    expect(hasPermission(owner, "demo.reset")).toBe(true);
    expect(canAccessTarget(manager, { page: "operations", subview: "settings" })).toBe(false);
    expect(hasPermission(manager, "demo.reset")).toBe(false);
  });

  it("gates every operations view that exposes audit or staff data", () => {
    const employee = getDemoAccount("employee");
    const manager = getDemoAccount("manager");

    expect(canAccessTarget(employee, { page: "operations", subview: "attendance" })).toBe(false);
    expect(canAccessTarget(employee, { page: "operations", subview: "documents" })).toBe(false);
    expect(canAccessTarget(manager, { page: "operations", subview: "attendance" })).toBe(true);
    expect(canAccessTarget(manager, { page: "operations", subview: "documents" })).toBe(true);
  });

  it("keeps margin approval and commission queues behind sales insights", () => {
    const accounts = getDemoAccount("accounts");
    const salesManager = getDemoAccount("salesmanager");

    expect(canAccessTarget(accounts, { page: "sales", subview: "approvals" })).toBe(false);
    expect(canAccessTarget(accounts, { page: "sales", subview: "commissions" })).toBe(false);
    expect(canAccessTarget(accounts, { page: "sales", subview: "deals" })).toBe(true);
    expect(canAccessTarget(salesManager, { page: "sales", subview: "approvals" })).toBe(true);
  });

  it("separates own performance, approvals, and exports for sales roles", () => {
    const sales = getDemoAccount("sales");
    const salesManager = getDemoAccount("salesmanager");

    expect(hasPermission(sales, "deal.financial.read")).toBe(true);
    expect(hasPermission(sales, "sales.performance.read")).toBe(true);
    expect(hasPermission(sales, "sales.approvals.read")).toBe(false);
    expect(hasPermission(sales, "sales.export")).toBe(false);
    expect(hasPermission(salesManager, "sales.approvals.read")).toBe(true);
    expect(hasPermission(salesManager, "sales.export")).toBe(true);
  });
});
