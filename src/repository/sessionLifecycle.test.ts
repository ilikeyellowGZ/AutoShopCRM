import { describe, expect, it } from "vitest";
import { memoryStorage } from "../test/memoryStorage";
import { createDemoRepository } from "./demoRepository";
import { getDemoAccount } from "../app/access";
import { scopeStateForAccount } from "../app/stateScope";

const clock = (times: string[]) => { let index = 0; return () => times[Math.min(index++, times.length - 1)]; };
const account = (id: Parameters<typeof getDemoAccount>[0]) => {
  const source = getDemoAccount(id);
  return { id: source.id, name: source.name, title: source.title, organizationId: source.organizationId };
};

describe("session lifecycle", () => {
  it("records a real start time and user agent, seeded with no sessions", () => {
    const repository = createDemoRepository(memoryStorage(), clock(["2026-08-29T10:00:00.000Z"]));
    expect(repository.getState().sessions).toEqual([]);

    const id = repository.startSession(account("sales"), "test-agent/1.0");
    const [session] = repository.getState().sessions;

    expect(session.id).toBe(id);
    expect(session.accountId).toBe("sales");
    expect(session.organizationId).toBe(getDemoAccount("sales").organizationId);
    expect(session.startedAt).toBe("2026-08-29T10:00:00.000Z");
    expect(session.lastActivityAt).toBe("2026-08-29T10:00:00.000Z");
    expect(session.status).toBe("active");
    expect(session.userAgent).toBe("test-agent/1.0");
    expect(session.endedAt).toBeUndefined();
  });

  it("advances last activity only while the session is active", () => {
    const repository = createDemoRepository(memoryStorage(), clock(["2026-08-29T10:00:00.000Z", "2026-08-29T10:05:00.000Z", "2026-08-29T10:09:00.000Z", "2026-08-29T10:20:00.000Z"]));
    const id = repository.startSession(account("sales"), "test-agent/1.0");

    repository.touchSession(id);
    expect(repository.getState().sessions[0].lastActivityAt).toBe("2026-08-29T10:05:00.000Z");

    repository.endSession(id);
    const ended = repository.getState().sessions[0];
    expect(ended.status).toBe("ended");
    expect(ended.endedAt).toBe("2026-08-29T10:09:00.000Z");
    expect(ended.endReason).toBe("signed-out");

    repository.touchSession(id);
    expect(repository.getState().sessions[0].lastActivityAt).toBe("2026-08-29T10:09:00.000Z");
  });

  it("closes a previous open session for the same account instead of leaving two open", () => {
    const repository = createDemoRepository(memoryStorage(), clock(["2026-08-29T10:00:00.000Z", "2026-08-29T11:00:00.000Z"]));
    const first = repository.startSession(account("sales"), "test-agent/1.0");
    repository.startSession(account("sales"), "test-agent/2.0");

    const sessions = repository.getState().sessions;
    const previous = sessions.find((session) => session.id === first);

    expect(sessions.filter((session) => session.status === "active")).toHaveLength(1);
    expect(previous?.status).toBe("ended");
    expect(previous?.endReason).toBe("replaced");
  });

  it("does not end another account's session", () => {
    const repository = createDemoRepository(memoryStorage(), clock(["2026-08-29T10:00:00.000Z", "2026-08-29T10:01:00.000Z"]));
    const salesSession = repository.startSession(account("sales"), "test-agent/1.0");
    repository.startSession(account("finance"), "test-agent/1.0");

    const sessions = repository.getState().sessions;
    expect(sessions.find((session) => session.id === salesSession)?.status).toBe("active");
    expect(sessions.filter((session) => session.status === "active")).toHaveLength(2);
  });
});

