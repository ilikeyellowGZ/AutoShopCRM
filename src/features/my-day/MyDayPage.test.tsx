import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createDemoRepository } from "../../repository/demoRepository";
import { memoryStorage } from "../../test/memoryStorage";
import { MyDayPage } from "./MyDayPage";

afterEach(cleanup);

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

  it("opens Action Search from My Day with a mobile-sized control and routes the exact selected target", async () => {
    const repository = createDemoRepository(memoryStorage());
    const onCommandSelect = vi.fn();
    render(<MyDayPage state={repository.getState()} repository={repository} onNavigate={vi.fn()} onCommandSelect={onCommandSelect} />);

    const trigger = screen.getByRole("button", { name: "Action Search" });
    expect(trigger).toHaveClass("my-day-action-search");
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await userEvent.click(trigger);
    const input = screen.getByRole("combobox", { name: "Search employee records" });
    await userEvent.type(input, "vehicle-01");
    await userEvent.keyboard("{Enter}");

    expect(onCommandSelect).toHaveBeenCalledWith(expect.objectContaining({ page: "inventory", subview: "vehicle-01", recordType: "vehicle", recordId: "vehicle-01" }), expect.objectContaining({ id: "vehicle-01" }));
  });
});
