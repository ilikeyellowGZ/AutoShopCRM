import type { LeadStage } from "./models";

export const LEAD_STAGES = ["Lead", "Negotiation", "Contract", "Delivery"] as const satisfies readonly LeadStage[];

export function isLeadStage(value: unknown): value is LeadStage {
  return typeof value === "string" && LEAD_STAGES.includes(value as LeadStage);
}
