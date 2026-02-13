/**
 * Tool: get_calendar_events
 * Get non-assignment calendar events (office hours, review sessions, school events, field trips)
 */

import { z } from "zod";
import { getCalendarEvents } from "../../services/index.ts";
import { getEffectiveStudentId } from "../../api/users.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z
    .string()
    .optional()
    .describe("Student ID (uses configured CANVAS_STUDENT_ID if not provided)"),
  days: z
    .number()
    .optional()
    .default(14)
    .describe("Number of days to look ahead for calendar events (default: 14)"),
  course_id: z
    .number()
    .optional()
    .describe(
      "Filter to a specific course ID. Use 'get_courses' to find this ID from a course name.",
    ),
};

export const getCalendarEventsTool: ToolDefinition<typeof schema> = {
  name: "get_calendar_events",
  description:
    "Get upcoming non-assignment calendar events like office hours, review sessions, school events, field trips, assemblies, and other scheduled events. This returns only calendar events, NOT assignment due dates (use get_due_this_week or get_upcoming_assignments for assignments). Events include titles, descriptions, start/end times, and location information. Useful for seeing what's happening on campus beyond coursework deadlines.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, days, course_id }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);

    const items = await getCalendarEvents({
      studentId: String(effectiveStudentId),
      days,
      courseId: course_id,
    });

    return jsonResponse(items);
  },
};
