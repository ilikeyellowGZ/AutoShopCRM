import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createDemoRepository } from "../../repository/demoRepository";
import { memoryStorage } from "../../test/memoryStorage";
import { PipelinePage } from "./PipelinePage";

describe("PipelinePage", () => {
  it("moves a lead through the explicit stage select without drag and drop", async () => {
    const user = userEvent.setup(); const repository = createDemoRepository(memoryStorage()); const state = repository.getState(); const lead = state.leads[0]; const customer = state.customers.find((item) => item.id === lead.customerId)!;
    render(<PipelinePage state={state} repository={repository} />);
    await user.selectOptions(screen.getAllByLabelText(`Move ${customer.name} to a different stage`)[0], "Negotiation");
    expect(repository.getState().leads.find((item) => item.id === lead.id)?.stage).toBe("Negotiation");
  });
});
