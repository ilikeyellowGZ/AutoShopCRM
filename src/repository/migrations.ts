import {
  vehicleBodyTypes,
  vehicleFuels,
  vehicleTransmissions,
  type DemoState,
  type PersistedRecordType,
  type Vehicle,
  type ViewPreferences,
} from "../domain/models";
import { navigationGroups, primaryNavigation } from "../app/routes";
import { createSeedState } from "./seed";

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
const employeeDepartments = ["Executive", "Sales", "Finance", "Inventory", "Marketing", "Accounts", "Service", "Audit"] as const;
const appointmentPurposes = ["Consultation", "Finance Review", "Delivery", "Service Handover"] as const;
const appointmentStatuses = ["Scheduled", "Confirmed", "Completed", "Cancelled"] as const;
const testDriveStatuses = ["Booked", "Completed", "No Show"] as const;
const quoteStatuses = ["Draft", "Sent", "Accepted", "Expired"] as const;
const paymentKinds = ["Deposit", "Balance", "Refund"] as const;
const paymentStatuses = ["Pending", "Cleared", "Failed"] as const;
const applicationStatuses = ["Draft", "Submitted", "Approved", "Declined"] as const;
const documentCategories = ["Identity", "Quote", "Finance", "Contract", "Delivery", "Service"] as const;
const documentStatuses = ["Required", "Uploaded", "Verified", "Expired"] as const;
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
const optional = (validate: Validator): Validator => (value) => value === undefined || validate(value);
const hasShape = (value: unknown, shape: Record<string, Validator>) => isRecord(value) && Object.entries(shape).every(([key, validate]) => validate(value[key]));
const isAssetPath: Validator = (value) => typeof value === "string" && /^\/media\/[\w/-]+\.(?:png|webp)$/u.test(value);
const isVin: Validator = (value) => typeof value === "string" && /^[A-HJ-NPR-Z0-9]{17}$/u.test(value);

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
  id: nonEmptyString, stockId: nonEmptyString, vin: isVin, year: number, make: nonEmptyString, model: nonEmptyString, derivative: nonEmptyString,
  price: number, purchasePrice: number, mileageKm: number, exterior: nonEmptyString, branch: nonEmptyString, location: nonEmptyString,
  status: oneOf(vehicleStatuses), daysInStock: number, bodyType: oneOf(vehicleBodyTypes), fuel: oneOf(vehicleFuels),
  transmission: oneOf(vehicleTransmissions), engine: nonEmptyString, registration: nonEmptyString, gallery: isGallery,
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
const isEmployee = (value: unknown) => hasShape(value, { id: nonEmptyString, accountId: optional(nonEmptyString), name: nonEmptyString, email: nonEmptyString, title: nonEmptyString, department: oneOf(employeeDepartments), branch: nonEmptyString, managerId: optional(nonEmptyString), status: oneOf(["Active", "Leave"]) });
const isAppointment = (value: unknown) => hasShape(value, { id: nonEmptyString, customerId: nonEmptyString, leadId: nonEmptyString, vehicleId: nonEmptyString, assignedTo: nonEmptyString, branch: nonEmptyString, scheduledAt: nonEmptyString, purpose: oneOf(appointmentPurposes), status: oneOf(appointmentStatuses) });
const isTestDrive = (value: unknown) => hasShape(value, { id: nonEmptyString, appointmentId: nonEmptyString, customerId: nonEmptyString, leadId: nonEmptyString, vehicleId: nonEmptyString, host: nonEmptyString, scheduledAt: nonEmptyString, status: oneOf(testDriveStatuses), outcome: string });
const isQuote = (value: unknown) => hasShape(value, { id: nonEmptyString, customerId: nonEmptyString, leadId: nonEmptyString, vehicleId: nonEmptyString, createdBy: nonEmptyString, amount: number, status: oneOf(quoteStatuses), createdAt: nonEmptyString, expiresAt: nonEmptyString });
const isPayment = (value: unknown) => hasShape(value, { id: nonEmptyString, dealId: nonEmptyString, customerId: nonEmptyString, amount: number, kind: oneOf(paymentKinds), status: oneOf(paymentStatuses), paidAt: nonEmptyString });
const isFinanceApplication = (value: unknown) => hasShape(value, { id: nonEmptyString, dealId: nonEmptyString, customerId: nonEmptyString, vehicleId: nonEmptyString, owner: nonEmptyString, requestedAmount: number, status: oneOf(applicationStatuses), updatedAt: nonEmptyString });
const isDocument = (value: unknown) => hasShape(value, { id: nonEmptyString, customerId: optional(nonEmptyString), leadId: optional(nonEmptyString), dealId: optional(nonEmptyString), vehicleId: optional(nonEmptyString), name: nonEmptyString, category: oneOf(documentCategories), status: oneOf(documentStatuses), updatedAt: nonEmptyString });

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
const vehicleIntakeDraftShape = {
  id: string, stockId: string, vin: string, year: number, make: string, model: string, derivative: string,
  price: number, purchasePrice: number, mileageKm: number, exterior: string, branch: string, location: string,
  status: oneOf(vehicleStatuses), daysInStock: number, bodyType: oneOf(vehicleBodyTypes), fuel: oneOf(vehicleFuels),
  transmission: oneOf(vehicleTransmissions), engine: string, registration: string, gallery: isGallery,
};
const isVehicleIntakeDraft = (value: unknown) => hasShape(value, { step: oneOf([1, 2, 3, 4]), values: partial(vehicleIntakeDraftShape) });
const isDrafts = (value: unknown) => isRecord(value)
  && (value.vehicleIntake === null || isVehicleIntakeDraft(value.vehicleIntake))
  && isRecord(value.vehicleIntakes) && Object.values(value.vehicleIntakes).every(isVehicleIntakeDraft)
  && (value.lead === null || partial({ id: nonEmptyString, customerId: nonEmptyString, vehicleId: nonEmptyString, owner: nonEmptyString, stage: oneOf(leadStages), value: number, nextAction: nonEmptyString, dueAt: nonEmptyString, tone: oneOf(tones) })(value.lead))
  && (value.deal === null || partial({ id: nonEmptyString, customerId: nonEmptyString, vehicleId: nonEmptyString, salesRep: nonEmptyString, grossProfit: number, status: oneOf(dealStatuses), date: nonEmptyString })(value.deal))
  && isRecord(value.serviceNotes) && Object.values(value.serviceNotes).every(string);

