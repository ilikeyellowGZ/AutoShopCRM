import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createDemoRepository } from "../../repository/demoRepository";
import { memoryStorage } from "../../test/memoryStorage";
import { MyDayPage } from "./MyDayPage";

describe("MyDayPage", () => {
  it("uses the injected clock and persists complete and reschedule actions through the repository", async () => {
    const storage = memoryStorage();
    const repository = createDemoRepository(storage);
    const task = repository.getState().tasks.find((item) => item.id === "task-01")!;
    render(<MyDayPage state={repository.getState()} repository={repository} onNavigate={vi.fn()} clock={{ now: () => "2026-08-18T08:00:00+02:00" }} />);

    expect(screen.getByText("Tuesday, 18 August 2026")).toBeInTheDocument();
    const row = screen.getAllByText(task.title)[0].closest("li")!;
    await userEvent.click(within(row).getByRole("button", { name: "Reschedule" }));
    expect(createDemoRepository(storage).getState().tasks.find((item) => item.id === task.id)?.dueAt).toBe("2026-08-19T09:00:00+02:00");
    expect(createDemoRepository(storage).getState().activities[0].action).toBe("Task rescheduled");
    await userEvent.click(within(row).getByRole("button", { name: "Complete" }));
    expect(createDemoRepository(storage).getState().tasks.find((item) => item.id === task.id)?.status).toBe("Completed");
    expect(createDemoRepository(storage).getState().activities[0].action).toBe("Task completed");
  });
});
