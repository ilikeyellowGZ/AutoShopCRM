import { useState } from "react";
import type { BoardCellValue, BoardColumn, BoardItem, BoardView, DemoState } from "../../domain/models";
import type { DemoRepository } from "../../repository/demoRepository";
import type { NavigationTarget } from "../../app/routes";
import { Button } from "../../components/controls/Button";
import { StatusPill } from "../../components/controls/StatusPill";
import { RecordTable, type RecordTableColumn } from "../../components/data-display/RecordTable";
import { CommentThread } from "../collaboration/CommentThread";
import {
  boardColumns,
  boardGroups,
  boardViews,
  datedItemsForView,
  itemsForView,
  lanesForView,
  subitemsOf,
  workloadForView,
} from "../../domain/boards";

type BoardsPageProps = {
  state: DemoState;
  repository: DemoRepository;
  boardId?: string;
  onNavigate?: (target: NavigationTarget) => void;
  canWriteItems?: boolean;
  canManageViews?: boolean;
  authorEmployeeId?: string;
};

const currency = new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 });

function cellText(state: DemoState, column: BoardColumn, value: BoardCellValue | undefined) {
  if (!value) return "—";
  switch (value.kind) {
    case "text": return value.text || "—";
    case "number": return column.kind === "money" ? currency.format(value.number) : column.kind === "progress" ? `${value.number}%` : String(value.number);
    case "checkbox": return value.checked ? "Yes" : "No";
    case "date": return value.date.slice(0, 10);
    case "options": return value.optionIds.map((optionId) => column.options.find((option) => option.id === optionId)?.label ?? optionId).join(", ") || "—";
    case "person": return state.employees.find((employee) => employee.id === value.employeeId)?.name ?? "Outside your access";
    case "relation": return value.recordId;
    case "option": return column.options.find((option) => option.id === value.optionId)?.label ?? value.optionId;
  }
}

function Cell({ state, column, item }: { state: DemoState; column: BoardColumn; item: BoardItem }) {
  const value = item.values[column.id];
  if (value?.kind === "option") {
    const option = column.options.find((candidate) => candidate.id === value.optionId);
    return <StatusPill tone={option?.tone ?? "neutral"}>{option?.label ?? value.optionId}</StatusPill>;
  }
  return <>{cellText(state, column, value)}</>;
}

function TableView({ state, view, onOpenItem }: { state: DemoState; view: BoardView; onOpenItem: (item: BoardItem) => void }) {
  const columns = boardColumns(state, view.boardId);
  const groups = boardGroups(state, view.boardId);
  const items = itemsForView(state, view);
  const tableColumns: RecordTableColumn<BoardItem>[] = [
    { key: "title", label: "Item", render: (item) => <Button variant="secondary" onClick={() => onOpenItem(item)}>{item.title}</Button> },
    { key: "group", label: "Group", render: (item) => groups.find((group) => group.id === item.groupId)?.title ?? "—" },
    ...columns.map((column) => ({ key: column.id, label: column.title, render: (item: BoardItem) => <Cell state={state} column={column} item={item} /> })),
  ];
  return <RecordTable columns={tableColumns} records={items} caption={`${view.title} board items`} emptyMessage="No items match this view." />;
}

function KanbanView({ state, view, canWriteItems, repository, onError }: { state: DemoState; view: BoardView; canWriteItems: boolean; repository: DemoRepository; onError: (message: string) => void }) {
  const lanes = lanesForView(state, view);
  const groups = boardGroups(state, view.boardId);
  const groupingColumn = view.groupByColumnId ? boardColumns(state, view.boardId).find((column) => column.id === view.groupByColumnId) : undefined;
  const attempt = (change: () => void) => {
    try { onError(""); change(); }
    catch (cause) { onError(cause instanceof Error ? cause.message : "That change could not be saved."); }
  };
  const moves = (item: BoardItem) => groupingColumn
    ? groupingColumn.options.filter((option) => { const value = item.values[groupingColumn.id]; return value?.kind !== "option" || value.optionId !== option.id; })
        .map((option) => ({ key: option.id, label: option.label, run: () => repository.setBoardCellValue(item.id, groupingColumn.id, { kind: "option", optionId: option.id }) }))
    : groups.filter((group) => group.id !== item.groupId).map((group) => ({ key: group.id, label: group.title, run: () => repository.moveBoardItem(item.id, group.id) }));
  return <div className="pipeline-board">{lanes.map((lane) => <section key={lane.id} className="pipeline-column" aria-label={lane.title}>
    <header className="crm-heading"><h3>{lane.title}</h3><span>{lane.items.length}</span></header>
    <ul className="pipeline-cards">{lane.items.length ? lane.items.map((item) => <li key={item.id} className="pipeline-card">
      <strong>{item.title}</strong>
      <p className="pipeline-value">{groups.find((group) => group.id === item.groupId)?.title ?? ""}</p>
      {canWriteItems ? <div className="pipeline-card-actions">{moves(item).map((move) => <Button key={move.key} variant="secondary" onClick={() => attempt(move.run)}>Move to {move.label}</Button>)}</div> : null}
    </li>) : <li className="my-day-empty">Nothing in this lane.</li>}</ul>
  </section>)}</div>;
}