export function isCompatibleDemoState(value: unknown): value is DemoState {
  if (!isRecord(value) || value.schemaVersion !== 2 || !hasShape(value.preferences, { branch: nonEmptyString, density: oneOf(["comfortable", "compact"]), activePage: nonEmptyString, activeSubview: nonEmptyString, viewPreferences: (item) => JSON.stringify(normalizeViewPreferences(item)) === JSON.stringify(item) }) || !isDrafts(value.drafts)) return false;
  const collections = ["vehicles", "customers", "leads", "deals", "financeDrafts", "financeApplications", "serviceJobs", "employees", "appointments", "testDrives", "quotes", "payments", "documents", "tasks", "notifications", "activities"] as const;
  if (!collections.every((key) => Array.isArray(value[key]))) return false;

  const vehicles = value.vehicles as unknown[];
  const customers = value.customers as unknown[];
  const leads = value.leads as unknown[];
  const deals = value.deals as unknown[];
  const financeDrafts = value.financeDrafts as unknown[];
  const financeApplications = value.financeApplications as unknown[];
  const serviceJobs = value.serviceJobs as unknown[];
  const employees = value.employees as unknown[];
  const appointments = value.appointments as unknown[];
  const testDrives = value.testDrives as unknown[];
  const quotes = value.quotes as unknown[];
  const payments = value.payments as unknown[];
  const documents = value.documents as unknown[];
  const tasks = value.tasks as unknown[];
  const notifications = value.notifications as unknown[];
  const activities = value.activities as unknown[];
  if (!vehicles.every(isVehicle) || !customers.every(isCustomer) || !leads.every(isLead) || !deals.every(isDeal) || !financeDrafts.every(isFinanceDraft) || !financeApplications.every(isFinanceApplication) || !serviceJobs.every(isServiceJob) || !employees.every(isEmployee) || !appointments.every(isAppointment) || !testDrives.every(isTestDrive) || !quotes.every(isQuote) || !payments.every(isPayment) || !documents.every(isDocument) || !tasks.every(isTask) || !notifications.every(isNotification) || !activities.every(isActivity)) return false;

  const ids = (records: RecordValue[]) => new Set(records.map((record) => record.id as string));
  const vehicleIds = ids(vehicles as RecordValue[]);
  const customerIds = ids(customers as RecordValue[]);
  const leadIds = ids(leads as RecordValue[]);
  const dealIds = ids(deals as RecordValue[]);
  const serviceIds = ids(serviceJobs as RecordValue[]);
  const appointmentIds = ids(appointments as RecordValue[]);
  const employeeIds = ids(employees as RecordValue[]);
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
    && financeApplications.every((application) => { const item = application as RecordValue; return dealIds.has(item.dealId as string) && customerIds.has(item.customerId as string) && vehicleIds.has(item.vehicleId as string); })
    && serviceJobs.every((job) => linked(job as RecordValue))
    && employees.every((employee) => { const managerId = (employee as RecordValue).managerId; return managerId === undefined || employeeIds.has(managerId as string); })
    && appointments.every((appointment) => { const item = appointment as RecordValue; return customerIds.has(item.customerId as string) && leadIds.has(item.leadId as string) && vehicleIds.has(item.vehicleId as string); })
    && testDrives.every((drive) => { const item = drive as RecordValue; return appointmentIds.has(item.appointmentId as string) && customerIds.has(item.customerId as string) && leadIds.has(item.leadId as string) && vehicleIds.has(item.vehicleId as string); })
    && quotes.every((quote) => { const item = quote as RecordValue; return customerIds.has(item.customerId as string) && leadIds.has(item.leadId as string) && vehicleIds.has(item.vehicleId as string); })
    && payments.every((payment) => { const item = payment as RecordValue; return dealIds.has(item.dealId as string) && customerIds.has(item.customerId as string); })
    && documents.every((document) => { const item = document as RecordValue; return (item.customerId === undefined || customerIds.has(item.customerId as string)) && (item.leadId === undefined || leadIds.has(item.leadId as string)) && (item.dealId === undefined || dealIds.has(item.dealId as string)) && (item.vehicleId === undefined || vehicleIds.has(item.vehicleId as string)); })
    && tasks.every((task) => taskHasRelatedRecord(task as RecordValue))
    && notifications.every((notification) => relatedIds.has((notification as RecordValue).relatedId as string))
    && activities.every((activity) => { const item = activity as RecordValue; const idsByType = { vehicle: vehicleIds, customer: customerIds, lead: leadIds, deal: dealIds, service: serviceIds, task: ids(tasks as RecordValue[]), system: new Set(["system"]) }; return idsByType[item.targetType as keyof typeof idsByType].has(item.targetId as string); });
}

