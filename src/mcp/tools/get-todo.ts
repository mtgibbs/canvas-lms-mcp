/**
 * Tool: get_todo
 * Get the student's to-do list (planner items)
 */

import { z } from "zod";
import { getPlannerItems } from "../../api/users.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z.string().describe("Student ID"),
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
    "Get the student's to-do list (planner items) showing upcoming assignments, quizzes, and tasks",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, days, hide_submitted }) => {
    const startDate = new Date().toISOString().split("T")[0];
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    const endDateStr = endDate.toISOString().split("T")[0];

    const items = await getPlannerItems({
      studentId: student_id,
      startDate,
      endDate: endDateStr,
    });

    // Filter out submitted items if requested
    let filteredItems = items;
    if (hide_submitted) {
      filteredItems = items.filter((item) => !item.submissions?.submitted);
    }

    // Sort by due date
    filteredItems.sort((a, b) => {
      return new Date(a.plannable_date).getTime() - new Date(b.plannable_date).getTime();
    });

    // Simplify for LLM output
    const simplified = filteredItems.map((item) => ({
      course_name: item.context_name,
      title: item.plannable.title,
      type: item.plannable_type,
      due_at: item.plannable_date,
      points_possible: item.plannable.points_possible,
      submitted: item.submissions?.submitted || false,
      missing: item.submissions?.missing || false,
      graded: item.submissions?.graded || false,
      url: item.html_url,
    }));

    return jsonResponse(simplified);
  },
};
