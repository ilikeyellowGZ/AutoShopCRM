import type { Customer, DemoState, Lead, LeadStage, Vehicle, VehicleStatus } from "./models";

const PIPELINE_STAGES: readonly LeadStage[] = ["Lead", "Negotiation", "Contract", "Delivery"];

export type VehicleFilterStatus = VehicleStatus | "All";

export type DashboardMetrics = {
  availableVehicles: number;
  inTransitVehicles: number;
  activePipelineCount: number;
  activePipelineValue: number;
  dueTodayTasks: number;
  unreadNotifications: number;
};

export type PipelineColumn = {
  stage: LeadStage;
  leads: Lead[];
  count: number;
  value: number;
};

const normalized = (value: string) => value.trim().toLowerCase();

export function selectDashboardMetrics(state: DemoState): DashboardMetrics {
  return {
    availableVehicles: state.vehicles.filter((vehicle) => vehicle.status === "Available").length,
    inTransitVehicles: state.vehicles.filter((vehicle) => vehicle.status === "In Transit").length,
    activePipelineCount: state.leads.length,
    activePipelineValue: state.leads.reduce((total, lead) => total + lead.value, 0),
    dueTodayTasks: state.tasks.filter((task) => task.status === "Due Today").length,
    unreadNotifications: state.notifications.filter((notification) => !notification.read).length,
  };
}

export function selectFilteredVehicles(state: DemoState, query: string, status: VehicleFilterStatus): Vehicle[] {
  const search = normalized(query);

  return state.vehicles.filter((vehicle) => {
    const matchesStatus = status === "All" || vehicle.status === status;
    const searchable = [vehicle.stockId, vehicle.vin, String(vehicle.year), vehicle.make, vehicle.model, vehicle.derivative, vehicle.exterior, vehicle.branch].join(" ");
    return matchesStatus && (!search || normalized(searchable).includes(search));
  });
}

export function selectPipelineColumns(state: DemoState): PipelineColumn[] {
  return PIPELINE_STAGES.map((stage) => {
    const leads = state.leads.filter((lead) => lead.stage === stage);
    return { stage, leads, count: leads.length, value: leads.reduce((total, lead) => total + lead.value, 0) };
  });
}

export function selectCustomerDirectory(state: DemoState, query: string): Customer[] {
  const search = normalized(query);
  if (!search) return [...state.customers];

  return state.customers.filter((customer) => normalized([
    customer.name,
    customer.email,
    customer.phone,
    customer.city,
    customer.crmStatus,
  ].join(" ")).includes(search));
}
