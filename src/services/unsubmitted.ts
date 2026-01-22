/**
 * Unsubmitted Past Due Service
 * Get assignments that are past due but not submitted
 *
 * Used by:
 * - CLI: `canvas unsubmitted`
 * - MCP: `get_unsubmitted_past_due`
 */

import { listCourses } from "../api/courses.ts";
import { listUnsubmittedPastDueForStudent } from "../api/submissions.ts";
import type { UnsubmittedAssignment } from "./types.ts";

export interface GetUnsubmittedOptions {
  studentId: string;
  courseId?: number;
}

export async function getUnsubmittedAssignments(
  options: GetUnsubmittedOptions,
): Promise<UnsubmittedAssignment[]> {
  const { studentId, courseId } = options;

  const courseIds: number[] = [];
  const courseMap = new Map<number, string>();

  if (courseId) {
    courseIds.push(courseId);
    courseMap.set(courseId, `Course ${courseId}`);
  } else {
    const courses = await listCourses({
      enrollment_state: "active",
      state: ["available"],
    });
    for (const course of courses) {
      courseIds.push(course.id);
      courseMap.set(course.id, course.name);
    }
  }

  // Fetch unsubmitted assignments from all courses in parallel
  const unsubmittedPromises = courseIds.map(async (cid) => {
    try {
      const unsubmitted = await listUnsubmittedPastDueForStudent(cid, studentId);
      return unsubmitted
        .filter((sub) => sub.assignment)
        .map((sub) => ({
          id: sub.assignment!.id,
          name: sub.assignment!.name,
          course_id: sub.assignment!.course_id,
          course_name: courseMap.get(sub.assignment!.course_id) ||
            `Course ${sub.assignment!.course_id}`,
          due_at: sub.assignment!.due_at,
          points_possible: sub.assignment!.points_possible,
          url: sub.assignment!.html_url,
        }));
    } catch {
      return [];
    }
  });

  const results = (await Promise.all(unsubmittedPromises)).flat();

  // Sort by due date (most recent first)
  results.sort((a, b) => {
    if (!a.due_at || !b.due_at) return 0;
    return new Date(b.due_at).getTime() - new Date(a.due_at).getTime();
  });

  return results;
}
