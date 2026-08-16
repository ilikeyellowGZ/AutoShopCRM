import type { DemoState, PersistedRecordType, ViewPreferences } from "../domain/models";
import { navigationGroups, primaryNavigation } from "../app/routes";

type RecordValue = Record<string, unknown>;
type Validator = (value: unknown) => boolean;

const vehicleStatuses = ["Available", "Reserved", "In Transit", "Service Hold", "Recon", "Photography"] as const;
const leadStages = ["Lead", "Negotiation", "Contract", "Delivery"] as const;
const taskStatuses = ["Upcoming", "Due Today", "Overdue", "Completed"] as const;
const tones = ["positive", "warning", "info", "critical", "neutral"] as const;
const galleryAngles = ["front", "front-left", "left", "rear-left", "rear", "rear-right", "right", "front-right"] as const;
const dealStatuses = ["Closed", "Pending", "Approval"] as const;
const serviceStatuses = ["Booked", "Checked In", "In Progress", "Waiting for Parts", "Quality Check", "Ready", "Completed"] as const;
const relatedTypes = ["lead", "deal", "vehicle", "service"] as const;
const financeTerms = [36, 48, 60, 72] as const;
export const defaultViewPreferences: ViewPreferences = { inventory: { query: "", status: "All", mode: "cards" }, customers: { query: "", status: "All", tab: "overview" }, sales: { query: "", status: "All", sort: "date" }, service: { query: "", filter: "All", view: "Board" } };
const customerStatuses = ["All", "Active", "Prospect"] as const;
const customerTabs = ["overview", "follow-ups"] as const;
const salesStatuses = ["All", ...dealStatuses] as const;
const serviceFilters = ["All", ...serviceStatuses] as const;
const staticRoutes = new Set([...primaryNavigation, ...navigationGroups.flatMap((group) => group.destinations)].map(({ target }) => `${target.page}:${target.subview}`));
staticRoutes.add("sales:new-deal");

const isRecord = (value: unknown): value is RecordValue => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const string: Validator = (value) => typeof value === "string";
const nonEmptyString: Validator = (value) => typeof value === "string" && value.length > 0;
const number: Validator = (value) => typeof value === "number" && Number.isFinite(value);
const boolean: Validator = (value) => typeof value === "boolean";
const oneOf = <T extends readonly (string | number)[]>(values: T): Validator => (value) => values.includes(value as T[number]);
const hasShape = (value: unknown, shape: Record<string, Validator>) => isRecord(value) && Object.entries(shape).every(([key, validate]) => validate(value[key]));
const isAssetPath: Validator = (value) => typeof value === "string" && /^\/media\/[\w/-]+\.(?:png|webp)$/u.test(value);

const isImage = (value: unknown) => hasShape(value, {
  id: nonEmptyString, angle: oneOf(galleryAngles), label: nonEmptyString, src: isAssetPath, alt: nonEmptyString,
});

const isGallery = (value: unknown) => {
  if (!isRecord(value) || !hasShape(value, { coverImageId: nonEmptyString, images: Array.isArray })) return false;
  const images = value.images as unknown[];
  const ids = new Set<string>();
  const angles = new Set<string>();
  return images.length === 8 && images.every((image) => {
    if (!isRecord(image) || !isImage(image) || ids.has(image.id as string) || angles.has(image.angle as string)) return false;
    ids.add(image.id as string);
    angles.add(image.angle as string);
    return true;
  }) && ids.has(value.coverImageId as string) && angles.size === galleryAngles.length;
};

