/**
 * Tool: get_upcoming_assignments
 * Get assignments due in the next N days for a single course
 */

import { z } from "zod";
import { listUpcomingAssignments } from "../../api/assignments.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  course_id: z.number().describe("Course ID"),
  days: z.number().optional().default(7).describe("Number of days to look ahead (default: 7)"),
};

export const getUpcomingAssignmentsTool: ToolDefinition<typeof schema> = {
  name: "get_upcoming_assignments",
  description: "Get assignments due in the next N days for a single course",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ course_id, days }) => {
    const assignments = await listUpcomingAssignments(course_id, days);

    const simplified = assignments.map((a) => ({
      id: a.id,
      name: a.name,
      due_at: a.due_at,
      points: a.points_possible,
      submitted: a.submission?.submitted_at ? true : false,
      url: a.html_url,
    }));

    return jsonResponse(simplified);
  },
};
