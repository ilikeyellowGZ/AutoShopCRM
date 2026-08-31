import { describe, expect, it } from "vitest";
import { canAccessTarget, demoAccounts } from "../../app/access";
import { tutorialForRole } from "./tutorialContent";

describe("tutorialForRole", () => {
  it("gives every demo role a bespoke, non-empty tour", () => {
    for (const account of demoAccounts) {
      const steps = tutorialForRole[account.role];
      expect(steps, `missing tour for ${account.role}`).toBeDefined();
      expect(steps.length, `${account.role} tour is empty`).toBeGreaterThan(4);
    }
  });

  it("keeps every step's destination within what that role can actually reach", () => {
    for (const account of demoAccounts) {
      for (const tourStep of tutorialForRole[account.role]) {
        expect(canAccessTarget(account, tourStep.target), `${account.role} step "${tourStep.id}" targets ${tourStep.target.page}/${tourStep.target.subview}, which the role cannot access`).toBe(true);
      }
    }
  });

  it("gives every step a unique id within its role's tour", () => {
    for (const account of demoAccounts) {
      const ids = tutorialForRole[account.role].map((tourStep) => tourStep.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("starts every tour with a welcome step and ends with a closing step", () => {
    for (const account of demoAccounts) {
      const steps = tutorialForRole[account.role];
      expect(steps[0].id).toBe("welcome");
      expect(steps[steps.length - 1].id).toBe("closing");
    }
  });

  it("writes distinct, role-specific welcome copy rather than reusing shared text", () => {
    const summaries = demoAccounts.map((account) => tutorialForRole[account.role][0].body);
    expect(new Set(summaries).size).toBe(summaries.length);
  });
});
