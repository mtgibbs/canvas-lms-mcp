/**
 * Service layer exports
 *
 * Services contain the shared business logic used by both CLI commands and MCP tools.
 * This ensures feature parity and avoids code duplication.
 *
 * When adding a new feature:
 * 1. Create a service in src/services/
 * 2. Export it from this file
 * 3. Have both CLI command and MCP tool call the service
 */

// Types
export * from "./types.ts";

// Services
export { getCourses, type GetCoursesOptions } from "./courses.ts";
export {
  getMissingAssignments,
  getMissingCountsByCourse,
  type GetMissingOptions,
  type MissingCountByCourse,
} from "./missing.ts";
export {
  type AssignmentBucket,
  type AssignmentResult,
  listAssignments,
  type ListAssignmentsOptions,
} from "./assignments.ts";
export { type GetGradesOptions, getRecentGrades } from "./grades.ts";
export {
  getUpcomingAssignments,
  type GetUpcomingOptions,
  type UpcomingAssignment,
} from "./upcoming.ts";
export { getTodoItems, type GetTodoOptions, type TodoItem } from "./todo.ts";
export { type CourseStats, getStats, type GetStatsOptions } from "./stats.ts";
export { getComprehensiveStatus, type GetStatusOptions } from "./status.ts";
export { getDueAssignments, type GetDueOptions } from "./due.ts";
export { getUnsubmittedAssignments, type GetUnsubmittedOptions } from "./unsubmitted.ts";
export {
  getUpcomingEvents,
  type GetUpcomingEventsOptions,
  type UpcomingEvent,
} from "./upcoming-events.ts";
