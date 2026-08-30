import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { memoryStorage } from "../../test/memoryStorage";
import { createDemoRepository } from "../../repository/demoRepository";
import { getDemoAccount } from "../../app/access";
import { scopeStateForAccount } from "../../app/stateScope";
import { ChatPage } from "./ChatPage";

afterEach(cleanup);

const naledi = "employee-05";
const NOW = "2026-08-16T08:00:00+02:00";

const setup = (options: { role?: "sales" | "auditor"; employeeId?: string | null; canPost?: boolean; now?: string } = {}) => {
  const { role = "sales", employeeId = naledi, canPost = true, now = NOW } = options;
  const repository = createDemoRepository(memoryStorage(), () => now);
  const state = scopeStateForAccount(repository.getState(), getDemoAccount(role));
  render(<ChatPage state={state} repository={repository} employeeId={employeeId ?? undefined} canPost={canPost} now={now} />);
  return { repository };
};

describe("staff chat", () => {
  it("opens the first channel and shows its messages", () => {
    setup();

    expect(screen.getByRole("heading", { name: "#sales-floor" })).toBeInTheDocument();
    expect(screen.getByText("Morning all. The GT3 buyer is coming in at eleven.")).toBeInTheDocument();
  });

  it("lists a direct conversation under the name of the colleague on the other side", () => {
    setup();

    const conversations = screen.getByRole("navigation", { name: "Conversations" });
    expect(within(conversations).getByRole("button", { name: "Lindiwe Khumalo" })).toBeInTheDocument();
  });

  it("switches to another conversation", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Lindiwe Khumalo" }));

    expect(screen.getByText("Can you take the Midrand walk-in tomorrow?")).toBeInTheDocument();
  });

  it("renders a mention as a distinct element rather than raw text", () => {
    setup();

    expect(screen.getByText("@Jacques van der Merwe")).toBeInTheDocument();
  });

  it("sends a message and stores it", async () => {
    const user = userEvent.setup();
    const { repository } = setup();

    await user.type(screen.getByLabelText("Message #sales-floor"), "Buyer has arrived");
    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(repository.getState().chatMessages.some((message) => message.body === "Buyer has arrived")).toBe(true);
  });

  it("reports a rejected message instead of failing silently", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByRole("alert")).toHaveTextContent("A message needs something to say.");
  });

  it("marks the open conversation as read", () => {
    const repository = createDemoRepository(memoryStorage(), () => NOW);
    const state = scopeStateForAccount(repository.getState(), getDemoAccount("manager"));

    render(<ChatPage state={state} repository={repository} employeeId="employee-03" canPost now={NOW} />);

    expect(repository.getState().chatReads.find((read) => read.channelId === "chat-channel-01" && read.employeeId === "employee-03")?.lastReadMessageId).toBe("chat-message-003");
  });

  it("shows an unread count for a conversation the reader has not caught up on", () => {
    const repository = createDemoRepository(memoryStorage(), () => NOW);
    const state = scopeStateForAccount(repository.getState(), getDemoAccount("salesmanager"));

    render(<ChatPage state={state} repository={repository} employeeId="employee-04" canPost channelId="chat-channel-03" now={NOW} />);

    const conversations = screen.getByRole("navigation", { name: "Conversations" });
    expect(within(conversations).getByRole("button", { name: "#sales-floor · 2 unread" })).toBeInTheDocument();
  });

  it("tells the author who has read their own message", async () => {
    const user = userEvent.setup();
    setup();

    await user.click(screen.getByRole("button", { name: "Lindiwe Khumalo" }));

    expect(screen.getByText("Seen by Lindiwe Khumalo")).toBeInTheDocument();
  });

  it("reads presence from the session record and says so when there is none", () => {
    const repository = createDemoRepository(memoryStorage(), () => NOW);
    repository.startSession({ id: "salesmanager", name: "Lindiwe Khumalo", title: "Sales Manager", organizationId: "org-motorgroup-sa" }, "test-agent");
    const state = scopeStateForAccount(repository.getState(), getDemoAccount("owner"));

    render(<ChatPage state={state} repository={repository} employeeId="employee-01" canPost now={NOW} />);

    const members = screen.getByRole("complementary", { name: "Who is here" });
    expect(within(within(members).getByText("Lindiwe Khumalo").closest("li")!).getByText("Online")).toBeInTheDocument();
    expect(within(within(members).getByText("Naledi Ndlovu").closest("li")!).getByText("No signal")).toBeInTheDocument();
  });

  it("shows a member as online while their session is fresh and away once it is stale", () => {
    const repository = createDemoRepository(memoryStorage(), () => "2026-08-16T08:00:00+02:00");
    repository.startSession({ id: "sales", name: "Naledi Ndlovu", title: "Sales Executive", organizationId: "org-motorgroup-sa" }, "test-agent");
    const state = scopeStateForAccount(repository.getState(), getDemoAccount("owner"));

    const { unmount } = render(<ChatPage state={state} repository={repository} employeeId="employee-01" canPost now="2026-08-16T08:01:00+02:00" />);
    const fresh = screen.getByRole("complementary", { name: "Who is here" });
    expect(within(fresh).getByText("Online")).toBeInTheDocument();
    unmount();

    render(<ChatPage state={state} repository={repository} employeeId="employee-01" canPost now="2026-08-16T09:00:00+02:00" />);
    const stale = screen.getByRole("complementary", { name: "Who is here" });
    expect(within(stale).getByText("Away")).toBeInTheDocument();
  });

  it("lets a reader without posting rights read but not write", () => {
    setup({ canPost: false });

    expect(screen.queryByLabelText("Message #sales-floor")).not.toBeInTheDocument();
    expect(screen.getByText("You can read this conversation but not post in it.")).toBeInTheDocument();
    expect(screen.getByText("Morning all. The GT3 buyer is coming in at eleven.")).toBeInTheDocument();
  });

  it("says so when the reader belongs to no channel", () => {
    setup({ role: "auditor", employeeId: "employee-11", canPost: false });

    expect(screen.getByText("You are not a member of any channel yet.")).toBeInTheDocument();
  });

  it("says so when the account has no employee record to speak as", () => {
    setup({ employeeId: null });

    expect(screen.getByText("This demo account is not linked to an employee record, so staff chat has nobody to speak as.")).toBeInTheDocument();
  });
});
