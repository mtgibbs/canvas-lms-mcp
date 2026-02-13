/**
 * MCP Tool: get_all_students_status
 *
 * Returns comprehensive status for ALL observed students in a single call.
 * Each student's data is clearly labeled to prevent mix-ups.
 *
 * CLI equivalent: `canvas status --all-students`
 */

import { z } from "zod";
import { getAllStudentsStatus } from "../../services/index.ts";
import type { Tool } from "../types.ts";

export const schema = z.object({
  days_upcoming: z.number().optional().describe(
    "Days to look ahead for upcoming assignments (default: 7)",
  ),
  days_grades: z.number().optional().describe(
    "Days to look back for recent grades (default: 7)",
  ),
  low_grade_threshold: z.number().optional().describe(
    "Percentage threshold for flagging low grades (default: 70)",
  ),
});

export const getAllStudentsStatusTool: Tool = {
  name: "get_all_students_status",
  description:
    "Get comprehensive academic status for ALL observed students in a single call. Use this tool when the user asks about ALL their students or wants a combined overview. Each student's data is clearly separated and labeled (student_name, student_id, status). NEVER mix data between students when presenting results. Returns an array of objects, each containing: student_name (string), student_id (number), and status (ComprehensiveStatus with courses, grades, missing work, upcoming assignments, recent low grades, and recent announcements).",
  inputSchema: schema,
  handler: async (args) => {
    const params = schema.parse(args);

    const result = await getAllStudentsStatus({
      daysUpcoming: params.days_upcoming,
      daysGrades: params.days_grades,
      lowGradeThreshold: params.low_grade_threshold,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
};
