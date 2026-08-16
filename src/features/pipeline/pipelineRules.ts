import type { LeadStage } from "../../domain/models";
import { LEAD_STAGES } from "../../domain/leadStages";

export const PIPELINE_STAGES: readonly LeadStage[] = LEAD_STAGES;

export function canMoveLead(from: LeadStage, to: LeadStage): boolean {
  return from !== to && PIPELINE_STAGES.includes(from) && PIPELINE_STAGES.includes(to);
}
