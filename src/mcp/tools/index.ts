/**
 * Tool registry - exports all MCP tools
 */

import { getCoursesTool } from "./get-courses.ts";
import { getMissingAssignmentsTool } from "./get-missing-assignments.ts";
import { getUnsubmittedPastDueTool } from "./get-unsubmitted-past-due.ts";
import { getUpcomingAssignmentsTool } from "./get-upcoming-assignments.ts";
import { getDueThisWeekTool } from "./get-due-this-week.ts";
import { listAssignmentsTool } from "./list-assignments.ts";
import { getStatsTool } from "./get-stats.ts";
import { getTodoTool } from "./get-todo.ts";
import { getRecentGradesTool } from "./get-recent-grades.ts";
import { getComprehensiveStatusTool } from "./get-comprehensive-status.ts";
import type { AnyToolDefinition } from "../types.ts";

/**
 * All available MCP tools
 */
export const tools: AnyToolDefinition[] = [
  getCoursesTool,
  getMissingAssignmentsTool,
  getUnsubmittedPastDueTool,
  getUpcomingAssignmentsTool,
  getDueThisWeekTool,
  listAssignmentsTool,
  getStatsTool,
  getTodoTool,
  getRecentGradesTool,
  getComprehensiveStatusTool,
];

// Re-export individual tools for direct access if needed
export {
  getComprehensiveStatusTool,
  getCoursesTool,
  getDueThisWeekTool,
  getMissingAssignmentsTool,
  getRecentGradesTool,
  getStatsTool,
  getTodoTool,
  getUnsubmittedPastDueTool,
  getUpcomingAssignmentsTool,
  listAssignmentsTool,
};
