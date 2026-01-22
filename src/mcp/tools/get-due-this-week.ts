/**
 * Tool: get_due_this_week
 * Get all assignments due in the next N days across ALL courses
 */

import { z } from "zod";
import { listCourses } from "../../api/courses.ts";
import { listSubmissions } from "../../api/submissions.ts";
import { jsonResponse, type ToolDefinition } from "../types.ts";

export const schema = {
  student_id: z.string().describe("Student ID"),
  days: z.number().optional().default(7).describe("Number of days to look ahead (default: 7)"),
  hide_graded: z
    .boolean()
    .optional()
    .default(true)
    .describe("Hide assignments that have already been graded (default: true)"),
};

export const getDueThisWeekTool: ToolDefinition<typeof schema> = {
  name: "get_due_this_week",
  description:
    "Get all assignments due in the next N days across ALL courses for a student, with submission status",
  schema,
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ student_id, days, hide_graded }) => {
    // Get all active courses
    const courses = await listCourses({
      enrollment_state: "active",
      state: ["available"],
    });

    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(now.getDate() + days);

    const results: Array<{
      course_id: number;
      course_name: string;
      assignment_id: number;
      assignment_name: string;
      due_at: string;
      points_possible: number | null;
      submitted: boolean;
      score: number | null;
      grade: string | null;
      url: string;
    }> = [];

    for (const course of courses) {
      try {
        // Get student's submissions with assignment data
        const submissions = await listSubmissions({
          course_id: course.id,
          student_ids: [Number(student_id)],
          include: ["assignment"],
        });

        for (const sub of submissions) {
          const assignment = sub.assignment;
          if (!assignment?.due_at) continue;

          const dueDate = new Date(assignment.due_at);
          if (dueDate < now || dueDate > endDate) continue;

          results.push({
            course_id: course.id,
            course_name: course.name,
            assignment_id: assignment.id,
            assignment_name: assignment.name,
            due_at: assignment.due_at,
            points_possible: assignment.points_possible,
            submitted: !!sub.submitted_at,
            score: sub.score,
            grade: sub.grade,
            url: assignment.html_url,
          });
        }
      } catch {
        // Skip courses we can't access
      }
    }

    // Filter out graded items if requested
    let filteredResults = results;
    if (hide_graded) {
      filteredResults = results.filter((r) => r.score === null);
    }

    // Sort by due date
    filteredResults.sort((a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime());

    return jsonResponse(filteredResults);
  },
};
