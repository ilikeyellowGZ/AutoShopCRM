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
  VehicleIntakeDraft,
} from "../domain/models";
import { createSeedState, NOW } from "./seed";
import { loadDemoState, saveDemoState, STORAGE_KEY } from "./storage";
import { isLeadStage } from "../domain/leadStages";
import { canTransitionServiceJob, isServiceStatus } from "../features/service/serviceRules";

export { STORAGE_KEY };

export type DemoRepository = {
  getState(): DemoState;
  subscribe(listener: (state: DemoState) => void): () => void;
  setAuditActor(actor: string): void;
  reset(): void;
  setPreferences(patch: Partial<UserPreferences>): void;
  updateDraft<K extends keyof FormDrafts>(key: K, draft: FormDrafts[K]): void;
  updateVehicleIntakeDraft(scopeKey: string, draft: VehicleIntakeDraft | null): void;
  completeTask(taskId: string): void;
  rescheduleTask(taskId: string, dueAt: string): void;
  addVehicle(vehicle: Vehicle): void;
  updateVehicle(vehicleId: string, patch: Partial<Vehicle>): void;
  addCustomer(customer: Customer): void;
  updateCustomer(customerId: string, patch: Partial<Customer>): void;
  addCustomerNote(customerId: string, text: string): void;
  addLead(lead: Lead): void;
  updateLeadStage(leadId: string, stage: LeadStage): void;
  moveLead(leadId: string, stage: LeadStage): void;
  addDeal(deal: Deal): void;
  updateDealStatus(dealId: string, status: Deal["status"]): void;
  updateFinanceDraft(vehicleId: string, patch: Partial<FinanceDraft>): void;
  submitFinanceApplication(vehicleId: string): void;
  updateServiceJob(jobId: string, patch: Partial<ServiceJob>): void;
  addServiceJob(job: ServiceJob): void;
  updateServiceState(jobId: string, status: ServiceJob["status"]): void;
  markNotificationRead(notificationId: string): void;
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const maximumActivityNumber = (activities: AuditActivity[]) => activities.reduce((largest, activity) => Math.max(largest, Number(activity.id.match(/(\d+)$/)?.[1]) || 0), 0);
const activityId = (number: number) => `activity-${String(number).padStart(2, "0")}`;
export const normalizeVehicleIdentifier = (value: string) => value.trim().toUpperCase();
const normalizeEmail = (value: string) => value.trim().toLowerCase();

function validateVehicleIdentifiers(vehicle: Pick<Vehicle, "vin" | "stockId">, vehicles: readonly Vehicle[], excludedId?: string) {
  const vin = normalizeVehicleIdentifier(vehicle.vin);
  const stockId = normalizeVehicleIdentifier(vehicle.stockId);
  if (vin.length !== 17) throw new Error("VIN must contain exactly 17 characters.");
  if (!/^[A-HJ-NPR-Z0-9]{17}$/u.test(vin)) throw new Error("VIN may only contain valid letters and numbers (excluding I, O and Q).");
  if (!stockId) throw new Error("Stock ID is required.");
  if (vehicles.some((item) => item.id !== excludedId && normalizeVehicleIdentifier(item.vin) === vin)) throw new Error("VIN already exists in the active Weelee inventory.");
  if (vehicles.some((item) => item.id !== excludedId && normalizeVehicleIdentifier(item.stockId) === stockId)) throw new Error("Stock ID already exists in the active Weelee inventory.");
  return { vin, stockId };
}

function validateCustomer(customer: Customer, customers: readonly Customer[], excludedId?: string) {
  const email = normalizeEmail(customer.email);
  if (!customer.name.trim()) throw new Error("Customer name is required.");
  if (!email.includes("@")) throw new Error("A valid customer email is required.");
  if (customers.some((item) => item.id !== excludedId && normalizeEmail(item.email) === email)) throw new Error("A customer with this email already exists.");
  return { ...customer, name: customer.name.trim(), email };
}

function validateCustomerVehicleInterest(vehicleInterestId: string, state: DemoState) {
  if (vehicleInterestId && !state.vehicles.some((vehicle) => vehicle.id === vehicleInterestId)) throw new Error("Vehicle interest not found.");
}

function validateCustomerAndVehicle(customerId: string, vehicleId: string, state: DemoState) {
  if (!state.customers.some((customer) => customer.id === customerId)) throw new Error("Customer not found.");
  if (!state.vehicles.some((vehicle) => vehicle.id === vehicleId)) throw new Error("Vehicle not found.");
}

export function createDemoRepository(storage: Storage): DemoRepository {
  let state = clone(loadDemoState(storage));
  let activityNumber = maximumActivityNumber(state.activities);
  let auditActor = "Weelee Employee";
  const listeners = new Set<(state: DemoState) => void>();

  const commit = (action: string, detail: string, mutate: (draft: DemoState) => void, tone: AuditActivity["tone"] = "info", targetType: AuditActivity["targetType"] = "system", targetId = "system") => {
    const draft = clone(state);
    mutate(draft);
    draft.activities.unshift({ id: activityId(++activityNumber), action, detail, actor: auditActor, occurredAt: NOW, tone, targetType, targetId });
    state = draft;
    saveDemoState(storage, state);
    listeners.forEach((listener) => listener(clone(state)));
  };

  const persist = (mutate: (draft: DemoState) => void) => {
    const draft = clone(state);
    mutate(draft);
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
    setAuditActor: (actor) => { auditActor = actor.trim() || "Weelee Employee"; },
    reset: () => {
      const resetState = createSeedState();
      resetState.activities.unshift({
        id: activityId(++activityNumber),
        action: "Demo data reset",
        detail: "The employee demo was restored to its deterministic seed data.",
        actor: auditActor,
        occurredAt: NOW,
        tone: "neutral",
        targetType: "system",
        targetId: "system",
      });
      state = clone(resetState);
      saveDemoState(storage, state);
      listeners.forEach((listener) => listener(clone(state)));
    },
    setPreferences: (patch) => {
      const meaningfulSettingChanged = (patch.branch !== undefined && patch.branch !== state.preferences.branch) || (patch.density !== undefined && patch.density !== state.preferences.density);
      const update = (draft: DemoState) => { draft.preferences = clone({ ...draft.preferences, ...patch }); };
      if (meaningfulSettingChanged) commit("Preferences updated", "Employee workspace settings were updated.", update, "neutral");
      else persist(update);
    },
    updateDraft: (key, draftValue) => commit("Draft updated", `${key} draft was saved locally.`, (draft) => { draft.drafts[key] = clone(draftValue); }, "neutral"),
    updateVehicleIntakeDraft: (scopeKey, draftValue) => {
      const scope = scopeKey.trim();
      if (!scope) throw new Error("Vehicle-intake draft scope is required.");
      const vehicleIntakes = { ...state.drafts.vehicleIntakes };
      if (draftValue === null) delete vehicleIntakes[scope];
      else vehicleIntakes[scope] = clone(draftValue);
      state = { ...state, drafts: { ...state.drafts, vehicleIntakes } };
      saveDemoState(storage, state);
      listeners.forEach((listener) => listener(clone(state)));
    },
    completeTask: (taskId) => commit("Task completed", "A task was marked complete.", (draft) => {
      draft.tasks[findIndex(draft.tasks, taskId, "Task")] = { ...draft.tasks[findIndex(draft.tasks, taskId, "Task")], status: "Completed", tone: "positive" };
    }, "positive", "task", taskId),
    rescheduleTask: (taskId, dueAt) => commit("Task rescheduled", `Task due date changed to ${dueAt}.`, (draft) => {
      const index = findIndex(draft.tasks, taskId, "Task");
      draft.tasks[index] = { ...draft.tasks[index], dueAt, status: "Upcoming", tone: "info" };
    }, "info", "task", taskId),
    addVehicle: (vehicle) => {
      const identifiers = validateVehicleIdentifiers(vehicle, state.vehicles);
      commit("Vehicle added", `${vehicle.year} ${vehicle.make} ${vehicle.model} was added to inventory.`, (draft) => { draft.vehicles.push({ ...clone(vehicle), ...identifiers }); }, "positive", "vehicle", vehicle.id);
    },
    updateVehicle: (vehicleId, patch) => {
      const current = state.vehicles[findIndex(state.vehicles, vehicleId, "Vehicle")];
      const identifiers = validateVehicleIdentifiers({ ...current, ...patch }, state.vehicles, vehicleId);
      commit("Vehicle updated", "Vehicle record was updated.", (draft) => {
        const index = findIndex(draft.vehicles, vehicleId, "Vehicle");
        draft.vehicles[index] = { ...draft.vehicles[index], ...clone(patch), ...identifiers };
      }, "info", "vehicle", vehicleId);
    },
    addCustomer: (customer) => {
      const validated = validateCustomer(customer, state.customers);
      validateCustomerVehicleInterest(validated.vehicleInterestId, state);
      commit("Customer added", `${validated.name} was added to the customer directory.`, (draft) => { draft.customers.push(clone(validated)); }, "positive", "customer", customer.id);
    },
    updateCustomer: (customerId, patch) => {
      const current = state.customers[findIndex(state.customers, customerId, "Customer")];
      const validated = validateCustomer({ ...current, ...patch }, state.customers, customerId);
      validateCustomerVehicleInterest(validated.vehicleInterestId, state);
      commit("Customer updated", "Customer record was updated.", (draft) => { const index = findIndex(draft.customers, customerId, "Customer"); draft.customers[index] = clone(validated); }, "info", "customer", customerId);
    },
    addCustomerNote: (customerId, text) => {
      findIndex(state.customers, customerId, "Customer");
      const note = text.trim();
      if (!note) throw new Error("Customer note cannot be blank.");
      commit("Customer note added", note, (draft) => {
        const index = findIndex(draft.customers, customerId, "Customer");
        draft.customers[index] = { ...draft.customers[index], lastActivityAt: NOW };
      }, "info", "customer", customerId);
    },
    addLead: (lead) => {
      if (!isLeadStage(lead.stage)) throw new Error("Invalid lead stage.");
      validateCustomerAndVehicle(lead.customerId, lead.vehicleId, state);
      commit("Lead added", "A new customer lead was created.", (draft) => { draft.leads.push(clone(lead)); }, "positive", "lead", lead.id);
    },
    moveLead: (leadId, stage) => {
      const current = state.leads[findIndex(state.leads, leadId, "Lead")];
      if (!isLeadStage(stage)) throw new Error("Invalid lead stage.");
      if (current.stage === stage) throw new Error("Lead is already in this pipeline stage.");
      commit("Lead moved", `Lead moved to ${stage}.`, (draft) => {
      const index = findIndex(draft.leads, leadId, "Lead");
      draft.leads[index] = { ...draft.leads[index], stage };
      }, "info", "lead", leadId);
    },
    updateLeadStage: (leadId, stage) => {
      const current = state.leads[findIndex(state.leads, leadId, "Lead")];
      if (!isLeadStage(stage)) throw new Error("Invalid lead stage.");
      if (current.stage === stage) throw new Error("Lead is already in this pipeline stage.");
      commit("Lead moved", `Lead moved to ${stage}.`, (draft) => { const index = findIndex(draft.leads, leadId, "Lead"); draft.leads[index] = { ...draft.leads[index], stage }; }, "info", "lead", leadId);
    },
    addDeal: (deal) => {
      validateCustomerAndVehicle(deal.customerId, deal.vehicleId, state);
      commit("Deal added", "A new deal was created.", (draft) => { draft.deals.push(clone(deal)); }, "positive", "deal", deal.id);
    },
    updateDealStatus: (dealId, status) => commit("Deal updated", `Deal status changed to ${status}.`, (draft) => { const index = findIndex(draft.deals, dealId, "Deal"); draft.deals[index] = { ...draft.deals[index], status }; }, "info", "deal", dealId),
    updateFinanceDraft: (vehicleId, patch) => commit("Finance draft updated", "Finance values were saved locally.", (draft) => {
      const index = draft.financeDrafts.findIndex((item) => item.vehicleId === vehicleId);
      if (index < 0) {
        const vehicle = draft.vehicles[findIndex(draft.vehicles, vehicleId, "Vehicle")];
        draft.financeDrafts.push({ vehicleId, vehiclePrice: vehicle.price, downPayment: 0, termMonths: 60, aprPercent: 0, tradeAllowance: 0, lienPayoff: 0, serviceContract: 0, gapInsurance: 0, ...clone(patch) });
        return;
      }
      draft.financeDrafts[index] = { ...draft.financeDrafts[index], ...clone(patch) };
    }, "info", "vehicle", vehicleId),
    submitFinanceApplication: (vehicleId) => {
      findIndex(state.vehicles, vehicleId, "Vehicle");
      if (!state.financeDrafts.some((draft) => draft.vehicleId === vehicleId)) throw new Error("Finance draft not found.");
      commit("Finance demo submitted", "A local sandbox finance submission was recorded; no lender was contacted.", () => {}, "info", "vehicle", vehicleId);
    },
    updateServiceJob: (jobId, patch) => {
      const current = state.serviceJobs[findIndex(state.serviceJobs, jobId, "Service job")];
      validateCustomerAndVehicle(patch.customerId ?? current.customerId, patch.vehicleId ?? current.vehicleId, state);
      if (patch.status && !isServiceStatus(patch.status)) throw new Error("Invalid service job status.");
      if (patch.status && !canTransitionServiceJob(current.status, patch.status)) throw new Error(`Service job cannot move from ${current.status} to ${patch.status}.`);
      commit("Service job updated", "Service job details were updated.", (draft) => {
        const index = findIndex(draft.serviceJobs, jobId, "Service job");
        draft.serviceJobs[index] = { ...draft.serviceJobs[index], ...clone(patch) };
      }, "info", "service", jobId);
    },
    addServiceJob: (job) => {
      validateCustomerAndVehicle(job.customerId, job.vehicleId, state);
      if (!isServiceStatus(job.status)) throw new Error("Invalid service job status.");
      commit("Service job added", "A service job was created.", (draft) => { draft.serviceJobs.push(clone(job)); }, "positive", "service", job.id);
    },
    updateServiceState: (jobId, status) => {
      const current = state.serviceJobs[findIndex(state.serviceJobs, jobId, "Service job")];
      if (!isServiceStatus(status)) throw new Error("Invalid service job status.");
      if (!canTransitionServiceJob(current.status, status)) throw new Error(`Service job cannot move from ${current.status} to ${status}.`);
      commit("Service job updated", `Service job moved to ${status}.`, (draft) => { const index = findIndex(draft.serviceJobs, jobId, "Service job"); draft.serviceJobs[index] = { ...draft.serviceJobs[index], status }; }, "info", "service", jobId);
    },
    markNotificationRead: (notificationId) => commit("Notification read", "A notification was marked as read.", (draft) => {
      const index = findIndex(draft.notifications, notificationId, "Notification");
      draft.notifications[index] = { ...draft.notifications[index], read: true };
    }, "neutral"),
  };
}
