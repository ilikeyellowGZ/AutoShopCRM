import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createDemoRepository } from "../repository/demoRepository";
import { memoryStorage } from "../test/memoryStorage";
import { DEMO_ACCESS_CODE, getDemoAccount } from "./access";
import { App } from "./App";

afterEach(cleanup);

const signIn = async (user: ReturnType<typeof userEvent.setup>, email: string) => {
  await user.type(screen.getByRole("textbox", { name: "Demo account email" }), email);
  await user.type(screen.getByLabelText("Demo access code"), DEMO_ACCESS_CODE);
  await user.click(screen.getByRole("button", { name: "Sign in" }));
};

describe("session recording through the app", () => {
  it("records the session against the branch the account actually signs in to", async () => {
    const user = userEvent.setup();
    const repository = createDemoRepository(memoryStorage());
    const account = getDemoAccount("stock");
    render(<App repository={repository} initialAccountId={null} />);

    await signIn(user, account.email);

    const [session] = repository.getState().sessions;
    const homeBranch = repository.getState().branches.find((branch) => branch.name === account.homeBranch);
    expect(session.accountId).toBe("stock");
    expect(session.branchId).toBe(homeBranch?.id);
  });

  it("ends the session on sign-out and records why", async () => {
    const user = userEvent.setup();
    const repository = createDemoRepository(memoryStorage());
    render(<App repository={repository} initialAccountId={null} />);
    await signIn(user, getDemoAccount("sales").email);

    await user.click(screen.getByRole("button", { name: /Naledi Ndlovu/ }));
    await user.click(screen.getByRole("button", { name: "Sign out" }));

    const [session] = repository.getState().sessions;
    expect(session.status).toBe("ended");
    expect(session.endReason).toBe("signed-out");
    expect(session.endedAt).toBeDefined();
  });
});
