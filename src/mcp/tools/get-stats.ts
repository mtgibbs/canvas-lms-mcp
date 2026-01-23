/**
 * Tool: get_stats
 * Get late and missing assignment statistics by course
 */

import { z } from "zod";
import { getStats } from "../../services/index.ts";
import { getEffectiveStudentId } from "../../api/users.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z
    .string()
    .optional()
    .describe("Student ID (uses configured CANVAS_STUDENT_ID if not provided)"),
  hide_empty: z
    .boolean()
    .optional()
    .default(true)
    .describe("Hide courses with no assignments (default: true)"),
};

export const getStatsTool: ToolDefinition<typeof schema> = {
  name: "get_stats",
  description:
    "Get late and missing assignment statistics by course, showing percentages to identify problem areas",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, hide_empty }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);

    const stats = await getStats({
      studentId: String(effectiveStudentId),
      hideEmpty: hide_empty,
    });

    return jsonResponse(stats);
  },
};
