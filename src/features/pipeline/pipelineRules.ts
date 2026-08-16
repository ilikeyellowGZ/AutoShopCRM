import type { LeadStage } from "../../domain/models";

export const PIPELINE_STAGES: readonly LeadStage[] = ["Lead", "Negotiation", "Contract", "Delivery"];

export function canMoveLead(from: LeadStage, to: LeadStage): boolean {
  return from !== to && PIPELINE_STAGES.includes(from) && PIPELINE_STAGES.includes(to);
}
