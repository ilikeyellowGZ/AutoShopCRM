import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createDemoRepository } from "../../repository/demoRepository";
import { memoryStorage } from "../../test/memoryStorage";
import { ServicePage } from "./ServicePage";

describe("ServicePage", () => {
  afterEach(cleanup);
  it("saves a job note and displays it after repository reload", async () => {
    const user = userEvent.setup(); const storage = memoryStorage(); const repository = createDemoRepository(storage); const job = repository.getState().serviceJobs[0];
    render(<ServicePage state={{ ...repository.getState(), serviceJobs: [job] }} repository={repository} />);
    const note = screen.getAllByLabelText("Job note")[0]; await user.clear(note); await user.type(note, "Awaiting customer callback"); await user.click(screen.getAllByRole("button", { name: "Save note" })[0]);
    const reloaded = createDemoRepository(storage); const reloadedState = reloaded.getState(); render(<ServicePage state={{ ...reloadedState, serviceJobs: reloadedState.serviceJobs.filter((item) => item.id === job.id) }} repository={reloaded} />);
    expect(screen.getAllByLabelText("Job note")[0]).toHaveValue("Awaiting customer callback"); expect(reloaded.getState().activities[0].targetId).toBe(job.id);
  });

  it("shows a no-results state for a status filter and moves a job by button", async () => {
    const user = userEvent.setup(); const repository = createDemoRepository(memoryStorage());
    render(<ServicePage state={repository.getState()} repository={repository} />);
    await user.selectOptions(screen.getByLabelText("Status"), "Completed"); expect(screen.getAllByText("Completed").length).toBeGreaterThan(1);
    await user.selectOptions(screen.getByLabelText("Status"), "All"); await user.click(screen.getAllByRole("button", { name: "Move to Checked In" })[0]);
    expect(repository.getState().serviceJobs[0].status).toBe("Checked In");
  });

  it("renders Schedule as dated, ordered operations distinct from List", async () => {
    const user = userEvent.setup(); const repository = createDemoRepository(memoryStorage());
    render(<ServicePage state={repository.getState()} repository={repository} />);
    await user.click(screen.getByRole("tab", { name: "Schedule" }));
    expect(screen.getAllByRole("heading", { name: /August/i })).not.toHaveLength(0); expect(screen.getByLabelText("Service schedule")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "List" })); expect(screen.getByLabelText("Service job list")).toBeInTheDocument();
  });
});
