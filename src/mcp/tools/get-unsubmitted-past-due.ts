/**
 * Tool: get_unsubmitted_past_due
 * Get assignments that are past due but not submitted
 */

import { z } from "zod";
import { getUnsubmittedAssignments } from "../../services/index.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z.string().describe("Student ID (required for this endpoint)"),
  course_id: z
    .number()
    .optional()
    .describe("Filter by specific course ID (if omitted, checks all courses)"),
};

export const getUnsubmittedPastDueTool: ToolDefinition<typeof schema> = {
  name: "get_unsubmitted_past_due",
  description:
    "Get assignments that are past due but not submitted (catches items Canvas hasn't flagged as missing yet)",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, course_id }) => {
    const results = await getUnsubmittedAssignments({
      studentId: student_id,
      courseId: course_id,
    });

    return jsonResponse(results);
  },
};
