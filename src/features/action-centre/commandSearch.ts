import type { DemoState, TaskItem } from "../../domain/models";
import type { NavigationTarget } from "../../app/routes";

export type CommandSearchResult = {
  id: string;
  type: "vehicle" | "customer" | "deal" | "action";
  title: string;
  detail: string;
  target: NavigationTarget;
};

type Candidate = CommandSearchResult & { searchable: string[] };

const normalise = (value: string) => value.trim().toLocaleLowerCase();

function taskTarget(task: TaskItem): NavigationTarget {
  if (task.relatedType === "vehicle") return { page: "inventory", subview: task.relatedId };
  if (task.relatedType === "deal") return { page: "sales", subview: "deals" };
  if (task.relatedType === "lead") return { page: "customers", subview: "leads" };
  return { page: "service", subview: "service-board" };
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
      target: { page: "inventory" as const, subview: vehicle.id },
      searchable: [vehicle.id, vehicle.stockId, vehicle.vin, vehicle.make, vehicle.model, vehicle.derivative, vehicle.exterior],
    })),
    ...state.customers.map((customer) => ({
      id: customer.id,
      type: "customer" as const,
      title: customer.name,
      detail: `${customer.city} · ${customer.crmStatus}`,
      target: { page: "customers" as const, subview: "directory" },
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
        target: { page: "sales" as const, subview: "deals" },
        searchable: [deal.id, customer?.name ?? "", vehicle?.stockId ?? "", vehicle?.make ?? "", vehicle?.model ?? "", deal.status],
      };
    }),
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
