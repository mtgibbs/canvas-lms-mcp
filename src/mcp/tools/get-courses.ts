/**
 * Tool: get_courses
 * List all active courses and current grades for the student
 */

import { z } from "zod";
import { listCoursesWithGrades } from "../../api/courses.ts";
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
    const courses = await listCoursesWithGrades(student_id || "self");

    const simplified = courses.map((c) => ({
      id: c.id,
      name: c.name,
      code: c.course_code,
      current_grade: c.enrollment?.grades?.current_grade,
      current_score: c.enrollment?.grades?.current_score,
      final_grade: c.enrollment?.grades?.final_grade,
      final_score: c.enrollment?.grades?.final_score,
    }));

    return jsonResponse(simplified);
  },
};
