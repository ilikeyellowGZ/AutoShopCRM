import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { memoryStorage } from "../../test/memoryStorage";
import { createDemoRepository } from "../../repository/demoRepository";
import { getDemoAccount } from "../../app/access";
import { scopeStateForAccount } from "../../app/stateScope";
import { CommentThread } from "./CommentThread";

afterEach(cleanup);

const kabelo = "employee-07";

const setup = (canComment = true) => {
  const repository = createDemoRepository(memoryStorage());
  const state = scopeStateForAccount(repository.getState(), getDemoAccount("owner"));
  render(<CommentThread state={state} repository={repository} entityType="board-item" entityId="board-item-001" authorEmployeeId={kabelo} canComment={canComment} />);
  return { repository, state };
};

describe("comment thread", () => {
  it("shows the discussion with its replies nested under the parent", () => {
    setup();

    expect(screen.getByText(/Bay is booked for Tuesday/)).toBeInTheDocument();
    expect(screen.getByText("Confirmed, they are fine with Tuesday.")).toBeInTheDocument();
    expect(screen.getByText("Pinned")).toBeInTheDocument();
  });

  it("renders a mention as a distinct element rather than raw text", () => {
    setup();

    expect(screen.getByText("@Naledi Ndlovu")).toBeInTheDocument();
  });

  it("posts a comment and stores it", async () => {
    const user = userEvent.setup();
    const { repository } = setup();

    await user.type(screen.getByLabelText("Add a comment"), "Photos booked for Thursday");
    await user.click(screen.getByRole("button", { name: "Comment" }));

    expect(repository.getState().comments.some((comment) => comment.body === "Photos booked for Thursday")).toBe(true);
  });

  it("notifies a mentioned colleague from the comment box", async () => {
    const user = userEvent.setup();
    const { repository } = setup();

    await user.type(screen.getByLabelText("Add a comment"), "@Naledi Ndlovu please call the buyer");
    await user.click(screen.getByRole("button", { name: "Comment" }));

    const notification = repository.getState().notifications.find((candidate) => candidate.category === "mention" && candidate.recipientEmployeeId === "employee-05");
    expect(notification).toBeDefined();
    expect(notification?.commentId).toBeDefined();
  });

  it("reports a rejected comment instead of failing silently", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Comment" }));

    expect(screen.getByRole("alert")).toHaveTextContent("A comment needs something to say.");
  });

  it("resolves a discussion and offers to reopen it", async () => {
    const user = userEvent.setup();
    const { repository } = setup();

    await user.click(screen.getByRole("button", { name: "Resolve" }));

    expect(repository.getState().comments.find((comment) => comment.id === "comment-01")?.resolvedAt).toBeDefined();
  });

  it("shows a reply box only for the thread being replied to", async () => {
    const user = userEvent.setup();
    setup();

    expect(screen.queryByLabelText("Reply")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reply" }));
    expect(screen.getByLabelText("Reply")).toBeInTheDocument();
  });

  it("offers edit only on the reader's own comment", () => {
    const repository = createDemoRepository(memoryStorage());
    const state = scopeStateForAccount(repository.getState(), getDemoAccount("owner"));

    render(<CommentThread state={state} repository={repository} entityType="board-item" entityId="board-item-001" authorEmployeeId="employee-05" canComment />);

    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("hides every control from a reader who cannot comment", () => {
    setup(false);

    expect(screen.queryByLabelText("Add a comment")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resolve" })).not.toBeInTheDocument();
    expect(screen.getByText(/Bay is booked for Tuesday/)).toBeInTheDocument();
  });

  it("shows an empty state on a record with no discussion", () => {
    const repository = createDemoRepository(memoryStorage());
    const state = scopeStateForAccount(repository.getState(), getDemoAccount("owner"));

    render(<CommentThread state={state} repository={repository} entityType="vehicle" entityId="vehicle-05" authorEmployeeId={kabelo} canComment />);

    expect(screen.getByText("No discussion on this record yet.")).toBeInTheDocument();
  });

  it("counts only unresolved discussions as open", () => {
    const repository = createDemoRepository(memoryStorage());
    const state = scopeStateForAccount(repository.getState(), getDemoAccount("owner"));

    render(<CommentThread state={state} repository={repository} entityType="customer" entityId="customer-01" authorEmployeeId={kabelo} canComment />);

    const heading = screen.getByRole("heading", { name: "Discussion" }).closest("header");
    expect(within(heading!).getByText("0 open")).toBeInTheDocument();
  });
});
