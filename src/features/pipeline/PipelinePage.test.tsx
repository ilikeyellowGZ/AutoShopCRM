import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createDemoRepository } from "../../repository/demoRepository";
import { memoryStorage } from "../../test/memoryStorage";
import { PipelinePage } from "./PipelinePage";

describe("PipelinePage", () => {
  afterEach(cleanup);
  it("moves a lead through the explicit stage select without drag and drop", async () => {
    const user = userEvent.setup(); const repository = createDemoRepository(memoryStorage()); const state = repository.getState(); const lead = state.leads[0]; const customer = state.customers.find((item) => item.id === lead.customerId)!;
    render(<PipelinePage state={state} repository={repository} />);
    await user.selectOptions(screen.getAllByLabelText(`Move ${customer.name} to a different stage`)[0], "Negotiation");
    expect(repository.getState().leads.find((item) => item.id === lead.id)?.stage).toBe("Negotiation");
  });

  it("forces a locked lead owner even if the read-only field is manipulated", async () => {
    const user = userEvent.setup(); const repository = createDemoRepository(memoryStorage()); const state = repository.getState();
    render(<PipelinePage state={state} repository={repository} defaultOwner="Naledi Ndlovu" lockOwner />);
    await user.click(screen.getByRole("button", { name: "New lead" }));
    const owner = screen.getByLabelText("Owner");
    expect(owner).toHaveAttribute("readonly");
    fireEvent.change(owner, { target: { value: "Marcus Botha" } });
    await user.click(screen.getByRole("button", { name: "Save lead" }));
    expect(repository.getState().leads.at(-1)?.owner).toBe("Naledi Ndlovu");
  });
});