describe("session visibility", () => {
  it("shows an employee only their own session, and a staff reader the whole branch", () => {
    const repository = createDemoRepository(memoryStorage(), clock(["2026-08-29T10:00:00.000Z", "2026-08-29T10:01:00.000Z"]));
    repository.startSession(account("sales"), "test-agent/1.0");
    repository.startSession(account("manager"), "test-agent/1.0");
    const state = repository.getState();

    const ownScope = scopeStateForAccount(state, getDemoAccount("sales"));
    const staffScope = scopeStateForAccount(state, getDemoAccount("manager"));

    expect(ownScope.sessions.map((session) => session.accountId)).toEqual(["sales"]);
    expect(staffScope.sessions.map((session) => session.accountId).sort()).toEqual(["manager", "sales"]);
  });

  it("hides sessions belonging to another organization", () => {
    const repository = createDemoRepository(memoryStorage(), clock(["2026-08-29T10:00:00.000Z"]));
    repository.startSession({ id: "sales", name: "Rival Rep", title: "Sales", organizationId: "org-rival-motors" }, "test-agent/1.0");

    const scoped = scopeStateForAccount(repository.getState(), getDemoAccount("manager"));

    expect(scoped.sessions).toEqual([]);
  });
});

describe("audit tenancy", () => {
  it("stamps every committed audit event with the organization and branch it happened in", () => {
    const repository = createDemoRepository(memoryStorage(), clock(["2026-08-29T10:00:00.000Z"]));
    repository.setAuditActor("Kabelo Molefe · Stock Controller");
    repository.setPreferences({ branch: "Pretoria" });

    const [latest] = repository.getState().activities;

    expect(latest.organizationId).toBe(getDemoAccount("stock").organizationId);
    expect(latest.branchId).toBe(repository.getState().branches.find((branch) => branch.name === "Pretoria")?.id);
  });

  it("keeps another organization's audit trail out of a scoped read", () => {
    const repository = createDemoRepository(memoryStorage(), clock(["2026-08-29T10:00:00.000Z"]));
    const state = repository.getState();
    state.activities = state.activities.map((activity, index) => index === 0 ? { ...activity, organizationId: "org-rival-motors", targetType: "system" as const, targetId: "system" } : activity);

    const scoped = scopeStateForAccount(state, getDemoAccount("owner"));

    expect(scoped.activities.some((activity) => activity.organizationId === "org-rival-motors")).toBe(false);
    expect(scoped.activities.length).toBeGreaterThan(0);
  });
});

describe("session identity and branch scope", () => {
  it("never reissues a session id after the demo data is reset", () => {
    const repository = createDemoRepository(memoryStorage(), clock(["2026-08-29T10:00:00.000Z", "2026-08-29T10:01:00.000Z", "2026-08-29T10:02:00.000Z"]));
    repository.startSession(account("sales"), "test-agent/1.0");
    repository.reset();
    repository.startSession(account("sales"), "test-agent/1.0");
    repository.startSession(account("finance"), "test-agent/1.0");

    const ids = repository.getState().sessions.map((session) => session.id);

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("keeps another branch's session out of a branch-scoped staff reader's view", () => {
    const repository = createDemoRepository(memoryStorage(), clock(["2026-08-29T10:00:00.000Z", "2026-08-29T10:01:00.000Z"]));
    const state = repository.getState();
    const pretoria = state.branches.find((branch) => branch.name === "Pretoria");
    const sandton = state.branches.find((branch) => branch.name === "Sandton");
    state.sessions = [
      { id: "session-9001", organizationId: getDemoAccount("stock").organizationId, branchId: pretoria!.id, accountId: "stock", actor: "Kabelo Molefe · Stock Controller", startedAt: "2026-08-29T10:00:00.000Z", lastActivityAt: "2026-08-29T10:00:00.000Z", status: "active", userAgent: "a" },
      { id: "session-9002", organizationId: getDemoAccount("salesmanager").organizationId, branchId: sandton!.id, accountId: "salesmanager", actor: "Lindiwe Khumalo · Sales Manager", startedAt: "2026-08-29T10:00:00.000Z", lastActivityAt: "2026-08-29T10:00:00.000Z", status: "active", userAgent: "a" },
    ];
    state.preferences.branch = "Sandton";

    const scoped = scopeStateForAccount(state, getDemoAccount("salesmanager"));

    expect(scoped.sessions.map((session) => session.id)).toEqual(["session-9002"]);
  });

  it("refuses a vehicle whose branch does not exist", () => {
    const repository = createDemoRepository(memoryStorage(), clock(["2026-08-29T10:00:00.000Z"]));
    const template = repository.getState().vehicles[0];

    expect(() => repository.addVehicle({ ...template, id: "vehicle-99", stockId: "NEW-99", vin: "1HGCM82633A111222", branchId: "" })).toThrow("Vehicle branch not found.");
  });
});
