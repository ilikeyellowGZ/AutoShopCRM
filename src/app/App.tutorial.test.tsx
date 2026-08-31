import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createDemoRepository } from "../repository/demoRepository";
import { memoryStorage } from "../test/memoryStorage";
import { DEMO_ACCESS_CODE, DEMO_TUTORIAL_ACCESS_CODE } from "./access";
import { App } from "./App";

afterEach(cleanup);

describe("guided tutorial", () => {
  it("launches the tour automatically on a first-time sign-in and records completion on finish", async () => {
    const user = userEvent.setup();
    const repository = createDemoRepository(memoryStorage());
    render(<App repository={repository} initialAccountId={null} />);

    await user.click(screen.getByRole("button", { name: "Use sales@motorcrm.demo" }));
    await user.type(screen.getByLabelText("Demo access code"), DEMO_TUTORIAL_ACCESS_CODE);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    const dialog = screen.getByRole("dialog", { name: /welcome, sales executive/i });
    expect(within(dialog).getByText(/Step 1 of/)).toBeInTheDocument();

    await user.click(within(dialog).getByRole("button", { name: "Skip tour" }));
    expect(screen.queryByRole("dialog", { name: /welcome, sales executive/i })).not.toBeInTheDocument();
    expect(repository.getState().preferences.tutorialCompletedRoles).toContain("sales");
  });

  it("does not relaunch the tour on a returning sign-in once completed", async () => {
    const user = userEvent.setup();
    const repository = createDemoRepository(memoryStorage());
    repository.setPreferences({ tutorialCompletedRoles: ["sales"] });
    render(<App repository={repository} initialAccountId={null} />);

    await user.click(screen.getByRole("button", { name: "Use sales@motorcrm.demo" }));
    await user.type(screen.getByLabelText("Demo access code"), DEMO_TUTORIAL_ACCESS_CODE);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.queryByRole("dialog", { name: /welcome/i })).not.toBeInTheDocument();
  });

  it("never launches the tour for a returning-code sign-in", async () => {
    const user = userEvent.setup();
    const repository = createDemoRepository(memoryStorage());
    render(<App repository={repository} initialAccountId={null} />);

    await user.click(screen.getByRole("button", { name: "Use sales@motorcrm.demo" }));
    await user.type(screen.getByLabelText("Demo access code"), DEMO_ACCESS_CODE);
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(screen.queryByRole("dialog", { name: /welcome/i })).not.toBeInTheDocument();
  });

  it("lets any signed-in employee replay the tour from their account menu", async () => {
    const user = userEvent.setup();
    render(<App repository={createDemoRepository(memoryStorage())} initialAccountId="stock" />);

    await user.click(screen.getByRole("button", { name: /Kabelo Molefe, Stock Controller/ }));
    await user.click(screen.getByRole("button", { name: "Replay tutorial" }));

    expect(screen.getByRole("dialog", { name: /welcome, stock controller/i })).toBeInTheDocument();
  });

  it("steps forward through the tour, navigating the app as it goes", async () => {
    const user = userEvent.setup();
    render(<App repository={createDemoRepository(memoryStorage())} initialAccountId="stock" />);

    await user.click(screen.getByRole("button", { name: /Kabelo Molefe, Stock Controller/ }));
    await user.click(screen.getByRole("button", { name: "Replay tutorial" }));
    const dialog = screen.getByRole("dialog", { name: /welcome, stock controller/i });
    await user.click(within(dialog).getByRole("button", { name: "Next" }));
    await user.click(within(dialog).getByRole("button", { name: "Next" }));

    expect(screen.getByRole("heading", { name: "Vehicle inventory" })).toBeInTheDocument();
  });
});
