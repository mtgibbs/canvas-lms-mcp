/**
 * Tool: get_comprehensive_status
 * Get a complete academic status overview in a single call
 * Combines courses, grades, missing work, and upcoming assignments
 */

import { z } from "zod";
import { getComprehensiveStatus } from "../../services/index.ts";
import { getEffectiveStudentId } from "../../api/users.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z
    .string()
    .optional()
    .describe("Student ID (uses configured CANVAS_STUDENT_ID if not provided)"),
  days_upcoming: z
    .number()
    .optional()
    .default(7)
    .describe("Number of days to look ahead for upcoming assignments (default: 7)"),
  days_grades: z
    .number()
    .optional()
    .default(14)
    .describe("Number of days to look back for recent grades (default: 14)"),
  low_grade_threshold: z
    .number()
    .optional()
    .default(70)
    .describe("Percentage threshold for flagging low grades (default: 70)"),
};

export const getComprehensiveStatusTool: ToolDefinition<typeof schema> = {
  name: "get_comprehensive_status",
  description:
    "The BEST starting point for high-level queries like 'how am I doing?', 'daily summary', or 'check my grades'. Returns a combined dashboard of courses, current grades, missing work, and upcoming tasks in a single call. Prefer this over calling individual tools for general status checks.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, days_upcoming, days_grades, low_grade_threshold }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);

    const status = await getComprehensiveStatus({
      studentId: String(effectiveStudentId),
      daysUpcoming: days_upcoming,
      daysGrades: days_grades,
      lowGradeThreshold: low_grade_threshold,
    });

    return jsonResponse(status);
  },
};
