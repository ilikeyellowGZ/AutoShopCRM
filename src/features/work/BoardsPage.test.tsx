import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { memoryStorage } from "../../test/memoryStorage";
import { createDemoRepository } from "../../repository/demoRepository";
import { getDemoAccount } from "../../app/access";
import { scopeStateForAccount } from "../../app/stateScope";
import { itemsForView } from "../../domain/boards";
import { BoardsPage } from "./BoardsPage";

afterEach(cleanup);

const setup = (overrides: Partial<Parameters<typeof BoardsPage>[0]> = {}) => {
  const repository = createDemoRepository(memoryStorage());
  const state = scopeStateForAccount(repository.getState(), getDemoAccount("owner"));
  render(<BoardsPage state={state} repository={repository} {...overrides} />);
  return { repository, state };
};

describe("boards page", () => {
  it("opens the first board and its first view", () => {
    const { state } = setup();

    expect(screen.getByRole("heading", { name: "Vehicle Preparation", level: 1 })).toBeInTheDocument();
    const rows = screen.getAllByRole("row").length - 1;
    expect(rows).toBe(itemsForView(state, state.boardViews.find((view) => view.id === "view-01")!).length);
  });

  it("switches views over the same records without losing items", async () => {
    const user = userEvent.setup();
    const { state } = setup();
    const expected = itemsForView(state, state.boardViews.find((view) => view.id === "view-01")!).length;

    await user.click(screen.getByRole("button", { name: "By status" }));

    const laneNames = ["Not started", "In progress", "Blocked", "Done"];
    const cards = laneNames.flatMap((name) => within(screen.getByRole("region", { name })).queryAllByRole("listitem")).filter((card) => !card.textContent?.includes("Nothing in this lane"));
    expect(cards).toHaveLength(expected);
  });

  it("shows a saved filter as a narrower view", async () => {
    const user = userEvent.setup();
    const { state } = setup();
    const blocked = itemsForView(state, state.boardViews.find((view) => view.id === "view-05")!).length;

    await user.click(screen.getByRole("button", { name: "Blocked only" }));

    expect(screen.getAllByRole("row").length - 1).toBe(blocked);
  });

  it("reports workload per person and counts unassigned work", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Team workload" }));

    expect(screen.getByText(/unassigned/)).toBeInTheDocument();
    expect(screen.getByText("Busiest")).toBeInTheDocument();
  });

  it("adds an item when the role may write, and stores it", async () => {
    const user = userEvent.setup();
    const { repository } = setup({ canWriteItems: true });

    await user.type(screen.getByLabelText("New item"), "Fit new battery");
    await user.click(screen.getByRole("button", { name: "Add item" }));

    expect(repository.getState().boardItems.some((item) => item.title === "Fit new battery")).toBe(true);
  });

  it("surfaces a rejected item instead of failing silently", async () => {
    const user = userEvent.setup();
    setup({ canWriteItems: true });

    await user.click(screen.getByRole("button", { name: "Add item" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Board item needs a title.");
  });

  it("hides item and view controls from a read-only role", () => {
    setup({ canWriteItems: false, canManageViews: false });

    expect(screen.queryByLabelText("New item")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("opens an item and lists its subitems", async () => {
    const user = userEvent.setup();
    const { state } = setup();
    const item = state.boardItems.find((candidate) => candidate.id === "board-item-001")!;

    await user.click(screen.getByRole("button", { name: item.title }));

    const panel = screen.getByRole("complementary", { name: `${item.title} detail` });
    expect(within(panel).getByText("Subitems")).toBeInTheDocument();
    expect(within(panel).getByText("Book workshop bay")).toBeInTheDocument();
  });

  it("tells a denied account there is nothing rather than rendering blank", () => {
    const repository = createDemoRepository(memoryStorage());
    const denied = scopeStateForAccount(repository.getState(), { ...getDemoAccount("owner"), organizationId: "org-rival-motors" });

    render(<BoardsPage state={denied} repository={repository} />);

    expect(screen.getByText("No boards are available for your access.")).toBeInTheDocument();
  });
});
