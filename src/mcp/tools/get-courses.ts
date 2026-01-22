/**
 * Tool: get_courses
 * List all active courses and current grades for the student
 */

import { z } from "zod";
import { getCourses } from "../../services/index.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z.string().optional().describe("Student ID (default: 'self')"),
};

export const getCoursesTool: ToolDefinition<typeof schema> = {
  name: "get_courses",
  description: "List all active courses and current grades for the student",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id }) => {
    const courses = await getCourses({ studentId: student_id || "self" });
    return jsonResponse(courses);
  },
};
