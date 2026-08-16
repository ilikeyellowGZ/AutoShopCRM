import type { DemoState } from "../domain/models";

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
  id: nonEmptyString, action: nonEmptyString, detail: nonEmptyString, actor: nonEmptyString, occurredAt: nonEmptyString, tone: oneOf(tones),
});

const partial = (shape: Record<string, Validator>): Validator => (value) => isRecord(value) && Object.entries(value).every(([key, field]) => Boolean(shape[key]) && shape[key](field));
const isDrafts = (value: unknown) => isRecord(value)
  && (value.vehicleIntake === null || hasShape(value.vehicleIntake, { step: oneOf([1, 2, 3, 4]), values: partial(vehicleShape) }))
  && (value.lead === null || partial({ id: nonEmptyString, customerId: nonEmptyString, vehicleId: nonEmptyString, owner: nonEmptyString, stage: oneOf(leadStages), value: number, nextAction: nonEmptyString, dueAt: nonEmptyString, tone: oneOf(tones) })(value.lead))
  && (value.deal === null || partial({ id: nonEmptyString, customerId: nonEmptyString, vehicleId: nonEmptyString, salesRep: nonEmptyString, grossProfit: number, status: oneOf(dealStatuses), date: nonEmptyString })(value.deal))
  && isRecord(value.serviceNotes) && Object.values(value.serviceNotes).every(string);

export function isCompatibleDemoState(value: unknown): value is DemoState {
  if (!isRecord(value) || value.schemaVersion !== 1 || !hasShape(value.preferences, { branch: nonEmptyString, density: oneOf(["comfortable", "compact"]), activePage: nonEmptyString, activeSubview: nonEmptyString }) || !isDrafts(value.drafts)) return false;
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
    && notifications.every((notification) => relatedIds.has((notification as RecordValue).relatedId as string));
}

export function migrateDemoState(value: unknown): DemoState | null {
  return isCompatibleDemoState(value) ? value : null;
}