function CalendarView({ state, view }: { state: DemoState; view: BoardView }) {
  const dated = datedItemsForView(state, view);
  const hasDateColumn = boardColumns(state, view.boardId).some((column) => column.kind === "date");
  if (!hasDateColumn) return <p className="my-day-empty">This board has no date column, so there is nothing to place on a calendar.</p>;
  if (!dated.length) return <p className="my-day-empty">No items in this view carry a date.</p>;
  const byDay = dated.reduce<Record<string, BoardItem[]>>((days, entry) => {
    const day = entry.date.slice(0, 10);
    return { ...days, [day]: [...(days[day] ?? []), entry.item] };
  }, {});
  return <div className="pipeline-board">{Object.entries(byDay).map(([day, items]) => <section key={day} className="pipeline-column" aria-label={day}>
    <header className="crm-heading"><h3>{day}</h3><span>{items.length}</span></header>
    <ul className="pipeline-cards">{items.map((item) => <li key={item.id} className="pipeline-card"><strong>{item.title}</strong></li>)}</ul>
  </section>)}</div>;
}

function WorkloadView({ state, view }: { state: DemoState; view: BoardView }) {
  const { assigned, unassigned } = workloadForView(state, view);
  const busiest = assigned[0]?.items.length ?? 0;
  return <div className="pipeline-page">
    <ul className="action-centre-list">{assigned.map((entry) => <li key={entry.employeeId}>
      <div><strong>{entry.name}</strong><p>{entry.items.length} open {entry.items.length === 1 ? "item" : "items"}</p></div>
      <div className="action-centre-buttons">{entry.items.length === busiest && busiest > 0 ? <StatusPill tone="warning">Busiest</StatusPill> : null}</div>
    </li>)}</ul>
    <p className="pipeline-value">{unassigned.length} unassigned {unassigned.length === 1 ? "item" : "items"}</p>
  </div>;
}

export function BoardsPage({ state, repository, boardId, onNavigate, canWriteItems = false, canManageViews = false, authorEmployeeId }: BoardsPageProps) {
  const boards = state.boards;
  const board = boards.find((candidate) => candidate.id === boardId) ?? boards[0];
  const views = board ? boardViews(state, board.id) : [];
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [openItemId, setOpenItemId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState("");

  if (!board) return <section className="pipeline-page"><header className="crm-heading"><p className="crm-eyebrow">Work</p><h1>Boards</h1></header><p className="my-day-empty">No boards are available for your access.</p></section>;

  const view = views.find((candidate) => candidate.id === activeViewId) ?? views[0];
  const groups = boardGroups(state, board.id);
  const openItem = openItemId ? state.boardItems.find((item) => item.id === openItemId && item.boardId === board.id) : undefined;

  const addItem = () => {
    setError("");
    try {
      repository.addBoardItem(board.id, groups[0].id, newTitle);
      setNewTitle("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The item could not be added.");
    }
  };

  return <section className="pipeline-page" data-tour="work-board" aria-labelledby="boards-title">
    <header className="crm-heading">
      <p className="crm-eyebrow">Work</p>
      <h1 id="boards-title">{board.title}</h1>
      <span>{board.description}</span>
    </header>

    {boards.length > 1 ? <div className="sales-actions" role="group" aria-label="Choose a board">
      {boards.map((candidate) => <Button key={candidate.id} variant={candidate.id === board.id ? "primary" : "secondary"} aria-pressed={candidate.id === board.id} onClick={() => { setActiveViewId(null); setOpenItemId(null); setError(""); onNavigate?.({ page: "work", subview: candidate.id }); }}>{candidate.title}</Button>)}
    </div> : null}

    <div className="sales-actions" role="group" aria-label="Choose a view">
      {views.map((candidate) => <Button key={candidate.id} variant={candidate.id === view?.id ? "primary" : "secondary"} aria-pressed={candidate.id === view?.id} onClick={() => setActiveViewId(candidate.id)}>{candidate.title}</Button>)}
      {canManageViews && view ? <Button variant="secondary" onClick={() => { try { setError(""); repository.saveBoardView(view.id, { filters: [] }); } catch (cause) { setError(cause instanceof Error ? cause.message : "The view could not be saved."); } }}>Clear filters</Button> : null}
    </div>

    {canWriteItems && groups.length ? <div className="crm-form">
      <label htmlFor="new-board-item">New item</label>
      <input id="new-board-item" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder={`Add to ${groups[0].title}`} />
      <Button onClick={addItem}>Add item</Button>
    </div> : null}

    {error ? <p className="form-error" role="alert">{error}</p> : null}

    {!view ? <p className="my-day-empty">This board has no views yet.</p>
      : view.kind === "kanban" ? <KanbanView state={state} view={view} canWriteItems={canWriteItems} repository={repository} onError={setError} />
      : view.kind === "calendar" || view.kind === "timeline" ? <CalendarView state={state} view={view} />
      : view.kind === "workload" ? <WorkloadView state={state} view={view} />
      : <TableView state={state} view={view} onOpenItem={(item) => setOpenItemId(item.id)} />}

    {openItem ? <aside className="pipeline-column" aria-label={`${openItem.title} detail`}>
      <header className="crm-heading"><h3>{openItem.title}</h3><Button variant="secondary" onClick={() => setOpenItemId(null)}>Close</Button></header>
      <ul className="action-centre-list">{boardColumns(state, board.id).map((column) => <li key={column.id}>
        <div><strong>{column.title}</strong><p><Cell state={state} column={column} item={openItem} /></p></div>
      </li>)}</ul>
      <h4>Subitems</h4>
      <ul className="pipeline-cards">{subitemsOf(state, openItem.id).map((subitem) => <li key={subitem.id} className="pipeline-card"><strong>{subitem.title}</strong></li>)}</ul>
      <CommentThread state={state} repository={repository} entityType="board-item" entityId={openItem.id} authorEmployeeId={authorEmployeeId} canComment={canWriteItems} />
    </aside> : null}
  </section>;
}
