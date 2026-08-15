import type { DemoState } from "../domain/models";

const requiredArrays: Array<keyof Pick<DemoState, "vehicles" | "customers" | "leads" | "deals" | "financeDrafts" | "serviceJobs" | "tasks" | "notifications" | "activities">> = [
  "vehicles", "customers", "leads", "deals", "financeDrafts", "serviceJobs", "tasks", "notifications", "activities",
];

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === "object";
const hasStrings = (value: unknown, keys: string[]): value is Record<string, unknown> => isRecord(value) && keys.every((key) => typeof value[key] === "string");

export function isCompatibleDemoState(value: unknown): value is DemoState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return candidate.schemaVersion === 1
    && requiredArrays.every((key) => Array.isArray(candidate[key]))
    && (candidate.vehicles as unknown[]).every((vehicle) => hasStrings(vehicle, ["id", "stockId", "vin", "make", "model", "branch", "location", "status"]) && isRecord(vehicle.gallery) && Array.isArray(vehicle.gallery.images) && vehicle.gallery.images.every((image) => hasStrings(image, ["id", "angle", "src", "alt"])))
    && (candidate.customers as unknown[]).every((customer) => hasStrings(customer, ["id", "name", "email", "phone", "vehicleInterestId"]))
    && (candidate.leads as unknown[]).every((lead) => hasStrings(lead, ["id", "customerId", "vehicleId", "stage", "owner"]))
    && (candidate.deals as unknown[]).every((deal) => hasStrings(deal, ["id", "customerId", "vehicleId", "status"]))
    && (candidate.financeDrafts as unknown[]).every((draft) => hasStrings(draft, ["vehicleId"]))
    && (candidate.serviceJobs as unknown[]).every((job) => hasStrings(job, ["id", "customerId", "vehicleId", "status"]))
    && (candidate.tasks as unknown[]).every((task) => hasStrings(task, ["id", "relatedType", "relatedId", "status"]))
    && (candidate.notifications as unknown[]).every((notification) => hasStrings(notification, ["id", "title", "detail", "relatedId"]) && typeof notification.read === "boolean")
    && (candidate.activities as unknown[]).every((activity) => hasStrings(activity, ["id", "action", "detail", "actor", "occurredAt"]))
    && hasStrings(candidate.preferences, ["branch", "density", "activePage", "activeSubview"])
    && isRecord(candidate.drafts)
    && (candidate.drafts.vehicleIntake === null || isRecord(candidate.drafts.vehicleIntake))
    && (candidate.drafts.lead === null || isRecord(candidate.drafts.lead))
    && (candidate.drafts.deal === null || isRecord(candidate.drafts.deal))
    && isRecord(candidate.drafts.serviceNotes);
}

export function migrateDemoState(value: unknown): DemoState | null {
  return isCompatibleDemoState(value) ? value : null;
}
