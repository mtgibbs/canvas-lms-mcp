/**
 * Tool: get_unsubmitted_past_due
 * Get assignments that are past due but not submitted
 */

import { z } from "zod";
import { listCourses } from "../../api/courses.ts";
import { listUnsubmittedPastDueForStudent } from "../../api/submissions.ts";
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
    const courseIds: number[] = [];

    if (course_id) {
      courseIds.push(course_id);
    } else {
      // Get all active courses
      const courses = await listCourses({
        enrollment_state: "active",
        state: ["available"],
      });
      courseIds.push(...courses.map((c) => c.id));
    }

    const results: Array<{
      id: number;
      name: string;
      course_id: number;
      due_at: string | null;
      points_possible: number | null;
      url: string;
    }> = [];

    for (const cid of courseIds) {
      try {
        const unsubmitted = await listUnsubmittedPastDueForStudent(cid, student_id);
        for (const sub of unsubmitted) {
          const assignment = sub.assignment;
          if (!assignment) continue;
          results.push({
            id: assignment.id,
            name: assignment.name,
            course_id: assignment.course_id,
            due_at: assignment.due_at,
            points_possible: assignment.points_possible,
            url: assignment.html_url,
          });
        }
      } catch {
        // Skip courses we can't access
      }
    }

    // Sort by due date (most recent first)
    results.sort((a, b) => {
      if (!a.due_at || !b.due_at) return 0;
      return new Date(b.due_at).getTime() - new Date(a.due_at).getTime();
    });

    return jsonResponse(results);
  },
};
