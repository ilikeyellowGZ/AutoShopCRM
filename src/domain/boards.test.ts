import { describe, expect, it } from "vitest";
import { createSeedState } from "../repository/seed";
import type { BoardView } from "./models";
import {
  boardColumns,
  boardItems,
  datedItemsForView,
  itemsForView,
  lanesForView,
  subitemsOf,
  validateCellValue,
  valueKindForColumn,
  workloadForView,
} from "./boards";

const state = () => createSeedState();
const viewById = (id: string): BoardView => {
  const found = createSeedState().boardViews.find((view) => view.id === id);
  if (!found) throw new Error(`Unknown view ${id}`);
  return found;
};
const columnById = (id: string) => {
  const found = createSeedState().boardColumns.find((column) => column.id === id);
  if (!found) throw new Error(`Unknown column ${id}`);
  return found;
};

describe("board column value contract", () => {
  it("declares exactly one value shape for every column kind", () => {
    for (const column of createSeedState().boardColumns) {
      expect(valueKindForColumn[column.kind]).toBeDefined();
    }
  });

  it("rejects a value whose shape does not match the column kind", () => {
    const issue = validateCellValue(state(), columnById("column-01"), { kind: "text", text: "In progress" });
    expect(issue?.code).toBe("kind-mismatch");
  });

  it("rejects an option the column does not define", () => {
    const issue = validateCellValue(state(), columnById("column-01"), { kind: "option", optionId: "status-invented" });
    expect(issue?.code).toBe("unknown-option");
  });

  it("accepts an option the column does define", () => {
    expect(validateCellValue(state(), columnById("column-01"), { kind: "option", optionId: "status-done" })).toBeNull();
  });

  it("holds a progress column to a percentage", () => {
    expect(validateCellValue(state(), columnById("column-05"), { kind: "number", number: 140 })?.code).toBe("out-of-range");
    expect(validateCellValue(state(), columnById("column-05"), { kind: "number", number: 40 })).toBeNull();
  });

  it("rejects a person who is not an employee", () => {
    const issue = validateCellValue(state(), columnById("column-02"), { kind: "person", employeeId: "employee-999" });
    expect(issue?.code).toBe("unknown-person");
  });

  it("rejects a relation to the wrong record type or a missing record", () => {
    expect(validateCellValue(state(), columnById("column-06"), { kind: "relation", recordType: "lead", recordId: "lead-01" })?.code).toBe("unknown-record");
    expect(validateCellValue(state(), columnById("column-06"), { kind: "relation", recordType: "vehicle", recordId: "vehicle-999" })?.code).toBe("unknown-record");
    expect(validateCellValue(state(), columnById("column-06"), { kind: "relation", recordType: "vehicle", recordId: "vehicle-01" })).toBeNull();
  });
});

describe("board records and views", () => {
  it("lists top-level items without repeating subitems", () => {
    const current = state();
    const top = boardItems(current, "board-01");
    const subitems = subitemsOf(current, "board-item-001");

    expect(subitems.length).toBeGreaterThan(0);
    expect(top.some((item) => subitems.some((subitem) => subitem.id === item.id))).toBe(false);
    expect(top.every((item) => item.parentItemId === undefined)).toBe(true);
  });

  it("returns columns in declared order", () => {
    const positions = boardColumns(state(), "board-01").map((column) => column.position);
    expect(positions).toEqual([...positions].sort((first, second) => first - second));
  });

  it("reads every view from the same records, differing only by filter", () => {
    const current = state();
    const table = itemsForView(current, viewById("view-01"));
    const kanban = lanesForView(current, viewById("view-02")).flatMap((lane) => lane.items);

    expect(kanban.map((item) => item.id).sort()).toEqual(table.map((item) => item.id).sort());
  });

  it("applies a saved filter without touching the underlying records", () => {
    const current = state();
    const all = itemsForView(current, viewById("view-01"));
    const blocked = itemsForView(current, viewById("view-05"));

    expect(blocked.length).toBeGreaterThan(0);
    expect(blocked.length).toBeLessThan(all.length);
    expect(blocked.every((item) => item.values["column-01"]?.kind === "option" && item.values["column-01"].optionId === "status-blocked")).toBe(true);
    expect(current.boardItems).toHaveLength(createSeedState().boardItems.length);
  });

  it("builds one kanban lane per option and places every item in exactly one", () => {
    const current = state();
    const lanes = lanesForView(current, viewById("view-02"));
    const placed = lanes.flatMap((lane) => lane.items.map((item) => item.id));

    expect(lanes.map((lane) => lane.title)).toContain("Blocked");
    expect(new Set(placed).size).toBe(placed.length);
    expect(placed.length).toBe(itemsForView(current, viewById("view-02")).length);
  });

  it("reports unassigned work rather than hiding it from workload", () => {
    const current = state();
    const unowned = current.boardItems.find((item) => item.id === "board-item-001")!;
    delete unowned.values["column-02"];

    const workload = workloadForView(current, viewById("view-04"));

    expect(workload.unassigned.map((item) => item.id)).toContain("board-item-001");
    expect(workload.assigned.every((entry) => entry.items.length > 0)).toBe(true);
  });

  it("orders calendar entries by their date column", () => {
    const dated = datedItemsForView(state(), viewById("view-03"));
    const dates = dated.map((entry) => entry.date);

    expect(dates.length).toBeGreaterThan(0);
    expect(dates).toEqual([...dates].sort());
  });
});
