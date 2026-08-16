import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createDemoRepository } from "../../repository/demoRepository";
import { memoryStorage } from "../../test/memoryStorage";
import { CustomerDetail } from "./CustomerDetail";

describe("CustomerDetail", () => {
  it("saves a nonblank note as a persisted customer activity", async () => {
    const user = userEvent.setup(); const repository = createDemoRepository(memoryStorage()); const state = repository.getState();
    render(<CustomerDetail customer={state.customers[0]} state={state} repository={repository} />);
    await user.click(screen.getByRole("tab", { name: "Notes" }));
    await user.type(screen.getByLabelText("Add a customer note"), "Call after finance review");
    await user.click(screen.getByRole("button", { name: "Save note" }));
    expect(repository.getState().activities[0]).toMatchObject({ action: "Customer note added", detail: "Call after finance review", targetType: "customer" });
  });
});
