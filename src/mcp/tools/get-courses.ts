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
  description:
    "List all active courses with current cumulative grades (score percentages). Use this to get an overview of the student's course load and overall academic standing. For observer/parent accounts, this fetches the observed student's grades, not the observer's. Returns course name, code, and current score percentage. CRITICAL: This tool provides the 'course_id' numbers required by other tools (like list_assignments). Call this FIRST to map course names (e.g., 'Math') to IDs.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id }) => {
    const effectiveStudentId = await getEffectiveStudentId(student_id);
    const courses = await getCourses({ studentId: String(effectiveStudentId) });
    return jsonResponse(courses);
  },
};
