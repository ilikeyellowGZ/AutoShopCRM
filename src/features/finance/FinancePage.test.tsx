import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { createDemoRepository } from "../../repository/demoRepository";
import { memoryStorage } from "../../test/memoryStorage";
import { FinancePage } from "./FinancePage";
import { PaymentBreakdown } from "./PaymentBreakdown";

describe("FinancePage", () => {
  afterEach(cleanup);
  it("renders calculated Rand values with cents", () => {
    render(<PaymentBreakdown draft={{ vehicleId: "vehicle-01", vehiclePrice: 100_000, downPayment: 10_000, termMonths: 60, aprPercent: 12, tradeAllowance: 25_000, lienPayoff: 5_000, serviceContract: 3_000, gapInsurance: 2_000 }} />);
    expect(screen.getByText(/1.668,33/)).toBeInTheDocument();
    expect(screen.getByText(/75.000,00/)).toBeInTheDocument();
  });

  it("keeps drafts isolated by selected vehicle and restores each saved draft after reload", async () => {
    const user = userEvent.setup(); const storage = memoryStorage(); const repository = createDemoRepository(storage); const state = repository.getState(); const first = state.vehicles[0]; const second = state.vehicles[1];
    const mounted = render(<FinancePage state={state} repository={repository} />);
    await user.selectOptions(screen.getByLabelText("Vehicle"), first.id);
    fireEvent.change(screen.getByLabelText("Down payment (ZAR)"), { target: { value: "111000" } });
    await user.selectOptions(screen.getByLabelText("Vehicle"), second.id);
    fireEvent.change(screen.getByLabelText("Down payment (ZAR)"), { target: { value: "222000" } });
    expect(repository.getState().financeDrafts.find((draft) => draft.vehicleId === first.id)?.downPayment).toBe(111000);
    expect(repository.getState().financeDrafts.find((draft) => draft.vehicleId === second.id)?.downPayment).toBe(222000);
    mounted.unmount(); const reloaded = createDemoRepository(storage); const remount = render(<FinancePage state={reloaded.getState()} repository={reloaded} />);
    await user.selectOptions(remount.getByLabelText("Vehicle"), second.id);
    expect(remount.getByLabelText("Down payment (ZAR)")).toHaveValue(222000);
  });

  it("labels finance submission as a lender-free local simulation", () => {
    const repository = createDemoRepository(memoryStorage());
    render(<FinancePage state={repository.getState()} repository={repository} />);
    expect(screen.getAllByText(/does not contact a lender/i)).not.toHaveLength(0);
  });
});
