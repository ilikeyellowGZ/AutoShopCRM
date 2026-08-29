import type { DemoState } from "./models";
import { customerContext, vehicleContext } from "./context";

export type AgentInsight = {
  id: string;
  severity: "info" | "warning" | "critical";
  title: string;
  summary: string;
  recommendation: string;
  evidence: string[];
};

const isBefore = (value: string, reference: string) => new Date(value).getTime() < new Date(reference).getTime();

export function insightsForCustomer(state: DemoState, customerId: string, now = new Date().toISOString()): AgentInsight[] {
  const context = customerContext(state, customerId);
  if (!context) return [];
  const insights: AgentInsight[] = [];
  const customerLeads = context.leads.filter((lead) => lead.customerId === customerId);
  for (const lead of customerLeads) {
    if (lead.stage !== "Delivery" && isBefore(lead.dueAt, now)) insights.push({
      id: `stale-lead-${lead.id}`,
      severity: "warning",
      title: "Follow-up is overdue",
      summary: `${lead.nextAction} is overdue for ${context.customer.name}.`,
      recommendation: "Create or complete the next customer follow-up.",
      evidence: [lead.id],
    });
  }
  const pendingApplications = context.financeApplications.filter((application) => application.customerId === customerId && (application.status === "Submitted" || application.status === "Draft"));
  if (pendingApplications.length) insights.push({
    id: `finance-pending-${customerId}`,
    severity: "info",
    title: "Finance still needs attention",
    summary: `${pendingApplications.length} finance application is still open for this customer.`,
    recommendation: "Review finance status before the next sales action.",
    evidence: pendingApplications.map((application) => application.id),
  });
  return insights;
}

export function insightsForVehicle(state: DemoState, vehicleId: string): AgentInsight[] {
  const context = vehicleContext(state, vehicleId);
  if (!context) return [];
  const insights: AgentInsight[] = [];
  if (context.vehicle.daysInStock >= 60) insights.push({
    id: `aged-stock-${vehicleId}`,
    severity: "warning",
    title: "Aged stock risk",
    summary: `${context.vehicle.stockId} has been in stock for ${context.vehicle.daysInStock} days.`,
    recommendation: "Review pricing, photography, and assigned follow-ups.",
    evidence: [vehicleId],
  });
  const vehicleDeals = context.deals.filter((deal) => deal.vehicleId === vehicleId);
  const vehicleDocuments = context.documents.filter((document) => document.vehicleId === vehicleId);
  if (vehicleDeals.length && vehicleDocuments.length === 0) insights.push({
    id: `missing-documents-${vehicleId}`,
    severity: "critical",
    title: "Deal documents are missing",
    summary: "A linked deal exists, but no CRM documents are attached to this vehicle.",
    recommendation: "Request identity, finance, and contract documents before delivery.",
    evidence: vehicleDeals.map((deal) => deal.id),
  });
  const openPrepTasks = context.tasks.filter((task) => task.relatedType === "vehicle" && task.relatedId === vehicleId && task.status !== "Completed");
  if (openPrepTasks.length) insights.push({
    id: `open-tasks-${vehicleId}`,
    severity: "info",
    title: "Open operational tasks",
    summary: `${openPrepTasks.length} task is still open for this vehicle.`,
    recommendation: "Clear open tasks before handover or listing approval.",
    evidence: openPrepTasks.map((task) => task.id),
  });
  return insights;
}
