import type {
  Appointment,
  AuditActivity,
  CrmDocument,
  Customer,
  Deal,
  DemoState,
  FinanceApplication,
  FinanceDraft,
  Lead,
  Payment,
  Quote,
  ServiceJob,
  TaskItem,
  TestDrive,
  Vehicle,
} from "./models";

export type ContextTimelineEvent = {
  id: string;
  kind: "lead" | "deal" | "finance" | "document" | "service" | "task" | "activity" | "appointment" | "test-drive" | "quote" | "payment";
  occurredAt: string;
  title: string;
  detail: string;
  evidenceId: string;
};

type RecordContext = {
  vehicles: Vehicle[];
  customers: Customer[];
  leads: Lead[];
  deals: Deal[];
  financeDrafts: FinanceDraft[];
  financeApplications: FinanceApplication[];
  serviceJobs: ServiceJob[];
  appointments: Appointment[];
  testDrives: TestDrive[];
  quotes: Quote[];
  payments: Payment[];
  documents: CrmDocument[];
  tasks: TaskItem[];
  activities: AuditActivity[];
  timeline: ContextTimelineEvent[];
};

export type CustomerContext = RecordContext & { customer: Customer };
export type VehicleContext = RecordContext & { vehicle: Vehicle };
export type LeadContext = RecordContext & { lead: Lead };
export type DealContext = RecordContext & { deal: Deal };

const unique = <T,>(items: T[], key: (item: T) => string) => [...new Map(items.map((item) => [key(item), item])).values()];
const byDate = (a: ContextTimelineEvent, b: ContextTimelineEvent) => b.occurredAt.localeCompare(a.occurredAt);

