/**
 * Tool: get_upcoming_assignments
 * Get assignments due in the next N days for a single course
 */

import { z } from "zod";
import { getUpcomingAssignments } from "../../services/index.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  course_id: z.number().describe("Course ID"),
  days: z.number().optional().default(7).describe("Number of days to look ahead (default: 7)"),
};

export const getUpcomingAssignmentsTool: ToolDefinition<typeof schema> = {
  name: "get_upcoming_assignments",
  description:
    "Get assignments due in the next N days for a SINGLE course. Requires course_id. Use this when asking about upcoming work in a specific class. For upcoming assignments across ALL courses at once, use get_due_this_week instead - it's more efficient for broad queries.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ course_id, days }) => {
    const assignments = await getUpcomingAssignments({
      courseId: course_id,
      days,
    });

    return jsonResponse(assignments);
  },
};
