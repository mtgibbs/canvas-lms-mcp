/**
 * Tool: get_unsubmitted_past_due
 * Get assignments that are past due but not submitted
 */

import { z } from "zod";
import { getUnsubmittedAssignments } from "../../services/index.ts";
import { getEffectiveStudentId } from "../../api/users.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z
    .string()
    .optional()
    .describe("Student ID (uses configured CANVAS_STUDENT_ID if not provided)"),
  course_id: z
    .number()
    .optional()
    .describe("Filter by specific course ID (if omitted, checks all courses)"),
  all_grading_periods: z
    .boolean()
    .optional()
    .describe(
      "If true, include assignments from ALL grading periods (default: false, only current grading period)",
    ),
};

export const getUnsubmittedPastDueTool: ToolDefinition<typeof schema> = {
  name: "get_unsubmitted_past_due",
  description:
    "Get assignments that are past due but have no submission for the CURRENT grading period. This catches work that Canvas hasn't officially flagged as 'missing' yet (teachers may not have updated the status). By default, only shows assignments from the current grading period (e.g., Semester 2) to match what parents see in the Canvas portal. Set all_grading_periods=true to include old semesters. Use this alongside get_missing_assignments for a complete picture of all outstanding/late work.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, course_id, all_grading_periods }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);

    const results = await getUnsubmittedAssignments({
      studentId: String(effectiveStudentId),
      courseId: course_id,
      allGradingPeriods: all_grading_periods,
    });

    return jsonResponse(results);
  },
};
