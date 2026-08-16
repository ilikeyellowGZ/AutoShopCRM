import type { ServiceJob } from "../../domain/models";

export type ServiceStatus = ServiceJob["status"];

const transitions: Record<ServiceStatus, readonly ServiceStatus[]> = {
  "Booked": ["Checked In"],
  "Checked In": ["In Progress", "Waiting for Parts"],
  "In Progress": ["Waiting for Parts", "Quality Check"],
  "Waiting for Parts": ["In Progress"],
  "Quality Check": ["Ready", "In Progress"],
  "Ready": ["Completed"],
  "Completed": [],
};

export function isServiceStatus(value: unknown): value is ServiceStatus {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(transitions, value);
}

export function canTransitionServiceJob(from: ServiceStatus, to: ServiceStatus): boolean {
  return isServiceStatus(from) && isServiceStatus(to) && transitions[from].includes(to);
}
