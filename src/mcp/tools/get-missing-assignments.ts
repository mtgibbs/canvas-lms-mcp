/**
 * Tool: get_missing_assignments
 * Get missing assignments for a student (Canvas-flagged as missing)
 */

import { z } from "zod";
import { getMissingAssignments } from "../../services/index.ts";
import { getEffectiveStudentId } from "../../api/users.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z
    .string()
    .optional()
    .describe("Student ID (uses configured CANVAS_STUDENT_ID if not provided)"),
  course_id: z.number().optional().describe("Filter by specific course ID"),
};

export const getMissingAssignmentsTool: ToolDefinition<typeof schema> = {
  name: "get_missing_assignments",
  description:
    "Get assignments that Canvas has officially flagged as 'missing'. These are past-due assignments where the teacher has marked them missing. NOTE: This may not catch all unsubmitted work - use get_unsubmitted_past_due for assignments that are past due but not yet flagged by the teacher. Use both tools together for a complete picture of outstanding work.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, course_id }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);
    const missing = await getMissingAssignments({
      studentId: String(effectiveStudentId),
      courseId: course_id,
    });

    return jsonResponse(missing);
  },
};