const vehicleShape = {
  id: nonEmptyString, stockId: nonEmptyString, vin: string, year: number, make: nonEmptyString, model: nonEmptyString, derivative: nonEmptyString,
  price: number, purchasePrice: number, mileageKm: number, exterior: nonEmptyString, branch: nonEmptyString, location: nonEmptyString,
  status: oneOf(vehicleStatuses), daysInStock: number, gallery: isGallery,
};
const isVehicle = (value: unknown) => hasShape(value, vehicleShape);
const isCustomer = (value: unknown) => hasShape(value, {
  id: nonEmptyString, name: nonEmptyString, email: nonEmptyString, phone: nonEmptyString, city: nonEmptyString, crmStatus: nonEmptyString, vehicleInterestId: nonEmptyString, lastActivityAt: nonEmptyString,
});
const isLead = (value: unknown) => hasShape(value, {
  id: nonEmptyString, customerId: nonEmptyString, vehicleId: nonEmptyString, owner: nonEmptyString, stage: oneOf(leadStages), value: number, nextAction: nonEmptyString, dueAt: nonEmptyString, tone: oneOf(tones),
});
const isDeal = (value: unknown) => hasShape(value, {
  id: nonEmptyString, customerId: nonEmptyString, vehicleId: nonEmptyString, salesRep: nonEmptyString, grossProfit: number, status: oneOf(dealStatuses), date: nonEmptyString,
});
const isFinanceDraft = (value: unknown) => hasShape(value, {
  vehicleId: nonEmptyString, vehiclePrice: number, downPayment: number, termMonths: oneOf(financeTerms), aprPercent: number, tradeAllowance: number, lienPayoff: number, serviceContract: number, gapInsurance: number,
});
const isServiceJob = (value: unknown) => hasShape(value, {
  id: nonEmptyString, customerId: nonEmptyString, vehicleId: nonEmptyString, advisor: nonEmptyString, technician: nonEmptyString, status: oneOf(serviceStatuses), dueAt: nonEmptyString, note: string,
});
const isTask = (value: unknown) => hasShape(value, {
  id: nonEmptyString, title: nonEmptyString, detail: nonEmptyString, relatedType: oneOf(relatedTypes), relatedId: nonEmptyString, dueAt: nonEmptyString, status: oneOf(taskStatuses), tone: oneOf(tones),
});
const isNotification = (value: unknown) => hasShape(value, {
  id: nonEmptyString, title: nonEmptyString, detail: nonEmptyString, read: boolean, tone: oneOf(tones), relatedId: nonEmptyString,
});
const isActivity = (value: unknown) => hasShape(value, {
  id: nonEmptyString, action: nonEmptyString, detail: nonEmptyString, actor: nonEmptyString, occurredAt: nonEmptyString, tone: oneOf(tones), targetType: oneOf(["vehicle", "customer", "lead", "deal", "service", "task", "system"]), targetId: nonEmptyString,
});

const validString = (value: unknown, fallback: string) => typeof value === "string" ? value : fallback;
const validChoice = <T extends string>(value: unknown, choices: readonly T[], fallback: T): T => choices.includes(value as T) ? value as T : fallback;
function normalizeViewPreferences(value: unknown): ViewPreferences {
  const source = isRecord(value) ? value : {};
  const inventory = isRecord(source.inventory) ? source.inventory : {};
  const customers = isRecord(source.customers) ? source.customers : {};
  const sales = isRecord(source.sales) ? source.sales : {};
  const service = isRecord(source.service) ? source.service : {};
  return {
    inventory: { query: validString(inventory.query, ""), status: validChoice(inventory.status, ["All", ...vehicleStatuses], "All"), mode: validChoice(inventory.mode, ["cards", "table"], "cards") },
    customers: { query: validString(customers.query, ""), status: validChoice(customers.status, customerStatuses, "All"), tab: validChoice(customers.tab, customerTabs, "overview") },
    sales: { query: validString(sales.query, ""), status: validChoice(sales.status, salesStatuses, "All"), sort: validChoice(sales.sort, ["date", "profit"], "date") },
    service: { query: validString(service.query, ""), filter: validChoice(service.filter, serviceFilters, "All"), view: validChoice(service.view, ["Board", "Schedule", "List"], "Board") },
  };
}

