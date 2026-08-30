import type {
  BoardCellValue,
  BoardColumn,
  BoardColumnKind,
  BoardFilter,
  BoardGroup,
  BoardItem,
  BoardView,
  DemoState,
  PersistedRecordType,
} from "./models";

/** Each column kind accepts exactly one value shape. Anything else is a mismatch, not a coercion. */
export const valueKindForColumn: Record<BoardColumnKind, BoardCellValue["kind"]> = {
  text: "text",
  number: "number",
  money: "number",
  status: "option",
  priority: "option",
  person: "person",
  date: "date",
  checkbox: "checkbox",
  tags: "options",
  progress: "number",
  relation: "relation",
};

export type CellIssue = { code: "kind-mismatch" | "unknown-option" | "out-of-range" | "unknown-person" | "unknown-record"; message: string };

export function validateCellValue(state: DemoState, column: BoardColumn, value: BoardCellValue): CellIssue | null {
  if (value.kind !== valueKindForColumn[column.kind]) {
    return { code: "kind-mismatch", message: `${column.title} takes a ${valueKindForColumn[column.kind]} value, not ${value.kind}.` };
  }
  const optionIds = new Set(column.options.map((option) => option.id));
  if (value.kind === "option" && !optionIds.has(value.optionId)) {
    return { code: "unknown-option", message: `${column.title} has no option ${value.optionId}.` };
  }
  if (value.kind === "options") {
    const unknown = value.optionIds.find((optionId) => !optionIds.has(optionId));
    if (unknown) return { code: "unknown-option", message: `${column.title} has no option ${unknown}.` };
  }
  if (column.kind === "progress" && value.kind === "number" && (value.number < 0 || value.number > 100)) {
    return { code: "out-of-range", message: `${column.title} is a percentage between 0 and 100.` };
  }
  if (value.kind === "person" && !state.employees.some((employee) => employee.id === value.employeeId)) {
    return { code: "unknown-person", message: `${column.title} points at a missing employee.` };
  }
  if (value.kind === "relation") {
    if (column.relationTarget && column.relationTarget !== value.recordType) {
      return { code: "unknown-record", message: `${column.title} links to a ${column.relationTarget}, not a ${value.recordType}.` };
    }
    if (!relatedRecordExists(state, value.recordType, value.recordId)) {
      return { code: "unknown-record", message: `${column.title} points at a missing ${value.recordType}.` };
    }
  }
  return null;
}

function relatedRecordExists(state: DemoState, recordType: PersistedRecordType, recordId: string): boolean {
  const collections: Record<PersistedRecordType, { id: string }[]> = {
    vehicle: state.vehicles,
    customer: state.customers,
    lead: state.leads,
    deal: state.deals,
    service: state.serviceJobs,
    task: state.tasks,
  };
  return (collections[recordType] ?? []).some((record) => record.id === recordId);
}

const byPosition = <T extends { position: number }>(first: T, second: T) => first.position - second.position;

export const boardColumns = (state: DemoState, boardId: string): BoardColumn[] =>
  state.boardColumns.filter((column) => column.boardId === boardId).sort(byPosition);

export const boardGroups = (state: DemoState, boardId: string): BoardGroup[] =>
  state.boardGroups.filter((group) => group.boardId === boardId).sort(byPosition);

export const boardViews = (state: DemoState, boardId: string): BoardView[] =>
  state.boardViews.filter((view) => view.boardId === boardId).sort(byPosition);

/** Top-level items only. Subitems hang off their parent and are never listed twice. */
export const boardItems = (state: DemoState, boardId: string): BoardItem[] =>
  state.boardItems.filter((item) => item.boardId === boardId && item.parentItemId === undefined).sort(byPosition);

export const subitemsOf = (state: DemoState, itemId: string): BoardItem[] =>
  state.boardItems.filter((item) => item.parentItemId === itemId).sort(byPosition);

