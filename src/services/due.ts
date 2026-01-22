/**
 * Due This Week Service
 * Get all assignments due in the next N days across ALL courses
 *
 * Used by:
 * - CLI: `canvas due`
 * - MCP: `get_due_this_week`
 */

import { listCourses } from "../api/courses.ts";
import { listSubmissions } from "../api/submissions.ts";
import type { DueAssignment } from "./types.ts";

export interface GetDueOptions {
  studentId: string;
  days?: number;
  hideGraded?: boolean;
}

export async function getDueAssignments(
  options: GetDueOptions,
): Promise<DueAssignment[]> {
  const { studentId, days = 7, hideGraded = true } = options;

  // Get all active courses
  const courses = await listCourses({
    enrollment_state: "active",
    state: ["available"],
  });

  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + days);

  // Fetch submissions from all courses in parallel
  const submissionPromises = courses.map(async (course) => {
    try {
      const submissions = await listSubmissions({
        course_id: course.id,
        student_ids: [Number(studentId)],
        include: ["assignment"],
      });

      const courseResults: DueAssignment[] = [];
      for (const sub of submissions) {
        const assignment = sub.assignment;
        if (!assignment?.due_at) continue;

        const dueDate = new Date(assignment.due_at);
        if (dueDate < now || dueDate > endDate) continue;

        courseResults.push({
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
      return courseResults;
    } catch {
      return [];
    }
  });

  const allResults = (await Promise.all(submissionPromises)).flat();

  // Filter out graded items if requested
  let filteredResults = allResults;
  if (hideGraded) {
    filteredResults = allResults.filter((r) => r.score === null);
  }

  // Sort by due date
  filteredResults.sort(
    (a, b) => new Date(a.due_at).getTime() - new Date(b.due_at).getTime(),
  );

  return filteredResults;
}