function collectContext(state: DemoState, ids: { customerIds?: Set<string>; vehicleIds?: Set<string>; leadIds?: Set<string>; dealIds?: Set<string> }): RecordContext {
  const customerIds = new Set(ids.customerIds ?? []);
  const vehicleIds = new Set(ids.vehicleIds ?? []);
  const leadIds = new Set(ids.leadIds ?? []);
  const dealIds = new Set(ids.dealIds ?? []);

  let changed = true;
  while (changed) {
    changed = false;
    const add = (set: Set<string>, value: string | undefined) => {
      if (value && !set.has(value)) {
        set.add(value);
        changed = true;
      }
    };
    for (const customer of state.customers) if (customerIds.has(customer.id)) add(vehicleIds, customer.vehicleInterestId);
    for (const lead of state.leads) if (leadIds.has(lead.id) || customerIds.has(lead.customerId) || vehicleIds.has(lead.vehicleId)) {
      add(leadIds, lead.id); add(customerIds, lead.customerId); add(vehicleIds, lead.vehicleId);
    }
    for (const deal of state.deals) if (dealIds.has(deal.id) || customerIds.has(deal.customerId) || vehicleIds.has(deal.vehicleId)) {
      add(dealIds, deal.id); add(customerIds, deal.customerId); add(vehicleIds, deal.vehicleId);
    }
    for (const application of state.financeApplications) if (dealIds.has(application.dealId) || customerIds.has(application.customerId) || vehicleIds.has(application.vehicleId)) {
      add(dealIds, application.dealId); add(customerIds, application.customerId); add(vehicleIds, application.vehicleId);
    }
    for (const appointment of state.appointments) if (customerIds.has(appointment.customerId) || leadIds.has(appointment.leadId) || vehicleIds.has(appointment.vehicleId)) {
      add(customerIds, appointment.customerId); add(leadIds, appointment.leadId); add(vehicleIds, appointment.vehicleId);
    }
  }

  const vehicles = state.vehicles.filter((vehicle) => vehicleIds.has(vehicle.id));
  const customers = state.customers.filter((customer) => customerIds.has(customer.id));
  const leads = state.leads.filter((lead) => leadIds.has(lead.id));
  const deals = state.deals.filter((deal) => dealIds.has(deal.id));
  const financeDrafts = state.financeDrafts.filter((draft) => vehicleIds.has(draft.vehicleId));
  const financeApplications = state.financeApplications.filter((application) => dealIds.has(application.dealId) || customerIds.has(application.customerId) || vehicleIds.has(application.vehicleId));
  const serviceJobs = state.serviceJobs.filter((job) => customerIds.has(job.customerId) || vehicleIds.has(job.vehicleId));
  const appointments = state.appointments.filter((appointment) => customerIds.has(appointment.customerId) || leadIds.has(appointment.leadId) || vehicleIds.has(appointment.vehicleId));
  const appointmentIds = new Set(appointments.map((appointment) => appointment.id));
  const testDrives = state.testDrives.filter((drive) => appointmentIds.has(drive.appointmentId) || customerIds.has(drive.customerId) || leadIds.has(drive.leadId) || vehicleIds.has(drive.vehicleId));
  const quotes = state.quotes.filter((quote) => customerIds.has(quote.customerId) || leadIds.has(quote.leadId) || vehicleIds.has(quote.vehicleId));
  const payments = state.payments.filter((payment) => dealIds.has(payment.dealId) || customerIds.has(payment.customerId));
  const documents = state.documents.filter((document) => Boolean((document.customerId && customerIds.has(document.customerId)) || (document.leadId && leadIds.has(document.leadId)) || (document.dealId && dealIds.has(document.dealId)) || (document.vehicleId && vehicleIds.has(document.vehicleId))));
  const tasks = state.tasks.filter((task) => (task.relatedType === "lead" && leadIds.has(task.relatedId)) || (task.relatedType === "deal" && dealIds.has(task.relatedId)) || (task.relatedType === "vehicle" && vehicleIds.has(task.relatedId)) || serviceJobs.some((job) => task.relatedType === "service" && task.relatedId === job.id));
  const taskIds = new Set(tasks.map((task) => task.id));
  const serviceIds = new Set(serviceJobs.map((job) => job.id));
  const activities = state.activities.filter((activity) => (activity.targetType === "customer" && customerIds.has(activity.targetId)) || (activity.targetType === "lead" && leadIds.has(activity.targetId)) || (activity.targetType === "deal" && dealIds.has(activity.targetId)) || (activity.targetType === "vehicle" && vehicleIds.has(activity.targetId)) || (activity.targetType === "service" && serviceIds.has(activity.targetId)) || (activity.targetType === "task" && taskIds.has(activity.targetId)));
  const timeline = [
    ...leads.map((lead) => ({ id: lead.id, kind: "lead" as const, occurredAt: lead.dueAt, title: `Lead ${lead.stage}`, detail: lead.nextAction, evidenceId: lead.id })),
    ...deals.map((deal) => ({ id: deal.id, kind: "deal" as const, occurredAt: deal.date, title: `Deal ${deal.status}`, detail: deal.salesRep, evidenceId: deal.id })),
    ...financeApplications.map((application) => ({ id: application.id, kind: "finance" as const, occurredAt: application.updatedAt, title: `Finance ${application.status}`, detail: application.owner, evidenceId: application.id })),
    ...documents.map((document) => ({ id: document.id, kind: "document" as const, occurredAt: document.updatedAt, title: document.name, detail: document.status, evidenceId: document.id })),
    ...serviceJobs.map((job) => ({ id: job.id, kind: "service" as const, occurredAt: job.dueAt, title: `Service ${job.status}`, detail: job.note, evidenceId: job.id })),
    ...tasks.map((task) => ({ id: task.id, kind: "task" as const, occurredAt: task.dueAt, title: task.title, detail: task.status, evidenceId: task.id })),
    ...appointments.map((appointment) => ({ id: appointment.id, kind: "appointment" as const, occurredAt: appointment.scheduledAt, title: appointment.purpose, detail: appointment.status, evidenceId: appointment.id })),
    ...testDrives.map((drive) => ({ id: drive.id, kind: "test-drive" as const, occurredAt: drive.scheduledAt, title: "Test drive", detail: drive.status, evidenceId: drive.id })),
    ...quotes.map((quote) => ({ id: quote.id, kind: "quote" as const, occurredAt: quote.createdAt, title: `Quote ${quote.status}`, detail: String(quote.amount), evidenceId: quote.id })),
    ...payments.map((payment) => ({ id: payment.id, kind: "payment" as const, occurredAt: payment.paidAt, title: `Payment ${payment.status}`, detail: String(payment.amount), evidenceId: payment.id })),
    ...activities.map((activity) => ({ id: activity.id, kind: "activity" as const, occurredAt: activity.occurredAt, title: activity.action, detail: activity.detail, evidenceId: activity.id })),
  ].sort(byDate);

  return { vehicles: unique(vehicles, (item) => item.id), customers: unique(customers, (item) => item.id), leads: unique(leads, (item) => item.id), deals: unique(deals, (item) => item.id), financeDrafts: unique(financeDrafts, (item) => item.vehicleId), financeApplications: unique(financeApplications, (item) => item.id), serviceJobs: unique(serviceJobs, (item) => item.id), appointments: unique(appointments, (item) => item.id), testDrives: unique(testDrives, (item) => item.id), quotes: unique(quotes, (item) => item.id), payments: unique(payments, (item) => item.id), documents: unique(documents, (item) => item.id), tasks: unique(tasks, (item) => item.id), activities: unique(activities, (item) => item.id), timeline };
}

export function customerContext(state: DemoState, customerId: string): CustomerContext | null {
  const customer = state.customers.find((item) => item.id === customerId);
  return customer ? { customer, ...collectContext(state, { customerIds: new Set([customerId]) }) } : null;
}

export function vehicleContext(state: DemoState, vehicleId: string): VehicleContext | null {
  const vehicle = state.vehicles.find((item) => item.id === vehicleId);
  return vehicle ? { vehicle, ...collectContext(state, { vehicleIds: new Set([vehicleId]) }) } : null;
}

export function leadContext(state: DemoState, leadId: string): LeadContext | null {
  const lead = state.leads.find((item) => item.id === leadId);
  return lead ? { lead, ...collectContext(state, { leadIds: new Set([leadId]) }) } : null;
}

export function dealContext(state: DemoState, dealId: string): DealContext | null {
  const deal = state.deals.find((item) => item.id === dealId);
  return deal ? { deal, ...collectContext(state, { dealIds: new Set([dealId]) }) } : null;
}
