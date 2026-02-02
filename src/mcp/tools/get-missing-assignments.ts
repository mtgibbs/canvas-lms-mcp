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
  all_grading_periods: z
    .boolean()
    .optional()
    .describe(
      "If true, include missing assignments from ALL grading periods (default: false, only current grading period)",
    ),
};

export const getMissingAssignmentsTool: ToolDefinition<typeof schema> = {
  name: "get_missing_assignments",
  description:
    "Get assignments that Canvas has officially flagged as 'missing' for the CURRENT grading period. These are past-due assignments where the teacher has marked them missing. By default, only shows assignments from the current grading period (e.g., Semester 2) to match what parents see in the Canvas portal. Set all_grading_periods=true to include old semesters. NOTE: This may not catch all unsubmitted work - use get_unsubmitted_past_due for assignments that are past due but not yet flagged by the teacher.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, course_id, all_grading_periods }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);
    const missing = await getMissingAssignments({
      studentId: String(effectiveStudentId),
      courseId: course_id,
      allGradingPeriods: all_grading_periods,
    });

    return jsonResponse(missing);
  },
};