const recordCollection = (state: RecordValue, type: PersistedRecordType): unknown[] => {
  const keys = { vehicle: "vehicles", customer: "customers", lead: "leads", deal: "deals", service: "serviceJobs", task: "tasks" } as const;
  const value = state[keys[type]];
  return Array.isArray(value) ? value : [];
};
const recordExists = (state: RecordValue, type: PersistedRecordType, id: string) => recordCollection(state, type).some((record) => isRecord(record) && record.id === id);
const expectedRecordRoute: Record<PersistedRecordType, readonly [string, string]> = {
  vehicle: ["inventory", "record"], customer: ["customers", "record"], lead: ["customers", "leads"], deal: ["sales", "deals"], service: ["service", "service-board"], task: ["operations", "tasks"],
};
function normalizeRoute(state: RecordValue, preferences: RecordValue): RecordValue {
  const fallback = { activePage: "my-day", activeSubview: "overview" };
  const page = preferences.activePage;
  const subview = preferences.activeSubview;
  if (typeof page !== "string" || typeof subview !== "string") return fallback;
  const type = preferences.activeRecordType;
  const id = preferences.activeRecordId;
  const contextId = preferences.activeContextId;
  if (type !== undefined || id !== undefined) {
    if (!oneOf(["vehicle", "customer", "lead", "deal", "service", "task"])(type) || typeof id !== "string" || !recordExists(state, type as PersistedRecordType, id)) return fallback;
    const [expectedPage, expectedSubview] = expectedRecordRoute[type as PersistedRecordType];
    const routeMatches = page === expectedPage && (expectedSubview === "record" ? subview === id : subview === expectedSubview);
    if (!routeMatches) return fallback;
    if (contextId !== undefined) {
      if (type !== "task" || typeof contextId !== "string") return fallback;
      const task = recordCollection(state, "task").find((record) => isRecord(record) && record.id === id);
      if (!isRecord(task) || task.relatedId !== contextId) return fallback;
    }
    return { activePage: page, activeSubview: subview, activeRecordType: type, activeRecordId: id, ...(contextId ? { activeContextId: contextId } : {}) };
  }
  if (contextId !== undefined) {
    if (page === "sales" && subview === "new-deal" && typeof contextId === "string" && recordExists(state, "vehicle", contextId)) return { activePage: page, activeSubview: subview, activeContextId: contextId };
    if (page === "finance" && subview === "deal-finance" && typeof contextId === "string" && recordExists(state, "vehicle", contextId)) return { activePage: page, activeSubview: subview, activeContextId: contextId };
    return fallback;
  }
  if (page === "inventory" && recordExists(state, "vehicle", subview)) return { activePage: page, activeSubview: subview, activeRecordType: "vehicle", activeRecordId: subview };
  if (page === "customers" && recordExists(state, "customer", subview)) return { activePage: page, activeSubview: subview, activeRecordType: "customer", activeRecordId: subview };
  return staticRoutes.has(`${page}:${subview}`) ? { activePage: page, activeSubview: subview } : fallback;
}

const partial = (shape: Record<string, Validator>): Validator => (value) => isRecord(value) && Object.entries(value).every(([key, field]) => Boolean(shape[key]) && shape[key](field));
const isDrafts = (value: unknown) => isRecord(value)
  && (value.vehicleIntake === null || hasShape(value.vehicleIntake, { step: oneOf([1, 2, 3, 4]), values: partial(vehicleShape) }))
  && (value.lead === null || partial({ id: nonEmptyString, customerId: nonEmptyString, vehicleId: nonEmptyString, owner: nonEmptyString, stage: oneOf(leadStages), value: number, nextAction: nonEmptyString, dueAt: nonEmptyString, tone: oneOf(tones) })(value.lead))
  && (value.deal === null || partial({ id: nonEmptyString, customerId: nonEmptyString, vehicleId: nonEmptyString, salesRep: nonEmptyString, grossProfit: number, status: oneOf(dealStatuses), date: nonEmptyString })(value.deal))
  && isRecord(value.serviceNotes) && Object.values(value.serviceNotes).every(string);