function comparableText(state: DemoState, column: BoardColumn | undefined, value: BoardCellValue | undefined): string {
  if (!value) return "";
  switch (value.kind) {
    case "text": return value.text;
    case "number": return String(value.number);
    case "checkbox": return value.checked ? "true" : "false";
    case "date": return value.date;
    case "option": return column?.options.find((option) => option.id === value.optionId)?.label ?? value.optionId;
    case "options": return value.optionIds.map((optionId) => column?.options.find((option) => option.id === optionId)?.label ?? optionId).join(" ");
    case "person": return state.employees.find((employee) => employee.id === value.employeeId)?.name ?? value.employeeId;
    case "relation": return value.recordId;
  }
}

export function matchesFilter(state: DemoState, columns: BoardColumn[], item: BoardItem, filter: BoardFilter): boolean {
  const column = columns.find((candidate) => candidate.id === filter.columnId);
  const value = item.values[filter.columnId];
  const text = comparableText(state, column, value).toLowerCase();
  const target = filter.value.toLowerCase();
  switch (filter.operator) {
    case "is": return text === target;
    case "isNot": return text !== target;
    case "contains": return text.includes(target);
    case "before": return Boolean(value && value.kind === "date" && value.date < filter.value);
    case "after": return Boolean(value && value.kind === "date" && value.date > filter.value);
  }
}

/** Every view reads through here, so a filtered view can never disagree with the records behind it. */
export function itemsForView(state: DemoState, view: BoardView): BoardItem[] {
  const columns = boardColumns(state, view.boardId);
  return boardItems(state, view.boardId).filter((item) => view.filters.every((filter) => matchesFilter(state, columns, item, filter)));
}

export type BoardLane = { id: string; title: string; items: BoardItem[] };

/** Lanes for a kanban view: the grouping column's options, plus an explicit lane for unset values. */
export function lanesForView(state: DemoState, view: BoardView): BoardLane[] {
  const items = itemsForView(state, view);
  if (!view.groupByColumnId) return boardGroups(state, view.boardId).map((group) => ({ id: group.id, title: group.title, items: items.filter((item) => item.groupId === group.id) }));
  const column = boardColumns(state, view.boardId).find((candidate) => candidate.id === view.groupByColumnId);
  if (!column) return [{ id: "all", title: "All items", items }];
  const lanes = column.options.map((option) => ({
    id: option.id,
    title: option.label,
    items: items.filter((item) => { const value = item.values[column.id]; return value?.kind === "option" && value.optionId === option.id; }),
  }));
  const unset = items.filter((item) => { const value = item.values[column.id]; return !value || value.kind !== "option"; });
  return unset.length ? [...lanes, { id: "unset", title: `No ${column.title.toLowerCase()}`, items: unset }] : lanes;
}

export type WorkloadEntry = { employeeId: string; name: string; items: BoardItem[] };

/** Workload counts only what a person column actually assigns; unassigned work is reported, not hidden. */
export function workloadForView(state: DemoState, view: BoardView): { assigned: WorkloadEntry[]; unassigned: BoardItem[] } {
  const items = itemsForView(state, view);
  const personColumn = boardColumns(state, view.boardId).find((column) => column.kind === "person");
  if (!personColumn) return { assigned: [], unassigned: items };
  const byEmployee = new Map<string, BoardItem[]>();
  const unassigned: BoardItem[] = [];
  for (const item of items) {
    const value = item.values[personColumn.id];
    if (value?.kind === "person") byEmployee.set(value.employeeId, [...(byEmployee.get(value.employeeId) ?? []), item]);
    else unassigned.push(item);
  }
  const assigned = [...byEmployee.entries()]
    .map(([employeeId, entries]) => ({ employeeId, name: state.employees.find((employee) => employee.id === employeeId)?.name ?? employeeId, items: entries }))
    .sort((first, second) => second.items.length - first.items.length || first.name.localeCompare(second.name));
  return { assigned, unassigned };
}

/** Calendar and timeline read the same date column, so they cannot drift apart. */
export function datedItemsForView(state: DemoState, view: BoardView): { item: BoardItem; date: string }[] {
  const dateColumn = boardColumns(state, view.boardId).find((column) => column.kind === "date");
  if (!dateColumn) return [];
  return itemsForView(state, view)
    .map((item) => { const value = item.values[dateColumn.id]; return value?.kind === "date" ? { item, date: value.date } : null; })
    .filter((entry): entry is { item: BoardItem; date: string } => entry !== null)
    .sort((first, second) => first.date.localeCompare(second.date));
}
