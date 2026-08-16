import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { DemoState } from "../domain/models";
import type { DemoRepository } from "../repository/demoRepository";
import { useDemoApp } from "./useDemoApp";

function repository(activePage: string): DemoRepository {
  const state = { preferences: { activePage, activeSubview: "overview" } } as DemoState;
  return { getState: () => state, subscribe: vi.fn(() => () => {}), reset: vi.fn(), setPreferences: vi.fn(), updateDraft: vi.fn(), completeTask: vi.fn(), rescheduleTask: vi.fn(), addVehicle: vi.fn(), updateVehicle: vi.fn(), addCustomer: vi.fn(), updateCustomer: vi.fn(), addCustomerNote: vi.fn(), addLead: vi.fn(), updateLeadStage: vi.fn(), moveLead: vi.fn(), addDeal: vi.fn(), updateDealStatus: vi.fn(), updateFinanceDraft: vi.fn(), updateServiceJob: vi.fn(), addServiceJob: vi.fn(), updateServiceState: vi.fn(), markNotificationRead: vi.fn() };
}

describe("useDemoApp", () => {
  it("immediately reads the current repository when the repository prop changes", () => {
    const first = repository("my-day");
    const second = repository("inventory");
    const { result, rerender } = renderHook(({ current }) => useDemoApp(current), { initialProps: { current: first } });
    expect(result.current.state.preferences.activePage).toBe("my-day");
    rerender({ current: second });
    expect(result.current.state.preferences.activePage).toBe("inventory");
    expect(first.subscribe).toHaveBeenCalledTimes(1);
  });
});
