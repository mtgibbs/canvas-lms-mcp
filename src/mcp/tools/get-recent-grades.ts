/**
 * Tool: get_recent_grades
 * Get graded assignments with scores from the last N days
 */

import { z } from "zod";
import { getRecentGrades } from "../../services/index.ts";
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
    .describe("Number of days to look back (default: 14)"),
  below_percentage: z
    .number()
    .optional()
    .describe("Only show grades below this percentage (e.g., 70 for below 70%)"),
  course_id: z
    .number()
    .optional()
    .describe("Filter by specific course ID (if omitted, checks all courses)"),
};

export const getRecentGradesTool: ToolDefinition<typeof schema> = {
  name: "get_recent_grades",
  description:
    "Get recently graded assignments with scores from the last N days (default 14). Shows assignment name, course, score, points possible, and percentage. Use below_percentage to filter for low grades (e.g., below_percentage=70 to find grades under 70%). Useful for questions like 'how did I do on recent tests?' or 'any bad grades lately?'",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, days, below_percentage, course_id }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);

    const grades = await getRecentGrades({
      studentId: String(effectiveStudentId),
      days,
      courseId: course_id,
      belowPercentage: below_percentage,
    });

    return jsonResponse(grades);
  },
};
