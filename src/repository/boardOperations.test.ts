import { describe, expect, it } from "vitest";
import { memoryStorage } from "../test/memoryStorage";
import { createDemoRepository } from "./demoRepository";
import { validateDemoState } from "./seedIntegrity";
import { getDemoAccount } from "../app/access";
import { scopeStateForAccount } from "../app/stateScope";
import { itemsForView } from "../domain/boards";

const repo = () => createDemoRepository(memoryStorage());

describe("board item operations", () => {
  it("adds an item to a group and records who added it", () => {
    const repository = repo();
    repository.setAuditActor("Kabelo Molefe · Stock Controller");

    const id = repository.addBoardItem("board-01", "group-01", "  Replace wiper blades  ");
    const item = repository.getState().boardItems.find((candidate) => candidate.id === id);

    expect(item?.title).toBe("Replace wiper blades");
    expect(item?.groupId).toBe("group-01");
    expect(item?.createdBy).toBe("Kabelo Molefe · Stock Controller");
    expect(item?.values).toEqual({});
    expect(repository.getState().activities[0].action).toBe("Board item added");
  });

  it("refuses an empty title and a group from another board", () => {
    const repository = repo();

    expect(() => repository.addBoardItem("board-01", "group-01", "   ")).toThrow("Board item needs a title.");
    expect(() => repository.addBoardItem("board-01", "group-04", "Cross-board item")).toThrow("Board group not found.");
  });

  it("never reissues an item id", () => {
    const repository = repo();
    const existing = repository.getState().boardItems.map((item) => item.id);

    const first = repository.addBoardItem("board-01", "group-01", "One");
    const second = repository.addBoardItem("board-01", "group-01", "Two");

    expect(existing).not.toContain(first);
    expect(first).not.toBe(second);
  });
});

describe("board cell values", () => {
  it("writes a valid value and stamps the editor", () => {
    const repository = repo();
    repository.setAuditActor("Lindiwe Khumalo · Sales Manager");

    repository.setBoardCellValue("board-item-001", "column-01", { kind: "option", optionId: "status-done" });

    const item = repository.getState().boardItems.find((candidate) => candidate.id === "board-item-001");
    expect(item?.values["column-01"]).toEqual({ kind: "option", optionId: "status-done" });
    expect(item?.updatedBy).toBe("Lindiwe Khumalo · Sales Manager");
  });

  it("refuses a value the column cannot hold", () => {
    const repository = repo();

    expect(() => repository.setBoardCellValue("board-item-001", "column-01", { kind: "text", text: "Done" })).toThrow(/takes a option value/);
    expect(() => repository.setBoardCellValue("board-item-001", "column-05", { kind: "number", number: 300 })).toThrow(/percentage/);
    expect(() => repository.setBoardCellValue("board-item-001", "column-06", { kind: "relation", recordType: "vehicle", recordId: "vehicle-999" })).toThrow(/missing vehicle/);
  });

  it("refuses a column that belongs to another board", () => {
    const repository = repo();

    expect(() => repository.setBoardCellValue("board-item-001", "column-07", { kind: "option", optionId: "status-done" })).toThrow("Board column not found.");
  });

  it("leaves the stored state valid after every write", () => {
    const repository = repo();

    repository.addBoardItem("board-01", "group-02", "Check tyre tread");
    repository.setBoardCellValue("board-item-002", "column-02", { kind: "person", employeeId: "employee-04" });
    repository.moveBoardItem("board-item-003", "group-03");

    expect(validateDemoState(repository.getState())).toEqual([]);
  });
});

describe("board item movement", () => {
  it("moves an item between groups on the same board", () => {
    const repository = repo();

    repository.moveBoardItem("board-item-001", "group-03");

    expect(repository.getState().boardItems.find((item) => item.id === "board-item-001")?.groupId).toBe("group-03");
    expect(repository.getState().activities[0].action).toBe("Board item moved");
  });

  it("refuses a group on a different board", () => {
    const repository = repo();

    expect(() => repository.moveBoardItem("board-item-001", "group-04")).toThrow("Board group not found.");
  });

  it("records nothing when the item is already in the group", () => {
    const repository = repo();
    const before = repository.getState().activities.length;

    const current = repository.getState().boardItems.find((item) => item.id === "board-item-001")!;
    repository.moveBoardItem("board-item-001", current.groupId);

    expect(repository.getState().activities).toHaveLength(before);
  });
});

describe("saved views", () => {
  it("saves a filter and narrows the view without changing records", () => {
    const repository = repo();
    const itemsBefore = repository.getState().boardItems.length;

    repository.saveBoardView("view-01", { title: "High priority", filters: [{ columnId: "column-04", operator: "is", value: "High" }] });

    const state = repository.getState();
    const view = state.boardViews.find((candidate) => candidate.id === "view-01")!;
    expect(view.title).toBe("High priority");
    expect(itemsForView(state, view).length).toBeLessThan(itemsBefore);
    expect(state.boardItems).toHaveLength(itemsBefore);
  });

  it("refuses a filter on a column from another board", () => {
    const repository = repo();

    expect(() => repository.saveBoardView("view-01", { filters: [{ columnId: "column-07", operator: "is", value: "Done" }] })).toThrow("Board column not found.");
  });
});