export function isCompatibleDemoState(value: unknown): value is DemoState {
  if (!isRecord(value) || value.schemaVersion !== 1 || !hasShape(value.preferences, { branch: nonEmptyString, density: oneOf(["comfortable", "compact"]), activePage: nonEmptyString, activeSubview: nonEmptyString, viewPreferences: (item) => JSON.stringify(normalizeViewPreferences(item)) === JSON.stringify(item) }) || !isDrafts(value.drafts)) return false;
  const collections = ["vehicles", "customers", "leads", "deals", "financeDrafts", "serviceJobs", "tasks", "notifications", "activities"] as const;
  if (!collections.every((key) => Array.isArray(value[key]))) return false;

  const vehicles = value.vehicles as unknown[];
  const customers = value.customers as unknown[];
  const leads = value.leads as unknown[];
  const deals = value.deals as unknown[];
  const financeDrafts = value.financeDrafts as unknown[];
  const serviceJobs = value.serviceJobs as unknown[];
  const tasks = value.tasks as unknown[];
  const notifications = value.notifications as unknown[];
  const activities = value.activities as unknown[];
  if (!vehicles.every(isVehicle) || !customers.every(isCustomer) || !leads.every(isLead) || !deals.every(isDeal) || !financeDrafts.every(isFinanceDraft) || !serviceJobs.every(isServiceJob) || !tasks.every(isTask) || !notifications.every(isNotification) || !activities.every(isActivity)) return false;

  const ids = (records: RecordValue[]) => new Set(records.map((record) => record.id as string));
  const vehicleIds = ids(vehicles as RecordValue[]);
  const customerIds = ids(customers as RecordValue[]);
  const leadIds = ids(leads as RecordValue[]);
  const dealIds = ids(deals as RecordValue[]);
  const serviceIds = ids(serviceJobs as RecordValue[]);
  const linked = (record: RecordValue) => vehicleIds.has(record.vehicleId as string) && customerIds.has(record.customerId as string);
  const taskHasRelatedRecord = (task: RecordValue) => {
    const idsByType = { lead: leadIds, deal: dealIds, vehicle: vehicleIds, service: serviceIds };
    return idsByType[task.relatedType as keyof typeof idsByType].has(task.relatedId as string);
  };
  const relatedIds = new Set([...vehicleIds, ...leadIds, ...dealIds, ...serviceIds]);
  return customers.every((customer) => vehicleIds.has((customer as RecordValue).vehicleInterestId as string))
    && leads.every((lead) => linked(lead as RecordValue))
    && deals.every((deal) => linked(deal as RecordValue))
    && financeDrafts.every((draft) => vehicleIds.has((draft as RecordValue).vehicleId as string))
    && serviceJobs.every((job) => linked(job as RecordValue))
    && tasks.every((task) => taskHasRelatedRecord(task as RecordValue))
    && notifications.every((notification) => relatedIds.has((notification as RecordValue).relatedId as string))
    && activities.every((activity) => { const item = activity as RecordValue; const idsByType = { vehicle: vehicleIds, customer: customerIds, lead: leadIds, deal: dealIds, service: serviceIds, task: ids(tasks as RecordValue[]), system: new Set(["system"]) }; return idsByType[item.targetType as keyof typeof idsByType].has(item.targetId as string); });
}

export function migrateDemoState(value: unknown): DemoState | null {
  if (isRecord(value) && value.schemaVersion === 1 && isRecord(value.preferences)) {
    const { activePage: _page, activeSubview: _subview, activeRecordType: _type, activeRecordId: _id, activeContextId: _context, ...stablePreferences } = value.preferences;
    value = { ...value, preferences: { ...stablePreferences, ...normalizeRoute(value, value.preferences), viewPreferences: normalizeViewPreferences(value.preferences.viewPreferences) } };
  }
  return isCompatibleDemoState(value) ? value : null;
}
