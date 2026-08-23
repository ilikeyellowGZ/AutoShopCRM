import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { createDemoRepository } from "../../repository/demoRepository";
import { memoryStorage } from "../../test/memoryStorage";
import { DealEntry } from "./DealEntry";

it("forces a locked sales rep even if the read-only field is manipulated", async () => {
  const user = userEvent.setup(); const repository = createDemoRepository(memoryStorage()); const state = repository.getState();
  render(<DealEntry state={state} repository={repository} defaultSalesRep="Naledi Ndlovu" lockSalesRep />);
  const salesRep = screen.getByLabelText("Sales rep");
  expect(salesRep).toHaveAttribute("readonly");
  fireEvent.change(salesRep, { target: { value: "Marcus Botha" } });
  await user.click(screen.getByRole("button", { name: "Save deal" }));
  expect(repository.getState().deals.at(-1)?.salesRep).toBe("Naledi Ndlovu");
});
