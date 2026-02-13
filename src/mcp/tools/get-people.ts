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
import type { Tool } from "../types.ts";

export const schema = z.object({
  student_id: z.string().optional().describe(
    "Student ID (use 'self' for current user, or numeric ID from get_students tool). For observer accounts to get courses.",
  ),
  course_id: z.number().optional().describe(
    "Filter to specific course (omit to fetch from all active courses)",
  ),
});

export const getPeopleTool: Tool = {
  name: "get_people",
  description:
    "Get teachers and teaching assistants for courses. Returns a list of people with: name, role (Teacher or TA), email (if available), and an array of courses they teach. When fetching across all courses, people who teach multiple courses are deduplicated and listed once with all their courses. Use this to help parents know who teaches each course and how to contact them. Sorted alphabetically by name.",
  inputSchema: schema,
  handler: async (args) => {
    const params = schema.parse(args);

    const result = await getPeople({
      studentId: params.student_id,
      courseId: params.course_id,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  },
};
