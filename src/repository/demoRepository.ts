import type {
  AuditActivity,
  Customer,
  Deal,
  DemoState,
  FinanceDraft,
  FormDrafts,
  Lead,
  LeadStage,
  ServiceJob,
  UserPreferences,
  Vehicle,
} from "../domain/models";
import { createSeedState, NOW } from "./seed";
import { loadDemoState, saveDemoState, STORAGE_KEY } from "./storage";

export { STORAGE_KEY };

export type DemoRepository = {
  getState(): DemoState;
  subscribe(listener: (state: DemoState) => void): () => void;
  reset(): void;
  setPreferences(patch: Partial<UserPreferences>): void;
  updateDraft<K extends keyof FormDrafts>(key: K, draft: FormDrafts[K]): void;
  completeTask(taskId: string): void;
  rescheduleTask(taskId: string, dueAt: string): void;
  addVehicle(vehicle: Vehicle): void;
  updateVehicle(vehicleId: string, patch: Partial<Vehicle>): void;
  addCustomer(customer: Customer): void;
  addLead(lead: Lead): void;
  moveLead(leadId: string, stage: LeadStage): void;
  addDeal(deal: Deal): void;
  updateFinanceDraft(vehicleId: string, patch: Partial<FinanceDraft>): void;
  updateServiceJob(jobId: string, patch: Partial<ServiceJob>): void;
  markNotificationRead(notificationId: string): void;
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const nextActivityId = (activities: AuditActivity[]) => {
  const maximum = activities.reduce((largest, activity) => Math.max(largest, Number(activity.id.match(/(\d+)$/)?.[1]) || 0), 0);
  return `activity-${String(maximum + 1).padStart(2, "0")}`;
};

export function createDemoRepository(storage: Storage): DemoRepository {
  let state = clone(loadDemoState(storage));
  const listeners = new Set<(state: DemoState) => void>();

  const commit = (action: string, detail: string, mutate: (draft: DemoState) => void, tone: AuditActivity["tone"] = "info") => {
    const draft = clone(state);
    mutate(draft);
    draft.activities.unshift({ id: nextActivityId(draft.activities), action, detail, actor: "Weelee Employee", occurredAt: NOW, tone });
    state = draft;
    saveDemoState(storage, state);
    listeners.forEach((listener) => listener(clone(state)));
  };

  const findIndex = <T extends { id: string }>(items: T[], id: string, label: string) => {
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) throw new Error(`${label} not found.`);
    return index;
  };

  return {
    getState: () => clone(state),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset: () => {
      const resetState = createSeedState();
      resetState.activities.unshift({
        id: nextActivityId(resetState.activities),
        action: "Demo data reset",
        detail: "The employee demo was restored to its deterministic seed data.",
        actor: "Weelee Employee",
        occurredAt: NOW,
        tone: "neutral",
      });
      state = clone(resetState);
      saveDemoState(storage, state);
      listeners.forEach((listener) => listener(clone(state)));
    },
    setPreferences: (patch) => commit("Preferences updated", "Employee workspace preferences were updated.", (draft) => { draft.preferences = { ...draft.preferences, ...patch }; }, "neutral"),
    updateDraft: (key, draftValue) => commit("Draft updated", `${key} draft was saved locally.`, (draft) => { draft.drafts[key] = clone(draftValue); }, "neutral"),
    completeTask: (taskId) => commit("Task completed", "A task was marked complete.", (draft) => {
      draft.tasks[findIndex(draft.tasks, taskId, "Task")] = { ...draft.tasks[findIndex(draft.tasks, taskId, "Task")], status: "Completed", tone: "positive" };
    }, "positive"),
    rescheduleTask: (taskId, dueAt) => commit("Task rescheduled", `Task due date changed to ${dueAt}.`, (draft) => {
      const index = findIndex(draft.tasks, taskId, "Task");
      draft.tasks[index] = { ...draft.tasks[index], dueAt, status: "Upcoming", tone: "info" };
    }, "info"),
    addVehicle: (vehicle) => {
      if (state.vehicles.some((item) => item.vin === vehicle.vin)) throw new Error("VIN already exists in the active Weelee inventory.");
      commit("Vehicle added", `${vehicle.year} ${vehicle.make} ${vehicle.model} was added to inventory.`, (draft) => { draft.vehicles.push(clone(vehicle)); }, "positive");
    },
    updateVehicle: (vehicleId, patch) => commit("Vehicle updated", "Vehicle record was updated.", (draft) => {
      const index = findIndex(draft.vehicles, vehicleId, "Vehicle");
      const vin = patch.vin;
      if (vin && draft.vehicles.some((item) => item.id !== vehicleId && item.vin === vin)) throw new Error("VIN already exists in the active Weelee inventory.");
      draft.vehicles[index] = { ...draft.vehicles[index], ...clone(patch) };
    }),
    addCustomer: (customer) => commit("Customer added", `${customer.name} was added to the customer directory.`, (draft) => { draft.customers.push(clone(customer)); }, "positive"),
    addLead: (lead) => commit("Lead added", "A new customer lead was created.", (draft) => { draft.leads.push(clone(lead)); }, "positive"),
    moveLead: (leadId, stage) => commit("Lead moved", `Lead moved to ${stage}.`, (draft) => {
      const index = findIndex(draft.leads, leadId, "Lead");
      draft.leads[index] = { ...draft.leads[index], stage };
    }, "info"),
    addDeal: (deal) => commit("Deal added", "A new deal was created.", (draft) => { draft.deals.push(clone(deal)); }, "positive"),
    updateFinanceDraft: (vehicleId, patch) => commit("Finance draft updated", "Finance values were saved locally.", (draft) => {
      const index = draft.financeDrafts.findIndex((item) => item.vehicleId === vehicleId);
      if (index < 0) {
        const vehicle = draft.vehicles[findIndex(draft.vehicles, vehicleId, "Vehicle")];
        draft.financeDrafts.push({ vehicleId, vehiclePrice: vehicle.price, downPayment: 0, termMonths: 60, aprPercent: 0, tradeAllowance: 0, lienPayoff: 0, serviceContract: 0, gapInsurance: 0, ...clone(patch) });
        return;
      }
      draft.financeDrafts[index] = { ...draft.financeDrafts[index], ...clone(patch) };
    }, "info"),
    updateServiceJob: (jobId, patch) => commit("Service job updated", "Service job details were updated.", (draft) => {
      const index = findIndex(draft.serviceJobs, jobId, "Service job");
      draft.serviceJobs[index] = { ...draft.serviceJobs[index], ...clone(patch) };
    }, "info"),
    markNotificationRead: (notificationId) => commit("Notification read", "A notification was marked as read.", (draft) => {
      const index = findIndex(draft.notifications, notificationId, "Notification");
      draft.notifications[index] = { ...draft.notifications[index], read: true };
    }, "neutral"),
  };
}
