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
import { getAnnouncementsTool } from "./get-announcements.ts";
import { getInboxTool } from "./get-inbox.ts";
import { getTeacherCommunicationsTool } from "./get-teacher-communications.ts";
import { getStudentsTool } from "./get-students.ts";
import { getCalendarEventsTool } from "./get-calendar-events.ts";
import { getAllStudentsStatusTool } from "./get-all-students-status.ts";
import { getFeedbackTool } from "./get-feedback.ts";
import { getPeopleTool } from "./get-people.ts";
import { getDiscussionsTool } from "./get-discussions.ts";
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
  getAnnouncementsTool,
  getInboxTool,
  getTeacherCommunicationsTool,
  getStudentsTool,
  getCalendarEventsTool,
  getAllStudentsStatusTool,
  getFeedbackTool,
  getPeopleTool,
  getDiscussionsTool,
];

// Re-export individual tools for direct access if needed
export {
  getAllStudentsStatusTool,
  getAnnouncementsTool,
  getCalendarEventsTool,
  getComprehensiveStatusTool,
  getCoursesTool,
  getDiscussionsTool,
  getDueThisWeekTool,
  getFeedbackTool,
  getInboxTool,
  getMissingAssignmentsTool,
  getPeopleTool,
  getRecentGradesTool,
  getStatsTool,
  getStudentsTool,
  getTeacherCommunicationsTool,
  getTodoTool,
  getUnsubmittedPastDueTool,
  getUpcomingAssignmentsTool,
  listAssignmentsTool,
};
