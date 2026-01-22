/**
 * Tool: get_missing_assignments
 * Get missing assignments for a student (Canvas-flagged as missing)
 */

import { z } from "zod";
import { getMissingAssignments } from "../../services/index.ts";
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
    const missing = await getMissingAssignments({
      studentId: student_id || "self",
      courseId: course_id,
    });

    return jsonResponse(missing);
  },
};
