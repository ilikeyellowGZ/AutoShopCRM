import type { DemoState, TaskItem } from "../../domain/models";
import type { NavigationTarget } from "../../app/routes";

export type CommandSearchResult = {
  id: string;
  type: "vehicle" | "customer" | "lead" | "deal" | "service" | "action";
  title: string;
  detail: string;
  target: NavigationTarget;
};

type Candidate = CommandSearchResult & { searchable: string[] };

const normalise = (value: string) => value.trim().toLocaleLowerCase();

function taskTarget(task: TaskItem): NavigationTarget {
  return { page: "operations", subview: "tasks", recordType: "task", recordId: task.id, contextId: task.relatedId };
}

export function searchCommands(state: DemoState, query: string): CommandSearchResult[] {
  const needle = normalise(query);
  if (!needle) return [];

  const customersById = new Map(state.customers.map((customer) => [customer.id, customer]));
  const vehiclesById = new Map(state.vehicles.map((vehicle) => [vehicle.id, vehicle]));
  const candidates: Candidate[] = [
    ...state.vehicles.map((vehicle) => ({
      id: vehicle.id,
      type: "vehicle" as const,
      title: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.derivative}`,
      detail: `${vehicle.stockId} · ${vehicle.status}`,
      target: { page: "inventory" as const, subview: vehicle.id, recordType: "vehicle" as const, recordId: vehicle.id },
      searchable: [vehicle.id, vehicle.stockId, vehicle.vin, vehicle.make, vehicle.model, vehicle.derivative, vehicle.exterior],
    })),
    ...state.customers.map((customer) => ({
      id: customer.id,
      type: "customer" as const,
      title: customer.name,
      detail: `${customer.city} · ${customer.crmStatus}`,
      target: { page: "customers" as const, subview: customer.id, recordType: "customer" as const, recordId: customer.id },
      searchable: [customer.id, customer.name, customer.email, customer.phone, customer.city],
    })),
    ...state.deals.map((deal) => {
      const customer = customersById.get(deal.customerId);
      const vehicle = vehiclesById.get(deal.vehicleId);
      return {
        id: deal.id,
        type: "deal" as const,
        title: `Deal ${deal.id}`,
        detail: `${customer?.name ?? "Customer"} · ${vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle"} · ${deal.status}`,
        target: { page: "sales" as const, subview: "deals", recordType: "deal" as const, recordId: deal.id },
        searchable: [deal.id, customer?.name ?? "", vehicle?.stockId ?? "", vehicle?.make ?? "", vehicle?.model ?? "", deal.status],
      };
    }),
    ...state.leads.map((lead) => ({ id: lead.id, type: "lead" as const, title: `Lead ${lead.id}`, detail: `${lead.stage} · ${lead.nextAction}`, target: { page: "customers" as const, subview: "leads", recordType: "lead" as const, recordId: lead.id }, searchable: [lead.id, lead.owner, lead.nextAction, lead.stage] })),
    ...state.serviceJobs.map((job) => ({ id: job.id, type: "service" as const, title: `Service job ${job.id}`, detail: `${job.status} · ${job.note}`, target: { page: "service" as const, subview: "service-board", recordType: "service" as const, recordId: job.id }, searchable: [job.id, job.advisor, job.technician, job.status, job.note] })),
    ...state.tasks.filter((task) => task.status !== "Completed").map((task) => ({
      id: task.id,
      type: "action" as const,
      title: task.title,
      detail: task.detail,
      target: taskTarget(task),
      searchable: [task.id, task.title, task.detail, task.status],
    })),
  ];

  return candidates
    .map((candidate, index) => {
      const exactId = normalise(candidate.id) === needle;
      const exactIdentifier = candidate.searchable.slice(0, 3).some((value) => normalise(value) === needle);
      const titleMatch = normalise(candidate.title).includes(needle);
      const otherMatch = candidate.searchable.some((value) => normalise(value).includes(needle));
      const score = exactId ? 0 : exactIdentifier ? 1 : titleMatch ? 2 : otherMatch ? 3 : 4;
      return { candidate, index, score };
    })
    .filter(({ score }) => score < 4)
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .slice(0, 8)
    .map(({ candidate }) => {
      const { searchable: _searchable, ...result } = candidate;
      return result;
    });
}
