/**
 * Tool: get_stats
 * Get late and missing assignment statistics by course
 */

import { z } from "zod";
import { getStats } from "../../services/index.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z.string().describe("Student ID"),
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
    const stats = await getStats({
      studentId: student_id,
      hideEmpty: hide_empty,
    });

    return jsonResponse(stats);
  },
};
