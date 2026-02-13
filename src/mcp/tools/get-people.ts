/**
 * MCP Tool: get_people
 *
 * Shows teachers and teaching assistants for courses.
 * Helps parents know who teaches each course and how to contact them.
 *
 * CLI equivalent: `canvas people`
 */

import { z } from "zod";
import { getPeople } from "../../services/index.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z.string().optional().describe(
    "Student ID (use 'self' for current user, or numeric ID from get_students tool). For observer accounts to get courses.",
  ),
  course_id: z.number().optional().describe(
    "Filter to specific course (omit to fetch from all active courses)",
  ),
};

export const getPeopleTool: ToolDefinition<typeof schema> = {
  name: "get_people",
  description:
    "Get teachers and teaching assistants for courses. Returns a list of people with: name, role (Teacher or TA), email (if available), and an array of courses they teach. When fetching across all courses, people who teach multiple courses are deduplicated and listed once with all their courses. Use this to help parents know who teaches each course and how to contact them. Sorted alphabetically by name.",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, course_id }) => {
    const result = await getPeople({
      studentId: student_id,
      courseId: course_id,
    });

    return jsonResponse(result);
  },
};