describe("board tenancy", () => {
  it("hides another organization's workspace and everything under it", () => {
    const repository = repo();
    const state = repository.getState();
    state.workspaces = state.workspaces.map((workspace) => workspace.id === "workspace-01" ? { ...workspace, organizationId: "org-rival-motors" } : workspace);

    const visible = scopeStateForAccount(state, getDemoAccount("owner"));

    expect(visible.workspaces.some((workspace) => workspace.id === "workspace-01")).toBe(false);
    expect(visible.boards.some((board) => board.workspaceId === "workspace-01")).toBe(false);
    expect(visible.boardItems.some((item) => item.boardId === "board-01")).toBe(false);
    expect(visible.boardColumns.some((column) => column.boardId === "board-01")).toBe(false);
    expect(visible.boardViews.some((view) => view.boardId === "board-01")).toBe(false);
  });

  it("gives a denied account no boards at all", () => {
    const repository = repo();

    const denied = scopeStateForAccount(repository.getState(), { ...getDemoAccount("owner"), organizationId: "org-rival-motors" });

    expect(denied.workspaces).toEqual([]);
    expect(denied.boards).toEqual([]);
    expect(denied.boardItems).toEqual([]);
  });
});

describe("board item record scope", () => {
  it("hides an item that links to a record the viewer cannot see", () => {
    const repository = repo();
    const state = repository.getState();

    const salesScope = scopeStateForAccount(state, getDemoAccount("sales"));
    const visibleLeadIds = new Set(salesScope.leads.map((lead) => lead.id));
    const linkedLeads = salesScope.boardItems.flatMap((item) => Object.values(item.values).flatMap((value) => value.kind === "relation" && value.recordType === "lead" ? [value.recordId] : []));

    expect(linkedLeads.length).toBeGreaterThan(0);
    expect(linkedLeads.every((leadId) => visibleLeadIds.has(leadId))).toBe(true);
  });

  it("hides an item linked to a vehicle outside the viewer's branch", () => {
    const repository = repo();
    const state = repository.getState();

    const stockScope = scopeStateForAccount(state, getDemoAccount("stock"));
    const visibleVehicleIds = new Set(stockScope.vehicles.map((vehicle) => vehicle.id));
    const linkedVehicles = stockScope.boardItems.flatMap((item) => Object.values(item.values).flatMap((value) => value.kind === "relation" && value.recordType === "vehicle" ? [value.recordId] : []));

    expect(linkedVehicles.every((vehicleId) => visibleVehicleIds.has(vehicleId))).toBe(true);
    expect(stockScope.boardItems.length).toBeLessThan(state.boardItems.length);
  });

  it("limits an own-scoped account to work assigned to it or unassigned", () => {
    const repository = repo();
    const state = repository.getState();
    const account = getDemoAccount("sales");
    const self = state.employees.find((employee) => employee.name === account.name)!;

    const scoped = scopeStateForAccount(state, account);
    const owners = scoped.boardItems.flatMap((item) => Object.values(item.values).flatMap((value) => value.kind === "person" ? [value.employeeId] : []));

    expect(owners.every((employeeId) => employeeId === self.id)).toBe(true);
  });

  it("never shows a subitem whose parent is hidden", () => {
    const repository = repo();
    const scoped = scopeStateForAccount(repository.getState(), getDemoAccount("sales"));
    const visible = new Set(scoped.boardItems.map((item) => item.id));

    expect(scoped.boardItems.every((item) => item.parentItemId === undefined || visible.has(item.parentItemId))).toBe(true);
  });

  it("resolves a saved filter to the same rows for every viewer", () => {
    const repository = repo();
    repository.saveBoardView("view-01", { filters: [{ columnId: "column-01", operator: "is", value: "Blocked" }] });
    const state = repository.getState();
    const view = state.boardViews.find((candidate) => candidate.id === "view-01")!;

    const raw = itemsForView(state, view).map((item) => item.id);
    const asOwner = itemsForView(scopeStateForAccount(state, getDemoAccount("owner")), view).map((item) => item.id);
    const asManager = itemsForView(scopeStateForAccount(state, getDemoAccount("manager")), view);

    expect(asOwner).toEqual(raw);
    expect(asManager.every((item) => item.values["column-01"]?.kind === "option" && item.values["column-01"].optionId === "status-blocked")).toBe(true);
  });
});

describe("saved view editing", () => {
  it("clears a grouping instead of silently keeping it", () => {
    const repository = repo();

    repository.saveBoardView("view-02", { groupByColumnId: undefined });

    expect(repository.getState().boardViews.find((view) => view.id === "view-02")?.groupByColumnId).toBeUndefined();
  });

  it("keeps the grouping when the patch does not mention it", () => {
    const repository = repo();

    repository.saveBoardView("view-02", { title: "Status board" });

    const view = repository.getState().boardViews.find((candidate) => candidate.id === "view-02");
    expect(view?.groupByColumnId).toBe("column-01");
    expect(view?.title).toBe("Status board");
  });
});
