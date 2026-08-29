import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { memoryStorage } from "../../test/memoryStorage";
import { createDemoRepository } from "../../repository/demoRepository";
import { getDemoAccount } from "../../app/access";
import { scopeStateForAccount } from "../../app/stateScope";
import { ActionCentreView } from "./ActionCentreView";

afterEach(cleanup);

const scoped = (repository: ReturnType<typeof createDemoRepository>) => scopeStateForAccount(repository.getState(), getDemoAccount("owner"));

describe("notification centre", () => {
  it("orders notifications newest first and reports the unread count", () => {
    const repository = createDemoRepository(memoryStorage());
    const state = scoped(repository);

    render(<ActionCentreView state={state} repository={repository} view="notifications" />);

    const rendered = screen.getAllByRole("listitem").map((item) => item.querySelector("strong")?.textContent);
    const expected = [...state.notifications].sort((first, second) => second.createdAt.localeCompare(first.createdAt)).map((notification) => notification.title);
    expect(rendered).toEqual(expected);
    expect(screen.getByText(`${state.notifications.filter((notification) => !notification.read).length} unread`)).toBeInTheDocument();
  });

  it("filters to a single category and back", async () => {
    const user = userEvent.setup();
    const repository = createDemoRepository(memoryStorage());
    const state = scoped(repository);

    render(<ActionCentreView state={state} repository={repository} view="notifications" />);
    await user.click(screen.getByRole("button", { name: "Deals" }));

    const dealTitles = state.notifications.filter((notification) => notification.category === "deal").map((notification) => notification.title);
    expect(screen.getAllByRole("listitem")).toHaveLength(dealTitles.length);
    for (const title of dealTitles) expect(screen.getByText(title)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getAllByRole("listitem")).toHaveLength(state.notifications.length);
  });

  it("marks every visible notification read without touching the rest", async () => {
    const user = userEvent.setup();
    const repository = createDemoRepository(memoryStorage());
    const before = scoped(repository);
    const otherCategories = before.notifications.filter((notification) => notification.category !== "deal" && !notification.read).length;

    render(<ActionCentreView state={before} repository={repository} view="notifications" />);
    await user.click(screen.getByRole("button", { name: "Deals" }));
    await user.click(screen.getByRole("button", { name: "Mark all read" }));

    const after = repository.getState().notifications;
    expect(after.filter((notification) => notification.category === "deal").every((notification) => notification.read)).toBe(true);
    expect(after.filter((notification) => notification.category !== "deal" && !notification.read)).toHaveLength(otherCategories);
  });

  it("hides the mark-all control from a role that cannot write notifications", () => {
    const repository = createDemoRepository(memoryStorage());

    render(<ActionCentreView state={scoped(repository)} repository={repository} view="notifications" canMarkNotifications={false} />);

    expect(screen.queryByRole("button", { name: "Mark all read" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mark read" })).not.toBeInTheDocument();
  });

  it("flags a high priority notification", () => {
    const repository = createDemoRepository(memoryStorage());
    const state = scoped(repository);
    const critical = state.notifications.find((notification) => notification.priority === "high");

    render(<ActionCentreView state={state} repository={repository} view="notifications" />);

    const item = screen.getByText(critical!.title).closest("li");
    expect(within(item!).getByText("High priority")).toBeInTheDocument();
  });

  it("shows an empty state rather than a blank list", () => {
    const repository = createDemoRepository(memoryStorage());
    const state = { ...scoped(repository), notifications: [] };

    render(<ActionCentreView state={state} repository={repository} view="notifications" />);

    expect(screen.getByText("No notifications in this view.")).toBeInTheDocument();
  });
});
