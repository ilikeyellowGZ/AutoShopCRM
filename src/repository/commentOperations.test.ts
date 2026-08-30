import { describe, expect, it } from "vitest";
import { memoryStorage } from "../test/memoryStorage";
import { createDemoRepository } from "./demoRepository";
import { validateDemoState } from "./seedIntegrity";
import { getDemoAccount } from "../app/access";
import { scopeStateForAccount } from "../app/stateScope";

const repo = () => createDemoRepository(memoryStorage());
const naledi = "employee-05";
const kabelo = "employee-07";

describe("adding a comment", () => {
  it("stores the comment against its record and trims the body", () => {
    const repository = repo();

    const id = repository.addComment({ entityType: "vehicle", entityId: "vehicle-01", body: "  Ready for photos  ", authorEmployeeId: kabelo });
    const comment = repository.getState().comments.find((candidate) => candidate.id === id);

    expect(comment?.body).toBe("Ready for photos");
    expect(comment?.entityType).toBe("vehicle");
    expect(comment?.entityId).toBe("vehicle-01");
    expect(comment?.pinned).toBe(false);
    expect(validateDemoState(repository.getState())).toEqual([]);
  });

  it("refuses an empty body and an unknown author", () => {
    const repository = repo();

    expect(() => repository.addComment({ entityType: "vehicle", entityId: "vehicle-01", body: "   ", authorEmployeeId: kabelo })).toThrow("A comment needs something to say.");
    expect(() => repository.addComment({ entityType: "vehicle", entityId: "vehicle-01", body: "hello", authorEmployeeId: "employee-999" })).toThrow("Comment author not found.");
  });

  it("keeps a reply on its parent's record and refuses a reply to a reply", () => {
    const repository = repo();

    expect(() => repository.addComment({ entityType: "vehicle", entityId: "vehicle-02", body: "wrong record", authorEmployeeId: kabelo, parentCommentId: "comment-01" })).toThrow("A reply must stay on its own record.");
    expect(() => repository.addComment({ entityType: "board-item", entityId: "board-item-001", body: "nested", authorEmployeeId: kabelo, parentCommentId: "comment-02" })).toThrow("A reply cannot be replied to.");
  });
});

describe("mentions", () => {
  it("notifies the mentioned colleague and links back to the comment", () => {
    const repository = repo();

    const id = repository.addComment({ entityType: "vehicle", entityId: "vehicle-01", body: "@Naledi Ndlovu can you call the buyer?", authorEmployeeId: kabelo });

    const state = repository.getState();
    const comment = state.comments.find((candidate) => candidate.id === id);
    const notification = state.notifications.find((candidate) => candidate.commentId === id);

    expect(comment?.mentions).toEqual([naledi]);
    expect(notification?.category).toBe("mention");
    expect(notification?.recipientEmployeeId).toBe(naledi);
    expect(notification?.relatedId).toBe("vehicle-01");
    expect(notification?.read).toBe(false);
    expect(notification?.priority).toBe("high");
  });

  it("does not notify the author for mentioning themselves", () => {
    const repository = repo();
    const before = repository.getState().notifications.length;

    repository.addComment({ entityType: "vehicle", entityId: "vehicle-01", body: "note to self @Kabelo Molefe", authorEmployeeId: kabelo });

    expect(repository.getState().notifications).toHaveLength(before);
  });

  it("delivers a mention notification only to the person mentioned", () => {
    const repository = repo();
    repository.addComment({ entityType: "vehicle", entityId: "vehicle-01", body: "@Naledi Ndlovu please review", authorEmployeeId: kabelo });
    const state = repository.getState();

    const forNaledi = scopeStateForAccount(state, getDemoAccount("sales")).notifications;
    const forManager = scopeStateForAccount(state, getDemoAccount("manager")).notifications;

    expect(forNaledi.some((notification) => notification.category === "mention")).toBe(true);
    expect(forManager.some((notification) => notification.category === "mention")).toBe(false);
  });

  it("recalculates mentions when the comment is edited", () => {
    const repository = repo();
    const id = repository.addComment({ entityType: "vehicle", entityId: "vehicle-01", body: "no mention yet", authorEmployeeId: kabelo });

    repository.editComment(id, "actually @Naledi Ndlovu should see this");

    const comment = repository.getState().comments.find((candidate) => candidate.id === id);
    expect(comment?.mentions).toEqual([naledi]);
    expect(comment?.editedAt).toBeDefined();
  });
});

