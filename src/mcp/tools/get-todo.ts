/**
 * Tool: get_todo
 * Get the student's to-do list (planner items)
 */

import { z } from "zod";
import { getTodoItems } from "../../services/index.ts";
import { getEffectiveStudentId } from "../../api/users.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z
    .string()
    .optional()
    .describe("Student ID (uses configured CANVAS_STUDENT_ID if not provided)"),
  days: z.number().optional().default(7).describe("Number of days to look ahead (default: 7)"),
  hide_submitted: z
    .boolean()
    .optional()
    .default(false)
    .describe("Hide items that have been submitted"),
};

export const getTodoTool: ToolDefinition<typeof schema> = {
  name: "get_todo",
  description:
    "Get the student's Canvas planner/to-do list showing upcoming assignments, quizzes, discussions, and tasks. This is what the student sees in their Canvas planner. Shows item type, due date, points, and submission status. Use hide_submitted=true to focus on incomplete items only.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, days, hide_submitted }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);

    const items = await getTodoItems({
      studentId: String(effectiveStudentId),
      days,
      hideSubmitted: hide_submitted,
    });

    return jsonResponse(items);
  },
};
