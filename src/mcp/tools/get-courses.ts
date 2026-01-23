/**
 * Tool: get_courses
 * List all active courses and current grades for the student
 */

import { z } from "zod";
import { getCourses } from "../../services/index.ts";
import { getEffectiveStudentId } from "../../api/users.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z
    .string()
    .optional()
    .describe("Student ID (uses configured CANVAS_STUDENT_ID if not provided)"),
};

export const getCoursesTool: ToolDefinition<typeof schema> = {
  name: "get_courses",
  description: "List all active courses and current grades for the student",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);
    const courses = await getCourses({ studentId: String(effectiveStudentId) });
    return jsonResponse(courses);
  },
};