describe("thread lifecycle", () => {
  it("resolves and reopens a discussion", () => {
    const repository = repo();

    repository.resolveComment("comment-01", naledi);
    const resolved = repository.getState().comments.find((candidate) => candidate.id === "comment-01");
    expect(resolved?.resolvedAt).toBeDefined();
    expect(resolved?.resolvedByEmployeeId).toBe(naledi);

    repository.reopenComment("comment-01");
    const reopened = repository.getState().comments.find((candidate) => candidate.id === "comment-01");
    expect(reopened?.resolvedAt).toBeUndefined();
    expect(reopened?.resolvedByEmployeeId).toBeUndefined();
  });

  it("refuses to resolve a reply on its own", () => {
    const repository = repo();

    expect(() => repository.resolveComment("comment-02", naledi)).toThrow("Resolve the thread, not a reply.");
  });

  it("toggles a pin", () => {
    const repository = repo();

    repository.toggleCommentPin("comment-03");
    expect(repository.getState().comments.find((candidate) => candidate.id === "comment-03")?.pinned).toBe(true);

    repository.toggleCommentPin("comment-03");
    expect(repository.getState().comments.find((candidate) => candidate.id === "comment-03")?.pinned).toBe(false);
  });

  it("adds and removes a reaction, dropping it when nobody is left", () => {
    const repository = repo();

    repository.toggleCommentReaction("comment-03", "👍", naledi);
    expect(repository.getState().comments.find((candidate) => candidate.id === "comment-03")?.reactions).toEqual([{ emoji: "👍", employeeIds: [naledi] }]);

    repository.toggleCommentReaction("comment-03", "👍", naledi);
    expect(repository.getState().comments.find((candidate) => candidate.id === "comment-03")?.reactions).toEqual([]);
  });
});

describe("comment visibility", () => {
  it("hides a discussion on a record the viewer cannot see", () => {
    const repository = repo();
    const state = repository.getState();

    const stockScope = scopeStateForAccount(state, getDemoAccount("stock"));
    const visibleVehicles = new Set(stockScope.vehicles.map((vehicle) => vehicle.id));

    expect(stockScope.comments.every((comment) => comment.entityType !== "vehicle" || visibleVehicles.has(comment.entityId))).toBe(true);
    expect(stockScope.comments.length).toBeLessThan(state.comments.length);
  });

  it("never shows a reply whose parent is hidden", () => {
    const repository = repo();
    const scoped = scopeStateForAccount(repository.getState(), getDemoAccount("sales"));
    const visible = new Set(scoped.comments.map((comment) => comment.id));

    expect(scoped.comments.every((comment) => comment.parentCommentId === undefined || visible.has(comment.parentCommentId))).toBe(true);
  });

  it("gives a denied account no discussion at all", () => {
    const repository = repo();

    const denied = scopeStateForAccount(repository.getState(), { ...getDemoAccount("owner"), organizationId: "org-rival-motors" });

    expect(denied.comments).toEqual([]);
  });
});

describe("mentions on board items", () => {
  it("does not surface a mention on a record the mentioned colleague cannot reach", () => {
    const repository = repo();

    const id = repository.addComment({ entityType: "board-item", entityId: "board-item-001", body: "@Naledi Ndlovu can you confirm?", authorEmployeeId: kabelo });
    const scoped = scopeStateForAccount(repository.getState(), getDemoAccount("sales"));

    // board-item-001 is stock-controller work, outside an own-scoped sales executive.
    // The mention is stored, but it is not delivered through a record she cannot open.
    expect(scoped.boardItems.some((item) => item.id === "board-item-001")).toBe(false);
    expect(scoped.notifications.some((notification) => notification.commentId === id)).toBe(false);
  });

  it("delivers a board item mention to the person mentioned", () => {
    const repository = repo();

    const id = repository.addComment({ entityType: "board-item", entityId: "board-item-105", body: "@Naledi Ndlovu can you confirm?", authorEmployeeId: kabelo });
    const scoped = scopeStateForAccount(repository.getState(), getDemoAccount("sales"));

    expect(scoped.notifications.some((notification) => notification.commentId === id)).toBe(true);
    expect(validateDemoState(repository.getState())).toEqual([]);
  });

  it("notifies a colleague added by editing a comment", () => {
    const repository = repo();
    const id = repository.addComment({ entityType: "vehicle", entityId: "vehicle-01", body: "nobody named", authorEmployeeId: kabelo });
    const before = repository.getState().notifications.length;

    repository.editComment(id, "actually @Naledi Ndlovu should look");

    const after = repository.getState().notifications;
    expect(after.length).toBe(before + 1);
    expect(after[0].recipientEmployeeId).toBe(naledi);
    expect(after[0].commentId).toBe(id);
  });

  it("does not notify the same colleague twice for an unrelated edit", () => {
    const repository = repo();
    const id = repository.addComment({ entityType: "vehicle", entityId: "vehicle-01", body: "@Naledi Ndlovu please look", authorEmployeeId: kabelo });
    const afterCreate = repository.getState().notifications.length;

    repository.editComment(id, "@Naledi Ndlovu please look today");

    expect(repository.getState().notifications).toHaveLength(afterCreate);
  });
});