const legacyBranch = (branch: unknown, fallback: string) => branch === "Windhoek" || branch === "Swakopmund" ? fallback : validString(branch, fallback);

function migrateVehicleRoster(value: RecordValue): RecordValue {
  const seed = createSeedState();
  const seedById = new Map(seed.vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const sourceVehicles = Array.isArray(value.vehicles) ? value.vehicles : [];
  const vehicles = sourceVehicles.map((item) => {
    if (!isRecord(item)) return item;
    const candidate = typeof item.id === "string" ? seedById.get(item.id) : undefined;
    const normalizedVin = typeof item.vin === "string" ? item.vin.trim().toUpperCase() : "";
    const normalizedStockId = typeof item.stockId === "string" ? item.stockId.trim().toUpperCase() : "";
    const matchesBaseline = candidate && (normalizedVin === candidate.vin || normalizedStockId === candidate.stockId);
    const baseline = matchesBaseline ? candidate : undefined;
    return {
      ...item,
      vin: isVin(normalizedVin) ? normalizedVin : baseline?.vin ?? item.vin,
      stockId: normalizedStockId || item.stockId,
      branch: legacyBranch(item.branch, baseline?.branch ?? "Johannesburg North"),
      bodyType: validChoice(item.bodyType, vehicleBodyTypes, baseline?.bodyType ?? "Unknown"),
      fuel: validChoice(item.fuel, vehicleFuels, baseline?.fuel ?? "Unknown"),
      transmission: validChoice(item.transmission, vehicleTransmissions, baseline?.transmission ?? "Unknown"),
      engine: validString(item.engine, baseline?.engine ?? "Not captured"),
      registration: validString(item.registration, baseline?.registration ?? "Not captured"),
    };
  });
  const usedIds = new Set(vehicles.filter(isRecord).map((vehicle) => String(vehicle.id)));
  const vins = new Set(vehicles.filter(isRecord).map((vehicle) => String(vehicle.vin).toUpperCase()));
  const stockIds = new Set(vehicles.filter(isRecord).map((vehicle) => String(vehicle.stockId).toUpperCase()));
  for (const seedVehicle of seed.vehicles) {
    if (vins.has(seedVehicle.vin) || stockIds.has(seedVehicle.stockId)) continue;
    let id = seedVehicle.id;
    let suffix = seed.vehicles.length + 1;
    while (usedIds.has(id)) id = `vehicle-${String(suffix++).padStart(2, "0")}`;
    const vehicle: Vehicle = { ...seedVehicle, id, gallery: { ...seedVehicle.gallery, images: seedVehicle.gallery.images.map((image) => ({ ...image })) } };
    vehicles.push(vehicle);
    usedIds.add(id);
    vins.add(vehicle.vin);
    stockIds.add(vehicle.stockId);
  }
  const sourcePreferences = isRecord(value.preferences) ? value.preferences : {};
  const seedBranch = legacyBranch(sourcePreferences.branch, "Johannesburg North");
  return { ...value, schemaVersion: 2, vehicles, preferences: { ...sourcePreferences, branch: seedBranch } };
}

function normalizeDemoAssignees(value: RecordValue): RecordValue {
  const salesAssignees = ["Naledi Ndlovu", "Alicia Brown", "Marcus Botha", "Lindiwe Khumalo"];
  const leads = Array.isArray(value.leads) ? value.leads.map((item) => {
    if (!isRecord(item)) return item;
    const number = Number(String(item.id).match(/lead-(\d+)$/u)?.[1]);
    if (!Number.isInteger(number) || number < 1 || number > 16) return item;
    const legacyOwner = number % 2 ? "Alicia Brown" : "Marcus Botha";
    return item.owner === legacyOwner ? { ...item, owner: salesAssignees[(number - 1) % salesAssignees.length] } : item;
  }) : value.leads;
  const deals = Array.isArray(value.deals) ? value.deals.map((item) => {
    if (!isRecord(item)) return item;
    const number = Number(String(item.id).match(/deal-(\d+)$/u)?.[1]);
    if (!Number.isInteger(number) || number < 1 || number > 8) return item;
    const legacyRep = number % 2 ? "Alicia Brown" : "Marcus Botha";
    return item.salesRep === legacyRep ? { ...item, salesRep: salesAssignees[(number - 1) % salesAssignees.length] } : item;
  }) : value.deals;
  const serviceJobs = Array.isArray(value.serviceJobs) ? value.serviceJobs.map((item) => isRecord(item) && item.id === "service-05" && item.advisor === "Peter van der Merwe" ? { ...item, advisor: "Sipho Dlamini" } : item) : value.serviceJobs;
  return { ...value, leads, deals, serviceJobs };
}

function normalizeConnectedDataset(value: RecordValue): RecordValue {
  const collectionKeys = ["customers", "leads", "deals", "financeDrafts", "financeApplications", "serviceJobs", "employees", "appointments", "testDrives", "quotes", "payments", "documents", "tasks", "notifications", "activities"] as const;
  const expectedCounts: Record<(typeof collectionKeys)[number], number> = { customers: 48, leads: 64, deals: 24, financeDrafts: 20, financeApplications: 20, serviceJobs: 18, employees: 15, appointments: 24, testDrives: 16, quotes: 24, payments: 18, documents: 30, tasks: 40, notifications: 6, activities: 40 };
  if (collectionKeys.every((key) => Array.isArray(value[key]) && value[key].length >= expectedCounts[key])) return value;
  const seed = createSeedState() as unknown as RecordValue;
  const normalized: RecordValue = { ...value };
  for (const key of collectionKeys) {
    const current = Array.isArray(value[key]) ? value[key] as unknown[] : [];
    const baseline = seed[key] as unknown[];
    const currentIds = new Set(current.filter(isRecord).map((record) => String(record.id ?? (key === "financeDrafts" ? record.vehicleId : ""))));
    normalized[key] = [...current, ...baseline.filter((record) => isRecord(record) && !currentIds.has(String(record.id ?? (key === "financeDrafts" ? record.vehicleId : ""))))];
  }
  return normalized;
}

export function migrateDemoState(value: unknown): DemoState | null {
  if (isRecord(value) && value.schemaVersion === 1) value = migrateVehicleRoster(value);
  if (isRecord(value) && value.schemaVersion === 2 && isRecord(value.preferences)) {
    const normalized = normalizeConnectedDataset(normalizeDemoAssignees(value));
    const preferences = isRecord(normalized.preferences) ? normalized.preferences : value.preferences;
    const { activePage: _page, activeSubview: _subview, activeRecordType: _type, activeRecordId: _id, activeContextId: _context, ...stablePreferences } = preferences;
    const drafts = isRecord(normalized.drafts) ? normalized.drafts : {};
    const vehicleIntakes = isRecord(drafts.vehicleIntakes) ? { ...drafts.vehicleIntakes } : {};
    const legacyScope = `owner:${String(preferences.branch)}`;
    if (isVehicleIntakeDraft(drafts.vehicleIntake) && vehicleIntakes[legacyScope] === undefined) vehicleIntakes[legacyScope] = drafts.vehicleIntake;
    value = { ...normalized, preferences: { ...stablePreferences, ...normalizeRoute(normalized, preferences), viewPreferences: normalizeViewPreferences(preferences.viewPreferences) }, drafts: { ...drafts, vehicleIntake: null, vehicleIntakes } };
  }
  return isCompatibleDemoState(value) ? value : null;
}
