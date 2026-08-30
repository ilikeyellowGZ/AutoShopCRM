import type { DemoState, PersistedRecordType, TaskItem } from "../domain/models";
import type { NavigationTarget } from "./routes";

export function exactRecordTarget(type: PersistedRecordType, id: string): NavigationTarget {
  if (type === "vehicle") return { page: "inventory", subview: id, recordType: type, recordId: id };
  if (type === "customer") return { page: "customers", subview: id, recordType: type, recordId: id };
  if (type === "lead") return { page: "customers", subview: "leads", recordType: type, recordId: id };
  if (type === "deal") return { page: "sales", subview: "deals", recordType: type, recordId: id };
  if (type === "service") return { page: "service", subview: "service-board", recordType: type, recordId: id };
  return { page: "operations", subview: "tasks", recordType: type, recordId: id };
}

export function taskRelatedTarget(task: TaskItem): NavigationTarget {
  return exactRecordTarget(task.relatedType, task.relatedId);
}

/** A notification is only worth raising if the reader can reach what it is about, chat and boards included. */
export function targetForRelatedId(state: DemoState, id: string): NavigationTarget | undefined {
  const collections: readonly [PersistedRecordType, readonly { id: string }[]][] = [["vehicle", state.vehicles], ["customer", state.customers], ["lead", state.leads], ["deal", state.deals], ["service", state.serviceJobs], ["task", state.tasks]];
  const match = collections.find(([, records]) => records.some((record) => record.id === id));
  if (match) return exactRecordTarget(match[0], id);
  if (state.chatChannels.some((channel) => channel.id === id)) return { page: "chat", subview: id };
  const item = state.boardItems.find((candidate) => candidate.id === id);
  return item ? { page: "work", subview: item.boardId } : undefined;
}
