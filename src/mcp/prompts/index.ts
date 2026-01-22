/**
 * Prompt registry - exports all MCP prompts
 */

import { dailyCheckinPrompt } from "./daily-checkin.ts";
import { weekPlanningPrompt } from "./week-planning.ts";
import { courseAnalysisPrompt } from "./course-analysis.ts";
import { gradeRecoveryPrompt } from "./grade-recovery.ts";
import { missingWorkAuditPrompt } from "./missing-work-audit.ts";
import type { PromptDefinition } from "../types.ts";

/**
 * All available MCP prompts
 */
export const prompts: PromptDefinition[] = [
  dailyCheckinPrompt,
  weekPlanningPrompt,
  courseAnalysisPrompt,
  gradeRecoveryPrompt,
  missingWorkAuditPrompt,
];

// Re-export individual prompts for direct access if needed
export {
  courseAnalysisPrompt,
  dailyCheckinPrompt,
  gradeRecoveryPrompt,
  missingWorkAuditPrompt,
  weekPlanningPrompt,
};
