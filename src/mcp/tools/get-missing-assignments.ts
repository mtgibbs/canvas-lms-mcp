/**
 * Tool: get_missing_assignments
 * Get missing assignments for a student (Canvas-flagged as missing)
 */

import { z } from "zod";
import { getMissingSubmissions } from "../../api/users.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z.string().optional().describe("Student ID (default: 'self')"),
  course_id: z.number().optional().describe("Filter by specific course ID"),
};

export const getMissingAssignmentsTool: ToolDefinition<typeof schema> = {
  name: "get_missing_assignments",
  description: "Get missing assignments for a student (Canvas-flagged as missing)",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, course_id }) => {
    const missing = await getMissingSubmissions({
      studentId: student_id || "self",
      courseIds: course_id ? [course_id] : undefined,
      include: ["course"],
    });

    const simplified = missing.map((m) => ({
      id: m.id,
      name: m.name,
      course: m.course?.name,
      due_at: m.due_at,
      points_possible: m.points_possible,
      url: m.html_url,
    }));

    return jsonResponse(simplified);
  },
};
