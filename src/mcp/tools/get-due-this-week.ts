/**
 * Tool: get_due_this_week
 * Get all assignments due in the next N days across ALL courses
 */

import { z } from "zod";
import { getDueAssignments } from "../../services/index.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z.string().describe("Student ID"),
  days: z
    .number()
    .optional()
    .default(7)
    .describe("Number of days to look ahead (default: 7)"),
  hide_graded: z
    .boolean()
    .optional()
    .default(true)
    .describe("Hide assignments that have already been graded (default: true)"),
};

export const getDueThisWeekTool: ToolDefinition<typeof schema> = {
  name: "get_due_this_week",
  description:
    "Get all assignments due in the next N days across ALL courses for a student, with submission status",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, days, hide_graded }) => {
    const results = await getDueAssignments({
      studentId: student_id,
      days,
      hideGraded: hide_graded,
    });

    return jsonResponse(results);
  },
};
