import type { DemoState } from "../domain/models";

export type SeedIntegrityIssue = {
  code: "duplicate-id" | "duplicate-value" | "dangling-reference";
  collection: string;
  recordId: string;
  field?: string;
  targetId?: string;
  message: string;
};

type Identified = { id: string };

export function validateDemoState(state: DemoState): SeedIntegrityIssue[] {
  const issues: SeedIntegrityIssue[] = [];
  const collections: Record<string, readonly Identified[]> = {
    vehicles: state.vehicles, customers: state.customers, leads: state.leads, deals: state.deals,
    financeApplications: state.financeApplications, serviceJobs: state.serviceJobs, employees: state.employees,
    appointments: state.appointments, testDrives: state.testDrives, quotes: state.quotes, payments: state.payments,
    documents: state.documents, tasks: state.tasks, notifications: state.notifications, activities: state.activities,
  };
  const ids: Record<string, Set<string>> = {};

  for (const [collection, records] of Object.entries(collections)) {
    const seen = new Set<string>();
    ids[collection] = seen;
    for (const record of records) {
      if (seen.has(record.id)) issues.push({ code: "duplicate-id", collection, recordId: record.id, field: "id", targetId: record.id, message: `${collection}.${record.id} duplicates an existing identifier.` });
      seen.add(record.id);
    }
  }

  const duplicateValue = (collection: string, field: string, records: readonly Identified[], value: (record: Identified) => string) => {
    const seen = new Set<string>();
    for (const record of records) {
      const candidate = value(record).toUpperCase();
      if (seen.has(candidate)) issues.push({ code: "duplicate-value", collection, recordId: record.id, field, targetId: candidate, message: `${collection}.${record.id}.${field} duplicates ${candidate}.` });
      seen.add(candidate);
    }
  };
  duplicateValue("vehicles", "vin", state.vehicles, (record) => (record as DemoState["vehicles"][number]).vin);
  duplicateValue("vehicles", "stockId", state.vehicles, (record) => (record as DemoState["vehicles"][number]).stockId);
  duplicateValue("customers", "email", state.customers, (record) => (record as DemoState["customers"][number]).email);
  const draftVehicleIds = new Set<string>();
  for (const draft of state.financeDrafts) {
    const candidate = draft.vehicleId.toUpperCase();
    if (draftVehicleIds.has(candidate)) issues.push({ code: "duplicate-value", collection: "financeDrafts", recordId: draft.vehicleId, field: "vehicleId", targetId: draft.vehicleId, message: `financeDrafts.${draft.vehicleId}.vehicleId duplicates ${draft.vehicleId}.` });
    draftVehicleIds.add(candidate);
  }

  const reference = (collection: string, recordId: string, field: string, targetId: string | undefined, targetCollection: keyof typeof ids) => {
    if (targetId && !ids[targetCollection].has(targetId)) issues.push({ code: "dangling-reference", collection, recordId, field, targetId, message: `${collection}.${recordId}.${field} points to missing ${targetCollection}.${targetId}.` });
  };
  for (const customer of state.customers) reference("customers", customer.id, "vehicleInterestId", customer.vehicleInterestId, "vehicles");
  for (const lead of state.leads) { reference("leads", lead.id, "customerId", lead.customerId, "customers"); reference("leads", lead.id, "vehicleId", lead.vehicleId, "vehicles"); }
  for (const deal of state.deals) { reference("deals", deal.id, "customerId", deal.customerId, "customers"); reference("deals", deal.id, "vehicleId", deal.vehicleId, "vehicles"); }
  for (const draft of state.financeDrafts) reference("financeDrafts", draft.vehicleId, "vehicleId", draft.vehicleId, "vehicles");
  for (const application of state.financeApplications) { reference("financeApplications", application.id, "dealId", application.dealId, "deals"); reference("financeApplications", application.id, "customerId", application.customerId, "customers"); reference("financeApplications", application.id, "vehicleId", application.vehicleId, "vehicles"); }
  for (const job of state.serviceJobs) { reference("serviceJobs", job.id, "customerId", job.customerId, "customers"); reference("serviceJobs", job.id, "vehicleId", job.vehicleId, "vehicles"); }
  for (const appointment of state.appointments) { reference("appointments", appointment.id, "customerId", appointment.customerId, "customers"); reference("appointments", appointment.id, "leadId", appointment.leadId, "leads"); reference("appointments", appointment.id, "vehicleId", appointment.vehicleId, "vehicles"); }
  for (const drive of state.testDrives) { reference("testDrives", drive.id, "appointmentId", drive.appointmentId, "appointments"); reference("testDrives", drive.id, "customerId", drive.customerId, "customers"); reference("testDrives", drive.id, "leadId", drive.leadId, "leads"); reference("testDrives", drive.id, "vehicleId", drive.vehicleId, "vehicles"); }
  for (const quote of state.quotes) { reference("quotes", quote.id, "customerId", quote.customerId, "customers"); reference("quotes", quote.id, "leadId", quote.leadId, "leads"); reference("quotes", quote.id, "vehicleId", quote.vehicleId, "vehicles"); }
  for (const payment of state.payments) { reference("payments", payment.id, "dealId", payment.dealId, "deals"); reference("payments", payment.id, "customerId", payment.customerId, "customers"); }
  for (const document of state.documents) { reference("documents", document.id, "customerId", document.customerId, "customers"); reference("documents", document.id, "leadId", document.leadId, "leads"); reference("documents", document.id, "dealId", document.dealId, "deals"); reference("documents", document.id, "vehicleId", document.vehicleId, "vehicles"); }

  const taskTargets = { lead: "leads", deal: "deals", vehicle: "vehicles", service: "serviceJobs" } as const;
  for (const task of state.tasks) reference("tasks", task.id, "relatedId", task.relatedId, taskTargets[task.relatedType]);
  const activityTargets = { vehicle: "vehicles", customer: "customers", lead: "leads", deal: "deals", service: "serviceJobs", task: "tasks" } as const;
  for (const activity of state.activities) if (activity.targetType !== "system") reference("activities", activity.id, "targetId", activity.targetId, activityTargets[activity.targetType]);
  const allRecordIds = new Set(Object.values(ids).flatMap((set) => [...set]));
  for (const notification of state.notifications) if (!allRecordIds.has(notification.relatedId)) issues.push({ code: "dangling-reference", collection: "notifications", recordId: notification.id, field: "relatedId", targetId: notification.relatedId, message: `notifications.${notification.id}.relatedId points to a missing record.` });

  return issues;
}
