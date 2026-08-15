import type { DemoState } from "../domain/models";

const requiredArrays: Array<keyof Pick<DemoState, "vehicles" | "customers" | "leads" | "deals" | "financeDrafts" | "serviceJobs" | "tasks" | "notifications" | "activities">> = [
  "vehicles", "customers", "leads", "deals", "financeDrafts", "serviceJobs", "tasks", "notifications", "activities",
];

export function isCompatibleDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return candidate.schemaVersion === 1
    && requiredArrays.every((key) => Array.isArray(candidate[key]))
    && Boolean(candidate.preferences && typeof candidate.preferences === "object")
    && Boolean(candidate.drafts && typeof candidate.drafts === "object");
}

export function migrateDemoState(value: unknown): DemoState | null {
  return isCompatibleDemoState(value) ? value : null;
}
